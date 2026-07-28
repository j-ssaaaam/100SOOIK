import { demoStore } from "../../../lib/demo-store";
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

const supabaseDashboard = async (teacherToken: string) => {
  const [studentRows, recordRows] = await Promise.all([
    supabaseRest("students?select=id,student_number,name,must_change_password,failed_login_count,locked_until,is_active,last_login_at&order=student_number.asc", { token: teacherToken, admin: true }),
    supabaseRest("learning_records?select=*&order=updated_at.desc", { token: teacherToken, admin: true }),
  ]);
  const students = studentRows as Array<Record<string, unknown>>;
  const records = recordRows as Array<Record<string, unknown>>;
  const today = new Date().toISOString().slice(0, 10);
  const studentRowsForDashboard = students.map((row) => {
    const studentId = String(row.id);
    const studentRecords = records.filter((record) => String(record.student_id) === studentId);
    const current = studentRecords[0];
    const currentErrors = Array.isArray(current?.diagnosed_error_types) ? current.diagnosed_error_types.map(String) : [];
    return {
      student: { id: studentId, studentNumber: Number(row.student_number), name: String(row.name), mustChangePassword: Boolean(row.must_change_password), failedLoginCount: Number(row.failed_login_count ?? 0), lockedUntil: row.locked_until ? String(row.locked_until) : null, isActive: Boolean(row.is_active), lastLoginAt: row.last_login_at ? String(row.last_login_at) : null },
      currentRecord: current ? { id: String(current.id), studentId, questionId: String(current.question_id), status: current.status, currentDiagnosticNodeId: String(current.current_diagnostic_node_id), diagnosedErrorTypes: currentErrors, providedConcepts: Array.isArray(current.provided_concepts) ? current.provided_concepts.map(String) : [], retryCount: Number(current.retry_count ?? 0), retryAnswer: String(current.retry_answer ?? ""), isCompleted: Boolean(current.is_completed), needsTeacherHelp: Boolean(current.needs_teacher_help), startedAt: String(current.started_at), completedAt: current.completed_at ? String(current.completed_at) : null, updatedAt: String(current.updated_at) } : null,
      completedCount: studentRecords.filter((record) => Boolean(record.is_completed)).length,
      unresolvedCount: studentRecords.filter((record) => !Boolean(record.is_completed)).length,
      latestError: currentErrors.at(-1) ?? null,
    };
  });
  return { totalStudents: students.length, todayLoginCount: studentRowsForDashboard.filter((item) => item.student.lastLoginAt?.startsWith(today)).length, completedStudentCount: studentRowsForDashboard.filter((item) => item.completedCount > 0).length, diagnosingCount: studentRowsForDashboard.filter((item) => item.currentRecord?.status === "DIAGNOSING" || item.currentRecord?.status === "CONCEPT_HELP").length, retryingCount: studentRowsForDashboard.filter((item) => item.currentRecord?.status === "RETRYING").length, teacherHelpCount: studentRowsForDashboard.filter((item) => item.currentRecord?.needsTeacherHelp).length, totalHelpRequests: studentRowsForDashboard.filter((item) => item.currentRecord?.needsTeacherHelp).length, students: studentRowsForDashboard };
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
