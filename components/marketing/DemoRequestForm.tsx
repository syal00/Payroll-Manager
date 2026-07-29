"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

const TEAM = ["1-10", "11-50", "51-200", "200+"] as const;

export function DemoRequestForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [teamSize, setTeamSize] = useState<(typeof TEAM)[number]>("1-10");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, teamSize }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not submit");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mkt-alert mkt-alert--success">
        Thanks for your request. Our team will review it and get back to you within 24 hours.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mkt-form">
      {error ? <div className="mkt-alert mkt-alert--error">{error}</div> : null}
      <div>
        <label htmlFor="demo-name">Full name</label>
        <input
          id="demo-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
        />
      </div>
      <div>
        <label htmlFor="demo-email">Work email</label>
        <input
          id="demo-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={100}
        />
      </div>
      <div>
        <label htmlFor="demo-company">Company name</label>
        <input
          id="demo-company"
          required
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          maxLength={100}
        />
      </div>
      <div>
        <label htmlFor="demo-team">Team size</label>
        <select
          id="demo-team"
          value={teamSize}
          onChange={(e) => setTeamSize(e.target.value as (typeof TEAM)[number])}
        >
          {TEAM.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Button type="submit" disabled={loading}>
          {loading ? "Sending…" : "Submit demo request"}
        </Button>
      </div>
    </form>
  );
}
