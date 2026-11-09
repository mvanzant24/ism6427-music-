const $ = (s) => document.querySelector(s);
const form = $("#form"), msg = $("#msg"), go = $("#go"), results = $("#results");
let mode = "simple";
let passcode = localStorageGet("passcode") || "";

const STYLES = ["pop", "hip hop", "lo-fi chill", "rock", "EDM", "country", "R&B", "jazz", "cinematic orchestral", "acoustic folk"];
$("#chips").innerHTML = STYLES.map((s) => `<button type="button">${s}</button>`).join("");
$("#chips").addEventListener("click", (e) => {
  if (e.target.tagName !== "BUTTON") return;
  const f = form.style, v = e.target.textContent;
  f.value = f.value ? `${f.value}, ${v}` : v;
});

document.querySelectorAll(".tab").forEach((t) =>
  t.addEventListener("click", () => {
    mode = t.dataset.mode;
    document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x === t));
    document.querySelectorAll("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== mode));
  })
);

function localStorageGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function localStorageSet(k, v) { try { localStorage.setItem(k, v); } catch {} }
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function api(path, opts = {}) {
  const res = await fetch(`/.netlify/functions/${path}`, {
    ...opts,
    headers: { "content-type": "application/json", "x-app-passcode": passcode, ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { $("#passWrap").hidden = false; throw new Error("Enter the passcode to use this app."); }
  if (!res.ok) throw new Error(friendly(data));
  return data;
}

function friendly(d) {
  const map = { 429: "Out of credits.", 430: "Too many requests — wait a moment.", 455: "Suno API is under maintenance.", 413: "Prompt too long." };
  return map[d.code] || d.error || "Something went wrong.";
}

function setMsg(text, err = false, spin = false) {
  msg.className = "msg" + (err ? " err" : "");
  msg.innerHTML = (spin ? '<span class="spinner"></span>' : "") + esc(text);
}

async function loadCredits() {
  try { const { credits } = await api("credits"); $("#credits").textContent = `Credits: ${credits}`; }
  catch { $("#credits").textContent = "Credits: —"; }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = new FormData(form);
  if (form.passcode.value) { passcode = form.passcode.value; localStorageSet("passcode", passcode); }

  const payload = {
    customMode: mode === "custom",
    instrumental: form.instrumental.checked,
    model: f.get("model"),
    style: f.get("style"),
  };
  if (mode === "simple") payload.prompt = f.get("prompt");
  else Object.assign(payload, {
    title: f.get("title"), lyrics: f.get("lyrics"), negativeTags: f.get("negativeTags"),
    vocalGender: f.get("vocalGender"), duration: f.get("duration"),
  });

  go.disabled = true;
  setMsg("Submitting…", false, true);
  try {
    const { taskId } = await api("generate", { method: "POST", body: JSON.stringify(payload) });
    await poll(taskId);
    loadCredits();
  } catch (err) {
    setMsg(err.message, true);
  } finally {
    go.disabled = false;
  }
});

const LABELS = { PENDING: "Queued…", TEXT_SUCCESS: "Writing lyrics…", FIRST_SUCCESS: "First track ready, finishing the second…" };
const FAIL = ["CREATE_TASK_FAILED", "GENERATE_AUDIO_FAILED", "CALLBACK_EXCEPTION", "SENSITIVE_WORD_ERROR"];

async function poll(taskId) {
  const started = Date.now();
  while (Date.now() - started < 10 * 60 * 1000) {
    const { status, error, tracks } = await api(`status?taskId=${encodeURIComponent(taskId)}`);
    if (FAIL.includes(status)) throw new Error(status === "SENSITIVE_WORD_ERROR" ? "Your prompt contains blocked words. Try rephrasing." : error || "Generation failed.");
    if (tracks?.length) render(taskId, tracks);
    if (status === "SUCCESS") { setMsg("Done! 🎉"); return; }
    setMsg(LABELS[status] || "Generating…", false, true);
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("Timed out. Try again later.");
}

function render(taskId, tracks) {
  let group = document.getElementById(`t-${taskId}`);
  if (!group) { group = document.createElement("div"); group.id = `t-${taskId}`; results.prepend(group); }
  group.innerHTML = tracks.map((t) => {
    const src = t.audio || t.stream;
    return `<article class="track">
      <img src="${esc(t.image)}" alt="" loading="lazy" />
      <div>
        <h3>${esc(t.title || "Untitled")}</h3>
        <p class="tags">${esc(t.tags)}${t.duration ? ` · ${Math.round(t.duration)}s` : ""}</p>
        ${src ? `<audio controls preload="none" src="${esc(src)}"></audio>` : "<p class='tags'>Rendering audio…</p>"}
        ${t.audio ? `<a href="${esc(t.audio)}" target="_blank" rel="noopener" download>Download MP3</a>` : ""}
      </div>
      ${t.lyrics ? `<details><summary>Lyrics</summary><pre>${esc(t.lyrics)}</pre></details>` : ""}
    </article>`;
  }).join("");
}

loadCredits();
