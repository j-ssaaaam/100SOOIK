import { demoStore } from "../../../../lib/demo-store";
import { getCookie, isSupabaseConfigured, supabaseRest, supabaseUser } from "../../../../lib/supabase-rest";

export async function GET(request: Request) {
  if (isSupabaseConfigured()) {
    const accessToken = getCookie(request, "bp-access");
    const user = accessToken ? await supabaseUser(accessToken) : null;
    if (!accessToken || !user) return Response.json({ session: null }, { status: 401 });
    const students = await supabaseRest(`students?id=eq.${user.id}&select=id,student_number,name,must_change_password,failed_login_count,locked_until,is_active,last_login_at&limit=1`, { token: accessToken }) as Array<{ id: string; student_number: number; name: string; must_change_password: boolean; failed_login_count: number; locked_until: string | null; is_active: boolean; last_login_at: string | null }>;
    if (students[0]) {
      const row = students[0];
      return Response.json({ session: { kind: "student", student: { id: row.id, studentNumber: row.student_number, name: row.name, mustChangePassword: row.must_change_password, failedLoginCount: row.failed_login_count, lockedUntil: row.locked_until, isActive: row.is_active, lastLoginAt: row.last_login_at } } });
    }
    const teachers = await supabaseRest(`teachers?id=eq.${user.id}&select=id,name&limit=1`, { token: accessToken }) as Array<{ id: string; name: string }>;
    if (teachers[0]) return Response.json({ session: { kind: "teacher", teacher: teachers[0] } });
    return Response.json({ session: null }, { status: 401 });
  }
  const token = request.headers.get("cookie")?.match(/(?:^|; )bp-session=([^;]+)/)?.[1] ?? null;
  const session = demoStore.getSession(token);
  if (!session) return Response.json({ session: null }, { status: 401 });
  if (session.kind === "student") {
    const student = session.studentId ? demoStore.getStudent(session.studentId) : null;
    return Response.json({ session: { kind: "student", student } });
  }
  return Response.json({ session: { kind: "teacher", teacher: { name: "김선생님" } } });
}
