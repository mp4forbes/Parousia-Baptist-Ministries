import { getLiveStatusFromYouTube } from '../src/lib/youtube';

async function run() {
  const result = await getLiveStatusFromYouTube('https://www.youtube.com/@parousiabaptistchurch1438/streams');
  console.log('Result:', result);
}

run();
