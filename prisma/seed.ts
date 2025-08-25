import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const initialEmployees = [
    { name: 'Budi Santoso', position: 'Frontend Developer', dailyRate: 600000, weeklyAllowance: 300000, imageUrl: 'https://picsum.photos/seed/1/200' },
    { name: 'Citra Lestari', position: 'UI/UX Designer', dailyRate: 560000, weeklyAllowance: 270000, imageUrl: 'https://picsum.photos/seed/2/200' },
    { name: 'Agus Wijaya', position: 'Backend Developer', dailyRate: 640000, weeklyAllowance: 330000, imageUrl: 'https://picsum.photos/seed/3/200' },
];

async function main() {
    console.log('Start seeding...');

    // Clean up existing data to ensure a fresh start
    await prisma.employeePayment.deleteMany({});
    await prisma.weeklyPayroll.deleteMany({});
    await prisma.employee.deleteMany({});
    
    console.log('Old data cleared. Seeding new data...');

    for (const employee of initialEmployees) {
        await prisma.employee.create({
            data: employee,
        });
    }
    console.log(`Seeded ${initialEmployees.length} employees.`);
    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });