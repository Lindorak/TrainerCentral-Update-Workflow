import { callOpenAI } from './openai.js';
import { get_content, update_content, upload_content } from './contentManager.js';

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'POST') {
      const requestBody = await request.json();
      
      // 1) Determine user intent via callOpenAI
      const parsedIntent = await callOpenAI(requestBody.userQuery);

      // 2) Route to the correct function
      let result;
      if (parsedIntent.intent === 'get_content') {
        result = await get_content(parsedIntent);
      } else if (parsedIntent.intent === 'update_content') {
        result = await update_content(parsedIntent);
      } else if (parsedIntent.intent === 'upload_content') {
        result = await upload_content(parsedIntent);
      } else if (parsedIntent.intent === 'rollback') {
        // call rollback logic
        result = await rollbackToVersion(parsedIntent.versionLabel);
      } else {
        result = { message: "Unrecognized intent." };
      }

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response("Send a POST request.", { status: 400 });
    }
  }
}
