import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' },
});

export async function healthCheck() {
  const { data } = await api.get('/health');
  return data;
}

/** POST /api/chat — session_id, message, source_location (optional) */
export async function sendMessage(sessionId, message, sourceLocation = null) {
  const body = {
    session_id: sessionId,
    message,
    source_location: sourceLocation ?? null,
  };
  const { data } = await api.post('/api/chat', body);
  return data;
}

/** POST /api/select-destination — first-time destination pick */
export async function selectDestination(sessionId, chosenDestination, chosenCountry) {
  const { data } = await api.post('/api/select-destination', {
    session_id: sessionId,
    chosen_destination: chosenDestination,
    chosen_country: chosenCountry,
  });
  return data;
}

/** POST /api/switch-destination — change destination after plan exists */
export async function switchDestination(sessionId, chosenDestination, chosenCountry) {
  const { data } = await api.post('/api/switch-destination', {
    session_id: sessionId,
    chosen_destination: chosenDestination,
    chosen_country: chosenCountry,
  });
  return data;
}

/** DELETE /api/session/{session_id} */
export async function clearSession(sessionId) {
  const { data } = await api.delete(`/api/session/${sessionId}`);
  return data;
}

export default api;
