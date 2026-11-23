// Step 2 of the admin login: GitHub sends the user back here with a code.
// The code is swapped for a token and handed to the admin panel window (Decap CMS handshake).
function page(status, payload, origin) {
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Login</title></head><body>
<p>${status === "success" ? "Login successful. This window will close." : "Login failed. Please close this window and try again."}</p>
<script>
(function () {
  var msg = ${JSON.stringify(message)};
  var allowed = ${JSON.stringify(origin)};
  function receive(e) {
    if (e.origin !== allowed) return;
    window.opener.postMessage(msg, e.origin);
    window.removeEventListener("message", receive, false);
  }
  if (window.opener) {
    window.addEventListener("message", receive, false);
    window.opener.postMessage("authorizing:github", allowed);
  }
})();
</script></body></html>`;
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Set-Cookie": "decap_oauth_state=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    },
  });
}

function readCookie(request, name) {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return "";
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) return page("error", { message: "Missing code" }, origin);
  if (!state || state !== readCookie(request, "decap_oauth_state")) {
    return page("error", { message: "Login check failed (state). Try again." }, origin);
  }
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return page("error", { message: "GitHub keys are not set in Cloudflare Pages settings." }, origin);
  }

  try {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "sariful-portfolio-admin" },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${origin}/api/callback`,
      }),
    });
    const data = await res.json();
    if (!data.access_token) {
      return page("error", { message: data.error_description || data.error || "No token" }, origin);
    }
    return page("success", { token: data.access_token, provider: "github" }, origin);
  } catch (e) {
    return page("error", { message: "Could not reach GitHub" }, origin);
  }
}
