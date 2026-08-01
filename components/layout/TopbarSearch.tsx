"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type SearchResponse = {
  employees: { id: string; name: string; employeeCode: string; contactEmail: string; href: string }[];
  timesheets: {
    id: string;
    status: string;
    employeeName: string;
    periodLabel: string;
    href: string;
  }[];
  payslips: {
    id: string;
    employeeName: string;
    employeeCode: string;
    periodLabel: string;
    href: string;
  }[];
};

export function TopbarSearch() {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [searchedTerm, setSearchedTerm] = useState("");

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  async function runSearch(term: string) {
    const trimmed = term.trim();
    if (trimmed.length < 2) {
      setError("Type at least 2 characters.");
      setResults(null);
      setOpen(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Search failed");
        setResults(null);
        setOpen(true);
        return;
      }
      setResults(data as SearchResponse);
      setSearchedTerm(trimmed);
      setOpen(true);
    } catch {
      setError("Network error");
      setResults(null);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void runSearch(q);
  }

  function onResultClick(href: string) {
    setOpen(false);
    setQ("");
    setResults(null);
    router.push(href);
  }

  const totalHits =
    (results?.employees.length ?? 0) +
    (results?.timesheets.length ?? 0) +
    (results?.payslips.length ?? 0);

  return (
    <div ref={rootRef} className="topbar-search-wrap">
      <form className="topbar-search" role="search" onSubmit={onSubmit}>
        <Search className="topbar-search-icon" aria-hidden strokeWidth={2} />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => {
            if (results || error) setOpen(true);
          }}
          placeholder="Search payroll, employees…"
          aria-label="Search payroll and employees"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          autoComplete="off"
        />
      </form>

      {open ? (
        <div id={listboxId} className="topbar-search-panel" role="listbox" aria-label="Search results">
          {loading ? (
            <p className="topbar-search-panel-empty">Searching…</p>
          ) : error ? (
            <p className="topbar-search-panel-empty">{error}</p>
          ) : results && totalHits === 0 ? (
            <p className="topbar-search-panel-empty">No results for &ldquo;{searchedTerm}&rdquo;.</p>
          ) : results ? (
            <div className="topbar-search-panel-sections">
              {results.employees.length > 0 ? (
                <section>
                  <p className="topbar-search-panel-heading">Employees</p>
                  <ul>
                    {results.employees.map((item) => (
                      <li key={item.id}>
                        <button type="button" className="topbar-search-hit" onClick={() => onResultClick(item.href)}>
                          <span className="topbar-search-hit-label">{item.name}</span>
                          <span className="topbar-search-hit-meta">
                            {item.employeeCode} · {item.contactEmail}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {results.timesheets.length > 0 ? (
                <section>
                  <p className="topbar-search-panel-heading">Timesheets</p>
                  <ul>
                    {results.timesheets.map((item) => (
                      <li key={item.id}>
                        <button type="button" className="topbar-search-hit" onClick={() => onResultClick(item.href)}>
                          <span className="topbar-search-hit-label">{item.employeeName}</span>
                          <span className="topbar-search-hit-meta">
                            {item.periodLabel} · {item.status}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {results.payslips.length > 0 ? (
                <section>
                  <p className="topbar-search-panel-heading">Payslips</p>
                  <ul>
                    {results.payslips.map((item) => (
                      <li key={item.id}>
                        <button type="button" className="topbar-search-hit" onClick={() => onResultClick(item.href)}>
                          <span className="topbar-search-hit-label">{item.employeeName}</span>
                          <span className="topbar-search-hit-meta">
                            {item.employeeCode} · {item.periodLabel}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              <div className="topbar-search-panel-footer">
                <Link href={`/admin/employees?q=${encodeURIComponent(q.trim())}`} className="topbar-search-more-link">
                  View all employees matching &ldquo;{q.trim()}&rdquo;
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
