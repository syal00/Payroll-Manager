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
      { label: "Employee portal", href: "/employee-access", testId: "employee-portal" },
      { label: "Employee registration", href: "/employee-access/register", testId: "employee-register" },
      { label: "Admin sign in", href: "/login", testId: "admin-sign-in" },
      { label: "Super admin", href: "/login", testId: "super-admin" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about", testId: "about" },
      { label: "Owner", href: "/owner", testId: "owner" },
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
    q: "Who can use PayRun?",
    a: "PayRun has three roles within each company: main admins (full company control), managers (review and approve employee timesheets), and employees (self-service portal for hours and payslips). Platform operators may also use a separate super-admin console for multi-company oversight — tenants never see that layer.",
  },
  {
    q: "How do employees submit timesheets?",
    a: "Employees sign in through the employee portal, open the current pay period, and enter regular, overtime, and leave hours. Submissions stay pending until a manager or admin approves them.",
  },
  {
    q: "Can employees view their payslips?",
    a: "Yes. Once payroll generates a payslip from approved hours, employees can view it in their dashboard and download a PDF copy. Admins can also mark payslips as sent and record when a copy was emailed.",
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
    desc: "Three roles per company — main admin, manager, and employee — each with the right portal and permissions. Admins run the company; managers approve timesheets; employees submit hours and view payslips.",
  },
  {
    title: "Timesheet tracking",
    desc: "Employees submit regular, overtime, and leave hours per pay period. Managers review submissions in one queue.",
  },
  {
    title: "Payslips & PDFs",
    desc: "Generate payslips from approved timesheets with earnings and deductions, export PDFs, mark them as sent, and track when a copy was emailed to the employee.",
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
    desc: "Route timesheets from pending to under review to approved — or rejected with a comment. Every decision is recorded in the audit trail with who signed off.",
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
    desc: "Main admins and managers check submissions, move them through review, approve or reject with comments, then payroll runs on approved hours only.",
  },
  {
    title: "Generate and distribute payslips",
    desc: "Create payslips from approved timesheets, export PDFs, mark as sent, and track email delivery — employees download copies from their dashboard.",
  },
] as const;
