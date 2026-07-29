type SupabaseInit = RequestInit & { token?: string | null; admin?: boolean };

const url = () => process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
const anonKey = () => process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "";
const serviceRoleKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isSupabaseConfigured = () => Boolean(url() && anonKey() && serviceRoleKey());
export const authPasswordForPin = (pin: string) => `bp-${pin}`;

const authHeaders = (token?: string | null, admin = false) => {
  const key = admin ? serviceRoleKey() : anonKey();
  return { apikey: key, Authorization: `Bearer ${token ?? key}`, "content-type": "application/json" };
};

export async function supabaseRest(path: string, init: SupabaseInit = {}) {
  const { token, admin, ...requestInit } = init;
  const response = await fetch(`${url()}/rest/v1/${path}`, { ...requestInit, headers: { ...authHeaders(token, admin), ...(requestInit.headers ?? {}) } });
  const text = await response.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) throw new Error(typeof data === "object" && data && "message" in data ? String(data.message) : `Supabase 요청 실패 (${response.status})`);
  return data;
}

export async function supabaseAdmin(path: string, init: RequestInit = {}) {
  const response = await fetch(`${url()}${path}`, { ...init, headers: { ...authHeaders(null, true), ...(init.headers ?? {}) } });
  const text = await response.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) throw new Error(typeof data === "object" && data && "message" in data ? String(data.message) : `Supabase 관리자 요청 실패 (${response.status})`);
  return data;
}

export async function supabasePasswordLogin(email: string, password: string) {
  const response = await fetch(`${url()}/auth/v1/token?grant_type=password`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ email, password }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return null;
  return data as { access_token: string; refresh_token: string; user: { id: string } };
}

export async function supabaseUser(accessToken: string) {
  const response = await fetch(`${url()}/auth/v1/user`, { headers: authHeaders(accessToken) });
  if (!response.ok) return null;
  return await response.json() as { id: string; email?: string; user_metadata?: Record<string, unknown> };
}

export async function supabaseUpdateUserData(accessToken: string, data: Record<string, unknown>) {
  const response = await fetch(`${url()}/auth/v1/user`, { method: "PUT", headers: authHeaders(accessToken), body: JSON.stringify({ data }) });
  if (!response.ok) throw new Error("진도 체크 저장에 실패했습니다.");
  return await response.json() as { user_metadata?: Record<string, unknown> };
}

export async function supabaseUpdatePassword(accessToken: string, password: string) {
  const response = await fetch(`${url()}/auth/v1/user`, { method: "PUT", headers: authHeaders(accessToken), body: JSON.stringify({ password }) });
  if (!response.ok) throw new Error("비밀번호 변경에 실패했습니다.");
}

export const getCookie = (request: Request, name: string) => request.headers.get("cookie")?.match(new RegExp(`(?:^|; )${name}=([^;]+)`))?.[1] ?? null;

export const authCookieHeaders = (accessToken: string, refreshToken: string, kind: "student" | "teacher") => [
  `bp-access=${accessToken}; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800`,
  `bp-refresh=${refreshToken}; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000`,
  `bp-kind=${kind}; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800`,
];

export const clearAuthCookieHeaders = [
  "bp-access=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0",
  "bp-refresh=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0",
  "bp-kind=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0",
];
