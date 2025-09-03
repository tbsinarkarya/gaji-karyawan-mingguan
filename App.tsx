"use client";
import { useEffect, useState } from "react";
import { getEmployees, saveEmployee } from "./api/employees";

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // ambil data dari API saat pertama load
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await getEmployees();
        setEmployees(data);
      } catch (err) {
        console.error("Gagal ambil employees:", err);
      } finally {
        setLoading(false);
      }
    };
    loadEmployees();
  }, []);

  // fungsi tambah karyawan baru
  const addEmployee = async () => {
    const newEmployee = {
      name: "Karyawan Baru",
      position: "Staff",
      daily_rate: 100000,
      weekly_allowance: 50000,
      image_url: "https://picsum.photos/seed/new/200",
    };

    try {
      const saved = await saveEmployee(newEmployee);
      setEmployees([saved, ...employees]);
    } catch (err) {
      console.error("Gagal simpan employee:", err);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <main style={{ padding: 20 }}>
      <h1>Daftar Karyawan</h1>
      <button onClick={addEmployee}>Tambah Karyawan</button>

      <ul>
        {employees.map((e: any) => (
          <li key={e.id}>
            <strong>{e.name}</strong> – {e.position} <br />
            Harian: Rp{e.daily_rate}, Tunjangan: Rp{e.weekly_allowance}
          </li>
        ))}
      </ul>
    </main>
  );
}
