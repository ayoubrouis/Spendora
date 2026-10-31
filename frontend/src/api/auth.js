import { clearToken, request, saveToken } from "./client.js";

export async function register(email, password) {
  return request(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    { notifySessionExpired: false },
  );
}

export async function login(email, password) {
  const result = await request(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    { notifySessionExpired: false },
  );
  saveToken(result.token);
  return result.user;
}

export async function verifyEmail(token) {
  const result = await request(
    "/auth/verify-email",
    {
      method: "POST",
      body: JSON.stringify({ token }),
    },
    { notifySessionExpired: false },
  );
  saveToken(result.token);
  return result.user;
}

export function resendVerification(email) {
  return request(
    "/auth/resend-verification",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
    { notifySessionExpired: false },
  );
}

export function forgotPassword(email) {
  return request(
    "/auth/forgot-password",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
    { notifySessionExpired: false },
  );
}

export function resetPassword(token, password) {
  return request(
    "/auth/reset-password",
    {
      method: "POST",
      body: JSON.stringify({ token, password }),
    },
    { notifySessionExpired: false },
  );
}

export function getCurrentUser() {
  return request("/auth/me", {}, { notifySessionExpired: false });
}

export function updateProfile(payload) {
  return request(
    "/auth/me",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    { notifySessionExpired: false },
  );
}

export async function logout() {
  try {
    await request(
      "/auth/logout",
      { method: "POST" },
      { notifySessionExpired: false },
    );
  } finally {
    clearToken();
  }
}

export { clearToken };
