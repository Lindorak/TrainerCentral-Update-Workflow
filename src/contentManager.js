// contentManager.js
import { trainerCentralRequest } from './trainercentral.js';
import { generateVersionLabel, storeVersionData, getVersionData } from './versionControl.js';

const ORG_ID = "xxxx"; // Example org ID, or pass it in function arguments

/** 
 * 1) get_content
 *    - Fetch all courses, then fetch sessions & materials for each course
 *    - Save them to KV with a version label
 */
export async function get_content(parsedIntent, env) {
  // 1. Generate a new version label, e.g. 2025-01-19-alpha
  const versionLabel = await generateVersionLabel(env);

  // 2. Get all courses
  const courseResp = await trainerCentralRequest(`/${ORG_ID}/courses.json`, "GET", null, env);
  const coursesData = await courseResp.json();

  // 3. For each course, gather sessions
  const allData = [];
  for (const course of coursesData) {
    // Example: you might have a separate GET for sessions in a course
    // If your real endpoint differs, adjust accordingly
    const sessions = []; // do the actual fetch
    // Example: trainerCentralRequest(`/${ORG_ID}/courses/${course.id}/sessions.json`, "GET", null, env);

    // For each session, gather materials
    // Store the data structure
    allData.push({
      course,
      sessions
      // ...
    });
  }

  // 4. Save everything to KV under that version label
  await storeVersionData(versionLabel, allData, env);

  return {
    message: `Fetched courses and sessions. Stored under version: ${versionLabel}.`,
    versionLabel
  };
}

/**
 * 2) update_content
 *    - Create a new version label from an existing version
 *    - Modify only the content the user asked for
 */
export async function update_content(parsedIntent, env) {
  // Identify the previous version to base updates on
  // This might come from user input, or you take the "latest" version
  const baseVersion = parsedIntent.baseVersion || "latest";
  const oldData = await getVersionData(baseVersion, env);

  // Create a new version label
  const versionLabel = await generateVersionLabel(env, "update"); 
  // e.g. => update-2025-01-19-alpha-beta

  // Modify the relevant item(s)
  // For example, find the specific course/session/material
  // Then update the text as requested in parsedIntent.newContent
  // The shape of oldData is up to your get_content design

  // Save the updated structure under the new version
  await storeVersionData(versionLabel, oldData, env);

  return {
    message: `Updated content from ${baseVersion} and stored new version: ${versionLabel}.`,
    versionLabel
  };
}

/**
 * 3) upload_content
 *    - Push the data from the specified version to TrainerCentral
 *    - You can handle partial updates if you want
 */
export async function upload_content(parsedIntent, env) {
  const versionToUpload = parsedIntent.version || "latest";
  const dataToUpload = await getVersionData(versionToUpload, env);

  // For each course, session, material, call the respective TrainerCentral endpoints
  // e.g. PUT /{orgId}/courses/{courseId}.json to update course
  // e.g. PUT or POST to session endpoints, etc.

  // Example skeleton:
  // for (const item of dataToUpload) {
  //   const courseId = item.course.id;
  //   const body = {
  //     name: item.course.name,
  //     description: item.course.description
  //   };
  //   await trainerCentralRequest(`/${ORG_ID}/courses/${courseId}.json`, "PUT", body, env);
  //
  //   // Then for each session, do a session update
  //   // Then for each material, do a material update
  // }

  return {
    message: `Uploaded data from version ${versionToUpload} to TrainerCentral.`,
    versionUploaded: versionToUpload
  };
}
