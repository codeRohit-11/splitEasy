# Project Information: SplitEasy 💸

Welcome to the **SplitEasy** developer documentation. This document serves as a comprehensive reference guide for the MERN-stack architecture, schemas, API contracts, and mathematical logic used in the project.

---

## 🔗 Project Files

*   **Requirements & Specs:** [problem statement.md](file:///C:/Users/Rohit/Desktop/splitEasy/problem%20statement.md)
*   **Root Configuration:** [package.json](file:///C:/Users/Rohit/Desktop/splitEasy/package.json)
*   **Main Documentation:** [README.md](file:///C:/Users/Rohit/Desktop/splitEasy/README.md)

---

## 🛠️ Architecture & Technology Stack

The application is built on a standard **MERN** stack (MongoDB, Express, React, Node.js) with a focus on simplicity and low-friction:

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) + Tailwind CSS | UI components, reactive state management using standard Context API and hooks. |
| **Backend** | Node.js + Express.js | JSON REST API with endpoint routing and input validation. |
| **Database** | MongoDB + Mongoose | Data store. Single-group context modeled via `members` and `expenses` collections. |
| **HTTP Client** | Axios | Frontend service layer for communicating with the backend. |

---

## 📊 Database Schema Design

SplitEasy assumes **one implicit group**. There are two core MongoDB collections:

### 1. `Member` Schema
Represents a group member.
*   `name`: String (Required, trimmed, 1-50 chars).
*   `createdAt`: Date (Defaults to current time).

### 2. `Expense` Schema
Represents a logged expense split among members.
*   `description`: String (Required, trimmed, max 100 chars).
*   `amount`: Number (Required, minimum `0.01`).
*   `paidBy`: ObjectId (References `Member`).
*   `splitType`: String (`EQUAL` or `CUSTOM`, defaults to `EQUAL`).
*   `splits`: Array of splits:
    *   `member`: ObjectId (References `Member`).
    *   `shareAmount`: Number (Required, minimum `0`).
*   `createdAt`: Date (Defaults to current time).

---

## 📐 Mathematical Logic

### 1. Net Balance Calculation
For any member $M$, the net balance is calculated as:
$$\text{netBalance}(M) = \text{totalPaidByM} - \text{totalOwedByM}$$

*   **$\text{totalPaidByM}$**: Sum of `amount` across all expenses where `expense.paidBy === M`.
*   **$\text{totalOwedByM}$**: Sum of `shareAmount` in `splits` entries where `splits[i].member === M`.

*Interpretation:*
*   $\text{netBalance} > 0$: The group owes $M$ this amount (displayed in green).
*   $\text{netBalance} < 0$: $M$ owes the group this amount (displayed in red).
*   $\text{netBalance} = 0$: $M$ is fully settled.

*Invariant:* The sum of all net balances across all members **must equal 0**.

### 2. Settle-Up (Greedy Debt Simplification)
An optional greedy matching algorithm to minimize transactions:
1.  Divide members into **Creditors** ($\text{netBalance} > 0$) and **Debtors** ($\text{netBalance} < 0$).
2.  Sort both groups descending by absolute balance.
3.  Match the largest debtor with the largest creditor.
4.  Compute transfer amount: $\min(|\text{debtor\_balance}|, \text{creditor\_balance})$.
5.  Update balances and repeat until all balances are zero.

---

## 📡 API Contract

### Members Endpoints
*   `GET /api/members` — List all members.
*   `POST /api/members` — Add a new member.
*   `DELETE /api/members/:id` — Delete a member (only if they have no associated expenses).

### Expenses Endpoints
*   `GET /api/expenses` — Retrieve all logged expenses (populated with member info).
*   `POST /api/expenses` — Create a new expense. Supports both `EQUAL` and `CUSTOM` splits.
*   `DELETE /api/expenses/:id` — Delete an expense.

### Balances Endpoints
*   `GET /api/balances` — Retrieve computed balances for all members.
*   `GET /api/balances/settlements` — Retrieve simplified transactions for settling up.
