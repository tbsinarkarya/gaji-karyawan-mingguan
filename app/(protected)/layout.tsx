import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Payroll App",
  description: "Aplikasi penggajian mingguan karyawan",
};

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return children as any;
}

