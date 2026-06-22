import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { getSession } from "@/lib/get-session";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/signin");
  if (session.role !== "admin") redirect("/dashboard");

  return (
    <AdminDashboard
      fullName={session.fullName}
      username={session.username}
    />
  );
}
