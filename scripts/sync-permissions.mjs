/**
 * Copy the backend permission catalog snapshot and regenerate frontend types.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feRoot = path.join(__dirname, "..");
const beCatalogJson = path.join(feRoot, "../../plumbit-erp-be/docs/permissions-catalog.json");
const vendoredCatalogJson = path.join(feRoot, "src/shared/lib/permissions-catalog.json");

if (!fs.existsSync(beCatalogJson)) {
  console.error(
    "Backend catalog snapshot not found at:\n" +
      `  ${beCatalogJson}\n\n` +
      "Ensure plumbit-erp-be is checked out beside the frontend, then run:\n" +
      "  cd ../../plumbit-erp-be && uv run export-permissions-catalog",
  );
  process.exit(1);
}

fs.mkdirSync(path.dirname(vendoredCatalogJson), { recursive: true });
fs.copyFileSync(beCatalogJson, vendoredCatalogJson);
console.log(`Copied ${beCatalogJson} -> ${vendoredCatalogJson}`);

const result = spawnSync("node", ["scripts/generate-fe-permissions.mjs"], {
  cwd: feRoot,
  stdio: "inherit",
});
process.exit(result.status ?? 1);
