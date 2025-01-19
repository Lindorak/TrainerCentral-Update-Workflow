// trainercentral.js

const TOKEN_KEY = "TRAINER_CENTRAL_ACCESS_TOKEN";
const TOKEN_EXPIRY_KEY = "TRAINER_CENTRAL_TOKEN_EXPIRY";
const ONE_MINUTE_IN_MS = 60_000;

/**
 * Retrieve a valid TrainerCentral (Zoho) token from Cloudflare KV,
 * or request a new one if it’s expired or if forceRefresh is true.
 */
async function getOrSetCachedToken(env, forceRefresh = false) {
  if (!forceRefresh) {
    // 1) Check KV for a stored token
    const storedToken = await env.KV_TCUK.get(TOKEN_KEY);
    const storedExpiry = await env.KV_TCUK.get(TOKEN_EXPIRY_KEY);

    if (storedToken && storedExpiry) {
      const expiryTime = parseInt(storedExpiry, 10);
      const now = Date.now();

      // If token is valid for at least another minute, reuse it
      if (now + ONE_MINUTE_IN_MS < expiryTime) {
        return storedToken;
      }
    }
  }

  // 2) Otherwise, fetch a new token
  const newTokenData = await fetchNewToken(env);
  // Example response:
  // {
  //   "access_token":"1000.xxxxxxx",
  //   "scope":"TrainerCentral.courseapi.ALL ...",
  //   "api_domain":"https://www.zohoapis.ca",
  //   "token_type":"Bearer",
  //   "expires_in":3600
  // }

  const newToken = newTokenData.access_token;
  const newExpiryTime = Date.now() + (newTokenData.expires_in * 1000);

  // 3) Cache the new token and expiry in KV
  await env.KV_TCUK.put(TOKEN_KEY, newToken);
  await env.KV_TCUK.put(TOKEN_EXPIRY_KEY, newExpiryTime.toString());

  return newToken;
}

/**
 * Makes a POST request to Zoho’s OAuth endpoint to retrieve a new TrainerCentral token.
 */
async function fetchNewToken(env) {
  const params = new URLSearchParams({
    client_id: env.CLIENT_ID,
    client_secret: env.CLIENT_SECRET,
    grant_type: "client_credentials",
    scope: "TrainerCentral.courseapi.ALL,TrainerCentral.sessionapi.ALL"
  });

  const tokenUrl = `https://accounts.zohocloud.ca/oauth/v2/token?${params}`;
  const resp = await fetch(tokenUrl, { method: "POST" });

  if (!resp.ok) {
    throw new Error(`Failed to fetch token: ${resp.status} ${resp.statusText}`);
  }

  return resp.json();
}

/**
 * Main function to call TrainerCentral’s API endpoints.
 * Automatically fetches or reuses the Zoho access token from KV.
 * Retries once if the token is invalid (401).
 */
export async function trainerCentralRequest(path, method = "GET", body = null, env) {
  // 1) Ensure we have a valid token
  let token = await getOrSetCachedToken(env);

  // 2) Prepare request to TrainerCentral
  const url = `https://pathway-to-hope.trainercentral.ca/api/v4${path}`;
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  // 3) Send the request
  let response = await fetch(url, options);

  // 4) If token expired or invalid, retry once with a fresh token
  if (response.status === 401) {
    token = await getOrSetCachedToken(env, true);
    headers.Authorization = `Bearer ${token}`;

    response = await fetch(url, options);
  }

  return response;
}
