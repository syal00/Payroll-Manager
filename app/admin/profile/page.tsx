"use client";

import { useEffect, useState } from "react";
import { UserCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function AdminProfilePage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((j) => {
        if (j.user) {
          setName(j.user.name);
          setPhone(j.user.phone ?? "");
          setEmail(j.user.email);
        }
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone: phone || null }),
    });
    const j = await res.json();
    if (!res.ok) setMsg(j.error ?? "Failed");
    else setMsg("Profile updated.");
  }

  return (
    <div className="page-container max-w-lg space-y-8">
      <div>
        <p className="page-eyebrow">Account</p>
        <h1 className="page-title mt-1 flex flex-wrap items-center gap-2">
          <span className="stat-icon shrink-0">
            <UserCircle className="h-5 w-5 text-violet-200" aria-hidden />
          </span>
          Your profile
        </h1>
        <p className="page-description">How you appear in the admin console and audit trail.</p>
      </div>

      <Card>
        <form onSubmit={save} className="space-y-5">
          <div>
            <label className="label-field" htmlFor="prof-email">
              Email
            </label>
            <input
              id="prof-email"
              disabled
              className="input-field mt-1.5 cursor-not-allowed opacity-60"
              value={email}
            />
            <p className="mt-1 text-xs text-slate-500">Email is managed by your administrator.</p>
          </div>
          <div>
            <label className="label-field" htmlFor="prof-name">
              Display name
            </label>
            <input
              id="prof-name"
              className="input-field mt-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="label-field" htmlFor="prof-phone">
              Phone
            </label>
            <input
              id="prof-phone"
              className="input-field mt-1.5"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
            />
          </div>
          {msg && (
            <p className={`text-sm font-medium ${msg.includes("Failed") ? "text-rose-700" : "text-emerald-700"}`}>
              {msg}
            </p>
          )}
          <Button type="submit">Save changes</Button>
        </form>
      </Card>
    </div>
  );
}
