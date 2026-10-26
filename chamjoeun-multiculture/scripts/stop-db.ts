import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
const { runtime, data } = JSON.parse(
  await readFile(".local/runtime.json", "utf8"),
);
const result = spawnSync(
  join(runtime, "bin", "pg_ctl.exe"),
  ["stop", "-D", data, "-m", "fast", "-w"],
  { stdio: "inherit", windowsHide: true },
);
process.exitCode = result.status ?? 1;
