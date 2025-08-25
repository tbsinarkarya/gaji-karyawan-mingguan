export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

export const formatDateRange = (start: string, end: string): string => {
    // Dates from Prisma/API are full ISO strings, so they can be parsed directly.
    const startDate = new Date(start);
    const endDate = new Date(end);
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
    return value.replace(/[^0-9]/g, '');
};