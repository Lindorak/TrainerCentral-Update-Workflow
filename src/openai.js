export async function callOpenAI(requestBody) {
  // requestBody might be the user’s raw query
  const fetchResponse = await fetch("https://pathway-to-hope.trainercentral.ca/api/v4/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: requestBody }]
    })
  });
  const responseData = await fetchResponse.json();
  const aiText = responseData?.choices?.[0]?.message?.content;
  // Possibly run a second prompt to distill the intent into JSON
  // Return structured data:
  return JSON.parse(aiText);
}
