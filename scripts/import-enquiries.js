/**
 * import-enquiries.js
 *
 * Parses src/Enquiries.csv (exported from the legacy Netlify form system) and
 * writes a SQL file ready for ingestion into the D1 database.
 *
 * Usage:
 *   node scripts/import-enquiries.js > /tmp/enquiries-import.sql
 *   npx wrangler d1 execute pawsbuddy-enquiries --remote --file=/tmp/enquiries-import.sql
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = join(__dirname, "../src/Enquiries.csv");

// ---------------------------------------------------------------------------
// CSV parser — handles quoted fields with embedded newlines and escaped quotes
// ---------------------------------------------------------------------------
function parseCSV(content) {
  const rows = [];
  let i = 0;
  const len = content.length;

  // Strip UTF-8 BOM if present
  if (content.charCodeAt(0) === 0xfeff) i = 1;

  while (i < len) {
    const row = [];
    let atRowStart = true;

    while (i < len) {
      if (atRowStart && content[i] === "\n") {
        // Empty line — skip
        i++;
        break;
      }
      atRowStart = false;

      if (content[i] === '"') {
        // Quoted field
        i++;
        let field = "";
        while (i < len) {
          if (content[i] === '"') {
            if (i + 1 < len && content[i + 1] === '"') {
              // Escaped quote inside field
              field += '"';
              i += 2;
            } else {
              // Closing quote
              i++;
              break;
            }
          } else {
            field += content[i++];
          }
        }
        row.push(field);
      } else {
        // Unquoted field — read until comma or end of line
        let field = "";
        while (
          i < len &&
          content[i] !== "," &&
          content[i] !== "\n" &&
          content[i] !== "\r"
        ) {
          field += content[i++];
        }
        row.push(field);
      }

      if (i < len && content[i] === ",") {
        i++; // advance past separator
      } else {
        // End of row
        if (i < len && content[i] === "\r") i++;
        if (i < len && content[i] === "\n") i++;
        break;
      }
    }

    if (row.length > 1 || (row.length === 1 && row[0] !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

// ---------------------------------------------------------------------------
// SQL helpers
// ---------------------------------------------------------------------------

// Nullable columns — empty string becomes NULL
function sqlStr(value) {
  if (value === null || value === undefined || value.trim() === "") {
    return "NULL";
  }
  return "'" + value.replace(/'/g, "''") + "'";
}

// NOT NULL columns — empty string stays as empty string ''
function sqlStrRequired(value) {
  if (value === null || value === undefined) return "''";
  return "'" + value.replace(/'/g, "''") + "'";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const content = readFileSync(csvPath, "utf8");
const rows = parseCSV(content);

if (rows.length < 2) {
  process.stderr.write("No data rows found.\n");
  process.exit(1);
}

const headers = rows[0];
const dataRows = rows.slice(1);

// Map CSV column names to index
const col = (name) => {
  const idx = headers.indexOf(name);
  if (idx === -1) throw new Error(`Column not found: ${name}`);
  return idx;
};

const emailIdx      = col("email");
const nameIdx       = col("name");
const postcodeIdx   = col("postcode");
const detailsIdx    = col("details");
const sourceIdx     = col("source");
const sourceOtherIdx = col("source-other");
const ipIdx         = col("ip");
const userAgentIdx  = col("user_agent");
const referrerIdx   = col("referrer");
const createdAtIdx  = col("created_at");

const lines = [
  "-- Legacy enquiry import from Netlify Forms (src/Enquiries.csv)",
  `-- ${dataRows.length} records, ${new Date().toISOString()}`,
  "",
];

let inserted = 0;
for (const row of dataRows) {
  if (row.length < headers.length) {
    process.stderr.write(
      `Skipping short row (${row.length} cols): ${JSON.stringify(row.slice(0, 3))}\n`
    );
    continue;
  }

  const email      = row[emailIdx];
  const name       = row[nameIdx];
  const postcode   = row[postcodeIdx];
  const details    = row[detailsIdx];
  const source     = row[sourceIdx];
  const sourceOther = row[sourceOtherIdx];
  const ip         = row[ipIdx];
  const userAgent  = row[userAgentIdx];
  const referrer   = row[referrerIdx];
  // Convert ISO 8601 timestamp to SQLite datetime string
  const createdAt  = row[createdAtIdx].replace("T", " ").replace(/\.\d+Z$/, "");

  lines.push(
    `INSERT INTO submissions (email, name, postcode, details, source, source_other, ip, user_agent, referrer, created_at) VALUES ` +
    `(${sqlStrRequired(email)}, ${sqlStrRequired(name)}, ${sqlStrRequired(postcode)}, ${sqlStrRequired(details)}, ` +
    `${sqlStr(source)}, ${sqlStr(sourceOther)}, ${sqlStr(ip)}, ${sqlStr(userAgent)}, ${sqlStr(referrer)}, ` +
    `'${createdAt}');`
  );
  inserted++;
}

process.stdout.write(lines.join("\n") + "\n");
process.stderr.write(`Generated ${inserted} INSERT statements.\n`);
