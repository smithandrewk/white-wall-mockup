// POST /api/scheduler-run — the unified scheduler tick (V3 item 6).
//
// Supabase pg_cron (migration 0006, DARK / not applied) POSTs this endpoint every
// ~15 min. It authenticates the caller with a shared secret, then runs ONE
// dispatchTick() (api/_lib/scheduler-dispatch.js) — the SINGLE charging authority
// that handles due balance charges + campaign touches + payment reminders. There
// is deliberately NO /api/charge-balance endpoint.
//
// DARK DISCIPLINE: when SCHEDULER_ARMED !== "1" the tick is a pure DRY-RUN — it
// SELECTS the due jobs and reports what it WOULD do, but fires no Square charge,
// no Resend send, and writes no DB row. Even when the cron is armed, no money
// moves until SCHEDULER_ARMED (and the per-behavior flags) are flipped to "1".
//
// AUTH: a shared secret in the `x-scheduler-secret` header must equal
// SCHEDULER_SECRET (constant-time compared). If SCHEDULER_SECRET is unset the
// endpoint refuses (503) rather than running open — it is never publicly callable.

const crypto = require("crypto");
const { dispatchTick } = require("./_lib/scheduler-dispatch");
const { alertFailure } = require("./_lib/alert");

const SECRET_HEADER = "x-scheduler-secret";

function timingSafeEqualStr(a, b) {
  var ab = Buffer.from(String(a));
  var bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  var expected = process.env.SCHEDULER_SECRET;
  if (!expected) {
    // Never run open. Until the secret is configured the scheduler is inert.
    return res.status(503).json({ error: "Scheduler not configured" });
  }

  var provided = req.headers[SECRET_HEADER] || req.headers[SECRET_HEADER.toLowerCase()];
  if (!provided || !timingSafeEqualStr(provided, expected)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    var result = await dispatchTick({ env: process.env });
    return res.status(200).json({
      ok: true,
      armed: result.armed,
      dryRun: result.dryRun,
      due: result.due,
      summary: result.summary,
      // The full per-job breakdown is useful in a staging dry-run; keep it.
      dispatched: result.dispatched
    });
  } catch (err) {
    console.error("scheduler-run error:", err && err.message);
    await alertFailure("critical", "Scheduler tick failed", {
      error: (err && err.message) || String(err)
    });
    return res.status(500).json({ error: "Scheduler tick failed" });
  }
};
