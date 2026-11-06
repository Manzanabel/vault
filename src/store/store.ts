import {
  configureStore,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { FilesResponse, GetWsTicketResponse, MeResponse } from "./types";
import { baseQueryWithReauth } from "./baseQueryWithReauth/baseQueryWithReauth";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth(
    fetchBaseQuery({
      baseUrl: import.meta.env.VITE_API_URL,
      credentials: "include",
    }),
  ),
  endpoints: (builder) => ({
    me: builder.query<MeResponse, void>({
      query: () => "/auth/me",
      keepUnusedDataFor: Infinity, // Session-long data; cleared explicitly by resetApiState on logout.
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),
    getFiles: builder.infiniteQuery<
      FilesResponse,
      string | undefined,
      string | null
    >({
      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam: (res) => res.next_cursor ?? null,
      },
      query: ({ pageParam }) =>
        pageParam ? "/files?cursor=" + encodeURIComponent(pageParam) : "/files",
    }),
    getWsTicket: builder.mutation<GetWsTicketResponse, void>({
      query: () => ({
        url: "/realtime/ticket",
        method: "POST",
        credentials: "include",
      }),
    }),
  }),
});

const wsSlice = createSlice({
  name: "ws",
  initialState: {
    lastSeq: null as number | null,
  },
  reducers: {
    setLastSeq: (state, action: PayloadAction<number>) => {
      state.lastSeq = action.payload;
    },
  },
});

export const { useGetFilesInfiniteQuery } = apiSlice;
export const { useMeQuery } = apiSlice;
export const { useLogoutMutation } = apiSlice;
export const { useGetWsTicketMutation } = apiSlice;
export const { setLastSeq } = wsSlice.actions;

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    [wsSlice.reducerPath]: wsSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
