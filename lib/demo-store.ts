import type {
  DiagnosticResponse,
  LearningRecord,
  Question,
  Student,
  StudentSession,
  TeacherDashboard,
} from "./bakjumsu-types";

const now = () => new Date().toISOString();

export const sampleQuestions: Question[] = [
  {
    id: "grade5-semester1-fraction-q1",
    grade: 5,
    semester: 1,
    unit: "분수의 덧셈과 뺄셈",
    lesson: "분모가 다른 분수의 덧셈",
    page: 52,
    questionNumber: 1,
    questionText: "1/3 + 1/4을 계산하세요.",
    correctAnswer: "7/12",
    acceptedAnswers: ["7/12"],
    concepts: ["분모 확인", "통분", "최소공배수", "동치분수", "분자 계산"],
    diagnosticStartId: "q1",
    isPlayable: true,
    diagnosticNodes: [
      {
        id: "q1",
        stage: 1,
        type: "YES_NO_UNKNOWN",
        question: "두 분수의 분모가 같은가요?",
        options: [
          { value: "YES", label: "예", nextNodeId: "q1-retry", errorType: "분모 확인 오류", repeatQuestion: true },
          { value: "NO", label: "아니요", nextNodeId: "q2" },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "q1-concept", errorType: "분모 개념 확인 필요", concept: "분모는 전체를 똑같이 나눈 수를 나타내요." },
        ],
      },
      {
        id: "q1-retry",
        stage: 1,
        type: "YES_NO_UNKNOWN",
        question: "분모 3과 4를 다시 비교해 볼까요? 서로 같은가요?",
        options: [
          { value: "YES", label: "예", nextNodeId: "q1-retry", errorType: "분모 확인 오류", repeatQuestion: true },
          { value: "NO", label: "아니요", nextNodeId: "q2" },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "q1-concept", errorType: "분모 개념 확인 필요", concept: "분모는 분수 아래 숫자예요. 3과 4는 서로 달라요." },
        ],
      },
      {
        id: "q1-concept",
        stage: 2,
        type: "CHOICE",
        question: "분모가 다른 두 분수를 더할 때, 분모를 같게 만드는 것을 무엇이라고 하나요?",
        options: [
          { value: "통분", label: "통분하기", nextNodeId: "q2", concept: "통분은 분모를 같게 만드는 과정이에요." },
          { value: "약분", label: "약분하기", nextNodeId: "q1-example", errorType: "연산 순서 이해 부족", concept: "약분은 분수를 더 간단히 만드는 과정이고, 통분과 달라요." },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "q1-example", errorType: "통분 개념 미형성", concept: "분모가 다르면 먼저 같은 분모로 바꾸어야 해요." },
        ],
        example: "1/2와 1/3을 더하려면 6을 공통 분모로 사용할 수 있어요.",
      },
      {
        id: "q1-example",
        stage: 3,
        type: "CHOICE",
        question: "쉬운 예시에서 1/2의 분모를 6으로 만들 때 분자와 분모에 몇을 곱할까요?",
        options: [
          { value: "3", label: "3", nextNodeId: "q2", concept: "분자와 분모에 같은 수를 곱하면 같은 크기의 분수가 돼요." },
          { value: "2", label: "2", nextNodeId: "q2", errorType: "동치분수 이해 부족", concept: "분모를 6으로 만들려면 2에 3을 곱해야 해요." },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "q2", errorType: "동치분수 이해 부족", concept: "분모가 몇 배가 되었는지 살펴보세요." },
        ],
        example: "2×3=6이므로 1/2는 3/6으로 바꿀 수 있어요.",
      },
      {
        id: "q2",
        stage: 1,
        type: "CHOICE",
        question: "분모가 다를 때 가장 먼저 해야 할 일은 무엇인가요?",
        options: [
          { value: "분자끼리 더한다", label: "분자끼리 더한다", nextNodeId: "q2-help", errorType: "통분 개념 부족" },
          { value: "통분한다", label: "통분한다", nextNodeId: "q3" },
          { value: "약분한다", label: "약분한다", nextNodeId: "q2-help", errorType: "연산 순서 이해 부족" },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "q2-help", errorType: "통분 개념 미형성" },
        ],
      },
      {
        id: "q2-help",
        stage: 2,
        type: "CHOICE",
        question: "통분은 분모를 어떻게 바꾸는 과정일까요?",
        options: [
          { value: "같게", label: "같게 만들어요", nextNodeId: "q3", concept: "통분은 분모를 같은 수로 맞추는 과정이에요." },
          { value: "다르게", label: "다르게 만들어요", nextNodeId: "q3", errorType: "통분 개념 부족", concept: "통분의 목표는 두 분모를 같게 만드는 것이에요." },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "q3", errorType: "통분 개념 미형성", concept: "두 분모를 하나의 같은 분모로 맞추어 보세요." },
        ],
        example: "1/3과 1/4의 분모를 12로 맞추면 4/12와 3/12가 돼요.",
      },
      {
        id: "q3",
        stage: 2,
        type: "NUMBER",
        question: "3과 4의 최소공배수는 무엇인가요?",
        options: [
          { value: "12", label: "12", nextNodeId: "q4" },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "q3-help", errorType: "최소공배수 이해 부족" },
          { value: "WRONG", label: "다른 수", nextNodeId: "q3-help", errorType: "최소공배수 이해 부족" },
        ],
      },
      {
        id: "q3-help",
        stage: 3,
        type: "CHOICE",
        question: "3의 배수와 4의 배수 중에서 처음 만나는 수를 찾아볼까요?",
        options: [
          { value: "12", label: "12", nextNodeId: "q4", concept: "공통으로 나타나는 가장 작은 배수가 최소공배수예요." },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "q4", errorType: "최소공배수 이해 부족", example: "3의 배수: 3, 6, 9, 12 / 4의 배수: 4, 8, 12" },
        ],
        example: "3과 4의 배수를 나열하면 12에서 처음 만나요.",
      },
      {
        id: "q4",
        stage: 2,
        type: "NUMBER",
        question: "1/3의 분모를 12로 만들려면 분자와 분모에 몇을 곱해야 하나요?",
        options: [
          { value: "4", label: "4", nextNodeId: "q5" },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "q4-help", errorType: "동치분수 이해 부족" },
          { value: "WRONG", label: "다른 수", nextNodeId: "q4-help", errorType: "동치분수 이해 부족" },
        ],
      },
      {
        id: "q4-help",
        stage: 3,
        type: "CHOICE",
        question: "3에 몇을 곱하면 12가 될까요? 분자에도 같은 수를 곱해야 해요.",
        options: [
          { value: "4", label: "4", nextNodeId: "q5", concept: "분자와 분모에 같은 수를 곱하면 동치분수가 돼요." },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "q5", errorType: "동치분수 이해 부족", concept: "3×4=12인지 확인해 보세요." },
        ],
        example: "1/3은 분자와 분모에 4를 곱해 4/12로 바꿀 수 있어요.",
      },
      {
        id: "q5",
        stage: 2,
        type: "NUMBER",
        question: "통분한 두 분수의 분자를 더해 보세요.",
        options: [
          { value: "7", label: "7", nextNodeId: "retry" },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "retry", errorType: "분자 계산 확인 필요" },
          { value: "WRONG", label: "다른 수", nextNodeId: "retry", errorType: "분자 계산 실수" },
        ],
      },
    ],
  },
  {
    id: "grade6-semester1-decimal-q1",
    grade: 6,
    semester: 1,
    unit: "소수의 나눗셈",
    lesson: "소수로 나누기",
    page: 48,
    questionNumber: 1,
    questionText: "5.6 ÷ 0.8",
    correctAnswer: "7",
    acceptedAnswers: ["7", "7.0"],
    concepts: ["소수점 이동", "두 수를 함께 바꾸기", "나눗셈 계산"],
    diagnosticStartId: "decimal-q1",
    isPlayable: true,
    diagnosticNodes: [
      {
        id: "decimal-q1",
        stage: 1,
        type: "NUMBER",
        question: "나누는 수 0.8을 자연수로 만들려면 소수점을 몇 칸 옮겨야 하나요?",
        options: [
          { value: "1", label: "한 칸", nextNodeId: "decimal-q2" },
          { value: "0", label: "옮기지 않아요", nextNodeId: "decimal-q1-help", errorType: "소수점 이동 원리 부족" },
          { value: "2", label: "두 칸", nextNodeId: "decimal-q1-help", errorType: "소수점 이동 원리 부족" },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "decimal-q1-help", errorType: "소수점 이동 원리 확인 필요" },
        ],
      },
      {
        id: "decimal-q1-help",
        stage: 2,
        type: "CHOICE",
        question: "0.8을 10배 하면 어떤 수가 되나요?",
        options: [
          { value: "8", label: "8", nextNodeId: "decimal-q2", concept: "소수점을 오른쪽으로 한 칸 옮기면 10배가 돼요." },
          { value: "0.08", label: "0.08", nextNodeId: "decimal-q2", errorType: "소수점 이동 원리 부족", concept: "10배는 소수점을 오른쪽으로 한 칸 옮겨요." },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "decimal-q2", errorType: "소수점 이동 원리 확인 필요", concept: "0.8 × 10 = 8이에요." },
        ],
        example: "0.6 × 10 = 6처럼 소수점을 오른쪽으로 한 칸 옮겨요.",
      },
      {
        id: "decimal-q2",
        stage: 1,
        type: "YES_NO_UNKNOWN",
        question: "나누는 수와 나누어지는 수의 소수점을 함께 옮겨야 하나요?",
        options: [
          { value: "YES", label: "예", nextNodeId: "decimal-q3" },
          { value: "NO", label: "아니요", nextNodeId: "decimal-q2-help", errorType: "두 수를 함께 바꾸는 원리 부족" },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "decimal-q2-help", errorType: "두 수를 함께 바꾸는 원리 확인 필요" },
        ],
      },
      {
        id: "decimal-q2-help",
        stage: 2,
        type: "YES_NO_UNKNOWN",
        question: "5.6도 10배 하여 56으로 바꾸어야 계산할 수 있을까요?",
        options: [
          { value: "YES", label: "예", nextNodeId: "decimal-q3", concept: "나누는 수와 나누어지는 수에 같은 수를 곱해요." },
          { value: "NO", label: "아니요", nextNodeId: "decimal-q3", errorType: "두 수를 함께 바꾸는 원리 부족", concept: "0.8만 바꾸면 값이 달라지므로 5.6도 함께 10배 해요." },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "decimal-q3", errorType: "두 수를 함께 바꾸는 원리 확인 필요", concept: "5.6 ÷ 0.8은 56 ÷ 8로 바꾸어 계산해요." },
        ],
        example: "3.6 ÷ 0.6도 36 ÷ 6으로 바꾸어 계산할 수 있어요.",
      },
      {
        id: "decimal-q3",
        stage: 2,
        type: "NUMBER",
        question: "56 ÷ 8의 몫은 얼마인가요?",
        options: [
          { value: "7", label: "7", nextNodeId: "decimal-q4" },
          { value: "6", label: "6", nextNodeId: "decimal-q3-help", errorType: "기초 나눗셈 계산 오류" },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "decimal-q3-help", errorType: "기초 나눗셈 계산 확인 필요" },
        ],
      },
      {
        id: "decimal-q3-help",
        stage: 3,
        type: "CHOICE",
        question: "8 × 7을 계산하면 56이 되나요?",
        options: [
          { value: "YES", label: "예", nextNodeId: "decimal-q4", concept: "나눗셈은 곱셈으로 답을 확인할 수 있어요." },
          { value: "NO", label: "아니요", nextNodeId: "decimal-q4", errorType: "기초 나눗셈 계산 오류", concept: "8을 7번 더하면 56이 돼요." },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "decimal-q4", errorType: "기초 나눗셈 계산 확인 필요", example: "8 × 5 = 40, 8 × 2 = 16이므로 8 × 7 = 56이에요." },
        ],
      },
      {
        id: "decimal-q4",
        stage: 2,
        type: "CHOICE",
        question: "이제 원래 문제의 몫을 골라 볼까요?",
        options: [
          { value: "7", label: "7", nextNodeId: "retry" },
          { value: "0.7", label: "0.7", nextNodeId: "retry", errorType: "소수점 위치 확인 필요" },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "retry", errorType: "몫 확인 필요" },
        ],
      },
    ],
  },
  {
    id: "grade6-semester1-ratio-q1",
    grade: 6,
    semester: 1,
    unit: "비와 비율",
    lesson: "비율 구하기",
    page: 76,
    questionNumber: 1,
    questionText: "전체 20명 중 8명이 안경을 썼습니다. 안경을 쓴 학생 수의 비율을 구하세요.",
    correctAnswer: "0.4",
    acceptedAnswers: ["0.4", "40%", "40"],
    concepts: ["비교하는 양", "기준량", "비교하는 양 ÷ 기준량", "백분율"],
    diagnosticStartId: "ratio-q1",
    isPlayable: true,
    diagnosticNodes: [
      {
        id: "ratio-q1",
        stage: 1,
        type: "YES_NO_UNKNOWN",
        question: "안경을 쓴 학생 수 8명은 비교하는 양인가요?",
        options: [
          { value: "YES", label: "예", nextNodeId: "ratio-q2" },
          { value: "NO", label: "아니요", nextNodeId: "ratio-q1-help", errorType: "비교하는 양과 기준량 구분 오류" },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "ratio-q1-help", errorType: "비교하는 양과 기준량 구분 확인 필요" },
        ],
      },
      {
        id: "ratio-q1-help",
        stage: 2,
        type: "CHOICE",
        question: "8명과 20명 중 안경을 쓴 학생 수는 몇 명인가요?",
        options: [
          { value: "8", label: "8명", nextNodeId: "ratio-q2", concept: "비교하는 양은 비교하려는 대상의 수예요." },
          { value: "20", label: "20명", nextNodeId: "ratio-q2", errorType: "비교하는 양과 기준량 구분 오류", concept: "안경을 쓴 학생 수는 8명이에요." },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "ratio-q2", errorType: "비교하는 양과 기준량 구분 확인 필요", concept: "문제에서 안경을 쓴 학생은 8명이에요." },
        ],
        example: "전체 10명 중 사과를 좋아하는 3명이라면 비교하는 양은 3명이에요.",
      },
      {
        id: "ratio-q2",
        stage: 1,
        type: "YES_NO_UNKNOWN",
        question: "기준량은 전체 학생 수 20명인가요?",
        options: [
          { value: "YES", label: "예", nextNodeId: "ratio-q3" },
          { value: "NO", label: "아니요", nextNodeId: "ratio-q2-help", errorType: "비교하는 양과 기준량 구분 오류" },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "ratio-q2-help", errorType: "기준량 의미 확인 필요" },
        ],
      },
      {
        id: "ratio-q2-help",
        stage: 2,
        type: "CHOICE",
        question: "비율을 구할 때 기준이 되는 전체 학생 수는 몇 명인가요?",
        options: [
          { value: "20", label: "20명", nextNodeId: "ratio-q3", concept: "기준량은 비교의 기준이 되는 전체 양이에요." },
          { value: "8", label: "8명", nextNodeId: "ratio-q3", errorType: "비교하는 양과 기준량 구분 오류", concept: "전체 학생 수 20명이 기준량이에요." },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "ratio-q3", errorType: "기준량 의미 확인 필요", concept: "기준량은 전체인 20명이에요." },
        ],
        example: "비율은 비교하는 양을 기준량으로 나누어 구해요.",
      },
      {
        id: "ratio-q3",
        stage: 2,
        type: "CHOICE",
        question: "안경을 쓴 학생 수의 비율을 구하는 식은 무엇인가요?",
        options: [
          { value: "8÷20", label: "8 ÷ 20", nextNodeId: "ratio-q4" },
          { value: "20÷8", label: "20 ÷ 8", nextNodeId: "ratio-q3-help", errorType: "비율의 의미 이해 부족" },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "ratio-q3-help", errorType: "비율의 의미 확인 필요" },
        ],
      },
      {
        id: "ratio-q3-help",
        stage: 3,
        type: "NUMBER",
        question: "8 ÷ 20을 계산하면 얼마인가요?",
        options: [
          { value: "0.4", label: "0.4", nextNodeId: "ratio-q4", concept: "비교하는 양 8을 기준량 20으로 나누면 0.4예요." },
          { value: "4", label: "4", nextNodeId: "ratio-q4", errorType: "나눗셈 계산 오류" },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "ratio-q4", errorType: "나눗셈 계산 확인 필요", example: "8/20은 4/10과 같고, 소수로 0.4예요." },
        ],
      },
      {
        id: "ratio-q4",
        stage: 2,
        type: "CHOICE",
        question: "0.4를 백분율로 나타내면 무엇인가요?",
        options: [
          { value: "40%", label: "40%", nextNodeId: "retry" },
          { value: "0.4", label: "0.4", nextNodeId: "retry" },
          { value: "4%", label: "4%", nextNodeId: "retry", errorType: "백분율 변환 오류" },
          { value: "UNKNOWN", label: "잘 모르겠어요", nextNodeId: "retry", errorType: "백분율 변환 확인 필요" },
        ],
      },
    ],
  },
];

const studentNumbers = [...Array.from({ length: 8 }, (_, index) => index + 1), ...Array.from({ length: 9 }, (_, index) => index + 31)];
const students = new Map<string, Student>();
const pinHashes = new Map<string, string>();
const records = new Map<string, LearningRecord>();
const responses: DiagnosticResponse[] = [];
const sessions = new Map<string, StudentSession>();

const hashPin = async (pin: string) => {
  const bytes = new TextEncoder().encode(`백점수익:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const makeStudentId = (number: number) => `student-${number}`;

for (const studentNumber of studentNumbers) {
  const id = makeStudentId(studentNumber);
  students.set(id, {
    id,
    studentNumber,
    name: `${studentNumber}번 학생`,
    mustChangePassword: true,
    failedLoginCount: 0,
    lockedUntil: null,
    isActive: true,
    lastLoginAt: null,
  });
}

export const demoStore = {
  async initialize() {
    if (pinHashes.size === students.size) return;
    const initialHash = await hashPin("000");
    for (const student of students.values()) pinHashes.set(student.id, initialHash);
  },
  listStudents() {
    return [...students.values()].filter((student) => student.isActive).sort((a, b) => a.studentNumber - b.studentNumber);
  },
  getStudent(studentId: string) {
    return students.get(studentId) ?? null;
  },
  getQuestion(questionId: string) {
    return sampleQuestions.find((question) => question.id === questionId) ?? null;
  },
  getQuestions() {
    return sampleQuestions;
  },
  getRecord(studentId: string, questionId: string) {
    return [...records.values()].find((record) => record.studentId === studentId && record.questionId === questionId) ?? null;
  },
  getRecords(studentId: string) {
    return [...records.values()].filter((record) => record.studentId === studentId);
  },
  getResponses(studentId: string) {
    return responses.filter((response) => response.studentId === studentId);
  },
  async loginStudent(studentNumber: number, pin: string) {
    await this.initialize();
    const student = this.listStudents().find((item) => item.studentNumber === studentNumber);
    if (!student) return { ok: false as const, message: "학생 번호를 찾을 수 없습니다." };
    if (student.lockedUntil && new Date(student.lockedUntil).getTime() > Date.now()) {
      return { ok: false as const, locked: true, message: "잠시 입력이 제한되었습니다. 선생님께 도움을 요청해 주세요." };
    }
    const valid = pinHashes.get(student.id) === await hashPin(pin);
    if (!valid) {
      student.failedLoginCount += 1;
      if (student.failedLoginCount >= 5) student.lockedUntil = new Date(Date.now() + 60_000).toISOString();
      return { ok: false as const, locked: student.failedLoginCount >= 5, message: student.failedLoginCount >= 5 ? "잠시 입력이 제한되었습니다. 선생님께 도움을 요청해 주세요." : "비밀번호를 다시 확인해 주세요." };
    }
    student.failedLoginCount = 0;
    student.lockedUntil = null;
    student.lastLoginAt = now();
    const token = crypto.randomUUID();
    sessions.set(token, { token, kind: "student", studentId: student.id, createdAt: now() });
    return { ok: true as const, token, student };
  },
  loginTeacher(password: string) {
    const expected = process.env.TEACHER_INITIAL_PASSWORD;
    if (!expected) return { ok: false as const, message: "교사 비밀번호가 서버에 설정되지 않았습니다." };
    if (!password || password !== expected) return { ok: false as const, message: "교사 비밀번호를 다시 확인해 주세요." };
    const token = crypto.randomUUID();
    sessions.set(token, { token, kind: "teacher", teacherId: "teacher-1", createdAt: now() });
    return { ok: true as const, token };
  },
  async changeStudentPassword(studentId: string, pin: string) {
    if (!/^\d{3}$/.test(pin) || pin === "000") return { ok: false as const, message: "000이 아닌 3자리 숫자를 입력해 주세요." };
    pinHashes.set(studentId, await hashPin(pin));
    const student = students.get(studentId);
    if (!student) return { ok: false as const, message: "학생을 찾을 수 없습니다." };
    student.mustChangePassword = false;
    student.failedLoginCount = 0;
    return { ok: true as const, student };
  },
  getSession(token: string | null) {
    return token ? sessions.get(token) ?? null : null;
  },
  deleteSession(token: string | null) {
    if (token) sessions.delete(token);
  },
  startRecord(studentId: string, questionId: string) {
    const existing = this.getRecord(studentId, questionId);
    if (existing) return existing;
    const question = this.getQuestion(questionId);
    if (!question) return null;
    const record: LearningRecord = {
      id: crypto.randomUUID(),
      studentId,
      questionId,
      status: "DIAGNOSING",
      currentDiagnosticNodeId: question.diagnosticStartId,
      diagnosedErrorTypes: [],
      providedConcepts: [],
      retryCount: 0,
      retryAnswer: "",
      isCompleted: false,
      needsTeacherHelp: false,
      startedAt: now(),
      completedAt: null,
      updatedAt: now(),
    };
    records.set(record.id, record);
    return record;
  },
  recordResponse(studentId: string, recordId: string, answer: string, responseTimeMs: number) {
    const record = records.get(recordId);
    if (!record || record.studentId !== studentId) return null;
    const question = this.getQuestion(record.questionId);
    const node = question?.diagnosticNodes.find((item) => item.id === record.currentDiagnosticNodeId);
    const normalized = answer.trim().replace(/\s+/g, "").toLowerCase();
    const aliases: Record<string, string[]> = { YES: ["예", "네", "맞아요"], NO: ["아니요", "아니오", "아니"], UNKNOWN: ["잘모르겠어요", "모르겠어요"] };
    const option = node?.options?.find((item) => item.value === "*" || [item.value, item.label, ...(aliases[item.value] ?? [])].some((candidate) => candidate.trim().replace(/\s+/g, "").toLowerCase() === normalized));
    const nextNodeId = option?.nextNodeId ?? null;
    if (option?.errorType && !record.diagnosedErrorTypes.includes(option.errorType)) record.diagnosedErrorTypes.push(option.errorType);
    if (option?.concept && !record.providedConcepts.includes(option.concept)) record.providedConcepts.push(option.concept);
    if (option?.needsTeacherHelp) record.needsTeacherHelp = true;
    record.status = nextNodeId === "retry" ? "RETRYING" : option?.concept ? "CONCEPT_HELP" : "DIAGNOSING";
    record.currentDiagnosticNodeId = nextNodeId && nextNodeId !== "retry" ? nextNodeId : record.currentDiagnosticNodeId;
    record.updatedAt = now();
    responses.push({ id: crypto.randomUUID(), learningRecordId: record.id, studentId, questionId: record.questionId, diagnosticNodeId: node?.id ?? "", questionText: node?.question ?? "", answer, nextNodeId, diagnosedErrorType: option?.errorType ?? null, responseTimeMs, createdAt: now() });
    return { record, nextNodeId, concept: option?.concept ?? node?.concept ?? null, example: option?.example ?? node?.example ?? null, errorType: option?.errorType ?? null };
  },
  markReadyToRetry(studentId: string, recordId: string) {
    const record = records.get(recordId);
    if (!record || record.studentId !== studentId) return null;
    record.status = "RETRYING";
    record.needsTeacherHelp = false;
    record.updatedAt = now();
    return record;
  },
  submitRetry(studentId: string, recordId: string, answer: string) {
    const record = records.get(recordId);
    if (!record || record.studentId !== studentId) return null;
    const question = this.getQuestion(record.questionId);
    record.retryCount += 1;
    record.retryAnswer = answer;
    record.updatedAt = now();
    const normalized = answer.trim().replace(/\s/g, "").toLowerCase();
    const correct = question?.acceptedAnswers.some((item) => item.replace(/\s/g, "").toLowerCase() === normalized) ?? false;
    if (correct) {
      record.status = "COMPLETED";
      record.isCompleted = true;
      record.completedAt = now();
      record.needsTeacherHelp = false;
      return { record, correct: true };
    }
    if (record.retryCount >= 2) {
      record.status = "TEACHER_HELP_NEEDED";
      record.needsTeacherHelp = true;
    } else {
      record.status = "RETRYING";
    }
    return { record, correct: false };
  },
  requestHelp(studentId: string, recordId: string) {
    const record = records.get(recordId);
    if (!record || record.studentId !== studentId) return null;
    record.status = "TEACHER_HELP_NEEDED";
    record.needsTeacherHelp = true;
    record.updatedAt = now();
    return record;
  },
  resetStudentPassword(studentNumber: number) {
    const student = this.listStudents().find((item) => item.studentNumber === studentNumber);
    if (!student) return null;
    void hashPin("000").then((hash) => pinHashes.set(student.id, hash));
    student.mustChangePassword = true;
    student.failedLoginCount = 0;
    student.lockedUntil = null;
    for (const [token, session] of sessions) if (session.studentId === student.id) sessions.delete(token);
    return student;
  },
  teacherDashboard(): TeacherDashboard {
    const today = new Date().toISOString().slice(0, 10);
    const dashboardStudents = this.listStudents().map((student) => {
      const studentRecords = this.getRecords(student.id);
      const currentRecord = [...studentRecords].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
      return { student, currentRecord, completedCount: studentRecords.filter((record) => record.isCompleted).length, unresolvedCount: studentRecords.filter((record) => !record.isCompleted).length, latestError: currentRecord?.diagnosedErrorTypes.at(-1) ?? null };
    });
    return {
      totalStudents: dashboardStudents.length,
      todayLoginCount: dashboardStudents.filter((item) => item.student.lastLoginAt?.startsWith(today)).length,
      completedStudentCount: dashboardStudents.filter((item) => item.completedCount > 0).length,
      diagnosingCount: dashboardStudents.filter((item) => item.currentRecord?.status === "DIAGNOSING" || item.currentRecord?.status === "CONCEPT_HELP").length,
      retryingCount: dashboardStudents.filter((item) => item.currentRecord?.status === "RETRYING").length,
      teacherHelpCount: dashboardStudents.filter((item) => item.currentRecord?.needsTeacherHelp).length,
      totalHelpRequests: dashboardStudents.reduce((sum, item) => sum + (item.currentRecord?.needsTeacherHelp ? 1 : 0), 0),
      students: dashboardStudents,
    };
  },
};
