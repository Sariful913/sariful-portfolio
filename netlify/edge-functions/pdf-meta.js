// Puts each PDF's own title/description into the page's link-preview tags,
// so Facebook / WhatsApp / Messenger show the right title when a /pdf/<slug> link is shared.
// If anything fails, the normal page is returned unchanged.
function slugify(s){ return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
function fileSlug(it){ return slugify(String(it.pdf_file || "").split("?")[0].split("/").pop().replace(/\.pdf$/i, "")); }
function slugOf(it, i){ return slugify(it.slug) || fileSlug(it) || slugify(it.title) || ("pdf-" + (i + 1)); }
function slugList(items){ const used = {}; return items.map((it, i) => { let s = slugOf(it, i); const b = s; let n = 2; while (used[s]) { s = b + "-" + n; n++; } used[s] = 1; return s; }); }
function attr(s){ return String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

export default async (request, context) => {
  const res = await context.next();
  try {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/pdf\/([^\/?#]+)/);
    if (!m) return res;
    const want = decodeURIComponent(m[1]).toLowerCase();
    const r = await fetch(new URL("/content/resources.json", url.origin));
    if (!r.ok) return res;
    const data = await r.json();
    const items = Array.isArray(data) ? data : (data.resources || []);
    let it = null;
    const sl = slugList(items); items.forEach((x, i) => { if (!it && sl[i] === want) it = x; });
    if (!it) return res;
    const title = attr((it.title || "Free PDF") + " - MD Sariful Islam");
    const desc = attr(it.description || "পুরো পোস্ট পড়ুন, PDF দেখুন আর ডাউনলোড করুন।");
    const page = attr(url.origin + url.pathname);
    let html = await res.text();
    html = html
      .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
      .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${desc}">`)
      .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`)
      .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${desc}"><meta property="og:url" content="${page}"><meta name="twitter:card" content="summary_large_image">`);
    const headers = new Headers(res.headers);
    headers.delete("content-length");
    return new Response(html, { status: res.status, headers });
  } catch (e) {
    return res;
  }
};
