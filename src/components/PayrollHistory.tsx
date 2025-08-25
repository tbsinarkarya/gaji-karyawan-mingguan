import React, { useState, useMemo } from 'react';
import type { WeeklyPayroll } from '../types.ts';
import { formatCurrency, formatDateRange } from '../utils/formatters.ts';
import CalendarDaysIcon from './icons/CalendarDaysIcon.tsx';
import ChevronDownIcon from './icons/ChevronDownIcon.tsx';
import CurrencyDollarIcon from './icons/CurrencyDollarIcon.tsx';
import PrintIcon from './icons/PrintIcon.tsx';
import ShareIcon from './icons/ShareIcon.tsx';
import TrashIcon from './icons/TrashIcon.tsx';

interface PayrollHistoryProps {
    payrolls: WeeklyPayroll[];
    onDeletePayroll: (id: string) => void;
}

const handlePrint = (payrollId: string) => {
    const cardToPrint = document.getElementById(`payroll-${payrollId}`);
    const contentToPrint = cardToPrint?.querySelector('.payroll-content-wrapper')?.cloneNode(true) as HTMLElement;

    if (!contentToPrint) {
        console.error("Content to print not found!");
        alert("Gagal menyiapkan data untuk dicetak. Silakan coba lagi.");
        return;
    }

    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) {
        alert("Gagal membuka jendela cetak. Pastikan pop-up diizinkan oleh browser Anda.");
        return;
    }

    printWindow.document.write(`
        <html>
            <head>
                <title>Cetak Slip Gaji</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    body { 
                        -webkit-print-color-adjust: exact; 
                        font-family: sans-serif; 
                        padding: 1rem; 
                    }
                    @media print {
                        body {
                            padding: 0;
                        }
                    }
                </style>
            </head>
            <body>
                ${contentToPrint.outerHTML}
            </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.onload = function() {
        // Delay to ensure Tailwind styles are applied
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 700); 
    };
};

const handleShareWhatsApp = (payroll: WeeklyPayroll) => {
    let message = `🧾 *Slip Gaji Mingguan*\n\n`;
    message += `*Periode:* ${formatDateRange(payroll.weekStartDate, payroll.weekEndDate)}\n`;
    message += `*Total Gaji Dibayarkan:* ${formatCurrency(payroll.totalPayroll)}\n\n`;
    message += `*Rincian Karyawan:*\n`;
    message += `-----------------------------------\n`;

    payroll.employeePayments.forEach(p => {
        message += `*Nama:* ${p.employeeName}\n`;
        message += `*Jabatan:* ${p.position}\n`;
        message += `*Hari Kerja:* ${p.daysWorked} hari\n`;
        message += `*Gaji Pokok:* ${formatCurrency(p.basePay)}\n`;
        message += `*Tunjangan:* ${formatCurrency(p.totalAllowance)}\n`;
        if (p.loanDeduction > 0) {
            message += `*Potongan:* -${formatCurrency(p.loanDeduction)}\n`;
        }
        message += `*Total Diterima:* *${formatCurrency(p.totalPay)}*\n`;
        message += `-----------------------------------\n`;
    });

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encodedMessage}`, '_blank');
};

const PayrollCardContent: React.FC<{ payroll: WeeklyPayroll }> = ({ payroll }) => (
    <div className="payroll-content-wrapper">
        <div className="flex justify-between items-start mb-3">
            <div>
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span>{formatDateRange(payroll.weekStartDate, payroll.weekEndDate)}</span>
                </div>
                <div className="flex items-center space-x-2 font-bold text-lg text-emerald-600 mt-1">
                    <CurrencyDollarIcon className="w-5 h-5" />
                    <span>{formatCurrency(payroll.totalPayroll)}</span>
                </div>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-medium px-2 py-1 rounded-full">{payroll.employeePayments.length} Karyawan</span>
        </div>
        
        <div className="border-t border-slate-200 pt-2 mt-2 space-y-2">
            {payroll.employeePayments.map(payment => (
                <div key={payment.employeeId} className="flex justify-between items-start text-sm py-2 border-b border-slate-100 last:border-b-0">
                    <div className="flex-1">
                        <p className="font-semibold text-slate-700">{payment.employeeName}</p>
                        <p className="text-xs text-slate-500">{payment.position}</p>
                        <p className="text-slate-500 text-xs mb-1">{payment.daysWorked} hari kerja</p>
                        
                        <div className="text-xs text-slate-600 mt-1 pl-2 border-l-2 border-slate-200 space-y-0.5">
                            <div className="flex justify-between"><span>Gaji Pokok:</span> <span>{formatCurrency(payment.basePay)}</span></div>
                            <div className="flex justify-between"><span>Tunjangan:</span> <span>{formatCurrency(payment.totalAllowance)}</span></div>
                            {payment.loanDeduction > 0 && (
                                <div className="flex justify-between text-red-600"><span>Potongan:</span> <span>-{formatCurrency(payment.loanDeduction)}</span></div>
                            )}
                        </div>
                    </div>
                    <p className="font-bold text-slate-800 ml-4">{formatCurrency(payment.totalPay)}</p>
                </div>
            ))}
        </div>
    </div>
);

const PayrollCardActions: React.FC<{ payroll: WeeklyPayroll; onDelete: (id: string) => void }> = ({ payroll, onDelete }) => (
    <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-end space-x-2 no-print">
        <button
            onClick={() => onDelete(payroll.id)}
            className="flex items-center space-x-2 text-sm text-slate-600 hover:text-red-500 font-semibold py-2 px-3 rounded-lg hover:bg-red-50 transition-colors"
            aria-label={`Hapus laporan gaji untuk ${formatDateRange(payroll.weekStartDate, payroll.weekEndDate)}`}
        >
            <TrashIcon className="w-4 h-4" />
            <span>Hapus</span>
        </button>
        <button
            onClick={() => handleShareWhatsApp(payroll)}
            className="flex items-center space-x-2 text-sm text-slate-600 hover:text-emerald-600 font-semibold py-2 px-3 rounded-lg hover:bg-emerald-50 transition-colors"
            aria-label={`Bagikan laporan gaji untuk ${formatDateRange(payroll.weekStartDate, payroll.weekEndDate)}`}
        >
            <ShareIcon className="w-4 h-4" />
            <span>Bagikan</span>
        </button>
        <button
            onClick={() => handlePrint(payroll.id)}
            className="flex items-center space-x-2 text-sm text-slate-600 hover:text-indigo-600 font-semibold py-2 px-3 rounded-lg hover:bg-indigo-50 transition-colors"
            aria-label={`Cetak laporan gaji untuk ${formatDateRange(payroll.weekStartDate, payroll.weekEndDate)}`}
        >
            <PrintIcon className="w-4 h-4" />
            <span>Cetak</span>
        </button>
    </div>
);

const WeeklyPayrollCard: React.FC<{ payroll: WeeklyPayroll; onDelete: (id: string) => void }> = ({ payroll, onDelete }) => (
    <div id={`payroll-${payroll.id}`} className="bg-white p-4 rounded-lg shadow-sm">
        <PayrollCardContent payroll={payroll} />
        <PayrollCardActions payroll={payroll} onDelete={onDelete} />
    </div>
);

const MonthlySummaryCard: React.FC<{
    monthYear: string;
    totalPayroll: number;
    weeklyPayrolls: WeeklyPayroll[];
    onDeletePayroll: (id: string) => void;
}> = ({ monthYear, totalPayroll, weeklyPayrolls, onDeletePayroll }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex justify-between items-center p-4 text-left"
                aria-expanded={isExpanded}
            >
                <div>
                    <h3 className="font-bold text-lg text-slate-800">{monthYear}</h3>
                    <p className="text-sm text-slate-500">{weeklyPayrolls.length} Laporan Mingguan</p>
                </div>
                <div className="flex items-center space-x-4">
                    <p className="font-bold text-lg text-emerald-600">{formatCurrency(totalPayroll)}</p>
                    <ChevronDownIcon className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </button>
            <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 pt-0 space-y-4">
                    {weeklyPayrolls.map(payroll => (
                        <div key={payroll.id} id={`payroll-${payroll.id}`} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                           <PayrollCardContent payroll={payroll} />
                           <PayrollCardActions payroll={payroll} onDelete={onDeletePayroll} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const PayrollHistory: React.FC<PayrollHistoryProps> = ({ payrolls, onDeletePayroll }) => {
    const [view, setView] = useState<'weekly' | 'monthly'>('weekly');

    const monthlyData = useMemo(() => {
        const groupedByMonth: Record<string, { totalPayroll: number; weeklyPayrolls: WeeklyPayroll[] }> = {};

        payrolls.forEach(payroll => {
            const date = new Date(payroll.weekStartDate + 'T00:00:00'); // Prevent timezone issues
            const monthYear = date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
            if (!groupedByMonth[monthYear]) {
                groupedByMonth[monthYear] = { totalPayroll: 0, weeklyPayrolls: [] };
            }
            groupedByMonth[monthYear].totalPayroll += payroll.totalPayroll;
            groupedByMonth[monthYear].weeklyPayrolls.push(payroll);
        });

        return Object.entries(groupedByMonth)
            .map(([monthYear, data]) => ({ monthYear, ...data }))
            // Sort by the first payroll date of each month, descending
            .sort((a, b) => new Date(b.weeklyPayrolls[0].weekStartDate).getTime() - new Date(a.weeklyPayrolls[0].weekStartDate).getTime());

    }, [payrolls]);
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-700">Riwayat Gaji</h2>
            </div>

            {payrolls.length > 0 && (
                <div className="p-1 bg-slate-200 rounded-lg flex items-center">
                    <button
                        onClick={() => setView('weekly')}
                        className={`w-1/2 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${view === 'weekly' ? 'bg-white text-indigo-600 shadow' : 'bg-transparent text-slate-600'}`}
                    >
                        Mingguan
                    </button>
                    <button
                        onClick={() => setView('monthly')}
                        className={`w-1/2 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${view === 'monthly' ? 'bg-white text-indigo-600 shadow' : 'bg-transparent text-slate-600'}`}
                    >
                        Bulanan
                    </button>
                </div>
            )}
            
            {payrolls.length > 0 ? (
                <div className="space-y-4">
                    {view === 'weekly' && payrolls.map(payroll => (
                        <WeeklyPayrollCard key={payroll.id} payroll={payroll} onDelete={onDeletePayroll} />
                    ))}
                    {view === 'monthly' && monthlyData.map(data => (
                        <MonthlySummaryCard key={data.monthYear} {...data} onDeletePayroll={onDeletePayroll} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 px-4 bg-slate-50 rounded-lg">
                    <p className="text-slate-500">Belum ada riwayat gaji.</p>
                    <p className="text-slate-400 text-sm">Proses gaji di halaman Kalkulator untuk melihat riwayat di sini.</p>
                </div>
            )}
        </div>
    );
};

export default PayrollHistory;
