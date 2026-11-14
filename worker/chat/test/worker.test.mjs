// Local tests for the chat Worker with a MOCKED upstream. No real key, no network.
import test from "node:test";
import assert from "node:assert/strict";
import worker, { validate, buildPrompt, mem } from "../src/index.js";

const FAKE = "fake-k"; // a placeholder, not a key
const ORIGIN = "https://adventurenlearn.github.io";
const ctx = [{ id: "route:boac-comet-1952", title: "BOAC Comet, London to Johannesburg", kind: "route", reconstruction: true, text: "First jet airliner service, 2 May 1952.", sources: ["Example source"] }];
const req = (body, origin = ORIGIN, extra = {}) => new Request("https://w.example/chat", { method: "POST", headers: Object.assign({ origin, "content-type": "application/json", "cf-connecting-ip": "1.2.3.4" }, extra), body: typeof body === "string" ? body : JSON.stringify(body) });
const baseEnv = () => ({ ALLOWED_ORIGINS: ORIGIN, XAI_API_KEY: FAKE, DAILY_CAP: "3", RATE_PER_MINUTE: "100", XAI_URL: "https://upstream.invalid/v1/chat/completions" });
function mockFetch(reply, status = 200) {
  const calls = [];
  globalThis.fetch = async (url, init) => { calls.push({ url, init }); return new Response(JSON.stringify(reply), { status }); };
  return calls;
}
const reset = () => { mem.hits.clear(); mem.day = ""; mem.count = 0; };

test("validate rejects bad input", () => {
  assert.equal(validate(null), "bad json");
  assert.match(validate({ question: "", context: [] }), /question/);
  assert.match(validate({ question: "x".repeat(501), context: [] }), /question/);
  assert.match(validate({ question: "q", context: [{ id: "bad id", title: "t" }] }), /bad context/);
  assert.equal(validate({ question: "q", context: ctx }), null);
});
test("prompt contains only the given entries", () => {
  const p = buildPrompt("When?", ctx);
  assert.match(p, /\[route:boac-comet-1952\]/); assert.match(p, /\(reconstruction\)/); assert.match(p, /Question: When\?/);
});
test("CORS: allowed origin gets headers, others are refused", async () => {
  reset(); mockFetch({ choices: [{ message: { content: "x [route:boac-comet-1952]" } }] });
  const pre = await worker.fetch(new Request("https://w.example/chat", { method: "OPTIONS", headers: { origin: ORIGIN } }), baseEnv());
  assert.equal(pre.status, 204); assert.equal(pre.headers.get("access-control-allow-origin"), ORIGIN);
  const bad = await worker.fetch(req({ question: "q", context: ctx }, "https://evil.example"), baseEnv());
  assert.equal(bad.status, 403); assert.equal(bad.headers.get("access-control-allow-origin"), null);
});
test("grounded answer passes through; key goes only to upstream header", async () => {
  reset(); const calls = mockFetch({ choices: [{ message: { content: "It began in 1952 [route:boac-comet-1952]." } }], usage: { prompt_tokens: 300, completion_tokens: 20 } });
  const r = await worker.fetch(req({ question: "When did the Comet start?", context: ctx }), baseEnv());
  assert.equal(r.status, 200); const j = await r.json();
  assert.match(j.answer, /\[route:boac-comet-1952\]/); assert.equal(j.usage.prompt_tokens, 300);
  assert.equal(calls.length, 1); assert.equal(calls[0].init.headers.authorization, "Bearer " + FAKE);
  assert.ok(!JSON.stringify(j).includes(FAKE));
  const sent = JSON.parse(calls[0].init.body); assert.equal(sent.max_tokens, 400); assert.equal(sent.messages[0].role, "system");
});
test("no context -> [UNKNOWN] without calling upstream", async () => {
  reset(); const calls = mockFetch({});
  const j = await (await worker.fetch(req({ question: "Who built Atlantis?", context: [] }), baseEnv())).json();
  assert.match(j.answer, /^\[UNKNOWN\]/); assert.equal(calls.length, 0);
});
test("daily cap and rate limit return 429", async () => {
  reset(); mockFetch({ choices: [{ message: { content: "ok [route:boac-comet-1952]" } }] });
  const env = baseEnv();
  for (let i = 0; i < 3; i++) assert.equal((await worker.fetch(req({ question: "q", context: ctx }), env)).status, 200);
  assert.equal((await worker.fetch(req({ question: "q", context: ctx }), env)).status, 429);
  reset(); const env2 = Object.assign(baseEnv(), { RATE_PER_MINUTE: "2", DAILY_CAP: "100" });
  assert.equal((await worker.fetch(req({ question: "q", context: ctx }), env2)).status, 200);
  assert.equal((await worker.fetch(req({ question: "q", context: ctx }), env2)).status, 200);
  const r = await worker.fetch(req({ question: "q", context: ctx }), env2); assert.equal(r.status, 429); assert.equal(r.headers.get("retry-after"), "60");
});
test("rate limiter binding is used when present", async () => {
  reset(); mockFetch({ choices: [{ message: { content: "ok" } }] });
  const env = Object.assign(baseEnv(), { RATE_LIMITER: { limit: async () => ({ success: false }) } });
  assert.equal((await worker.fetch(req({ question: "q", context: ctx }), env)).status, 429);
});
test("oversized body is refused; missing key is 503; upstream failure is 502", async () => {
  reset(); mockFetch({});
  assert.equal((await worker.fetch(req("x".repeat(20000)), baseEnv())).status, 413);
  const env = baseEnv(); delete env.XAI_API_KEY;
  assert.equal((await worker.fetch(req({ question: "q", context: ctx }), env)).status, 503);
  mockFetch({ error: "boom" }, 500);
  assert.equal((await worker.fetch(req({ question: "q", context: ctx }), baseEnv())).status, 502);
  globalThis.fetch = async () => { throw new Error("down"); };
  assert.equal((await worker.fetch(req({ question: "q", context: ctx }), baseEnv())).status, 502);
});
test("health reports configuration without revealing the key", async () => {
  const j = await (await worker.fetch(new Request("https://w.example/health"), baseEnv())).json();
  assert.deepEqual(j, { ok: true, configured: true });
});
