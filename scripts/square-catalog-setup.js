#!/usr/bin/env node
// Square Catalog Setup — creates session category + session items
// Usage: node scripts/square-catalog-setup.js [--dry-run | --create]
//
// --dry-run (default): lists existing catalog, shows what would be created
// --create: actually creates the category + items in Square
//
// Requires env vars: SQUARE_ACCESS_TOKEN (or SQUARE_PROD/SANDBOX variants),
//                    SQUARE_LOCATION_ID, SQUARE_ENVIRONMENT

// Load env vars manually (no dotenv dependency)
// Usage: node scripts/square-catalog-setup.js [--dry-run|--create] [--env path] [--production]
var fs = require("fs");
var envPath = ".env.production";
var forceProduction = false;
process.argv.forEach(function (arg, i) {
  if (arg === "--env" && process.argv[i + 1]) envPath = process.argv[i + 1];
  if (arg === "--production") forceProduction = true;
});
var envFileContent = fs.readFileSync(envPath, "utf8");
envFileContent.split("\n").forEach(function (line) {
  var match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
});
if (forceProduction) process.env.SQUARE_ENVIRONMENT = "production";

const crypto = require("crypto");

const SQUARE_VERSION = "2026-01-22";

function getBaseUrl() {
  return process.env.SQUARE_ENVIRONMENT === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

function getAccessToken() {
  var isProd = process.env.SQUARE_ENVIRONMENT === "production";
  return isProd
    ? (process.env.SQUARE_PROD_ACCESS_TOKEN || process.env.SQUARE_ACCESS_TOKEN)
    : (process.env.SQUARE_SANDBOX_ACCESS_TOKEN || process.env.SQUARE_ACCESS_TOKEN);
}

function getHeaders() {
  return {
    "Authorization": "Bearer " + getAccessToken(),
    "Content-Type": "application/json",
    "Square-Version": SQUARE_VERSION
  };
}

// Session types — must match SESSION_PRICES in api/_lib/acuity.js
const SESSIONS = [
  // Powdersville
  { key: "pv-1hr",   label: "Flagship — 1 Hour Session",   cents: 13000, acuityId: "89113040" },
  { key: "pv-2hr",   label: "Flagship — 2 Hour Session",   cents: 20000, acuityId: "89113116" },
  { key: "pv-3hr",   label: "Flagship — 3 Hour Session",   cents: 27000, acuityId: "89114444" },
  { key: "pv-4hr",   label: "Flagship — 4 Hour Session",   cents: 35000, acuityId: "89114517" },
  { key: "pv-6hr",   label: "Flagship — 6 Hour Session",   cents: 50000, acuityId: "89114539" },
  { key: "pv-full",  label: "Flagship — Full Day Session",  cents: 98000, acuityId: "89114581" },
  // Taylor's Mill
  { key: "tm-1hr",   label: "Taylor's Mill — 1 Hour Session",  cents: 11000, acuityId: "38342199" },
  { key: "tm-2hr",   label: "Taylor's Mill — 2 Hour Session",  cents: 17000, acuityId: "28312352" },
  { key: "tm-3hr",   label: "Taylor's Mill — 3 Hour Session",  cents: 23000, acuityId: "28312534" },
  { key: "tm-4hr",   label: "Taylor's Mill — Half Day Session", cents: 28000, acuityId: "28312549" },
  { key: "tm-6hr",   label: "Taylor's Mill — 6 Hour Session",  cents: 42000, acuityId: "36030598" },
  { key: "tm-full",  label: "Taylor's Mill — Full Day Session", cents: 55000, acuityId: "28312569" }
];

async function listCatalog() {
  console.log("\n=== Current Square Catalog ===");
  console.log("Environment:", process.env.SQUARE_ENVIRONMENT || "sandbox");
  console.log("Base URL:", getBaseUrl());
  console.log();

  const res = await fetch(getBaseUrl() + "/v2/catalog/list?types=CATEGORY,ITEM", {
    headers: getHeaders()
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("Error listing catalog:", JSON.stringify(data.errors, null, 2));
    return { categories: [], items: [] };
  }

  const categories = [];
  const items = [];

  (data.objects || []).forEach(function (obj) {
    if (obj.type === "CATEGORY") {
      categories.push({ id: obj.id, name: obj.category_data.name });
    } else if (obj.type === "ITEM") {
      items.push({
        id: obj.id,
        name: obj.item_data.name,
        categories: (obj.item_data.categories || []).map(function (c) { return c.id; }),
        variations: (obj.item_data.variations || []).map(function (v) {
          return {
            id: v.id,
            name: v.item_variation_data.name,
            price: v.item_variation_data.price_money
          };
        })
      });
    }
  });

  if (categories.length === 0) {
    console.log("No categories found.");
  } else {
    console.log("Categories:");
    categories.forEach(function (c) { console.log("  -", c.name, "(" + c.id + ")"); });
  }
  console.log();

  if (items.length === 0) {
    console.log("No items found.");
  } else {
    console.log("Items:");
    items.forEach(function (it) {
      console.log("  -", it.name, "(" + it.id + ")");
      it.variations.forEach(function (v) {
        var price = v.price ? "$" + (v.price.amount / 100).toFixed(2) : "no price";
        console.log("      Variation:", v.name, "—", price, "(" + v.id + ")");
      });
    });
  }

  return { categories, items };
}

async function createCatalog() {
  console.log("\n=== Creating Square Catalog Items ===");
  console.log("Environment:", process.env.SQUARE_ENVIRONMENT || "sandbox");
  console.log();

  // Use batch upsert to create category + all items atomically
  const categoryTempId = "#sessions-category";

  const objects = [];

  // Category
  objects.push({
    type: "CATEGORY",
    id: categoryTempId,
    category_data: {
      name: "Booking Sessions"
    }
  });

  // Session items
  SESSIONS.forEach(function (s) {
    objects.push({
      type: "ITEM",
      id: "#item-" + s.key,
      item_data: {
        name: s.label,
        categories: [{ id: categoryTempId }],
        variations: [{
          type: "ITEM_VARIATION",
          id: "#var-" + s.key,
          item_variation_data: {
            name: "Regular",
            pricing_type: "FIXED_PRICING",
            price_money: { amount: s.cents, currency: "USD" }
          }
        }]
      }
    });
  });

  console.log("Creating 1 category + " + SESSIONS.length + " items...");
  console.log();

  const res = await fetch(getBaseUrl() + "/v2/catalog/batch-upsert", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      idempotency_key: crypto.randomUUID(),
      batches: [{ objects: objects }]
    })
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Error creating catalog:", JSON.stringify(data.errors, null, 2));
    process.exit(1);
  }

  // Map temp IDs to real IDs
  const idMap = data.id_mappings || [];
  console.log("Created successfully! ID mappings:\n");

  var categoryId = null;
  var sessionMap = {};

  idMap.forEach(function (m) {
    if (m.client_object_id === categoryTempId) {
      categoryId = m.object_id;
      console.log("Category 'Booking Sessions':", m.object_id);
    }
  });
  console.log();

  // Find created items with their variation IDs
  (data.objects || []).forEach(function (obj) {
    if (obj.type === "ITEM") {
      var session = SESSIONS.find(function (s) { return obj.item_data.name === s.label; });
      if (session && obj.item_data.variations && obj.item_data.variations[0]) {
        sessionMap[session.acuityId] = {
          catalogItemId: obj.id,
          catalogVariationId: obj.item_data.variations[0].id,
          label: session.label,
          cents: session.cents
        };
        console.log(session.label + ":");
        console.log("  Item ID:", obj.id);
        console.log("  Variation ID:", obj.item_data.variations[0].id);
        console.log("  Acuity Type ID:", session.acuityId);
        console.log();
      }
    }
  });

  // Output the mapping for acuity.js
  console.log("\n=== Copy this into api/_lib/acuity.js ===\n");
  console.log("const SQUARE_CATALOG = {");
  console.log('  categoryId: "' + categoryId + '",');
  console.log("  sessions: {");
  Object.keys(sessionMap).forEach(function (acuityId, i, arr) {
    var s = sessionMap[acuityId];
    var comma = i < arr.length - 1 ? "," : "";
    console.log('    "' + acuityId + '": { variationId: "' + s.catalogVariationId + '", label: "' + s.label + '", cents: ' + s.cents + ' }' + comma);
  });
  console.log("  }");
  console.log("};");
}

async function main() {
  var mode = process.argv[2] || "--dry-run";

  if (!getAccessToken()) {
    console.error("Missing Square access token. Set SQUARE_ACCESS_TOKEN or SQUARE_PROD_ACCESS_TOKEN.");
    process.exit(1);
  }

  // Always list existing catalog first
  await listCatalog();

  if (mode === "--create") {
    await createCatalog();
  } else {
    console.log("\n=== Dry Run — would create: ===");
    console.log("1 category: 'Booking Sessions'");
    console.log(SESSIONS.length + " items:");
    SESSIONS.forEach(function (s) {
      console.log("  -", s.label, "— $" + (s.cents / 100).toFixed(2));
    });
    console.log("\nRun with --create to actually create these in Square.");
  }
}

main().catch(function (err) {
  console.error("Fatal error:", err);
  process.exit(1);
});
