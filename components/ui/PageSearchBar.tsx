"use client";

import { Search } from "lucide-react";

type PageSearchBarProps = {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function PageSearchBar({ id, label, value, placeholder, onChange, onSubmit }: PageSearchBarProps) {
  return (
    <>
      <label className="label-field" htmlFor={id}>
        {label}
      </label>
      <form
        className="page-search mt-1.5"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <Search className="page-search-icon" aria-hidden strokeWidth={2} />
        <input
          id={id}
          type="text"
          className="page-search-input"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
        />
      </form>
    </>
  );
}
