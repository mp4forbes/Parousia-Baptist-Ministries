import { checkAdminAuth, getServiceSchedules, getHaitiMissions, getLocalOutreaches, getEvents, getSettings, getRegistrations, getSermons, getKnowledgeBaseItems, getLeads, getDevotionals, getLoggedInAdminEmail, getMinistries } from "@/lib/actions";
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
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'straightlineaffiliate@gmail.com').toLowerCase().trim();
  const isSuperAdmin = loggedInEmail?.toLowerCase().trim() === superAdminEmail;

  // Fetch all existing data to manage
  const [schedules, missions, outreaches, events, registrations, settings, sermons, knowledgeBaseItems, leads, devotionals, ministries] = await Promise.all([
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
    getMinistries()
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
    />
  );
}
