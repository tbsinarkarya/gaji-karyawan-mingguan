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

// ============ CETAK SATU PERIODE (Preview terlebih dulu) ============
const printWholePeriodSlip = (payroll: WeeklyPayroll) => {
  if (!payroll) return;
  const now = new Date().toLocaleString("id-ID");
  const emp = Array.isArray(payroll.employeePayments) ? payroll.employeePayments : [];

  const listItems = emp
    .map((p: any) => {
      const extra = Number(p.extraAllowance ?? 0);
      const loan = Number(p.loanDeduction ?? 0);
      const img = p.image_url
        ? `<img src="${p.image_url}" alt="Foto" style="width:36px;height:36px;border-radius:9999px;object-fit:cover;margin-right:8px;" />`
        : "";
      return `
        <div class="item">
          <div class="row" style="align-items:center;margin-bottom:6px;">
            <div style="display:flex;align-items:center;">
              ${img}
              <div>
                <div class="emp-name">${p.employeeName}</div>
                <div class="small muted">${p.position ?? '-'}</div>
              </div>
            </div>
            <div class="emp-total">${formatCurrency(p.totalPay)}</div>
          </div>
          <div class="grid">
            <div class="kv"><span>Hari Kerja</span><span>${p.daysWorked} hari</span></div>
            <div class="kv"><span>Gaji Pokok</span><span>${formatCurrency(p.basePay)}</span></div>
            <div class="kv"><span>Tunjangan</span><span>${formatCurrency(Number(p.totalAllowance ?? 0))}</span></div>
            ${extra > 0 ? `<div class="kv"><span>Tunjangan Lain (THR/Bonus)</span><span>${formatCurrency(extra)}</span></div>` : ''}
            ${loan > 0 ? `<div class="kv danger"><span>Potongan Pinjaman</span><span>-${formatCurrency(loan)}</span></div>` : ''}
          </div>
        </div>`;
    })
    .join("\n");

  const html = `<!doctype html>
  <html lang="id">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Slip Gaji Periode ${formatDateRange(payroll.weekStartDate, payroll.weekEndDate)}</title>
      <style id="print-config"></style>
      <style>
        :root { color-scheme: light; }
        * { box-sizing: border-box; }
        body { margin:0; min-height:100vh; -webkit-print-color-adjust: exact; font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial; color:#0f172a; background:#ffffff; }
        .toolbar { position: sticky; top:0; z-index:10; background:#f8fafc; border-bottom:1px solid #e2e8f0; padding:8px 12px; display:flex; gap:8px; align-items:center; }
        .toolbar h1 { margin:0; font-size:14px; font-weight:600; color:#334155; }
        .btn { appearance:none; border:1px solid #cbd5e1; background:#ffffff; color:#0f172a; padding:6px 10px; border-radius:8px; cursor:pointer; font-weight:600; }
        .btn:hover { background:#f1f5f9; }
        .select { appearance:none; border:1px solid #cbd5e1; background:#ffffff; color:#0f172a; padding:6px 10px; border-radius:8px; font-weight:600; }
        .container { max-width:900px; margin: 12px auto; padding: 12px; }
        body.paper-80 .container { max-width: 76mm; }
        body.paper-58 .container { max-width: 56mm; }
        .card { border:1px solid #e2e8f0; border-radius:12px; padding:16px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
        .row { display:flex; justify-content:space-between; }
        .muted { color:#64748b; }
        .title { font-size:18px; font-weight:700; margin:0 0 2px 0; }
        .small { font-size:12px; }
        .section { margin-top:10px; padding-top:10px; border-top:1px solid #e2e8f0; }
        .summary { display:flex; justify-content:space-between; gap:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:8px 12px; margin-top:8px; }
        .summary > div { display:flex; gap:6px; align-items:center; font-weight:600; color:#334155; }
        .items { margin-top:12px; display:grid; grid-template-columns:1fr; gap:12px; }
        .item { border:1px solid #e2e8f0; border-radius:10px; padding:12px; }
        .grid { display:grid; grid-template-columns: 1fr 1fr; gap:6px 16px; }
        .kv { display:flex; justify-content:space-between; }
        .emp-name { font-weight:600; }
        .emp-total { font-weight:700; }
        .danger { color:#dc2626; }
        @media (max-width:640px){ .grid { grid-template-columns: 1fr; } }
        @media print { .toolbar { display:none; } .container { margin:0 auto; padding:0; } .card { box-shadow:none; } }
      </style>
    </head>
    <body>
      <div class="toolbar">
        <h1>Pratinjau Slip Gaji Periode</h1>
        <label class="small muted" for="paperSelect">Ukuran Kertas:</label>
        <select id="paperSelect" class="select">
          <option value="a4">A4</option>
          <option value="80">Struk 80mm</option>
          <option value="58">Struk 58mm</option>
        </select>
        <button class="btn" onclick="window.print()">Cetak</button>
        <button class="btn" onclick="try{parent.postMessage({__printOverlayClose:true},'*')}catch(e){};try{window.close()}catch(e){}">Tutup</button>
      </div>
      <div class="container">
        <div class="card">
          <div class="row" style="margin-bottom:8px;">
            <div>
              <h2 class="title">Slip Gaji Mingguan</h2>
              <p class="small muted">Periode: ${formatDateRange(payroll.weekStartDate, payroll.weekEndDate)}</p>
            </div>
            <div style="text-align:right">
              <p class="small muted" style="margin:0">Tanggal Cetak</p>
              <p class="small" style="margin:0;font-weight:600">${now}</p>
            </div>
          </div>
          <div class="summary">
            <div><span>Total Karyawan:</span><span>${emp.length}</span></div>
            <div><span>Total Gaji Dibayarkan:</span><span>${formatCurrency(payroll.totalPayroll)}</span></div>
          </div>
          <div class="items">${listItems || '<div class="small muted">Tidak ada data karyawan.</div>'}</div>
        </div>
      </div>
      <script>
        (function(){
          const imgs = Array.from(document.images || []);
          if (imgs.length === 0) return;
          let left = imgs.length;
          const tick = () => { left--; };
          imgs.forEach(img => {
            if (img.complete) { tick(); return; }
            img.addEventListener('load', tick);
            img.addEventListener('error', tick);
          });
        })();

        // Pengaturan ukuran kertas dinamis
        (function(){
          const style = document.getElementById('print-config');
          const select = document.getElementById('paperSelect');
          function apply(size){
            document.body.classList.remove('paper-a4','paper-80','paper-58');
            if(size==='80') {
              document.body.classList.add('paper-80');
              style.textContent = '@page { size: 80mm auto; margin: 5mm }';
            } else if(size==='58') {
              document.body.classList.add('paper-58');
              style.textContent = '@page { size: 58mm auto; margin: 4mm }';
            } else {
              document.body.classList.add('paper-a4');
              style.textContent = '@page { size: A4; margin: 16mm }';
            }
            try { localStorage.setItem('paper-size',''+size); } catch(e) {}
          }
          const initial = (function(){ try { return localStorage.getItem('paper-size') || 'a4'; } catch(e){ return 'a4'; } })();
          select.value = initial;
          apply(initial);
          select.addEventListener('change', function(){ apply(this.value); });
        })();
      </script>
    </body>
  </html>`;

  // Android: gunakan overlay iframe agar stabil
  if (isAndroid()) {
    openPrintOverlay(html);
    return;
  }
  // Non-Android: tetap coba window.open, jika gagal -> overlay
  let w: Window | null = null;
  try { w = window.open("", "_blank", "noopener,width=900,height=900"); } catch {}
  if (!w) { openPrintOverlay(html); return; }
  try { w.document.open(); w.document.write(html); w.document.close(); w.focus(); }
  catch { openPrintOverlay(html); }
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

// ============ Preview overlay (iframe) untuk Android ============
function openPrintOverlay(html: string) {
  try {
    const overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'background:rgba(15,23,42,0.6)',
      'z-index:999999',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'padding:16px',
    ].join(';');

    const frameWrap = document.createElement('div');
    frameWrap.style.cssText = [
      'position:relative',
      'width:min(100%, 960px)',
      'height:92vh',
      'background:#ffffff',
      'border-radius:12px',
      'box-shadow:0 20px 40px rgba(0,0,0,0.3)',
      'overflow:hidden',
      'display:flex',
      'flex-direction:column',
    ].join(';');

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Tutup pratinjau');
    closeBtn.style.cssText = [
      'position:absolute',
      'top:6px',
      'right:10px',
      'width:32px',
      'height:32px',
      'border-radius:8px',
      'border:1px solid #cbd5e1',
      'background:#ffffff',
      'color:#0f172a',
      'font-size:20px',
      'line-height:28px',
      'cursor:pointer',
      'z-index:2',
    ].join(';');

    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Pratinjau Cetak');
    iframe.style.cssText = 'border:0; width:100%; height:100%; background:#ffffff;';

    // Gunakan srcdoc jika didukung, fallback ke Blob URL
    try {
      // @ts-ignore - older TS may not know srcdoc
      if ('srcdoc' in iframe) {
        // @ts-ignore
        iframe.srcdoc = html;
      } else {
        const blob = new Blob([html], { type: 'text/html' });
        iframe.src = URL.createObjectURL(blob);
      }
    } catch {
      const blob = new Blob([html], { type: 'text/html' });
      iframe.src = URL.createObjectURL(blob);
    }

    frameWrap.appendChild(iframe);
    frameWrap.appendChild(closeBtn);
    overlay.appendChild(frameWrap);
    document.body.appendChild(overlay);

    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    function cleanup() {
      try { window.removeEventListener('message', onMessage as any); } catch {}
      try { document.documentElement.style.overflow = prevOverflow; } catch {}
      try { overlay.remove(); } catch {}
    }

    function onMessage(e: MessageEvent) {
      try {
        if (e && (e as any).data && (e as any).data.__printOverlayClose) {
          cleanup();
        }
      } catch {}
    }
    window.addEventListener('message', onMessage as any);

    closeBtn.addEventListener('click', cleanup);

    return { iframe, cleanup };
  } catch (e) {
    console.error('Gagal membuat overlay cetak:', e);
    alert('Gagal menampilkan pratinjau cetak.');
    return null;
  }
}

// ============ CETAK PER KARYAWAN (Preview terlebih dulu) ============
const printOneEmployeeSlip = (weekStart: string, weekEnd: string, p: any) => {
  const now = new Date().toLocaleString("id-ID");
  const imgHtml = p.image_url
    ? `<img src="${p.image_url}" alt="Foto" style="width:48px;height:48px;border-radius:9999px;object-fit:cover;" />`
    : "";

  const html = `<!doctype html>
  <html lang="id">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Slip Gaji - ${p.employeeName}</title>
      <style id="print-config"></style>
      <style>
        :root { color-scheme: light; }
        * { box-sizing: border-box; }
        body { margin:0; min-height:100vh; -webkit-print-color-adjust: exact; font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial; color:#0f172a; background:#ffffff; }
        .toolbar { position: sticky; top:0; z-index:10; background:#f8fafc; border-bottom:1px solid #e2e8f0; padding:8px 12px; display:flex; gap:8px; align-items:center; }
        .toolbar h1 { margin:0; font-size:14px; font-weight:600; color:#334155; }
        .btn { appearance:none; border:1px solid #cbd5e1; background:#ffffff; color:#0f172a; padding:6px 10px; border-radius:8px; cursor:pointer; font-weight:600; }
        .btn:hover { background:#f1f5f9; }
        .select { appearance:none; border:1px solid #cbd5e1; background:#ffffff; color:#0f172a; padding:6px 10px; border-radius:8px; font-weight:600; }
        .container { max-width:720px; margin: 12px auto; padding: 12px; }
        body.paper-80 .container { max-width: 76mm; }
        body.paper-58 .container { max-width: 56mm; }
        .card { border:1px solid #e2e8f0; border-radius:12px; padding:16px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
        .row { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
        .muted { color:#64748b; }
        .title { font-size:18px; font-weight:700; margin:0 0 2px 0; }
        .small { font-size:12px; }
        .section { margin-top:10px; padding-top:10px; border-top:1px solid #e2e8f0; }
        .kv { display:flex; justify-content:space-between; padding:6px 0; }
        .total { font-weight:700; font-size:16px; }
        .danger { color:#dc2626; }
        .note { margin-top:16px; font-size:10px; color:#94a3b8; }
        @media print {
          .toolbar { display:none; }
          .container { margin:0 auto; padding: 0; }
          .card { box-shadow:none; }
        }
      </style>
    </head>
    <body>
      <div class="toolbar">
        <h1>Pratinjau Slip Gaji</h1>
        <label class="small muted" for="paperSelect">Ukuran Kertas:</label>
        <select id="paperSelect" class="select">
          <option value="a4">A4</option>
          <option value="80">Struk 80mm</option>
          <option value="58">Struk 58mm</option>
        </select>
        <button class="btn" onclick="window.print()">Cetak</button>
        <button class="btn" onclick="try{parent.postMessage({__printOverlayClose:true},'*')}catch(e){};try{window.close()}catch(e){}">Tutup</button>
      </div>
      <div class="container">
        <div class="card">
          <div class="row" style="margin-bottom:8px;">
            <div>
              <h2 class="title">Slip Gaji Mingguan</h2>
              <p class="small muted">${formatDateRange(weekStart, weekEnd)}</p>
            </div>
            <div style="text-align:right">
              <p class="small muted" style="margin:0">Tanggal Cetak</p>
              <p class="small" style="margin:0;font-weight:600">${now}</p>
            </div>
          </div>

          <div class="row" style="margin-bottom:12px; align-items:center;">
            ${imgHtml}
            <div>
              <p style="margin:0;font-weight:600">${p.employeeName}</p>
              <p class="small muted" style="margin:2px 0 0 0;">${p.position ?? "-"}</p>
            </div>
          </div>

          <div class="section">
            <div class="kv"><span class="muted">Hari Kerja</span><span style="font-weight:600">${p.daysWorked} hari</span></div>
            <div class="kv"><span class="muted">Gaji Pokok</span><span style="font-weight:600">${formatCurrency(p.basePay)}</span></div>
            <div class="kv"><span class="muted">Tunjangan</span><span style="font-weight:600">${formatCurrency(Number(p.totalAllowance ?? 0))}</span></div>
            ${Number(p.extraAllowance ?? 0) > 0 ? `<div class="kv"><span class="muted">Tunjangan Lain (THR/Bonus)</span><span style="font-weight:600">${formatCurrency(Number(p.extraAllowance ?? 0))}</span></div>` : ""}
            ${Number(p.loanDeduction ?? 0) > 0 ? `<div class="kv danger"><span>Potongan Pinjaman</span><span>-${formatCurrency(Number(p.loanDeduction ?? 0))}</span></div>` : ""}
            <div class="kv total"><span style="color:#334155">Total Diterima</span><span>${formatCurrency(p.totalPay)}</span></div>
          </div>

          <p class="note">Dokumen ini dihasilkan otomatis dari sistem dan tidak memerlukan tanda tangan.</p>
        </div>
      </div>
      <script>
        // Pastikan gambar (jika ada) sudah termuat agar tidak blank saat print
        (function(){
          const imgs = Array.from(document.images || []);
          if (imgs.length === 0) return;
          let loaded = 0; const done = () => { /* noop: user klik Cetak */ };
          imgs.forEach(img => {
            if (img.complete) { loaded++; if (loaded === imgs.length) done(); return; }
            img.addEventListener('load', () => { loaded++; if (loaded === imgs.length) done(); });
            img.addEventListener('error', () => { loaded++; if (loaded === imgs.length) done(); });
          });
        })();

        // Pengaturan ukuran kertas dinamis
        (function(){
          const style = document.getElementById('print-config');
          const select = document.getElementById('paperSelect');
          function apply(size){
            document.body.classList.remove('paper-a4','paper-80','paper-58');
            if(size==='80') {
              document.body.classList.add('paper-80');
              style.textContent = '@page { size: 80mm auto; margin: 5mm }';
            } else if(size==='58') {
              document.body.classList.add('paper-58');
              style.textContent = '@page { size: 58mm auto; margin: 4mm }';
            } else {
              document.body.classList.add('paper-a4');
              style.textContent = '@page { size: A4; margin: 16mm }';
            }
            try { localStorage.setItem('paper-size',''+size); } catch(e) {}
          }
          const initial = (function(){ try { return localStorage.getItem('paper-size') || 'a4'; } catch(e){ return 'a4'; } })();
          select.value = initial;
          apply(initial);
          select.addEventListener('change', function(){ apply(this.value); });
        })();
      </script>
    </body>
  </html>`;

  // Android: gunakan overlay iframe agar stabil
  if (isAndroid()) {
    openPrintOverlay(html);
    return;
  }
  // Non-Android: tetap coba window.open, jika gagal -> overlay
  let w: Window | null = null;
  try { w = window.open("", "_blank", "noopener,width=520,height=800"); } catch {}
  if (!w) { openPrintOverlay(html); return; }
  try { w.document.open(); w.document.write(html); w.document.close(); w.focus(); }
  catch { openPrintOverlay(html); }
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
                onPrintPeriod={printWholePeriodSlip}
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
                onPrintPeriod={printWholePeriodSlip}
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
  onPrintPeriod: (payroll: WeeklyPayroll) => void;
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
      onClick={() => onPrintPeriod(payroll)}
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
  onPrintPeriod: (payroll: WeeklyPayroll) => void;
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
  onPrintPeriod: (payroll: WeeklyPayroll) => void;
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
