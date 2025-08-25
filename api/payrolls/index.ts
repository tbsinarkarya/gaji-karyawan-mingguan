import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'GET') {
        try {
            const payrolls = await prisma.weeklyPayroll.findMany({
                orderBy: {
                    weekStartDate: 'desc',
                },
                include: {
                    employeePayments: true,
                },
            });
            return res.status(200).json(payrolls);
        } catch (error) {
            console.error('Error fetching payrolls:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    } else if (req.method === 'POST') {
        try {
            const { employeePayments } = req.body;

            if (!employeePayments || !Array.isArray(employeePayments) || employeePayments.length === 0) {
                return res.status(400).json({ message: 'Employee payments data is required.' });
            }

            // Use UTC dates to avoid timezone issues on the server
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);

            const dayOfWeek = today.getUTCDay(); // Sunday = 0, Monday = 1, etc.
            const diff = today.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
            const weekStartDate = new Date(today.setUTCDate(diff));

            const weekEndDate = new Date(weekStartDate);
            weekEndDate.setUTCDate(weekStartDate.getUTCDate() + 6);
            
            let totalPayroll = 0;
            const employeeData = await prisma.employee.findMany({
                where: { id: { in: employeePayments.map(p => p.employeeId) } }
            });

            const paymentsToCreate = employeePayments.map(p => {
                const employee = employeeData.find(e => e.id === p.employeeId);
                if (!employee) throw new Error(`Employee with id ${p.employeeId} not found`);

                const basePay = employee.dailyRate * p.daysWorked;
                const totalPay = basePay + p.totalAllowance - p.loanDeduction;
                totalPayroll += totalPay;

                return {
                    employeeId: employee.id,
                    employeeName: employee.name,
                    position: employee.position,
                    daysWorked: p.daysWorked,
                    basePay,
                    totalAllowance: p.totalAllowance,
                    loanDeduction: p.loanDeduction,
                    totalPay,
                };
            });
            
            const newPayroll = await prisma.weeklyPayroll.create({
                data: {
                    weekStartDate,
                    weekEndDate,
                    totalPayroll,
                    employeePayments: {
                        create: paymentsToCreate,
                    },
                },
                include: {
                    employeePayments: true,
                },
            });

            return res.status(201).json(newPayroll);
        } catch (error) {
            console.error('Error creating payroll:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}