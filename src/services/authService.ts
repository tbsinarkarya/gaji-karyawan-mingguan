// src/services/authService.ts

export const authService = {
  signup: async (username: string, password: string) => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "signup", username, password }),
    });

    return res.json();
  },

  login: async (username: string, password: string) => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", username, password }),
    });

    return res.json();
  },

  logout: () => {
    localStorage.removeItem("activeUser");
  },

  setActiveUser: (username: string) => {
    localStorage.setItem("activeUser", username);
  },

  getActiveUser: (): string | null => {
    return localStorage.getItem("activeUser");
  },
};
