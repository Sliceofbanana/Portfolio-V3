/**
 * Private analytics read-out for /stats (Vercel serverless function).
 *
 * GET /api/stats?days=30   with header  Authorization: Bearer <STATS_KEY>
 * → { days, from, to, totals: {pageviews, visitors}, live, daily: [{date, pageviews, visitors}],
 *     pages, ref, source, country, city, device, browser, os: [[label, count], ...] }
 *
 * Env: STATS_KEY (required — a long random string), Upstash Redis (see _redis.js)
 */

import crypto from 'node:crypto';
import { pipeline, redisConfigured } from './_redis.js';

const DIMENSIONS = ['pages', 'ref', 'source', 'country', 'city', 'device', 'browser', 'os'];
const LIVE_WINDOW_MS = 5 * 60 * 1000;

function authorised(req) {
  const key = process.env.STATS_KEY || '';
  const given = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (key.length < 16 || !given) return false;
  const a = crypto.createHash('sha256').update(key).digest();
  const b = crypto.createHash('sha256').update(given).digest();
  return crypto.timingSafeEqual(a, b);
}

function lastDays(n) {
  const today = Date.now() + 8 * 3600 * 1000; // Philippine time (UTC+8), matching track.js
  return Array.from({ length: n }, (_, i) => new Date(today - (n - 1 - i) * 86400000).toISOString().slice(0, 10));
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!authorised(req)) return res.status(401).json({ error: 'Wrong or missing key' });
  if (!redisConfigured()) return res.status(503).json({ error: 'No analytics store is connected yet' });

  const n = Math.min(90, Math.max(1, parseInt(req.query?.days, 10) || 30));
  const days = lastDays(n);

  try {
    const now = Date.now();
    const results = await pipeline([
      ...days.flatMap((d) => [['GET', `a:pv:${d}`], ['PFCOUNT', `a:uv:${d}`]]),
      ['PFCOUNT', ...days.map((d) => `a:uv:${d}`)],
      ['ZCOUNT', 'a:live', now - LIVE_WINDOW_MS, '+inf'],
      ...days.flatMap((d) => DIMENSIONS.map((dim) => ['HGETALL', `a:${dim}:${d}`])),
    ]);

    let i = 0;
    const daily = days.map((date) => ({ date, pageviews: Number(results[i++] || 0), visitors: Number(results[i++] || 0) }));
    const visitors = Number(results[i++] || 0);
    const live = Number(results[i++] || 0);

    const sums = Object.fromEntries(DIMENSIONS.map((dim) => [dim, new Map()]));
    for (let d = 0; d < days.length; d++) {
      for (const dim of DIMENSIONS) {
        const flat = results[i++] || [];
        for (let k = 0; k < flat.length; k += 2) {
          sums[dim].set(flat[k], (sums[dim].get(flat[k]) || 0) + Number(flat[k + 1]));
        }
      }
    }
    const top = Object.fromEntries(
      DIMENSIONS.map((dim) => [dim, [...sums[dim]].sort((a, b) => b[1] - a[1]).slice(0, 12)])
    );

    return res.status(200).json({
      days: n,
      from: days[0],
      to: days[days.length - 1],
      totals: { pageviews: daily.reduce((t, x) => t + x.pageviews, 0), visitors },
      live,
      daily,
      ...top,
    });
  } catch (err) {
    console.error('stats store error', err.message);
    return res.status(502).json({ error: 'Could not reach the analytics store' });
  }
}
