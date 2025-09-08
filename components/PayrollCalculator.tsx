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
  const numberString = value.replace(/[^0-9]/g, '');
  return parseInt(numberString || '0', 10);
};

const PayrollCalculator: React.FC<PayrollCalculatorProps> = ({ employees, onProcessPayroll }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [currentInputs, setCurrentInputs] = useState({ daysWorked: '', totalAllowance: '', loanDeduction: '0' });
  const [stagedPayments, setStagedPayments] = useState<StagedPayment[]>([]);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  const selectedEmployee = useMemo(
    () => employees.find(e => e.id === selectedEmployeeId),
    [selectedEmployeeId, employees]
  );

  const availableEmployees = useMemo(
    () => employees.filter(e => !stagedPayments.some(p => p.employeeId === e.id)),
    [employees, stagedPayments]
  );

  const handleEmployeeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelectedEmployeeId(id || null);
    setCurrentInputs({ daysWorked: '', totalAllowance: '', loanDeduction: '0' });
  };

  const handleInputChange = (field: keyof typeof currentInputs, value: string) => {
    if (field === 'daysWorked') {
      const days = parseInt(value, 10) || 0;
      let allowance = currentInputs.totalAllowance;

      if (days === 6 && selectedEmployee) {
        allowance = String(selectedEmployee.weekly_allowance || 0);
      } else if (days !== 6) {
        allowance = '';
      }

      setCurrentInputs({ ...currentInputs, daysWorked: value, totalAllowance: allowance });
    } else {
      setCurrentInputs({ ...currentInputs, [field]: value });
    }
  };

  const handleAddToStaged = () => {
    if (!selectedEmployee) return alert('Silakan pilih karyawan terlebih dahulu.');

    const daysWorked = parseInt(currentInputs.daysWorked, 10);
    if (!daysWorked || daysWorked < 1 || daysWorked > 7)
      return alert('Jumlah hari kerja harus antara 1 dan 7.');

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
    setCurrentInputs({ daysWorked: '', totalAllowance: '', loanDeduction: '0' });
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => (prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]));
  };

  const handleRemoveFromStaged = (employeeId: number) => {
    setStagedPayments(prev => prev.filter(p => p.employeeId !== employeeId));
    setExpandedIds(prev => prev.filter(e => e !== employeeId));
  };

  const handleSubmit = () => {
    if (!stagedPayments.length) return alert('Tambahkan setidaknya satu karyawan.');
    const payload: PayrollPayload[] = stagedPayments.map(({ employeeName, totalPay, ...rest }) => rest);
    onProcessPayroll(payload);
    setStagedPayments([]);
    setExpandedIds([]);
  };

  const totalStagedPayroll = useMemo(
    () => stagedPayments.reduce((sum, p) => sum + p.totalPay, 0),
    [stagedPayments]
  );

  const isAllowanceDisabled = parseInt(currentInputs.daysWorked, 10) === 6;

  return (
    <div className="space-y-6">
      {/* Form Input Karyawan */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        <h3 className="font-semibold text-slate-800">Tambah Karyawan & Hitung Gaji</h3>
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
          <div className="space-y-3">
            <input
              type="number"
              min={1}
              max={7}
              placeholder="Hari Kerja"
              value={currentInputs.daysWorked}
              onChange={e => handleInputChange('daysWorked', e.target.value)}
              className="w-full pl-4 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Total Tunjangan"
              value={`Rp ${parseRupiahInput(currentInputs.totalAllowance)}`}
              disabled={isAllowanceDisabled}
              onChange={e => handleInputChange('totalAllowance', e.target.value)}
              className="w-full pl-4 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
            <input
              type="text"
              placeholder="Potongan Pinjaman"
              value={`Rp ${parseRupiahInput(currentInputs.loanDeduction)}`}
              onChange={e => handleInputChange('loanDeduction', e.target.value)}
              className="w-full pl-4 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
            <button
              onClick={handleAddToStaged}
              className="w-full bg-brand-primary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Tambahkan ke Daftar Gaji
            </button>
          </div>
        )}
      </div>

      {/* Preview Compact */}
      {stagedPayments.length > 0 ? (
        <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
          <h3 className="font-semibold text-slate-800">Preview Rincian Gaji</h3>
          <div className="space-y-2">
            {stagedPayments.map(p => {
              const isExpanded = expandedIds.includes(p.employeeId);
              return (
                <div key={p.employeeId} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div
                    className="flex justify-between items-center p-3 cursor-pointer bg-slate-50"
                    onClick={() => toggleExpand(p.employeeId)}
                  >
                    <span className="font-semibold text-slate-800">{p.employeeName}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800">{formatCurrency(p.totalPay)}</span>
                      <span className="text-slate-500">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-white p-3 border-t border-slate-200 space-y-1 text-sm text-slate-700">
                      <div className="flex justify-between"><span>Hari Kerja:</span><span>{p.daysWorked}</span></div>
                      <div className="flex justify-between"><span>Gaji Pokok:</span><span>{formatCurrency(p.totalPay - p.totalAllowance + p.loanDeduction)}</span></div>
                      <div className="flex justify-between"><span>Tunjangan:</span><span>{formatCurrency(p.totalAllowance)}</span></div>
                      <div className="flex justify-between"><span>Potongan:</span><span>{formatCurrency(p.loanDeduction)}</span></div>
                      <button
                        onClick={() => handleRemoveFromStaged(p.employeeId)}
                        className="mt-2 w-full text-red-500 hover:text-red-700 flex items-center justify-center space-x-1"
                      >
                        <TrashIcon />
                        <span>Hapus</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-center">
            <span className="font-semibold text-slate-700">Total</span>
            <span className="font-bold text-lg text-slate-800">{formatCurrency(totalStagedPayroll)}</span>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-brand-secondary hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg"
          >
            Proses Gaji ({stagedPayments.length} Karyawan)
          </button>
        </div>
      ) : (
        <div className="text-center py-10 px-4 bg-slate-50 rounded-lg">
          <p className="text-slate-500">Belum ada gaji yang dihitung.</p>
        </div>
      )}
    </div>
  );
};

export default PayrollCalculator;
