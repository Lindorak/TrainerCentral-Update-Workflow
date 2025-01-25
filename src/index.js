addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const TRAINERCENTRAL_API_KEY = globalThis.TRAINERCENTRAL_API_KEY;
  const OPENAI_API_KEY = globalThis.OPENAI_API_KEY;
  const TRAINERCENTRAL_BASE_URL = 'https://pathway-to-hope.trainercentral.ca/api/v4';
  const KV_NAMESPACE_ID = globalThis.KV_NAMESPACE_ID;

  const url = new URL(request.url);
  const path = url.pathname;

  try {
    if (path === '/command') {
      if (request.method !== 'POST') {
        return new Response('Only POST requests are allowed for /command.', { status: 405 });
      }

      const body = await request.json();
      const command = body.command;

      // Analyze the command and determine intent using OpenAI
      const intentResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'system', content: 'Analyze the intent of the following command.' }, { role: 'user', content: command }],
        }),
      });

      const intentData = await intentResponse.json();
      const intent = intentData.choices[0].message.content;

      // Example: Handle intent to expand materials
      if (intent.includes('expand materials')) {
        const courseName = extractCourseName(command);
        if (!courseName) {
          return new Response('Invalid command. Could not extract course name.', { status: 400 });
        }

        // Try to fetch cached data
        const cachedData = await fetchFromKV('courseData');
        if (cachedData) {
          console.log('Returning cached data from KV.');
          return new Response(JSON.stringify(cachedData), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Fetch data from TrainerCentral
        const data = await fetchCourseData(TRAINERCENTRAL_API_KEY, TRAINERCENTRAL_BASE_URL, courseName);

        // Cache the data
        if (KV_NAMESPACE_ID) {
          await cacheDataInKV(data, 'courseData');
        }

        // Expand materials using OpenAI
        const expandedMaterials = await expandMaterialsWithOpenAI(data.materials, OPENAI_API_KEY);

        return new Response(JSON.stringify(expandedMaterials), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        return new Response('Command not recognized.', { status: 400 });
      }
    } else {
      return new Response('Endpoint not found', { status: 404 });
    }
  } catch (error) {
    console.error('Worker Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Helper: Extract course name from the command
function extractCourseName(command) {
  const match = command.match(/course '(.*?)'/);
  return match ? match[1] : null;
}

// Helper: Fetch data from KV namespace
async function fetchFromKV(key) {
  const kvUrl = `https://api.cloudflare.com/client/v4/accounts/${globalThis.CF_ACCOUNT_ID}/storage/kv/namespaces/${globalThis.KV_NAMESPACE_ID}/values/${key}`;
  const response = await fetch(kvUrl, {
    method: 'GET',
    headers: { Authorization: `Bearer ${globalThis.CF_API_TOKEN}` },
  });

  if (response.ok) {
    const data = await response.json();
    return data;
  }

  return null;
}

// Helper: Cache data in KV namespace
async function cacheDataInKV(data, key) {
  const kvUrl = `https://api.cloudflare.com/client/v4/accounts/${globalThis.CF_ACCOUNT_ID}/storage/kv/namespaces/${globalThis.KV_NAMESPACE_ID}/values/${key}`;
  await fetch(kvUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${globalThis.CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

// Helper: Fetch all course, lesson, and material data
async function fetchCourseData(apiKey, baseUrl, courseName) {
  const coursesResponse = await fetch(`${baseUrl}/courses`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const courses = await coursesResponse.json();
  const course = courses.find(c => c.name === courseName);

  if (!course) {
    throw new Error(`Course '${courseName}' not found.`);
  }

  const lessonsResponse = await fetch(`${baseUrl}/courses/${course.id}/lessons`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const lessons = await lessonsResponse.json();

  const materials = [];
  for (const lesson of lessons) {
    const materialsResponse = await fetch(`${baseUrl}/lessons/${lesson.id}/materials`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const lessonMaterials = await materialsResponse.json();
    materials.push(...lessonMaterials);
  }

  return { course, lessons, materials };
}

// Helper: Expand materials with OpenAI
async function expandMaterialsWithOpenAI(materials, apiKey) {
  const expandedMaterials = [];

  for (const material of materials) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'system', content: 'Expand the following material.' }, { role: 'user', content: material.text }],
      }),
    });

    const data = await response.json();
    expandedMaterials.push({
      materialId: material.id,
      original: material.text,
      expanded: data.choices[0].message.content,
    });
  }

  return expandedMaterials;
}
