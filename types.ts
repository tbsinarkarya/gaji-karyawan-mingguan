export interface Employee {
  id: string;
  name: string;
  position: string;
  dailyRate: number;
  weeklyAllowance: number;
  imageUrl: string;
}

export interface EmployeePayment {
  employeeId: string;
  employeeName: string;
  position: string;
  daysWorked: number;
  basePay: number;
  totalAllowance: number;
  loanDeduction: number;
  totalPay: number; // Net pay
}

export interface WeeklyPayroll {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  totalPayroll: number;
  employeePayments: EmployeePayment[];
}