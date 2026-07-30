export { EMAIL_CREATOR_NAME, EMAIL_SUPPORT_CONTACT } from "@/lib/email/constants";
export { appendEmailFooter, renderEmailFooterHtml, renderEmailFooterText } from "@/lib/email/footer";
export { staffRoleLabel } from "@/lib/email/role-labels";
export { escapeHtml } from "@/lib/email/utils";
export {
  buildCompanySignInUrl,
  buildWelcomeAccessGrantedEmail,
  sendWelcomeAccessGrantedEmail,
  sendStaffWelcomeEmail,
} from "@/lib/email/welcome-access-granted";
export { buildPayslipReadyEmail } from "@/lib/email/payslip-ready";
export { buildEmployeeOtpEmail } from "@/lib/email/employee-otp";
