import React from 'react';
import type { Employee, WeeklyPayroll } from '@/types';
import CurrencyDollarIcon from './icons/CurrencyDollarIcon.tsx';
import PencilIcon from './icons/PencilIcon.tsx';
import TrashIcon from './icons/TrashIcon.tsx';
import UserGroupIcon from './icons/UserGroupIcon.tsx';

const { useMemo } = React;

interface DashboardProps {
  employees: Employee[];
  payrolls: WeeklyPayroll[];
  onAddEmployee: () => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: number) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const EmployeeCard: React.FC<{ employee: Employee; onEdit: () => void; onDelete: () => void }> = ({ employee, onEdit, onDelete }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-4">
    <img src={employee.image_url ?? "/default.png"} alt={employee.name} className="w-16 h-16 rounded-full object-cover" />
    <div className="flex-1">
      <h3 className="font-bold text-lg text-slate-800">{employee.name}</h3>
      <p className="text-sm text-slate-500">{employee.position}</p>
      <div className="mt-1">
        <p className="text-md font-semibold text-brand-secondary">{formatCurrency(employee.daily_rate)} / hari</p>
        <p className="text-sm text-slate-500">Tunjangan: {formatCurrency(employee.weekly_allowance)} / minggu</p>
      </div>
    </div>
    <div className="flex flex-col space-y-2">
      <button onClick={onEdit} className="p-2 text-slate-500 hover:text-brand-primary hover:bg-slate-100 rounded-full transition-colors">
        <PencilIcon />
      </button>
      <button onClick={onDelete} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
        <TrashIcon />
      </button>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ employees, payrolls, onAddEmployee, onEditEmployee, onDeleteEmployee }) => {
  const totalWeeklyPayroll = useMemo(() => {
    if (payrolls.length === 0) return 0;
    return payrolls[0].totalPayroll;
  }, [payrolls]);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-bold text-slate-700 mb-3">Ringkasan</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-3">
            <div className="bg-indigo-100 p-3 rounded-full">
              <UserGroupIcon className="text-brand-primary" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Karyawan</p>
              <p className="text-2xl font-bold text-slate-800">{employees.length}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-3">
            <div className="bg-emerald-100 p-3 rounded-full">
              <CurrencyDollarIcon className="text-brand-secondary" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Gaji Mingguan</p>
              <p className="text-lg font-bold text-slate-800">{formatCurrency(totalWeeklyPayroll)}</p>
            </div>
          </div>
        </div>
      </section>
      
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-slate-700">Daftar Karyawan</h2>
          <button
            onClick={onAddEmployee}
            className="bg-brand-primary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Tambah
          </button>
        </div>
        <div className="space-y-3">
          {employees.length > 0 ? (
            employees.map(employee => (
              <EmployeeCard 
                key={employee.id} 
                employee={employee}
                onEdit={() => onEditEmployee(employee)}
                onDelete={() => onDeleteEmployee(employee.id)}
              />
            ))
          ) : (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-lg">
              <p className="text-slate-500">Belum ada karyawan.</p>
              <p className="text-slate-400 text-sm">Klik 'Tambah' untuk menambahkan karyawan baru.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
