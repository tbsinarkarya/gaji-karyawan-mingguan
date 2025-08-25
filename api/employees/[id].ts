import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/prisma';
import { Prisma } from '@prisma/client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { id } = req.query;

    if (typeof id !== 'string') {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    if (req.method === 'PUT') {
        try {
            const { name, position, dailyRate, weeklyAllowance, imageUrl } = req.body;

            if (!name || !position || dailyRate == null || weeklyAllowance == null) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            const updatedEmployee = await prisma.employee.update({
                where: { id },
                data: {
                    name,
                    position,
                    dailyRate: parseFloat(dailyRate),
                    weeklyAllowance: parseFloat(weeklyAllowance),
                    imageUrl,
                },
            });

            return res.status(200).json(updatedEmployee);
        } catch (error) {
            console.error(`Error updating employee ${id}:`, error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    } else if (req.method === 'DELETE') {
        try {
            await prisma.employee.delete({
                where: { id },
            });
            return res.status(204).end(); // No Content
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
                // Foreign key constraint failed (P2003)
                return res.status(409).json({ message: 'Tidak dapat menghapus karyawan karena memiliki riwayat gaji.' });
            }
            console.error(`Error deleting employee ${id}:`, error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}