"use client";
import { useEffect, useState } from "react";
import { getEmployees, saveEmployee } from "../lib/employees";

export default function HomePage() {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    getEmployees().then(setEmployees).catch(console.error);
  }, []);

  const addEmployee = async () => {
    const newEmployee = {
      name: "Siti Aminah",
      position: "Kasir",
      daily_rate: 500000,
      weekly_allowance: 250000,
      image_url: "https://picsum.photos/seed/siti/200",
    };
    const saved = await saveEmployee(newEmployee);
    setEmployees([saved, ...employees]); // update UI
  };

  return (
    <main>
      <h1>Daftar Karyawan</h1>
      <button onClick={addEmployee}>Tambah Karyawan</button>
      <ul>
        {employees.map((e) => (
          <li key={e.id}>
            {e.name} - {e.position}
          </li>
        ))}
      </ul>
    </main>
  );
}

