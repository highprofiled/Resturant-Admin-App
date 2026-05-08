export const API_URL = import.meta.env.DEV ? 'http://localhost:8000/api.php' : '/api.php';

export async function apiRequest(action: string, data?: any) {
  const token = window.localStorage.getItem('auth_token');
  const headers: any = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}?action=${action}`, {
    method: data ? 'POST' : 'GET',
    headers,
    body: data ? JSON.stringify(data) : undefined
  });

  const text = await response.text();
  try {
    const json = JSON.parse(text);
    if (!response.ok || json.error) {
      throw new Error(json.error || `HTTP Error ${response.status}`);
    }
    return json;
  } catch (e: any) {
    throw new Error(json?.error || e.message || 'API request failed');
  }
}
