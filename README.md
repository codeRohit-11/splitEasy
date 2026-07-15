# SplitEasy 💸

SplitEasy is a zero-friction, single-group shared-expense splitter. It requires no authentication, no user accounts, and no setup — simply add members, log expenses, and see who owes whom.

---

## 📄 Project Documentation

*   **Problem Statement:** [problem statement.md](file:///C:/Users/Rohit/Desktop/splitEasy/problem%20statement.md) (Original Specifications)
*   **Developer Guide:** [project information.md](file:///C:/Users/Rohit/Desktop/splitEasy/project%20information.md) (Architecture, Schemas, & Math)
*   **Root Configuration:** [package.json](file:///C:/Users/Rohit/Desktop/splitEasy/package.json)

---

## 🚀 Project Summary

### The Problem
When sharing expenses with a group of friends, roommates, or on trips, existing tools often require tedious user registration, email invitations, group creation steps, and complex setups. This creates friction and delays settling up.

### The Solution
**SplitEasy** resolves this by introducing a lightweight MERN application that assumes **one implicit group context**. Users can immediately add member names, record expenses with equal or custom splits, and view real-time balances and transaction settlement recommendations without any login.

---

## 📁 Repository Folder Structure

Below is the directory layout of the current commit:

```text
splitEasy/
├── client/                     # React Frontend (Vite + Tailwind CSS)
│   ├── public/                 # Static assets
│   ├── src/                    # Frontend source code
│   │   ├── assets/             # Assets and images
│   │   ├── App.css             # Main stylesheet
│   │   ├── App.jsx             # React root component
│   │   ├── index.css           # CSS entrypoint with Tailwind directives
│   │   └── main.jsx            # Entry point script
│   ├── .oxlintrc.json          # Oxlint linter settings
│   ├── index.html              # Frontend page template
│   ├── package.json            # Frontend scripts and dependencies
│   ├── package-lock.json       # Frontend package lock file
│   └── vite.config.js          # Vite configuration
│
├── server/                     # Express Backend REST API
│   ├── package.json            # Backend scripts and dependencies
│   └── package-lock.json       # Backend package lock file
│
├── .gitignore                  # Git ignore rules (covers client, server, and root)
├── package.json                # Root package.json (delegates commands to client/server)
├── problem statement.md        # Original problem specifications & requirements
└── project information.md      # Detailed developer guide & math specifications
```

---

## 🏃 Getting Started

We have configured a root-level [package.json](file:///C:/Users/Rohit/Desktop/splitEasy/package.json) to make running scripts simple without changing directories:

1.  **Install dependencies for both Client & Server**:
    ```bash
    npm run install:all
    ```
2.  **Start Frontend React Client (Dev Mode)**:
    ```bash
    npm run dev:client
    ```
3.  **Start Backend Express Server (Dev Mode)**:
    ```bash
    npm run dev:server
    ```
