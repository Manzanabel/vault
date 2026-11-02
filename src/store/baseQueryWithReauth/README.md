# Token refresh: `baseQueryWithReauth`

The access token expires after 2 minutes. When a request gets a 401, the client has to renew it with `POST /auth/refresh` and retry the request, without any component having to know about it.

`baseQueryWithReauth` ([baseQueryWithReauth.ts](baseQueryWithReauth.ts)) wraps `fetchBaseQuery` and handles this in one place for every `apiSlice` endpoint.

## Flow

1. Send the original request.
2. No 401: return the result as is.
3. 401:
   - if no refresh is in flight, start one and store its promise in `refreshPromise`;
   - either way, wait for that promise (`await refreshPromise`).
4. Refresh succeeded: retry the original request.
5. Refresh failed: the session is over, so `resetApiState()` clears the cache.

## Design decisions

### The refresh calls `baseQuery` directly, not an endpoint

A first version dispatched a `refresh` endpoint defined in `apiSlice`. That caused two problems:

- **Infinite recursion.** That endpoint's request also goes through `baseQueryWithReauth`. With an expired refresh token, `/auth/refresh` answers 401, so the wrapper tries to refresh again, and so on forever: 401 → refresh → 401 → refresh → … The `else` branch (log out) was never reached.
- **Cache entries.** Every refresh left a mutation entry in the store that nothing used.
The `baseQuery` the wrapper receives is the bare `fetchBaseQuery`: it sends the HTTP request and returns `{ data }` or `{ error }`, with no reauth logic and no store access. If the refresh returns 401, you just get `{ error }` and fall into the `else`.

### Single-flight: one refresh for concurrent requests

**Problem.** When a screen mounts, several requests go out together (`getFiles`, `me`, `stats`…). If the token has expired, they all get a 401 at almost the same time. A naive wrapper makes each one start its own refresh: 3 requests, 3 refreshes.

With this server it does no harm, because the refresh token isn't rotated. But a server that **rotates** refresh tokens with *reuse detection* invalidates the token on every use. If it receives a token that was already used, it treats it as possible theft and revokes every session. The second and third refresh would then log the user out for no reason.

**Solution.** `refreshPromise` is a **module-level** variable, not a function-local one:

- It is created once, when the file is imported. Every call to the wrapper sees the same variable through the closure (like a `static` variable in C++).
- A variable declared inside the async function would be recreated on every call, and the calls couldn't see each other's.

Several callers can await the same promise: they all get the same result, and the operation runs only once. So:

| Request | On its 401 | What it does |
| --- | --- | --- |
| `getFiles` | `refreshPromise === null` | Starts the refresh, stores it, waits |
| `me` | a refresh is in flight | Waits for the same promise |
| `stats` | a refresh is in flight | Waits for the same promise |

Result: **1 refresh and 3 retries**.

### The two `if`s are nested, not combined

`if (!refreshPromise && status === 401)` is wrong. A request that gets a 401 while a refresh is in flight skips the whole block and returns its 401 to the component, even though the refresh is about to succeed.

Two levels are needed:

- **the outer `if`** (was there a 401?) applies to every request: they all wait and retry;
- **the inner `if`** (is a refresh already running?) only decides **who starts** the refresh.

### `refreshPromise` is reset to `null` in a chained `.finally`

If it is never reset, the variable keeps an already-settled promise forever. On the next 401 (2 minutes later) nobody would start a new refresh: every request would await the old promise and retry with an expired token.

The `.finally` is chained **to the refresh promise itself**, not to each caller. That way it:

- runs exactly once, as soon as the refresh settles;
- works the same whether the refresh succeeds or fails;
- doesn't depend on which waiting request wakes up first.

## Types

- **`AppBaseQuery`** is the exact signature of `fetchBaseQuery`: `BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, {}, FetchBaseQueryMeta>`. The wrapper takes one and returns one, so `createApi` can't tell them apart, and `args`, `api` and `extraOptions` are inferred without annotations.
- **`AppQueryResult`** (`QueryReturnValue<…>`) is what a resolved base query returns: a union of `{ data }` and `{ error }`. Because of that, `result.error.status` and `refreshResult.data` are type-checked.
- **`Promise.resolve(...)`** around the refresh call: `BaseQueryFn` is typed to return `MaybePromise<T>` (`T | PromiseLike<T>`), and `PromiseLike` has no `.finally`. `Promise.resolve` turns any of these into a real `Promise`, with no runtime cost when it already is one.

## Known limitations

- **`/auth/login` also goes through the wrapper.** A wrong password returns 401 and triggers a pointless refresh attempt before the error is returned.
- **A network error or 5xx on the refresh logs the user out.** The `else` doesn't distinguish a 401 (session really expired) from a transient failure (the server fails 5% of requests).
- **Circular import with `store.ts`.** The wrapper imports `apiSlice` to dispatch `resetApiState`, and `store.ts` imports the wrapper. It works because `apiSlice` is only read inside the function, at request time, when both modules are fully loaded. Reading it at module top level would fail.
