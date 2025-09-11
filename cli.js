#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import minimist from "minimist";
import prompts from "prompts";
import { spawn } from "node:child_process";
import { detect } from "detect-package-manager";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

async function installDeps(cwd, pm) {
  return new Promise((resolve, reject) => {
    const cmd = pm === "yarn" ? "yarn" : pm;
    const args = pm === "yarn" ? [] : ["install"];
    const child = spawn(cmd, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error("install failed"))));
  });
}

(async () => {
  const argv = minimist(process.argv.slice(2));
  const defaultName = argv._[0] || "across-next-app";

const answers = await prompts(
  [
    {
      type: argv._[0] ? null : "text",
      name: "name",
      message: "Project name:",
      initial: defaultName,
    },
    {
      type: "toggle",
      name: "install",
      message: "Install dependencies now?",
      initial: true,
      active: "yes",
      inactive: "no",
    },
  ],
  { onCancel: () => process.exit(1) }
);



  const name = argv._[0] ?? answers.name;
  const template = "next-ts";
  const targetDir = path.resolve(process.cwd(), name);

  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length) {
    console.error(`✖ Directory ${name} is not empty.`);
    process.exit(1);
  }

  let pm;
  try {
    const res = await detect();
    pm = res?.name || "npm";
  } catch {
    pm = "npm";
  }
  const src = path.join(__dirname, "templates", template);
  copyDir(src, targetDir);

  // Replace placeholders
  const replacements = [
    path.join(targetDir, "package.json"),
    path.join(targetDir, "README.md"),
    path.join(targetDir, "app", "layout.tsx"),
    path.join(targetDir, "app", "page.tsx"),
    path.join(targetDir, "lib", "across.ts")
  ];
  for (const file of replacements) {
    if (fs.existsSync(file)) {
      const wcId = answers.wcId || "YOUR_WC_PROJECT_ID"; // fallback string

      const content = fs.readFileSync(file, "utf8")
        .replaceAll("__APP_NAME__", name)
        .replaceAll("__INTEGRATOR_ID__", "0x0000")
        .replaceAll("__WALLETCONNECT_PROJECT_ID__", wcId)
        .replaceAll("__APP_DESCRIPTION__", "Across + Next.js starter");
      fs.writeFileSync(file, content);
    }
  }

  if (answers.install) {
    await installDeps(targetDir, pm).catch(() => process.exit(1));
  }

  console.log(`\n✔ Created ${name}`);
  console.log(`\nNext steps:
  cd ${name}
  ${answers.install ? "" : pm + " install\n  "}
  ${pm} run dev
`);
})();
