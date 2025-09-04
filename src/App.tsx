import React from 'react';
import type { Employee, WeeklyPayroll } from './types.ts';
import BottomNav from './components/BottomNav.tsx';
import ConfirmationModal from './components/ConfirmationModal.tsx';
import Dashboard from './components/Dashboard.tsx';
import EmployeeFormModal from './components/EmployeeFormModal.tsx';
import PayrollCalculator from './components/PayrollCalculator.tsx';
import PayrollHistory from './components/PayrollHistory.tsx';

const { useState, useEffect, useCallback } = React;

type View = 'dashboard' | 'calculator' | 'history';

interface PayrollPayload {
  employeeId: string;
  daysWorked: number;
  totalAllowance: number;
  loanDeduction: number;
}

const App: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<WeeklyPayroll[]>([]);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'employee' | 'payroll' } | null>(null);

  // --- Load data dari API ---
  useEffect(() => {
    fetch("/api/employees")
      .then(res => res.json())
      .then(data => setEmployees(data))
      .catch(err => console.error("Error fetching employees:", err));

    fetch("/api/payrolls")
      .then(res => res.json())
      .then(data => setPayrolls(data))
      .catch(err => console.error("Error fetching payrolls:", err));
  }, []);

  // --- Employee CRUD ---
  const handleAddEmployee = async (employee: Omit<Employee, 'id'>) => {
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employee),
    });
    const newEmployee = await res.json();
    setEmployees(prev => [...prev, newEmployee]);
    setIsModalOpen(false);
  };

  const handleUpdateEmployee = async (employee: Employee) => {
    const res = await fetch(`/api/employees/${employee.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employee),
    });
    const updated = await res.json();
    setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = (id: string) => {
    setItemToDelete({ id, type: 'employee' });
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
  const handleProcessPayroll = useCallback(async (employeePayments: PayrollPayload[]) => {
    const res = await fetch("/api/payrolls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeePayments }),
    });
    const newPayroll = await res.json();

    setPayrolls(prev => [newPayroll, ...prev]);
    setCurrentView('history');
  }, []);

  const handleDeletePayroll = (id: string) => {
    setItemToDelete({ id, type: 'payroll' });
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'employee') {
      await fetch(`/api/employees/${itemToDelete.id}`, { method: "DELETE" });
      setEmployees(prev => prev.filter(e => e.id !== itemToDelete.id));
    } else if (itemToDelete.type === 'payroll') {
      await fetch(`/api/payrolls/${itemToDelete.id}`, { method: "DELETE" });
      setPayrolls(prev => prev.filter(p => p.id !== itemToDelete.id));
    }

    setIsConfirmModalOpen(false);
    setItemToDelete(null);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard
          employees={employees}
          payrolls={payrolls}
          onAddEmployee={handleOpenAddModal}
          onEditEmployee={handleOpenEditModal}
          onDeleteEmployee={handleDeleteEmployee} />;
      case 'calculator':
        return <PayrollCalculator employees={employees} onProcessPayroll={handleProcessPayroll} />;
      case 'history':
        return <PayrollHistory payrolls={payrolls} onDeletePayroll={handleDeletePayroll} />;
      default:
        return <Dashboard
          employees={employees}
          payrolls={payrolls}
          onAddEmployee={handleOpenAddModal}
          onEditEmployee={handleOpenEditModal}
          onDeleteEmployee={handleDeleteEmployee} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <div className="max-w-md mx-auto bg-white shadow-lg min-h-screen pb-20">
        <header className="bg-brand-primary text-white p-4 shadow-md">
          <h1 className="text-2xl font-bold text-center">Payroll App</h1>
        </header>
        <main className="p-4">
          {renderView()}
        </main>
        <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
      </div>
      {isModalOpen && (
        <EmployeeFormModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingEmployee(null); }}
          onAddEmployee={handleAddEmployee}
          onUpdateEmployee={handleUpdateEmployee}
          employeeToEdit={editingEmployee}
        />
      )}
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
  );
};

export default App;
