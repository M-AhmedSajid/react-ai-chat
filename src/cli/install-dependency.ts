import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

type PackageManager = "npm" | "pnpm" | "yarn";

function detectPackageManager(): PackageManager {
  const cwd = process.cwd();

  if (existsSync(join(cwd, "pnpm-lock.yaml"))) {
    return "pnpm";
  }

  if (
    existsSync(join(cwd, "yarn.lock")) ||
    existsSync(join(cwd, ".yarnrc.yml"))
  ) {
    return "yarn";
  }

  return "npm";
}

function isPackageInstalled(packageName: string) {
  try {
    execSync(
      `${detectPackageManager() === "npm" ? "npm" : detectPackageManager()} ls ${packageName} --depth=0`,
      {
        cwd: process.cwd(),
        stdio: "ignore",
      },
    );

    return true;
  } catch {
    return false;
  }
}

export function ensureDependency(packageName: string) {
  if (isPackageInstalled(packageName)) {
    return;
  }

  const packageManager = detectPackageManager();

  const command = {
    npm: `npm install ${packageName}`,
    pnpm: `pnpm add ${packageName}`,
    yarn: `yarn add ${packageName}`,
  }[packageManager];

  console.log(`\nInstalling ${packageName}...\n`);

  execSync(command, {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  console.log(`\n✓ ${packageName} installed.`);
}
