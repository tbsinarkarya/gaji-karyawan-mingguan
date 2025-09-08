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

const PayrollCalculator: React.FC<PayrollCalculatorProps> = ({ employees, onProcessPayroll }) => {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
    const [stagedPayments, setStagedPayments] = useState<StagedPayment[]>([]);
    const [expandedIds, setExpandedIds] = useState<number[]>([]); // untuk expand/collapse

    const toggleExpand = (id: number) => {
        setExpandedIds(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
    };

    const handleRemoveFromStaged = (employeeId: number) => {
        setStagedPayments(prev => prev.filter(p => p.employeeId !== employeeId));
        setExpandedIds(prev => prev.filter(e => e !== employeeId));
    };

    const handleSubmit = () => {
        if (stagedPayments.length === 0) return alert('Tambahkan setidaknya satu karyawan ke daftar gaji untuk diproses.');
        const payload: PayrollPayload[] = stagedPayments.map(({ employeeName, totalPay, ...rest }) => rest);
        onProcessPayroll(payload);
        setStagedPayments([]);
        setExpandedIds([]);
    };

    const totalStagedPayroll = useMemo(
        () => stagedPayments.reduce((total, p) => total + p.totalPay, 0),
        [stagedPayments]
    );

    return (
        <div className="space-y-6">
            {/* Preview Rincian Gaji Compact */}
            {stagedPayments.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
                    <h3 className="font-semibold text-slate-800">Preview Rincian Gaji</h3>
                    <div className="space-y-2">
                        {stagedPayments.map(p => {
                            const isExpanded = expandedIds.includes(p.employeeId);
                            return (
                                <div key={p.employeeId} className="border border-slate-200 rounded-lg overflow-hidden">
                                    {/* Header compact */}
                                    <div
                                        className="flex justify-between items-center p-3 cursor-pointer bg-slate-50"
                                        onClick={() => toggleExpand(p.employeeId)}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <p className="font-semibold text-slate-800">{p.employeeName}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="font-bold text-slate-800">{formatCurrency(p.totalPay)}</span>
                                            <span className="text-slate-500">{isExpanded ? '▲' : '▼'}</span>
                                        </div>
                                    </div>

                                    {/* Detail expandable */}
                                    {isExpanded && (
                                        <div className="bg-white p-3 border-t border-slate-200 space-y-1 text-sm text-slate-700">
                                            <div className="flex justify-between"><span>Hari Kerja:</span><span>{p.daysWorked}</span></div>
                                            <div className="flex justify-between"><span>Gaji Pokok:</span><span>{formatCurrency(p.daysWorked * (p.totalPay - p.totalAllowance + p.loanDeduction)/p.daysWorked)}</span></div>
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
            )}
        </div>
    );
};

export default PayrollCalculator;
