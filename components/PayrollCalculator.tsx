import React from 'react';
import type { Employee } from '../types.ts';
import TrashIcon from './icons/TrashIcon.tsx';

const { useState: useStateCalc, useMemo: useMemoCalc, useEffect: useEffectCalc } = React;

interface PayrollPayload {
    employeeId: string;
    daysWorked: number;
    totalAllowance: number;
    loanDeduction: number;
}

interface PayrollCalculatorProps {
    employees: Employee[];
    onProcessPayroll: (employeePayments: PayrollPayload[]) => void;
}

const formatCurrencyCalc = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const formatRupiahInputCalc = (value: string): string => {
    if (!value) return '';
    const numberString = value.replace(/[^0-9]/g, '');
    if (!numberString) return '';
    const formatted = new Intl.NumberFormat('id-ID').format(parseInt(numberString, 10));
    return `Rp ${formatted}`;
};

const parseRupiahInputCalc = (value: string): string => {
    return value.replace(/[^0-9]/g, '');
};

interface StagedPayment extends PayrollPayload {
    employeeName: string;
    totalPay: number;
}

const PayrollCalculator: React.FC<PayrollCalculatorProps> = ({ employees, onProcessPayroll }) => {
    const [selectedEmployeeId, setSelectedEmployeeId] = useStateCalc<string>('');
    const [stagedPayments, setStagedPayments] = useStateCalc<StagedPayment[]>([]);
    const [currentInputs, setCurrentInputs] = useStateCalc({
        daysWorked: '',
        totalAllowance: '',
        loanDeduction: '0',
    });

    const selectedEmployee = useMemoCalc(() => 
        employees.find(e => e.id === selectedEmployeeId), 
        [selectedEmployeeId, employees]
    );

    const availableEmployees = useMemoCalc(() => 
        employees.filter(e => !stagedPayments.some(p => p.employeeId === e.id)),
        [employees, stagedPayments]
    );

    const handleEmployeeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const employeeId = e.target.value;
        setSelectedEmployeeId(employeeId);
        
        // Reset inputs
        setCurrentInputs({
            daysWorked: '',
            totalAllowance: '',
            loanDeduction: '0',
        });
    };

    const handleInputChange = (field: keyof typeof currentInputs, value: string) => {
        if (field === 'daysWorked') {
            const newDays = parseInt(value, 10);
            
            setCurrentInputs(prev => {
                let newAllowance = prev.totalAllowance;

                if (newDays === 6) {
                    // Set to default when days worked is 6
                    newAllowance = selectedEmployee ? String(selectedEmployee.weeklyAllowance) : '';
                } else {
                    // Clear for manual input for any other number of days (e.g. 5)
                    newAllowance = '';
                }
                
                return {
                    ...prev,
                    daysWorked: value,
                    totalAllowance: newAllowance,
                };
            });
        } else {
            setCurrentInputs(prev => ({ ...prev, [field]: parseRupiahInputCalc(value) }));
        }
    };


    const handleAddToStaged = () => {
        if (!selectedEmployee) {
            alert('Silakan pilih karyawan terlebih dahulu.');
            return;
        }

        const daysWorked = parseInt(currentInputs.daysWorked, 10) || 0;
        if (daysWorked <= 0 || daysWorked > 7) {
            alert('Jumlah hari kerja harus antara 1 dan 7.');
            return;
        }
        
        const totalAllowance = parseInt(currentInputs.totalAllowance, 10) || 0;
        const loanDeduction = parseInt(currentInputs.loanDeduction, 10) || 0;

        const basePay = selectedEmployee.dailyRate * daysWorked;
        const totalPay = basePay + totalAllowance - loanDeduction;

        const newPayment: StagedPayment = {
            employeeId: selectedEmployeeId,
            employeeName: selectedEmployee.name,
            daysWorked,
            totalAllowance,
            loanDeduction,
            totalPay,
        };

        setStagedPayments(prev => [...prev, newPayment].sort((a, b) => a.employeeName.localeCompare(b.employeeName)));
        setSelectedEmployeeId('');
    };
    
    const handleRemoveFromStaged = (employeeId: string) => {
        setStagedPayments(prev => prev.filter(p => p.employeeId !== employeeId));
    };

    const handleSubmit = () => {
        if (stagedPayments.length === 0) {
            alert('Tambahkan setidaknya satu karyawan ke daftar gaji untuk diproses.');
            return;
        }
        
        const payload: PayrollPayload[] = stagedPayments.map(({ employeeName, totalPay, ...rest }) => rest);
        onProcessPayroll(payload);
        setStagedPayments([]);
    };

    const totalStagedPayroll = useMemoCalc(() => {
        return stagedPayments.reduce((total, payment) => total + payment.totalPay, 0);
    }, [stagedPayments]);

    const isAllowanceDisabled = parseInt(currentInputs.daysWorked, 10) === 6;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-700">Hitung Gaji Mingguan</h2>
            
            {employees.length > 0 ? (
                <>
                    <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
                        <h3 className="font-semibold text-slate-800">1. Pilih Karyawan & Input Data</h3>
                        <select
                            value={selectedEmployeeId}
                            onChange={handleEmployeeSelect}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                            aria-label="Pilih Karyawan"
                        >
                            <option value="">-- Pilih Karyawan --</option>
                            {availableEmployees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>

                        {selectedEmployee && (
                            <div className="border-t border-slate-200 pt-4 space-y-3">
                                <div className="flex items-center space-x-3">
                                    <img src={selectedEmployee.imageUrl} alt={selectedEmployee.name} className="w-10 h-10 rounded-full object-cover" />
                                    <div>
                                        <p className="font-bold text-slate-800">{selectedEmployee.name}</p>
                                        <p className="text-sm text-slate-500">{formatCurrencyCalc(selectedEmployee.dailyRate)} / hari</p>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="days-worked" className="text-xs text-slate-500 font-medium ml-1 mb-1 block">Hari Kerja</label>
                                    <input
                                        id="days-worked"
                                        type="number"
                                        placeholder="Jumlah hari"
                                        value={currentInputs.daysWorked}
                                        onChange={e => handleInputChange('daysWorked', e.target.value)}
                                        className="w-full pl-4 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
                                        min="1"
                                        max="7"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="total-allowance" className="text-xs text-slate-500 font-medium ml-1 mb-1 block">Total Tunjangan</label>
                                        <input
                                            id="total-allowance"
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="cth: Rp 300.000"
                                            value={formatRupiahInputCalc(currentInputs.totalAllowance)}
                                            onChange={e => handleInputChange('totalAllowance', e.target.value)}
                                            className="w-full pl-4 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition disabled:bg-slate-100 disabled:cursor-not-allowed"
                                            disabled={isAllowanceDisabled}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="loan-deduction" className="text-xs text-slate-500 font-medium ml-1 mb-1 block">Potongan Pinjaman</label>
                                        <input
                                            id="loan-deduction"
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="cth: Rp 100.000"
                                            value={formatRupiahInputCalc(currentInputs.loanDeduction)}
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
                                            <p className="text-sm text-brand-secondary font-medium">{formatCurrencyCalc(p.totalPay)}</p>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveFromStaged(p.employeeId)}
                                            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                            aria-label={`Hapus ${p.employeeName} dari daftar`}
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-center">
                                <span className="font-semibold text-slate-700">Total</span>
                                <span className="font-bold text-lg text-slate-800">{formatCurrencyCalc(totalStagedPayroll)}</span>
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