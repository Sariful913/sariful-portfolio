// Step 1 of the admin login: sends the user to GitHub to approve access.
// Needs Cloudflare Pages env vars: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET.
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.GITHUB_CLIENT_ID) {
    return new Response("GITHUB_CLIENT_ID is not set in Cloudflare Pages settings.", { status: 500 });
  }
  const state = crypto.randomUUID();
  const scope = url.searchParams.get("scope") || "repo";
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authorize.searchParams.set("redirect_uri", `${url.origin}/api/callback`);
  authorize.searchParams.set("scope", scope);
  authorize.searchParams.set("state", state);
  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      "Set-Cookie": `decap_oauth_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
      "Cache-Control": "no-store",
    },
  });
}
