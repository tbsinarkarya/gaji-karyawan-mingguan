import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'GET') {
        try {
            const employees = await prisma.employee.findMany({
                orderBy: {
                    name: 'asc'
                }
            });
            return res.status(200).json(employees);
        } catch (error) {
            console.error('Error fetching employees:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    } else if (req.method === 'POST') {
        try {
            const { name, position, dailyRate, weeklyAllowance, imageUrl } = req.body;

            if (!name || !position || dailyRate == null || weeklyAllowance == null) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            const newEmployee = await prisma.employee.create({
                data: {
                    name,
                    position,
                    dailyRate: parseFloat(dailyRate),
                    weeklyAllowance: parseFloat(weeklyAllowance),
                    imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/200`,
                },
            });

            return res.status(201).json(newEmployee);
        } catch (error) {
            console.error('Error creating employee:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
