//utility functions for cookie-based session management with the backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
//log in - call after Firebase login, passing userId
export async function loginToBackend(userId) {
  const res = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // send cookies
    body: JSON.stringify({ userId }),
  });
  return res.json();
}

//check session: call on app load to see if user is logged in
export async function checkSession() {
  const res = await fetch(`${API_BASE_URL}/api/session`, {
    credentials: 'include', // send cookies
  });
  return res.json(); // { loggedIn: true, userId: ... } or { loggedIn: false }
}

//log out: call to clear the session cookie
export async function logoutFromBackend() {
  const res = await fetch(`${API_BASE_URL}/api/logout`, {
    method: 'POST',
    credentials: 'include', // send cookies
  });
  return res.json();
} 