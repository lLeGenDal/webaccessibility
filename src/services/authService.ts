import { UserProfile } from "../types";

const API_BASE = "/api/auth";

export const authService = {
  async register(email: string, password: string, displayName: string) {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    localStorage.setItem("token", data.token);
    return data;
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Login failed");
    }
    const data = await res.json();
    localStorage.setItem("token", data.token);
    return data;
  },

  async getMe() {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const res = await fetch(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      localStorage.removeItem("token");
      return null;
    }
    return await res.json();
  },

  logout() {
    localStorage.removeItem("token");
  }
};
