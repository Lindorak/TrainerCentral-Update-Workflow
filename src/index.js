addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const TRAINERCENTRAL_API_KEY = globalThis.TRAINERCENTRAL_API_KEY; // TrainerCentral API Key
  const OPENAI_API_KEY = globalThis.OPENAI_API_KEY; // OpenAI API Key
  const TRAINERCENTRAL_BASE_URL = 'https://api.trainercentral.com/v1'; // TrainerCentral API Base URL
  const KV_NAMESPACE_ID = globalThis.KV_NAMESPACE_ID; // Optional: KV Namespace for caching

  const url = new URL(request.url);
  const path = url.pathname;

  try {
    if (path === '/command') {
      const body = await request.json();
      const command = body.command;

      // Step 1: Use OpenAI to analyze the command and determine intent
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

      // Example: If the intent involves expanding materials
      if (intent.includes('expand materials')) {
        const courseName = extractCourseName(command); // Helper function to extract course name
        const data = await fetchCourseData(TRAINERCENTRAL_API_KEY, TRAINERCENTRAL_BASE_URL, courseName);

        // Optional: Cache data in KV namespace
        if (KV_NAMESPACE_ID) {
          await cacheDataInKV(data, 'courseData'); // Helper function to cache data
        }

        // Step 2: Process materials and expand them using OpenAI
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

// Helper function: Extract course name from command
function extractCourseName(command) {
  const match = command.match(/course '(.*?)'/);
  return match ? match[1] : null;
}

// Helper function: Fetch all course, lesson, and material data
async function fetchCourseData(apiKey, baseUrl, courseName) {
  const coursesResponse = await fetch(`${baseUrl}/courses`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const courses = await coursesResponse.json();
  const course = courses.find(c => c.name === courseName);

  if (!course) {
    throw new Error(`Course '${courseName}' not found.`);
  }

  const lessonsResponse = await fetch(`${baseUrl}/courses/${course.id}/lessons`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const lessons = await lessonsResponse.json();

  const materials = [];
  for (const lesson of lessons) {
    const materialsResponse = await fetch(`${baseUrl}/lessons/${lesson.id}/materials`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const lessonMaterials = await materialsResponse.json();
    materials.push(...lessonMaterials);
  }

  return { course, lessons, materials };
}

// Helper function: Cache data in KV namespace
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

// Helper function: Use OpenAI to expand materials
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
