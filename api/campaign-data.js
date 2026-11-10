async function fetchGitHubRaw(owner, repo, filePath, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.raw+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'Outreach-Command-Center-API',
    },
  });
  if (!res.ok) return null;
  return await res.text();
}

async function fetchLatestRuns(owner, repo, workflow, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/runs?per_page=3`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'Outreach-Command-Center-API',
    },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.workflow_runs || []).map((r) => ({
    id: r.id,
    status: r.status,
    conclusion: r.conclusion,
    event: r.event,
    created_at: r.created_at,
    html_url: r.html_url,
  }));
}

async function getResendSentToday(apiKey) {
  if (!apiKey) return 0;
  try {
    const res = await fetch('https://api.resend.com/emails?limit=100', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    const midnightUtc = new Date();
    midnightUtc.setUTCHours(0, 0, 0, 0);
    return (data.data || []).filter((e) => new Date(e.created_at) >= midnightUtc).length;
  } catch {
    return 0;
  }
}

function parseLogCount(csvText) {
  if (!csvText) return { total: 0, today: 0 };
  const lines = csvText.trim().split('\n').filter(Boolean);
  const rows = lines.slice(1);
  const todayDate = new Date().toISOString().slice(0, 10);
  let todayCount = 0;
  for (const r of rows) {
    if (r.includes(todayDate)) todayCount++;
  }
  return { total: rows.length, today: todayCount };
}

export default async function handler(req, res) {
  const ghToken = process.env.GITHUB_WORKFLOW_TOKEN;
  if (!ghToken) {
    return res.status(503).json({ error: 'GITHUB_WORKFLOW_TOKEN not configured' });
  }

  try {
    const [
      fyRegRaw,
      ssRegRaw,
      fyCatRaw,
      ssCatRaw,
      fyLogRaw,
      ssLogRaw,
      fyRuns,
      ssRuns,
    ] = await Promise.all([
      fetchGitHubRaw('Jamie123234', 'finyang', 'app/tools/workflow/registry.json', ghToken),
      fetchGitHubRaw('Jamie123234', 'slip-scan-web', 'outreach/workflow/registry.json', ghToken),
      fetchGitHubRaw('Jamie123234', 'finyang', 'app/tools/workflow/master_leads_catalog.json', ghToken),
      fetchGitHubRaw('Jamie123234', 'slip-scan-web', 'outreach/workflow/master_leads_catalog.json', ghToken),
      fetchGitHubRaw('Jamie123234', 'finyang', 'app/tools/outreach_sent_log.csv', ghToken),
      fetchGitHubRaw('Jamie123234', 'slip-scan-web', 'outreach/outreach_sent_log.csv', ghToken),
      fetchLatestRuns('Jamie123234', 'finyang', 'daily-outreach.yml', ghToken),
      fetchLatestRuns('Jamie123234', 'slip-scan-web', 'daily-outreach.yml', ghToken),
    ]);

    const finyangReg = fyRegRaw ? JSON.parse(fyRegRaw) : {};
    const slipscanReg = ssRegRaw ? JSON.parse(ssRegRaw) : {};
    const finyangCat = fyCatRaw ? JSON.parse(fyCatRaw) : [];
    const slipscanCat = ssCatRaw ? JSON.parse(ssCatRaw) : [];

    const finyangLogStats = parseLogCount(fyLogRaw);
    const slipscanLogStats = parseLogCount(ssLogRaw);

    const rawFyAccs = process.env.FINYANG_RESEND_JSON ? JSON.parse(process.env.FINYANG_RESEND_JSON) : [];
    const rawSsAccs = process.env.SLIPSCAN_RESEND_JSON ? JSON.parse(process.env.SLIPSCAN_RESEND_JSON) : [];

    const [fyCounts, ssCounts] = await Promise.all([
      Promise.all(rawFyAccs.map((a) => getResendSentToday(a.apiKey || a.api_key))),
      Promise.all(rawSsAccs.map((a) => getResendSentToday(a.apiKey || a.api_key))),
    ]);

    const cleanAccounts = [
      ...rawFyAccs.map((a, idx) => ({
        id: a.id,
        name: a.name,
        domain: a.domain,
        from: a.from,
        brand: 'FinYang AI',
        brandKey: 'finyang',
        dailySafeLimit: a.dailySafeLimit || 80,
        sentToday: fyCounts[idx] ?? 0,
      })),
      ...rawSsAccs.map((a, idx) => ({
        id: a.id,
        name: a.name,
        domain: a.domain,
        from: a.from,
        brand: 'Slip-Scan',
        brandKey: 'slipscan',
        dailySafeLimit: a.dailySafeLimit || 80,
        sentToday: ssCounts[idx] ?? 0,
      })),
    ];

    const fySentToday = rawFyAccs.length > 0 ? fyCounts.reduce((s, n) => s + n, 0) : finyangLogStats.today;
    const ssSentToday = rawSsAccs.length > 0 ? ssCounts.reduce((s, n) => s + n, 0) : slipscanLogStats.today;

    const now = Date.now();
    const isDueFollowup1 = (p) => p.initial && !p.followup_1 && (now - new Date(p.initial.sent_at).getTime()) >= 20 * 3600 * 1000;

    const allProspects = [
      ...Object.values(finyangReg).map((p) => ({ ...p, brand: 'FinYang AI', brandKey: 'finyang' })),
      ...Object.values(slipscanReg).map((p) => ({ ...p, brand: 'Slip-Scan', brandKey: 'slipscan' })),
    ];

    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json({
      liveSynced: true,
      lastUpdated: new Date().toISOString(),
      githubRuns: {
        finyang: fyRuns,
        slipscan: ssRuns,
      },
      metrics: {
        totalSentToday: fySentToday + ssSentToday,
        totalTracked: allProspects.length,
        totalPoolCapacity: cleanAccounts.reduce((sum, a) => sum + a.dailySafeLimit, 0) || 690,
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
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
