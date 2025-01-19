import { TrainerCentralAPI } from './trainerCentralAPI.js';

const tokenKey = 'trainercentral_token';
const ACCOUNT_ID = globalThis.ACCOUNT_ID;

export async function getOrSetCachedToken(kvNamespace) {
  let token = await kvNamespace.get(tokenKey);
  if (!token) {
    token = await TrainerCentralAPI.authenticate();
    await kvNamespace.put(tokenKey, token, { expirationTtl: 3600 }); // Cache for 1 hour
  }
  return token;
}

export async function fetchCourses(kvNamespace) {
  const token = await getOrSetCachedToken(kvNamespace);
  const response = await TrainerCentralAPI.getCourses(token, ACCOUNT_ID);
  return response.data;
}

export async function fetchLessons(courseId, kvNamespace) {
  const token = await getOrSetCachedToken(kvNamespace);
  const response = await TrainerCentralAPI.getLessons(token, courseId, ACCOUNT_ID);
  return response.data;
}
