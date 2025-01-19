addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const KV_NAMESPACE_ID = globalThis.KV_NAMESPACE_ID; // Secret stored in Cloudflare
  const CF_ACCOUNT_ID = '<YOUR_ACCOUNT_ID>'; // Replace with your Cloudflare Account ID
  const CF_API_TOKEN = globalThis.CF_API_TOKEN; // Secret API token for Cloudflare KV REST API

  const url = new URL(request.url);
  const path = url.pathname;

  try {
    if (path === '/courses') {
      // Example: Fetch data from the KV store
      const key = 'someKey'; // Replace with your desired key
      const kvUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/${key}`;

      const response = await fetch(kvUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${CF_API_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch KV data: ${response.statusText}`);
      }

      const data = await response.text();
      return new Response(data || 'No data found', {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response('Endpoint not found', { status: 404 });
    }
  } catch (error) {
    console.error('Worker Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
