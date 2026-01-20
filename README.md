# Osmosis Backend & Frontend

This is the monolithic repository for the Osmosis application, containing both the Node.js/Express backend and the React frontend.

## Prerequisites

- Node.js v20.9.0 or higher
- npm
- MongoDB instance (local or Atlas)

## Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    cd frontend && npm install && cd ..
    ```

2.  **Environment Variables:**
    Create a `.env` file in the root directory with the following variables:
    ```env
    NODE_ENV=development
    PORT=8126
    MONGOOSE_CONNECTION_STRING=mongodb://...
    ACCESS_TOKEN_SECRET=...
    REFRESH_TOKEN_SECRET=...
    STRIPE_WEBHOOK_SECRET=...
    STRIPE_LIVE_KEY=...
    STRIPE_TEST_KEY=...
    STRIPE_PUBLISHABLE_LIVE_KEY=...
    # Add other required keys as needed
    ```

## Running the Application

### Development Mode
To run the server in development mode (with hot reloading for Node):
```bash
npm run dev
```

To run the client (React):
```bash
cd frontend
npm start
```
The client will run on `http://localhost:3000` and proxy requests to `http://localhost:8126`.

### Production
To build the frontend and serve it via the backend:
```bash
npm run build
npm start
```

## Testing & Quality

- **Linting:** `npm run lint` (Checks for code quality issues)
- **Formatting:** `npm run format` (Prettifies code)
- **Smoke Tests:** `npm test` (Checks if server and client are reachable)

## Architecture Overview

- **Server:** Node.js + Express + Mongoose.
  - Entry point: `index.js`
  - Routes: `middleware/` and `controllers/` (Refactor in progress)
  - Models: `models/`
- **Client:** React (v17) + Material UI + Tailwind CSS.
  - Located in `frontend/`

## Current Status
- **Refactoring:** The codebase is currently undergoing a modernization and refactoring process.
- **Health:** Basic smoke tests are in place.
