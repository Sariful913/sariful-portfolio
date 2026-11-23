// Shared helper for Cloudflare Pages Functions: serves pdf.html / blog.html
// for /pdf/<slug> and /blog/<slug>, with that item's own link-preview tags
// (title, description, image, url) for Facebook / WhatsApp / Messenger shares.
// Written fresh for Cloudflare. Any failure falls back to the plain page.

export function makeSlug(text) {
  return String(text == null ? "" : text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Gives every item a unique slug; repeats get -2, -3 ... (same link rule as the site's pages).
export function uniqueSlugs(items, pickBase) {
  const taken = new Set();
  return items.map((item, index) => {
    const base = pickBase(item, index);
    let candidate = base;
    let counter = 2;
    while (taken.has(candidate)) {
      candidate = `${base}-${counter}`;
      counter += 1;
    }
    taken.add(candidate);
    return candidate;
  });
}

export function pdfBase(item, index) {
  const fileName = String(item.pdf_file || "").split("?")[0].split("/").pop().replace(/\.pdf$/i, "");
  return makeSlug(item.slug) || makeSlug(fileName) || makeSlug(item.title) || `pdf-${index + 1}`;
}

export function blogBase(item, index) {
  return makeSlug(item.slug) || makeSlug(item.id) || makeSlug(item.title) || `post-${index + 1}`;
}

export function escapeAttr(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function setTag(html, pattern, replacement) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
}

// Fixes the page's default og:image (hard-coded to the old netlify address) to the current site.
function fixDefaultImage(html, origin) {
  return html.replace(
    /(<meta property="og:image" content=")https?:\/\/[^\/"]+(\/[^"]*")/,
    (_, start, rest) => `${start}${origin}${rest}`
  );
}

// Reads a static file through Pages' asset binding (this never re-enters the Functions).
// Cloudflare Pages serves "/pdf.html" at "/pdf" and may answer with a redirect,
// so one redirect hop is followed inside the asset store.
async function fetchAsset(env, origin, path) {
  let res = await env.ASSETS.fetch(new Request(new URL(path, origin).toString()));
  if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
    const next = new URL(res.headers.get("location"), origin);
    res = await env.ASSETS.fetch(new Request(new URL(next.pathname, origin).toString()));
  }
  return res;
}

/**
 * options: { section: "pdf"|"blog", page: "/pdf.html", data: "/content/resources.json",
 *            listKey: "resources", base: fn, fallbackTitle, fallbackDesc, descField, imageField }
 */
export async function handleShare(context, options) {
  const { request, env } = context;
  const url = new URL(request.url);
  const origin = url.origin;

  const pageRes = await fetchAsset(env, origin, options.page);
  if (!pageRes.ok) return pageRes;

  let html;
  try {
    html = await pageRes.text();
  } catch (e) {
    return pageRes;
  }

  const plain = () => {
    const headers = new Headers(pageRes.headers);
    headers.delete("content-length");
    headers.set("content-type", "text/html; charset=utf-8");
    return new Response(fixDefaultImage(html, origin), { status: 200, headers });
  };

  try {
    const match = url.pathname.match(new RegExp(`^/${options.section}/([^/?#]+)`));
    if (!match) return plain();
    const wanted = decodeURIComponent(match[1]).toLowerCase();

    const dataRes = await fetchAsset(env, origin, options.data);
    if (!dataRes.ok) return plain();
    const data = await dataRes.json();
    const items = Array.isArray(data) ? data : (data[options.listKey] || []);
    const slugs = uniqueSlugs(items, options.base);
    const position = slugs.indexOf(wanted);
    if (position < 0) return plain();
    const item = items[position];

    const title = escapeAttr(`${item.title || options.fallbackTitle} - MD Sariful Islam`);
    const desc = escapeAttr(item[options.descField] || options.fallbackDesc);
    const pageUrl = escapeAttr(origin + url.pathname);

    let out = fixDefaultImage(html, origin);
    out = setTag(out, /<title>[^<]*<\/title>/, `<title>${title}</title>`);
    out = setTag(out, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${desc}">`);
    out = setTag(out, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`);
    out = setTag(
      out,
      /<meta property="og:description" content="[^"]*">/,
      `<meta property="og:description" content="${desc}"><meta property="og:url" content="${pageUrl}"><meta name="twitter:card" content="summary_large_image">`
    );
    if (options.imageField && item[options.imageField]) {
      const img = escapeAttr(new URL(item[options.imageField], origin).href);
      out = setTag(out, /<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${img}">`);
    }

    const headers = new Headers(pageRes.headers);
    headers.delete("content-length");
    headers.set("content-type", "text/html; charset=utf-8");
    return new Response(out, { status: 200, headers });
  } catch (e) {
    return plain();
  }
}
