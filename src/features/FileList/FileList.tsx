import { useGetFilesQuery } from "../../store/store";
import type { FileItem } from "../../store/types";
import { formatBytes } from "../../utils/formatBytes";
import dayjs from "dayjs";

const headerCell =
  "table-cell border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500";
const bodyCell =
  "table-cell border-b border-slate-100 px-4 py-3 text-slate-600";

export default function FileList() {
  const { data: files, isLoading } = useGetFilesQuery();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="mb-6 text-2xl font-semibold text-slate-900">File List</h2>

      {!isLoading && (
        <div className="table w-full table-fixed border-separate border-spacing-0 rounded-xl bg-white text-sm shadow-sm ring-1 ring-slate-200">
          <div className="table-header-group">
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
            {files?.items.map((file: FileItem) => (
              <div
                className="table-row transition-colors hover:bg-slate-50 last:[&>div]:border-b-0 last:[&>div:first-child]:rounded-bl-xl last:[&>div:last-child]:rounded-br-xl"
                key={file.id}
              >
                <div
                  className={`${bodyCell} truncate font-medium text-slate-900`}
                >
                  {file.name}
                </div>
                <div className={`${bodyCell} text-right tabular-nums`}>
                  {formatBytes(file.size_bytes)}
                </div>
                <div className={bodyCell}>{file.type}</div>
                <div className={`${bodyCell} tabular-nums`}>
                  {dayjs(file.updated_at).format("YYYY-MM-DD HH:mm")}
                </div>
                <div className={`${bodyCell} text-right tabular-nums`}>
                  {file.version}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
