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

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const formatRupiahInput = (value: string): string => {
    if (!value) return '';
    const numberString = value.replace(/[^0-9]/g, '');
    if (!numberString) return '';
    return `Rp ${new Intl.NumberFormat('id-ID').format(parseInt(numberString, 10))}`;
};

const parseRupiahInput = (value: string): string => value.replace(/[^0-9]/g, '');

interface StagedPayment extends PayrollPayload {
    employeeName: string;
    totalPay: number;
}

const PayrollCalculator: React.FC<PayrollCalculatorProps> = ({ employees, onProcessPayroll }) => {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
    const [stagedPayments, setStagedPayments] = useState<StagedPayment[]>([]);
    const [currentInputs, setCurrentInputs] = useState({
        daysWorked: '',
        totalAllowance: '0',
        loanDeduction: '0',
    });

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
        setCurrentInputs({ daysWorked: '', totalAllowance: '0', loanDeduction: '0' });
    };

    const handleInputChange = (field: keyof typeof currentInputs, value: string) => {
        if (field === 'daysWorked') {
            const newDays = parseInt(value, 10) || 0;
            setCurrentInputs({ ...currentInputs, daysWorked: String(newDays) });
        } else {
            setCurrentInputs({ ...currentInputs, [field]: parseRupiahInput(value) });
        }
    };

    const handleAddToStaged = () => {
        if (!selectedEmployee) return alert('Silakan pilih karyawan terlebih dahulu.');

        const daysWorked = parseInt(currentInputs.daysWorked, 10);
        if (!daysWorked || daysWorked < 1 || daysWorked > 7)
            return alert('Jumlah hari kerja harus antara 1 dan 7.');

        const totalAllowance = parseInt(currentInputs.totalAllowance, 10) || 0;
        const loanDeduction = parseInt(currentInputs.loanDeduction, 10) || 0;

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
        setCurrentInputs({ daysWorked: '', totalAllowance: '0', loanDeduction: '0' });
    };

    const handleRemoveFromStaged = (employeeId: number) => {
        setStagedPayments(prev => prev.filter(p => p.employeeId !== employeeId));
    };

    const handleSubmit = () => {
        if (stagedPayments.length === 0) return alert('Tambahkan setidaknya satu karyawan ke daftar gaji untuk diproses.');
        const payload: PayrollPayload[] = stagedPayments.map(({ employeeName, totalPay, ...rest }) => rest);
        onProcessPayroll(payload);
        setStagedPayments([]);
    };

    const totalStagedPayroll = useMemo(
        () => stagedPayments.reduce((total, p) => total + p.totalPay, 0),
        [stagedPayments]
    );

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-700">Hitung Gaji Mingguan</h2>

            {employees.length > 0 ? (
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

                                <div>
                                    <label className="text-xs text-slate-500 font-medium ml-1 mb-1 block">Hari Kerja</label>
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

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium ml-1 mb-1 block">Total Tunjangan</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="cth: Rp 300.000"
                                            value={formatRupiahInput(currentInputs.totalAllowance)}
                                            onChange={e => handleInputChange('totalAllowance', e.target.value)}
                                            className="w-full pl-4 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-medium ml-1 mb-1 block">Potongan Pinjaman</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="cth: Rp 100.000"
                                            value={formatRupiahInput(currentInputs.loanDeduction)}
                                            onChange={e => handleInputChange('loanDeduction', e.target.value)}
                                            className="w-full pl-4 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
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
                        <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
                            <h3 className="font-semibold text-slate-800">2. Daftar Gaji Siap Diproses</h3>
                            <div className="space-y-3">
                                {stagedPayments.map(p => (
                                    <div key={p.employeeId} className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
                                        <div>
                                            <p className="font-semibold text-slate-800">{p.employeeName}</p>
                                            <p className="text-sm text-brand-secondary font-medium">{formatCurrency(p.totalPay)}</p>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveFromStaged(p.employeeId)}
                                            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                ))}
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
                    )}
                </>
            ) : (
                <div className="text-center py-10 px-4 bg-slate-50 rounded-lg">
                    <p className="text-slate-500">Tidak ada karyawan untuk diproses.</p>
                    <p className="text-slate-400 text-sm">Silakan tambahkan karyawan di halaman Dashboard.</p>
                </div>
            )}
        </div>
    );
};

export default PayrollCalculator;
