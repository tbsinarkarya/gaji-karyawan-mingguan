"use client";

import React, { useEffect, useState, useCallback } from "react";
import type { Employee, WeeklyPayroll } from "@/types";

import BottomNav from "@/components/BottomNav";
import ConfirmationModal from "@/components/ConfirmationModal";
import Dashboard from "@/components/Dashboard";
import EmployeeFormModal from "@/components/EmployeeFormModal";
import PayrollCalculator from "@/components/PayrollCalculator";
import PayrollHistory from "@/components/PayrollHistory";

type View = "dashboard" | "calculator" | "history";

// Selaras dengan PayrollCalculator (ada Tunjangan Lain / extraAllowance)
interface PayrollPayload {
  employeeId: number;
  daysWorked: number;
  totalAllowance: number;
  extraAllowance: number;
  loanDeduction: number;
}

// Tipe payload tambah karyawan (created_at diisi backend)
type NewEmployee = Omit<Employee, "id" | "created_at">;

// Error boundary sederhana agar tidak blank page
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("App crashed:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center text-red-600">
          <h2 className="font-bold text-lg">Terjadi kesalahan</h2>
          <p>Silakan refresh halaman.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Page() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<WeeklyPayroll[]>([]);
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null);
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: number;
    type: "employee" | "payroll";
  } | null>(null);

  // --- Load data API ---
  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const me = await res.json();
          setCurrentUser({ username: me.username, role: me.role });
        }
      } catch {}
    };
    const loadEmployees = async () => {
      try {
        const res = await fetch("/api/employees");
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching employees:", err);
        setEmployees([]);
      }
    };

    const loadPayrolls = async () => {
      try {
        const res = await fetch("/api/payrolls");
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const data = await res.json();
        setPayrolls(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching payrolls:", err);
        setPayrolls([]);
      }
    };

    loadMe();
    loadEmployees();
    loadPayrolls();
  }, []);

  // --- Employee CRUD ---
  const handleAddEmployee = async (employee: NewEmployee) => {
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employee),
      });
      if (!res.ok) throw new Error("Gagal tambah employee");
      const newEmployee: Employee = await res.json();
      setEmployees((prev) => [...prev, newEmployee]);
    } catch (err) {
      console.error("Error add employee:", err);
    } finally {
      setIsModalOpen(false);
    }
  };

  const handleUpdateEmployee = async (employee: Employee) => {
    try {
      const res = await fetch("/api/employees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employee),
      });
      if (!res.ok) throw new Error("Gagal update employee");
      const updated: Employee = await res.json();
      setEmployees((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e))
      );
    } catch (err) {
      console.error("Error update employee:", err);
    } finally {
      setIsModalOpen(false);
      setEditingEmployee(null);
    }
  };

  const handleDeleteEmployee = (id: number) => {
    setItemToDelete({ id, type: "employee" });
    setIsConfirmModalOpen(true);
  };

  const handleOpenEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  // --- Payroll ---
  const handleProcessPayroll = useCallback(
    async (
      employeePayments: PayrollPayload[],
      weekStartDate: string,
      weekEndDate: string
    ) => {
      try {
        const res = await fetch("/api/payrolls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeePayments, weekStartDate, weekEndDate }),
        });
        if (!res.ok) throw new Error("Gagal proses payroll");
        const newPayroll: WeeklyPayroll = await res.json();
        setPayrolls((prev) => [newPayroll, ...prev]);
        setCurrentView("history");
      } catch (err) {
        console.error("Error process payroll:", err);
      }
    },
    []
  );

  const handleDeletePayroll = (id: number) => {
    setItemToDelete({ id, type: "payroll" });
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === "employee") {
        await fetch("/api/employees", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: itemToDelete.id }),
        });
        setEmployees((prev) => prev.filter((e) => e.id !== itemToDelete.id));
      } else if (itemToDelete.type === "payroll") {
        await fetch(`/api/payrolls/${itemToDelete.id}`, { method: "DELETE" });
        setPayrolls((prev) => prev.filter((p) => p.id !== itemToDelete.id));
      }
    } catch (err) {
      console.error("Error delete:", err);
    } finally {
      setIsConfirmModalOpen(false);
      setItemToDelete(null);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <Dashboard
            employees={employees}
            payrolls={payrolls}
            onAddEmployee={handleOpenAddModal}
            onEditEmployee={handleOpenEditModal}
            onDeleteEmployee={handleDeleteEmployee}
          />
        );
      case "calculator":
        return (
          <PayrollCalculator
            employees={employees}
            onProcessPayroll={handleProcessPayroll}
          />
        );
      case "history":
        return (
          <PayrollHistory
            payrolls={payrolls}
            onDeletePayroll={handleDeletePayroll}
          />
        );
      default:
        return (
          <Dashboard
            employees={employees}
            payrolls={payrolls}
            onAddEmployee={handleOpenAddModal}
            onEditEmployee={handleOpenEditModal}
            onDeleteEmployee={handleDeleteEmployee}
          />
        );
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-100 font-sans">
        <div className="max-w-md mx-auto bg-white shadow-lg min-h-screen pb-20">
          <header className="bg-indigo-600 text-white p-4 shadow-md flex items-center justify-between gap-2">
            <h1 className="text-2xl font-bold">Payroll App</h1>
            <div className="flex items-center gap-3 text-sm">
              {currentUser && (
                <span className="px-2 py-1 bg-white/10 rounded">
                  {currentUser.username} ({currentUser.role})
                </span>
              )}
              <button
              onClick={async () => {
                try {
                  await fetch('/api/auth/logout', { method: 'POST' });
                } finally {
                  window.location.href = '/login';
                }
              }}
              className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded"
            >
              Keluar
            </button>
            </div>
          </header>
          <main className="p-4">{renderView()}</main>
          <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
        </div>

        {/* Modal Add/Edit */}
        {isModalOpen && (
          <EmployeeFormModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingEmployee(null);
            }}
            onAddEmployee={handleAddEmployee}          // <- pakai NewEmployee
            onUpdateEmployee={handleUpdateEmployee}
            employeeToEdit={editingEmployee}
          />
        )}

        {/* Modal Konfirmasi */}
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Konfirmasi Penghapusan"
          message="Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan."
        />
      </div>
    </ErrorBoundary>
  );
}
