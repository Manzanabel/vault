import { useRef, useMemo, useEffect } from "react";
import { useVirtualizer, type VirtualItem } from "@tanstack/react-virtual";
import { useGetFilesInfiniteQuery } from "../../store/store";
import { formatBytes } from "../../utils/formatBytes";
import dayjs from "dayjs";
import type { FileItem } from "../../store/types";

const headerCell =
  "table-cell border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500";
const bodyCell =
  "table-cell border-b border-slate-100 px-4 py-3 text-slate-600";

export default function FileList() {
  const {
    data: files,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetFilesInfiniteQuery(undefined);

  // Flatten pages into one row array for the virtualizer. RTK Query keeps `files`
  // referentially stable until a new page arrives, so this only reruns on page load.
  const items = useMemo(
    () => files?.pages.flatMap((page) => page.items) ?? [],
    [files],
  );

  const parentRef = useRef<HTMLDivElement>(null);

  // oxlint-disable-next-line react/incompatible-library -- no React Compiler in this project; virtualizer is not passed to memoized children
  const virtualizer = useVirtualizer({
    count: items?.length,
    getScrollElement: () => parentRef.current,
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
    if (
      lastItem &&
      lastItem.index >= items.length - 25 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    virtualRows,
    items.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 py-8">
      <h2 className="mb-6 text-2xl font-semibold text-slate-900">File List</h2>

      {!isLoading && (
        <div
          ref={parentRef}
          className="min-h-0 flex-1 overflow-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200"
        >
          <div className="table w-full table-fixed border-separate border-spacing-0 text-sm">
            <div className="table-header-group sticky top-0 z-10">
              <div className="table-row">
                <div className={`${headerCell} w-2/5 rounded-tl-xl`}>
                  File name
                </div>
                <div className={`${headerCell} text-right`}>Size</div>
                <div className={headerCell}>Type</div>
                <div className={headerCell}>Last Modified</div>
                <div className={`${headerCell} rounded-tr-xl text-right`}>
                  Version
                </div>
              </div>
            </div>
            <div className="table-row-group">
              {paddingTop > 0 && (
                <div className="table-row">
                  <div className="table-cell" style={{ height: paddingTop }} />
                </div>
              )}
              {virtualRows.map((virtualItem: VirtualItem) => {
                const row: FileItem | undefined = items[virtualItem.index];
                return (
                  <div
                    className="table-row transition-colors hover:bg-slate-50 last:[&>div]:border-b-0 last:[&>div:first-child]:rounded-bl-xl last:[&>div:last-child]:rounded-br-xl"
                    key={row?.id}
                  >
                    <div
                      className={`${bodyCell} truncate font-medium text-slate-900`}
                    >
                      {row?.name}
                    </div>
                    <div className={`${bodyCell} text-right tabular-nums`}>
                      {row?.size_bytes ? formatBytes(row?.size_bytes) : "N/A"}
                    </div>
                    <div className={bodyCell}>{row?.type}</div>
                    <div className={`${bodyCell} tabular-nums`}>
                      {dayjs(row?.updated_at).format("YYYY-MM-DD HH:mm")}
                    </div>
                    <div className={`${bodyCell} text-right tabular-nums`}>
                      {row?.version}
                    </div>
                  </div>
                );
              })}
              {paddingBottom > 0 && (
                <div className="table-row">
                  <div
                    className="table-cell"
                    style={{ height: paddingBottom }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
