import React, { useEffect, useState } from "react";
import type { Employee } from "@/types";

type NewEmployee = Omit<Employee, "id" | "created_at">;

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEmployee: (employee: NewEmployee) => Promise<void>; // ⬅️ pakai NewEmployee
  onUpdateEmployee: (employee: Employee) => Promise<void>;
  employeeToEdit: Employee | null;
}

const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  onAddEmployee,
  onUpdateEmployee,
  employeeToEdit,
}) => {
  const isEdit = Boolean(employeeToEdit);

  const [name, setName] = useState("");
  const [position, setPosition] = useState("");            // ⬅️ JABATAN
  const [dailyRate, setDailyRate] = useState<string>("");
  const [weeklyAllowance, setWeeklyAllowance] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (isOpen && employeeToEdit) {
      setName(employeeToEdit.name ?? "");
      setPosition(employeeToEdit.position ?? "");          // ⬅️ isi dari data edit
      setDailyRate(String(employeeToEdit.daily_rate ?? 0));
      setWeeklyAllowance(String(employeeToEdit.weekly_allowance ?? 0));
      setImageUrl(employeeToEdit.image_url ?? "");
    } else if (isOpen) {
      // reset on open (add mode)
      setName("");
      setPosition("");
      setDailyRate("");
      setWeeklyAllowance("");
      setImageUrl("");
    }
  }, [isOpen, employeeToEdit]);

  if (!isOpen) return null;

  const parseIntSafe = (v: string) => {
    const n = parseInt(v.replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(n) ? n : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payloadBase = {
      name: name.trim(),
      position: position.trim(),                            // ⬅️ include position
      daily_rate: parseIntSafe(dailyRate),
      weekly_allowance: parseIntSafe(weeklyAllowance),
      image_url: imageUrl.trim(),
    };

    if (!payloadBase.name) {
      alert("Nama tidak boleh kosong.");
      return;
    }
    if (!payloadBase.position) {
      alert("Jabatan tidak boleh kosong.");
      return;
    }
    if (payloadBase.daily_rate <= 0) {
      alert("Gaji harian harus lebih dari 0.");
      return;
    }

    try {
      if (isEdit && employeeToEdit) {
        await onUpdateEmployee({ ...employeeToEdit, ...payloadBase });
      } else {
        // created_at akan diisi backend
        await onAddEmployee(payloadBase);
      }
      onClose();
    } catch (err) {
      console.error("Submit employee error:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* modal */}
      <div className="relative z-10 w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-800">
            {isEdit ? "Edit Karyawan" : "Tambah Karyawan"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Nama</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Nama karyawan"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Jabatan</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="cth: Operator, Admin, Driver"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">
              Gaji Harian (Rp)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={dailyRate}
              onChange={(e) => setDailyRate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="cth: 100000"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Masukkan angka (tanpa titik/koma). Contoh: 80000
            </p>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">
              Tunjangan Mingguan (Rp)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={weeklyAllowance}
              onChange={(e) => setWeeklyAllowance(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="cth: 50000"
            />
            <p className="text-xs text-slate-500 mt-1">
              Dipakai otomatis bila karyawan masuk 6 hari.
            </p>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Foto (URL)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="https://..."
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2 rounded-lg transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition"
            >
              {isEdit ? "Simpan Perubahan" : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeFormModal;
