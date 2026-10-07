/**
 * GitHub contribution calendar (Vercel serverless function).
 *
 * Proxies GitHub's GraphQL API so the token never reaches the browser, and returns a compact
 * payload: { total, weeks: [[[date, count, level], ...], ...] } with level 0–4.
 * Responses are cached at the edge for 6 hours (stale for a day while revalidating).
 *
 * Env: GITHUB_TOKEN (required — a fine-grained token with no extra permissions is enough)
 *      GITHUB_USER (optional, defaults to Sliceofbanana)
 */

const GITHUB_TIMEOUT_MS = 8000;
const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

const QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('GITHUB_TOKEN is not set');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'Unavailable' });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GITHUB_TIMEOUT_MS);
  try {
    const gh = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'genesisjr-portfolio',
      },
      body: JSON.stringify({ query: QUERY, variables: { login: process.env.GITHUB_USER || 'Sliceofbanana' } }),
      signal: controller.signal,
    });
    const json = await gh.json().catch(() => ({}));
    const calendar = json?.data?.user?.contributionsCollection?.contributionCalendar;
    if (!gh.ok || !calendar) {
      console.error('GitHub GraphQL error', gh.status, JSON.stringify(json.errors || json.message || ''));
      res.setHeader('Cache-Control', 'no-store');
      return res.status(502).json({ error: 'Unavailable' });
    }

    const weeks = calendar.weeks.map((w) =>
      w.contributionDays.map((d) => [d.date, d.contributionCount, LEVELS[d.contributionLevel] ?? 0])
    );
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=21600, stale-while-revalidate=86400');
    return res.status(200).json({ total: calendar.totalContributions, weeks });
  } catch (err) {
    console.error('GitHub request failed', err.name === 'AbortError' ? 'timeout' : err.message);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: 'Unavailable' });
  } finally {
    clearTimeout(timer);
  }
}
