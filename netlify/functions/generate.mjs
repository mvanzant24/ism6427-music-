import { json, guard, suno } from "./_suno.mjs";

const MODELS = ["V6", "V6_MINI", "V6_WILD"];
const clip = (s, n) => (typeof s === "string" ? s.trim().slice(0, n) : "");

export default async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const denied = guard(req);
  if (denied) return denied;

  let b;
  try { b = await req.json(); } catch { return json({ error: "Bad JSON" }, 400); }

  const customMode = !!b.customMode;
  const instrumental = !!b.instrumental;
  const model = MODELS.includes(b.model) ? b.model : "V6";
  const site = process.env.URL || new URL(req.url).origin;

  const body = { customMode, instrumental, model, callBackUrl: `${site}/.netlify/functions/callback` };
  const style = clip(b.style, 1000);
  const lyrics = clip(b.lyrics, 5000);

  if (customMode) {
    const title = clip(b.title, 80);
    const negativeTags = clip(b.negativeTags, 1000);
    if (!style && !lyrics && !negativeTags) return json({ error: "Custom mode needs a style, lyrics, or tags to avoid." }, 400);
    if (title) body.title = title;
    if (style) body.style = style;
    if (negativeTags) body.negativeTags = negativeTags;
    if (lyrics && !instrumental) body.lyrics = lyrics;
    if (b.vocalGender === "m" || b.vocalGender === "f") body.vocalGender = b.vocalGender;
    const d = Number(b.duration);
    if (d >= 10 && d <= 360) body.duration = Math.round(d);
  } else {
    const prompt = clip(b.prompt, 3000);
    if (!prompt && !style) return json({ error: "Describe your song or give a style." }, 400);
    if (prompt) body.prompt = prompt;
    if (style) body.style = style;
  }

  const r = await suno("/api/v1/generate", { method: "POST", body });
  if (r.code !== 200) return json({ error: r.msg || "Generation failed", code: r.code }, 502);
  return json({ taskId: r.data?.taskId });
};
