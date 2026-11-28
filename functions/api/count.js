// Public read / download counters for /pdf and /blog items.
// Storage: Workers KV binding COUNTERS (namespace "sariful-portfolio-counters").
// Each key "c:<item>" holds {"bv":base views,"bd":base downloads,"v":real views,"d":real downloads}.
// Shown number = base + real. Bases were seeded once on 28 Nov 2026 and never change.
//   GET  /api/count?keys=pdf:slug,blog:slug   -> {"pdf:slug":{"views":N,"downloads":N}, ...}
//   POST /api/count  {"key":"pdf:slug","type":"view"|"download"}  -> {"ok":true,...}
// The same visitor (IP) is counted once per item and type every 30 minutes.

import { uniqueSlugs, pdfBase, blogBase } from "../../cf-lib/share-meta.js";

const KEY_RE = /^(pdf|blog):[a-z0-9][a-z0-9-]{0,99}$/;
const HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

function reply(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: HEADERS });
}

async function readItem(env, key) {
  const raw = await env.COUNTERS.get("c:" + key, { type: "json" });
  return raw && typeof raw === "object" ? raw : null;
}

function shape(rec) {
  const r = rec || {};
  return {
    views: (Number(r.bv) || 0) + (Number(r.v) || 0),
    downloads: (Number(r.bd) || 0) + (Number(r.d) || 0),
  };
}

async function itemExists(env, request, key) {
  const [section, slug] = key.split(":");
  const path = section === "pdf" ? "/content/resources.json" : "/content/blog-posts.json";
  try {
    const res = await env.ASSETS.fetch(new URL(path, request.url));
    if (!res.ok) return false;
    const data = await res.json();
    const items = Array.isArray(data) ? data : (section === "pdf" ? data.resources : (data.posts || data.blog_posts || Object.values(data)[0])) || [];
    const slugs = uniqueSlugs(items, section === "pdf" ? pdfBase : blogBase);
    return slugs.includes(slug);
  } catch (e) {
    return false;
  }
}

export async function onRequestGet({ request, env }) {
  if (!env.COUNTERS) return reply({ error: "not configured" }, 503);
  const url = new URL(request.url);
  const keys = String(url.searchParams.get("keys") || "")
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter((k) => KEY_RE.test(k))
    .slice(0, 60);
  const unique = [...new Set(keys)];
  const out = {};
  await Promise.all(unique.map(async (k) => { out[k] = shape(await readItem(env, k)); }));
  return reply(out);
}

export async function onRequestPost({ request, env }) {
  if (!env.COUNTERS) return reply({ error: "not configured" }, 503);
  let body = null;
  try {
    const text = await request.text();
    if (text.length > 500) return reply({ error: "too large" }, 413);
    body = JSON.parse(text);
  } catch (e) {
    return reply({ error: "bad json" }, 400);
  }
  const key = String((body && body.key) || "").trim().toLowerCase();
  const type = body && body.type === "download" ? "download" : body && body.type === "view" ? "view" : "";
  if (!KEY_RE.test(key) || !type) return reply({ error: "bad key or type" }, 400);
  if (type === "download" && !key.startsWith("pdf:")) return reply({ error: "bad type" }, 400);

  const rec = await readItem(env, key);
  // Keys without a record are accepted only if that item really exists on the site
  // (a new resource / blog post); it then starts from 0. Random keys are refused.
  if (!rec && !(await itemExists(env, request, key))) return reply({ error: "unknown item" }, 404);
  const ip = request.headers.get("cf-connecting-ip") || "0";
  const cache = caches.default;
  const marker = new Request("https://count-dedupe.invalid/" + encodeURIComponent(ip) + "/" + key + "/" + type);
  if (await cache.match(marker)) return reply({ ok: true, counted: false, ...shape(rec) });

  const next = Object.assign({ bv: 0, bd: 0, v: 0, d: 0 }, rec || {});
  if (type === "view") next.v = (Number(next.v) || 0) + 1;
  else next.d = (Number(next.d) || 0) + 1;
  await env.COUNTERS.put("c:" + key, JSON.stringify(next));
  await cache.put(marker, new Response("1", { headers: { "cache-control": "max-age=1800" } }));
  return reply({ ok: true, counted: true, ...shape(next) });
}

export async function onRequest({ request }) {
  return reply({ error: "method not allowed" }, 405);
}
