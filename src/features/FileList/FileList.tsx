import { useRef, useMemo, useEffect } from "react";
import {
  apiSlice,
  useGetFilesInfiniteQuery,
  useGetWsTicketMutation,
} from "../../store/store";
import useVirtualList from "./useVirtualList";
import FileListHeader from "./FileListHeader";
import FileListRow from "./FileListRow";
import { isFileRenamedEvent } from "./fileListEvents";
import { useAppDispatch } from "../../store/hooks";

const pageClass =
  "mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 py-8";
const titleClass = "mb-6 text-2xl font-semibold text-slate-900";
const scrollContainerClass =
  "min-h-0 flex-1 overflow-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200";
const tableClass =
  "table w-full table-fixed border-separate border-spacing-0 text-sm";

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

  const dispatch = useAppDispatch();

  const parentRef = useRef<HTMLDivElement>(null);

  const wsRef = useRef<WebSocket | null>(null);

  const [getTicket] = useGetWsTicketMutation();

  useEffect(() => {
    const initWebSocket = async (url: string) => {
      if (url) {
        const socket = new WebSocket(url);
        wsRef.current = socket;

        socket.onopen = () => {
          console.log("WebSocket connection established");
        };

        socket.onmessage = (event) => {
          console.log("Message received:", event.data);
          let parsedEvent: unknown;
          try {
            parsedEvent = JSON.parse(event.data);
          } catch (error) {
            console.error("Invalid WebSocket message:", error);
            return;
          }

          if (!isFileRenamedEvent(parsedEvent)) return;

          dispatch(
            apiSlice.util.updateQueryData("getFiles", undefined, (draft) => {
              for (const page of draft.pages) {
                const file = page.items.find(
                  (f) => f.id === parsedEvent.payload.id,
                );
                if (file) {
                  file.name = parsedEvent.payload.name;
                  break;
                }
              }
            }),
          );
        };

        socket.onerror = (err) => {
          console.error("WebSocket error:", err);
        };
      }
    };

    const ticketReq = getTicket();

    ticketReq
      .unwrap()
      .then((res) => {
        initWebSocket(res.url);
      })
      .catch((err) => {
        console.error("Error fetching WebSocket ticket:", err);
      });

    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, "component unmounted");
      } else {
        ticketReq.abort();
      }
    };
  }, [getTicket, dispatch]);

  const onEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  const { virtualRows, paddingTop, paddingBottom } = useVirtualList({
    count: items.length,
    onEndReached,
    parentRef,
  });

  return (
    <div className={pageClass}>
      <h2 className={titleClass}>File List</h2>

      {!isLoading && (
        <div ref={parentRef} className={scrollContainerClass}>
          <div className={tableClass}>
            <FileListHeader />
            <div className="table-row-group">
              {paddingTop > 0 && (
                <div className="table-row">
                  <div className="table-cell" style={{ height: paddingTop }} />
                </div>
              )}
              {virtualRows.map((virtualItem) => {
                const file = items[virtualItem.index];
                return <FileListRow key={file.id} file={file} />;
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
