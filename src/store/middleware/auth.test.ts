import { afterEach, describe, expect, it, vi } from "vitest";
import { apiSlice, store } from "../store";
import { authMiddleware } from "./auth";

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("authMiddleware", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    store.dispatch(apiSlice.util.resetApiState());
  });

  it("lets the navigation through when the session is valid", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ id: "1", email: "ana@vault.test", name: "Ana" }, 200),
    );

    await expect(authMiddleware()).resolves.toBeUndefined();
  });

  it("redirects to /login when there is no session", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ error: "UNAUTHENTICATED" }, 401),
    );

    const thrown = await authMiddleware().catch((e: unknown) => e);

    expect(thrown).toBeInstanceOf(Response);
    expect((thrown as Response).status).toBe(302);
    expect((thrown as Response).headers.get("Location")).toBe("/login");
  });
});
