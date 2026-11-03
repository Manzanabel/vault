import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from "@reduxjs/toolkit/query";
import { apiSlice } from "../store";

// Same signature as fetchBaseQuery, so the wrapper is a drop-in replacement.
type AppBaseQuery = BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  {},
  FetchBaseQueryMeta
>;

type AppQueryResult = QueryReturnValue<
  unknown,
  FetchBaseQueryError,
  FetchBaseQueryMeta
>;

// Shared across all calls: at most one refresh in flight. See README.md.
let refreshPromise: Promise<AppQueryResult> | null = null;

export const baseQueryWithReauth =
  (baseQuery: AppBaseQuery): AppBaseQuery =>
  async (args, api, extraOptions) => {
    try {
      let result = await baseQuery(args, api, extraOptions);

      if (result.error && result.error.status === 401) {
        // First 401 starts the refresh; the others reuse it.
        if (!refreshPromise) {
          // Raw baseQuery, not an endpoint: avoids recursion and cache entries.
          // Promise.resolve: baseQuery may return a PromiseLike, which has no .finally.
          refreshPromise = Promise.resolve(
            baseQuery(
              { url: "/auth/refresh", method: "POST" },
              api,
              extraOptions,
            ),
          ).finally(() => {
            refreshPromise = null;
          });
        }

        const refreshResult = await refreshPromise;

        if (refreshResult.data) {
          result = await baseQuery(args, api, extraOptions);
        } else {
          api.dispatch(apiSlice.util.resetApiState());
        }
      }

      return result;
    } catch (error) {
      console.error("Error in baseQueryWithReauth:", error);
      throw error;
    }
  };
