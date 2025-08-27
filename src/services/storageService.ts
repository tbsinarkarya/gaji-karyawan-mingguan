import type { Employee, WeeklyPayroll } from '../types.ts';

// --- Employee Functions ---

export const getEmployees = async (): Promise<Employee[]> => {
    try {
        const res = await fetch('/api/employees');
        if (!res.ok) throw new Error('Failed to fetch employees');
        return await res.json();
    } catch (error) {
        console.error("Failed to retrieve employees from API", error);
        return [];
    }
};

export const saveEmployee = async (employee: Omit<Employee, 'id'>): Promise<Employee> => {
    try {
        const res = await fetch('/api/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employee),
        });
        if (!res.ok) throw new Error('Failed to save employee');
        return await res.json();
    } catch (error) {
        console.error("Failed to save employee to API", error);
        throw error;
    }
};
