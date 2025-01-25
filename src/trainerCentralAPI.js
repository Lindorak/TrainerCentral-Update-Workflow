const BASE_URL = 'https://accounts.zohocloud.ca/';

export const TrainerCentralAPI = {
  async authenticate() {
    const response = await fetch(`${BASE_URL}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET
        granttype: client_credentials
        scope: TrainerCentral.courseapi.ALL,TrainerCentral.sessionapi.ALL
      })
    });
    const data = await response.json();
    return data.token;
  },

  async getCourses(token, orgId) {
    const response = await fetch(`${BASE_URL}/${orgId}/courses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
  },

  async getLessons(token, courseId, accountId) {
    const response = await fetch(`${BASE_URL}/${orgId}/courses/${courseId}/lessons`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
  }
};
