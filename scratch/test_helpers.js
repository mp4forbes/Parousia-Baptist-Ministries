const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, '../church.db');
const db = new Database(dbPath);

const schedules = db.prepare('SELECT * FROM service_schedules').all();

const parseTimeString = (timeStr) => {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return { hours: 9, minutes: 0 };
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return { hours, minutes };
};

const getNextScheduledService = () => {
  const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date('2026-06-19T01:43:27-04:00'); // simulated local time from request
  
  const defaultSunday = {
    id: -1,
    day_english: 'Sunday',
    day_kreyol: 'Dimanch',
    time: '9:00 AM',
    title_english: 'Sunday Worship Service',
    title_kreyol: 'Sèvis Adorasyon Dimanch'
  };

  if (!schedules || schedules.length === 0) {
    return defaultSunday;
  }

  const candidates = schedules.map(item => {
    const dayLower = item.day_english.toLowerCase().trim();
    let targetDayIndex = daysMap.indexOf(dayLower);
    
    if (targetDayIndex === -1) {
      if (dayLower.startsWith('sun')) targetDayIndex = 0;
      else if (dayLower.startsWith('mon')) targetDayIndex = 1;
      else if (dayLower.startsWith('tue')) targetDayIndex = 2;
      else if (dayLower.startsWith('wed')) targetDayIndex = 3;
      else if (dayLower.startsWith('thu')) targetDayIndex = 4;
      else if (dayLower.startsWith('fri')) targetDayIndex = 5;
      else if (dayLower.startsWith('sat')) targetDayIndex = 6;
    }

    if (targetDayIndex === -1) return null;

    let daysToAdd = (targetDayIndex - now.getDay() + 7) % 7;
    const timeParts = parseTimeString(item.time);
    
    const occurrence = new Date(now);
    occurrence.setHours(timeParts.hours, timeParts.minutes, 0, 0);

    if (daysToAdd === 0 && occurrence.getTime() <= now.getTime()) {
      daysToAdd = 7;
    }
    
    occurrence.setDate(now.getDate() + daysToAdd);
    
    return {
      schedule: item,
      nextDate: occurrence
    };
  }).filter(c => c !== null);

  if (candidates.length === 0) {
    return defaultSunday;
  }

  candidates.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
  return candidates[0].schedule;
};

const getNextSundayService = () => {
  const defaultSunday = {
    id: -1,
    day_english: 'Sunday',
    day_kreyol: 'Dimanch',
    time: '9:00 AM',
    title_english: 'Sunday Worship Service',
    title_kreyol: 'Sèvis Adorasyon Dimanch'
  };

  if (!schedules || schedules.length === 0) {
    return defaultSunday;
  }

  const sundaySchedules = schedules.filter(item => 
    item.day_english.toLowerCase().trim().includes('sunday') || 
    item.day_english.toLowerCase().trim() === 'sun'
  );

  if (sundaySchedules.length === 0) {
    return defaultSunday;
  }

  const now = new Date('2026-06-19T01:43:27-04:00');
  const candidates = sundaySchedules.map(item => {
    const targetDayIndex = 0; // Sunday
    
    let daysToAdd = (targetDayIndex - now.getDay() + 7) % 7;
    const timeParts = parseTimeString(item.time);
    
    const occurrence = new Date(now);
    occurrence.setHours(timeParts.hours, timeParts.minutes, 0, 0);

    if (daysToAdd === 0 && occurrence.getTime() <= now.getTime()) {
      daysToAdd = 7;
    }
    
    occurrence.setDate(now.getDate() + daysToAdd);
    
    return {
      schedule: item,
      nextDate: occurrence
    };
  });

  candidates.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
  return candidates[0].schedule;
};

const s = getNextScheduledService();
console.log('getNextScheduledService():', { id: s.id, day: s.day_english, time: s.time, title: s.title_english });

const sun = getNextSundayService();
console.log('getNextSundayService():', { id: sun.id, day: sun.day_english, time: sun.time, title: sun.title_english });
