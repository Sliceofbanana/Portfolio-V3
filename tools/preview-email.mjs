#!/usr/bin/env node
/**
 * Writes a sample project-inquiry email to tools/email-preview.html so the
 * design can be checked in a browser without sending anything.
 *
 *   node tools/preview-email.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inquiryEmail } from "../api/_inquiry-email.js";

const sample = {
  "Full Name / Company": "Juan Dela Cruz / Sunrise Realty",
  Email: "juan@example.com",
  Phone: "0917 123 4567",
  "Business Description": "A small real estate brokerage in Mandaue with 12 agents.",
  Goals: ["Showcase services", "Internal system"],
  Budget: "₱60,000 – ₱90,000",
  Timeline: "Before March",
  Pages: "Home, Listings, Agents, About, Contact",
  Features: "Agent logins, commission tracking, listing uploads",
  "Design Preferences": "Clean and modern, like https://www.example.com",
  Notes: "",
  Source: "Genesis Jr Portfolio",
};

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "email-preview.html");
const { subject, html } = inquiryEmail(sample);
fs.writeFileSync(out, html);
console.log(`Subject: ${subject}\nWrote ${path.relative(process.cwd(), out)}`);
