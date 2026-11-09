import { json, guard, suno } from "./_suno.mjs";

export default async (req) => {
  const denied = guard(req);
  if (denied) return denied;
  const taskId = new URL(req.url).searchParams.get("taskId");
  if (!taskId || !/^[\w-]{1,100}$/.test(taskId)) return json({ error: "taskId required" }, 400);

  const r = await suno(`/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`);
  if (r.code !== 200) return json({ error: r.msg || "Lookup failed", code: r.code }, 502);
  const d = r.data || {};
  const tracks = (d.response?.sunoData || []).map((t) => ({
    id: t.id,
    title: t.title,
    tags: t.tags,
    duration: t.duration,
    image: t.image_url || t.imageUrl,
    audio: t.audio_url || t.audioUrl,
    stream: t.stream_audio_url || t.streamAudioUrl,
    lyrics: t.prompt,
  }));
  return json({ status: d.status, error: d.errorMessage, tracks });
};
