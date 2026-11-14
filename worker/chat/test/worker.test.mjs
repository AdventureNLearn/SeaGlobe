// Local tests for the optional pass-through with a MOCKED upstream. No real key, no network.
import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const FAKE = "Bearer placeholder-not-a-key";
const ORIGIN = "https://adventurenlearn.github.io";
const env = { ALLOWED_ORIGINS: ORIGIN, XAI_URL: "https://upstream.invalid/v1/chat/completions" };
const req = (opts = {}) => new Request("https://w.example/", Object.assign({ method: "POST", headers: Object.assign({ origin: ORIGIN, "content-type": "application/json", authorization: FAKE }, opts.headers || {}), body: opts.body === undefined ? "{\"model\":\"m\"}" : opts.body }, opts.method ? { method: opts.method, body: null } : {}));
function mockFetch(status = 200) { const calls = []; globalThis.fetch = async (url, init) => { calls.push({ url, init }); return new Response("{\"choices\":[]}", { status, headers: { "content-type": "application/json" } }); }; return calls; }

test("other origins are refused and nothing is forwarded", async () => {
  const calls = mockFetch();
  const r = await worker.fetch(req({ headers: { origin: "https://evil.example" } }), env);
  assert.equal(r.status, 403); assert.equal(calls.length, 0);
});
test("preflight from the allowed origin", async () => {
  const r = await worker.fetch(new Request("https://w.example/", { method: "OPTIONS", headers: { origin: ORIGIN } }), env);
  assert.equal(r.status, 204); assert.equal(r.headers.get("access-control-allow-origin"), ORIGIN);
});
test("no key: refused, nothing forwarded (the Worker has no key of its own)", async () => {
  const calls = mockFetch();
  const r = await worker.fetch(req({ headers: { authorization: "" } }), env);
  assert.equal(r.status, 401); assert.equal(calls.length, 0);
});
test("the caller's own key is forwarded to the xAI endpoint only, body unchanged, response not cached", async () => {
  const calls = mockFetch();
  const r = await worker.fetch(req(), env);
  assert.equal(r.status, 200); assert.equal(calls.length, 1);
  assert.equal(calls[0].url, env.XAI_URL); assert.equal(calls[0].init.headers.authorization, FAKE); assert.equal(calls[0].init.body, "{\"model\":\"m\"}");
  assert.equal(r.headers.get("cache-control"), "no-store");
});
test("upstream errors pass through", async () => {
  mockFetch(401); const r = await worker.fetch(req(), env); assert.equal(r.status, 401);
});
test("oversized bodies are refused", async () => {
  const calls = mockFetch(); const r = await worker.fetch(req({ body: "x".repeat(70000) }), env);
  assert.equal(r.status, 413); assert.equal(calls.length, 0);
});
