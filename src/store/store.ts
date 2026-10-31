import { configureStore } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { FilesResponse, MeResponse } from "./types";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    auth: builder.mutation<MeResponse, { email: string; password: string }>({
      query: ({ email, password }) => ({
        url: "/auth/login",
        method: "POST",
        body: { email, password },
      }),
    }),
    me: builder.query<MeResponse, void>({
      query: () => "/auth/me",
    }),
    getFiles: builder.query<FilesResponse | unknown, void>({
      query: () => "/files",
    }),
  }),
});

export const { useGetFilesQuery } = apiSlice;
export const { useAuthMutation } = apiSlice;
export const { useMeQuery } = apiSlice;

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});
