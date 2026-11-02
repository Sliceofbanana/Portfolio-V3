/**
 * Privacy-first page-view counter (Vercel serverless function).
 *
 * POST /api/track  body: {"p": path, "r": referrer, "s": utm_source}  (sent with navigator.sendBeacon)
 *
 * What is kept, per day, as counters only:
 *   page views, page path, referring site (host only), campaign source, country and city
 *   (from Vercel's edge geo headers), device type, browser and OS (from the user agent).
 * What is never kept: IP addresses, full user agents, cookies or any cross-day identifier.
 * Unique visitors are counted Plausible-style: sha256(daily random salt + IP + user agent) goes
 * into a HyperLogLog (which can't be read back) and a 5-minute "live now" set. The salt is
 * random, lives in Redis for 48 hours and is then gone, so visitors can't be linked across days.
 * The browser skips tracking entirely for Do Not Track and Global Privacy Control.
 *
 * Env: Upstash Redis (see _redis.js). Without it the endpoint accepts and discards views.
 */

import crypto from 'node:crypto';
import { pipeline, redisConfigured } from './_redis.js';

const MAX_BODY_BYTES = 2048;
const KEEP_DAYS = 400;
const LIVE_WINDOW_MS = 5 * 60 * 1000;
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch|facebookexternalhit|vercel/i;

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  const first = (Array.isArray(fwd) ? fwd[0] : fwd || '').split(',')[0].trim();
  return first || req.headers['x-real-ip'] || '';
}

function cleanPath(p) {
  if (typeof p !== 'string') return null;
  let path = p.split(/[?#]/)[0].replace(/\.html$/, '').replace(/\/index$/, '/');
  if (path.length > 1) path = path.replace(/\/$/, '');
  return /^\/[a-z0-9\-/]{0,80}$/i.test(path) ? path.toLowerCase() : null;
}

function referrerHost(r, ownHost) {
  try {
    const host = new URL(r).hostname.replace(/^www\./, '').toLowerCase();
    return host && host !== ownHost ? host.slice(0, 60) : null;
  } catch {
    return null;
  }
}

function device(ua) {
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return 'Tablet';
  if (/Mobi|iPhone|Android/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

function browser(ua) {
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/SamsungBrowser/.test(ua)) return 'Samsung Internet';
  if (/FBAN|FBAV|Instagram|Messenger/.test(ua)) return 'In-app (Meta)';
  if (/Firefox|FxiOS/.test(ua)) return 'Firefox';
  if (/Chrome|CriOS/.test(ua)) return 'Chrome';
  if (/Safari/.test(ua)) return 'Safari';
  return 'Other';
}

function os(ua) {
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  if (/Windows/.test(ua)) return 'Windows';
  if (/CrOS/.test(ua)) return 'ChromeOS';
  if (/Mac OS X|Macintosh/.test(ua)) return 'macOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Other';
}

function header(req, name) {
  const v = req.headers[name];
  if (!v) return null;
  try {
    return decodeURIComponent(Array.isArray(v) ? v[0] : v).slice(0, 60);
  } catch {
    return null;
  }
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY_BYTES) throw new Error('too large');
  }
  return JSON.parse(raw || '{}');
}

async function dailySalt(day) {
  const key = `a:salt:${day}`;
  const [existing] = await pipeline([['GET', key]]);
  if (existing) return existing;
  const fresh = crypto.randomBytes(16).toString('hex');
  const [, salt] = await pipeline([['SET', key, fresh, 'NX', 'EX', 172800], ['GET', key]]);
  return salt || fresh;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const ua = String(req.headers['user-agent'] || '');
  const ownHost = String(req.headers.host || '').replace(/^www\./, '').toLowerCase();
  const origin = req.headers.origin;
  let sameOrigin = true;
  try {
    if (origin) sameOrigin = new URL(origin).host.replace(/^www\./, '').toLowerCase() === ownHost;
  } catch {
    sameOrigin = false;
  }
  if (!ua || BOT.test(ua) || !sameOrigin) {
    return res.status(204).end();
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    return res.status(400).end();
  }
  const path = cleanPath(body.p);
  if (!path || !redisConfigured()) return res.status(204).end();

  const now = Date.now();
  const day = new Date(now + 8 * 3600 * 1000).toISOString().slice(0, 10); // Philippine time (UTC+8)
  const ttl = KEEP_DAYS * 86400;
  const ref = referrerHost(body.r, ownHost);
  const source = typeof body.s === 'string' ? body.s.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 40) : '';
  const country = header(req, 'x-vercel-ip-country');
  const city = header(req, 'x-vercel-ip-city');

  try {
    const salt = await dailySalt(day);
    const visitor = crypto.createHash('sha256').update(`${salt}|${clientIp(req)}|${ua}`).digest('hex').slice(0, 20);
    const counts = [
      ['pages', path],
      ['ref', ref || '(direct)'],
      ['device', device(ua)],
      ['browser', browser(ua)],
      ['os', os(ua)],
      ['country', country || '??'],
    ];
    if (city && country) counts.push(['city', `${city}, ${country}`]);
    if (source) counts.push(['source', source]);

    await pipeline([
      ['INCR', `a:pv:${day}`],
      ['EXPIRE', `a:pv:${day}`, ttl],
      ['PFADD', `a:uv:${day}`, visitor],
      ['EXPIRE', `a:uv:${day}`, ttl],
      ...counts.flatMap(([dim, val]) => [
        ['HINCRBY', `a:${dim}:${day}`, val, 1],
        ['EXPIRE', `a:${dim}:${day}`, ttl],
      ]),
      ['ZADD', 'a:live', now, visitor],
      ['ZREMRANGEBYSCORE', 'a:live', 0, now - LIVE_WINDOW_MS],
      ['EXPIRE', 'a:live', 600],
    ]);
  } catch (err) {
    console.error('track store error', err.message);
  }
  return res.status(204).end();
}
