import React, { useState, useMemo, useEffect } from 'react';
import type { Employee } from '@/types';
import TrashIcon from './icons/TrashIcon.tsx';

interface PayrollPayload {
  employeeId: number;
  daysWorked: number;
  totalAllowance: number;   // tunjangan (otomatis saat 6 hari / manual saat <6)
  extraAllowance: number;   // Tunjangan Lain (THR/bonus), selalu manual
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

// Format ke Rupiah untuk tampilan
const formatRupiah = (value: number): string => {
  return value === 0 ? 'Rp 0' : `Rp ${value.toLocaleString('id-ID')}`;
};

// Parsing dari input "Rp 80.000" ke angka
const parseRupiah = (value: string): number => {
  const numberString = value.replace(/[^0-9]/g, '');
  return parseInt(numberString, 10) || 0;
};

const PayrollCalculator: React.FC<PayrollCalculatorProps> = ({ employees, onProcessPayroll }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [stagedPayments, setStagedPayments] = useState<StagedPayment[]>([]);
  const [currentInputs, setCurrentInputs] = useState({
    daysWorked: '',
    totalAllowance: '',   // auto saat 6 hari
    extraAllowance: '',   // manual selalu
    loanDeduction: '0',
  });
  const [periodStart, setPeriodStart] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');

  const selectedEmployee = useMemo(
    () => employees.find(e => e.id === selectedEmployeeId),
    [selectedEmployeeId, employees]
  );

  const availableEmployees = useMemo(
    () => employees.filter(e => !stagedPayments.some(p => p.employeeId === e.id)),
    [employees, stagedPayments]
  );

  const handleEmployeeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEmployeeId(Number(e.target.value));
    setCurrentInputs({ daysWorked: '', totalAllowance: '', extraAllowance: '', loanDeduction: '0' });
    setPeriodStart('');
    setPeriodEnd('');
  };

  const handleInputChange = (field: keyof typeof currentInputs, value: string) => {
    if (field === 'daysWorked') {
      const days = parseInt(value, 10);
      let allowance = currentInputs.totalAllowance;

      if (days === 6 && selectedEmployee) {
        allowance = (selectedEmployee.weekly_allowance ?? 0).toString();
      } else if (days !== 6) {
        allowance = '';
      }

      setCurrentInputs({ ...currentInputs, daysWorked: value, totalAllowance: allowance });
    } else {
      // simpan sebagai string numeric tanpa simbol; formatting dilakukan saat render value
      setCurrentInputs({ ...currentInputs, [field]: parseRupiah(value).toString() });
    }
  };

  const handleAddToStaged = () => {
    if (!selectedEmployee) return alert('Silakan pilih karyawan terlebih dahulu.');

    const daysWorked = parseInt(currentInputs.daysWorked, 10) || 0;
    if (daysWorked <= 0 || daysWorked > 7) return alert('Jumlah hari kerja harus antara 1 dan 7.');

    const totalAllowance = parseRupiah(currentInputs.totalAllowance);
    const extraAllowance = parseRupiah(currentInputs.extraAllowance);
    const loanDeduction = parseRupiah(currentInputs.loanDeduction);

    const basePay = (selectedEmployee.daily_rate ?? 0) * daysWorked;
    const totalPay = basePay + totalAllowance + extraAllowance - loanDeduction;

    const newPayment: StagedPayment = {
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      daysWorked,
      totalAllowance,
      extraAllowance,
      loanDeduction,
      totalPay,
    };

    setStagedPayments(prev => [...prev, newPayment].sort((a, b) => a.employeeName.localeCompare(b.employeeName)));
    setSelectedEmployeeId(null);
    setCurrentInputs({ daysWorked: '', totalAllowance: '', extraAllowance: '', loanDeduction: '0' });
    setPeriodStart('');
    setPeriodEnd('');
  };

  const handleRemoveFromStaged = (employeeId: number) => {
    setStagedPayments(prev => prev.filter(p => p.employeeId !== employeeId));
  };

  const handleSubmit = () => {
    if (stagedPayments.length === 0) return alert('Tambahkan setidaknya satu karyawan ke daftar gaji.');
    const payload: PayrollPayload[] = stagedPayments.map(({ employeeName, totalPay, ...rest }) => rest);
    onProcessPayroll(payload);
    setStagedPayments([]);
  };

  const totalStagedPayroll = useMemo(
    () => stagedPayments.reduce((total, p) => total + p.totalPay, 0),
    [stagedPayments]
  );

  const isAllowanceDisabled = parseInt(currentInputs.daysWorked, 10) === 6;

  // Otomatis isi jumlah hari berdasarkan periode tanggal
  useEffect(() => {
    if (!periodStart || !periodEnd) return;
    const start = new Date(`${periodStart}T00:00:00`);
    const end = new Date(`${periodEnd}T00:00:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
    if (end < start) return;
    const diffDays = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1; // inklusif
    const bounded = Math.max(1, Math.min(7, diffDays));
    // Reuse logic untuk mengatur tunjangan saat 6 hari
    handleInputChange('daysWorked', String(bounded));
  }, [periodStart, periodEnd]);

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
          {/* Form Input */}
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
                    <p className="text-sm text-slate-500">{formatRupiah(selectedEmployee.daily_rate)} / hari</p>
                  </div>
                </div>

                {/* Hari Kerja */}
                <div>
                  <label className="text-xs text-slate-600 font-medium ml-1 mb-1 block">Hari Kerja</label>
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                    <div className="sm:w-40">
                      <input
                        type="number"
                        placeholder="Jumlah hari"
                        value={currentInputs.daysWorked}
                        onChange={e => handleInputChange('daysWorked', e.target.value)}
                        className="w-full pl-4 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
                        min={1}
                        max={7}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[11px] text-slate-600 font-medium ml-1 mb-1 block">Tanggal Periode</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={periodStart}
                          onChange={e => setPeriodStart(e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        />
                        <span className="text-slate-500">s/d</span>
                        <input
                          type="date"
                          value={periodEnd}
                          onChange={e => setPeriodEnd(e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Mengisi otomatis kolom jumlah hari (maks. 7)</p>
                    </div>
                  </div>
                </div>

                {/* Tabel compact untuk Tunjangan / Tunjangan Lain / Potongan */}
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full table-fixed text-sm">
                    <colgroup>
                      <col className="w-1/2" />
                      <col className="w-1/2" />
                    </colgroup>
                    <tbody className="[&_td]:px-3 [&_td]:py-2 [&_td]:align-middle">
                      <tr className="bg-slate-50">
                        <td className="text-slate-600">
                          Tunjangan <span className="text-[11px] text-slate-500">(auto 6 hari)</span>
                        </td>
                        <td>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Rp 300.000"
                            value={currentInputs.totalAllowance ? `Rp ${parseRupiah(currentInputs.totalAllowance).toLocaleString('id-ID')}` : ''}
                            onChange={e => handleInputChange('totalAllowance', e.target.value)}
                            disabled={isAllowanceDisabled}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="text-slate-600">Tunjangan Lain <span className="text-[11px] text-slate-500">(THR/Bonus)</span></td>
                        <td>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Rp 500.000"
                            value={currentInputs.extraAllowance ? `Rp ${parseRupiah(currentInputs.extraAllowance).toLocaleString('id-ID')}` : ''}
                            onChange={e => handleInputChange('extraAllowance', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                          />
                        </td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="text-slate-600">Potongan Pinjaman</td>
                        <td>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Rp 100.000"
                            value={currentInputs.loanDeduction ? `Rp ${parseRupiah(currentInputs.loanDeduction).toLocaleString('id-ID')}` : 'Rp 0'}
                            onChange={e => handleInputChange('loanDeduction', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Hint ringkas */}
                <p className="text-[11px] text-slate-500">
                  Masukkan angka Rupiah. Contoh: <span className="font-medium text-slate-600">Rp 80.000</span>
                </p>

                <button
                  onClick={handleAddToStaged}
                  className="w-full bg-brand-primary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Tambahkan ke Daftar Gaji
                </button>
              </div>
            )}
          </div>

          {/* Preview Gaji */}
          {stagedPayments.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
              <h3 className="font-semibold text-slate-800">2. Preview Daftar Gaji</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border border-slate-200 rounded-md">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-2 border-b">Nama</th>
                      <th className="p-2 border-b">Hari</th>
                      <th className="p-2 border-b">Tunjangan</th>
                      <th className="p-2 border-b">Tunjangan Lain</th>
                      <th className="p-2 border-b">Potongan</th>
                      <th className="p-2 border-b">Total Gaji</th>
                      <th className="p-2 border-b">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stagedPayments.map(p => (
                      <tr key={p.employeeId} className="border-b last:border-b-0">
                        <td className="p-2">{p.employeeName}</td>
                        <td className="p-2">{p.daysWorked}</td>
                        <td className="p-2">{formatRupiah(p.totalAllowance)}</td>
                        <td className="p-2">{formatRupiah(p.extraAllowance)}</td>
                        <td className="p-2">{formatRupiah(p.loanDeduction)}</td>
                        <td className="p-2 font-bold">{formatRupiah(p.totalPay)}</td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => handleRemoveFromStaged(p.employeeId)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <TrashIcon />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-center">
                <span className="font-semibold text-slate-700">Total</span>
                <span className="font-bold text-lg text-slate-800">{formatRupiah(totalStagedPayroll)}</span>
              </div>

              <button
                onClick={handleSubmit}
                className="w-full bg-brand-secondary hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg"
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
