import React, { useState } from "react";
import { authService } from "../services/authService";

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    // ✅ Validasi input sebelum kirim ke backend
    if (!username || !password) {
      setError("Username dan password wajib diisi");
      return;
    }

    const response = isSignup
      ? await authService.signup(username, password)
      : await authService.login(username, password);

    if (response.error) {
      setError(response.error);
      return;
    }

    // Simpan user aktif di localStorage (session sederhana)
    authService.setActiveUser(response.user);
    setError("");
    onSuccess(); // bisa diarahkan ke dashboard
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-80">
        <h2 className="text-xl font-bold mb-4 text-center text-brand-primary">
          {isSignup ? "Sign Up" : "Login"}
        </h2>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <input
          type="text"
          placeholder="Username"
          className="w-full border rounded-md p-2 mb-3"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border rounded-md p-2 mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="w-full bg-brand-primary text-white py-2 rounded-md mb-2"
          onClick={handleSubmit}
        >
          {isSignup ? "Daftar" : "Masuk"}
        </button>

        <p
          className="text-sm text-center text-blue-600 cursor-pointer"
          onClick={() => setIsSignup(!isSignup)}
        >
          {isSignup ? "Sudah punya akun? Login" : "Belum punya akun? Sign Up"}
        </p>
      </div>
    </div>
  );
}
