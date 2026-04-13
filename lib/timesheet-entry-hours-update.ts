export type TimesheetEntryHoursPatch = {
  regularHours: number;
  overtimeHours: number;
  leaveHours: number;
  location: string | null;
  notes: string | null;
};

type TxExecuteRaw = {
  $executeRaw: (parts: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;
};

/**
 * Persists hours, location, and notes without `timesheetEntry.update()`.
 * After adding `location` to the schema, a failed `prisma generate` (e.g. Windows EPERM
 * while Next.js holds the query engine) leaves a stale client that rejects `location` in
 * `update()` — raw SQL still matches the real database columns.
 */
export async function updateTimesheetEntryHours(
  tx: TxExecuteRaw,
  rowId: string,
  ent: TimesheetEntryHoursPatch
): Promise<void> {
  await tx.$executeRaw`
    UPDATE "TimesheetEntry"
    SET
      "regularHours" = ${ent.regularHours},
      "overtimeHours" = ${ent.overtimeHours},
      "leaveHours" = ${ent.leaveHours},
      "location" = ${ent.location},
      "notes" = ${ent.notes}
    WHERE "id" = ${rowId}
  `;
}
