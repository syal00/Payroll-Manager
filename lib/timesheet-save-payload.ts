import { z } from "zod";

/**
 * Single row from employee/public timesheet save & submit.
 * location/notes tolerate empty strings, wrong types, and omission without failing validation.
 */
export const timesheetEntryRowSchema = z.object({
  workDate: z.string(),
  regularHours: z.coerce.number().min(0),
  overtimeHours: z.coerce.number().min(0),
  leaveHours: z.coerce.number().min(0),
  location: z.preprocess((raw) => {
    if (raw === undefined || raw === null) return undefined;
    if (typeof raw !== "string") return undefined;
    const t = raw.trim();
    if (t.length === 0) return undefined;
    return t.slice(0, 200);
  }, z.string().max(200).optional()),
  notes: z.preprocess((raw) => {
    if (raw === undefined) return undefined;
    if (raw === null) return null;
    if (typeof raw !== "string") return null;
    const t = raw.trim();
    return t.length === 0 ? null : t;
  }, z.string().nullable().optional()),
});

export const timesheetSaveRequestSchema = z.object({
  notes: z.preprocess((raw) => {
    if (raw === undefined) return undefined;
    if (raw === null) return null;
    if (typeof raw !== "string") return null;
    const t = raw.trim();
    return t.length === 0 ? null : t;
  }, z.string().nullable().optional()),
  entries: z.array(timesheetEntryRowSchema).min(1),
});

export type TimesheetSaveRequest = z.infer<typeof timesheetSaveRequestSchema>;
