import "dotenv/config";
import { buildWelcomeAccessGrantedEmail } from "../lib/email/welcome-access-granted";

async function main() {
  const preview = buildWelcomeAccessGrantedEmail({
    personalEmail: "anmol@gmail.com",
    staffDisplayName: "Anmol",
    companyName: "Ironwatch",
    companySlug: "ironwatch",
    role: "MAIN_ADMIN",
    generatedUsername: "admin@anmol-ironwatch.com",
    temporaryPassword: "Security123!",
  });
  console.log("SUBJECT:", preview.subject);
  console.log("\n--- TEXT ---\n", preview.text);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
