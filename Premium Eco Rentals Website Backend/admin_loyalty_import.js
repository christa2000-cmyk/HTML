// admin_loyalty_import.js (ES module version)
// Node.js script to import earnings from Excel/CSV and post to /api/V1/loyalty/earn
// Edit the config section below to match your spreadsheet columns and API details

import xlsx from 'xlsx';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

// ========== CONFIGURATION ==========
const config = {
  filePath: 'loyalty_import.xlsx', // Path to your Excel/CSV file
  userColumn: 'Email',             // Column name for user identification
  earningsColumn: 'Total Paid',    // Column name for earnings/eligibleSpend
  tokenColumn: 'Token',            // Column name for Bearer token (if available per user)
  customerNameColumn: 'Customer',  // Column name for customer name in Excel
  apiUrl: 'http://localhost:5000/api/V1/loyalty/earn',
  defaultToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbiI6dHJ1ZSwicm9sZSI6ImFkbWluIiwiYmF0Y2giOnRydWUsImlhdCI6MTc3NzM4NzMyMCwiZXhwIjoxNzc3OTkyMTIwfQ.eU_jSp1rDBmsswEgt1tH3UBmYw8UIbu8qiICrizRGJI', // Valid admin JWT for batch import
  dryRun: false                    // Set to false to actually POST to API
};
// ===================================

function readSheet(filePath) {
  // Support relative paths from this script's directory
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const absPath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, filePath);
  const workbook = xlsx.readFile(absPath);
  const sheetName = workbook.SheetNames[0];
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
}

async function postEarnings(user, eligibleSpend, token, row) {
  if (!token) {
    console.error(`[ERROR] No token for user: ${user}`);
    return;
  }
  const payload = {
    userId: user, // Send user identifier (email) as userId
    eligibleSpend: Number(eligibleSpend),
    customerName: row && row[config.customerNameColumn] // Use configured column for customerName
  };
  if (config.dryRun) {
    console.log(`[DRY RUN] Would POST for user ${user}:`, payload);
    return;
  }
  try {
    const res = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`[SUCCESS] ${user}: ${data.message}`);
    } else {
      console.error(`[FAIL] ${user}:`, data.message || data);
    }
  } catch (err) {
    console.error(`[ERROR] ${user}:`, err.message);
  }
}

async function main() {
  const rows = readSheet(config.filePath);
  for (const row of rows) {
    const user = row[config.userColumn];
    const eligibleSpend = row[config.earningsColumn];
    const token = (row[config.tokenColumn] && row[config.tokenColumn].trim()) || config.defaultToken;
    if (!user || !eligibleSpend) {
      console.warn(`[SKIP] Missing user or earnings in row:`, row);
      continue;
    }
    await postEarnings(user, eligibleSpend, token, row);
  }
}

main();
