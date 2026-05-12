/**
 * Wrapper around `next start` that prints LAN-accessible URLs so phones on the
 * same Wi-Fi can connect. Detects the first non-internal IPv4 address (skipping
 * link-local 169.254.x.x) and prefers private LAN ranges (192.168/10/172.16-31).
 */
import { spawn } from "node:child_process";
import os from "node:os";

const PORT = Number(process.env.PORT) || 3000;

function scoreAddress(address, name) {
  if (/^192\.168\./.test(address)) return 100;
  if (/^10\./.test(address)) return 90;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(address)) return 85;
  if (/^169\.254\./.test(address)) return 5;
  if (/(wi-?fi|wlan|wireless)/i.test(name)) return 80;
  return 50;
}

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        candidates.push({ address: iface.address, name, score: scoreAddress(iface.address, name) });
      }
    }
  }
  if (candidates.length === 0) return "localhost";
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].address;
}

const localIP = getLocalIP();
const isLinkLocal = /^169\.254\./.test(localIP);

console.log("");
console.log(`🚀 WorkLedger running at http://localhost:${PORT}`);
console.log(`📱 On your phone (same Wi-Fi): http://${localIP}:${PORT}`);
console.log(`   Admin login:    syalrakesh00@gmail.com / PayrollDemo2026!`);
console.log(`   Employee portal: http://${localIP}:${PORT}/employee-access`);
if (isLinkLocal) {
  console.log("");
  console.log(`⚠️  Detected a link-local address (${localIP}). Your Wi-Fi adapter`);
  console.log(`   didn't get a router-assigned IP. Reconnect to Wi-Fi or run`);
  console.log(`   \`ipconfig\` and look for a 192.168.x.x under Wireless LAN adapter Wi-Fi.`);
}
console.log("");
console.log(`💡 If your phone can't connect, run in an Admin PowerShell:`);
console.log(`   netsh advfirewall firewall add rule name="Node ${PORT}" protocol=TCP dir=in localport=${PORT} action=allow`);
console.log("");

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const child = spawn(
  process.execPath,
  [nextBin, "start", "-H", "0.0.0.0", "-p", String(PORT)],
  { stdio: "inherit", env: process.env }
);

child.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
