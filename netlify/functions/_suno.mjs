const BASE = (process.env.SUNO_API_BASE || "https://apibox.erweima.ai").replace(/\/$/, "");

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export function guard(req) {
  if (!process.env.SUNO_API_KEY) return json({ error: "Server missing SUNO_API_KEY" }, 500);
  const pass = process.env.APP_PASSCODE;
  if (pass && req.headers.get("x-app-passcode") !== pass) return json({ error: "Invalid passcode" }, 401);
  return null;
}

export async function suno(path, { method = "GET", body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.SUNO_API_KEY}`,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({ code: res.status, msg: "Invalid response from Suno API" }));
  return data; // { code, msg, data }
}
