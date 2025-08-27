import type { WeeklyPayroll } from '../src/types.ts';

// --- Payroll Functions ---

export const getPayrolls = async (): Promise<WeeklyPayroll[]> => {
    try {
        const res = await fetch('/api/payrolls');
        if (!res.ok) throw new Error('Failed to fetch payrolls');
        return await res.json();
    } catch (error) {
        console.error("Failed to retrieve payrolls from API", error);
        return [];
    }
};

export const savePayroll = async (payroll: WeeklyPayroll): Promise<WeeklyPayroll> => {
    try {
        const res = await fetch('/api/payrolls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payroll),
        });
        if (!res.ok) throw new Error('Failed to save payroll');
        return await res.json();
    } catch (error) {
        console.error("Failed to save payroll to API", error);
        throw error;
    }
};