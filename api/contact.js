/**
 * Contact / project intake endpoint (Vercel serverless function).
 *
 * Hardening:
 *  - CORS + Origin allow-list (ALLOWED_ORIGINS env, comma-separated)
 *  - JSON-only, 16 KB body cap, strict field allow-list
 *  - Sanitisation: Unicode normalisation, control-char stripping, length limits, HTML escaping
 *  - Rate limiting per client IP (Upstash Redis when configured, in-memory fallback)
 *  - Honeypot field, header-injection-safe subject / reply-to
 *  - Upstream timeout; internal errors are logged, never returned to the client
 *
 * Env: RESEND_API_KEY, MY_EMAIL (required)
 *      ALLOWED_ORIGINS (optional), UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *      (or Vercel KV's KV_REST_API_URL + KV_REST_API_TOKEN) for durable rate limiting.
 */

const MAX_BODY_BYTES = 16 * 1024;
const RATE_LIMIT = { max: 5, windowSec: 15 * 60 }; // 5 submissions per 15 minutes per IP
const RESEND_TIMEOUT_MS = 10000;

const DEFAULT_ORIGINS = [
  'https://www.genesisjr.com',
  'https://genesisjr.com',
  'https://genesisjr.tech',
  'https://www.genesisjr.tech',
  'https://genesisjr.vercel.app',
];

// Keep these limits in sync with RULES in assets/site.js
const FIELDS = {
  'Full Name / Company': { label: 'Name / company', required: true, min: 2, max: 120, singleLine: true },
  Email: { label: 'Email', required: true, max: 254, singleLine: true, email: true },
  Phone: { label: 'Phone', max: 30, singleLine: true, pattern: /^\+?[0-9\s\-().]{7,30}$/, patternMsg: 'Use digits only, e.g. +63 917 123 4567' },
  'Business Description': { label: 'Business', max: 2000 },
  Pages: { label: 'Pages', max: 2000 },
  Features: { label: 'Features', max: 2000 },
  'Design Preferences': { label: 'Design preferences', max: 2000 },
  Budget: { label: 'Budget', max: 120, singleLine: true },
  Timeline: { label: 'Timeline', max: 120, singleLine: true },
  Notes: { label: 'Notes', max: 3000 },
};
const ALLOWED_GOALS = ['Showcase services', 'Sell products', 'Blog', 'Internal system', 'Info Site', 'Portfolio'];
const ALLOWED_SOURCES = ['Genesis Jr Portfolio', 'Project SNGDNN'];
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;

/* ---------------------------------------------------------------- helpers */

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Normalise and strip anything that isn't printable text. */
function clean(value, { singleLine = false } = {}) {
  if (typeof value !== 'string') return '';
  let text = value.normalize('NFKC');
  // Drop control chars (keep \n and \t for multi-line fields) and zero-width / bidi overrides
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩﻿]/g, '');
  text = text.replace(/\r\n?/g, '\n');
  if (singleLine) text = text.replace(/[\n\t]+/g, ' ');
  text = text.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

function validate(body) {
  const data = {};
  const errors = {};

  for (const [name, rule] of Object.entries(FIELDS)) {
    const raw = body[name];
    if (raw !== undefined && typeof raw !== 'string') {
      errors[name] = 'Invalid value.';
      continue;
    }
    const value = clean(raw, rule);
    if (!value) {
      if (rule.required) errors[name] = `${rule.label} is required.`;
      data[name] = '';
      continue;
    }
    if (rule.min && value.length < rule.min) errors[name] = `Must be at least ${rule.min} characters.`;
    else if (value.length > rule.max) errors[name] = `Keep this under ${rule.max} characters.`;
    else if (rule.email && !EMAIL_RE.test(value)) errors[name] = 'Enter a valid email address.';
    else if (rule.pattern && !rule.pattern.test(value)) errors[name] = rule.patternMsg;
    data[name] = value;
  }

  const goals = Array.isArray(body.Goals) ? body.Goals : typeof body.Goals === 'string' ? body.Goals.split(',') : [];
  data.Goals = [...new Set(goals.map((g) => clean(String(g), { singleLine: true })).filter((g) => ALLOWED_GOALS.includes(g)))];

  data.Source = ALLOWED_SOURCES.includes(body.Source) ? body.Source : 'Website';
  return { data, errors };
}

function allowedOrigins() {
  const fromEnv = (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
  const list = [...(fromEnv.length ? fromEnv : DEFAULT_ORIGINS)];
  if (process.env.VERCEL_ENV !== 'production') list.push('http://localhost:3000', 'http://localhost:5173');
  if (process.env.VERCEL_URL) list.push(`https://${process.env.VERCEL_URL}`); // preview deployments
  return list;
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  const first = (Array.isArray(fwd) ? fwd[0] : fwd || '').split(',')[0].trim();
  return first || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

/* ------------------------------------------------------------ rate limit */

const memoryHits = new Map(); // fallback only: per-instance, resets on cold start

async function rateLimit(ip) {
  const key = `contact:rl:${ip}`;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (url && token) {
    try {
      const res = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, String(RATE_LIMIT.windowSec), 'NX'],
          ['TTL', key],
        ]),
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const [[, countRes], , [, ttlRes]] = (await res.json()).map((r) => [r.error, r.result]);
        const count = Number(countRes);
        const ttl = Number(ttlRes) > 0 ? Number(ttlRes) : RATE_LIMIT.windowSec;
        return { ok: count <= RATE_LIMIT.max, remaining: Math.max(0, RATE_LIMIT.max - count), retryAfter: ttl };
      }
      console.error('rate-limit store error', res.status);
    } catch (err) {
      console.error('rate-limit store unreachable', err.message);
    }
    // Store down: fall through to in-memory so the form keeps working
  }

  const now = Date.now();
  if (memoryHits.size > 5000) {
    for (const [k, v] of memoryHits) if (v.reset <= now) memoryHits.delete(k);
  }
  const entry = memoryHits.get(key);
  if (!entry || entry.reset <= now) {
    memoryHits.set(key, { count: 1, reset: now + RATE_LIMIT.windowSec * 1000 });
    return { ok: true, remaining: RATE_LIMIT.max - 1, retryAfter: RATE_LIMIT.windowSec };
  }
  entry.count += 1;
  return {
    ok: entry.count <= RATE_LIMIT.max,
    remaining: Math.max(0, RATE_LIMIT.max - entry.count),
    retryAfter: Math.ceil((entry.reset - now) / 1000),
  };
}

/* ---------------------------------------------------------------- handler */

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Vary', 'Origin');

  const origin = req.headers.origin;
  const originAllowed = !!origin && allowedOrigins().includes(origin);
  if (originAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '600');
  }

  if (req.method === 'OPTIONS') {
    return res.status(originAllowed ? 204 : 403).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Browsers always send Origin on cross-site and same-site POSTs; block everything else
  if (!originAllowed) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
    return res.status(415).json({ error: 'Content-Type must be application/json' });
  }
  if (Number(req.headers['content-length'] || 0) > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'Request too large' });
  }

  const limit = await rateLimit(clientIp(req));
  res.setHeader('RateLimit-Limit', String(RATE_LIMIT.max));
  res.setHeader('RateLimit-Remaining', String(limit.remaining));
  if (!limit.ok) {
    res.setHeader('Retry-After', String(limit.retryAfter));
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      if (body.length > MAX_BODY_BYTES) return res.status(413).json({ error: 'Request too large' });
      body = JSON.parse(body);
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    if (JSON.stringify(body).length > MAX_BODY_BYTES) {
      return res.status(413).json({ error: 'Request too large' });
    }

    // Honeypot: real visitors never fill the hidden "Website" field. Pretend success.
    if (typeof body.Website === 'string' && body.Website.trim()) {
      return res.status(200).json({ success: true });
    }

    const { data, errors } = validate(body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ error: 'Validation failed', errors });
    }

    if (!process.env.RESEND_API_KEY || !process.env.MY_EMAIL) {
      console.error('contact: missing RESEND_API_KEY or MY_EMAIL');
      return res.status(500).json({ error: 'Service unavailable' });
    }

    const name = data['Full Name / Company'];
    const email = data.Email;
    const row = (label, value) =>
      `<p><strong>${label}:</strong> ${value ? escapeHtml(value).replace(/\n/g, '<br>') : '<em>Not provided</em>'}</p>`;

    const emailData = {
      from: 'noreply@genesisjr.tech',
      to: process.env.MY_EMAIL,
      reply_to: email, // validated by EMAIL_RE: no spaces, commas or angle brackets
      subject: `[${data.Source}] New project inquiry from ${name}`.replace(/[\r\n]+/g, ' ').slice(0, 150),
      html: `
        <h2>New Project Inquiry — ${escapeHtml(data.Source)}</h2>
        ${row('Name', name)}
        ${row('Email', email)}
        ${row('Phone', data.Phone)}
        ${row('Business', data['Business Description'])}
        ${row('Goals', data.Goals.join(', '))}
        ${row('Budget', data.Budget)}
        ${row('Timeline', data.Timeline)}
        ${row('Pages', data.Pages)}
        ${row('Features', data.Features)}
        ${row('Design Preferences', data['Design Preferences'])}
        ${row('Notes', data.Notes)}
        <hr>
        <p><em>Submitted via ${escapeHtml(data.Source)} · Reply to this email to respond to ${escapeHtml(email)}</em></p>
      `,
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
      signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error('contact: resend failed', response.status, await response.text().catch(() => ''));
      return res.status(502).json({ error: 'Could not send your message right now' });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    if (error instanceof SyntaxError) return res.status(400).json({ error: 'Invalid JSON' });
    console.error('contact: unexpected error', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
