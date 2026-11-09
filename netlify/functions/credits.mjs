import { json, guard, suno } from "./_suno.mjs";

export default async (req) => {
  const denied = guard(req);
  if (denied) return denied;
  const r = await suno("/api/v1/generate/credit");
  if (r.code !== 200) return json({ error: r.msg, code: r.code }, 502);
  return json({ credits: r.data });
};
