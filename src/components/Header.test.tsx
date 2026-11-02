// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiSlice, store } from "../store/store";
import Header from "./Header";

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const selectMe = apiSlice.endpoints.me.select();

describe("Header", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    store.dispatch(apiSlice.util.resetApiState());
  });

  it("clears the cached user and goes to /login on logout", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        jsonResponse({ id: "1", email: "ana@vault.test", name: "Ana" }, 200),
      );

    await store.dispatch(apiSlice.endpoints.me.initiate());
    expect(selectMe(store.getState()).data?.name).toBe("Ana");

    const router = createMemoryRouter(
      [
        { path: "/file-list", element: <Header /> },
        { path: "/login", element: <div>Login page</div> },
      ],
      { initialEntries: ["/file-list"] },
    );

    render(
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>,
    );

    fetchSpy.mockResolvedValue(new Response(null, { status: 204 }));
    await userEvent.click(
      screen.getByRole("button", { name: "Cerrar sesión" }),
    );

    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    expect(selectMe(store.getState()).data).toBeUndefined();
  });
});
