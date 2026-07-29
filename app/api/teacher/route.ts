import { demoStore } from "../../../lib/demo-store";
import type { LessonCompletionMap, TeacherProgressLesson } from "../../../lib/bakjumsu-types";
import { authPasswordForPin, getCookie, isSupabaseConfigured, supabaseAdmin, supabaseRest, supabaseUser } from "../../../lib/supabase-rest";

const isTeacher = (request: Request) => {
  const token = request.headers.get("cookie")?.match(/(?:^|; )bp-session=([^;]+)/)?.[1] ?? null;
  return demoStore.getSession(token)?.kind === "teacher";
};

const supabaseTeacher = async (request: Request) => {
  const accessToken = getCookie(request, "bp-access");
  const user = accessToken ? await supabaseUser(accessToken) : null;
  if (!accessToken || !user) return null;
  const rows = await supabaseRest(`teachers?id=eq.${user.id}&select=id,name&limit=1`, { token: accessToken }) as Array<{ id: string; name: string }>;
  return rows[0] ? { accessToken, teacherId: user.id } : null;
};

const fractionDivisionLessons = [
  "자연수÷자연수의 몫을 분수로 나타내어 볼까요(1)",
  "자연수÷자연수의 몫을 분수로 나타내어 볼까요(2)",
  "분수÷자연수를 알아볼까요",
  "분수÷자연수를 분수의 곱셈으로 나타내어 볼까요",
  "대분수÷자연수를 알아볼까요",
];

const lessonFromRow = (row: Record<string, unknown>) => {
  const unit = String(row.unit ?? "");
  const imageUrl = String(row.question_image_url ?? "");
  const pdfPage = Number(imageUrl.match(/math_ikhim_6-1-1\.pdf#page=(\d+)/)?.[1] ?? 0);
  if (Number(row.semester) === 1 && unit === "분수의 나눗셈" && pdfPage >= 2 && pdfPage <= 11) return fractionDivisionLessons[Math.floor((pdfPage - 2) / 2)];
  return String(row.lesson ?? "");
};

const lessonCatalogFromRows = (rows: Array<Record<string, unknown>>): TeacherProgressLesson[] => {
  const seen = new Set<string>();
  const catalog: TeacherProgressLesson[] = [];
  rows.forEach((row) => {
    if (Number(row.grade) !== 6 || row.is_active === false) return;
    const semester = Number(row.semester);
    const unit = String(row.unit ?? "");
    const lesson = lessonFromRow(row);
    if (!semester || !unit || !lesson) return;
    const key = `${semester}|${unit}|${lesson}`;
    if (seen.has(key)) return;
    seen.add(key);
    catalog.push({ semester, unit, lesson });
  });
  return catalog;
};

const completionMapFromMetadata = (metadata: unknown): LessonCompletionMap => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
  const value = (metadata as Record<string, unknown>).bakjumsuik_lesson_completions;
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, completed]) => [key, Boolean(completed)]));
};

const supabaseDashboard = async (teacherToken: string) => {
  const [studentRows, recordRows, authUsers, questionRows] = await Promise.all([
    supabaseRest("students?select=id,student_number,name,must_change_password,failed_login_count,locked_until,is_active,last_login_at&order=student_number.asc", { token: teacherToken, admin: true }),
    supabaseRest("learning_records?select=*&order=updated_at.desc", { token: teacherToken, admin: true }),
    supabaseAdmin("/auth/v1/admin/users?per_page=1000"),
    supabaseRest("questions?select=grade,semester,unit,lesson,question_image_url,page,question_number,is_active&grade=eq.6&is_active=eq.true&order=semester.asc,page.asc,question_number.asc", { token: teacherToken, admin: true }),
  ]);
  const students = studentRows as Array<Record<string, unknown>>;
  const records = recordRows as Array<Record<string, unknown>>;
  const users = (authUsers as { users?: Array<Record<string, unknown>> }).users ?? [];
  const usersById = new Map(users.map((user) => [String(user.id), user]));
  const lessonCompletionsByStudent: Record<string, LessonCompletionMap> = {};
  const today = new Date().toISOString().slice(0, 10);
  const studentRowsForDashboard = students.map((row) => {
    const studentId = String(row.id);
    const studentRecords = records.filter((record) => String(record.student_id) === studentId);
    const current = studentRecords[0];
    const currentErrors = Array.isArray(current?.diagnosed_error_types) ? current.diagnosed_error_types.map(String) : [];
    const metadata = usersById.get(studentId)?.user_metadata;
    const completionMap = completionMapFromMetadata(metadata);
    lessonCompletionsByStudent[studentId] = completionMap;
    const lessonCompletionCount = Object.values(completionMap).filter(Boolean).length;
    return {
      student: { id: studentId, studentNumber: Number(row.student_number), name: String(row.name), mustChangePassword: Boolean(row.must_change_password), failedLoginCount: Number(row.failed_login_count ?? 0), lockedUntil: row.locked_until ? String(row.locked_until) : null, isActive: Boolean(row.is_active), lastLoginAt: row.last_login_at ? String(row.last_login_at) : null },
      currentRecord: current ? { id: String(current.id), studentId, questionId: String(current.question_id), status: current.status, currentDiagnosticNodeId: String(current.current_diagnostic_node_id), diagnosedErrorTypes: currentErrors, providedConcepts: Array.isArray(current.provided_concepts) ? current.provided_concepts.map(String) : [], retryCount: Number(current.retry_count ?? 0), retryAnswer: String(current.retry_answer ?? ""), isCompleted: Boolean(current.is_completed), needsTeacherHelp: Boolean(current.needs_teacher_help), startedAt: String(current.started_at), completedAt: current.completed_at ? String(current.completed_at) : null, updatedAt: String(current.updated_at) } : null,
      completedCount: studentRecords.filter((record) => Boolean(record.is_completed)).length,
      unresolvedCount: studentRecords.filter((record) => !Boolean(record.is_completed)).length,
      latestError: currentErrors.at(-1) ?? null,
      lessonCompletionCount,
    };
  });
  return { totalStudents: students.length, todayLoginCount: studentRowsForDashboard.filter((item) => item.student.lastLoginAt?.startsWith(today)).length, completedStudentCount: studentRowsForDashboard.filter((item) => item.completedCount > 0).length, diagnosingCount: studentRowsForDashboard.filter((item) => item.currentRecord?.status === "DIAGNOSING" || item.currentRecord?.status === "CONCEPT_HELP").length, retryingCount: studentRowsForDashboard.filter((item) => item.currentRecord?.status === "RETRYING").length, teacherHelpCount: studentRowsForDashboard.filter((item) => item.currentRecord?.needsTeacherHelp).length, totalHelpRequests: studentRowsForDashboard.filter((item) => item.currentRecord?.needsTeacherHelp).length, lessonCatalog: lessonCatalogFromRows(questionRows as Array<Record<string, unknown>>), lessonCompletionsByStudent, students: studentRowsForDashboard };
};

export async function GET(request: Request) {
  if (isSupabaseConfigured()) {
    const teacher = await supabaseTeacher(request);
    if (!teacher) return Response.json({ message: "교사 로그인 후 이용할 수 있습니다." }, { status: 401 });
    return Response.json({ dashboard: await supabaseDashboard(teacher.accessToken) });
  }
  if (!isTeacher(request)) return Response.json({ message: "교사 로그인 후 이용할 수 있습니다." }, { status: 401 });
  return Response.json({ dashboard: demoStore.teacherDashboard() });
}

export async function POST(request: Request) {
  if (isSupabaseConfigured()) {
    const teacher = await supabaseTeacher(request);
    if (!teacher) return Response.json({ message: "교사 로그인 후 이용할 수 있습니다." }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    if (body.action === "reset-password") {
      const rows = await supabaseRest(`students?select=id,student_number&student_number=eq.${Number(body.studentNumber)}&is_active=eq.true&limit=1`, { admin: true }) as Array<{ id: string; student_number: number }>;
      const row = rows[0];
      if (!row) return Response.json({ message: "학생을 찾을 수 없습니다." }, { status: 404 });
      await supabaseAdmin(`/auth/v1/admin/users/${row.id}`, { method: "PUT", body: JSON.stringify({ password: authPasswordForPin("000") }) });
      await supabaseRest(`students?id=eq.${row.id}`, { method: "PATCH", admin: true, body: JSON.stringify({ must_change_password: true, failed_login_count: 0, locked_until: null, updated_at: new Date().toISOString() }) });
      await supabaseAdmin(`/auth/v1/admin/users/${row.id}/logout`, { method: "POST" }).catch(() => undefined);
      return Response.json({ student: { id: row.id, studentNumber: row.student_number, mustChangePassword: true } });
    }
    return Response.json({ message: "알 수 없는 교사 요청입니다." }, { status: 400 });
  }
  if (!isTeacher(request)) return Response.json({ message: "교사 로그인 후 이용할 수 있습니다." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (body.action === "reset-password") {
    const student = demoStore.resetStudentPassword(Number(body.studentNumber));
    return student ? Response.json({ student }) : Response.json({ message: "학생을 찾을 수 없습니다." }, { status: 404 });
  }
  return Response.json({ message: "알 수 없는 교사 요청입니다." }, { status: 400 });
}
