import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays } from "date-fns";
import { nextEmployeeCode, normalizeEmployeeEmail } from "../lib/employee-code";
import { DEMO_ADMIN_PASSWORD } from "../lib/demo-credentials";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.payslipItem.deleteMany();
  await prisma.payslip.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.timesheetEntry.deleteMany();
  await prisma.timesheet.deleteMany();
  await prisma.payPeriod.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();

  /** Primary demo admins — upsert preserves behavior of the legacy `add-admins` helper if seed order changes. */
  const adminPwHash = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 12);
  const primaryAdmins = [
    { name: "Anmol Singh", email: "anmolchahal871@gmail.com" },
    { name: "Rakesh Syal", email: "syalrakesh00@gmail.com" },
  ] as const;
  const admin = await prisma.user.upsert({
    where: { email: primaryAdmins[0]!.email },
    create: {
      email: primaryAdmins[0]!.email,
      passwordHash: adminPwHash,
      name: primaryAdmins[0]!.name,
      role: "ADMIN",
    },
    update: { passwordHash: adminPwHash, name: primaryAdmins[0]!.name, role: "ADMIN" },
  });
  await prisma.user.upsert({
    where: { email: primaryAdmins[1]!.email },
    create: {
      email: primaryAdmins[1]!.email,
      passwordHash: adminPwHash,
      name: primaryAdmins[1]!.name,
      role: "ADMIN",
    },
    update: { passwordHash: adminPwHash, name: primaryAdmins[1]!.name, role: "ADMIN" },
  });

  const empSeed = [
    { email: "alex.morgan@nexusops.com", name: "Alex Morgan", rate: 42.5 },
    { email: "sam.rivera@nexusops.com", name: "Sam Rivera", rate: 38.0 },
    { email: "taylor.chen@nexusops.com", name: "Taylor Chen", rate: 55.0 },
  ];
  const empUsers: {
    user: { id: string };
    employee: { id: string; hourlyRate: number; overtimeRate: number };
  }[] = [];
  for (const u of empSeed) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash: await bcrypt.hash("Employee123!", 12),
        name: u.name,
        role: "EMPLOYEE",
      },
    });
    const ot = Math.round(u.rate * 1.5 * 100) / 100;
    const employeeCode = await nextEmployeeCode();
    const employee = await prisma.employee.create({
      data: {
        employeeCode,
        name: u.name,
        email: normalizeEmployeeEmail(u.email),
        userId: user.id,
        hourlyRate: u.rate,
        overtimeRate: ot,
        department: "Operations",
        jobTitle: "Specialist",
      },
    });
    empUsers.push({ user, employee });
  }

  const now = new Date();
  const p1Start = addDays(now, -28);
  const p1End = addDays(p1Start, 13);
  const p2Start = addDays(p1End, 1);
  const p2End = addDays(p2Start, 13);

  const closedPeriod = await prisma.payPeriod.create({
    data: {
      name: `Period ending ${p1End.toISOString().slice(0, 10)}`,
      startDate: p1Start,
      endDate: p1End,
      status: "CLOSED",
      isCurrent: false,
    },
  });

  const openPeriod = await prisma.payPeriod.create({
    data: {
      name: `Period ending ${p2End.toISOString().slice(0, 10)}`,
      startDate: p2Start,
      endDate: p2End,
      status: "OPEN",
      isCurrent: true,
    },
  });

  const alex = empUsers[0]!;

  const approvedSheet = await prisma.timesheet.create({
    data: {
      employeeId: alex.employee.id,
      payPeriodId: closedPeriod.id,
      status: "APPROVED",
      notes: "Standard bi-weekly submission",
      totalRegular: 80,
      totalOvertime: 4,
      totalLeave: 0,
      totalHours: 84,
      submittedAt: addDays(p1End, -2),
    },
  });

  for (let i = 0; i < 14; i++) {
    const d = addDays(closedPeriod.startDate, i);
    await prisma.timesheetEntry.create({
      data: {
        timesheetId: approvedSheet.id,
        workDate: d,
        regularHours: i % 7 < 5 ? 8 : 0,
        overtimeHours: i === 10 ? 4 : 0,
        leaveHours: 0,
      },
    });
  }

  const lastApproval = await prisma.approval.create({
    data: {
      timesheetId: approvedSheet.id,
      adminId: admin.id,
      previousStatus: "VERIFIED",
      newStatus: "APPROVED",
      comment: "Hours align with schedule. Approved for payroll.",
    },
  });

  await prisma.payslip.create({
    data: {
      payslipNumber: `PSL-2026-${closedPeriod.id.slice(-6).toUpperCase()}-001`,
      timesheetId: approvedSheet.id,
      employeeId: alex.employee.id,
      payPeriodId: closedPeriod.id,
      hourlyRate: alex.employee.hourlyRate,
      overtimeRate: alex.employee.overtimeRate,
      regularHours: 80,
      overtimeHours: 4,
      grossPay: 80 * alex.employee.hourlyRate + 4 * alex.employee.overtimeRate,
      totalDeductions: 520.45,
      netPay: 80 * alex.employee.hourlyRate + 4 * alex.employee.overtimeRate - 520.45,
      approvalDate: lastApproval.createdAt,
      adminSignoff: admin.name,
      markedSentAt: new Date(),
      items: {
        create: [
          {
            label: "Regular earnings",
            amount: 80 * alex.employee.hourlyRate,
            type: "EARNING",
          },
          {
            label: "Overtime earnings",
            amount: 4 * alex.employee.overtimeRate,
            type: "EARNING",
          },
          { label: "Tax withholding", amount: 380.0, type: "DEDUCTION" },
          { label: "Benefits", amount: 140.45, type: "DEDUCTION" },
        ],
      },
    },
  });

  const pendingSheet = await prisma.timesheet.create({
    data: {
      employeeId: empUsers[1]!.employee.id,
      payPeriodId: openPeriod.id,
      status: "PENDING",
      totalRegular: 72,
      totalOvertime: 0,
      totalLeave: 8,
      totalHours: 80,
      submittedAt: new Date(),
      notes: "Used PTO Mon-Tue",
    },
  });

  for (let i = 0; i < 14; i++) {
    const d = addDays(openPeriod.startDate, i);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    await prisma.timesheetEntry.create({
      data: {
        timesheetId: pendingSheet.id,
        workDate: d,
        regularHours: weekend ? 0 : i < 2 ? 0 : 8,
        overtimeHours: 0,
        leaveHours: weekend ? 0 : i < 2 ? 8 : 0,
      },
    });
  }

  await prisma.notification.create({
    data: {
      userId: empUsers[1]!.user.id,
      type: "TIMESHEET_SUBMITTED",
      title: "Timesheet received",
      body: "Your hours for the current pay period were submitted and are awaiting review.",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "SEED_DATABASE",
      entityType: "SYSTEM",
      details: JSON.stringify({ message: "Demo data loaded" }),
    },
  });

  console.log("Seed complete.");
  console.log("Admins (same password for demo):");
  console.log(`  Anmol Singh — anmolchahal871@gmail.com / ${DEMO_ADMIN_PASSWORD}`);
  console.log(`  Rakesh Syal — syalrakesh00@gmail.com / ${DEMO_ADMIN_PASSWORD}`);
  console.log("Demo employees: register or use employee access with the same emails (optional legacy User login still works).");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
