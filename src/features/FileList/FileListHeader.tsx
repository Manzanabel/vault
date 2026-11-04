import { memo } from "react";

const headerClass = "table-header-group sticky top-0 z-10";
const cellClass =
  "table-cell border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500";
const nameCellClass = `${cellClass} w-2/5 rounded-tl-xl`;
const rightCellClass = `${cellClass} text-right`;
const lastCellClass = `${cellClass} rounded-tr-xl text-right`;

function FileListHeader() {
  return (
    <div className={headerClass}>
      <div className="table-row">
        <div className={nameCellClass}>File name</div>
        <div className={rightCellClass}>Size</div>
        <div className={cellClass}>Type</div>
        <div className={cellClass}>Last Modified</div>
        <div className={lastCellClass}>Version</div>
      </div>
    </div>
  );
}

export default memo(FileListHeader);
