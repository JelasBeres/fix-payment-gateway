import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminProvider } from "@/context/AdminContext";
import AdminLayoutWrapper from "@/components/admin/AdminLayoutWrapper";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <AdminProvider>
      <AdminLayoutWrapper>
        {children}
      </AdminLayoutWrapper>
    </AdminProvider>
  );
}
