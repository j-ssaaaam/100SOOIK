import { demoStore } from "../../../../lib/demo-store";
import { authCookieHeaders, isSupabaseConfigured, supabasePasswordLogin } from "../../../../lib/supabase-rest";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const password = String(body.password ?? "");
  if (isSupabaseConfigured()) {
    const email = process.env.TEACHER_AUTH_EMAIL ?? "";
    const session = email ? await supabasePasswordLogin(email, password) : null;
    if (!session) return Response.json({ message: "교사 비밀번호를 다시 확인해 주세요." }, { status: 401 });
    const headers = new Headers({ "content-type": "application/json; charset=utf-8" });
    for (const cookie of authCookieHeaders(session.access_token, session.refresh_token, "teacher")) headers.append("set-cookie", cookie);
    return new Response(JSON.stringify({ teacher: { name: "김선생님" } }), { headers });
  }
  const result = demoStore.loginTeacher(password);
  if (!result.ok) return Response.json({ message: result.message }, { status: 401 });
  return new Response(JSON.stringify({ teacher: { name: "김선생님" } }), { headers: { "content-type": "application/json; charset=utf-8", "set-cookie": `bp-session=${result.token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800` } });
}
