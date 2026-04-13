import client from './client';

export async function login(email, password) {
  const response = await client.post('/api/auth/login', { email, password });
  return response.data;
}

export async function register(name, email, password) {
  const response = await client.post('/api/auth/register', { name, email, password });
  return response.data;
}

export async function getMe() {
  const response = await client.get('/api/auth/me');
  return response.data;
}

export async function getDashboard() {
  const response = await client.get('/api/users/dashboard');
  return response.data;
}


