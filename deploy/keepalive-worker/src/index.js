// Keeps the Render free instance awake during Vietnamese trading hours.
//
// Render free web services sleep after 15 min without incoming requests; the radar's
// outbound DNSE WebSocket does not count. This Worker pings /health every 10 minutes
// from 08:45 to 15:10 (Asia/Ho_Chi_Minh), Monday–Friday. Outside that window it does
// nothing, so the instance sleeps and consumes no free instance hours.

const VN_OFFSET_MIN = 7 * 60; // Vietnam is UTC+7 all year (no DST)
const START_MIN = 8 * 60 + 45; // 08:45: wake up before the 09:00 ATO session
const END_MIN = 15 * 60 + 10; // 15:10: after ATC/put-through and the 15:05 EOD job

export function inTradingWindow(date) {
  const vn = new Date(date.getTime() + VN_OFFSET_MIN * 60_000);
  const day = vn.getUTCDay(); // 0 = Sunday … 6 = Saturday, in Vietnam time
  const minutes = vn.getUTCHours() * 60 + vn.getUTCMinutes();
  return day >= 1 && day <= 5 && minutes >= START_MIN && minutes <= END_MIN;
}

async function ping(env) {
  const url = `${env.TARGET_URL.replace(/\/+$/, "")}/health`;
  const res = await fetch(url, { headers: { "user-agent": "astrq-keepalive" } });
  return `${res.status} ${url}`;
}

export default {
  async scheduled(event, env, ctx) {
    if (!inTradingWindow(new Date(event.scheduledTime))) return;
    ctx.waitUntil(ping(env).then((r) => console.log("keepalive", r)));
  },

  // Manual check: open the worker URL to see whether it would ping right now.
  async fetch(request, env) {
    const now = new Date();
    const active = inTradingWindow(now);
    const result = active ? await ping(env) : "outside trading window — not pinging";
    return new Response(`${now.toISOString()} · ${result}\n`, {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
};
