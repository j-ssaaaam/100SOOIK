import { readFile } from "node:fs/promises";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const teacherPassword = process.env.TEACHER_INITIAL_PASSWORD;
const teacherEmail = process.env.TEACHER_AUTH_EMAIL;
const authPasswordForPin = (pin) => `bp-${pin}`;

if (!supabaseUrl || !serviceRoleKey || !teacherPassword || !teacherEmail) {
  throw new Error("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TEACHER_INITIAL_PASSWORD, TEACHER_AUTH_EMAIL을 먼저 설정해 주세요.");
}

const headers = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "content-type": "application/json" };
const rest = async (path, init = {}) => {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`${path}: ${response.status} ${text}`);
  return data;
};
const admin = async (path, init = {}) => {
  const response = await fetch(`${supabaseUrl}${path}`, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`${path}: ${response.status} ${text}`);
  return data;
};
const users = async () => (await admin("/auth/v1/admin/users?per_page=1000")).users ?? [];
const ensureUser = async (email, password, appMetadata = {}, resetExistingPassword = false) => {
  const existing = (await users()).find((user) => user.email === email);
  if (existing) {
    if (resetExistingPassword) await admin(`/auth/v1/admin/users/${existing.id}`, { method: "PUT", body: JSON.stringify({ password, email_confirm: true }) });
    return existing;
  }
  return admin("/auth/v1/admin/users", { method: "POST", body: JSON.stringify({ email, password, email_confirm: true, app_metadata: appMetadata }) });
};

const classes = await rest("classes?name=eq.6학년%202반&limit=1");
const classRow = classes[0] ?? (await rest("classes", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ name: "6학년 2반", grade: 6, school_year: 2026 }) }))[0];
const teacher = await ensureUser(teacherEmail, teacherPassword, { role: "teacher" });
await rest("teachers", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: teacher.id, name: "김선생님" }) });

const numbers = [...Array.from({ length: 8 }, (_, index) => index + 1), ...Array.from({ length: 9 }, (_, index) => index + 31)];
for (const studentNumber of numbers) {
  const email = `student-${studentNumber}@student.bakjumsu.local`;
  const user = await ensureUser(email, authPasswordForPin("000"), {}, true);
  await rest("students", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: user.id, class_id: classRow.id, student_number: studentNumber, name: `${studentNumber}번 학생`, auth_email: email, must_change_password: true, failed_login_count: 0, is_active: true }) });
}

const questions = JSON.parse(await readFile(new URL("../supabase/seed/sample-questions.json", import.meta.url), "utf8"));
await rest("questions", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(questions) });
console.log(`Supabase seed 완료: 학생 ${numbers.length}명, 교사 1명, 문항 ${questions.length}개`);
