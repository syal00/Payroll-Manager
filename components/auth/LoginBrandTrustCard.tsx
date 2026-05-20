"use client";

import { ShieldCheck, Timer, Wallet } from "lucide-react";

export function LoginBrandTrustCard() {
  return (
    <div className="login-trust-card" aria-label="Platform highlights">
      <p className="login-trust-card-eyebrow">This month</p>
      <div className="login-trust-stats">
        <div className="login-trust-stat">
          <span className="login-trust-stat-value">99.9%</span>
          <span className="login-trust-stat-label">Uptime</span>
        </div>
        <div className="login-trust-stat">
          <span className="login-trust-stat-value">2m</span>
          <span className="login-trust-stat-label">Avg run</span>
        </div>
        <div className="login-trust-stat">
          <span className="login-trust-stat-value">0</span>
          <span className="login-trust-stat-label">Calc errors</span>
        </div>
      </div>
      <ul className="login-trust-list">
        <li>
          <Timer className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          <span>Hours-to-paycheck in one workflow</span>
        </li>
        <li>
          <ShieldCheck className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          <span>Role-based access with audit trail</span>
        </li>
        <li>
          <Wallet className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          <span>Payslips from approved time, not guesswork</span>
        </li>
      </ul>
    </div>
  );
}
