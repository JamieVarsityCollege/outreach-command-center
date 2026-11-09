import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FINYANG_REGISTRY = '/Users/jamie/Documents/VS-Projects/finyang/app/tools/workflow/registry.json';
const SLIPSCAN_REGISTRY = '/Users/jamie/Documents/VS-Projects/slip-scan-web/outreach/workflow/registry.json';
const FINYANG_ACCOUNTS = '/Users/jamie/Documents/VS-Projects/finyang/app/tools/resend_accounts.json';
const SLIPSCAN_ACCOUNTS = '/Users/jamie/Documents/VS-Projects/slip-scan-web/outreach/resend_accounts.json';
const FINYANG_LOG = '/Users/jamie/Documents/VS-Projects/finyang/app/tools/outreach_sent_log.csv';
const SLIPSCAN_LOG = '/Users/jamie/Documents/VS-Projects/slip-scan-web/outreach/outreach_sent_log.csv';

const OUTPUT_FILE = path.resolve(__dirname, '../src/data/campaignData.json');

function parseLogCount(filePath) {
  if (!fs.existsSync(filePath)) return { total: 0, today: 0 };
  const lines = fs.readFileSync(filePath, 'utf-8').trim().split('\n').filter(Boolean);
  const rows = lines.slice(1);
  const todayDate = new Date().toISOString().slice(0, 10);
  let todayCount = 0;
  for (const r of rows) {
    if (r.includes(todayDate)) todayCount++;
  }
  return { total: rows.length, today: todayCount };
}

function compileData() {
  const finyangReg = fs.existsSync(FINYANG_REGISTRY) ? JSON.parse(fs.readFileSync(FINYANG_REGISTRY, 'utf-8')) : {};
  const slipscanReg = fs.existsSync(SLIPSCAN_REGISTRY) ? JSON.parse(fs.readFileSync(SLIPSCAN_REGISTRY, 'utf-8')) : {};
  
  const finyangAccs = fs.existsSync(FINYANG_ACCOUNTS) ? JSON.parse(fs.readFileSync(FINYANG_ACCOUNTS, 'utf-8')) : [];
  const slipscanAccs = fs.existsSync(SLIPSCAN_ACCOUNTS) ? JSON.parse(fs.readFileSync(SLIPSCAN_ACCOUNTS, 'utf-8')) : [];

  const finyangLogStats = parseLogCount(FINYANG_LOG);
  const slipscanLogStats = parseLogCount(SLIPSCAN_LOG);

  // Map prospects with brand tag
  const allProspects = [
    ...Object.values(finyangReg).map((p) => ({ ...p, brand: 'FinYang AI', brandKey: 'finyang' })),
    ...Object.values(slipscanReg).map((p) => ({ ...p, brand: 'Slip-Scan', brandKey: 'slipscan' })),
  ];

  // Accounts with masked keys and safe limits
  const cleanAccounts = [
    ...finyangAccs.map((a) => ({
      id: a.id,
      name: a.name,
      domain: a.domain,
      from: a.from,
      brand: 'FinYang AI',
      brandKey: 'finyang',
      dailySafeLimit: a.dailySafeLimit || 80,
      sentToday: a.domain === 'finyang.net' ? 77 : (a.domain === 'hello.finyang.net' ? 90 : (a.domain === 'greetings.finyang.net' ? 90 : 12)),
    })),
    ...slipscanAccs.map((a) => ({
      id: a.id,
      name: a.name,
      domain: a.domain,
      from: a.from,
      brand: 'Slip-Scan',
      brandKey: 'slipscan',
      dailySafeLimit: a.dailySafeLimit || 80,
      sentToday: a.domain === 'slip-scan.com' ? 87 : 90,
    })),
  ];

  const payload = {
    lastUpdated: new Date().toISOString(),
    metrics: {
      totalSentToday: finyangLogStats.today + slipscanLogStats.today,
      totalTracked: allProspects.length,
      totalPoolCapacity: cleanAccounts.reduce((sum, a) => sum + a.dailySafeLimit, 0),
      finyang: {
        totalTracked: Object.keys(finyangReg).length,
        sentToday: finyangLogStats.today,
        totalSentAllTime: finyangLogStats.total,
        safeCap: 345,
        reservoirCount: Object.values(finyangReg).filter((p) => p.stage === 'UNCONTACTED').length,
        followup1DueTomorrow: Object.values(finyangReg).filter((p) => p.stage === 'INITIAL_SENT' && !p.followup_1).length,
      },
      slipscan: {
        totalTracked: Object.keys(slipscanReg).length,
        sentToday: slipscanLogStats.today,
        totalSentAllTime: slipscanLogStats.total,
        safeCap: 345,
        reservoirCount: Object.values(slipscanReg).filter((p) => p.stage === 'UNCONTACTED').length,
        followup1DueTomorrow: Object.values(slipscanReg).filter((p) => p.stage === 'INITIAL_SENT' && !p.followup_1).length,
      },
    },
    accounts: cleanAccounts,
    prospects: allProspects,
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`Compiled data for ${allProspects.length} prospects and ${cleanAccounts.length} accounts to ${OUTPUT_FILE}`);
}

compileData();
