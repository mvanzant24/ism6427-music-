// Suno requires a callBackUrl. The app polls /status instead, so just acknowledge.
export default async () => new Response("ok", { status: 200 });
