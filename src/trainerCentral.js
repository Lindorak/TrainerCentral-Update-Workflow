import { TrainerCentralAPI } from './trainerCentralAPI.js';

const tokenKey = 'trainercentral_token';

export async function getOrSetCachedToken() {
  let token = await KV_TCUK.get(tokenKey);
  if (!token) {
    token = await TrainerCentralAPI.authenticate();
    await KV_TCUK.put(tokenKey, token, { expirationTtl: 3600 }); // Cache for 1 hour
  }
  return token;
}

export async function fetchCourses() {
  const token = await getOrSetCachedToken();
  const response = await TrainerCentralAPI.getCourses(token);
  return response.data;
}

export async function fetchLessons(courseId) {
  const token = await getOrSetCachedToken();
  const response = await TrainerCentralAPI.getLessons(token, courseId);
  return response.data;
}
