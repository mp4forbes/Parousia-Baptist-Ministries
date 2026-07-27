import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";
import { cookies } from "next/headers";
import { Language } from "@/lib/translations";

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
  description: "Eglise Baptiste de la Parousie - Kominote kwayan k'ap sèvi Seyè a epi k'ap tann retou li. Defaulting in Haitian Creole with English fallback.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read saved language from cookies synchronously/asynchronously
  const cookieStore = await cookies();
  const savedLang = cookieStore.get('church_lang')?.value as Language | undefined;
  
  // Validate language preference, default to Haitian Creole ('fr_ht')
  const defaultLanguage: Language = (savedLang === 'fr_ht' || savedLang === 'en') ? savedLang : 'fr_ht';
  
  // Set html element lang to "en" or "ht"
  const htmlLang = defaultLanguage === 'en' ? 'en' : 'ht';

  return (
    <html
      lang={htmlLang}
      className={`${outfit.variable} ${playfair.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-amber-500 selection:text-slate-950">
        <LanguageProvider defaultLanguage={defaultLanguage}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}


