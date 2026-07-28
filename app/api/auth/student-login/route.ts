import { demoStore } from "../../../../lib/demo-store";
import { authCookieHeaders, isSupabaseConfigured, supabasePasswordLogin, supabaseRest } from "../../../../lib/supabase-rest";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const studentNumber = Number(body.studentNumber);
  const pin = String(body.pin ?? "");
  if (!Number.isInteger(studentNumber) || !/^\d{3}$/.test(pin)) return Response.json({ message: "학생 번호와 3자리 비밀번호를 확인해 주세요." }, { status: 400 });
  if (isSupabaseConfigured()) {
    const rows = await supabaseRest(`students?select=id,student_number,name,must_change_password,failed_login_count,locked_until,is_active,last_login_at,auth_email&student_number=eq.${studentNumber}&is_active=eq.true&limit=1`, { admin: true }) as Array<{ id: string; student_number: number; name: string; must_change_password: boolean; failed_login_count: number; locked_until: string | null; is_active: boolean; last_login_at: string | null; auth_email: string }>;
    const row = rows[0];
    if (!row) return Response.json({ message: "학생 번호를 찾을 수 없습니다." }, { status: 404 });
    if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) return Response.json({ message: "잠시 입력이 제한되었습니다. 선생님께 도움을 요청해 주세요.", locked: true }, { status: 401 });
    const session = await supabasePasswordLogin(row.auth_email, pin);
    if (!session) {
      const nextFailedCount = row.failed_login_count + 1;
      await supabaseRest(`students?id=eq.${row.id}`, { method: "PATCH", admin: true, body: JSON.stringify({ failed_login_count: nextFailedCount, locked_until: nextFailedCount >= 5 ? new Date(Date.now() + 60_000).toISOString() : null, updated_at: new Date().toISOString() }) });
      return Response.json({ message: nextFailedCount >= 5 ? "잠시 입력이 제한되었습니다. 선생님께 도움을 요청해 주세요." : "비밀번호를 다시 확인해 주세요.", locked: nextFailedCount >= 5 }, { status: 401 });
    }
    await supabaseRest(`students?id=eq.${row.id}`, { method: "PATCH", admin: true, body: JSON.stringify({ failed_login_count: 0, locked_until: null, last_login_at: new Date().toISOString(), updated_at: new Date().toISOString() }) });
    const headers = new Headers({ "content-type": "application/json; charset=utf-8" });
    for (const cookie of authCookieHeaders(session.access_token, session.refresh_token, "student")) headers.append("set-cookie", cookie);
    return new Response(JSON.stringify({ student: { id: row.id, studentNumber: row.student_number, name: row.name, mustChangePassword: row.must_change_password, failedLoginCount: 0, lockedUntil: null, isActive: row.is_active, lastLoginAt: new Date().toISOString() } }), { headers });
  }
  const result = await demoStore.loginStudent(studentNumber, pin);
  if (!result.ok) return Response.json({ message: result.message, locked: result.locked ?? false }, { status: 401 });
  return new Response(JSON.stringify({ student: { id: result.student.id, studentNumber: result.student.studentNumber, mustChangePassword: result.student.mustChangePassword } }), { headers: { "content-type": "application/json; charset=utf-8", "set-cookie": `bp-session=${result.token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800` } });
}
