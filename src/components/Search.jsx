// src/components/SearchBar.jsx
import { useState } from 'react'

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-black"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5} 
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const Search = () => {
  return (
    <div className="relative w-full">
      <div className="absolute top-1 left-1 h-full w-full rounded-2xl bg-[#F87171]"></div>

      <div className="relative flex h-full w-full items-center rounded-2xl border-2 border-black bg-white px-4 py-3">
        <div className="mr-4">
          <SearchIcon />
        </div>

        <input
          type="text"
          placeholder="搜尋你喜歡的穿搭"
          className="w-full bg-transparent text-xl font-medium text-black placeholder-black focus:outline-none"
        />
      </div>
    </div>
  );
};

export default Search;