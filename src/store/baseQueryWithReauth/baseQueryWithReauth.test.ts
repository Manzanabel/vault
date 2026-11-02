import type {
  BaseQueryApi,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from "@reduxjs/toolkit/query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiSlice } from "../store";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

type Result = QueryReturnValue<unknown, FetchBaseQueryError, FetchBaseQueryMeta>;

const REFRESH_URL = "/auth/refresh";

const ok = (data: unknown): Result => ({ data });
const unauthorized = (): Result => ({
  error: { status: 401, data: { error: "UNAUTHENTICATED" } },
});

const urlOf = (args: string | FetchArgs) =>
  typeof args === "string" ? args : args.url;

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

const makeApi = () =>
  ({ dispatch: vi.fn() }) as unknown as BaseQueryApi & {
    dispatch: ReturnType<typeof vi.fn>;
  };

const callsTo = (baseQuery: ReturnType<typeof vi.fn>, url: string) =>
  baseQuery.mock.calls.filter(([args]) => urlOf(args) === url).length;

/**
 * Simulates the server: every request gets a 401 until a refresh succeeds,
 * then 200. `refresh` controls the outcome and timing of /auth/refresh.
 */
const makeServer = (refresh: () => Result | Promise<Result>) => {
  let tokenValid = false;
  const baseQuery = vi.fn(async (args: string | FetchArgs): Promise<Result> => {
    const url = urlOf(args);
    if (url === REFRESH_URL) {
      const result = await refresh();
      if (result.data) tokenValid = true;
      return result;
    }
    return tokenValid ? ok({ url }) : unauthorized();
  });
  const expireToken = () => {
    tokenValid = false;
  };
  return { baseQuery, expireToken };
};

describe("baseQueryWithReauth", () => {
  let api: ReturnType<typeof makeApi>;

  beforeEach(() => {
    api = makeApi();
  });

  it("returns non-401 results untouched without refreshing", async () => {
    const baseQuery = vi.fn(async () => ok("files"));

    const result = await baseQueryWithReauth(baseQuery)("/files", api, {});

    expect(result).toEqual({ data: "files" });
    expect(baseQuery).toHaveBeenCalledTimes(1);
    expect(api.dispatch).not.toHaveBeenCalled();
  });

  it("does not refresh on non-401 errors", async () => {
    const serverError: Result = { error: { status: 500, data: null } };
    const baseQuery = vi.fn(async () => serverError);

    const result = await baseQueryWithReauth(baseQuery)("/files", api, {});

    expect(result).toBe(serverError);
    expect(baseQuery).toHaveBeenCalledTimes(1);
  });

  it("refreshes and retries the original request after a 401", async () => {
    const { baseQuery } = makeServer(() => ok({ id: "1" }));

    const result = await baseQueryWithReauth(baseQuery)("/files", api, {});

    expect(result).toEqual({ data: { url: "/files" } });
    expect(baseQuery.mock.calls.map(([args]) => urlOf(args))).toEqual([
      "/files",
      REFRESH_URL,
      "/files",
    ]);
    expect(api.dispatch).not.toHaveBeenCalled();
  });

  it("resets the API state and returns the 401 when the refresh fails", async () => {
    const { baseQuery } = makeServer(unauthorized);

    const result = await baseQueryWithReauth(baseQuery)("/files", api, {});

    expect(result.error?.status).toBe(401);
    expect(callsTo(baseQuery, REFRESH_URL)).toBe(1);
    expect(callsTo(baseQuery, "/files")).toBe(1);
    expect(api.dispatch).toHaveBeenCalledWith(apiSlice.util.resetApiState());
  });

  it("sends a single refresh for concurrent 401s and retries every request", async () => {
    const refresh = deferred<Result>();
    const { baseQuery } = makeServer(() => refresh.promise);
    const query = baseQueryWithReauth(baseQuery);

    const pending = Promise.all([
      query("/files", api, {}),
      query("/auth/me", api, {}),
      query("/stats", api, {}),
    ]);

    await vi.waitFor(() => expect(callsTo(baseQuery, "/stats")).toBe(1));
    await vi.waitFor(() =>
      expect(callsTo(baseQuery, REFRESH_URL)).toBeGreaterThan(0),
    );
    refresh.resolve(ok({ id: "1" }));
    const results = await pending;

    expect(results.map((r) => r.data)).toEqual([
      { url: "/files" },
      { url: "/auth/me" },
      { url: "/stats" },
    ]);
    expect(callsTo(baseQuery, REFRESH_URL)).toBe(1);
  });

  it("starts a new refresh once the previous one has settled", async () => {
    const { baseQuery, expireToken } = makeServer(() => ok({ id: "1" }));
    const query = baseQueryWithReauth(baseQuery);

    await query("/files", api, {});
    expireToken();
    const result = await query("/files", api, {});

    expect(result).toEqual({ data: { url: "/files" } });
    expect(callsTo(baseQuery, REFRESH_URL)).toBe(2);
  });

  it("starts a new refresh after a failed one", async () => {
    const outcomes = [unauthorized(), ok({ id: "1" })];
    const { baseQuery } = makeServer(() => outcomes.shift()!);
    const query = baseQueryWithReauth(baseQuery);

    const first = await query("/files", api, {});
    const second = await query("/files", api, {});

    expect(first.error?.status).toBe(401);
    expect(second).toEqual({ data: { url: "/files" } });
    expect(callsTo(baseQuery, REFRESH_URL)).toBe(2);
  });
});
