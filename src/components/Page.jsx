import React from "react";
import PropTypes from "prop-types";
import {
  ChevronDoubleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleRightIcon,   
} from '@heroicons/react/24/solid';

export default function Page({
  page,
  totalPages,
  gotoPage,
  pageSize,
  setPageSize,
  total
}) {
  const btnClasses = "p-2 rounded-md border bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
  return (
    <div className="fixed bottom-0 left-[200px] right-0 z-10 bg-white/80 backdrop-blur-md border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="text-sm text-slate-600">
            共 <span className="font-semibold">{total}</span> 筆資料
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-600 hidden md:block">顯示</div>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); gotoPage(1); }}
              className="form-select-custom w-24 text-sm"
            >
              <option value={12}>12 筆</option>
              <option value={24}>24 筆</option>
              <option value={50}>50 筆</option>
            </select>
            <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>
            <button onClick={() => gotoPage(1)} disabled={page === 1} className={btnClasses}>
              <ChevronDoubleLeftIcon className="w-4 h-4" />
            </button>
            <button onClick={() => gotoPage(page - 1)} disabled={page === 1} className={btnClasses}>
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span className="px-3 py-1.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-md">
              第 {page} / {totalPages} 頁
            </span>
            <button onClick={() => gotoPage(page + 1)} disabled={page === totalPages} className={btnClasses}>
              <ChevronRightIcon className="w-4 h-4" />
            </button>
            <button onClick={() => gotoPage(totalPages)} disabled={page === totalPages} className={btnClasses}>
              <ChevronDoubleRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Page.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  gotoPage: PropTypes.func.isRequired,
  pageSize: PropTypes.number.isRequired,
  setPageSize: PropTypes.func.isRequired,
  total: PropTypes.number.isRequired
};
