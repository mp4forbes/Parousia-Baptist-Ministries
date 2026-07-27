const fs = require('fs');

async function testExactSync() {
  const channelUrl = 'https://www.youtube.com/@parousiabaptistchurch1438/streams';
  console.log('Fetching channel streams page...');
  try {
    const res = await fetch(channelUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    const html = await res.text();
    
    // Find ytInitialData and parse videos using lockupViewModel
    let jsonStr = '';
    const startStr = 'ytInitialData = ';
    const startIndex = html.indexOf(startStr);
    if (startIndex !== -1) {
      const remaining = html.substring(startIndex + startStr.length);
      let braceCount = 0;
      let inString = false;
      let escape = false;
      let firstBrace = remaining.indexOf('{');
      if (firstBrace !== -1) {
        for (let i = firstBrace; i < remaining.length; i++) {
          const char = remaining[i];
          if (escape) { escape = false; continue; }
          if (char === '\\') { escape = true; continue; }
          if (char === '"') { inString = !inString; continue; }
          if (!inString) {
            if (char === '{') braceCount++;
            else if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                jsonStr = remaining.substring(firstBrace, i + 1);
                break;
              }
            }
          }
        }
      }
    }

    const videos = [];
    if (jsonStr) {
      const parsed = JSON.parse(jsonStr);
      const findLockups = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        if (obj.lockupViewModel) {
          const vm = obj.lockupViewModel;
          const videoId = vm.contentId;
          if (videoId && typeof videoId === 'string' && videoId.length === 11) {
            let title = '';
            if (vm.metadata && vm.metadata.lockupMetadataViewModel && vm.metadata.lockupMetadataViewModel.title) {
              title = vm.metadata.lockupMetadataViewModel.title.content || '';
            }
            if (title && !videos.some(v => v.videoId === videoId)) {
              videos.push({ videoId, title });
            }
          }
        }
        for (const key of Object.keys(obj)) {
          findLockups(obj[key]);
        }
      };
      findLockups(parsed);
    }

    console.log(`Found ${videos.length} videos from streams tab. Fetching exact dates...`);
    
    // Fetch exact dates for the first 5 videos in parallel to verify speed and correctness
    const firstFive = videos.slice(0, 5);
    const enriched = await Promise.all(firstFive.map(async (v) => {
      const watchUrl = `https://www.youtube.com/watch?v=${v.videoId}`;
      try {
        const watchRes = await fetch(watchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        });
        const watchHtml = await watchRes.text();
        const dateMatch = watchHtml.match(/"uploadDate"\s*:\s*"([^"]+)"/) || watchHtml.match(/meta\s+itemprop="uploadDate"\s+content="([^"]+)"/i);
        let exactDate = '';
        if (dateMatch) {
          exactDate = dateMatch[1].split('T')[0];
        }
        return { ...v, exactDate };
      } catch (err) {
        return { ...v, error: err.message };
      }
    }));

    console.log('Enriched videos results:', JSON.stringify(enriched, null, 2));

  } catch (err) {
    console.error(err);
  }
}

testExactSync();
