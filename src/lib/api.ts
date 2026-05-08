export const API_URL = import.meta.env.DEV ? 'http://localhost:8000/api.php' : '/api.php';

// Mock backend for preview environment since PHP cannot run here
async function handleMockApi(action: string, data: any, token: string | null) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const getDb = () => JSON.parse(window.localStorage.getItem('mock_db') || '{"users":[],"settings":{}}');
      const saveDb = (db: any) => window.localStorage.setItem('mock_db', JSON.stringify(db));
      const db = getDb();

      try {
        switch (action) {
          case 'check_setup':
            resolve({ setup: db.users.length > 0 });
            break;
          case 'setup':
            const adminEmail = data.admin_email ? data.admin_email.toLowerCase() : 'highprofiled@gmail.com';
            if (!db.users.find((u: any) => u.email === adminEmail)) {
              db.users.push({ email: adminEmail, password: data.admin_pass, role: 'superadmin' });
              saveDb(db);
            }
            resolve({ success: true });
            break;
          case 'login':
            const user = db.users.find((u: any) => u.email === data.email);
            if (user && user.password === data.password) {
              resolve({ success: true, token: 'mock-token-' + user.email, user: { email: user.email, role: user.role } });
            } else {
              reject(new Error('Invalid credentials'));
            }
            break;
          case 'get_me':
            if (!token) throw new Error('Unauthorized');
            const email = token.replace('mock-token-', '');
            const u = db.users.find((us: any) => us.email === email);
            if (u) resolve({ user: { email: u.email, role: u.role } });
            else reject(new Error('Unauthorized'));
            break;
          case 'get_settings':
            resolve({ settings: db.settings });
            break;
          case 'save_settings':
            db.settings[data.key] = data.value;
            saveDb(db);
            resolve({ success: true });
            break;
          case 'get_users':
            resolve({ users: db.users.map((us:any) => ({email: us.email, role: us.role, created_at: new Date().toISOString()})) });
            break;
          case 'add_user':
            if (!db.users.find((us:any) => us.email === data.email)) {
              db.users.push({ email: data.email, password: data.password, role: 'member' });
              saveDb(db);
            }
            resolve({ success: true });
            break;
          case 'delete_user':
            db.users = db.users.filter((us:any) => us.email !== data.email);
            saveDb(db);
            resolve({ success: true });
            break;
          case 'set_password':
            if (!token) throw new Error('Unauthorized');
            const targetEmail = token.replace('mock-token-', '');
            const targetUser = db.users.find((u: any) => u.email === targetEmail);
            if (targetUser) {
              targetUser.password = data.password;
              saveDb(db);
              resolve({ success: true });
            } else {
              reject(new Error('Unauthorized'));
            }
            break;
          default:
            reject(new Error('Mock action not implemented: ' + action));
        }
      } catch (err: any) {
        reject(err);
      }
    }, 400); // simulate network delay
  });
}

export async function apiRequest(action: string, data?: any) {
  const token = window.localStorage.getItem('auth_token');
  const headers: any = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_URL}?action=${action}`, {
      method: data ? 'POST' : 'GET',
      headers,
      body: data ? JSON.stringify(data) : undefined
    });
  } catch (error: any) {
    if (import.meta.env.DEV && (error.message.includes('Failed to fetch') || error.message.includes('Load failed') || error.message.includes('NetworkError'))) {
      console.warn('API fetch failed, falling back to mock local storage for preview.');
      return handleMockApi(action, data, token);
    }
    throw error;
  }

  const text = await response.text();
  try {
    const json = JSON.parse(text);
    if (!response.ok || json.error) {
      throw new Error(json.error || `HTTP Error ${response.status}`);
    }
    return json;
  } catch (e: any) {
    throw new Error(e.message || 'API request failed');
  }
}
