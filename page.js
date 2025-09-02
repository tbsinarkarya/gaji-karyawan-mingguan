"use client";

import { useState, useEffect } from "react";

export default function HomePage() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    name: "",
    position: "",
    daily_rate: "",
    weekly_allowance: "",
    image_url: "",
  });

  // Ambil data dari API saat load
  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    const res = await fetch("/api/employees");
    const data = await res.json();
    setEmployees(data);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", position: "", daily_rate: "", weekly_allowance: "", image_url: "" });
    fetchEmployees(); // refresh data
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Daftar Karyawan</h1>

      {/* Form tambah karyawan */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <input
          type="text"
          placeholder="Nama"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 w-full rounded"
          required
        />
        <input
          type="text"
          placeholder="Jabatan"
          value={form.position}
          onChange={(e) => setForm({ ...form, position: e.target.value })}
          className="border p-2 w-full rounded"
          required
        />
        <input
          type="number"
          placeholder="Gaji Harian"
          value={form.daily_rate}
          onChange={(e) => setForm({ ...form, daily_rate: e.target.value })}
          className="border p-2 w-full rounded"
          required
        />
        <input
          type="number"
          placeholder="Tunjangan Mingguan"
          value={form.weekly_allowance}
          onChange={(e) => setForm({ ...form, weekly_allowance: e.target.value })}
          className="border p-2 w-full rounded"
          required
        />
        <input
          type="text"
          placeholder="URL Foto"
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          className="border p-2 w-full rounded"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Tambah Karyawan
        </button>
      </form>

      {/* Tabel data karyawan */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Nama</th>
            <th className="border p-2">Jabatan</th>
            <th className="border p-2">Gaji Harian</th>
            <th className="border p-2">Tunjangan Mingguan</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td className="border p-2">{emp.name}</td>
              <td className="border p-2">{emp.position}</td>
              <td className="border p-2">{emp.daily_rate}</td>
              <td className="border p-2">{emp.weekly_allowance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
