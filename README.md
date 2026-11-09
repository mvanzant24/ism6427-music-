# SongForge — AI music generator

Static frontend (`public/`) + Netlify Functions (`netlify/functions/`) that proxy [sunoapi.org](https://docs.sunoapi.org/). Your API key never reaches the browser.

## Deploy on Netlify
1. Import this repo in Netlify. Build settings come from `netlify.toml` (no build command needed).
2. Site configuration → Environment variables:
   - `SUNO_API_KEY` — **required**
   - `APP_PASSCODE` — optional, strongly recommended (otherwise anyone with the URL can spend your credits)
   - `SUNO_API_BASE` — optional, defaults to `https://apibox.erweima.ai` (the host in the docs)
3. Redeploy.

## How it works
`generate` → POST `/api/v1/generate` returns a `taskId`; the browser polls `status` → GET `/api/v1/generate/record-info` every 5s until `SUCCESS`. `credits` shows the balance. `callback` just acknowledges Suno's required callback.

## Local dev
```
npm i -g netlify-cli
cp .env.example .env   # add your key
netlify dev
```
