#!/usr/bin/env node
// Read-only load test for browse and search (launch-readiness.md section 5). It sends GET requests only.
// Run it against staging. A production URL is refused unless ALLOW_PRODUCTION=1.
//   LOAD_BASE_URL=https://api-staging.example.com CONCURRENCY=20 DURATION=60 node scripts/load-test.mjs
// Exit code 1 when p95 or the error rate is over budget (P95_MS, default 800; MAX_ERROR_RATE, default 0.01).
// 429 answers are counted separately: they prove the rate limit works and do not count as errors.
const base = (process.env.LOAD_BASE_URL || "").replace(/\/$/, "")
if (!base) { console.error("Set LOAD_BASE_URL (staging API origin)"); process.exit(2) }
if (!/localhost|127\.0\.0\.1|staging|preview|\.test\b/i.test(base) && process.env.ALLOW_PRODUCTION !== "1") {
  console.error("Refusing to load test a URL that does not look like staging. Set ALLOW_PRODUCTION=1 to override."); process.exit(2)
}
const concurrency = Number(process.env.CONCURRENCY || 10)
const seconds = Number(process.env.DURATION || 30)
const p95Budget = Number(process.env.P95_MS || 800)
const maxErrorRate = Number(process.env.MAX_ERROR_RATE || 0.01)
const paths = [
  "/api/hub/service-lines", "/api/hub/vendors?service_line=food", "/api/hub/vendors?service_line=mart", "/api/hub/search?q=rice",
  "/api/hub/search?q=jollof", "/api/expert/profiles", "/api/expert/catalog-services", "/api/platform/public-flags",
]
const times = []
let ok = 0, limited = 0, errors = 0
const end = Date.now() + seconds * 1000
async function worker(i) {
  let n = i
  while (Date.now() < end) {
    const path = paths[n++ % paths.length]
    const t = performance.now()
    try {
      const r = await fetch(base + path, { headers: { "x-load-test": "1" } })
      times.push(performance.now() - t)
      if (r.status === 429) limited++
      else if (r.ok) ok++
      else errors++
      await r.arrayBuffer()
    } catch { errors++ }
  }
}
await Promise.all(Array.from({ length: concurrency }, (_, i) => worker(i)))
times.sort((a, b) => a - b)
const q = (p) => Math.round(times[Math.min(times.length - 1, Math.floor(times.length * p))] || 0)
const total = ok + limited + errors
const errRate = total ? errors / total : 1
console.log(`${total} requests in ${seconds}s at ${concurrency} concurrent: ${ok} ok, ${limited} rate-limited (429), ${errors} errors`)
console.log(`latency ms: p50 ${q(0.5)}, p95 ${q(0.95)}, p99 ${q(0.99)}, max ${Math.round(times.at(-1) || 0)}`)
const fail = q(0.95) > p95Budget || errRate > maxErrorRate
console.log(fail ? `FAIL: budget is p95 under ${p95Budget} ms and errors under ${maxErrorRate * 100}%` : "within budget")
process.exit(fail ? 1 : 0)
