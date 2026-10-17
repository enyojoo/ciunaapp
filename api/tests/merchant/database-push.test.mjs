import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../../../", import.meta.url))
const { PGlite } = await import(process.env.PGLITE_MODULE || "@electric-sql/pglite")
const sql = fs.readFileSync(root + "supabase/migrations/20261018120000_push_tokens.sql", "utf8")
const u1 = "11111111-1111-4111-8111-111111111111"
const u2 = "22222222-2222-4222-8222-222222222222"

async function setup() {
  const db = new PGlite()
  await db.exec("create role service_role; create role anon; create role authenticated;")
  await db.exec(`create table users (id uuid primary key); insert into users values ('${u1}'), ('${u2}');`)
  await db.exec(sql)
  await db.exec(sql) // safe to re-run
  return db
}
const TOKEN = "ExponentPushToken[abcdef123456]"

test("a token is unique, and registering it again moves it to the new user", async () => {
  const db = await setup()
  const up = (u) => db.query("insert into push_tokens(user_id,token,platform) values ($1,$2,'ios') on conflict (token) do update set user_id = excluded.user_id", [u, TOKEN])
  await up(u1)
  await up(u2)
  const rows = (await db.query("select user_id from push_tokens")).rows
  assert.equal(rows.length, 1)
  assert.equal(rows[0].user_id, u2)
})

test("bad platforms and absurd tokens are rejected; deleting a user removes their devices", async () => {
  const db = await setup()
  await assert.rejects(db.query("insert into push_tokens(user_id,token,platform) values ($1,$2,'tv')", [u1, TOKEN]), /check/i)
  await assert.rejects(db.query("insert into push_tokens(user_id,token,platform) values ($1,'short','ios')", [u1]), /check/i)
  await db.query("insert into push_tokens(user_id,token,platform) values ($1,$2,'android')", [u1, TOKEN])
  await db.query("delete from users where id = $1", [u1])
  assert.equal((await db.query("select count(*)::int as n from push_tokens")).rows[0].n, 0)
})

test("push tokens are service-role only", async () => {
  const db = await setup()
  await db.exec("set role anon")
  await assert.rejects(db.query("select * from push_tokens"), /permission denied/)
  await db.exec("reset role")
})
