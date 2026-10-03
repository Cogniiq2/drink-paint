/* Workers-runtime checks that the browser suite cannot cover: signed Stripe webhooks, cron, QR output.
   Expects two local Workers: QA_BASE_URL (no Stripe) and QA_STRIPE_URL (dummy STRIPE_* vars).
   Usage: QA_BASE_URL=http://127.0.0.1:8787 QA_STRIPE_URL=http://127.0.0.1:8789 node scripts/qa-worker.mjs */
import Stripe from "stripe";

const base = process.env.QA_BASE_URL ?? "http://127.0.0.1:8787";
const stripeBase = process.env.QA_STRIPE_URL ?? "http://127.0.0.1:8789";
const secret = process.env.QA_WEBHOOK_SECRET ?? "whsec_test_secret_123";
const cronSecret = process.env.QA_CRON_SECRET ?? "local-cron-secret-123456";
let failed = 0;
const check = (name, ok, info = "") => { if (!ok) failed++; console.log(`${ok ? "PASS" : "FAIL"} ${name} ${info}`); };

const post = (type, data, { id = `evt_${type.replace(/\W/g, "")}_${Date.now()}_${Math.random().toString(36).slice(2)}`, sign = true, extra = {} } = {}) => {
  const payload = JSON.stringify({ id, object: "event", api_version: "2024-06-20", created: Math.floor(Date.now() / 1000), type, data: { object: data }, livemode: false, pending_webhooks: 1, request: { id: null, idempotency_key: null }, ...extra });
  const header = sign ? Stripe.webhooks.generateTestHeaderString({ payload, secret }) : "t=1,v1=deadbeef";
  return { id, payload, res: fetch(`${stripeBase}/api/stripe/webhook`, { method: "POST", headers: { "stripe-signature": header, "content-type": "application/json" }, body: payload }) };
};

// 1. Signature verification
const bad = await post("charge.refunded", { object: "charge", payment_intent: "pi_x", refunded: true }, { sign: false }).res;
check("webhook rejects bad signature", bad.status === 400, String(bad.status));
const noSig = await fetch(`${stripeBase}/api/stripe/webhook`, { method: "POST", body: "{}" });
check("webhook rejects missing signature", noSig.status === 400, String(noSig.status));

// 2. Valid signature accepted
const ok = post("charge.refunded", { id: "ch_1", object: "charge", payment_intent: "pi_unknown", refunded: true });
const okRes = await ok.res;
const okBody = await okRes.text();
check("webhook accepts valid signature", okRes.status === 200 && okBody.includes("received"), `${okRes.status} ${okBody}`);

// 3. Idempotency: replaying the same event id is a no-op
const dupHeader = Stripe.webhooks.generateTestHeaderString({ payload: ok.payload, secret });
const dup = await fetch(`${stripeBase}/api/stripe/webhook`, { method: "POST", headers: { "stripe-signature": dupHeader, "content-type": "application/json" }, body: ok.payload });
const dupBody = await dup.json();
check("webhook is idempotent per event id", dup.status === 200 && dupBody.duplicate === true, JSON.stringify(dupBody));

// 4. Unknown order on completion: processing error releases the idempotency record so Stripe can retry
const fail = post("checkout.session.completed", { id: "cs_1", object: "checkout.session", payment_status: "paid", metadata: { orderId: "00000000-0000-0000-0000-000000000000" }, payment_intent: "pi_1" });
const failRes = await fail.res;
check("webhook returns 500 for unknown order (Stripe retries)", failRes.status === 500, String(failRes.status));
const retry = await fetch(`${stripeBase}/api/stripe/webhook`, { method: "POST", headers: { "stripe-signature": Stripe.webhooks.generateTestHeaderString({ payload: fail.payload, secret }), "content-type": "application/json" }, body: fail.payload });
check("failed event is not marked processed (retry runs again)", retry.status === 500, String(retry.status));

// 5. Cron endpoint
const noAuth = await fetch(`${base}/api/cron/reminders`);
check("cron route rejects missing bearer", noAuth.status === 401, String(noAuth.status));
const cron = await fetch(`${base}/api/cron/reminders`, { headers: { authorization: `Bearer ${cronSecret}` } });
const cronBody = await cron.text();
check("cron route accepts bearer", cron.status === 200 && cronBody.includes("due"), `${cron.status} ${cronBody}`);
const sched = await fetch(`${base}/cdn-cgi/handler/scheduled?cron=0+*+*+*+*`);
check("scheduled() trigger runs", sched.status === 200, String(sched.status));

console.log(failed ? `\n${failed} FAILED` : "\nall passed");
process.exit(failed ? 1 : 0);
