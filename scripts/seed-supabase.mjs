import { readFile } from "node:fs/promises";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const teacherPassword = process.env.TEACHER_INITIAL_PASSWORD;
const teacherEmail = process.env.TEACHER_AUTH_EMAIL;
const authPasswordForPin = (pin) => `bp-${pin}`;
const resetStudentPasswords = process.env.RESET_STUDENT_PASSWORDS === "true";

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
  const user = await ensureUser(email, authPasswordForPin("000"), {}, resetStudentPasswords);
  const existingStudents = await rest(`students?id=eq.${user.id}&select=id&limit=1`);
  if (existingStudents.length === 0) {
    await rest("students", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ id: user.id, class_id: classRow.id, student_number: studentNumber, name: `${studentNumber}번 학생`, auth_email: email, must_change_password: true, failed_login_count: 0, is_active: true }) });
  } else if (resetStudentPasswords) {
    await rest(`students?id=eq.${user.id}`, { method: "PATCH", body: JSON.stringify({ must_change_password: true, failed_login_count: 0, locked_until: null, updated_at: new Date().toISOString() }) });
  }
}

const pdfQuestionCatalog = [
  ["자연수÷자연수의 몫을 분수로 나타내어 볼까요 (1)", 2, 1, "1 ÷ 7을 그림에 나타내고, 몫을 구해 보세요.", ["1/7"]],
  ["자연수÷자연수의 몫을 분수로 나타내어 볼까요 (1)", 2, 2, "그림을 보고 3 ÷ 4의 몫을 구해 보세요.", ["3/4"]],
  ["자연수÷자연수의 몫을 분수로 나타내어 볼까요 (1)", 3, 3, "1 ÷ 4, 1 ÷ 6, 5 ÷ 8, 7 ÷ 12의 몫을 분수로 나타내어 보세요.", ["1/4, 1/6, 5/8, 7/12"]],
  ["자연수÷자연수의 몫을 분수로 나타내어 볼까요 (1)", 3, 4, "6 ÷ 13을 분수로 나타내어 보세요.", ["6/13"]],
  ["자연수÷자연수의 몫을 분수로 나타내어 볼까요 (1)", 3, 5, "나눗셈의 몫을 분수로 옳게 나타낸 사람의 이름을 써 보세요.", ["규민"]],
  ["자연수÷자연수의 몫을 분수로 나타내어 볼까요 (1)", 3, 6, "페인트 2 L를 통 5개에 똑같이 나누어 담을 때 한 통의 양을 분수로 나타내어 보세요.", ["2/5"]],
  ["자연수÷자연수의 몫을 분수로 나타내어 볼까요 (2)", 4, 1, "3 ÷ 2의 몫을 두 가지 방법으로 나타내어 보세요.", ["3/2", "1과 1/2", "1 1/2"]],
  ["자연수÷자연수의 몫을 분수로 나타내어 볼까요 (2)", 5, 2, "8 ÷ 5, 9 ÷ 4, 13 ÷ 3, 20 ÷ 11의 몫을 분수로 나타내어 보세요.", ["8/5, 9/4, 13/3, 20/11"]],
  ["자연수÷자연수의 몫을 분수로 나타내어 볼까요 (2)", 5, 3, "몫이 1보다 큰 나눗셈을 모두 찾아 기호를 써 보세요.", ["㉠, ㉢", "1, 3"]],
  ["자연수÷자연수의 몫을 분수로 나타내어 볼까요 (2)", 5, 4, "몫의 크기를 비교하여 >, =, < 중 알맞은 기호를 써 보세요.", []],
  ["자연수÷자연수의 몫을 분수로 나타내어 볼까요 (2)", 5, 5, "둘레가 15 cm인 마름모의 한 변의 길이를 분수로 나타내어 보세요.", ["15/4"]],
  ["자연수÷자연수의 몫을 분수로 나타내어 볼까요 (2)", 5, 6, "어떤 수를 7로 나누어야 할 것을 잘못하여 곱했더니 63이 되었습니다. 옳게 계산한 값을 분수로 나타내어 보세요.", ["9/7"]],
  ["분수÷자연수를 알아볼까요", 6, 1, "11/6 ÷ 2의 몫을 구해 보세요.", ["11/12"]],
  ["분수÷자연수를 알아볼까요", 6, 2, "5/6 ÷ 3을 계산해 보세요.", ["5/18"]],
  ["분수÷자연수를 알아볼까요", 7, 3, "17/11 ÷ 5를 계산해 보세요.", ["17/55"]],
  ["분수÷자연수를 알아볼까요", 7, 4, "12/7 ÷ 6을 계산해 보세요.", ["2/7"]],
  ["분수÷자연수를 알아볼까요", 7, 5, "1/15, 2/5, 4/15 중 가장 작은 수를 5로 나눈 몫을 구해 보세요.", ["1/75"]],
  ["분수÷자연수를 알아볼까요", 7, 6, "넓이가 11/15 m²인 텃밭을 똑같이 둘로 나눈 한 부분의 넓이를 구해 보세요.", ["11/30"]],
  ["분수÷자연수를 분수의 곱셈으로 나타내어 볼까요", 8, 1, "3/4 ÷ 8을 계산해 보세요.", ["3/32"]],
  ["분수÷자연수를 분수의 곱셈으로 나타내어 볼까요", 8, 2, "2와 1/3 ÷ 6을 계산해 보세요.", ["7/18"]],
  ["분수÷자연수를 분수의 곱셈으로 나타내어 볼까요", 9, 3, "분수의 나눗셈과 곱셈으로 나타낸 식을 서로 연결해 보세요.", []],
  ["분수÷자연수를 분수의 곱셈으로 나타내어 볼까요", 9, 4, "분수를 자연수로 나눈 몫을 빈 곳에 써넣으세요.", []],
  ["분수÷자연수를 분수의 곱셈으로 나타내어 볼까요", 9, 5, "5/6 ÷ 4, 3/8 ÷ 9, 7/12 ÷ 2의 몫을 큰 것부터 차례대로 써 보세요.", ["7/12 ÷ 2, 5/6 ÷ 4, 3/8 ÷ 9"]],
  ["분수÷자연수를 분수의 곱셈으로 나타내어 볼까요", 9, 6, "14/15 kg의 찰흙을 5명에게 똑같이 나누어 줄 때 한 명의 양을 구해 보세요.", ["14/75"]],
  ["대분수÷자연수를 알아볼까요", 10, 1, "3과 1/4 ÷ 3을 두 가지 방법으로 계산해 보세요.", ["13/12", "1과 1/12", "1 1/12"]],
  ["대분수÷자연수를 알아볼까요", 10, 2, "1과 9/10 ÷ 7을 계산해 보세요.", ["19/70"]],
  ["대분수÷자연수를 알아볼까요", 11, 3, "2와 5/6 ÷ 2, 3과 1/3 ÷ 4를 계산해 보세요.", ["17/12, 5/6"]],
  ["대분수÷자연수를 알아볼까요", 11, 4, "몫이 다른 나눗셈을 찾아 보세요.", []],
  ["대분수÷자연수를 알아볼까요", 11, 5, "4와 5/7 ÷ 4와 4와 3/8 ÷ 5의 몫의 차를 구해 보세요.", ["17/56"]],
  ["대분수÷자연수를 알아볼까요", 11, 6, "1과 10/12 ÷ 5의 잘못된 계산을 찾아 옳게 계산해 보세요.", ["11/30"]],
];

const genericDiagnosticNodes = (prefix) => [
  { id: `${prefix}-q1`, stage: 1, type: "SHORT_TEXT", question: "문제에서 무엇을 구해야 하는지, 네 말로 적어 보세요.", options: [{ value: "*", nextNodeId: `${prefix}-q2` }] },
  { id: `${prefix}-q2`, stage: 1, type: "SHORT_TEXT", question: "문제를 풀 때 가장 먼저 확인할 수는 무엇인가요?", options: [{ value: "*", nextNodeId: `${prefix}-q3`, concept: "구하려는 것과 문제에 나온 수를 먼저 확인해요." }] },
  { id: `${prefix}-q3`, stage: 2, type: "SHORT_TEXT", question: "어떤 계산 방법을 사용할지, 이유와 함께 적어 보세요.", options: [{ value: "*", nextNodeId: `${prefix}-q4`, concept: "나눗셈에서는 나누어지는 수와 나누는 수의 관계를 살펴봐요." }] },
  { id: `${prefix}-q4`, stage: 3, type: "SHORT_TEXT", question: "비슷하지만 더 쉬운 문제를 하나 떠올려 계산해 보세요.", options: [{ value: "*", nextNodeId: "retry", example: "작은 수로 먼저 계산한 뒤, 원래 문제의 수에 같은 방법을 적용해 보세요." }] },
];

const workbookPdfCatalog = [
  { semester: 1, unitNumber: 2, unit: "각기둥과 각뿔", file: "math_ikhim_6-1-2.pdf", pageOffset: 20, lessons: ["단원 준비 · 21쪽", "각기둥을 알아볼까요 (1) · 22쪽", "각기둥을 알아볼까요 (1) 추가 문제 · 23쪽", "각기둥을 알아볼까요 (2) · 24쪽", "각기둥을 알아볼까요 (2) 추가 문제 · 25쪽", "각기둥의 전개도를 알아볼까요 · 26쪽", "각기둥의 전개도 추가 문제 · 27쪽", "각기둥의 전개도 추가 문제 · 28쪽", "각기둥의 전개도 추가 문제 · 29쪽", "각뿔을 알아볼까요 (1) · 30쪽", "각뿔을 알아볼까요 (1) 추가 문제 · 31쪽", "각뿔을 알아볼까요 (2) · 32쪽", "각뿔을 알아볼까요 (2) 추가 문제 · 33쪽", "단원 정리 · 34쪽"] },
  { semester: 1, unitNumber: 3, unit: "소수의 나눗셈", file: "math_ikhim_6-1-3.pdf", pageOffset: 34, lessons: ["단원 준비 · 35쪽", "소수 ÷ 자연수를 알아볼까요 (1) · 36쪽", "소수 ÷ 자연수를 알아볼까요 (1) 추가 문제 · 37쪽", "소수 ÷ 자연수를 알아볼까요 (2) · 38쪽", "소수 ÷ 자연수를 알아볼까요 (2) 추가 문제 · 39쪽", "소수 ÷ 자연수를 알아볼까요 (3) · 40쪽", "소수 ÷ 자연수를 알아볼까요 (3) 추가 문제 · 41쪽", "소수 ÷ 자연수를 알아볼까요 (4) · 42쪽", "소수 ÷ 자연수를 알아볼까요 (4) 추가 문제 · 43쪽", "소수 ÷ 자연수를 알아볼까요 (5) · 44쪽", "소수 ÷ 자연수를 알아볼까요 (5) 추가 문제 · 45쪽", "자연수 ÷ 자연수의 몫을 소수로 나타내어 볼까요 · 46쪽", "자연수 ÷ 자연수의 몫을 소수로 나타내어 볼까요 추가 문제 · 47쪽", "몫의 소수점 위치를 확인해 볼까요 · 48쪽", "몫의 소수점 위치를 확인해 볼까요 추가 문제 · 49쪽", "단원 정리 · 50쪽"] },
  { semester: 1, unitNumber: 4, unit: "비와 비율", file: "math_ikhim_6-1-4.pdf", pageOffset: 50, lessons: ["단원 준비 · 51쪽", "두 수를 비교해 볼까요 · 52쪽", "두 수를 비교해 볼까요 추가 문제 · 53쪽", "비를 알아볼까요 · 54쪽", "비를 알아볼까요 추가 문제 · 55쪽", "비율을 알아볼까요 · 56쪽", "비율을 알아볼까요 추가 문제 · 57쪽", "비율이 사용되는 경우를 알아볼까요 · 58쪽", "비율이 사용되는 경우를 알아볼까요 추가 문제 · 59쪽", "백분율을 알아볼까요 · 60쪽", "백분율을 알아볼까요 추가 문제 · 61쪽", "백분율이 사용되는 경우를 알아볼까요 · 62쪽", "백분율이 사용되는 경우를 알아볼까요 추가 문제 · 63쪽", "단원 정리 · 64쪽"] },
  { semester: 1, unitNumber: 5, unit: "여러 가지 그래프", file: "math_ikhim_6-1-5.pdf", pageOffset: 64, lessons: ["단원 준비 · 65쪽", "띠그래프와 원그래프를 알아볼까요 · 66쪽", "띠그래프와 원그래프를 알아볼까요 추가 문제 · 67쪽", "띠그래프와 원그래프로 나타내는 방법을 알아볼까요 · 68쪽", "띠그래프와 원그래프로 나타내는 방법을 알아볼까요 추가 문제 · 69쪽", "자료를 조사하여 그래프로 나타내어 볼까요 · 70쪽", "자료를 조사하여 그래프로 나타내어 볼까요 추가 문제 · 71쪽", "띠그래프와 원그래프를 해석해 볼까요 · 72쪽", "띠그래프와 원그래프를 해석해 볼까요 추가 문제 · 73쪽", "여러 가지 그래프를 활용해 볼까요 · 74쪽", "여러 가지 그래프를 활용해 볼까요 추가 문제 · 75쪽", "단원 정리 · 76쪽"] },
  { semester: 1, unitNumber: 6, unit: "직육면체의 부피와 겉넓이", file: "math_ikhim_6-1-6.pdf", pageOffset: 76, lessons: ["단원 준비 · 77쪽", "1 cm³를 알아볼까요 · 78쪽", "1 cm³를 알아볼까요 추가 문제 · 79쪽", "직육면체의 부피를 구하는 방법을 알아볼까요 · 80쪽", "직육면체의 부피를 구하는 방법을 알아볼까요 추가 문제 · 81쪽", "1 m³를 알아볼까요 · 82쪽", "1 m³를 알아볼까요 추가 문제 · 83쪽", "직육면체의 겉넓이를 구하는 방법을 알아볼까요 · 84쪽", "직육면체의 겉넓이를 구하는 방법을 알아볼까요 추가 문제 · 85쪽", "단원 정리 · 86쪽"] },
  { semester: 2, unitNumber: 1, unit: "분수의 나눗셈", file: "math_ikhim_6-2-1.pdf", pageOffset: 8, lessons: ["단원 준비 · 9쪽", "분모가 같은 분수 ÷ 분수를 알아볼까요 (1) · 10쪽", "분모가 같은 분수 ÷ 분수 추가 문제 · 11쪽", "분모가 같은 분수 ÷ 분수를 알아볼까요 (2) · 12쪽", "분모가 같은 분수 ÷ 분수 추가 문제 · 13쪽", "분모가 다른 분수 ÷ 분수를 알아볼까요 · 14쪽", "분모가 다른 분수 ÷ 분수 추가 문제 · 15쪽", "자연수 ÷ 분수를 알아볼까요 · 16쪽", "자연수 ÷ 분수 추가 문제 · 17쪽", "분수 ÷ 분수를 분수 × 분수로 나타내어 볼까요 · 18쪽", "분수 ÷ 분수 추가 문제 · 19쪽", "분수 ÷ 분수를 구해 볼까요 · 20쪽", "분수 ÷ 분수 추가 문제 · 21쪽", "단원 정리 · 22쪽"] },
  { semester: 2, unitNumber: 2, unit: "소수의 나눗셈", file: "math_ikhim_6-2-2.pdf", pageOffset: 22, lessons: ["단원 준비 · 23쪽", "소수의 나눗셈을 알아볼까요 · 24쪽", "소수의 나눗셈 추가 문제 · 25쪽", "소수 ÷ 소수를 알아볼까요 (1) · 26쪽", "소수 ÷ 소수 추가 문제 · 27쪽", "소수 ÷ 소수를 알아볼까요 (2) · 28쪽", "소수 ÷ 소수 추가 문제 · 29쪽", "자연수 ÷ 소수를 알아볼까요 · 30쪽", "자연수 ÷ 소수 추가 문제 · 31쪽", "몫을 반올림하여 나타내어 볼까요 · 32쪽", "몫을 반올림하여 나타내어 볼까요 추가 문제 · 33쪽", "나누어 주고 남는 양을 알아볼까요 · 34쪽", "나누어 주고 남는 양 추가 문제 · 35쪽", "단원 정리 · 36쪽"] },
  { semester: 2, unitNumber: 3, unit: "공간과 입체", file: "math_ikhim_6-2-3.pdf", pageOffset: 36, lessons: ["단원 준비 · 37쪽", "어느 방향에서 보았을까요 · 38쪽", "어느 방향에서 보았을까요 추가 문제 · 39쪽", "쌓은 모양과 쌓기나무의 개수를 알아볼까요 (1) · 40쪽", "쌓은 모양과 쌓기나무의 개수 추가 문제 · 41쪽", "쌓은 모양과 쌓기나무의 개수를 알아볼까요 (2) · 42쪽", "쌓은 모양과 쌓기나무의 개수 추가 문제 · 43쪽", "쌓은 모양과 쌓기나무의 개수를 알아볼까요 (3) · 44쪽", "쌓은 모양과 쌓기나무의 개수 추가 문제 · 45쪽", "쌓은 모양과 쌓기나무의 개수를 알아볼까요 (4) · 46쪽", "쌓은 모양과 쌓기나무의 개수 추가 문제 · 47쪽", "쌓기나무로 여러 가지 모양을 만들어 볼까요 · 48쪽", "쌓기나무로 여러 가지 모양을 만들어 볼까요 추가 문제 · 49쪽", "단원 정리 · 50쪽"] },
  { semester: 2, unitNumber: 4, unit: "비례식과 비례배분", file: "math_ikhim_6-2-4.pdf", pageOffset: 50, lessons: ["단원 준비 · 51쪽", "비의 성질을 알아볼까요 · 52쪽", "비의 성질 추가 문제 · 53쪽", "간단한 자연수의 비로 나타내어 볼까요 · 54쪽", "간단한 자연수의 비 추가 문제 · 55쪽", "비례식을 알아볼까요 · 56쪽", "비례식 추가 문제 · 57쪽", "비례식의 성질을 알아볼까요 · 58쪽", "비례식의 성질 추가 문제 · 59쪽", "비례식을 활용해 볼까요 · 60쪽", "비례식을 활용해 볼까요 추가 문제 · 61쪽", "비례배분을 해 볼까요 · 62쪽", "비례배분 추가 문제 · 63쪽", "단원 정리 · 64쪽"] },
  { semester: 2, unitNumber: 5, unit: "원의 넓이", file: "math_ikhim_6-2-5.pdf", pageOffset: 64, lessons: ["단원 준비 · 65쪽", "원주와 지름의 관계를 알아볼까요 · 66쪽", "원주와 지름의 관계 추가 문제 · 67쪽", "원주율을 알아볼까요 · 68쪽", "원주율 추가 문제 · 69쪽", "원주와 지름을 구해 볼까요 · 70쪽", "원주와 지름 추가 문제 · 71쪽", "원의 넓이를 어림해 볼까요 · 72쪽", "원의 넓이를 어림해 볼까요 추가 문제 · 73쪽", "원의 넓이를 구하는 방법을 알아볼까요 · 74쪽", "원의 넓이 추가 문제 · 75쪽", "원의 넓이를 활용해 볼까요 · 76쪽", "원의 넓이 활용 추가 문제 · 77쪽", "단원 정리 · 78쪽"] },
  { semester: 2, unitNumber: 6, unit: "원기둥, 원뿔, 구", file: "math_ikhim_6-2-6.pdf", pageOffset: 78, lessons: ["단원 준비 · 79쪽", "원기둥을 알아볼까요 · 80쪽", "원기둥 추가 문제 · 81쪽", "원기둥의 전개도를 알아볼까요 · 82쪽", "원기둥의 전개도 추가 문제 · 83쪽", "원뿔을 알아볼까요 · 84쪽", "원뿔 추가 문제 · 85쪽", "구를 알아볼까요 · 86쪽", "구 추가 문제 · 87쪽", "여러 가지 모양을 만들어 볼까요 · 88쪽", "여러 가지 모양 추가 문제 · 89쪽", "단원 정리 · 90쪽"] },
];

const workbookPdfQuestions = workbookPdfCatalog.flatMap((catalog) => catalog.lessons.flatMap((lesson, pageIndex) => Array.from({ length: 6 }, (_, questionIndex) => {
  const pdfPage = pageIndex + 1;
  const questionNumber = questionIndex + 1;
  const prefix = `workbook-${catalog.semester}-${catalog.unitNumber}-p${pdfPage}-q${questionNumber}`;
  return { id: `grade6-semester${catalog.semester}-unit${catalog.unitNumber}-page${pdfPage}-q${questionNumber}`, grade: 6, semester: catalog.semester, unit: catalog.unit, lesson, page: catalog.pageOffset + pdfPage, question_number: questionNumber, question_text: `${lesson} ${questionNumber}번 문제를 PDF에서 확인하고 풀어 보세요.`, question_image_url: `/${catalog.file}#page=${pdfPage}`, correct_answer: "", accepted_answers: ["*"], concepts: [catalog.unit, lesson.replace(/ · \d+쪽$/, ""), "문제에서 구하는 것 확인", "계산 결과 확인"], diagnostic_start_id: `${prefix}-q1`, diagnostic_nodes: genericDiagnosticNodes(prefix), is_active: true };
})));

const pdfQuestions = pdfQuestionCatalog.map(([, pdfPage, questionNumber, questionText, acceptedAnswers]) => {
  const prefix = `pdf-${questionNumber}-${pdfPage}`;
  return { id: `grade6-semester1-fraction-division-${pdfPage}-${questionNumber}`, grade: 6, semester: 1, unit: "분수의 나눗셈", lesson: `PDF ${pdfPage}쪽`, page: pdfPage + 8, question_number: questionNumber, question_text: questionText, question_image_url: `/math_ikhim_6-1-1.pdf#page=${pdfPage}`, correct_answer: acceptedAnswers[0] ?? "", accepted_answers: acceptedAnswers, concepts: ["문제에서 구하는 것 확인", "나눗셈의 의미", "분수 계산", "계산 결과 확인"], diagnostic_start_id: `${prefix}-q1`, diagnostic_nodes: genericDiagnosticNodes(prefix), is_active: true };
});

const sampleQuestions = JSON.parse(await readFile(new URL("../supabase/seed/sample-questions.json", import.meta.url), "utf8")).map((question) => ({ question_image_url: null, ...question }));
const questions = [...sampleQuestions, ...pdfQuestions, ...workbookPdfQuestions];
await rest("questions", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(questions) });
console.log(`Supabase seed 완료: 학생 ${numbers.length}명, 교사 1명, 문항 ${questions.length}개`);
