import React, { useState, useEffect, useCallback } from 'react';
import type { Employee, WeeklyPayroll, PayrollPayload } from './types.ts';
import BottomNav from './components/BottomNav.tsx';
import ConfirmationModal from './components/ConfirmationModal.tsx';
import Dashboard from './components/Dashboard.tsx';
import EmployeeFormModal from './components/EmployeeFormModal.tsx';
import PayrollCalculator from './components/PayrollCalculator.tsx';
import PayrollHistory from './components/PayrollHistory.tsx';

type View = 'dashboard' | 'calculator' | 'history';

const App: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [payrolls, setPayrolls] = useState<WeeklyPayroll[]>([]);
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'employee' | 'payroll' } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [employeesRes, payrollsRes] = await Promise.all([
                fetch('/api/employees'),
                fetch('/api/payrolls')
            ]);

            if (!employeesRes.ok || !payrollsRes.ok) {
                throw new Error('Gagal mengambil data dari server.');
            }

            const employeesData = await employeesRes.json();
            const payrollsData = await payrollsRes.json();
            
            setEmployees(employeesData);
            setPayrolls(payrollsData);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddEmployee = async (employee: Omit<Employee, 'id'>) => {
        try {
            const response = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(employee),
            });
            if (!response.ok) throw new Error('Gagal menambahkan karyawan');
            await fetchData(); // Refresh data
            setIsModalOpen(false);
        } catch (error) {
            alert('Error: ' + (error as Error).message);
        }
    };

    const handleUpdateEmployee = async (employee: Employee) => {
        try {
            const response = await fetch(`/api/employees/${employee.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(employee),
            });
            if (!response.ok) throw new Error('Gagal memperbarui karyawan');
            await fetchData(); // Refresh data
            setIsModalOpen(false);
            setEditingEmployee(null);
        } catch (error) {
            alert('Error: ' + (error as Error).message);
        }
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

    const handleProcessPayroll = useCallback(async (employeePayments: PayrollPayload[]) => {
       try {
            const response = await fetch('/api/payrolls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeePayments }),
            });
            if (!response.ok) {
                 const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal memproses gaji');
            }
            await fetchData(); // Refresh data
            setCurrentView('history');
        } catch (error) {
            alert('Error: ' + (error as Error).message);
        }
    }, [fetchData]);

    const handleDeletePayroll = (id: string) => {
        setItemToDelete({ id, type: 'payroll' });
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        const { id, type } = itemToDelete;
        const url = type === 'employee' ? `/api/employees/${id}` : `/api/payrolls/${id}`;

        try {
            const response = await fetch(url, { method: 'DELETE' });
            if (!response.ok) throw new Error(`Gagal menghapus ${type}`);
            await fetchData(); // Refresh data
        } catch (error) {
             alert('Error: ' + (error as Error).message);
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    const renderView = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-64">Memuat data...</div>;
        }
        if (error) {
            return <div className="text-center text-red-500 p-4 bg-red-50 rounded-lg">{error}</div>;
        }

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
                <header className="bg-indigo-600 text-white p-4 shadow-md sticky top-0 z-10">
                    <h1 className="text-2xl font-bold text-center">GajiKaryawan</h1>
                </header>
                <main className="p-4">
                    {renderView()}
                </main>
                <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
            </div>
            
            <EmployeeFormModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingEmployee(null); }}
                onAddEmployee={handleAddEmployee}
                onUpdateEmployee={handleUpdateEmployee}
                employeeToEdit={editingEmployee}
            />
            
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
