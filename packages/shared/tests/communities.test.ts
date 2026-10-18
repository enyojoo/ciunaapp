import assert from "node:assert/strict"
import { test } from "node:test"
import { COMMUNITY_IDS, MAX_STORE_COMMUNITIES, cleanCommunities, isCommunityId } from "../src/hub/communities"

test("known ids are accepted, anything else is not", () => {
  assert.ok(isCommunityId("nigerian"))
  assert.ok(!isCommunityId("Nigerian"))
  assert.ok(!isCommunityId(undefined))
  assert.equal(new Set(COMMUNITY_IDS).size, COMMUNITY_IDS.length)
})

test("cleanCommunities drops unknown and repeated ids and caps the count", () => {
  assert.deepEqual(cleanCommunities(["chinese", "nope", "chinese", "indian"]), ["chinese", "indian"])
  assert.deepEqual(cleanCommunities(null), [])
  assert.equal(cleanCommunities([...COMMUNITY_IDS]).length, MAX_STORE_COMMUNITIES)
})
