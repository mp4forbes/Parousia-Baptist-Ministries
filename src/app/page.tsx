import { 
  getServiceSchedules, 
  getHaitiMissions, 
  getLocalOutreaches, 
  getEvents, 
  getSettings,
  getSermons,
  getDailyDevotional,
  checkAdminAuth,
  getMinistries
} from "@/lib/actions";
import PublicHome from "@/components/PublicHome";
import { getLiveStatusFromYouTube } from "@/lib/youtube";

// Disable route-level caching to fetch live SQLite database edits on page reload
export const revalidate = 0;

export default async function Home() {
  const todayStr = new Date().toLocaleDateString('sv'); // YYYY-MM-DD
  
  // Fetch all databases records synchronously on the server
  const [schedules, missions, outreaches, events, rawSettings, sermons, dailyDevotional, isAdmin, ministries] = await Promise.all([
    getServiceSchedules(),
    getHaitiMissions(),
    getLocalOutreaches(),
    getEvents(),
    getSettings(),
    getSermons(),
    getDailyDevotional(todayStr),
    checkAdminAuth(),
    getMinistries()
  ]);

  // Clone settings object to allow dynamic modification
  const settings = { ...rawSettings };

  // Double-verify YouTube Live status programmatically if active in settings
  if (settings.live_stream_active === 'true') {
    const liveStatus = await getLiveStatusFromYouTube(settings.live_stream_url);
    if (!liveStatus.isLive) {
      settings.live_stream_active = 'false';
    } else if (liveStatus.videoId) {
      settings.live_stream_url = liveStatus.videoId;
    }
  }

  return (
    <PublicHome
      schedules={schedules}
      missions={missions}
      outreaches={outreaches}
      events={events}
      settings={settings}
      sermons={sermons}
      dailyDevotional={dailyDevotional}
      isAdmin={isAdmin}
      ministries={ministries}
    />
  );
}



