import type { Employee } from "../types";

export async function getEmployees(): Promise<Employee[]> {
  const res = await fetch("/api/employees", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch employees");
  return await res.json();
}

export async function saveEmployee(employee: Partial<Employee>): Promise<Employee> {
  const res = await fetch("/api/employees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(employee),
  });
  if (!res.ok) throw new Error("Failed to save employee");
  return await res.json();
}
