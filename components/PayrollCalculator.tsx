import React, { useState, useMemo } from 'react';
import type { Employee } from '@/types';
import TrashIcon from './icons/TrashIcon.tsx';

interface PayrollPayload {
  employeeId: number;
  daysWorked: number;
  totalAllowance: number;
  loanDeduction: number;
}

interface PayrollCalculatorProps {
  employees: Employee[];
  onProcessPayroll: (employeePayments: PayrollPayload[]) => void;
}

interface StagedPayment extends PayrollPayload {
  employeeName: string;
  totalPay: number;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const parseRupiahInput = (value: string): number => {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.,]/g, '');
  const normalized = cleaned.replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

const formatRupiahInput = (value: string | number): string => {
  if (value === null || value === undefined || value === '') return '';
  const numberValue = typeof value === 'number' ? value : parseRupiahInput(value);
  return `Rp ${numberValue.toLocaleString('id-ID', { minimumFractionDigits: 0 })}`;
};

const PayrollCalculator: React.FC<PayrollCalculatorProps> = ({ employees, onProcessPayroll }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [stagedPayments, setStagedPayments] = useState<StagedPayment[]>([]);
  const [currentInputs, setCurrentInputs] = useState({
    daysWorked: '',
    totalAllowance: '',
    loanDeduction: '',
  });

  const selectedEmployee = useMemo(() => employees.find(e => e.id === selectedEmployeeId), [selectedEmployeeId, employees]);
  const availableEmployees = useMemo(() => employees.filter(e => !stagedPayments.some(p => p.employeeId === e.id)), [employees, stagedPayments]);

  const handleEmployeeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEmployeeId(Number(e.target.value));
    setCurrentInputs({ daysWorked: '', totalAllowance: '', loanDeduction: '' });
  };

  const handleInputChange = (field: keyof typeof currentInputs, value: string) => {
    if (field === 'daysWorked') {
      const days = parseInt(value, 10);
      let allowance = currentInputs.totalAllowance;
      if (days === 6 && selectedEmployee) {
        allowance = String(selectedEmployee.weekly_allowance);
      } else if (days !== 6) {
        allowance = '';
      }
      setCurrentInputs({ ...currentInputs, daysWorked: value, totalAllowance: allowance });
    } else {
      setCurrentInputs({ ...currentInputs, [field]: value });
    }
  };

  const handleAddToStaged = () => {
    if (!selectedEmployee) return alert('Pilih karyawan terlebih dahulu.');
    const daysWorked = parseInt(currentInputs.daysWorked, 10) || 0;
    if (daysWorked <= 0 || daysWorked > 7) return alert('Hari kerja harus 1–7.');
    const totalAllowance = parseRupiahInput(currentInputs.totalAllowance);
    const loanDeduction = parseRupiahInput(currentInputs.loanDeduction);

    const basePay = selectedEmployee.daily_rate * daysWorked;
    const totalPay = basePay + totalAllowance - loanDeduction;

    const newPayment: StagedPayment = {
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      daysWorked,
      totalAllowance,
      loanDeduction,
      totalPay,
    };

    setStagedPayments(prev => [...prev, newPayment].sort((a, b) => a.employeeName.localeCompare(b.employeeName)));
    setSelectedEmployeeId(null);
    setCurrentInputs({ daysWorked: '', totalAllowance: '', loanDeduction: '' });
  };

  const handleRemoveFromStaged = (employeeId: number) => {
    setStagedPayments(prev => prev.filter(p => p.employeeId !== employeeId));
  };

  const handleSubmit = () => {
    if (stagedPayments.length === 0) return alert('Tambahkan setidaknya satu karyawan.');
    const payload: PayrollPayload[] = stagedPayments.map(({ employeeName, totalPay, ...rest }) => rest);
    onProcessPayroll(payload);
    setStagedPayments([]);
  };

  const totalStagedPayroll = useMemo(() => stagedPayments.reduce((total, p) => total + p.totalPay, 0), [stagedPayments]);
  const isAllowanceDisabled = parseInt(currentInputs.daysWorked, 10) === 6;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-700">Hitung Gaji Mingguan</h2>

      {employees.length === 0 && (
        <div className="text-center py-10 px-4 bg-slate-50 rounded-lg">
          <p className="text-slate-500">Tidak ada karyawan.</p>
        </div>
      )}

      {employees.length > 0 && (
        <>
          <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-800">1. Pilih Karyawan & Input Data</h3>
            <select
              value={selectedEmployeeId ?? ''}
              onChange={handleEmployeeSelect}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              <option value="">-- Pilih Karyawan --</option>
              {availableEmployees.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>

            {selectedEmployee && (
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <img src={selectedEmployee.image_url || ''} alt={selectedEmployee.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-bold text-slate-800">{selectedEmployee.name}</p>
                    <p className="text-sm text-slate-500">{formatCurrency(selectedEmployee.daily_rate)} / hari</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-600 mb-1 block">Hari Kerja</label>
                    <input
                      type="number"
                      min={1}
                      max={7}
                      value={currentInputs.daysWorked}
                      onChange={e => handleInputChange('daysWorked', e.target.value)}
                      className="w-full pl-4 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600 mb-1 block">Total Tunjangan</label>
                    <input
                      type="text"
                      value={currentInputs.totalAllowance}
                      onChange={e => handleInputChange('totalAllowance', e.target.value)}
                      disabled={isAllowanceDisabled}
                      className="w-full pl-4 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                      placeholder="cth: 300000.50"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600 mb-1 block">Potongan Pinjaman</label>
                    <input
                      type="text"
                      value={currentInputs.loanDeduction}
                      onChange={e => handleInputChange('loanDeduction', e.target.value)}
                      className="w-full pl-4 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                      placeholder="cth: 100000.50"
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddToStaged}
                  className="w-full bg-brand-primary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Tambahkan ke Daftar Gaji
                </button>
              </div>
            )}
          </div>

          {stagedPayments.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
              <h3 className="font-semibold text-slate-800">2. Preview Daftar Gaji</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-200 px-2 py-1">Karyawan</th>
                      <th className="border border-slate-200 px-2 py-1">Hari</th>
                      <th className="border border-slate-200 px-2 py-1">Tunjangan</th>
                      <th className="border border-slate-200 px-2 py-1">Potongan</th>
                      <th className="border border-slate-200 px-2 py-1">Total</th>
                      <th className="border border-slate-200 px-2 py-1">Hapus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stagedPayments.map(p => (
                      <tr key={p.employeeId}>
                        <td className="border border-slate-200 px-2 py-1">{p.employeeName}</td>
                        <td className="border border-slate-200 px-2 py-1">{p.daysWorked}</td>
                        <td className="border border-slate-200 px-2 py-1">{formatCurrency(p.totalAllowance)}</td>
                        <td className="border border-slate-200 px-2 py-1">{formatCurrency(p.loanDeduction)}</td>
                        <td className="border border-slate-200 px-2 py-1 font-bold">{formatCurrency(p.totalPay)}</td>
                        <td className="border border-slate-200 px-2 py-1 text-center">
                          <button onClick={() => handleRemoveFromStaged(p.employeeId)} className="text-red-500">
                            <TrashIcon />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between font-semibold mt-2">
                <span>Total Gaji:</span>
                <span>{formatCurrency(totalStagedPayroll)}</span>
              </div>
              <button
                onClick={handleSubmit}
                className="w-full bg-brand-secondary hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Proses Gaji ({stagedPayments.length} Karyawan)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PayrollCalculator;
