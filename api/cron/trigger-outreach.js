export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization || '';

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only run Monday-Friday
  const utcDay = new Date().getUTCDay();
  if (utcDay === 0 || utcDay === 6) {
    return res.status(200).json({ status: 'skipped', reason: 'Weekend pause (Mon-Fri schedule)' });
  }

  const ghToken = process.env.GITHUB_WORKFLOW_TOKEN;
  if (!ghToken) {
    return res.status(500).json({ error: 'Missing GITHUB_WORKFLOW_TOKEN env var' });
  }

  const targets = [
    { owner: 'Jamie123234', repo: 'finyang', workflow: 'daily-outreach.yml' },
    { owner: 'Jamie123234', repo: 'slip-scan-web', workflow: 'daily-outreach.yml' },
  ];

  const results = [];
  for (const t of targets) {
    const url = `https://api.github.com/repos/${t.owner}/${t.repo}/actions/workflows/${t.workflow}/dispatches`;
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ghToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Outreach-Command-Center-Cron',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main' }),
    });

    results.push({
      repo: `${t.owner}/${t.repo}`,
      ok: r.ok,
      status: r.status,
      body: r.ok ? 'dispatched' : await r.text(),
    });
  }

  const allOk = results.every((r) => r.ok);
  return res.status(allOk ? 200 : 502).json({
    triggeredAt: new Date().toISOString(),
    results,
  });
}
