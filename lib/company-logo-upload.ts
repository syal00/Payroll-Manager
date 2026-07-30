import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  ALLOWED_LOGO_EXTENSIONS,
  ALLOWED_LOGO_MIME_TYPES,
  MAX_LOGO_UPLOAD_BYTES,
  UPLOADED_LOGO_PATH_PREFIX,
} from "@/lib/company-logo-url";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "logos");

export async function saveCompanyLogoUpload(file: File): Promise<{ logoUrl: string }> {
  if (!ALLOWED_LOGO_MIME_TYPES.has(file.type)) {
    throw new Error("Logo must be PNG, JPEG, WebP, or SVG.");
  }
  if (file.size > MAX_LOGO_UPLOAD_BYTES) {
    throw new Error("Logo file must be 2 MB or smaller.");
  }
  if (file.size === 0) {
    throw new Error("Logo file is empty.");
  }

  const ext = ALLOWED_LOGO_EXTENSIONS[file.type] ?? ".bin";
  const filename = `${randomUUID()}${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);

  return { logoUrl: `${UPLOADED_LOGO_PATH_PREFIX}${filename}` };
}
