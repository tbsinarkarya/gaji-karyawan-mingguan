import React, { useEffect, useMemo, useState } from "react";
import type { WeeklyPayroll } from "@/types";
import CalendarDaysIcon from "./icons/CalendarDaysIcon.tsx";
import ChevronDownIcon from "./icons/ChevronDownIcon.tsx";
import CurrencyDollarIcon from "./icons/CurrencyDollarIcon.tsx";
import PrintIcon from "./icons/PrintIcon.tsx";
import ShareIcon from "./icons/ShareIcon.tsx";
import TrashIcon from "./icons/TrashIcon.tsx";
import WhatsAppChoiceModal from "./WhatsAppChoiceModal";

interface PayrollHistoryProps {
  payrolls: WeeklyPayroll[];
  onDeletePayroll: (id: string | number) => void; // hapus 1 periode (semua karyawan)
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

const handlePrintPeriod = (payrollId: string | number) => {
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
  style.textContent =
    `@page{margin:16mm}body{-webkit-print-color-adjust:exact;font-family:sans-serif}.print-container{padding:1rem;max-width:720px;margin:0 auto;}`;
  doc.head.appendChild(style);

  const container = doc.createElement("div");
  container.className = "print-container";
  container.appendChild(content);
  doc.body.appendChild(container);

  tailwindScript.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 800);
    }, 350);
  };

  tailwindScript.onerror = () => {
    alert("Gagal memuat gaya cetak.");
    document.body.removeChild(iframe);
  };
};

// ====== Util pilih target WhatsApp ======
const isAndroid = () => typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

function openWhatsApp(message: string, preferred?: "consumer" | "business") {
  const encoded = encodeURIComponent(message);
  if (isAndroid()) {
    const pkg = preferred === "business" ? "com.whatsapp.w4b" : preferred === "consumer" ? "com.whatsapp" : undefined;
    const intentUrl = pkg
      ? `intent://send?text=${encoded}#Intent;scheme=whatsapp;package=${pkg};end`
      : `whatsapp://send?text=${encoded}`;
    const win = window.open(intentUrl, "_blank");
    setTimeout(() => {
      try {
        if (win && win.closed === false) return;
      } catch {}
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
    }, 700);
    return;
  }
  window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
}

// ============ Perbaikan di sini ============
// Gunakan newline asli, dan normalisasi literal "\n" menjadi newline
function sanitizeWAHeader(msg: string) {
  const header = '*Slip Gaji Mingguan*\n\n';
  // normalisasi: CRLF -> LF dan literal "\n" -> newline
  let out = (msg ?? "").replace(/\r\n/g, '\n').replace(/\\n/g, '\n');

  if (!out.startsWith(header)) {
    const sep = out.indexOf('\n\n');
    out = header + (sep >= 0 ? out.slice(sep + 2) : out);
  }
  const after = out.slice(header.length);
  const afterTrim = after.trimStart();
  const startsDup =
    afterTrim.startsWith('Slip Gaji Mingguan') ||
    afterTrim.startsWith('🧾 Slip Gaji Mingguan') ||
    afterTrim.startsWith('ð') ||
    afterTrim.startsWith('*Slip Gaji Mingguan*');

  if (startsDup) {
    out = header + after.replace(/^\*?\s*Slip Gaji Mingguan\*?\s*/i, '');
  }
  return out;
}

type WAChoice = "consumer" | "business";

// ============ CETAK PER KARYAWAN (BARU) ============
const printOneEmployeeSlip = (weekStart: string, weekEnd: string, p: any) => {
  const html = `
  <html>
    <head>
      <title>Slip Gaji - ${p.employeeName}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @page { margin: 16mm }
        body { -webkit-print-color-adjust: exact; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial }
      </style>
    </head>
    <body class="bg-white">
      <div class="max-w-md mx-auto p-6">
        <div class="border rounded-xl p-5 shadow">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h1 class="text-lg font-bold text-slate-800">Slip Gaji Mingguan</h1>
              <p class="text-sm text-slate-500">${formatDateRange(weekStart, weekEnd)}</p>
            </div>
            <div class="text-right">
              <p class="text-xs text-slate-500">Tanggal Cetak</p>
              <p class="text-sm font-medium">${new Date().toLocaleString("id-ID")}</p>
            </div>
          </div>

          <div class="flex items-center gap-3 mb-4">
            ${p.image_url ? `<img src="${p.image_url}" class="w-12 h-12 rounded-full object-cover" />` : ""}
            <div>
              <p class="font-semibold text-slate-800">${p.employeeName}</p>
              <p class="text-xs text-slate-500">${p.position ?? "-"}</p>
            </div>
          </div>

          <div class="text-sm divide-y divide-slate-200">
            <div class="flex justify-between py-2">
              <span class="text-slate-600">Hari Kerja</span>
              <span class="font-medium">${p.daysWorked} hari</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-slate-600">Gaji Pokok</span>
              <span class="font-medium">${formatCurrency(p.basePay)}</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-slate-600">Tunjangan</span>
              <span class="font-medium">${formatCurrency(Number(p.totalAllowance ?? 0))}</span>
            </div>
            ${
              Number(p.extraAllowance ?? 0) > 0
                ? `<div class="flex justify-between py-2">
                     <span class="text-slate-600">Tunjangan Lain (THR/Bonus)</span>
                     <span class="font-medium">${formatCurrency(Number(p.extraAllowance ?? 0))}</span>
                   </div>`
                : ""
            }
            ${
              Number(p.loanDeduction ?? 0) > 0
                ? `<div class="flex justify-between py-2 text-red-600">
                     <span>Potongan Pinjaman</span>
                     <span>-${formatCurrency(Number(p.loanDeduction ?? 0))}</span>
                   </div>`
                : ""
            }
            <div class="flex justify-between py-2 text-base">
              <span class="font-semibold text-slate-700">Total Diterima</span>
              <span class="font-bold text-slate-900">${formatCurrency(p.totalPay)}</span>
            </div>
          </div>

          <p class="mt-6 text-[10px] text-slate-400">Dokumen ini dicetak otomatis dari sistem. Tidak memerlukan tanda tangan.</p>
        </div>
      </div>
      <script>
        window.addEventListener('load', () => { window.print(); setTimeout(() => window.close(), 300); });
      </script>
    </body>
  </html>`.trim();

  const w = window.open("", "_blank", "noopener,noreferrer,width=480,height=720");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
};

// ====== Build WhatsApp messages (Perbaikan newline) ======
const buildOneEmployeeWhatsAppMessage = (weekStart: string, weekEnd: string, p: any) => {
  const totalAllowance = Number(p.totalAllowance ?? 0);
  const extraAllowance = Number(p.extraAllowance ?? 0);
  const loanDeduction = Number(p.loanDeduction ?? 0);

  let message = `*Slip Gaji Mingguan*\n\n`;
  message += `*Periode:* ${formatDateRange(weekStart, weekEnd)}\n\n`;
  message += `*Nama:* ${p.employeeName}\n*Jabatan:* ${p.position}\n*Hari Kerja:* ${p.daysWorked} hari\n`;
  message += `*Gaji Pokok:* ${formatCurrency(p.basePay)}\n`;
  message += `*Tunjangan:* ${formatCurrency(totalAllowance)}\n`;
  if (extraAllowance > 0) message += `*Tunjangan Lain:* ${formatCurrency(extraAllowance)}\n`;
  if (loanDeduction > 0) message += `*Potongan:* -${formatCurrency(loanDeduction)}\n`;
  message += `*Total Diterima:* *${formatCurrency(p.totalPay)}*\n`;

  // Force a clean header and drop any mojibake prefix
  const _header = '*Slip Gaji Mingguan*\n\n';
  message = _header + message.replace(/^.*?\n\n/, '');
  return sanitizeWAHeader(message);
};

// Share WhatsApp satu periode (semua karyawan)
const buildWholePayrollWhatsAppMessage = (payroll: WeeklyPayroll) => {
  let message = `*Slip Gaji Mingguan*\n\n`;
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

  const _header = '*Slip Gaji Mingguan*\n\n';
  message = _header + message.replace(/^.*?\n\n/, '');
  return sanitizeWAHeader(message);
};

const PayrollHistory: React.FC<PayrollHistoryProps> = ({ payrolls, onDeletePayroll }) => {
  const [list, setList] = useState<WeeklyPayroll[]>(payrolls);
  const [view, setView] = useState<"weekly" | "monthly">("weekly");
  const [waChooserOpen, setWaChooserOpen] = useState(false);
  const [waMessage, setWaMessage] = useState<string | null>(null);

  useEffect(() => {
    setList(payrolls);
  }, [payrolls]);

  // Hapus 1 karyawan (1 baris payroll) di periode
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

      // Optimistic update
      setList((prev) =>
        prev
          .map((wp) => {
            if (wp.id !== weekId) return wp;
            const left = (wp.employeePayments || []).filter((p: any) => p.payrollId !== payrollRowId);
            const newTotal = left.reduce((s, p: any) => s + (p.totalPay || 0), 0);
            return { ...wp, employeePayments: left, totalPayroll: newTotal };
          })
          .filter((wp) => (wp.employeePayments || []).length > 0)
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
      <WhatsAppChoiceModal
        isOpen={waChooserOpen}
        onClose={() => {
          setWaChooserOpen(false);
          setWaMessage(null);
        }}
        onChoose={(choice: WAChoice) => {
          if (waMessage) openWhatsApp(waMessage, choice);
          setWaChooserOpen(false);
          setWaMessage(null);
        }}
      />

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
                onShareOne={(ws, we, p) => {
                  const msg = buildOneEmployeeWhatsAppMessage(ws, we, p);
                  setWaMessage(msg);
                  setWaChooserOpen(true);
                }}
                onShareAll={(payroll) => {
                  const msg = buildWholePayrollWhatsAppMessage(payroll);
                  setWaMessage(msg);
                  setWaChooserOpen(true);
                }}
                onPrintOne={printOneEmployeeSlip}
                onPrintPeriod={handlePrintPeriod}
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
                onShareOne={(ws, we, p) => {
                  const msg = buildOneEmployeeWhatsAppMessage(ws, we, p);
                  setWaMessage(msg);
                  setWaChooserOpen(true);
                }}
                onShareAll={(payroll) => {
                  const msg = buildWholePayrollWhatsAppMessage(payroll);
                  setWaMessage(msg);
                  setWaChooserOpen(true);
                }}
                onPrintOne={printOneEmployeeSlip}
                onPrintPeriod={handlePrintPeriod}
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
  onPrintOne: (ws: string, we: string, p: any) => void;
}> = ({ payroll, onDeleteOne, onShareOne, onPrintOne }) => (
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
                {/* Bagikan per karyawan */}
                <button
                  title="Bagikan via WhatsApp"
                  onClick={() => onShareOne(payroll.weekStartDate, payroll.weekEndDate, payment)}
                  className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                >
                  <ShareIcon className="w-4 h-4" />
                </button>

                {/* Cetak per karyawan (BARU) */}
                <button
                  title="Cetak slip karyawan ini"
                  onClick={() => onPrintOne(payroll.weekStartDate, payroll.weekEndDate, payment)}
                  className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                >
                  <PrintIcon className="w-4 h-4" />
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
  onPrintPeriod: (payrollId: string | number) => void;
}> = ({ payroll, onDeletePeriod, onShareAll, onPrintPeriod }) => (
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
      onClick={() => onPrintPeriod(payroll.id)}
      className="flex items-center space-x-2 text-sm text-slate-600 hover:text-brand-primary font-semibold py-2 px-3 rounded-lg hover:bg-indigo-50 transition-colors"
    >
      <PrintIcon className="w-4 h-4" />
      <span>Cetak Periode</span>
    </button>
  </div>
);

const WeeklyPayrollCard: React.FC<{
  payroll: WeeklyPayroll;
  onDeletePeriod: (id: string | number) => void;
  onDeleteOne: (weekId: string | number, ws: string, we: string, payrollRowId?: number) => void;
  onShareOne: (ws: string, we: string, p: any) => void;
  onShareAll: (payroll: WeeklyPayroll) => void;
  onPrintOne: (ws: string, we: string, p: any) => void;
  onPrintPeriod: (payrollId: string | number) => void;
}> = ({ payroll, onDeletePeriod, onDeleteOne, onShareOne, onShareAll, onPrintOne, onPrintPeriod }) => (
  <div id={`payroll-${payroll.id}`} className="bg-white p-4 rounded-lg shadow-sm">
    <PayrollCardContent payroll={payroll} onDeleteOne={onDeleteOne} onShareOne={onShareOne} onPrintOne={onPrintOne} />
    <PayrollCardActions payroll={payroll} onDeletePeriod={onDeletePeriod} onShareAll={onShareAll} onPrintPeriod={onPrintPeriod} />
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
  onPrintOne: (ws: string, we: string, p: any) => void;
  onPrintPeriod: (payrollId: string | number) => void;
}> = ({ monthYear, totalPayroll, weeklyPayrolls, onDeletePeriod, onDeleteOne, onShareOne, onShareAll, onPrintOne, onPrintPeriod }) => {
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
              <PayrollCardContent payroll={payroll} onDeleteOne={onDeleteOne} onShareOne={onShareOne} onPrintOne={onPrintOne} />
              <PayrollCardActions payroll={payroll} onDeletePeriod={onDeletePeriod} onShareAll={onShareAll} onPrintPeriod={onPrintPeriod} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
