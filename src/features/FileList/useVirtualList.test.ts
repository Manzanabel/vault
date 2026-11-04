// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useVirtualList from "./useVirtualList";

// jsdom does no layout, so every element has a height of 0 and the
// virtualizer would think nothing is visible. We fake a 500px container.
function createScrollContainer(height: number) {
  const element = document.createElement("div");
  Object.defineProperty(element, "clientHeight", { value: height });
  return { current: element };
}

describe("useVirtualList", () => {
  it("only returns the rows that fit in the container, not all of them", () => {
    const { result } = renderHook(() =>
      useVirtualList({
        count: 10_000,
        onEndReached: vi.fn(),
        parentRef: createScrollContainer(500),
      }),
    );

    expect(result.current.virtualRows.length).toBeGreaterThan(0);
    expect(result.current.virtualRows.length).toBeLessThan(50);
  });

  it("fills the space of the hidden rows with paddingBottom", () => {
    const { result } = renderHook(() =>
      useVirtualList({
        count: 10_000,
        onEndReached: vi.fn(),
        parentRef: createScrollContainer(500),
      }),
    );

    const rows = result.current.virtualRows;
    const lastRenderedRow = rows[rows.length - 1];

    expect(result.current.paddingTop).toBe(0);
    expect(result.current.paddingBottom).toBe(
      10_000 * 50 - lastRenderedRow.end,
    );
  });

  it("does not call onEndReached when the end is far away", () => {
    const onEndReached = vi.fn();

    renderHook(() =>
      useVirtualList({
        count: 10_000,
        onEndReached,
        parentRef: createScrollContainer(500),
      }),
    );

    expect(onEndReached).not.toHaveBeenCalled();
  });

  it("calls onEndReached when the last rows are visible", () => {
    const onEndReached = vi.fn();

    renderHook(() =>
      useVirtualList({
        count: 20,
        onEndReached,
        parentRef: createScrollContainer(500),
      }),
    );

    expect(onEndReached).toHaveBeenCalled();
  });
});
