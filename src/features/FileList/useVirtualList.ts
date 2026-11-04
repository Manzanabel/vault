import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect } from "react";

interface UseVirtualListProps {
  count: number;
  onEndReached: () => void;
  parentRef: React.RefObject<HTMLDivElement | null>;
}

export default function useVirtualList({
  count,
  onEndReached,
  parentRef,
}: UseVirtualListProps) {
  // oxlint-disable-next-line react/incompatible-library -- no React Compiler in this project; virtualizer is not passed to memoized children
  const virtualizer = useVirtualizer({
    count: count,
    getScrollElement: () => parentRef && parentRef.current,
    estimateSize: () => 50,
    useFlushSync: false,
  });

  const virtualRows = virtualizer.getVirtualItems();

  // Height of the spacer rows rendered above and below the visible rows
  const [paddingTop, paddingBottom] =
    virtualRows.length > 0
      ? [
          virtualRows[0].start,
          virtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end,
        ]
      : [0, 0];

  useEffect(() => {
    const lastItem = virtualRows[virtualRows.length - 1];
    if (lastItem && lastItem.index >= count - 25) {
      onEndReached();
    }
  }, [count, virtualRows, onEndReached]);
  return {
    virtualRows,
    paddingTop,
    paddingBottom,
  };
}
