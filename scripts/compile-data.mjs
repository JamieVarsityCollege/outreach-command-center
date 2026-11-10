import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FINYANG_REGISTRY = '/Users/jamie/Documents/VS-Projects/finyang/app/tools/workflow/registry.json';
const SLIPSCAN_REGISTRY = '/Users/jamie/Documents/VS-Projects/slip-scan-web/outreach/workflow/registry.json';

const FINYANG_CATALOG = '/Users/jamie/Documents/VS-Projects/finyang/app/tools/workflow/master_leads_catalog.json';
const SLIPSCAN_CATALOG = '/Users/jamie/Documents/VS-Projects/slip-scan-web/outreach/workflow/master_leads_catalog.json';

const FINYANG_ACCOUNTS = '/Users/jamie/Documents/VS-Projects/finyang/app/tools/resend_accounts.json';
const SLIPSCAN_ACCOUNTS = '/Users/jamie/Documents/VS-Projects/slip-scan-web/outreach/resend_accounts.json';

const FINYANG_LOG = '/Users/jamie/Documents/VS-Projects/finyang/app/tools/outreach_sent_log.csv';
const SLIPSCAN_LOG = '/Users/jamie/Documents/VS-Projects/slip-scan-web/outreach/outreach_sent_log.csv';

const OUTPUT_FILE = path.resolve(__dirname, '../src/data/campaignData.json');

function parseLogCount(filePath) {
  if (!fs.existsSync(filePath)) return { total: 0, today: 0, byAccountToday: {} };
  const lines = fs.readFileSync(filePath, 'utf-8').trim().split('\n').filter(Boolean);
  const rows = lines.slice(1);
  const todayDate = new Date().toISOString().slice(0, 10);
  let todayCount = 0;
  const byAccountToday = {};
  for (const r of rows) {
    if (r.includes(todayDate)) {
      todayCount++;
      const cols = r.split('","').map((s) => s.replace(/^"|"$/g, ''));
      const accId = cols[6] || '';
      if (accId) byAccountToday[accId] = (byAccountToday[accId] || 0) + 1;
    }
  }
  return { total: rows.length, today: todayCount, byAccountToday };
}

async function getResendSentToday(apiKey) {
  if (!apiKey) return null;
  try {
    const res = await fetch('https://api.resend.com/emails?limit=100', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const midnightUtc = new Date();
    midnightUtc.setUTCHours(0, 0, 0, 0);
    return (data.data || []).filter((e) => new Date(e.created_at) >= midnightUtc).length;
  } catch {
    return null;
  }
}

async function compileData() {
  const finyangReg = fs.existsSync(FINYANG_REGISTRY) ? JSON.parse(fs.readFileSync(FINYANG_REGISTRY, 'utf-8')) : {};
  const slipscanReg = fs.existsSync(SLIPSCAN_REGISTRY) ? JSON.parse(fs.readFileSync(SLIPSCAN_REGISTRY, 'utf-8')) : {};
  
  const finyangCat = fs.existsSync(FINYANG_CATALOG) ? JSON.parse(fs.readFileSync(FINYANG_CATALOG, 'utf-8')) : [];
  const slipscanCat = fs.existsSync(SLIPSCAN_CATALOG) ? JSON.parse(fs.readFileSync(SLIPSCAN_CATALOG, 'utf-8')) : [];

  const finyangAccs = fs.existsSync(FINYANG_ACCOUNTS) ? JSON.parse(fs.readFileSync(FINYANG_ACCOUNTS, 'utf-8')) : [];
  const slipscanAccs = fs.existsSync(SLIPSCAN_ACCOUNTS) ? JSON.parse(fs.readFileSync(SLIPSCAN_ACCOUNTS, 'utf-8')) : [];

  const finyangLogStats = parseLogCount(FINYANG_LOG);
  const slipscanLogStats = parseLogCount(SLIPSCAN_LOG);

  const [fyLiveCounts, ssLiveCounts] = await Promise.all([
    Promise.all(finyangAccs.map((a) => getResendSentToday(a.apiKey || a.api_key))),
    Promise.all(slipscanAccs.map((a) => getResendSentToday(a.apiKey || a.api_key))),
  ]);

  const cleanAccounts = [
    ...finyangAccs.map((a, idx) => ({
      id: a.id,
      name: a.name,
      domain: a.domain,
      from: a.from,
      brand: 'FinYang AI',
      brandKey: 'finyang',
      dailySafeLimit: a.dailySafeLimit || 80,
      sentToday: fyLiveCounts[idx] ?? (finyangLogStats.byAccountToday[a.id] || 0),
    })),
    ...slipscanAccs.map((a, idx) => ({
      id: a.id,
      name: a.name,
      domain: a.domain,
      from: a.from,
      brand: 'Slip-Scan',
      brandKey: 'slipscan',
      dailySafeLimit: a.dailySafeLimit || 80,
      sentToday: ssLiveCounts[idx] ?? (slipscanLogStats.byAccountToday[a.id] || 0),
    })),
  ];

  const fySentToday = cleanAccounts.filter((a) => a.brandKey === 'finyang').reduce((s, a) => s + a.sentToday, 0);
  const ssSentToday = cleanAccounts.filter((a) => a.brandKey === 'slipscan').reduce((s, a) => s + a.sentToday, 0);

  const now = Date.now();
  const isDueFollowup1 = (p) => p.initial && !p.followup_1 && (now - new Date(p.initial.sent_at).getTime()) >= 20 * 3600 * 1000;

  const allProspects = [
    ...Object.values(finyangReg).map((p) => ({ ...p, brand: 'FinYang AI', brandKey: 'finyang' })),
    ...Object.values(slipscanReg).map((p) => ({ ...p, brand: 'Slip-Scan', brandKey: 'slipscan' })),
  ];

  const payload = {
    liveSynced: false,
    lastUpdated: new Date().toISOString(),
    metrics: {
      totalSentToday: fySentToday + ssSentToday,
      totalTracked: allProspects.length,
      totalPoolCapacity: cleanAccounts.reduce((sum, a) => sum + a.dailySafeLimit, 0),
      totalCatalogSize: finyangCat.length + slipscanCat.length,
      finyang: {
        totalTracked: Object.keys(finyangReg).length,
        catalogSize: finyangCat.length,
        sentToday: fySentToday,
        totalSentAllTime: finyangLogStats.total,
        safeCap: 345,
        reservoirCount: Object.values(finyangReg).filter((p) => p.stage === 'UNCONTACTED').length,
        followup1DueTomorrow: Object.values(finyangReg).filter(isDueFollowup1).length,
      },
      slipscan: {
        totalTracked: Object.keys(slipscanReg).length,
        catalogSize: slipscanCat.length,
        sentToday: ssSentToday,
        totalSentAllTime: slipscanLogStats.total,
        safeCap: 345,
        reservoirCount: Object.values(slipscanReg).filter((p) => p.stage === 'UNCONTACTED').length,
        followup1DueTomorrow: Object.values(slipscanReg).filter(isDueFollowup1).length,
      },
    },
    accounts: cleanAccounts,
    prospects: allProspects,
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`Compiled data: ${allProspects.length} registry prospects, ${cleanAccounts.length} accounts (FinYang ${fySentToday} today, Slip-Scan ${ssSentToday} today), ${payload.metrics.totalCatalogSize} catalog leads.`);
}

compileData();
