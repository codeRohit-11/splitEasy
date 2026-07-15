SplitEasy 💸

> A zero-friction, single-group shared-expense splitter. No auth, no accounts, no friction — just add members, log expenses, and see who owes whom.

---

# RAW Requirements

*No login needed — assume a single group. Let the user add member names (e.g., Aman, Ria, Karan).
*Add an expense with: description, amount, who paid, and which members share it (splitting equally or by custom amount).
*Store members and expenses in MongoDB via an Express API.
*Build a React front end (Tailwind CSS is welcome) to add an expense and view the expense list.
\*Show each member's net balance — how much they are owed or owe overall.

## 1. Project Overview

**SplitEasy** is a lightweight MERN-stack application designed to solve the "who owes what" problem for a single shared group (e.g., roommates, a trip, a small team) without the overhead of authentication or multi-tenancy.

The application assumes **one implicit group context** — there is no login, no user accounts, and no multi-group support in the MVP. Members are added by name only. Expenses are logged against those members with configurable splits, and the system computes each member's **net balance** in real time.

This document is the **Source of Truth** for the project. It is written to be unambiguous enough that any developer — human or AI agent — can pick up the spec and implement it without needing clarification on schema shape, API contract, or component responsibilities.

**Design Philosophy:** Ship a working, honest subset of features over a broken "complete" one. Every commit must leave the app in a runnable state.

---

## 2. Tech Stack

| Layer                | Technology                   | Notes                                         |
| -------------------- | ---------------------------- | --------------------------------------------- |
| **Frontend**         | React (Vite) + Tailwind CSS  | Functional components, hooks-only             |
| **Backend**          | Node.js + Express.js         | RESTful JSON API                              |
| **Database**         | MongoDB + Mongoose           | Single collection pair: `members`, `expenses` |
| **HTTP Client**      | Axios (or native `fetch`)    | Centralized API service layer on frontend     |
| **State Management** | React Context + `useReducer` | No Redux — overkill for this scope            |
| **Dev Tooling**      | Nodemon, dotenv, ESLint      | Standard MERN local dev setup                 |

---

## 3. Database Schema (MongoDB / Mongoose)

### 3.1 Relationship Model

There are exactly two collections. `Expense` references `Member` documents via `ObjectId` for both the **payer** and each **participant in the split**. There is no separate "Group" collection in the MVP — the entire `members` collection _is_ the group.

```
Member (1) ──────< paidBy >────── (M) Expense
Member (M) ──────< splits.member >────── (M) Expense
```

### 3.2 `Member` Schema

```json
{
  "_id": "ObjectId",
  "name": {
    "type": "String",
    "required": true,
    "trim": true,
    "minlength": 1,
    "maxlength": 50
  },
  "createdAt": {
    "type": "Date",
    "default": "Date.now"
  }
}
```

### 3.3 `Expense` Schema

```json
{
  "_id": "ObjectId",
  "description": {
    "type": "String",
    "required": true,
    "trim": true,
    "maxlength": 100
  },
  "amount": {
    "type": "Number",
    "required": true,
    "min": 0.01
  },
  "paidBy": {
    "type": "ObjectId",
    "ref": "Member",
    "required": true
  },
  "splitType": {
    "type": "String",
    "enum": ["EQUAL", "CUSTOM"],
    "default": "EQUAL"
  },
  "splits": [
    {
      "member": {
        "type": "ObjectId",
        "ref": "Member",
        "required": true
      },
      "shareAmount": {
        "type": "Number",
        "required": true,
        "min": 0
      }
    }
  ],
  "createdAt": {
    "type": "Date",
    "default": "Date.now"
  }
}
```

### 3.4 How "Split" Data Drives Balance Calculation

- `splits[]` is the **only** source of truth for who owes what on a given expense — it is always fully materialized on write (never computed lazily on read).
- For `splitType: "EQUAL"`, the backend computes `shareAmount = amount / splits.length` at creation time (rounded to 2 decimals, with remainder cents assigned to the first participant to avoid floating-point drift).
- For `splitType: "CUSTOM"`, the client sends explicit `shareAmount` per member; the backend **validates** that `sum(splits[].shareAmount) === amount` (within a `0.01` epsilon) before persisting.
- **Net Balance** for any member is derived by aggregating across _all_ expenses — see [Section 7](#7-mathematical-logic).

---

## 4. API Contract (RESTful)

Base URL: `/api`

### 4.1 Members

| Method   | Endpoint           | Request Body          | Success Response (`2xx`)                                                                         |
| -------- | ------------------ | --------------------- | ------------------------------------------------------------------------------------------------ |
| `GET`    | `/api/members`     | —                     | `200` → `[{ "_id", "name", "createdAt" }, ...]`                                                  |
| `POST`   | `/api/members`     | `{ "name": "Alice" }` | `201` → `{ "_id", "name", "createdAt" }`                                                         |
| `DELETE` | `/api/members/:id` | —                     | `200` → `{ "message": "Member removed" }` _(only if member has no linked expenses — else `409`)_ |

### 4.2 Expenses

| Method   | Endpoint            | Request Body | Success Response (`2xx`)                                                                                                                                             |
| -------- | ------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/expenses`     | —            | `200` → `[{ "_id", "description", "amount", "paidBy": {..member}, "splitType", "splits": [{ "member": {..member}, "shareAmount" }], "createdAt" }, ...]` (populated) |
| `POST`   | `/api/expenses`     | See below    | `201` → created expense object (populated)                                                                                                                           |
| `DELETE` | `/api/expenses/:id` | —            | `200` → `{ "message": "Expense deleted" }`                                                                                                                           |

**`POST /api/expenses` — Equal Split Request:**

```json
{
  "description": "Dinner at Taj",
  "amount": 1200,
  "paidBy": "664f1b2e...",
  "splitType": "EQUAL",
  "participantIds": ["664f1b2e...", "664f1c9a...", "664f1d11..."]
}
```

**`POST /api/expenses` — Custom Split Request:**

```json
{
  "description": "Groceries",
  "amount": 900,
  "paidBy": "664f1b2e...",
  "splitType": "CUSTOM",
  "splits": [
    { "member": "664f1b2e...", "shareAmount": 500 },
    { "member": "664f1c9a...", "shareAmount": 400 }
  ]
}
```

### 4.3 Balances (Computed / Read-Only)

| Method | Endpoint                    | Request Body | Success Response (`2xx`)                                                                             |
| ------ | --------------------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/balances`             | —            | `200` → `[{ "memberId", "name", "netBalance" }, ...]`                                                |
| `GET`  | `/api/balances/settlements` | —            | `200` → `[{ "from": "Bob", "to": "Alice", "amount": 250 }, ...]` _(stretch goal — greedy settle-up)_ |

### 4.4 Standard Error Response Shape

```json
{
  "success": false,
  "error": "Human-readable message",
  "field": "amount"
}
```

| Status | Meaning                                                                  |
| ------ | ------------------------------------------------------------------------ |
| `400`  | Validation failure (missing field, bad type, splits don't sum to amount) |
| `404`  | Referenced Member/Expense not found                                      |
| `409`  | Conflict (e.g., deleting a member referenced in an expense)              |
| `500`  | Unhandled server/database error                                          |

---

## 5. Frontend Architecture

### 5.1 Component Tree

```
App
└── GroupProvider (Context: members, expenses, balances, dispatch)
    └── Dashboard
        ├── MemberManager
        │   ├── MemberList
        │   └── AddMemberForm
        ├── ExpenseForm
        │   ├── SplitTypeToggle        (EQUAL | CUSTOM)
        │   └── CustomSplitEditor      (rendered only if splitType === CUSTOM)
        ├── ExpenseList
        │   └── ExpenseListItem        (× N)
        ├── BalanceList
        │   └── BalanceListItem        (× N — color-coded: green = owed, red = owes)
        └── SettleUpView               (stretch — reads /api/balances/settlements)
```

### 5.2 State Management Strategy

- **Global state** (`members`, `expenses`, derived `balances`) lives in a single `GroupContext` created via `createContext` + `useReducer`, provided once at the `App` root.
- **Actions**: `SET_MEMBERS`, `ADD_MEMBER`, `REMOVE_MEMBER`, `SET_EXPENSES`, `ADD_EXPENSE`, `REMOVE_EXPENSE`.
- All network calls live in a single `src/services/api.js` module (Axios instance, base URL from `.env` → `VITE_API_URL`). Components never call `fetch`/`axios` directly — they dispatch async thunMaría-style action creators that call `api.js` then `dispatch()` the result.
- **`balances` are recomputed client-side** from `expenses` + `members` on every state change via a memoized selector (`useMemo`), mirroring the backend's `/api/balances` logic — this keeps the UI reactive without a network round-trip after every mutation, while `/api/balances` remains the authoritative source on page load/refresh.
- Local/ephemeral UI state (form inputs, toggles) stays in component-local `useState` — never lifted into global context.

### 5.3 Styling

Tailwind utility classes only, no custom CSS files. Balance indicators use a consistent semantic convention: `text-emerald-600` (is owed money), `text-rose-600` (owes money), `text-slate-500` (settled/zero).

---

## 6. Development Roadmap & Commit Strategy

**Total timebox: 3 hours.** Each phase ends in a working, committable state. Commits follow **Conventional Commits**: `type(scope): description`.

| Phase                   | Time      | Deliverable                                                                                                   | Commit Message(s)                                                                                                                                                   |
| ----------------------- | --------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0. Scaffold**         | 0:00–0:15 | Repo init, folder structure (`/client`, `/server`), `.env.example`, base Express server, Vite React app boots | `chore(repo): initialize MERN project structure`<br>`chore(server): bootstrap express app with health check route`                                                  |
| **1. Data Layer**       | 0:15–0:45 | Mongoose connection, `Member` & `Expense` models, DB connects successfully                                    | `feat(db): connect mongoose to MongoDB Atlas`<br>`feat(models): add Member and Expense schemas`                                                                     |
| **2. Core API**         | 0:45–1:30 | `members` and `expenses` CRUD routes + controllers, basic validation                                          | `feat(api): implement member CRUD endpoints`<br>`feat(api): implement expense creation with equal split logic`<br>`feat(api): add input validation middleware`      |
| **3. Balance Engine**   | 1:30–2:00 | `/api/balances` computed endpoint, tested against sample data                                                 | `feat(api): implement net balance calculation endpoint`<br>`test(api): verify balance math with seed data`                                                          |
| **4. Frontend Core**    | 2:00–2:40 | `GroupContext`, `MemberManager`, `ExpenseForm`, `BalanceList` wired to live API                               | `feat(client): scaffold GroupContext and api service layer`<br>`feat(client): build member management UI`<br>`feat(client): build expense form and balance display` |
| **5. Polish / Stretch** | 2:40–3:00 | Error handling, loading states, and — _time permitting_ — Settle Up view or custom splits                     | `feat(client): add error/loading states`<br>`feat(api): add settle-up greedy algorithm` _(only if time remains)_                                                    |

**Hard rule:** if Phase 5 cannot be completed, stop and commit whatever Phase 4 state is stable. A working equal-split app with live balances is a successful outcome; an unfinished custom-split/settle-up feature is not required for success.

---

## 7. Mathematical Logic

### 7.1 Net Balance Formula

For any member `M`, the **Net Balance** is:

```
netBalance(M) = totalPaidByM − totalOwedByM
```

Where:

- `totalPaidByM` = sum of `amount` across all expenses where `expense.paidBy === M`
- `totalOwedByM` = sum of `shareAmount` across all `splits[]` entries (across all expenses) where `splits[i].member === M`

**Interpretation:**

- `netBalance > 0` → the group collectively **owes M** this amount.
- `netBalance < 0` → **M owes** the group this amount.
- `netBalance === 0` → M is settled.

**Invariant:** `Σ netBalance(M)` across all members **must equal 0** (money is neither created nor destroyed) — this is the primary sanity check/unit test for the balance engine.

### 7.2 Pseudocode

```js
function computeBalances(members, expenses) {
  const balance = new Map(members.map((m) => [m._id, 0]));

  for (const exp of expenses) {
    balance.set(exp.paidBy, balance.get(exp.paidBy) + exp.amount);
    for (const split of exp.splits) {
      balance.set(split.member, balance.get(split.member) - split.shareAmount);
    }
  }

  return members.map((m) => ({
    memberId: m._id,
    name: m.name,
    netBalance: round2(balance.get(m._id)),
  }));
}
```

### 7.3 Settle-Up Algorithm (Stretch Goal)

A minimal **greedy debt-simplification** approach: sort members into creditors (`netBalance > 0`) and debtors (`netBalance < 0`), then repeatedly match the largest debtor against the largest creditor, transferring `min(|debt|, credit)` and settling whichever side reaches zero first. Repeat until all balances are zero. This minimizes the number of transactions but is **not** guaranteed to reproduce original transaction pairs — it optimizes for "fewest payments to settle the group," not historical accuracy.
