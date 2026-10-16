import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { isMissingSchemaError, resetSafeSelectCache, safeSelect, stripNewColumns } from "../../lib/safe-select"

beforeEach(() => resetSafeSelectCache())

/** Fake query builder: errors like PostgREST when the select list names a column in `missing`. */
function fake(missing: string[], code = "42703") {
  const calls: string[] = []
  const build = (cols: string) => {
    calls.push(cols)
    const bad = missing.find((m) => cols.split(",").map((c) => c.trim()).includes(m))
    return Promise.resolve(bad ? { data: null, error: { code, message: `column x.${bad} does not exist` } } : { data: [{ id: 1 }], error: null })
  }
  return { calls, build }
}

test("strips only known-new columns and keeps * and base columns", () => {
  assert.equal(stripNewColumns("id, name, rating_avg, rating_count, translations, merchant_id"), "id, name")
  assert.equal(stripNewColumns("*"), "*")
  assert.equal(stripNewColumns("id, rating_avg:avg"), "id")
})

test("recognises the missing column and table error shapes", () => {
  for (const code of ["42703", "42P01", "PGRST204", "PGRST205"]) assert.equal(isMissingSchemaError({ code, message: "x" }), true)
  assert.equal(isMissingSchemaError({ code: "23505", message: "dup" }), false)
  assert.equal(isMissingSchemaError(null), false)
})

for (const code of ["42703", "42P01", "PGRST204", "PGRST205"]) {
  test(`${code}: retries once with the base columns and returns data`, async () => {
    const f = fake(["rating_avg"], code)
    const r = await safeSelect("hub_vendors", "id, name, rating_avg, rating_count", f.build)
    assert.equal(r.error, null)
    assert.deepEqual(f.calls, ["id, name, rating_avg, rating_count", "id, name"])
  })
}

test("a healthy database is queried once with the full list", async () => {
  const f = fake([])
  await safeSelect("hub_vendors", "id, rating_avg", f.build)
  assert.deepEqual(f.calls, ["id, rating_avg"])
})

test("the discovered capability is cached, then re-probed after a minute", async () => {
  const f = fake(["rating_avg"])
  const t = 1_000_000
  await safeSelect("expert_profiles", "id, rating_avg", f.build, t)
  await safeSelect("expert_profiles", "id, rating_avg", f.build, t + 30_000)
  assert.deepEqual(f.calls, ["id, rating_avg", "id", "id"])
  await safeSelect("expert_profiles", "id, rating_avg", f.build, t + 61_000)
  assert.equal(f.calls.length, 5)
})

test("unrelated errors are returned untouched without a retry", async () => {
  const calls: string[] = []
  const r = await safeSelect("hub_vendors", "id, rating_avg", (c) => (calls.push(c), Promise.resolve({ data: null, error: { code: "57014", message: "timeout" } })))
  assert.equal(r.error?.code, "57014")
  assert.equal(calls.length, 1)
})

test("a failing base query still surfaces its error (no infinite retry)", async () => {
  const calls: string[] = []
  const r = await safeSelect("t", "id, rating_avg", (c) => (calls.push(c), Promise.resolve({ data: null, error: { code: "42P01", message: "relation t does not exist" } })))
  assert.ok(r.error)
  assert.equal(calls.length, 2)
})

test("filters on base columns keep working when new columns are absent", async () => {
  const rows = [{ id: "a", is_published: true }, { id: "b", is_published: false }]
  const build = (cols: string) =>
    Promise.resolve(cols.includes("merchant_id") ? { data: null, error: { code: "42703", message: "column merchant_id does not exist" } } : { data: rows.filter((r) => r.is_published), error: null })
  const r = await safeSelect("hub_vendors", "id, merchant_id", build)
  assert.deepEqual(r.data, [{ id: "a", is_published: true }])
})
