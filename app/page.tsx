"use client";

import React, { useEffect, useState, useCallback } from "react";
import type { Employee, WeeklyPayroll } from "@/types";

// ⬇️ Gunakan alias absolut supaya tidak salah resolusi komponen
import BottomNav from "@/components/BottomNav";
import ConfirmationModal from "@/components/ConfirmationModal";
import Dashboard from "@/components/Dashboard";
import EmployeeFormModal from "@/components/EmployeeFormModal";
import PayrollCalculator from "@/components/PayrollCalculator";
import PayrollHistory from "@/components/PayrollHistory";

type View = "dashboard" | "calculator" | "history";

// ⬇️ UPDATE: selaraskan dengan perubahan di PayrollCalculator (tambah extraAllowance)
interface PayrollPayload {
  employeeId: number;
  daysWorked: number;
  totalAllowance: number;
  extraAllowance: number; // <<< baru
  loanDeduction: number;
}

// ErrorBoundary tetap sama...
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
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: number;
    type: "employee" | "payroll";
  } | null>(null);

  // ... (sisanya tetap sama sampai bagian payroll)

  const handleProcessPayroll = useCallback(
    async (employeePayments: PayrollPayload[]) => {
      try {
        const res = await fetch("/api/payrolls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // ⬇️ pastikan server backend juga menerima dan menyimpan extraAllowance
          body: JSON.stringify({ employeePayments }),
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

  // ... (sisanya tidak berubah)
}
