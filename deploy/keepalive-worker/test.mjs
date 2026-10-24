// node deploy/keepalive-worker/test.mjs — checks the trading-window logic.
import assert from "node:assert/strict";
import { inTradingWindow } from "./src/index.js";

const vn = (iso) => new Date(`${iso}+07:00`); // Vietnam local time
const cases = [
  ["2026-10-26T08:44:00", false], // Monday, before window
  ["2026-10-26T08:45:00", true],
  ["2026-10-26T11:45:00", true], // lunch: keep awake (pm session resumes 13:00)
  ["2026-10-26T15:10:00", true],
  ["2026-10-26T15:11:00", false],
  ["2026-10-30T10:00:00", true], // Friday
  ["2026-10-31T10:00:00", false], // Saturday
  ["2026-11-01T10:00:00", false], // Sunday
];
for (const [t, want] of cases) assert.equal(inTradingWindow(vn(t)), want, t);

// the UTC cron must cover the whole window: first fire 01:50 UTC = 08:50 VN is fine,
// but 08:45 is inside the window only if a */10 fire lands there -> 01:40 UTC = 08:40 (out),
// 01:50 = 08:50 (in). Wake-up at 08:50 + ~1 min cold start is still before 09:00.
assert.equal(inTradingWindow(new Date("2026-10-26T01:50:00Z")), true);
assert.equal(inTradingWindow(new Date("2026-10-26T08:10:00Z")), true); // 15:10 VN
assert.equal(inTradingWindow(new Date("2026-10-26T08:20:00Z")), false);
console.log(`ok — ${cases.length + 3} cases`);
