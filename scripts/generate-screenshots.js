#!/usr/bin/env node

/**
 * Automated screenshot generator for App Store submission
 * Generates screenshots at Apple-required dimensions for iPad 13" display
 *
 * Usage: npm run screenshots
 *
 * Requirements (macOS only):
 * - Xcode + Command Line Tools
 * - iOS Simulator (iPad Pro 12.9")
 * - Optional: ImageMagick for resizing (brew install imagemagick)
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const IS_MAC = process.platform === "darwin";

if (!IS_MAC) {
  console.error("\n❌ This script runs on macOS only (for iOS simulators).\n   Please run on a Mac with Xcode installed.\n");
  process.exit(1);
}

const SCREENSHOT_DIR = path.join(process.cwd(), "app-store-screenshots");
const SCREENS = [
  { name: "home-portrait", dimensions: "2064x2752" },
  { name: "statement-portrait", dimensions: "2064x2752" },
  { name: "fuel-portrait", dimensions: "2064x2752" },
  { name: "title-portrait", dimensions: "2064x2752" },
  { name: "home-landscape", dimensions: "2752x2064" },
  { name: "statement-landscape", dimensions: "2752x2064" },
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
}

function getLatestIosRuntimeId() {
  try {
    const output = execSync("xcrun simctl list runtimes --json", { encoding: "utf-8" });
    const data = JSON.parse(output);
    const ios = (data.runtimes || []).filter((r) =>
      (r.platform || r.platformName) === "iOS" && (r.availability === "available" || r.isAvailable)
    );
    if (!ios.length) throw new Error("No available iOS runtimes found");
    // Pick the latest by version
    ios.sort((a, b) => String(a.version).localeCompare(String(b.version)));
    const latest = ios[ios.length - 1];
    return latest.identifier;
  } catch (err) {
    throw new Error(`Unable to resolve iOS runtime: ${err.message}`);
  }
}

function ensureIpadProSimulator() {
  try {
    const output = execSync("xcrun simctl list devices --json", { encoding: "utf-8" });
    const data = JSON.parse(output);

    // Prefer a booted iPad Pro 12.9"
    for (const runtimeKey in data.devices) {
      const devices = data.devices[runtimeKey] || [];
      const booted = devices.find((d) => d.name.includes("iPad Pro") && d.name.includes("12.9") && d.state === "Booted");
      if (booted) return booted.udid;
    }

    // Fallback: any iPad Pro 12.9"
    for (const runtimeKey in data.devices) {
      const devices = data.devices[runtimeKey] || [];
      const found = devices.find((d) => d.name.includes("iPad Pro") && d.name.includes("12.9"));
      if (found) return found.udid;
    }

    // If not found, create one using latest iOS runtime
    const runtimeId = getLatestIosRuntimeId();
    console.log(`🆕 Creating iPad Pro (12.9-inch) simulator with runtime: ${runtimeId}`);
    const udid = execSync(
      `xcrun simctl create "ProFee iPad Pro 12.9" "iPad Pro (12.9-inch)" ${runtimeId}`,
      { encoding: "utf-8" }
    ).trim();
    if (!udid) throw new Error("Simulator creation returned empty UDID");
    return udid;
  } catch (err) {
    console.error("❌ Failed to find an iPad Pro simulator:", err.message);
    console.log("\nTip: Create one via Xcode > Devices & Simulators, or CLI.");
    process.exit(1);
  }
}

function bootSimulator(udid) {
  try {
    const out = execSync("xcrun simctl list devices --json", { encoding: "utf-8" });
    const data = JSON.parse(out);
    let state = "Shutdown";

    for (const runtimeKey in data.devices) {
      const device = (data.devices[runtimeKey] || []).find((d) => d.udid === udid);
      if (device) {
        state = device.state;
        break;
      }
    }

    if (state !== "Booted") {
      console.log("📱 Booting simulator...");
      // Ensure Simulator app is open to avoid boot issues
      try { execSync("open -a Simulator"); } catch {}
      execSync(`xcrun simctl boot ${udid}`);
      console.log("⏳ Waiting for simulator to boot...");
      execSync("sleep 8");
    }
  } catch (err) {
    console.warn("⚠️ Could not boot simulator:", err.message);
  }
}

function startExpoIfNeeded() {
  try {
    execSync("curl -s http://localhost:8081 > /dev/null 2>&1", { stdio: "ignore" });
    console.log("✅ Metro server detected (Expo dev server).\n");
  } catch {
    console.log("🚀 Starting Expo dev server in the background...");
    try {
      execSync("npm start &", { stdio: "ignore" });
      execSync("sleep 12");
    } catch (err) {
      console.warn("⚠️ Could not auto-start Expo:", err.message);
    }
  }
}

function takeScreenshot(udid, filename, dimensions) {
  const filepath = path.join(SCREENSHOT_DIR, `${filename}.png`);
  console.log(`📸 Capturing: ${filename}...`);
  execSync(`xcrun simctl screenshot ${udid} ${filepath}`);

  // Optional resize with ImageMagick
  try {
    const [w, h] = dimensions.split("x");
    execSync(`convert ${filepath} -resize ${w}x${h}! ${filepath}`);
    console.log(`✅ Saved: ${filename} (${dimensions})`);
  } catch {
    console.log(`✅ Saved: ${filename}`);
    console.log(`⚠️ Tip: Install ImageMagick (brew install imagemagick) for auto-resize to ${dimensions}`);
  }
}

async function main() {
  console.log("\n🎬 ProFee App Store Screenshot Generator\n========================================\n");
  ensureDir(SCREENSHOT_DIR);

  const udid = ensureIpadProSimulator();
  console.log(`✅ Using simulator UDID: ${udid}`);

  bootSimulator(udid);
  startExpoIfNeeded();

  console.log("\n📹 Generating screenshots (navigate app manually between shots if needed)...\n");
  for (const s of SCREENS) {
    takeScreenshot(udid, s.name, s.dimensions);
    execSync("sleep 2");
  }

  console.log(`\n✨ Done. Screenshots are in: ${SCREENSHOT_DIR}\n`);
  console.log("Next: Upload to App Store Connect.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
