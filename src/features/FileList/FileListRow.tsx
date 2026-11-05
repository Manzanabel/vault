import dayjs from "dayjs";
import type { FileItem } from "../../store/types";
import { formatBytes } from "../../utils/formatBytes";
import { useEffect, useRef, useState } from "react";

const rowClass =
  "table-row transition-colors hover:bg-slate-50 last:[&>div]:border-b-0 last:[&>div:first-child]:rounded-bl-xl last:[&>div:last-child]:rounded-br-xl";
const cellClass =
  "table-cell border-b border-slate-100 px-4 py-3 text-slate-600";
const nameCellClass = `${cellClass} truncate font-medium text-slate-900`;
const numberCellClass = `${cellClass} text-right tabular-nums`;
const dateCellClass = `${cellClass} tabular-nums`;

interface FileListRowProps {
  file: FileItem;
}

export default function FileListRow({ file }: FileListRowProps) {
  const [blink, setBlink] = useState(false);

  const fileName = useRef(file.name);

  useEffect(() => {
    if (fileName.current !== file.name) {
      setBlink(true);
      fileName.current = file.name;
      const timer = setTimeout(() => setBlink(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [file.name]);

  const rowClassWithBlink = blink ? `${rowClass} bg-yellow-100` : rowClass;

  return (
    <div className={rowClassWithBlink}>
      <div className={nameCellClass}>{file.name}</div>
      <div className={numberCellClass}>{formatBytes(file.size_bytes)}</div>
      <div className={cellClass}>{file.type}</div>
      <div className={dateCellClass}>
        {dayjs(file.updated_at).format("YYYY-MM-DD HH:mm")}
      </div>
      <div className={numberCellClass}>{file.version}</div>
    </div>
  );
}
