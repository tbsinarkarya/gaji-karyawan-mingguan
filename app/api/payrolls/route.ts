import { NextResponse } from "next/server";

export async function GET() {
  // sementara return data kosong
  return NextResponse.json([]);
}

export async function POST(req: Request) {
  const body = await req.json();
  // contoh response payroll baru
  const newPayroll = {
    id: Date.now().toString(),
    weekStartDate: "2025-09-01",
    weekEndDate: "2025-09-07",
    totalPayroll: 1000000,
    employeePayments: body.employeePayments ?? [],
  };

  return NextResponse.json(newPayroll, { status: 201 });
}
