const fs = require('fs');

async function testWatchPage() {
  const videoId = 'HpkIoFCaNhQ';
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  console.log('Fetching watch page:', url);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    const html = await res.text();
    fs.writeFileSync('scratch/watch.html', html);
    console.log('Saved watch.html, size:', html.length);
    
    // Look for date strings in the page: e.g. "uploadDate":"2021-09-26" or "publishDate":"2021-09-26" or similar
    const dateRegexes = [
      /"uploadDate"\s*:\s*"([^"]+)"/,
      /"publishDate"\s*:\s*"([^"]+)"/,
      /"dateText"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"/,
      /meta\s+itemprop="uploadDate"\s+content="([^"]+)"/i,
      /itemprop="datePublished"\s+content="([^"]+)"/i
    ];
    
    for (let i = 0; i < dateRegexes.length; i++) {
      const match = html.match(dateRegexes[i]);
      if (match) {
        console.log(`Regex ${i} matched:`, match[1]);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

testWatchPage();
