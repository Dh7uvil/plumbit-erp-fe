/**
 * Generates src/shared/lib/generated-permissions.ts from the backend catalog.
 *
 * Reads plumbit-erp-be/docs/permissions-catalog.json (export with:
 *   cd plumbit-erp-be && uv run python -c "from app.auth.catalog import CATALOG_PERMISSIONS, _CATALOG_ACTIONS; ..."
 * or re-run this script after updating app/auth/catalog.py).
 *
 * Run: node scripts/generate-fe-permissions.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feRoot = path.join(__dirname, "..");
const beRoot = path.join(feRoot, "../../plumbit-erp-be");
const catalogJson = path.join(beRoot, "docs/permissions-catalog.json");
const outFile = path.join(feRoot, "src/shared/lib/generated-permissions.ts");

function refreshCatalogJson() {
  const script = `
from app.auth.catalog import CATALOG_PERMISSIONS, _CATALOG_ACTIONS
import json
from pathlib import Path
payload = {
    "permissions": sorted(CATALOG_PERMISSIONS),
    "modules": {
        module: {resource: list(actions) for resource, actions in resources.items()}
        for module, resources in _CATALOG_ACTIONS.items()
    },
}
Path("docs/permissions-catalog.json").write_text(json.dumps(payload, indent=2) + "\\n")
`;
  execSync(`uv run python -c ${JSON.stringify(script)}`, {
    cwd: beRoot,
    stdio: "inherit",
  });
}

function loadCatalog() {
  if (!fs.existsSync(catalogJson)) {
    console.log(`Missing ${catalogJson}; exporting from backend catalog...`);
    refreshCatalogJson();
  }
  const raw = fs.readFileSync(catalogJson, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.permissions) || parsed.permissions.length === 0) {
    throw new Error("permissions-catalog.json must contain a non-empty permissions array");
  }
  return parsed;
}

function toConstName(code) {
  return code.replace(/\./g, "_").replace(/-/g, "_").toUpperCase();
}

function generate(catalog) {
  const permissions = [...catalog.permissions].sort();
  const lines = permissions.map((code) => `  "${code}",`).join("\n");
  const byModuleEntries = Object.entries(catalog.modules ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([module, resources]) => {
      const resourceEntries = Object.entries(resources)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([resource, actions]) => {
          const actionEntries = [...actions]
            .sort()
            .map((action) => {
              const code = `${module}.${resource}.${action}`;
              return `      ${action}: "${code}",`;
            })
            .join("\n");
          return `    ${resource}: {\n${actionEntries}\n    },`;
        })
        .join("\n");
      return `  ${module}: {\n${resourceEntries}\n  },`;
    })
    .join("\n");

  return `/** Generated from plumbit-erp-be/app/auth/catalog.py — do not edit manually. */
/** Regenerate: node scripts/generate-fe-permissions.mjs */

export const catalogPermissions = [
${lines}
] as const;

export type CatalogPermission = (typeof catalogPermissions)[number];

export const catalogPermissionSet = new Set<string>(catalogPermissions);

export function isCatalogPermission(value: string): value is CatalogPermission {
  return catalogPermissionSet.has(value);
}

export const permissionsByModule = {
${byModuleEntries}
} as const;
`;
}

const catalog = loadCatalog();
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, generate(catalog));
console.log(
  `Generated ${catalog.permissions.length} permissions in src/shared/lib/generated-permissions.ts`,
);
