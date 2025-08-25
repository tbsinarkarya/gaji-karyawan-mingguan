import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { id } = req.query;

    if (typeof id !== 'string') {
        return res.status(400).json({ message: 'Invalid ID' });
    }
    
    if (req.method === 'DELETE') {
        try {
            // Prisma's onDelete: Cascade will handle deleting related EmployeePayment records
            await prisma.weeklyPayroll.delete({
                where: { id },
            });
            return res.status(204).end(); // No Content
        } catch (error) {
            console.error(`Error deleting payroll ${id}:`, error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
