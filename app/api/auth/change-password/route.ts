import { demoStore } from "../../../../lib/demo-store";
import { authPasswordForPin, getCookie, isSupabaseConfigured, supabaseRest, supabaseUpdatePassword, supabaseUser } from "../../../../lib/supabase-rest";

const getSession = (request: Request) => demoStore.getSession(request.headers.get("cookie")?.match(/(?:^|; )bp-session=([^;]+)/)?.[1] ?? null);

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const pin = String(body.pin ?? "");
  const confirmation = String(body.confirmation ?? "");
  if (pin !== confirmation) return Response.json({ message: "두 비밀번호가 같지 않습니다." }, { status: 400 });
  if (!/^\d{3}$/.test(pin) || pin === "000") return Response.json({ message: "000이 아닌 3자리 숫자를 입력해 주세요." }, { status: 400 });

  if (isSupabaseConfigured()) {
    const accessToken = getCookie(request, "bp-access");
    const user = accessToken ? await supabaseUser(accessToken) : null;
    if (!accessToken || !user) return Response.json({ message: "로그인이 필요합니다." }, { status: 401 });
    await supabaseUpdatePassword(accessToken, authPasswordForPin(pin));
    const rows = await supabaseRest(`students?id=eq.${user.id}&select=id,student_number,name,must_change_password,failed_login_count,locked_until,is_active,last_login_at`, { token: accessToken }) as Array<{ id: string; student_number: number; name: string; must_change_password: boolean; failed_login_count: number; locked_until: string | null; is_active: boolean; last_login_at: string | null }>;
    const row = rows[0];
    if (!row) return Response.json({ message: "학생 계정을 찾을 수 없습니다." }, { status: 404 });
    await supabaseRest(`students?id=eq.${user.id}`, { method: "PATCH", token: accessToken, body: JSON.stringify({ must_change_password: false, failed_login_count: 0, updated_at: new Date().toISOString() }) });
    return Response.json({ student: { id: row.id, studentNumber: row.student_number, name: row.name, mustChangePassword: false, failedLoginCount: 0, lockedUntil: row.locked_until, isActive: row.is_active, lastLoginAt: row.last_login_at } });
  }

  const session = getSession(request);
  if (!session?.studentId) return Response.json({ message: "로그인이 필요합니다." }, { status: 401 });
  const result = await demoStore.changeStudentPassword(session.studentId, pin);
  if (!result.ok) return Response.json({ message: result.message }, { status: 400 });
  return Response.json({ student: result.student });
}
