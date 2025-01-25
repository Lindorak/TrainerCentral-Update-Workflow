const BASE_URL = 'https://pathway-to-hope.trainercentral.ca/api/v4';

export const TrainerCentralAPI = {
  async authenticate() {
    const response = await fetch(`${BASE_URL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET
      })
    });
    const data = await response.json();
    return data.token;
  },

  async getCourses(token, accountId) {
    const response = await fetch(`${BASE_URL}/accounts/${accountId}/courses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
  },

  async getLessons(token, courseId, accountId) {
    const response = await fetch(`${BASE_URL}/accounts/${accountId}/courses/${courseId}/lessons`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
  }
};
