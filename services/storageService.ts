import type { Employee, WeeklyPayroll } from '../types.ts';

const EMPLOYEES_KEY = 'payroll_employees';
const PAYROLLS_KEY = 'payroll_payrolls';

const initialEmployees: Employee[] = [
    { id: 'emp-1', name: 'Budi Santoso', position: 'Frontend Developer', dailyRate: 600000, weeklyAllowance: 300000, imageUrl: 'https://picsum.photos/seed/1/200' },
    { id: 'emp-2', name: 'Citra Lestari', position: 'UI/UX Designer', dailyRate: 560000, weeklyAllowance: 270000, imageUrl: 'https://picsum.photos/seed/2/200' },
    { id: 'emp-3', name: 'Agus Wijaya', position: 'Backend Developer', dailyRate: 640000, weeklyAllowance: 330000, imageUrl: 'https://picsum.photos/seed/3/200' },
];

// --- Employee Functions ---

export const getEmployees = (): Employee[] => {
    try {
        const employeesJson = localStorage.getItem(EMPLOYEES_KEY);
        if (employeesJson) {
            return JSON.parse(employeesJson);
        } else {
            // Seed initial data if none exists
            saveEmployees(initialEmployees);
            return initialEmployees;
        }
    } catch (error) {
        console.error("Failed to retrieve employees from localStorage", error);
        return [];
    }
};

export const saveEmployees = (employees: Employee[]): void => {
    try {
        localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
    } catch (error) {
        console.error("Failed to save employees to localStorage", error);
    }
};

// --- Payroll Functions ---

export const getPayrolls = (): WeeklyPayroll[] => {
    try {
        const payrollsJson = localStorage.getItem(PAYROLLS_KEY);
        return payrollsJson ? JSON.parse(payrollsJson) : [];
    } catch (error) {
        console.error("Failed to retrieve payrolls from localStorage", error);
        return [];
    }
};

export const savePayrolls = (payrolls: WeeklyPayroll[]): void => {
    try {
        localStorage.setItem(PAYROLLS_KEY, JSON.stringify(payrolls));
    } catch (error) {
        console.error("Failed to save payrolls to localStorage", error);
    }
};