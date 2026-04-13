/**
 * Exposes localhost to the internet via HTTPS (localtunnel).
 * Run in a second terminal while `npm run dev` is running.
 */
import localtunnel from "localtunnel";

const port = Number(process.env.PORT) || 3000;

try {
  const tunnel = await localtunnel({ port });

  console.log("");
  console.log("  ─────────────────────────────────────────────");
  console.log("  Public URL (share this):");
  console.log("");
  console.log("   ", tunnel.url);
  console.log("");
  console.log("  ─────────────────────────────────────────────");
  console.log("  Keep `npm run dev` running on this machine.");
  console.log("  First visit may show a loca.lt reminder — click Continue.");
  console.log("  Press Ctrl+C here to stop the tunnel only.");
  console.log("");

  tunnel.on("close", () => {
    console.log("Tunnel closed.");
    process.exit(0);
  });
} catch (e) {
  console.error("Could not start tunnel:", e.message ?? e);
  console.error("Is the app running on port", port, "? Try: npm run dev");
  process.exit(1);
}
