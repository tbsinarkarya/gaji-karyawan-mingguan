export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

export const formatDateRange = (start: string, end: string): string => {
    // Menambahkan T00:00:00 untuk menghindari masalah zona waktu saat parsing
    const startDate = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${startDate.toLocaleDateString('id-ID', options)} - ${endDate.toLocaleDateString('id-ID', { ...options, year: 'numeric' })}`;
};

export const formatRupiahInput = (value: string): string => {
    if (!value) return '';
    const numberString = value.replace(/[^0-9]/g, '');
    if (numberString === '' || isNaN(parseInt(numberString, 10))) return '';
    const formatted = new Intl.NumberFormat('id-ID').format(parseInt(numberString, 10));
    return `Rp ${formatted}`;
};

export const parseRupiahInput = (value: string): string => {
    // Mengembalikan hanya angka dari string (misal: "Rp 1.000" -> "1000")
    // Memperbaiki bug: [^0-g] menjadi [^0-9]
    return value.replace(/[^0-9]/g, '');
};