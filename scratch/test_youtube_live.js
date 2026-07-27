async function test() {
  const url = 'https://www.youtube.com/@parousiabaptistchurch1438/live';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    console.log('Response Status:', res.status);
    console.log('Redirected URL:', res.url);
    const html = await res.text();
    const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (match) {
      const json = JSON.parse(match[1]);
      console.log('VideoDetails exists:', !!json.videoDetails);
      console.log('Video ID:', json.videoDetails?.videoId);
      console.log('IsLiveNow (microformat):', json.microformat?.playerMicroformatRenderer?.liveBroadcastDetails?.isLiveNow);
      console.log('Playability Status:', json.playabilityStatus?.status);
      console.log('IsLiveContent:', json.videoDetails?.isLiveContent);
      console.log('LiveBroadcastDetails:', json.microformat?.playerMicroformatRenderer?.liveBroadcastDetails);
    } else {
      console.log('ytInitialPlayerResponse not found');
    }
  } catch (err) {
    console.error(err);
  }
}
test();
