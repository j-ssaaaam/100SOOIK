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

const diagnosticProfile = (unit) => {
  if (unit.includes("공간과 입체")) return {
    focus: "그림의 방향과 쌓기나무의 위치",
    q1: "그림에서 무엇을 알아내야 하는지, 네 말로 적어 보세요.",
    q2: "그림을 볼 때 위·앞·옆 방향, 층, 쌓기나무 개수 중 무엇을 먼저 확인할까요?",
    q3: "세어 본 내용이나 보이는 방향을 이용해 어떤 방법으로 답을 구할까요?",
    keywords: ["그림", "모양", "방향", "층", "개수", "쌓기", "세"],
    example: "1층에 3개, 2층에 1개가 있다면 전체는 3+1=4개예요.",
  };
  if (unit.includes("각기둥") || unit.includes("각뿔") || unit.includes("원기둥") || unit.includes("원뿔") || unit.includes("구")) return {
    focus: "도형의 모양과 구성 요소",
    q1: "문제에서 찾으려는 도형이나 구성 요소가 무엇인지 적어 보세요.",
    q2: "밑면, 옆면, 모서리, 꼭짓점, 높이 중 어떤 정보를 먼저 살펴볼까요?",
    q3: "도형의 모양과 길이 정보를 이용해 어떤 방법으로 답을 구할까요?",
    keywords: ["도형", "모양", "밑면", "옆면", "모서리", "꼭짓점", "높이", "원"],
    example: "각기둥은 서로 평행하고 합동인 밑면 2개와 옆면을 먼저 찾아볼 수 있어요.",
  };
  if (unit.includes("그래프")) return {
    focus: "그래프의 제목, 눈금, 전체와 부분",
    q1: "그래프에서 무엇을 비교하거나 찾아야 하는지 적어 보세요.",
    q2: "그래프를 읽을 때 제목, 눈금, 전체, 부분 중 무엇을 먼저 확인할까요?",
    q3: "눈금과 자료를 이용해 어떤 수를 비교하거나 계산할까요?",
    keywords: ["그래프", "눈금", "제목", "전체", "부분", "비교", "자료", "막대", "띠", "원"],
    example: "전체가 100명이고 한 부분이 25%라면 그 부분은 25명이에요.",
  };
  if (unit.includes("비와 비율") || unit.includes("비례식")) return {
    focus: "비교하는 양과 기준이 되는 양",
    q1: "문제에서 비교하는 두 양이 무엇인지 적어 보세요.",
    q2: "비교하는 양과 기준량 중 어느 양을 먼저 정해야 할까요?",
    q3: "비나 비율을 구하려면 어떤 식을 세워야 할까요?",
    keywords: ["비", "비율", "비례", "기준", "비교", "전체", "양"],
    example: "전체 20명 중 8명을 비교하면 비교하는 양은 8, 기준량은 20이에요.",
  };
  if (unit.includes("원의 넓이")) return {
    focus: "반지름, 지름, 원주율의 관계",
    q1: "원의 문제에서 무엇을 구해야 하는지 적어 보세요.",
    q2: "반지름, 지름, 원주, 원주율 중 문제에 주어진 것과 필요한 것을 찾아볼까요?",
    q3: "원의 넓이나 원주를 구하려면 어떤 식을 사용할까요?",
    keywords: ["원", "반지름", "지름", "원주", "원주율", "넓이", "둘레"],
    example: "반지름이 3 cm인 원의 넓이는 원주율×3×3으로 생각할 수 있어요.",
  };
  if (unit.includes("부피") || unit.includes("겉넓이")) return {
    focus: "가로, 세로, 높이와 단위",
    q1: "직육면체 문제에서 무엇을 구해야 하는지 적어 보세요.",
    q2: "가로, 세로, 높이와 단위 중 어떤 정보를 먼저 확인할까요?",
    q3: "부피나 겉넓이를 구하려면 어떤 면이나 모서리를 계산해야 할까요?",
    keywords: ["부피", "겉넓이", "가로", "세로", "높이", "단위", "cm", "m"],
    example: "가로 2, 세로 3, 높이 4인 직육면체의 부피는 2×3×4예요.",
  };
  if (unit.includes("소수의 나눗셈")) return {
    focus: "나누는 수를 자연수로 만드는 방법",
    q1: "나눗셈에서 무엇을 구해야 하는지와 나누는 수가 무엇인지 적어 보세요.",
    q2: "나누는 수의 소수점을 몇 칸 옮겨 자연수로 만들 수 있을까요?",
    q3: "나누는 수와 나누어지는 수에 같은 수를 곱한 뒤 어떤 계산을 할까요?",
    keywords: ["나눗셈", "나누는", "나누어지는", "소수", "소수점", "몫", "계산"],
    example: "5.6÷0.8은 두 수를 10배 하여 56÷8로 바꿀 수 있어요.",
  };
  return {
    focus: "문제에서 구하는 것과 주어진 정보",
    q1: "문제에서 무엇을 구해야 하는지, 네 말로 적어 보세요.",
    q2: "문제에 나온 수와 단위 중 무엇을 먼저 확인했는지 적어 보세요.",
    q3: "어떤 계산 방법을 사용할지, 이유와 함께 적어 보세요.",
    keywords: ["구해", "계산", "수", "단위", "조건", "그림", "모양"],
    example: "문제에서 구하는 것에 동그라미를 치고, 필요한 수만 골라 식을 세워 보세요.",
  };
};

const genericDiagnosticNodes = (prefix, unit = "") => {
  const profile = diagnosticProfile(unit);
  const unknown = ["모르", "잘모르", "모르겠", "없어", "모르겠습니다"];
  return [
    { id: `${prefix}-q1`, stage: 1, type: "SHORT_TEXT", question: profile.q1, options: [
      { value: "UNKNOWN", keywords: unknown, nextNodeId: `${prefix}-q1-help`, errorType: "문제 이해 확인 필요", concept: profile.focus, example: profile.example, feedback: "괜찮아요. 먼저 문제에서 구하려는 것과 주어진 정보를 한 가지씩 찾아볼게요." },
      { value: "UNDERSTOOD", keywords: profile.keywords, nextNodeId: `${prefix}-q2`, concept: profile.focus, feedback: "좋아요. 무엇을 구할지 방향을 잡았어요. 이제 문제에 필요한 정보를 골라 볼게요." },
      { value: "*", nextNodeId: `${prefix}-q2`, concept: profile.focus, feedback: "답에서 구하려는 내용을 확인했어요. 이제 문제에 필요한 정보를 골라 볼게요." },
    ] },
    { id: `${prefix}-q1-help`, stage: 2, type: "SHORT_TEXT", question: "문제에서 ‘구해 보세요’ 뒤에 무엇을 구하라고 했는지 다시 찾아 적어 볼까요?", options: [
      { value: "*", nextNodeId: `${prefix}-q2`, concept: profile.focus, example: profile.example, feedback: "좋아요. 구하려는 것을 찾았으니, 이제 문제에 나온 수와 단위를 살펴볼게요." },
    ] },
    { id: `${prefix}-q2`, stage: 1, type: "SHORT_TEXT", question: profile.q2, options: [
      { value: "UNKNOWN", keywords: unknown, nextNodeId: `${prefix}-q2-help`, errorType: "핵심 정보 확인 필요", concept: profile.focus, feedback: "괜찮아요. 문제에서 눈에 띄는 수, 단위, 그림의 정보를 한 가지 적어 보세요." },
      { value: "UNDERSTOOD", keywords: profile.keywords, nextNodeId: `${prefix}-q3`, concept: profile.focus, feedback: "좋아요. 필요한 정보를 찾았어요. 이제 그 정보로 어떤 방법을 쓸지 생각해 볼게요." },
      { value: "*", nextNodeId: `${prefix}-q3`, concept: profile.focus, feedback: "필요한 정보를 확인했어요. 이제 그 정보로 어떤 방법을 쓸지 생각해 볼게요." },
    ] },
    { id: `${prefix}-q2-help`, stage: 2, type: "SHORT_TEXT", question: `힌트: ${profile.focus}에서 문제에 나온 낱말이나 숫자를 하나만 적어 보세요.`, options: [
      { value: "*", nextNodeId: `${prefix}-q3`, concept: profile.focus, example: profile.example, feedback: "좋아요. 작은 단서 하나를 찾았어요. 이제 식이나 해결 방법을 생각해 볼게요." },
    ] },
    { id: `${prefix}-q3`, stage: 2, type: "SHORT_TEXT", question: profile.q3, options: [
      { value: "UNKNOWN", keywords: unknown, nextNodeId: `${prefix}-q3-help`, errorType: "계산 방법 선택 확인 필요", concept: profile.focus, feedback: "괜찮아요. 먼저 비슷한 쉬운 예시에서 어떤 계산을 했는지 떠올려 볼게요." },
      { value: "UNDERSTOOD", keywords: profile.keywords, nextNodeId: `${prefix}-q4`, concept: profile.focus, feedback: "좋아요. 방법을 생각했어요. 계산하기 전에 쉬운 예시로 한 번 확인해 볼게요." },
      { value: "*", nextNodeId: `${prefix}-q4`, concept: profile.focus, feedback: "방법을 정했어요. 계산하기 전에 쉬운 예시로 한 번 확인해 볼게요." },
    ] },
    { id: `${prefix}-q3-help`, stage: 3, type: "SHORT_TEXT", question: `쉬운 예시: ${profile.example} 이 예시에서 사용한 계산이나 생각을 적어 보세요.`, options: [
      { value: "*", nextNodeId: `${prefix}-q4`, concept: profile.focus, example: profile.example, feedback: "예시를 통해 방법을 확인했어요. 이제 원래 문제에 같은 생각을 적용해 볼게요." },
    ] },
    { id: `${prefix}-q4`, stage: 3, type: "SHORT_TEXT", question: `이제 ${profile.focus}을(를) 생각하며, 원래 문제를 풀기 위한 식이나 순서를 적어 보세요.`, options: [
      { value: "*", nextNodeId: "retry", concept: profile.focus, example: profile.example, feedback: "좋아요. 필요한 개념과 방법을 확인했어요. 이제 원래 문제를 다시 풀어 볼까요?" },
    ] },
  ];
};



const workbookPdfCatalog = [
  { semester: 1, unitNumber: 2, unit: "각기둥과 각뿔", file: "math_ikhim_6-1-2.pdf", pageOffset: 20, lessons: [
    { name: "단원도입 (수익 21쪽)", pages: [1], questionCounts: [3] },
    { name: "1. 각기둥을 알아볼까요(1) (수익 22~23쪽)", pages: [2, 3], questionCounts: [2, 3] },
    { name: "2. 각기둥을 알아볼까요(2) (수익 24~25쪽)", pages: [4, 5], questionCounts: [2, 3] },
    { name: "3. 각기둥의 전개도를 알아볼까요 (수익 26~29쪽)", pages: [6, 7, 8, 9], questionCounts: [2, 3, 2, 1] },
    { name: "4. 각뿔을 알아볼까요(1) (수익 30~31쪽)", pages: [10, 11], questionCounts: [2, 3] },
    { name: "5. 각뿔을 알아볼까요(2) (수익 32~33쪽)", pages: [12, 13], questionCounts: [2, 3] },
  ] },
  { semester: 1, unitNumber: 3, unit: "소수의 나눗셈", file: "math_ikhim_6-1-3.pdf", pageOffset: 34, lessons: [
    { name: "단원도입 (수익 35쪽)", pages: [1], questionCounts: [4] },
    { name: "1. (소수)÷(자연수)를 알아볼까요(1) (수익 36~37쪽)", pages: [2, 3], questionCounts: [2, 4] },
    { name: "2. (소수)÷(자연수)를 알아볼까요(2) (수익 38~39쪽)", pages: [4, 5], questionCounts: [2, 4] },
    { name: "3. (소수)÷(자연수)를 알아볼까요(3) (수익 40~41쪽)", pages: [6, 7], questionCounts: [2, 4] },
    { name: "4. (소수)÷(자연수)를 알아볼까요(4) (수익 42~43쪽)", pages: [8, 9], questionCounts: [2, 4] },
    { name: "5. (소수)÷(자연수)를 알아볼까요(5) (수익 44~45쪽)", pages: [10, 11], questionCounts: [2, 4] },
    { name: "6. 자연수÷자연수의 몫을 소수로 나타내어 볼까요 (수익 46~47쪽)", pages: [12, 13], questionCounts: [2, 4] },
    { name: "7. 어림셈한 결과를 이용하여 몫의 소수점 위치를 확인해 볼까요 (수익 48~49쪽)", pages: [14, 15], questionCounts: [2, 2] },
  ] },
  { semester: 1, unitNumber: 4, unit: "비와 비율", file: "math_ikhim_6-1-4.pdf", pageOffset: 50, lessons: [
    { name: "단원도입 (수익 51쪽)", pages: [1], questionCounts: [3] },
    { name: "1. 두 수를 비교해 볼까요 (수익 52~53쪽)", pages: [2, 3], questionCounts: [3, 3] },
    { name: "2. 비를 알아볼까요 (수익 54~55쪽)", pages: [4, 5], questionCounts: [2, 3] },
    { name: "3. 비율을 알아볼까요 (수익 56~57쪽)", pages: [6, 7], questionCounts: [2, 3] },
    { name: "4. 비율이 사용되는 경우를 알아볼까요 (수익 58~59쪽)", pages: [8, 9], questionCounts: [2, 3] },
    { name: "5. 백분율을 알아볼까요 (수익 60~61쪽)", pages: [10, 11], questionCounts: [2, 3] },
    { name: "6. 백분율이 사용되는 경우를 알아볼까요 (수익 62~63쪽)", pages: [12, 13], questionCounts: [2, 3] },
  ] },
  { semester: 1, unitNumber: 5, unit: "여러 가지 그래프", file: "math_ikhim_6-1-5.pdf", pageOffset: 64, lessons: [
    { name: "단원도입 (수익 65쪽)", pages: [1], questionCounts: [3] },
    { name: "1. 띠그래프와 원그래프를 알아볼까요 (수익 66~67쪽)", pages: [2, 3], questionCounts: [3, 3] },
    { name: "2. 띠그래프와 원그래프로 나타내는 방법을 알아볼까요 (수익 68~69쪽)", pages: [4, 5], questionCounts: [2, 2] },
    { name: "3. 자료를 조사하여 띠그래프와 원그래프로 나타내어 볼까요 (수익 70~71쪽)", pages: [6, 7], questionCounts: [3, 3] },
    { name: "4. 띠그래프와 원그래프를 해석해 볼까요 (수익 72~73쪽)", pages: [8, 9], questionCounts: [3, 2] },
    { name: "5. 여러 가지 그래프를 활용해 볼까요 (수익 74~75쪽)", pages: [10, 11], questionCounts: [1, 2] },
  ] },
  { semester: 1, unitNumber: 6, unit: "직육면체의 부피와 겉넓이", file: "math_ikhim_6-1-6.pdf", pageOffset: 76, lessons: [
    { name: "단원도입 (수익 77쪽)", pages: [1], questionCounts: [3] },
    { name: "1. 1 cm³를 알아볼까요 (수익 78~79쪽)", pages: [2, 3], questionCounts: [2, 2] },
    { name: "2. 직육면체의 부피를 구하는 방법을 알아볼까요 (수익 80~81쪽)", pages: [4, 5], questionCounts: [2, 4] },
    { name: "3. 1 m³를 알아볼까요 (수익 82~83쪽)", pages: [6, 7], questionCounts: [2, 4] },
    { name: "4. 직육면체의 겉넓이를 구하는 방법을 알아볼까요 (수익 84~85쪽)", pages: [8, 9], questionCounts: [2, 4] },
  ] },
  { semester: 2, unitNumber: 1, unit: "분수의 나눗셈", file: "math_ikhim_6-2-1.pdf", pageOffset: 8, lessons: [
    { name: "단원도입 (수익 9쪽)", pages: [1], questionCounts: [4] },
    { name: "1. 분모가 같은 (분수)÷(분수)를 알아볼까요(1) (수익 10~11쪽)", pages: [2, 3], questionCounts: [2, 5] },
    { name: "2. 분모가 같은 (분수)÷(분수)를 알아볼까요(2) (수익 12~13쪽)", pages: [4, 5], questionCounts: [2, 5] },
    { name: "3. 분모가 다른 (분수)÷(분수)를 알아볼까요 (수익 14~15쪽)", pages: [6, 7], questionCounts: [2, 5] },
    { name: "4. (자연수)÷(분수)를 알아볼까요 (수익 16~17쪽)", pages: [8, 9], questionCounts: [1, 5] },
    { name: "5. (분수)÷(분수)를 (분수)×(분수)로 나타내어 볼까요 (수익 18~19쪽)", pages: [10, 11], questionCounts: [1, 5] },
    { name: "6. (분수)÷(분수)를 구해 볼까요 (수익 20~21쪽)", pages: [12, 13], questionCounts: [2, 5] },
  ] },
  { semester: 2, unitNumber: 2, unit: "소수의 나눗셈", file: "math_ikhim_6-2-2.pdf", pageOffset: 22, lessons: [
    { name: "단원도입 (수익 23쪽)", pages: [1], questionCounts: [4] },
    { name: "1. 소수의 나눗셈을 알아볼까요 (수익 24~25쪽)", pages: [2, 3], questionCounts: [2, 5] },
    { name: "2. (소수)÷(소수)를 알아볼까요(1) (수익 26~27쪽)", pages: [4, 5], questionCounts: [2, 5] },
    { name: "3. (소수)÷(소수)를 알아볼까요(2) (수익 28~29쪽)", pages: [6, 7], questionCounts: [2, 5] },
    { name: "4. (자연수)÷(소수)를 알아볼까요 (수익 30~31쪽)", pages: [8, 9], questionCounts: [2, 5] },
    { name: "5. 몫을 반올림하여 나타내어 볼까요 (수익 32~33쪽)", pages: [10, 11], questionCounts: [2, 4] },
    { name: "6. 나누어 주고 남는 양을 알아볼까요 (수익 34~35쪽)", pages: [12, 13], questionCounts: [2, 2] },
  ] },
  { semester: 2, unitNumber: 3, unit: "공간과 입체", file: "math_ikhim_6-2-3.pdf", pageOffset: 36, lessons: [
    { name: "단원도입 (수익 37쪽)", pages: [1], questionCounts: [3] },
    { name: "1. 어느 방향에서 보았을까요 (수익 38~39쪽)", pages: [2, 3], questionCounts: [2, 2] },
    { name: "2. 쌓은 모양과 쌓기나무의 개수를 알아볼까요(1) (수익 40~41쪽)", pages: [4, 5], questionCounts: [2, 3] },
    { name: "3. 쌓은 모양과 쌓기나무의 개수를 알아볼까요(2) (수익 42~43쪽)", pages: [6, 7], questionCounts: [2, 3] },
    { name: "4. 쌓은 모양과 쌓기나무의 개수를 알아볼까요(3) (수익 44~45쪽)", pages: [8, 9], questionCounts: [2, 2] },
    { name: "5. 쌓은 모양과 쌓기나무의 개수를 알아볼까요(4) (수익 46~47쪽)", pages: [10, 11], questionCounts: [2, 3] },
    { name: "6. 쌓기나무로 여러 가지 모양을 만들어 볼까요 (수익 48~49쪽)", pages: [12, 13], questionCounts: [3, 2] },
  ] },
  { semester: 2, unitNumber: 4, unit: "비례식과 비례배분", file: "math_ikhim_6-2-4.pdf", pageOffset: 50, lessons: [
    { name: "단원도입 (수익 51쪽)", pages: [1], questionCounts: [4] },
    { name: "1. 비의 성질을 알아볼까요 (수익 52~53쪽)", pages: [2, 3], questionCounts: [2, 5] },
    { name: "2. 간단한 자연수의 비로 나타내어 볼까요 (수익 54~55쪽)", pages: [4, 5], questionCounts: [2, 4] },
    { name: "3. 비례식을 알아볼까요 (수익 56~57쪽)", pages: [6, 7], questionCounts: [2, 5] },
    { name: "4. 비례식의 성질을 알아볼까요 (수익 58~59쪽)", pages: [8, 9], questionCounts: [2, 5] },
    { name: "5. 비례식을 활용해 볼까요 (수익 60~61쪽)", pages: [10, 11], questionCounts: [2, 3] },
    { name: "6. 비례배분을 해 볼까요 (수익 62~63쪽)", pages: [12, 13], questionCounts: [2, 5] },
  ] },
  { semester: 2, unitNumber: 5, unit: "원의 넓이", file: "math_ikhim_6-2-5.pdf", pageOffset: 64, lessons: [
    { name: "단원도입 (수익 65쪽)", pages: [1], questionCounts: [4] },
    { name: "1. 원주와 지름의 관계를 알아볼까요 (수익 66~67쪽)", pages: [2, 3], questionCounts: [2, 3] },
    { name: "2. 원주율을 알아볼까요 (수익 68~69쪽)", pages: [4, 5], questionCounts: [2, 3] },
    { name: "3. 원주와 지름을 구해 볼까요 (수익 70~71쪽)", pages: [6, 7], questionCounts: [2, 4] },
    { name: "4. 원의 넓이를 어림해 볼까요 (수익 72~73쪽)", pages: [8, 9], questionCounts: [1, 3] },
    { name: "5. 원의 넓이를 구하는 방법을 알아볼까요 (수익 74~75쪽)", pages: [10, 11], questionCounts: [1, 4] },
    { name: "6. 원의 넓이를 활용해 볼까요 (수익 76~77쪽)", pages: [12, 13], questionCounts: [2, 5] },
  ] },
];

const workbookPdfQuestions = workbookPdfCatalog.flatMap((catalog) => catalog.lessons.flatMap((lesson, lessonIndex) => {
  let questionNumber = 0;
  return lesson.pages.flatMap((pdfPage, pageIndex) => Array.from({ length: lesson.questionCounts[pageIndex] ?? 0 }, () => {
    questionNumber += 1;
    const prefix = `workbook-${catalog.semester}-${catalog.unitNumber}-lesson${lessonIndex + 1}-q${questionNumber}`;
    return { id: `grade6-semester${catalog.semester}-unit${catalog.unitNumber}-lesson${lessonIndex + 1}-q${questionNumber}`, grade: 6, semester: catalog.semester, unit: catalog.unit, lesson: lesson.name, page: catalog.pageOffset + pdfPage, question_number: questionNumber, question_text: `${catalog.unitNumber}단원 ${catalog.unit} ${lesson.name} ${questionNumber}번 문제`, question_image_url: `/${catalog.file}#page=${pdfPage}`, correct_answer: "", accepted_answers: ["*"], concepts: [catalog.unit, lesson.name, "문제에서 구하는 것 확인", "계산 결과 확인"], diagnostic_start_id: `${prefix}-q1`, diagnostic_nodes: genericDiagnosticNodes(prefix, catalog.unit), is_active: true };
  }));
}));


const pdfQuestions = pdfQuestionCatalog.map(([lesson, pdfPage, questionNumber, questionText, acceptedAnswers]) => {
  const prefix = `pdf-${questionNumber}-${pdfPage}`;
  return { id: `grade6-semester1-fraction-division-${pdfPage}-${questionNumber}`, grade: 6, semester: 1, unit: "분수의 나눗셈", lesson, page: pdfPage + 8, question_number: questionNumber, question_text: questionText, question_image_url: `/math_ikhim_6-1-1.pdf#page=${pdfPage}`, correct_answer: acceptedAnswers[0] ?? "", accepted_answers: acceptedAnswers, concepts: ["문제에서 구하는 것 확인", "나눗셈의 의미", "분수 계산", "계산 결과 확인"], diagnostic_start_id: `${prefix}-q1`, diagnostic_nodes: genericDiagnosticNodes(prefix, "분수의 나눗셈"), is_active: true };
});

const sampleQuestions = JSON.parse(await readFile(new URL("../supabase/seed/sample-questions.json", import.meta.url), "utf8")).map((question) => ({ question_image_url: null, ...question }));
const questions = [...sampleQuestions, ...pdfQuestions, ...workbookPdfQuestions];
for (const catalog of workbookPdfCatalog) {
  await rest(`questions?id=like.grade6-semester${catalog.semester}-unit${catalog.unitNumber}-%25`, { method: "PATCH", body: JSON.stringify({ is_active: false, updated_at: new Date().toISOString() }) });
}
await rest("questions?id=like.grade6-semester2-unit6-%25", { method: "PATCH", body: JSON.stringify({ is_active: false, updated_at: new Date().toISOString() }) });
await rest("questions", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(questions) });
console.log(`Supabase seed 완료: 학생 ${numbers.length}명, 교사 1명, 문항 ${questions.length}개`);
