import { checkAdminAuth, getSettings } from "@/lib/actions";
import { redirect } from "next/navigation";
import AdminLoginClient from "@/components/AdminLoginClient";

export const revalidate = 0;

export default async function AdminLoginPage() {
  const isAuthed = await checkAdminAuth();
  
  // If already authenticated, redirect straight to the admin dashboard
  if (isAuthed) {
    redirect('/admin/dashboard');
  }

  const settings = await getSettings();
  const logoUrl = settings.logo_url || '/logo.png';
  const themePrimary = settings.theme_primary || '#f59e0b';
  const themeHover = settings.theme_hover || '#d97706';
  const themeAccent = settings.theme_accent || '#3b82f6';

  return (
    <AdminLoginClient 
      logoUrl={logoUrl} 
      themePrimary={themePrimary} 
      themeHover={themeHover} 
      themeAccent={themeAccent} 
    />
  );
}
