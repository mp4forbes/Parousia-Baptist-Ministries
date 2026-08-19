import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";
import { AdminUiProvider } from "@/lib/AdminUiContext";
import { CoordinatorSessionProvider } from "@/lib/CoordinatorSessionContext";
import { checkAdminAuth } from "@/lib/actions";
import { getRegistrantAccess } from "@/lib/coordinator-session";
import { cookies } from "next/headers";
import { Language } from "@/lib/translations";
import DevExtensionNoiseFilter from "@/components/DevExtensionNoiseFilter";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Eglise Baptiste de la Parousie",
  description: "Église Baptiste de la Parousie — une communauté de croyants au service du Seigneur, dans l'attente de son retour. Le français est la langue par défaut, avec l'anglais comme seconde langue.",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read saved language from cookies synchronously/asynchronously
  const cookieStore = await cookies();
  const savedLang = cookieStore.get('church_lang')?.value as Language | undefined;
  
  // Validate the language preference, defaulting to French ('fr_ht')
  const defaultLanguage: Language = (savedLang === 'fr_ht' || savedLang === 'en') ? savedLang : 'fr_ht';
  
  // Set the HTML language to English or French
  const htmlLang = defaultLanguage === 'en' ? 'en' : 'fr';
  const isAdmin = await checkAdminAuth();
  const registrantAccess = await getRegistrantAccess();

  return (
    <html
      lang={htmlLang}
      className={`${outfit.variable} ${playfair.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-amber-500 selection:text-slate-950">
        <DevExtensionNoiseFilter />
        <LanguageProvider defaultLanguage={defaultLanguage}>
          <AdminUiProvider initialIsAdmin={isAdmin}>
            <CoordinatorSessionProvider initialAccess={registrantAccess}>
              {children}
            </CoordinatorSessionProvider>
          </AdminUiProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}


