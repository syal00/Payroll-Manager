import { EmployeeAccessThemeBar } from "@/components/employee-access/EmployeeAccessThemeBar";

export default function EmployeeAccessLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EmployeeAccessThemeBar />
      {children}
    </>
  );
}
