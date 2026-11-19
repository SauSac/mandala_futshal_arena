import { redirect } from "next/navigation";
import Dashboard from "@/components/dashboard/Dashboard";
import { createClient } from "@/lib/supabase/server";

export default async function DeveloperDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile?.role) redirect("/auth/login");
  if (profile.role !== "developer") redirect(profile.role === "developer" ? "/developer/dashboard" : profile.role === "manager" ? "/manager/dashboard" : "/player/dashboard");
  return <Dashboard role="developer" />;
}
