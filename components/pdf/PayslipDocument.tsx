import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1e293b",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#0f172a",
    paddingBottom: 12,
    marginBottom: 20,
  },
  company: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  sub: { fontSize: 9, color: "#64748b", marginTop: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { color: "#64748b", width: "40%" },
  value: { width: "55%", textAlign: "right" },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 16,
    marginBottom: 8,
    color: "#0f172a",
  },
  line: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  totalRow: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    flexDirection: "row",
    justifyContent: "space-between",
    fontFamily: "Helvetica-Bold",
  },
  footer: { marginTop: 32, fontSize: 8, color: "#94a3b8" },
});

export type PayslipPdfProps = {
  companyName: string;
  payslipNumber: string;
  employeeName: string;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  regularHours: number;
  overtimeHours: number;
  hourlyRate: number;
  overtimeRate: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  approvalDate: string | null;
  adminSignoff: string | null;
  items: { label: string; amount: number; type: string }[];
};

export function PayslipDocument(p: PayslipPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.company}>{p.companyName}</Text>
          <Text style={styles.sub}>Earnings statement</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Payslip number</Text>
          <Text style={styles.value}>{p.payslipNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Employee</Text>
          <Text style={styles.value}>{p.employeeName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Employee ID</Text>
          <Text style={styles.value}>{p.employeeId}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Pay period</Text>
          <Text style={styles.value}>
            {p.periodStart} — {p.periodEnd}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Hours & rates</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Regular hours</Text>
          <Text style={styles.value}>{p.regularHours.toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Overtime hours</Text>
          <Text style={styles.value}>{p.overtimeHours.toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Hourly rate</Text>
          <Text style={styles.value}>${p.hourlyRate.toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Overtime rate</Text>
          <Text style={styles.value}>${p.overtimeRate.toFixed(2)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Pay breakdown</Text>
        {p.items.map((it, i) => (
          <View key={i} style={styles.line}>
            <Text>
              {it.label} {it.type === "DEDUCTION" ? "(deduction)" : ""}
            </Text>
            <Text>${it.amount.toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text>Gross pay</Text>
          <Text>${p.grossPay.toFixed(2)}</Text>
        </View>
        <View style={styles.line}>
          <Text>Total deductions</Text>
          <Text>- ${p.totalDeductions.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text>Net pay</Text>
          <Text>${p.netPay.toFixed(2)}</Text>
        </View>

        <View style={{ marginTop: 24 }}>
          <View style={styles.row}>
            <Text style={styles.label}>Approval date</Text>
            <Text style={styles.value}>{p.approvalDate ?? "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Authorized by</Text>
            <Text style={styles.value}>{p.adminSignoff ?? "—"}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Generated electronically. This document is valid without signature unless local law requires
          otherwise.
        </Text>
      </Page>
    </Document>
  );
}
