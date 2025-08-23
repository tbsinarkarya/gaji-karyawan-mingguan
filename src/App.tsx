import React, { useState, useEffect, useCallback } from 'react';
import type { Employee, WeeklyPayroll, PayrollPayload } from './types.ts';
import { getEmployees, getPayrolls, saveEmployees, savePayrolls } from './services/storageService.ts';
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

    useEffect(() => {
        setEmployees(getEmployees());
        setPayrolls(getPayrolls());
    }, []);

    const handleAddEmployee = (employee: Omit<Employee, 'id'>) => {
        const newEmployee: Employee = {
            ...employee,
            id: `emp-${Date.now()}`,
            imageUrl: employee.imageUrl || `https://picsum.photos/seed/${Date.now()}/200`,
        };
        const updatedEmployees = [...employees, newEmployee];
        setEmployees(updatedEmployees);
        saveEmployees(updatedEmployees);
        setIsModalOpen(false);
    };

    const handleUpdateEmployee = (employee: Employee) => {
        const updatedEmployees = employees.map(e => e.id === employee.id ? employee : e);
        setEmployees(updatedEmployees);
        saveEmployees(updatedEmployees);
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

    const handleProcessPayroll = useCallback((employeePayments: PayrollPayload[]) => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const weekStartDate = new Date(today.setDate(diff));
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);

        let totalPayroll = 0;
        const processedPayments = employeePayments.map(p => {
            const employee = employees.find(e => e.id === p.employeeId);
            if (!employee) return null;

            const basePay = employee.dailyRate * p.daysWorked;
            const totalAllowance = p.totalAllowance;
            const loanDeduction = p.loanDeduction;
            const totalPay = basePay + totalAllowance - loanDeduction;
            
            totalPayroll += totalPay;

            return {
                employeeId: employee.id,
                employeeName: employee.name,
                position: employee.position,
                daysWorked: p.daysWorked,
                basePay,
                totalAllowance,
                loanDeduction,
                totalPay,
            };
        }).filter(p => p !== null) as WeeklyPayroll['employeePayments'];

        if (processedPayments.length === 0) {
            alert("Tidak ada data gaji untuk diproses.");
            return;
        }

        const newPayroll: WeeklyPayroll = {
            id: `payroll-${Date.now()}`,
            weekStartDate: weekStartDate.toISOString().split('T')[0],
            weekEndDate: weekEndDate.toISOString().split('T')[0],
            totalPayroll,
            employeePayments: processedPayments,
        };

        const updatedPayrolls = [newPayroll, ...payrolls];
        setPayrolls(updatedPayrolls);
        savePayrolls(updatedPayrolls);
        setCurrentView('history');
    }, [employees, payrolls]);

    const handleDeletePayroll = (id: string) => {
        setItemToDelete({ id, type: 'payroll' });
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!itemToDelete) return;

        if (itemToDelete.type === 'employee') {
            const updatedEmployees = employees.filter(e => e.id !== itemToDelete.id);
            setEmployees(updatedEmployees);
            saveEmployees(updatedEmployees);
        } else if (itemToDelete.type === 'payroll') {
            const updatedPayrolls = payrolls.filter(p => p.id !== itemToDelete.id);
            setPayrolls(updatedPayrolls);
            savePayrolls(updatedPayrolls);
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
                <header className="bg-indigo-600 text-white p-4 shadow-md sticky top-0 z-10">
                    <h1 className="text-2xl font-bold text-center">GajiKaryawan</h1>
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