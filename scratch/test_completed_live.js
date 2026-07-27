async function testVideo(videoId) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    const html = await res.text();
    const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (match) {
      const json = JSON.parse(match[1]);
      console.log(`--- Video ID: ${videoId} ---`);
      console.log('Playability Status:', json.playabilityStatus?.status);
      console.log('IsLiveNow (microformat):', json.microformat?.playerMicroformatRenderer?.liveBroadcastDetails?.isLiveNow);
      console.log('IsLiveContent (videoDetails):', json.videoDetails?.isLiveContent);
      console.log('IsLive (videoDetails):', json.videoDetails?.isLive);
      console.log('LiveBroadcastDetails:', json.microformat?.playerMicroformatRenderer?.liveBroadcastDetails);
    } else {
      console.log('ytInitialPlayerResponse not found');
    }
  } catch (err) {
    console.error(err);
  }
}

testVideo('524i-je0xno');
