const BASE_URL = 'https://api.trainercentral.com/v1';

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

  async getCourses(token) {
    const response = await fetch(`${BASE_URL}/courses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
  },

  async getLessons(token, courseId) {
    const response = await fetch(`${BASE_URL}/courses/${courseId}/lessons`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
  }
};
