import { demoStore } from "../../../../lib/demo-store";
import { clearAuthCookieHeaders, getCookie, isSupabaseConfigured, supabaseAdmin } from "../../../../lib/supabase-rest";

export async function POST(request: Request) {
  if (isSupabaseConfigured()) {
    const accessToken = getCookie(request, "bp-access");
    if (accessToken) await supabaseAdmin("/auth/v1/logout", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } }).catch(() => undefined);
    const headers = new Headers({ "content-type": "application/json; charset=utf-8" });
    for (const cookie of clearAuthCookieHeaders) headers.append("set-cookie", cookie);
    return new Response(JSON.stringify({ ok: true }), { headers });
  }
  const token = request.headers.get("cookie")?.match(/(?:^|; )bp-session=([^;]+)/)?.[1] ?? null;
  demoStore.deleteSession(token);
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json; charset=utf-8", "set-cookie": "bp-session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0" } });
}
