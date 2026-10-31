# Vault UI

A web console for managing encrypted files: browse, search, filter, inspect, rename and share them.

This repository contains the **frontend only**. It consumes a separate, production-like REST API that deliberately behaves like a real backend: cursor pagination, short-lived sessions with refresh, random latency, server errors, rate limiting and concurrent modifications.

## Stack

- [Vite](https://vite.dev) + [React](https://react.dev) + TypeScript
- [Redux Toolkit](https://redux-toolkit.js.org) and [RTK Query](https://redux-toolkit.js.org/rtk-query/overview) for state and server data
- [React Router](https://reactrouter.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com)

## Getting started

### Prerequisites

- Node.js 22+
- The Vault API running locally (default: `http://localhost:3001`). See the API repository for setup instructions and test credentials.

### Install and run

```bash
npm install
cp .env.example .env
npm run dev
```

The app runs on `http://localhost:5173`.

### Environment variables

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_URL` | Base URL of the Vault API | `http://localhost:3001/api` |

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (no type-checking) |
| `npm run build` | Type-check with `tsc -b`, then build for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint the codebase |
| `npm test` | Run the test suite |

## Design decisions

- **Server state vs client state.** Data owned by the server (files, current user) lives in the RTK Query cache. Redux slices are reserved for state the client owns.
- **Filters live in the URL.** Search, filters and sorting are query parameters, so they survive a reload and can be shared.
- **Session security.** Tokens are stored in `httpOnly` cookies set by the API and are never readable from JavaScript. Requests are sent with `credentials: 'include'`; expired sessions are refreshed transparently.
- **Built for unreliable networks.** Every request has explicit loading and error states, and the UI handles latency, failures and rate limiting (429).

## Roadmap

### v1

- [ ] Sign in, stay signed in (token refresh), sign out
- [ ] File list with 10,000+ files and smooth scrolling
- [ ] Search by name
- [ ] Loading, error and retry states

### v2

- [ ] File details and sharing list
- [ ] Rename with optimistic update and conflict handling (409)

### Later

- [ ] Filters and sorting
- [ ] Share and unshare files
- [ ] Storage statistics and report export
- [ ] Offline handling