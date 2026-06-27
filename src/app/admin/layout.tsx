import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AdminNav } from "@/components/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const member = await db.member.findUnique({ where: { clerkId: userId } });
  if (!member || member.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="btg-admin-layout">
      <AdminNav memberName={member.name} />
      <main className="btg-admin-content">
        {children}
      </main>
    </div>
  );
}
