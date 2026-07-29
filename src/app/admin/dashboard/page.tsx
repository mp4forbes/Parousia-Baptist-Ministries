import { checkAdminAuth, getServiceSchedules, getHaitiMissions, getLocalOutreaches, getEvents, getSettings, getRegistrations, getSermons, getKnowledgeBaseItems, getLeads, getDevotionals, getLoggedInAdminEmail, getMinistries, getAdmins, checkIsSuperAdmin } from "@/lib/actions";
import { getSuperAdminEmails } from "@/lib/super-admin";
import { redirect } from "next/navigation";
import AdminDashboardClient from "@/components/AdminDashboardClient";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const isAuthed = await checkAdminAuth();
  
  // If not authenticated, force back to login screen
  if (!isAuthed) {
    redirect('/admin');
  }

  const loggedInEmail = await getLoggedInAdminEmail();
  const isSuperAdmin = await checkIsSuperAdmin(loggedInEmail);
  const envSuperAdminEmails = getSuperAdminEmails();

  // Fetch all existing data to manage
  const [schedules, missions, outreaches, events, registrations, settings, sermons, knowledgeBaseItems, leads, devotionals, ministries, admins] = await Promise.all([
    getServiceSchedules(),
    getHaitiMissions(),
    getLocalOutreaches(),
    getEvents(),
    getRegistrations(),
    getSettings(),
    getSermons(),
    getKnowledgeBaseItems(),
    getLeads(),
    getDevotionals(),
    getMinistries(),
    isSuperAdmin ? getAdmins() : Promise.resolve([]),
  ]);

  return (
    <AdminDashboardClient
      schedules={schedules}
      missions={missions}
      outreaches={outreaches}
      events={events}
      registrations={registrations}
      settings={settings}
      sermons={sermons}
      knowledgeBaseItems={knowledgeBaseItems}
      leads={leads}
      initialDevotionals={devotionals}
      isSuperAdmin={isSuperAdmin}
      initialMinistries={ministries}
      initialAdmins={admins}
      envSuperAdminEmails={envSuperAdminEmails}
    />
  );
}
