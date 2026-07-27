import { getSettings, getActiveDevotional } from "@/lib/actions";
import DevotionalViewClient from "@/components/DevotionalViewClient";

// Disable route-level caching to fetch live settings and active devotionals from database
export const revalidate = 0;

export default async function DevotionalPage() {
  const todayStr = new Date().toLocaleDateString('sv'); // YYYY-MM-DD
  
  // Fetch live settings and active approved daily devotional in parallel on the server
  const [settings, devotional] = await Promise.all([
    getSettings(),
    getActiveDevotional(todayStr)
  ]);

  return (
    <DevotionalViewClient 
      devotional={devotional} 
      settings={settings} 
    />
  );
}
