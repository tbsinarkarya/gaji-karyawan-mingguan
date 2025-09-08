import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payroll App",
  description: "Aplikasi penggajian mingguan karyawan",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
