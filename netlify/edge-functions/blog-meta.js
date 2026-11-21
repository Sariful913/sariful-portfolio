// Puts each blog post's own title/excerpt/image into link-preview tags for /blog/<slug>.
function slugify(s){ return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
function slugOf(p, i){ return slugify(p.slug) || slugify(p.id) || slugify(p.title) || ("post-" + (i + 1)); }
function slugList(items){ const used = {}; return items.map((it, i) => { let s = slugOf(it, i); const b = s; let n = 2; while (used[s]) { s = b + "-" + n; n++; } used[s] = 1; return s; }); }
function attr(s){ return String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

export default async (request, context) => {
  const res = await context.next();
  try {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/blog\/([^\/?#]+)/);
    if (!m) return res;
    const want = decodeURIComponent(m[1]).toLowerCase();
    const r = await fetch(new URL("/content/blog-posts.json", url.origin));
    if (!r.ok) return res;
    const data = await r.json();
    const posts = Array.isArray(data) ? data : (data.posts || []);
    const sl = slugList(posts);
    const i = sl.indexOf(want);
    if (i < 0) return res;
    const p = posts[i];
    const title = attr((p.title || "Blog") + " - MD Sariful Islam");
    const desc = attr(p.excerpt || "MD Sariful Islam-এর ব্লগ পোস্ট");
    const img = p.image ? attr(new URL(p.image, url.origin).href) : "";
    const page = attr(url.origin + url.pathname);
    let html = await res.text();
    html = html
      .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
      .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${desc}">`)
      .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`)
      .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${desc}"><meta property="og:url" content="${page}"><meta name="twitter:card" content="summary_large_image">`);
    if (img) html = html.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${img}">`);
    const headers = new Headers(res.headers);
    headers.delete("content-length");
    return new Response(html, { status: res.status, headers });
  } catch (e) {
    return res;
  }
};
