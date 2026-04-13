import { prisma } from "@/lib/prisma";

export async function getEmployeeRecord(userId: string) {
  return prisma.employee.findUnique({
    where: { userId },
    include: { user: true },
  });
}
