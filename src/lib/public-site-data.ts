import {
  checkAdminAuth,
  getEvents,
  getHaitiMissions,
  getLocalOutreaches,
  getMinistries,
  getServiceSchedules,
  getSermons,
  getSettings,
  getDailyDevotional,
} from '@/lib/actions';
import { getLiveStatusFromYouTube } from '@/lib/youtube';

export async function loadPublicSiteData() {
  const todayStr = new Date().toLocaleDateString('sv');
  const isAdmin = await checkAdminAuth();

  const [schedules, missions, outreaches, events, rawSettings, sermons, dailyDevotional, ministries] =
    await Promise.all([
      getServiceSchedules(),
      getHaitiMissions(),
      getLocalOutreaches(),
      getEvents(),
      getSettings(),
      getSermons(),
      getDailyDevotional(todayStr),
      getMinistries(),
    ]);

  const settings = { ...rawSettings };

  if (settings.live_stream_active === 'true') {
    const liveStatus = await getLiveStatusFromYouTube(settings.live_stream_url);
    if (!liveStatus.isLive) {
      settings.live_stream_active = 'false';
    } else if (liveStatus.videoId) {
      settings.live_stream_url = liveStatus.videoId;
    }
  }

  return {
    schedules,
    missions,
    outreaches,
    events,
    settings,
    sermons,
    dailyDevotional,
    isAdmin,
    ministries,
  };
}
