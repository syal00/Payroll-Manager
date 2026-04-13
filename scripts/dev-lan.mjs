/**
 * Starts Next.js bound to all interfaces (0.0.0.0) and prints Local + LAN URLs.
 * Hot reload works on phones/tablets when allowedDevOrigins is set in next.config.ts.
 */
import { spawn } from "node:child_process";
import os from "node:os";

const port = process.env.PORT || "3000";

function isLanIPv4(family) {
  return family === "IPv4" || family === 4;
}

function getLanIPv4Addresses() {
  const nets = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net && isLanIPv4(net.family) && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return [...new Set(addresses)];
}

function printBanner() {
  const ips = getLanIPv4Addresses();
  const cyan = "\x1b[36m";
  const dim = "\x1b[2m";
  const bold = "\x1b[1m";
  const reset = "\x1b[0m";

  console.log("");
  console.log(`${bold}  Payroll app — LAN development${reset}`);
  console.log("");
  console.log(`  ${bold}Local:${reset}   http://localhost:${port}`);
  if (ips.length === 0) {
    console.log(`  ${bold}Network:${reset} ${dim}(no non-internal IPv4 found — check Wi‑Fi / VPN)${reset}`);
  } else {
    for (const ip of ips) {
      console.log(`  ${bold}Network:${reset} http://${ip}:${port}`);
    }
  }
  console.log("");
  console.log(`  ${dim}Open the Network URL on your iPad or phone (same Wi‑Fi).${reset}`);
  console.log(
    `  ${dim}If it does not load, allow Node.js through the firewall (Private networks).${reset}`
  );
  console.log("");
  console.log(`  ${dim}Optional tunnel (e.g. different network):${reset}`);
  console.log(`  ${dim}  npx ngrok http ${port}${reset}`);
  console.log(`  ${dim}Localhost only (no LAN): npm run dev:local${reset}`);
  console.log("");
}

printBanner();

const child = spawn("npx", ["next", "dev", "--hostname", "0.0.0.0", "--port", port], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, PORT: port },
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
