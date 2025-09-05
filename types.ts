export interface Employee {
  id: number;
  name: string;
  position: string;
  daily_rate: number;
  weekly_allowance: number;
  image_url: string | null;
  created_at: string;
}

export interface EmployeePayment {
  employeeId: number;
  employeeName: string;
  position: string;
  daysWorked: number;
  basePay: number;
  totalAllowance: number;
  loanDeduction: number;
  totalPay: number; // Net pay
}

export interface WeeklyPayroll {
  id: number;
  weekStartDate: string;
  weekEndDate: string;
  totalPayroll: number;
  employeePayments: EmployeePayment[];
}
