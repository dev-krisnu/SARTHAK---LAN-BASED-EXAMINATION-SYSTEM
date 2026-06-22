import { redirect } from "next/navigation";

import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { getSession } from "@/lib/get-session";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/signin");
  if (session.role === "admin") redirect("/admin/dashboard");

  return (
    <StudentDashboard
      fullName={session.fullName}
      username={session.username}
    />
  );
}
