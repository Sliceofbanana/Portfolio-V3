/**
 * The email Genesis receives for each project inquiry (api/contact.js).
 * Files starting with "_" in /api are not deployed as endpoints.
 *
 * Email clients ignore <style> blocks and modern CSS, so everything is
 * table layout with inline styles. Every value from the form is escaped.
 *
 * Preview locally:  node tools/preview-email.mjs
 */

const C = {
  page: '#f2f0eb',
  card: '#ffffff',
  ink: '#121212',
  muted: '#6b6962',
  line: '#e6e2d9',
  soft: '#faf8f4',
  dark: '#0a0a0c',
  accent: '#ff5a1f',
};
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Escape, keep line breaks, and turn pasted links (design references) into links. */
const richText = (value) =>
  escapeHtml(value)
    .replace(/https?:\/\/[^\s<]+/g, (url) => `<a href="${url}" style="color:${C.accent};word-break:break-all;">${url}</a>`)
    .replace(/\n/g, '<br>');

/** wa.me needs the number in international format without symbols: 0917… → 63917… */
function whatsappNumber(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) return `63${digits.slice(1)}`;
  return digits;
}

function manilaTime(date) {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

const DETAILS = [
  ['Business Description', 'About the business'],
  ['Pages', 'Pages needed'],
  ['Features', 'Special features'],
  ['Design Preferences', 'Design preferences'],
  ['Notes', 'Additional notes'],
];

function button(href, label, primary) {
  const bg = primary ? C.accent : C.card;
  const color = primary ? '#ffffff' : C.ink;
  const border = primary ? C.accent : C.line;
  return `<a href="${href}" style="display:inline-block;margin:0 8px 8px 0;padding:11px 18px;border-radius:999px;border:1px solid ${border};background:${bg};color:${color};font-weight:600;font-size:14px;text-decoration:none;">${label}</a>`;
}

function glanceCell(label, valueHtml) {
  return `<td valign="top" style="padding:14px 16px;background:${C.soft};border:1px solid ${C.line};border-radius:12px;">
              <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${C.muted};">${label}</div>
              <div style="margin-top:6px;font-size:15px;font-weight:600;color:${C.ink};">${valueHtml}</div>
            </td>`;
}

const notGiven = `<span style="color:${C.muted};font-weight:400;">Not given</span>`;

/**
 * @param {object} data  validated form data from contact.js
 * @param {Date}   [now]
 * @returns {{subject: string, html: string, text: string}}
 */
export function inquiryEmail(data, now = new Date()) {
  const name = data['Full Name / Company'];
  const email = data.Email;
  const firstName = name.split(/[\s/]+/)[0];
  const received = manilaTime(now);
  const replyBy = manilaTime(new Date(now.getTime() + 24 * 60 * 60 * 1000));

  const subject = `New inquiry: ${name}${data.Budget ? ` · ${data.Budget}` : ''}`.replace(/[\r\n]+/g, ' ').slice(0, 150);

  const replyHref = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Re: Your project inquiry')}&body=${encodeURIComponent(`Hi ${firstName},\n\nThanks for reaching out! `)}`;
  const buttons = [
    button(replyHref, `Reply to ${escapeHtml(firstName)}`, true),
    data.Phone ? button(`tel:${data.Phone.replace(/[^\d+]/g, '')}`, 'Call', false) : '',
    data.Phone ? button(`https://wa.me/${whatsappNumber(data.Phone)}`, 'WhatsApp', false) : '',
  ].join('');

  const goals = data.Goals.length
    ? data.Goals.map((g) => `<span style="display:inline-block;margin:0 4px 4px 0;padding:3px 10px;border-radius:999px;background:#fff1ea;color:#b2380c;font-size:13px;font-weight:600;">${escapeHtml(g)}</span>`).join('')
    : notGiven;

  const filled = DETAILS.filter(([key]) => data[key]);
  const empty = DETAILS.filter(([key]) => !data[key]).map(([, label]) => label.toLowerCase());
  const detailRows = filled
    .map(
      ([key, label]) => `<tr><td style="padding:18px 0 0;">
              <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${C.muted};">${label}</div>
              <div style="margin-top:6px;font-size:15px;line-height:1.6;color:${C.ink};">${richText(data[key])}</div>
            </td></tr>`
    )
    .join('');

  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${C.page};font-family:${FONT};color:${C.ink};">
  <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml([data.Goals.join(', '), data.Timeline].filter(Boolean).join(' · ') || 'New project inquiry')}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

        <tr><td style="background:${C.dark};border-radius:16px 16px 0 0;padding:20px 28px;">
          <span style="font-size:18px;font-weight:700;color:#ffffff;">genesis<span style="color:${C.accent};">&#9679;</span>jr</span>
          <span style="float:right;font-size:12px;color:#a09d95;line-height:24px;">${escapeHtml(data.Source)}</span>
        </td></tr>

        <tr><td style="background:${C.card};padding:28px 28px 8px;">
          <div style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:${C.accent};font-weight:700;">New project inquiry</div>
          <h1 style="margin:8px 0 6px;font-size:26px;line-height:1.25;color:${C.ink};">${escapeHtml(name)}</h1>
          <div style="font-size:14px;color:${C.muted};">
            <a href="mailto:${escapeHtml(email)}" style="color:${C.ink};">${escapeHtml(email)}</a>${data.Phone ? ` &nbsp;·&nbsp; <a href="tel:${escapeHtml(data.Phone.replace(/[^\d+]/g, ''))}" style="color:${C.ink};">${escapeHtml(data.Phone)}</a>` : ''}
          </div>
          <div style="margin-top:20px;">${buttons}</div>
        </td></tr>

        <tr><td style="background:${C.card};padding:12px 28px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 8px;">
            <tr>${glanceCell('Budget', data.Budget ? escapeHtml(data.Budget) : notGiven)}<td width="8"></td>${glanceCell('Timeline', data.Timeline ? escapeHtml(data.Timeline) : notGiven)}</tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 0;">
            <tr>${glanceCell('Goals', goals)}</tr>
          </table>
        </td></tr>

        <tr><td style="background:${C.card};padding:8px 28px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${detailRows || `<tr><td style="padding:18px 0 0;font-size:15px;color:${C.muted};">No project details were filled in. Worth asking a few questions in your reply.</td></tr>`}
          </table>
          ${filled.length && empty.length ? `<p style="margin:22px 0 0;font-size:13px;color:${C.muted};">Left blank: ${empty.join(', ')}.</p>` : ''}
        </td></tr>

        <tr><td style="background:${C.soft};border-top:1px solid ${C.line};border-radius:0 0 16px 16px;padding:18px 28px;font-size:13px;line-height:1.6;color:${C.muted};">
          Received ${received} · the site promises a reply within 24 hours, so <strong style="color:${C.ink};">reply by ${replyBy}</strong>.<br>
          Next: forward this to Claude with <em>sngdnn-client-intake</em> to get a discovery brief and a Lead Tracker row.
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const line = (label, value) => `${label}: ${value || 'Not given'}`;
  const text = [
    `New project inquiry — ${data.Source}`,
    '',
    line('Name', name),
    line('Email', email),
    line('Phone', data.Phone),
    '',
    line('Budget', data.Budget),
    line('Timeline', data.Timeline),
    line('Goals', data.Goals.join(', ')),
    ...filled.flatMap(([key, label]) => ['', `${label}:`, data[key]]),
    '',
    `Received ${received}. Reply by ${replyBy}.`,
  ].join('\n');

  return { subject, html, text };
}
