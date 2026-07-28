import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the 백점수익 landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /백점수익/);
  assert.match(html, /나의 번호를/);
  assert.match(html, /교사 입장/);
  assert.doesNotMatch(html, /Your site is taking shape|Moodlog|마음로그|codex-preview/i);
});

test("keeps the first version centered on numbered students and server routes", async () => {
  const [page, readme, migration, seed] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/001_initial.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/seed/sample-questions.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /student-grid/);
  assert.match(page, /studentNumber/);
  assert.match(page, /chatbot-panel/);
  assert.match(page, /handleChatAnswer/);
  assert.match(readme, /1번~8번/);
  assert.match(readme, /31번~39번/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /learning_records_owner_read/);
  assert.match(migration, /student_login_roster/);
  const seededQuestions = JSON.parse(seed);
  assert.deepEqual(seededQuestions.map((question) => question.id), [
    "grade5-semester1-fraction-q1",
    "grade6-semester1-decimal-q1",
    "grade6-semester1-ratio-q1",
  ]);
  assert.ok(seededQuestions.every((question) => question.is_active && question.diagnostic_nodes.length > 0));
});
