import { fetchCourses, fetchLessons } from './trainerCentral.js';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/courses') {
    const courses = await fetchCourses();
    return new Response(JSON.stringify(courses), { headers: { 'Content-Type': 'application/json' } });
  }

  if (path.startsWith('/lessons')) {
    const courseId = url.searchParams.get('courseId');
    if (!courseId) {
      return new Response('Course ID is required', { status: 400 });
    }
    const lessons = await fetchLessons(courseId);
    return new Response(JSON.stringify(lessons), { headers: { 'Content-Type': 'application/json' } });
  }

  return new Response('Not Found', { status: 404 });
}
