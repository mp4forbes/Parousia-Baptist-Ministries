/**
 * Robust YouTube URL and Parameter Parser for Parousie
 */

export interface YouTubeInfo {
  videoId: string;
  startSeconds: number;
}

/**
 * Parses a YouTube video ID, full URL, or parameter string.
 * Supports:
 * - Raw ID: "HpkIoFCaNhQ"
 * - ID with time: "HpkIoFCaNhQ&t=796s" or "HpkIoFCaNhQ?t=13m16s"
 * - Watch URL: "https://www.youtube.com/watch?v=HpkIoFCaNhQ&t=796s"
 * - Short URL: "https://youtu.be/HpkIoFCaNhQ?t=796s"
 * - Embed URL: "https://www.youtube.com/embed/HpkIoFCaNhQ?start=796"
 */
export function parseYouTubeVideo(input: string): YouTubeInfo {
  if (!input) return { videoId: '', startSeconds: 0 };
  
  let id = input.trim();
  let timeParam: string | null = null;
  
  try {
    // 1. Check if it's a full URL
    if (id.includes('youtube.com/watch')) {
      const urlObj = new URL(id);
      id = urlObj.searchParams.get('v') || id;
      timeParam = urlObj.searchParams.get('t') || urlObj.searchParams.get('start');
    } else if (id.includes('youtu.be/')) {
      // Extract the path after the domain
      const parts = id.split('youtu.be/');
      const afterDomain = parts[1] || '';
      id = afterDomain.split(/[?&]/)[0];
      
      // Parse parameters manually or using a dummy URL
      const dummyUrl = new URL(input.startsWith('http') ? input : `https://${input}`);
      timeParam = dummyUrl.searchParams.get('t') || dummyUrl.searchParams.get('start');
    } else if (id.includes('youtube.com/embed/')) {
      const parts = id.split('youtube.com/embed/');
      const afterEmbed = parts[1] || '';
      id = afterEmbed.split(/[?&]/)[0];
      
      const dummyUrl = new URL(input.startsWith('http') ? input : `https://${input}`);
      timeParam = dummyUrl.searchParams.get('t') || dummyUrl.searchParams.get('start');
    }
  } catch (err) {
    console.error('Error parsing YouTube URL:', err);
  }
  
  // 2. If it's a raw string containing query parameters like HpkIoFCaNhQ&t=796s
  if (id.includes('&') || id.includes('?')) {
    const separator = id.includes('?') ? '?' : '&';
    const parts = id.split(/[?&]/);
    id = parts[0]; // The first part is the ID
    
    // Scan remaining parameters for t or start
    for (const part of parts.slice(1)) {
      if (part.startsWith('t=')) {
        timeParam = part.substring(2);
      } else if (part.startsWith('start=')) {
        timeParam = part.substring(6);
      }
    }
  }

  // 3. Clean and convert the time parameter into seconds
  let startSeconds = 0;
  if (timeParam) {
    const cleanTime = timeParam.toLowerCase().trim();
    
    // Simple numeric formats like "796" or "796s"
    if (/^\d+s?$/.test(cleanTime)) {
      startSeconds = parseInt(cleanTime.replace('s', ''), 10);
    } 
    // Complex format like "13m16s", "1h20m5s", "13m"
    else {
      let totalSeconds = 0;
      const hourMatch = cleanTime.match(/(\d+)h/);
      const minMatch = cleanTime.match(/(\d+)m/);
      const secMatch = cleanTime.match(/(\d+)s/);
      
      if (hourMatch) totalSeconds += parseInt(hourMatch[1], 10) * 3600;
      if (minMatch) totalSeconds += parseInt(minMatch[1], 10) * 60;
      if (secMatch) totalSeconds += parseInt(secMatch[1], 10);
      
      if (totalSeconds > 0) {
        startSeconds = totalSeconds;
      } else {
        // Direct parse fallback
        const parsed = parseInt(cleanTime, 10);
        if (!isNaN(parsed)) startSeconds = parsed;
      }
    }
  }

  return {
    videoId: id,
    startSeconds
  };
}

/**
 * Builds a clean, standard YouTube embed URL with autoplay, start time, and styling options.
 */
export function getYouTubeEmbedUrl(youtubeIdOrUrl: string, autoplay: boolean = false): string {
  const { videoId, startSeconds } = parseYouTubeVideo(youtubeIdOrUrl);
  if (!videoId) return '';
  
  let embedUrl = `https://www.youtube.com/embed/${videoId}`;
  const params: string[] = [];
  
  if (autoplay) {
    params.push('autoplay=1');
  } else {
    params.push('autoplay=0');
  }
  
  params.push('rel=0'); // Don't show related videos from other channels
  
  if (startSeconds > 0) {
    params.push(`start=${startSeconds}`);
  }
  
  return `${embedUrl}?${params.join('&')}`;
}

/**
 * Returns a high-definition or medium-definition thumbnail image URL for YouTube videos.
 * Safely handles strings with embedded parameter lists.
 */
export function getYouTubeThumbnailUrl(youtubeIdOrUrl: string): string {
  const { videoId } = parseYouTubeVideo(youtubeIdOrUrl);
  if (!videoId) return '/logo.png'; // Fallback
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

/**
 * Checks a YouTube channel or video URL to see if it is actively live broadcasting.
 */
export async function getLiveStatusFromYouTube(urlOrIdOrHandle: string): Promise<{ isLive: boolean; videoId: string | null }> {
  try {
    let handle = '@parousiabaptistchurch1438'; // Default fallback channel
    let videoId: string | null = null;
    const input = urlOrIdOrHandle ? urlOrIdOrHandle.trim() : '';
    
    // Parse to see if it is a channel or a video
    if (input.includes('@')) {
      const match = input.match(/(@[a-zA-Z0-9_-]+)/);
      if (match) handle = match[1];
    } else if (input.includes('youtube.com/channel/') || input.includes('youtube.com/c/') || input.includes('youtube.com/user/')) {
      const cleanUrl = input.endsWith('/') ? input.slice(0, -1) : input;
      const liveUrl = `${cleanUrl}/live`;
      return await fetchLivePage(liveUrl);
    } else if (input.length > 0) {
      const { videoId: parsedId } = parseYouTubeVideo(input);
      if (parsedId && parsedId !== 'dQw4w9WgXcQ') {
        videoId = parsedId;
      }
    }

    if (videoId) {
      const liveUrl = `https://www.youtube.com/watch?v=${videoId}`;
      return await fetchLivePage(liveUrl);
    } else {
      const liveUrl = `https://www.youtube.com/${handle}/live`;
      return await fetchLivePage(liveUrl);
    }
  } catch (error) {
    console.error('Error in getLiveStatusFromYouTube:', error);
    return { isLive: false, videoId: null };
  }
}

async function fetchLivePage(url: string): Promise<{ isLive: boolean; videoId: string | null }> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 30 } // Cache for 30 seconds
    });
    
    if (!res.ok) {
      return { isLive: false, videoId: null };
    }
    
    const html = await res.text();
    const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (match) {
      const json = JSON.parse(match[1]);
      const vId = json.videoDetails?.videoId || null;
      const isLiveNow = json.microformat?.playerMicroformatRenderer?.liveBroadcastDetails?.isLiveNow === true;
      const playabilityStatus = json.playabilityStatus?.status;
      
      const isLive = isLiveNow && playabilityStatus === 'OK';
      return { isLive, videoId: isLive ? vId : null };
    }
    
    return { isLive: false, videoId: null };
  } catch (err) {
    console.error('Error fetching live page:', err);
    return { isLive: false, videoId: null };
  }
}

