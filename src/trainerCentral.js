export async function getAuthToken() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "client_credentials",
    scope: "TrainerCentral.courseapi.ALL,TrainerCentral.sessionapi.ALL"
  });
  const tokenUrl = `https://accounts.zohocloud.ca/oauth/v2/token?${params}`;
  const resp = await fetch(tokenUrl, { method: "POST" });
  const jsonData = await resp.json();
  return jsonData?.access_token;
}

export async function trainerCentralRequest(path, method, body = null) {
  // Retrieve or reuse a token
  let token = await getOrSetCachedToken();
  
  let headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
  
  const url = `https://pathway-to-hope.trainercentral.ca/api/v4${path}`;
  
  const options = {
    method: method,
    headers
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  // Attempt request
  const response = await fetch(url, options);
  
  // If token invalid, re-fetch and retry once
  if (response.status === 401) {
    token = await refreshToken(); 
    headers.Authorization = `Bearer ${token}`;
    return fetch(url, options);
  }
  
  return response;
}
