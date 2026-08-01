import { prisma } from "@/lib/prisma";

export async function getEmployeeRecord(userId: string) {
  return prisma.employee.findFirst({
    where: { userId, deletedAt: null },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
}
