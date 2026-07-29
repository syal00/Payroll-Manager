export type FooterLink = {
  label: string;
  href: string;
  testId: string;
};

export type FooterSection = {
  title: string;
  links: FooterLink[];
};

export const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features", testId: "features" },
      { label: "How it works", href: "/how-it-works", testId: "how-it-works" },
      { label: "Employee portal", href: "/employee-portal", testId: "employee-portal" },
      { label: "Admin sign in", href: "/admin-access", testId: "admin-sign-in" },
      { label: "Super admin", href: "/super-admin-access", testId: "super-admin" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about", testId: "about" },
      { label: "Contact", href: "/contact", testId: "contact" },
      { label: "Demo requests", href: "/demo-request", testId: "demo-requests" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "FAQ", href: "/faq", testId: "faq" },
      { label: "Documentation", href: "/documentation", testId: "documentation" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy", testId: "privacy" },
      { label: "Terms", href: "/terms", testId: "terms" },
    ],
  },
];

export const MARKETING_FAQS = [
  {
    q: "Who can use WorkLedger?",
    a: "Admins manage the company, managers review their team's timesheets, supervisors assist with approvals, and employees submit hours and view payslips. A super admin role is also available for multi-company oversight.",
  },
  {
    q: "How do employees submit timesheets?",
    a: "Employees sign in through the employee portal, open the current pay period, and enter regular, overtime, and leave hours. Submissions stay pending until a manager or admin approves them.",
  },
  {
    q: "Can employees view their payslips?",
    a: "Yes. Once payroll generates a payslip from approved hours, employees can view it in their dashboard and download a PDF copy.",
  },
  {
    q: "How do pay periods work?",
    a: "Admins open and close pay periods (for example, bi-weekly cycles). Timesheets and payslips are tied to the active period so nothing gets mixed between runs.",
  },
  {
    q: "Is there an audit trail?",
    a: "Yes. Approvals, payslip generation, and other admin actions are recorded in the audit log so you can see who did what and when.",
  },
  {
    q: "How do I get access?",
    a: "Request a demo through the demo request page, or sign in if your company already has an account. Admins can invite managers and approve employee registrations.",
  },
] as const;

export const MARKETING_FEATURES = [
  {
    title: "Role-based access",
    desc: "Separate portals for admins, managers, supervisors, and employees — each person sees only what they need.",
  },
  {
    title: "Timesheet tracking",
    desc: "Employees submit regular, overtime, and leave hours per pay period. Managers review submissions in one queue.",
  },
  {
    title: "Payslips & PDFs",
    desc: "Generate payslips from approved timesheets with earnings and deductions, then download or share as PDF.",
  },
  {
    title: "Pay periods",
    desc: "Open and close bi-weekly or custom pay cycles. Track which timesheets and payslips belong to each period.",
  },
  {
    title: "Employee roster",
    desc: "Register employees, assign managers, set hourly rates, and approve new hires before they can submit hours.",
  },
  {
    title: "Approval workflow",
    desc: "Route timesheets from pending to under review to approved, with comments and a record of who signed off.",
  },
  {
    title: "Audit log",
    desc: "Every approval, payslip generation, and admin action is logged so you can trace changes when questions come up.",
  },
] as const;

export const MARKETING_STEPS = [
  {
    title: "Employees submit hours",
    desc: "Staff log regular, overtime, and leave hours for the current pay period through the employee portal.",
  },
  {
    title: "Managers review and approve",
    desc: "Admins and managers check submissions, move them through review, and approve hours before payroll runs.",
  },
  {
    title: "Generate and distribute payslips",
    desc: "Create payslips from approved timesheets, then employees download PDF copies from their dashboard.",
  },
] as const;
