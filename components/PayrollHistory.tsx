import React, { useEffect, useMemo, useState } from "react";
import type { WeeklyPayroll } from "@/types";
import CalendarDaysIcon from "./icons/CalendarDaysIcon.tsx";
import ChevronDownIcon from "./icons/ChevronDownIcon.tsx";
import CurrencyDollarIcon from "./icons/CurrencyDollarIcon.tsx";
import PrintIcon from "./icons/PrintIcon.tsx";
import ShareIcon from "./icons/ShareIcon.tsx";
import TrashIcon from "./icons/TrashIcon.tsx";

interface PayrollHistoryProps {
  payrolls: WeeklyPayroll[];
  // Tetap dipakai untuk hapus seluruh periode (weekly card)
  onDeletePayroll: (id: string | number) => void;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount ?? 0);

const formatDateRange = (start: string, end: string) => {
  if (!start || !end) return "-";
  const startDate = new Date(start);
  const endDate = new Date(end);
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${startDate.toLocaleDateString("id-ID", options)} - ${endDate.toLocaleDateString(
    "id-ID",
    { ...options, year: "numeric" }
  )}`;
};

const handlePrint = (payrollId: string | number) => {
  const card = document.getElementById(`payroll-${payrollId}`);
  const content = card?.querySelector(".payroll-content-wrapper")?.cloneNode(true) as HTMLElement;

  if (!content) {
    alert("Gagal menyiapkan data untuk dicetak.");
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write("<html><head><title>Cetak Slip Gaji</title></head><body></body></html>");
  doc.close();

  const tailwindScript = doc.createElement("script");
  tailwindScript.src = "https://cdn.tailwindcss.com";
  doc.head.appendChild(tailwindScript);

  const style = doc.createElement("style");
  style.textContent = `body{-webkit-print-color-adjust:exact;font-family:sans-serif}.print-container{padding:1rem;}`;
  doc.head.appendChild(style);

  const container = doc.createElement("div");
  container.className = "print-container";
  container.appendChild(content);
  doc.body.appendChild(container);

  tailwindScript.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 500);
  };

  tailwindScript.onerror = () => {
    alert("Gagal memuat gaya cetak.");
    document.body.removeChild(iframe);
  };
};

// ====== BARU: Share WhatsApp per KARYAWAN ======
const shareOneEmployeeWhatsApp = (weekStart: string, weekEnd: string, p: any) => {
  const totalAllowance = Number(p.totalAllowance ?? 0); // input (auto/manual)
  const extraAllowance = Number(p.extraAllowance ?? 0); // kolom baru
  const loanDeduction = Number(p.loanDeduction ?? 0); // kolom baru

  let message = `🧾 *Slip Gaji Mingguan*\n\n`;
  message += `*Periode:* ${formatDateRange(weekStart, weekEnd)}\n\n`;
  message += `*Nama:* ${p.employeeName}\n*Jabatan:* ${p.position}\n*Hari Kerja:* ${p.daysWorked} hari\n`;
  message += `*Gaji Pokok:* ${formatCurrency(p.basePay)}\n`;
  message += `*Tunjangan:* ${formatCurrency(totalAllowance)}\n`;
  if (extraAllowance > 0) message += `*Tunjangan Lain:* ${formatCurrency(extraAllowance)}\n`;
  if (loanDeduction > 0) message += `*Potongan:* -${formatCurrency(loanDeduction)}\n`;
  message += `*Total Diterima:* *${formatCurrency(p.totalPay)}*\n`;

  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, "_blank");
};

// Tetap ada: share untuk satu periode (semua karyawan)
const shareWholePayrollWhatsApp = (payroll: WeeklyPayroll) => {
  let message = `🧾 *Slip Gaji Mingguan*\n\n`;
  message += `*Periode:* ${formatDateRange(payroll.weekStartDate, payroll.weekEndDate)}\n`;
  message += `*Total Gaji Dibayarkan:* ${formatCurrency(payroll.totalPayroll)}\n\n`;
  message += `*Rincian Karyawan:*\n-----------------------------------\n`;

  (payroll.employeePayments ?? []).forEach((p: any) => {
    const totalAllowance = Number(p.totalAllowance ?? 0);
    const extraAllowance = Number(p.extraAllowance ?? 0);
    const loanDeduction = Number(p.loanDeduction ?? 0);

    message += `*Nama:* ${p.employeeName}\n*Jabatan:* ${p.position}\n*Hari Kerja:* ${p.daysWorked} hari\n`;
    message += `*Gaji Pokok:* ${formatCurrency(p.basePay)}\n`;
    message += `*Tunjangan:* ${formatCurrency(totalAllowance)}\n`;
    if (extraAllowance > 0) message += `*Tunjangan Lain:* ${formatCurrency(extraAllowance)}\n`;
    if (loanDeduction > 0) message += `*Potongan:* -${formatCurrency(loanDeduction)}\n`;
    message += `*Total Diterima:* *${formatCurrency(p.totalPay)}*\n-----------------------------------\n`;
  });

  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, "_blank");
};

const PayrollHistory: React.FC<PayrollHistoryProps> = ({ payrolls, onDeletePayroll }) => {
  // ====== BARU: salin props ke state lokal agar kita bisa optimistically update saat hapus 1 karyawan
  const [list, setList] = useState<WeeklyPayroll[]>(payrolls);
  const [view, setView] = useState<"weekly" | "monthly">("weekly");

  useEffect(() => {
    setList(payrolls);
  }, [payrolls]);

  // ====== BARU: hapus 1 karyawan (1 row di tabel payroll) via /api/payrolls/:id
  const handleDeleteOneEmployee = async (
    weekId: string | number,
    weekStart: string,
    weekEnd: string,
    payrollRowId?: number
  ) => {
    if (!payrollRowId) {
      alert("ID payroll baris tidak ditemukan.");
      return;
    }
    const ok = confirm("Hapus riwayat gaji karyawan ini?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/payrolls/${payrollRowId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus baris payroll.");

      // Optimistic update state lokal:
      setList((prev) =>
        prev
          .map((wp) => {
            if (wp.id !== weekId) return wp;
            const left = (wp.employeePayments || []).filter((p: any) => p.payrollId !== payrollRowId);
            const newTotal = left.reduce((s, p: any) => s + (p.totalPay || 0), 0);
            return { ...wp, employeePayments: left, totalPayroll: newTotal };
          })
          .filter((wp) => (wp.employeePayments || []).length > 0) // kalau kosong, sembunyikan card minggu ini
      );
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat menghapus. Coba lagi.");
    }
  };

  const monthlyData = useMemo(() => {
    const grouped: Record<string, { totalPayroll: number; weeklyPayrolls: WeeklyPayroll[] }> = {};

    list.forEach((p) => {
      const monthYear = new Date(p.weekStartDate).toLocaleString("id-ID", {
        month: "long",
        year: "numeric",
      });
      if (!grouped[monthYear]) grouped[monthYear] = { totalPayroll: 0, weeklyPayrolls: [] };
      grouped[monthYear].totalPayroll += p.totalPayroll ?? 0;
      grouped[monthYear].weeklyPayrolls.push(p);
    });

    return Object.entries(grouped)
      .map(([monthYear, data]) => ({ monthYear, ...data }))
      .sort(
        (a, b) =>
          new Date(b.weeklyPayrolls[0].weekStartDate).getTime() -
          new Date(a.weeklyPayrolls[0].weekStartDate).getTime()
      );
  }, [list]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-slate-700">Riwayat Gaji</h2>
      </div>

      {list.length > 0 && (
        <div className="p-1 bg-slate-200 rounded-lg flex items-center">
          <button
            onClick={() => setView("weekly")}
            className={`w-1/2 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
              view === "weekly" ? "bg-white text-brand-primary shadow" : "bg-transparent text-slate-600"
            }`}
          >
            Mingguan
          </button>
          <button
            onClick={() => setView("monthly")}
            className={`w-1/2 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
              view === "monthly" ? "bg-white text-brand-primary shadow" : "bg-transparent text-slate-600"
            }`}
          >
            Bulanan
          </button>
        </div>
      )}

      {list.length > 0 ? (
        <div className="space-y-4">
          {view === "weekly" &&
            list.map((wp) => (
              <WeeklyPayrollCard
                key={wp.id}
                payroll={wp}
                onDeletePeriod={onDeletePayroll}
                onDeleteOne={handleDeleteOneEmployee}
                onShareOne={shareOneEmployeeWhatsApp}
                onShareAll={shareWholePayrollWhatsApp}
              />
            ))}

          {view === "monthly" &&
            monthlyData.map((d) => (
              <MonthlySummaryCard
                key={d.monthYear}
                monthYear={d.monthYear}
                totalPayroll={d.totalPayroll}
                weeklyPayrolls={d.weeklyPayrolls}
                onDeletePeriod={onDeletePayroll}
                onDeleteOne={handleDeleteOneEmployee}
                onShareOne={shareOneEmployeeWhatsApp}
                onShareAll={shareWholePayrollWhatsApp}
              />
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

/* ===================== Sub-komponen ===================== */

const PayrollCardContent: React.FC<{
  payroll: WeeklyPayroll;
  onDeleteOne: (weekId: string | number, ws: string, we: string, payrollRowId?: number) => void;
  onShareOne: (ws: string, we: string, p: any) => void;
}> = ({ payroll, onDeleteOne, onShareOne }) => (
  <div className="payroll-content-wrapper">
    <div className="flex justify-between items-start mb-3">
      <div>
        <div className="flex items-center space-x-2 text-sm text-slate-500">
          <CalendarDaysIcon className="w-4 h-4" />
          <span>{formatDateRange(payroll.weekStartDate, payroll.weekEndDate)}</span>
        </div>
        <div className="flex items-center space-x-2 font-bold text-lg text-brand-secondary mt-1">
          <CurrencyDollarIcon className="w-5 h-5" />
          <span>{formatCurrency(payroll.totalPayroll)}</span>
        </div>
      </div>
      <span className="text-xs bg-emerald-100 text-emerald-800 font-medium px-2 py-1 rounded-full">
        {(payroll.employeePayments ?? []).length} Karyawan
      </span>
    </div>

    {Array.isArray(payroll.employeePayments) && payroll.employeePayments.length > 0 ? (
      <div className="border-t border-slate-200 pt-2 mt-2 space-y-2">
        {payroll.employeePayments.map((payment: any) => (
          <div
            key={`${payment.employeeId}-${payment.payrollId ?? "row"}`}
            className="flex justify-between items-start text-sm py-2 border-b border-slate-100 last:border-b-0"
          >
            <div className="flex-1">
              <p className="font-semibold text-slate-700">{payment.employeeName}</p>
              <p className="text-xs text-slate-500">{payment.position}</p>
              <p className="text-slate-500 text-xs mb-1">{payment.daysWorked} hari kerja</p>

              <div className="text-xs text-slate-600 mt-1 pl-2 border-l-2 border-slate-200 space-y-0.5">
                <div className="flex justify-between">
                  <span>Gaji Pokok:</span> <span>{formatCurrency(payment.basePay)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tunjangan:</span> <span>{formatCurrency(Number(payment.totalAllowance ?? 0))}</span>
                </div>
                {payment.extraAllowance ? (
                  <div className="flex justify-between">
                    <span>Tunjangan Lain:</span> <span>{formatCurrency(Number(payment.extraAllowance ?? 0))}</span>
                  </div>
                ) : null}
                {payment.loanDeduction && Number(payment.loanDeduction) > 0 ? (
                  <div className="flex justify-between text-red-600">
                    <span>Potongan:</span> <span>-{formatCurrency(Number(payment.loanDeduction ?? 0))}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 ml-3">
              <p className="font-bold text-slate-800">{formatCurrency(payment.totalPay)}</p>
              <div className="flex gap-1">
                {/* Share per karyawan */}
                <button
                  title="Bagikan via WhatsApp"
                  onClick={() => onShareOne(payroll.weekStartDate, payroll.weekEndDate, payment)}
                  className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                >
                  <ShareIcon className="w-4 h-4" />
                </button>

                {/* Hapus per karyawan */}
                <button
                  title="Hapus karyawan ini dari periode"
                  onClick={() =>
                    onDeleteOne(payroll.id, payroll.weekStartDate, payroll.weekEndDate, payment.payrollId)
                  }
                  className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-slate-400 text-sm italic mt-3">Tidak ada data karyawan.</p>
    )}
  </div>
);

const PayrollCardActions: React.FC<{
  payroll: WeeklyPayroll;
  onDeletePeriod: (id: string | number) => void;
  onShareAll: (payroll: WeeklyPayroll) => void;
}> = ({ payroll, onDeletePeriod, onShareAll }) => (
  <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-end space-x-2 no-print">
    <button
      onClick={() => onDeletePeriod(payroll.id)}
      className="flex items-center space-x-2 text-sm text-slate-600 hover:text-red-500 font-semibold py-2 px-3 rounded-lg hover:bg-red-50 transition-colors"
    >
      <TrashIcon className="w-4 h-4" />
      <span>Hapus Periode</span>
    </button>
    <button
      onClick={() => onShareAll(payroll)}
      className="flex items-center space-x-2 text-sm text-slate-600 hover:text-brand-secondary font-semibold py-2 px-3 rounded-lg hover:bg-emerald-50 transition-colors"
    >
      <ShareIcon className="w-4 h-4" />
      <span>Bagikan Semua</span>
    </button>
    <button
      onClick={() => handlePrint(payroll.id)}
      className="flex items-center space-x-2 text-sm text-slate-600 hover:text-brand-primary font-semibold py-2 px-3 rounded-lg hover:bg-indigo-50 transition-colors"
    >
      <PrintIcon className="w-4 h-4" />
      <span>Cetak</span>
    </button>
  </div>
);

const WeeklyPayrollCard: React.FC<{
  payroll: WeeklyPayroll;
  onDeletePeriod: (id: string | number) => void;
  onDeleteOne: (weekId: string | number, ws: string, we: string, payrollRowId?: number) => void;
  onShareOne: (ws: string, we: string, p: any) => void;
  onShareAll: (payroll: WeeklyPayroll) => void;
}> = ({ payroll, onDeletePeriod, onDeleteOne, onShareOne, onShareAll }) => (
  <div id={`payroll-${payroll.id}`} className="bg-white p-4 rounded-lg shadow-sm">
    <PayrollCardContent payroll={payroll} onDeleteOne={onDeleteOne} onShareOne={onShareOne} />
    <PayrollCardActions payroll={payroll} onDeletePeriod={onDeletePeriod} onShareAll={onShareAll} />
  </div>
);

const MonthlySummaryCard: React.FC<{
  monthYear: string;
  totalPayroll: number;
  weeklyPayrolls: WeeklyPayroll[];
  onDeletePeriod: (id: string | number) => void;
  onDeleteOne: (weekId: string | number, ws: string, we: string, payrollRowId?: number) => void;
  onShareOne: (ws: string, we: string, p: any) => void;
  onShareAll: (payroll: WeeklyPayroll) => void;
}> = ({ monthYear, totalPayroll, weeklyPayrolls, onDeletePeriod, onDeleteOne, onShareOne, onShareAll }) => {
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
          <p className="font-bold text-lg text-brand-secondary">{formatCurrency(totalPayroll)}</p>
          <ChevronDownIcon className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
        </div>
      </button>
      <div className={`transition-all duration-300 ease-in-out ${isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="p-4 pt-0 space-y-4">
          {weeklyPayrolls.map((payroll) => (
            <div key={payroll.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <PayrollCardContent payroll={payroll} onDeleteOne={onDeleteOne} onShareOne={onShareOne} />
              <PayrollCardActions payroll={payroll} onDeletePeriod={onDeletePeriod} onShareAll={onShareAll} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
