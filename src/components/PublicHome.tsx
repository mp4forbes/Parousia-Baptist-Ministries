'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAdminUi } from '@/lib/AdminUiContext';
import { ServiceSchedule, HaitiMission, LocalOutreach, EventRecord, Sermon, DailyDevotional, BlogPost, PrayerRequest, Ministry } from '@/lib/db';
import { 
  registerForEvent, 
  simulateOffering, 
  submitLead, 
  getBlogPosts, 
  getPrayerRequests, 
  submitPrayerRequest, 
  submitContactForm,
  markAdminEntryFromSite,
} from '@/lib/actions';
import MinistrySignupForm from '@/components/MinistrySignupForm';
import { setAdminUiClient } from '@/lib/admin-cookies';
import { MinistrySignupSlug } from '@/lib/ministry-signup-fields';
import { parseTeamDepartments, type TeamDepartment, type TeamMember } from '@/lib/team-departments';
import { getYouTubeEmbedUrl, getYouTubeThumbnailUrl } from '@/lib/youtube';
import { 
  Church, 
  Calendar, 
  Heart, 
  Globe2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ChevronRight, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Users, 
  CheckCircle, 
  Gift, 
  CreditCard,
  Lock,
  Menu,
  X,
  Video,
  Play,
  Tv,
  Search,
  Copy,
  ChevronDown,
  CheckCircle2,
  Download,
  RefreshCw,
  FileText,
  Settings,
  Send,
  MessageSquare,
  Eye,
  Plus
} from 'lucide-react';

interface PublicHomeProps {
  schedules: ServiceSchedule[];
  missions: HaitiMission[];
  outreaches: LocalOutreach[];
  events: EventRecord[];
  settings: Record<string, string>;
  sermons: Sermon[];
  dailyDevotional?: DailyDevotional | null;
  isAdmin?: boolean;
  ministries: Ministry[];
}

export default function PublicHome({ 
  schedules, 
  missions, 
  outreaches, 
  events, 
  settings, 
  sermons,
  dailyDevotional,
  isAdmin = false,
  ministries = []
}: PublicHomeProps) {
  const { language, setLanguage, t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const showAdminNav = useAdminUi();

  const openAdminPortal = () => {
    startTransition(async () => {
      setAdminUiClient();
      await markAdminEntryFromSite();
      window.location.href = showAdminNav ? '/admin/dashboard' : '/admin?from=site';
    });
  };

  // Navigation Dropdown & Mobile Accordion states
  const [activeDropdown, setActiveDropdown] = useState<'home' | 'ministries' | null>(null);
  const [mobileHomeExpanded, setMobileHomeExpanded] = useState(false);
  const [mobileMinistriesExpanded, setMobileMinistriesExpanded] = useState(false);

  // Subsection selected tab states
  const [activeAboutTab, setActiveAboutTab] = useState<'aboutUs' | 'beliefs' | 'team' | 'expect'>('aboutUs');
  const [activeMinistryTab, setActiveMinistryTab] = useState<'women' | 'men' | 'children' | 'missions'>('women');

  // Dynamic public database states loaded via client side effects
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);

  // Public Prayer Wall form states
  const [prayerName, setPrayerName] = useState('');
  const [prayerText, setPrayerText] = useState('');
  const [prayerIsAnonymous, setPrayerIsAnonymous] = useState(false);
  const [prayerSubmitting, setPrayerSubmitting] = useState(false);
  const [prayerSuccess, setPrayerSuccess] = useState(false);
  const [prayerError, setPrayerError] = useState('');

  // Public Contact Us form states
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState('');

  // Helper function to scroll to sections smoothly
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Fetch blogs and prayer requests on mount
  useEffect(() => {
    async function loadDynamicContent() {
      try {
        const posts = await getBlogPosts();
        setBlogPosts(posts);
        const prayers = await getPrayerRequests();
        setPrayerRequests(prayers);
      } catch (err) {
        console.error('Failed to load dynamic church website content:', err);
      }
    }
    loadDynamicContent();
  }, []);

  // Public Prayer submission handler
  const handlePrayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerText.trim()) {
      setPrayerError(language === 'fr_ht' ? 'La demande de prière ne peut pas être vide.' : 'Prayer request text cannot be empty.');
      return;
    }
    setPrayerSubmitting(true);
    setPrayerError('');
    setPrayerSuccess(false);

    try {
      const res = await submitPrayerRequest(
        prayerIsAnonymous ? null : prayerName,
        prayerText,
        prayerIsAnonymous
      );
      if (res.success) {
        setPrayerSuccess(true);
        setPrayerName('');
        setPrayerText('');
        setPrayerIsAnonymous(false);
        // Refresh prayer request list
        const updated = await getPrayerRequests();
        setPrayerRequests(updated);
      } else {
        setPrayerError(res.error || (language === 'fr_ht' ? 'Une erreur est survenue. Veuillez réessayer.' : 'Submission failed. Please try again.'));
      }
    } catch (err: any) {
      setPrayerError(err.message || (language === 'fr_ht' ? 'Une erreur est survenue. Veuillez réessayer.' : 'An error occurred. Please try again.'));
    } finally {
      setPrayerSubmitting(false);
    }
  };

  // Public Contact submission handler
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      setContactError(language === 'fr_ht' ? 'Veuillez remplir tous les champs obligatoires.' : 'Please fill out all required fields.');
      return;
    }
    setContactSubmitting(true);
    setContactError('');
    setContactSuccess(false);

    try {
      const res = await submitContactForm(
        contactName,
        contactEmail,
        contactPhone,
        contactMessage
      );
      if (res.success) {
        setContactSuccess(true);
        setContactName('');
        setContactEmail('');
        setContactPhone('');
        setContactMessage('');
      } else {
        setContactError(res.error || (language === 'fr_ht' ? 'Une erreur est survenue. Veuillez réessayer.' : 'An error occurred.'));
      }
    } catch (err: any) {
      setContactError(err.message || (language === 'fr_ht' ? 'Une erreur est survenue. Veuillez réessayer.' : 'An error occurred.'));
    } finally {
      setContactSubmitting(false);
    }
  };

  // Active calendar dropdown menu tracking state
  const [activeCalendarMenu, setActiveCalendarMenu] = useState<{ type: 'schedule' | 'event'; id: number } | null>(null);

  // Devotional language presentation state
  const [devotionalLang, setDevotionalLang] = useState<'kreyol' | 'english' | 'bilingual'>('bilingual');

  // Sync devotionalLang with site language when site language changes
  React.useEffect(() => {
    setDevotionalLang(language === 'fr_ht' ? 'kreyol' : 'english');
  }, [language]);


  React.useEffect(() => {
    const handleOutsideClick = () => {
      setActiveCalendarMenu(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Helper to parse time string like "9:00 AM" or "11:30 PM"
  const parseTimeString = (timeStr: string) => {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return { hours: 9, minutes: 0 };
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return { hours, minutes };
  };

  // Helper to find the next scheduled service dynamically from the schedules prop
  const getNextScheduledService = () => {
    const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const now = new Date();
    
    // Default fallback Sunday Service if no schedules match or schedules are empty
    const defaultSunday = {
      id: -1,
      day_english: 'Sunday',
      day_kreyol: 'Dimanche',
      time: '9:00 AM',
      title_english: 'Sunday Worship Service',
      title_kreyol: 'Culte du dimanche',
      description_english: 'Join us for our main weekly worship service filled with praise, prayer, and an inspiring message.',
      description_kreyol: 'Rejoignez-nous pour notre culte hebdomadaire, un temps de louange, de prière et de message inspirant.'
    };

    if (!schedules || schedules.length === 0) {
      return defaultSunday;
    }

    // Map each schedule to its next occurrence date
    const candidates = schedules.map(item => {
      const dayLower = item.day_english.toLowerCase().trim();
      let targetDayIndex = daysMap.indexOf(dayLower);
      
      // Fallback/normalization for common days
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

      // Get next occurrence of this day of the week
      let daysToAdd = (targetDayIndex - now.getDay() + 7) % 7;
      const timeParts = parseTimeString(item.time);
      
      const occurrence = new Date(now);
      occurrence.setHours(timeParts.hours, timeParts.minutes, 0, 0);

      // If the service is today, check if it is in the past
      if (daysToAdd === 0 && occurrence.getTime() <= now.getTime()) {
        // If already past today, schedule for next week (7 days from now)
        daysToAdd = 7;
      }
      
      occurrence.setDate(now.getDate() + daysToAdd);
      
      return {
        schedule: item,
        nextDate: occurrence
      };
    }).filter(c => c !== null) as { schedule: any; nextDate: Date }[];

    if (candidates.length === 0) {
      const sundayFromSchedules = schedules.find(s => s.day_english.toLowerCase().includes('sun'));
      return sundayFromSchedules || defaultSunday;
    }

    // Sort candidates by chronologically next date
    candidates.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());

    return candidates[0].schedule;
  };

  // Helper to find the next Sunday service specifically for live stream defaults
  const getNextSundayService = () => {
    const defaultSunday = {
      id: -1,
      day_english: 'Sunday',
      day_kreyol: 'Dimanche',
      time: '9:00 AM',
      title_english: 'Sunday Worship Service',
      title_kreyol: 'Culte du dimanche',
      description_english: 'Join us for our main weekly worship service filled with praise, prayer, and an inspiring message.',
      description_kreyol: 'Rejoignez-nous pour notre culte hebdomadaire, un temps de louange, de prière et de message inspirant.'
    };

    if (!schedules || schedules.length === 0) {
      return defaultSunday;
    }

    // Filter schedules to Sunday services
    const sundaySchedules = schedules.filter(item => 
      item.day_english.toLowerCase().trim().includes('sunday') || 
      item.day_english.toLowerCase().trim() === 'sun'
    );

    if (sundaySchedules.length === 0) {
      return defaultSunday;
    }

    const now = new Date();
    const candidates = sundaySchedules.map(item => {
      const targetDayIndex = 0; // Sunday
      
      let daysToAdd = (targetDayIndex - now.getDay() + 7) % 7;
      const timeParts = parseTimeString(item.time);
      
      const occurrence = new Date(now);
      occurrence.setHours(timeParts.hours, timeParts.minutes, 0, 0);

      // If Sunday and already in past today, add 7 days
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

  // Helper to find the next scheduled service specifically configured for live stream
  const getNextLiveStreamService = () => {
    const defaultSunday = {
      id: -1,
      day_english: 'Sunday',
      day_kreyol: 'Dimanche',
      time: '9:00 AM',
      title_english: 'Sunday Worship Service',
      title_kreyol: 'Culte du dimanche',
      description_english: 'Join us for our main weekly worship service filled with praise, prayer, and an inspiring message.',
      description_kreyol: 'Rejoignez-nous pour notre culte hebdomadaire, un temps de louange, de prière et de message inspirant.',
      image_url: '',
      is_livestreamed: 1
    };

    if (!schedules || schedules.length === 0) {
      return defaultSunday;
    }

    // Filter schedules to those set for live-stream
    const liveSchedules = schedules.filter(item => item.is_livestreamed === 1);

    if (liveSchedules.length === 0) {
      // Fallback: if none are specifically marked, default to Sunday service from the database schedules list
      const sundayFromSchedules = schedules.find(s => 
        s.day_english.toLowerCase().includes('sun') || 
        s.day_kreyol.toLowerCase().includes('dim')
      );
      return sundayFromSchedules || defaultSunday;
    }

    const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const now = new Date();

    const candidates = liveSchedules.map(item => {
      const dayLower = item.day_english.toLowerCase().trim();
      let targetDayIndex = daysMap.indexOf(dayLower);
      
      // Fallback/normalization for common days
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

      // Get next occurrence of this day of the week
      let daysToAdd = (targetDayIndex - now.getDay() + 7) % 7;
      const timeParts = parseTimeString(item.time);
      
      const occurrence = new Date(now);
      occurrence.setHours(timeParts.hours, timeParts.minutes, 0, 0);

      // If the service is today, check if it is in the past
      if (daysToAdd === 0 && occurrence.getTime() <= now.getTime()) {
        // If already past today, schedule for next week (7 days from now)
        daysToAdd = 7;
      }
      
      occurrence.setDate(now.getDate() + daysToAdd);
      
      return {
        schedule: item,
        nextDate: occurrence
      };
    }).filter(c => c !== null) as { schedule: any; nextDate: Date }[];

    if (candidates.length === 0) {
      const sundayFromSchedules = schedules.find(s => 
        s.day_english.toLowerCase().includes('sun') || 
        s.day_kreyol.toLowerCase().includes('dim')
      );
      return sundayFromSchedules || defaultSunday;
    }

    // Sort candidates by chronologically next date
    candidates.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());

    return candidates[0].schedule;
  };

  // Helper to get next occurrence of a given day name (e.g. "Sunday")
  const getNextDayOfWeek = (dayName: string) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date();
    const todayDay = today.getDay();
    const targetDay = days.indexOf(dayName.toLowerCase());
    if (targetDay === -1) return today;
    
    let daysToAdd = (targetDay - todayDay + 7) % 7;
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);
    return nextDate;
  };

  // Helper to map English day names to iCal day abbreviations
  const mapDayToIcal = (dayName: string): string => {
    const map: Record<string, string> = {
      sunday: 'SU',
      monday: 'MO',
      tuesday: 'TU',
      wednesday: 'WE',
      thursday: 'TH',
      friday: 'FR',
      saturday: 'SA'
    };
    return map[dayName.toLowerCase()] || 'SU';
  };

  // Helper to format Date as iCal timestamp UTC
  const formatIcalDateUtc = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const handleAddToGoogleCalendar = (
    title: string,
    description: string,
    location: string,
    startDate: Date,
    endDate: Date,
    isRecurring: boolean,
    dayName?: string
  ) => {
    const startFmt = formatIcalDateUtc(startDate);
    const endFmt = formatIcalDateUtc(endDate);
    let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startFmt}/${endFmt}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
    if (isRecurring && dayName) {
      const dayAbbr = mapDayToIcal(dayName);
      url += `&recur=RRULE:FREQ=WEEKLY;BYDAY=${dayAbbr}`;
    }
    window.open(url, '_blank');
  };

  const handleDownloadIcsFile = (
    title: string,
    description: string,
    location: string,
    startDate: Date,
    endDate: Date,
    isRecurring: boolean,
    dayName?: string
  ) => {
    const startFmt = formatIcalDateUtc(startDate);
    const endFmt = formatIcalDateUtc(endDate);
    const stampFmt = formatIcalDateUtc(new Date());
    const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}@eglizparousie.org`;

    let rruleLine = '';
    if (isRecurring && dayName) {
      const dayAbbr = mapDayToIcal(dayName);
      rruleLine = `\nRRULE:FREQ=WEEKLY;BYDAY=${dayAbbr}`;
    }

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${stampFmt}`,
      `DTSTART:${startFmt}`,
      `DTEND:${endFmt}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
      `LOCATION:${location}`,
      rruleLine,
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sermons and live-streaming state
  const [sermonSearch, setSermonSearch] = useState('');
  const [selectedSermonVideo, setSelectedSermonVideo] = useState<Sermon | null>(null);

  const filteredSermons = sermons.filter(sermon => {
    const term = sermonSearch.toLowerCase();
    const title = (language === 'fr_ht' ? sermon.title_kreyol : sermon.title_english).toLowerCase();
    const speaker = sermon.speaker.toLowerCase();
    const desc = (language === 'fr_ht' ? (sermon.description_kreyol || '') : (sermon.description_english || '')).toLowerCase();
    return title.includes(term) || speaker.includes(term) || desc.includes(term);
  });

  // Event Registration Modal states
  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regNotes, setRegNotes] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);
  const [regError, setRegError] = useState('');

  // Giving module states
  const [giveAmount, setRegGiveAmount] = useState('50');
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [giveFund, setGiveFund] = useState('General Fund');
  const [giveFreq, setGiveFreq] = useState('once');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCVC] = useState('');
  const [activeGivingTab, setActiveGivingTab] = useState<'zelle' | 'cashapp' | 'venmo' | 'applepay' | 'check'>('zelle');
  const [givingSuccess, setGivingSuccess] = useState(false);
  const [givingTxId, setGivingTxId] = useState('');
  const [givingLoading, setGivingLoading] = useState(false);
  const [copiedName, setCopiedName] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedCashapp, setCopiedCashapp] = useState(false);
  const [copiedVenmo, setCopiedVenmo] = useState(false);
  const [copiedApplePay, setCopiedApplePay] = useState(false);
  const [copiedPayableTo, setCopiedPayableTo] = useState(false);
  const [copiedMailingAddress, setCopiedMailingAddress] = useState(false);

  // Lead Capture State
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadError, setLeadError] = useState('');

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadEmail || !leadPhone) {
      setLeadError(language === 'fr_ht' ? 'Veuillez remplir tous les champs.' : 'Please fill out all fields.');
      return;
    }
    
    setLeadSubmitting(true);
    setLeadError('');
    
    try {
      const res = await submitLead(leadName, leadEmail, leadPhone);
      if (res.success) {
        setLeadSubmitted(true);
        setLeadName('');
        setLeadEmail('');
        setLeadPhone('');
      } else {
        setLeadError(res.error || (language === 'fr_ht' ? 'Une erreur est survenue. Veuillez réessayer.' : 'An error occurred. Please try again.'));
      }
    } catch (err: any) {
      setLeadError(err.message || (language === 'fr_ht' ? 'Une erreur est survenue. Veuillez réessayer.' : 'An error occurred. Please try again.'));
    } finally {
      setLeadSubmitting(false);
    }
  };

  const handleGiftDownloadClick = () => {
    // Smoothly scroll back to the top/home section of the page
    setTimeout(() => {
      const element = document.getElementById('home');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      
      // Reset subscriber form state after the scroll finishes
      setTimeout(() => {
        setLeadSubmitted(false);
      }, 1000);
    }, 1500); // 1.5s delay allows download to trigger and user to see click feedback
  };

  const handleCopy = (text: string, type: 'name' | 'phone' | 'cashapp' | 'venmo' | 'applepay' | 'payableto' | 'mailaddr') => {
    navigator.clipboard.writeText(text);
    if (type === 'name') {
      setCopiedName(true);
      setTimeout(() => setCopiedName(false), 2000);
    } else if (type === 'phone') {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } else if (type === 'cashapp') {
      setCopiedCashapp(true);
      setTimeout(() => setCopiedCashapp(false), 2000);
    } else if (type === 'venmo') {
      setCopiedVenmo(true);
      setTimeout(() => setCopiedVenmo(false), 2000);
    } else if (type === 'applepay') {
      setCopiedApplePay(true);
      setTimeout(() => setCopiedApplePay(false), 2000);
    } else if (type === 'payableto') {
      setCopiedPayableTo(true);
      setTimeout(() => setCopiedPayableTo(false), 2000);
    } else if (type === 'mailaddr') {
      setCopiedMailingAddress(true);
      setTimeout(() => setCopiedMailingAddress(false), 2000);
    }
  };

  // Toggle Language Handler
  const toggleLanguage = () => {
    setLanguage(language === 'fr_ht' ? 'en' : 'fr_ht');
  };

  // Event Registration Submit Handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    
    setRegError('');
    startTransition(async () => {
      const res = await registerForEvent(selectedEvent.id, regName, regEmail, regPhone, regNotes);
      if (res.success) {
        setRegSuccess(true);
        // Reset form
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        setRegNotes('');
      } else {
        setRegError(res.error || 'Failed to submit registration');
      }
    });
  };

  // Giving Form Submit Handler
  const handleGivingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGivingLoading(true);
    
    const finalAmount = isCustomAmount ? parseFloat(customAmount) : parseFloat(giveAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      alert(language === 'fr_ht' ? 'Veuillez saisir un montant valide.' : 'Please enter a valid amount.');
      setGivingLoading(false);
      return;
    }

    try {
      const res = await simulateOffering(finalAmount, giveFund, giveFreq, cardName);
      if (res.success) {
        setGivingTxId(res.txId || 'TX-SUCCESS');
        setGivingSuccess(true);
        // Reset giving fields
        setCardName('');
        setCardNumber('');
        setCardExpiry('');
        setCardCVC('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGivingLoading(false);
    }
  };

  const logoUrl = settings.logo_url || '/logo.png';
  const heroBgUrl =
    settings.home_background_url ||
    'https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=1920&auto=format&fit=crop';
  const hasCustomHeroArt = Boolean(settings.home_background_url?.trim());
  /** Matches the off-white in the custom hero artwork so logo and page blend */
  const heroArtBg = '#ebebeb';
  const themePrimary = settings.theme_primary || '#f59e0b';
  const themeHover = settings.theme_hover || '#d97706';
  const themeAccent = settings.theme_accent || '#3b82f6';
  const themeMode = settings.theme_mode || 'dark';
  const isLight = themeMode === 'light';
  
  const heroBgOpacityLight = Number(settings.hero_bg_opacity_light || '15') / 100;
  const heroBgOpacityDark = Number(settings.hero_bg_opacity_dark || '25') / 100;
  const heroBgOpacity = isLight ? heroBgOpacityLight : heroBgOpacityDark;
  const softenHeroTextBg = settings.soften_hero_text_bg !== 'false';

  const isHt = language === 'fr_ht';

  // Dynamic Home Tabs titles/content
  const dAboutUsTitle = isHt 
    ? (settings.about_us_title_ht || t.tabAboutUs || 'Qui sommes-nous ?')
    : (settings.about_us_title_en || t.tabAboutUs || 'About Us');

  const dBeliefsTitle = isHt 
    ? (settings.beliefs_title_ht || t.tabBeliefs || 'Nos croyances')
    : (settings.beliefs_title_en || t.tabBeliefs || 'Our Beliefs');

  const dTeamTitle = isHt 
    ? (settings.team_title_ht || 'Notre équipe')
    : (settings.team_title_en || 'Our Team');

  const dTeamSubtitle = isHt
    ? (settings.team_subtitle_ht || 'Départements et associations')
    : (settings.team_subtitle_en || 'Departments & Associations');

  const teamDepartments: TeamDepartment[] = parseTeamDepartments(settings);

  const dExpectTitle = isHt 
    ? (settings.expect_title_ht || t.tabExpect || 'À quoi vous attendre')
    : (settings.expect_title_en || t.tabExpect || 'What to Expect');

  // Dynamic Theme Classes
  const bgMain = isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100';
  const bgHeader = isLight ? 'bg-white/90 border-slate-200' : 'bg-slate-950/80 border-slate-900';
  const bgCard = isLight ? 'bg-white border border-slate-200/80 shadow-md shadow-slate-100' : 'bg-slate-900 border border-slate-800 shadow-xl shadow-black/20';
  const bgCardAlt = isLight ? 'bg-slate-100/50 border border-slate-200/80' : 'bg-slate-900/40 border border-slate-800';
  const bgCardAltNested = isLight ? 'bg-slate-50 border border-slate-200/80' : 'bg-slate-950 border border-slate-850';
  const bgCardNested = isLight ? 'bg-slate-50/50 border border-slate-200' : 'bg-slate-950/80 border border-slate-850';
  const bgInput = isLight ? 'bg-slate-50 border border-slate-250 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500/10' : 'bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/10';
  const bgInputAlt = isLight ? 'bg-white border border-slate-250 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/10' : 'bg-slate-900 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/10';
  const borderMain = isLight ? 'border-slate-200' : 'border-slate-900';
  const borderDivider = isLight ? 'border-slate-200' : 'border-slate-800';
  const borderCard = isLight ? 'border-slate-200/80' : 'border-slate-850';
  const textTitle = isLight ? 'text-slate-900' : 'text-white';
  const textBody = isLight ? 'text-slate-700' : 'text-slate-300';
  const textMuted = isLight ? 'text-slate-500' : 'text-slate-400';
  const textNav = isLight ? 'text-slate-600 hover:text-amber-600' : 'text-slate-300 hover:text-amber-400';
  const textTitleWhiteGrad = isLight ? 'text-slate-900' : 'bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-amber-400';
  const textHeroMuted = isLight ? 'text-slate-800' : 'text-slate-300';
  const bgFooter = isLight ? 'bg-slate-100 border-slate-200/60 text-slate-600' : 'bg-slate-950 border-slate-900 text-slate-400';
  const bgHeroOverlay = isLight ? 'bg-gradient-to-b from-slate-100/10 via-slate-100/30 to-slate-50' : 'bg-gradient-to-b from-slate-950/45 via-slate-950/70 to-slate-950';

  return (
    <div className={`flex flex-col min-h-screen ${bgMain} font-sans selection:bg-amber-500 selection:text-slate-950`}>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --primary-color: ${themePrimary};
          --primary-hover: ${themeHover};
          --accent-color: ${themeAccent};
          --background: ${isLight ? '#f8fafc' : '#090d16'};
          --foreground: ${isLight ? '#0f172a' : '#f8fafc'};
        }
      `}} />
      
      {/* 1. FLOATING NAVIGATION HEADER */}
      <header className={`sticky top-0 z-50 ${bgHeader} backdrop-blur-md border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Brand */}
          <a 
            href="#home" 
            onClick={(e) => { e.preventDefault(); scrollToSection('home'); }} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className={`relative flex items-center justify-center w-12 h-12 rounded-xl bg-white border ${isLight ? 'border-slate-200' : 'border-slate-800'} overflow-hidden shadow-lg shadow-blue-500/10 p-0.5 group-hover:scale-105 transition-transform duration-300`}>
              <img src={logoUrl} alt="Eglise Baptiste de la Parousie Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className={`text-lg md:text-xl font-bold font-serif ${isLight ? 'text-slate-900 group-hover:text-amber-600' : 'bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-amber-400 group-hover:from-amber-400 group-hover:to-amber-500'} leading-tight transition-all duration-300`}>
                {t.churchName}
              </h1>
              <p className={`text-xs ${isLight ? 'text-slate-500 font-semibold' : 'text-slate-400'} hidden sm:block font-medium`}>
                1 Th 4:16-17
              </p>
            </div>
          </a>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-7">
            {/* Home Dropdown */}
            <div 
              className="relative group py-2"
              onMouseEnter={() => setActiveDropdown('home')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button 
                onClick={() => scrollToSection('home')}
                className={`flex items-center gap-1 text-sm font-semibold transition-colors cursor-pointer ${textNav}`}
              >
                <span>{t.navHome}</span>
                <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180 duration-300" />
              </button>
              <div className={`absolute top-full left-0 w-56 rounded-xl border ${isLight ? 'bg-white border-slate-200 shadow-xl' : 'bg-slate-900 border-slate-800 shadow-2xl shadow-black/50'} py-2 transition-all duration-300 ${activeDropdown === 'home' ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                <button onClick={() => { setActiveAboutTab('aboutUs'); scrollToSection('about'); }} className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-amber-500/10 ${textNav} block transition-colors cursor-pointer`}>{dAboutUsTitle}</button>
                <button onClick={() => { setActiveAboutTab('beliefs'); scrollToSection('about'); }} className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-amber-500/10 ${textNav} block transition-colors cursor-pointer`}>{dBeliefsTitle}</button>
                <button onClick={() => { setActiveAboutTab('team'); scrollToSection('about'); }} className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-amber-500/10 ${textNav} block transition-colors cursor-pointer`}>{dTeamTitle}</button>
                <button onClick={() => { setActiveAboutTab('expect'); scrollToSection('about'); }} className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-amber-500/10 ${textNav} block transition-colors cursor-pointer`}>{dExpectTitle}</button>
              </div>
            </div>

            <a href="#schedules" className={`text-sm font-semibold transition-colors ${textNav}`}>{t.navSchedules}</a>
            <a href="#sermons" className={`text-sm font-semibold transition-colors ${textNav}`}>{t.navSermons}</a>
            <a href="#blog" className={`text-sm font-semibold transition-colors ${textNav}`}>{t.navBlog}</a>

            {/* Ministries Dropdown */}
            <div 
              className="relative group py-2"
              onMouseEnter={() => setActiveDropdown('ministries')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className={`flex items-center gap-1 text-sm font-semibold transition-colors cursor-pointer ${textNav}`}>
                <span>{t.navMinistries}</span>
                <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180 duration-300" />
              </button>
              <div className={`absolute top-full left-0 w-56 rounded-xl border ${isLight ? 'bg-white border-slate-200 shadow-xl' : 'bg-slate-900 border-slate-800 shadow-2xl shadow-black/50'} py-2 transition-all duration-300 ${activeDropdown === 'ministries' ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                <button onClick={() => { setActiveMinistryTab('women'); scrollToSection('ministries'); }} className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-amber-500/10 ${textNav} block transition-colors cursor-pointer`}>{t.ministryWomen}</button>
                <button onClick={() => { setActiveMinistryTab('men'); scrollToSection('ministries'); }} className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-amber-500/10 ${textNav} block transition-colors cursor-pointer`}>{t.ministryMen}</button>
                <button onClick={() => { setActiveMinistryTab('children'); scrollToSection('ministries'); }} className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-amber-500/10 ${textNav} block transition-colors cursor-pointer`}>{t.ministryChildren}</button>
                <button onClick={() => { setActiveMinistryTab('missions'); scrollToSection('ministries'); }} className={`w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-amber-500/10 ${textNav} block transition-colors cursor-pointer`}>{t.ministryMissions}</button>
              </div>
            </div>

            <a href="#events" className={`text-sm font-semibold transition-colors ${textNav}`}>{t.navEvents}</a>
            <a href="#giving" className={`text-sm font-semibold transition-colors ${textNav}`}>{t.navGiving}</a>
          </nav>

          {/* Desktop Right Panel */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Language Switcher */}
            <button 
              onClick={toggleLanguage}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-400'} border text-sm font-semibold transition-all duration-300 cursor-pointer hover:scale-105`}
            >
              <Globe2 className="w-4 h-4" />
              <span>{language === 'fr_ht' ? 'English' : 'Français'}</span>
            </button>
            
            {/* Config Gear Icon - Only visible to admin logins */}
            {showAdminNav && (
              <button
                type="button"
                onClick={openAdminPortal}
                title={t.navAdmin}
                className={`flex items-center justify-center p-2 rounded-lg ${isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'} border transition-all duration-300 cursor-pointer hover:scale-105`}
              >
                <Settings className="w-5 h-5 text-blue-500 animate-[spin_8s_linear_infinite]" />
              </button>
            )}

            {/* Contact Us CTA Button */}
            <a 
              href="#contact" 
              onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-105 transition-all duration-300"
            >
              {t.contactTitle}
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex lg:hidden items-center gap-2">
            {showAdminNav && (
              <button
                type="button"
                onClick={openAdminPortal}
                title={t.navAdmin}
                className={`flex items-center justify-center p-2 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'}`}
              >
                <Settings className="w-5 h-5 text-blue-500" />
              </button>
            )}
            <button 
              onClick={toggleLanguage}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-amber-400'} text-xs font-semibold cursor-pointer`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>{language === 'fr_ht' ? 'EN' : 'FR'}</span>
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'}`}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className={`lg:hidden fixed inset-0 top-20 z-40 ${isLight ? 'bg-white/95' : 'bg-slate-950/95'} backdrop-blur-lg border-t ${borderMain} flex flex-col p-6 overflow-y-auto animate-fade-in`}>
          <nav className={`flex flex-col gap-5 text-lg font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            
            {/* Mobile Home Accordion */}
            <div>
              <button 
                onClick={() => { setMobileHomeExpanded(!mobileHomeExpanded); scrollToSection('home'); }}
                className="w-full flex items-center justify-between hover:text-amber-500 transition-colors py-1 cursor-pointer"
              >
                <span>{t.navHome}</span>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${mobileHomeExpanded ? 'rotate-180' : ''}`} />
              </button>
              <div className={`pl-4 flex flex-col gap-3 overflow-hidden transition-all duration-300 ${mobileHomeExpanded ? 'max-h-56 mt-3 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                <button onClick={() => { setActiveAboutTab('aboutUs'); scrollToSection('about'); setMobileMenuOpen(false); }} className="text-left text-base font-semibold hover:text-amber-500 transition-colors cursor-pointer">{dAboutUsTitle}</button>
                <button onClick={() => { setActiveAboutTab('beliefs'); scrollToSection('about'); setMobileMenuOpen(false); }} className="text-left text-base font-semibold hover:text-amber-500 transition-colors cursor-pointer">{dBeliefsTitle}</button>
                <button onClick={() => { setActiveAboutTab('team'); scrollToSection('about'); setMobileMenuOpen(false); }} className="text-left text-base font-semibold hover:text-amber-500 transition-colors cursor-pointer">{dTeamTitle}</button>
                <button onClick={() => { setActiveAboutTab('expect'); scrollToSection('about'); setMobileMenuOpen(false); }} className="text-left text-base font-semibold hover:text-amber-500 transition-colors cursor-pointer">{dExpectTitle}</button>
              </div>
            </div>

            <a href="#schedules" onClick={() => setMobileMenuOpen(false)} className="hover:text-amber-500 transition-colors">{t.navSchedules}</a>
            <a href="#sermons" onClick={() => setMobileMenuOpen(false)} className="hover:text-amber-500 transition-colors">{t.navSermons}</a>
            <a href="#blog" onClick={() => setMobileMenuOpen(false)} className="hover:text-amber-500 transition-colors">{t.navBlog}</a>

            {/* Mobile Ministries Accordion */}
            <div>
              <button 
                onClick={() => setMobileMinistriesExpanded(!mobileMinistriesExpanded)}
                className="w-full flex items-center justify-between hover:text-amber-500 transition-colors py-1 cursor-pointer"
              >
                <span>{t.navMinistries}</span>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${mobileMinistriesExpanded ? 'rotate-180' : ''}`} />
              </button>
              <div className={`pl-4 flex flex-col gap-3 overflow-hidden transition-all duration-300 ${mobileMinistriesExpanded ? 'max-h-56 mt-3 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                <button onClick={() => { setActiveMinistryTab('women'); scrollToSection('ministries'); setMobileMenuOpen(false); }} className="text-left text-base font-semibold hover:text-amber-500 transition-colors cursor-pointer">{t.ministryWomen}</button>
                <button onClick={() => { setActiveMinistryTab('men'); scrollToSection('ministries'); setMobileMenuOpen(false); }} className="text-left text-base font-semibold hover:text-amber-500 transition-colors cursor-pointer">{t.ministryMen}</button>
                <button onClick={() => { setActiveMinistryTab('children'); scrollToSection('ministries'); setMobileMenuOpen(false); }} className="text-left text-base font-semibold hover:text-amber-500 transition-colors cursor-pointer">{t.ministryChildren}</button>
                <button onClick={() => { setActiveMinistryTab('missions'); scrollToSection('ministries'); setMobileMenuOpen(false); }} className="text-left text-base font-semibold hover:text-amber-500 transition-colors cursor-pointer">{t.ministryMissions}</button>
              </div>
            </div>

            <a href="#events" onClick={() => setMobileMenuOpen(false)} className="hover:text-amber-500 transition-colors">{t.navEvents}</a>
            <a href="#giving" onClick={() => setMobileMenuOpen(false)} className="hover:text-amber-500 transition-colors">{t.navGiving}</a>

            {/* Settings Link - Only visible to admins */}
            {showAdminNav && (
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); openAdminPortal(); }}
                className="hover:text-amber-500 transition-colors flex items-center gap-2 text-blue-500 text-left cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>{t.navAdmin}</span>
              </button>
            )}
          </nav>
          <div className={`mt-8 pt-8 border-t ${borderMain} flex flex-col gap-4`}>
            <a 
              href="#contact" 
              onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); scrollToSection('contact'); }} 
              className="w-full text-center py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
            >
              {t.contactTitle}
            </a>
          </div>
        </div>
      )}

      {/* 2. HERO SECTION */}
      <section
        id="home"
        className="relative min-h-[90vh] flex items-center justify-center py-24 overflow-hidden"
        style={hasCustomHeroArt && isLight ? { backgroundColor: heroArtBg } : undefined}
      >
        <div className="absolute inset-0 pointer-events-none">
          {hasCustomHeroArt && isLight ? (
            /* Florals only — masked so the logo in the image file does not bleed through */
            <img
              src={heroBgUrl}
              alt=""
              aria-hidden="true"
              className="absolute bottom-0 left-0 w-full h-[50%] object-cover object-bottom"
              style={{
                opacity: heroBgOpacity,
                maskImage: 'linear-gradient(to top, black 55%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to top, black 55%, transparent 100%)',
              }}
            />
          ) : (
            <>
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
                <div className={`absolute inset-0 bg-[linear-gradient(to_right,#020617_1px,transparent_1px),linear-gradient(to_bottom,#020617_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 ${isLight ? 'invert' : ''}`} />
                <img
                  src={heroBgUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  style={{ opacity: heroBgOpacity }}
                />
                <div className={`absolute inset-0 ${bgHeroOverlay}`} />
              </div>
            </>
          )}
        </div>

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          
          <div className={`w-full max-w-4xl rounded-3xl ${
            softenHeroTextBg && !(hasCustomHeroArt && isLight)
              ? `${isLight ? 'bg-white border-slate-200/80 shadow-xl shadow-slate-200/40' : 'bg-slate-950/70 border-slate-900/50 shadow-2xl shadow-black/50'} border backdrop-blur-md p-8 md:p-12`
              : 'bg-transparent border-transparent shadow-none p-4 md:p-6'
          } mb-10 flex flex-col items-center transition-all duration-500 animate-fade-in`}>
            
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${isLight ? 'bg-slate-200/80 text-amber-800' : 'bg-slate-900 text-amber-400'} text-xs font-semibold mb-6`}>
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>{language === 'fr_ht' ? 'Parousie — Car il revient' : 'Parousie - For He Is Returning'}</span>
            </div>

            {/* Uploaded logo — multiply removes the white PNG box on the matching hero background */}
            <div
              className="mb-6 flex w-full justify-center"
              style={hasCustomHeroArt && isLight ? { backgroundColor: heroArtBg } : undefined}
            >
              <img
                src={logoUrl}
                alt="Église Baptiste Parousie"
                className={`h-32 sm:h-40 md:h-48 w-auto max-w-[min(100%,400px)] object-contain ${
                  hasCustomHeroArt && isLight ? 'mix-blend-multiply' : ''
                }`}
              />
            </div>

            <h2 className={`text-4xl sm:text-5xl md:text-6xl font-extrabold font-serif tracking-tight mb-4 max-w-4xl leading-tight text-center ${textTitle}`}>
              {language === 'fr_ht' ? (
                <>
                  <span>Ministères baptistes </span>
                  <span className="text-blue-500">Parousia</span>
                </>
              ) : (
                <>
                  <span>Parousia Baptist </span>
                  <span className="text-blue-500">Ministries</span>
                </>
              )}
            </h2>

            <p className={`text-base md:text-lg ${isLight ? 'text-slate-600' : 'text-slate-300'} font-normal max-w-2xl leading-relaxed mb-0`}>
              &ldquo;{t.churchTagline}&rdquo;
            </p>
          </div>
          {/* SCRIPTURE VERSE BLOCK (GLASSMORPHISM) WITH DAILY DEVOTIONAL LINK */}
          <div className={`w-full max-w-3xl rounded-2xl ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-800'} border p-6 md:p-8 mb-12 shadow-2xl relative overflow-hidden group hover:border-amber-500/20 transition-all duration-350`}>
            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-500 to-blue-600" />
            <BookOpen className={`absolute right-6 bottom-6 w-24 h-24 ${isLight ? 'text-slate-200/30' : 'text-slate-800/10'} -rotate-12 select-none pointer-events-none transition-transform group-hover:scale-105 duration-500`} />
            
            <p className={`text-base md:text-lg ${isLight ? 'text-slate-800' : 'text-slate-200'} font-normal leading-relaxed mb-6 text-left font-serif`}>
              {t.verseText}
            </p>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t border-slate-200/20 dark:border-slate-800/20 pt-4">
              <a 
                href="/devotional" 
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-300 cursor-pointer ${
                  isLight 
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/25 hover:scale-105' 
                    : 'bg-amber-500/10 hover:bg-amber-500 border border-amber-500/20 hover:border-amber-500 text-amber-400 hover:text-slate-950 shadow-md shadow-amber-500/5 hover:scale-105'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>{language === 'fr_ht' ? 'Verset du jour' : 'Daily Verse'}</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </a>

              <span className={`inline-block px-3 py-1.5 rounded-md ${isLight ? 'bg-slate-100 border-slate-200 text-amber-800' : 'bg-slate-950 border-slate-800 text-amber-400'} border text-xs font-bold uppercase tracking-wider font-sans self-end sm:self-auto`}>
                {t.verseRef}
              </span>
            </div>
          </div>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <a 
              href="#schedules" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:scale-105 transition-all duration-300"
            >
              <span>{t.navSchedules}</span>
              <ArrowRight className="w-5 h-5" />
            </a>
            <a 
              href="#giving" 
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl ${isLight ? 'bg-white border-slate-250 hover:bg-slate-150 text-slate-800' : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200'} border font-bold hover:scale-105 transition-all duration-300`}
            >
              <span>{t.navGiving}</span>
            </a>
            <a 
              href="/free-gift" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20 hover:scale-105 hover:shadow-amber-500/40 transition-all duration-300 cursor-pointer"
            >
              <Gift className="w-5 h-5 animate-bounce" />
              <span>
                {language === 'fr_ht' 
                  ? (settings.free_gift_title_kreyol || 'Méditations offertes')
                  : (settings.free_gift_title_english || 'Free Devotional')}
              </span>
            </a>
          </div>

        </div>
      </section>

      {/* 3. SERVICE SCHEDULES SECTION (LÈ SÈVIS) */}
      <section id="schedules" className={`py-24 ${isLight ? 'bg-slate-100/60' : 'bg-slate-950'} border-t ${borderMain} relative`}>
        <div className="absolute top-0 right-10 w-72 h-72 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">{language === 'fr_ht' ? 'Horaires des cultes' : 'Service Times'}</h3>
            <h4 className={`text-3xl sm:text-4xl font-extrabold font-serif ${textTitle} mb-4`}>{t.servicesTitle}</h4>
            <p className={`${textMuted} text-base`}>{t.servicesSubtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {schedules.map((schedule, index) => (
              <div 
                key={schedule.id || index} 
                className={`group relative rounded-2xl ${bgCard} hover:border-blue-500/50 p-6 md:p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-900/10 flex flex-col justify-between overflow-hidden`}
              >
                {/* Accent glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div>
                  {/* Card Header */}
                  {schedule.image_url ? (
                    <div className="relative h-44 w-full rounded-xl overflow-hidden mb-6 border border-slate-800/40 shadow-md">
                      <img 
                        src={schedule.image_url} 
                        alt={language === 'fr_ht' ? schedule.title_kreyol : schedule.title_english} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none" />
                      <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full ${isLight ? 'bg-slate-100 border-slate-200 text-amber-800' : 'bg-slate-950 border-slate-800 text-amber-400'} text-[10px] font-bold shadow-md`}>
                        {language === 'fr_ht' ? schedule.day_kreyol : schedule.day_english}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start mb-6">
                      <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/10 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                        <Clock className="w-5 h-5" />
                      </span>
                      <span className={`px-3 py-1 rounded-full ${isLight ? 'bg-slate-100 border-slate-200 text-amber-800' : 'bg-slate-950 border-slate-800 text-amber-400'} border text-xs font-bold`}>
                        {language === 'fr_ht' ? schedule.day_kreyol : schedule.day_english}
                      </span>
                    </div>
                  )}

                  {/* Title & Description */}
                  <h5 className={`text-xl font-bold ${textTitle} mb-3 group-hover:text-amber-400 transition-colors`}>
                    {language === 'fr_ht' ? schedule.title_kreyol : schedule.title_english}
                  </h5>
                  <p className={`${textBody} text-sm leading-relaxed mb-6`}>
                    {language === 'fr_ht' ? schedule.description_kreyol : schedule.description_english}
                  </p>
                </div>

                {/* Service Time Detail */}
                <div className={`pt-4 border-t ${isLight ? 'border-slate-100' : 'border-slate-800/80'} flex flex-col gap-3`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs uppercase font-semibold ${textMuted}`}>{language === 'fr_ht' ? 'Horaire' : 'Time'}</span>
                    <span className={`text-sm font-bold ${textTitle} ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/80 border-slate-800'} px-2.5 py-1 rounded border`}>
                      {schedule.time}
                    </span>
                  </div>

                  {/* Add to Calendar Dropdown */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCalendarMenu(activeCalendarMenu?.type === 'schedule' && activeCalendarMenu.id === schedule.id ? null : { type: 'schedule', id: schedule.id });
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all duration-300 cursor-pointer ${
                        isLight 
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' 
                          : 'bg-slate-900/50 hover:bg-slate-800/80 border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        <span>{language === 'fr_ht' ? 'Ajouter au calendrier' : 'Add to Calendar'}</span>
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${activeCalendarMenu?.type === 'schedule' && activeCalendarMenu.id === schedule.id ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Options */}
                    {activeCalendarMenu?.type === 'schedule' && activeCalendarMenu.id === schedule.id && (
                      <div className={`absolute bottom-full left-0 right-0 mb-2 z-20 rounded-xl border ${
                        isLight 
                          ? 'bg-white border-slate-200 shadow-xl' 
                          : 'bg-slate-950 border-slate-800 shadow-2xl'
                      } backdrop-blur-md p-1.5 flex flex-col gap-1 text-xs animate-scale-up`}>
                        <button
                          onClick={() => {
                            const nextDate = getNextDayOfWeek(schedule.day_english);
                            const timeParts = schedule.time.split('-');
                            const startParsed = parseTimeString(timeParts[0]);
                            const endParsed = parseTimeString(timeParts[1] || timeParts[0]);
                            const startDate = new Date(nextDate); startDate.setHours(startParsed.hours, startParsed.minutes, 0, 0);
                            const endDate = new Date(nextDate); endDate.setHours(endParsed.hours, endParsed.minutes, 0, 0);
                            handleAddToGoogleCalendar(
                              language === 'fr_ht' ? schedule.title_kreyol : schedule.title_english,
                              language === 'fr_ht' ? schedule.description_kreyol : schedule.description_english,
                              settings.church_address || 'Eglise Baptiste de la Parousie',
                              startDate,
                              endDate,
                              true,
                              schedule.day_english
                            );
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg hover:bg-amber-500/10 hover:text-amber-500 transition-colors cursor-pointer ${textBody}`}
                        >
                          📅 {language === 'fr_ht' ? 'Google Calendar (hebdomadaire)' : 'Google Calendar (Weekly)'}
                        </button>
                        <button
                          onClick={() => {
                            const nextDate = getNextDayOfWeek(schedule.day_english);
                            const timeParts = schedule.time.split('-');
                            const startParsed = parseTimeString(timeParts[0]);
                            const endParsed = parseTimeString(timeParts[1] || timeParts[0]);
                            const startDate = new Date(nextDate); startDate.setHours(startParsed.hours, startParsed.minutes, 0, 0);
                            const endDate = new Date(nextDate); endDate.setHours(endParsed.hours, endParsed.minutes, 0, 0);
                            handleAddToGoogleCalendar(
                              language === 'fr_ht' ? schedule.title_kreyol : schedule.title_english,
                              language === 'fr_ht' ? schedule.description_kreyol : schedule.description_english,
                              settings.church_address || 'Eglise Baptiste de la Parousie',
                              startDate,
                              endDate,
                              false
                            );
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg hover:bg-amber-500/10 hover:text-amber-500 transition-colors cursor-pointer ${textBody}`}
                        >
                          📅 {language === 'fr_ht' ? 'Google Calendar (une fois)' : 'Google Calendar (One-Time)'}
                        </button>
                        <button
                          onClick={() => {
                            const nextDate = getNextDayOfWeek(schedule.day_english);
                            const timeParts = schedule.time.split('-');
                            const startParsed = parseTimeString(timeParts[0]);
                            const endParsed = parseTimeString(timeParts[1] || timeParts[0]);
                            const startDate = new Date(nextDate); startDate.setHours(startParsed.hours, startParsed.minutes, 0, 0);
                            const endDate = new Date(nextDate); endDate.setHours(endParsed.hours, endParsed.minutes, 0, 0);
                            handleDownloadIcsFile(
                              language === 'fr_ht' ? schedule.title_kreyol : schedule.title_english,
                              language === 'fr_ht' ? schedule.description_kreyol : schedule.description_english,
                              settings.church_address || 'Eglise Baptiste de la Parousie',
                              startDate,
                              endDate,
                              true,
                              schedule.day_english
                            );
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg hover:bg-amber-500/10 hover:text-amber-500 transition-colors cursor-pointer ${textBody}`}
                        >
                          🍏 {language === 'fr_ht' ? 'Apple / Mac (.ics — hebdomadaire)' : 'Apple / Mac (.ics - Weekly)'}
                        </button>
                        <button
                          onClick={() => {
                            const nextDate = getNextDayOfWeek(schedule.day_english);
                            const timeParts = schedule.time.split('-');
                            const startParsed = parseTimeString(timeParts[0]);
                            const endParsed = parseTimeString(timeParts[1] || timeParts[0]);
                            const startDate = new Date(nextDate); startDate.setHours(startParsed.hours, startParsed.minutes, 0, 0);
                            const endDate = new Date(nextDate); endDate.setHours(endParsed.hours, endParsed.minutes, 0, 0);
                            handleDownloadIcsFile(
                              language === 'fr_ht' ? schedule.title_kreyol : schedule.title_english,
                              language === 'fr_ht' ? schedule.description_kreyol : schedule.description_english,
                              settings.church_address || 'Eglise Baptiste de la Parousie',
                              startDate,
                              endDate,
                              false
                            );
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg hover:bg-amber-500/10 hover:text-amber-500 transition-colors cursor-pointer ${textBody}`}
                        >
                          🍏 {language === 'fr_ht' ? 'Apple / Mac (.ics — une fois)' : 'Apple / Mac (.ics - One-Time)'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SERMONS & LIVE STREAM SECTION */}
      <section id="sermons" className={`py-24 ${isLight ? 'bg-white' : 'bg-slate-900/10'} border-t ${borderMain} relative`}>
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">{language === 'fr_ht' ? 'Diffusions en direct et archives' : 'Live Broadcasts & Archives'}</h3>
            <h4 className={`text-3xl sm:text-4xl font-extrabold font-serif ${textTitle} mb-4`}>{t.sermonsTitle}</h4>
            <p className={`${textMuted} text-base`}>{t.sermonsSubtitle}</p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 mb-16">
            
            {/* LIVE STREAM SECTION */}
            <div className="lg:col-span-7 flex flex-col justify-between h-full">
              <div className={`rounded-3xl ${bgCard} p-6 md:p-8 shadow-xl flex flex-col justify-between h-full overflow-hidden relative`}>
                
                {/* Active Indicator or Schedule details */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400">
                      <Tv className="w-5 h-5" />
                    </span>
                    <h5 className={`text-lg font-bold ${textTitle}`}>
                      {language === 'fr_ht' ? 'Diffusion en direct' : 'Live Stream'}
                    </h5>
                  </div>
                  
                  {settings.live_stream_active === 'true' ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold tracking-wider animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>{t.sermonLiveNow}</span>
                    </span>
                  ) : (
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${isLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-slate-950 border-slate-800 text-slate-400'} text-xs font-bold`}>
                      <span className="w-2 h-2 rounded-full bg-slate-600" />
                      <span>{t.sermonOffline}</span>
                    </span>
                  )}
                </div>

                {settings.live_stream_active === 'true' ? (() => {
                  const customEventId = settings.live_stream_event_id;
                  const selectedCustomEvent = customEventId && customEventId !== 'default'
                    ? events.find(e => String(e.id) === String(customEventId))
                    : null;
                  const isCustomActive = !!selectedCustomEvent;
                  const nextService = (!customEventId || customEventId === 'default')
                    ? getNextLiveStreamService()
                    : getNextScheduledService();
                  const eventTitle = isCustomActive && selectedCustomEvent
                    ? (language === 'fr_ht' ? selectedCustomEvent.title_kreyol : selectedCustomEvent.title_english)
                    : (language === 'fr_ht' ? nextService.title_kreyol : nextService.title_english);
                  const eventTime = isCustomActive && selectedCustomEvent
                    ? (language === 'fr_ht' ? `${selectedCustomEvent.date} à ${selectedCustomEvent.time}` : `${selectedCustomEvent.date} at ${selectedCustomEvent.time}`)
                    : (language === 'fr_ht' ? `${nextService.day_kreyol} à ${nextService.time}` : `${nextService.day_english} at ${nextService.time}`);
                  
                  return (
                    <div className="flex flex-col flex-1">
                      <div className={`w-full aspect-video rounded-2xl overflow-hidden bg-black border ${borderCard} shadow-2xl relative`}>
                        <iframe 
                          src={getYouTubeEmbedUrl(settings.live_stream_url, false)}
                          title="Eglise Baptiste de la Parousie Live Service"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="w-full h-full absolute inset-0"
                        />
                      </div>
                      
                      {/* Live Stream Helper Tip */}
                      <div className={`mt-4 p-4 rounded-xl border text-xs leading-relaxed ${
                        isLight 
                          ? 'bg-amber-50/50 border-amber-100 text-slate-600' 
                          : 'bg-amber-500/5 border-amber-500/10 text-slate-300'
                      }`}>
                        <span className="font-bold text-amber-500 mr-1.5">💡 {language === 'fr_ht' ? 'À propos de la diffusion :' : 'Live Stream Tip:'}</span>
                        {language === 'fr_ht' 
                          ? "Si le lecteur vidéo ci-dessus affiche une erreur, la diffusion n'a peut-être pas encore commencé ou est déjà terminée. Rejoignez-nous pour notre prochain culte : "
                          : "If the player above displays an error, the broadcast may not have started yet or has already concluded. Join us for our next service: "}
                        <strong className={`${textTitle} font-bold`}>
                          {`${eventTitle} (${eventTime})`}
                        </strong>.
                      </div>
                    </div>
                  );
                })() : (() => {
                  const isDefaultStream = !settings.live_stream_event_id || settings.live_stream_event_id === 'default';
                  const nextService = isDefaultStream ? getNextLiveStreamService() : getNextScheduledService();

                  const renderServiceCard = (service: any, isFallback: boolean = false) => {
                    const title = language === 'fr_ht' ? service.title_kreyol : service.title_english;
                    const description = language === 'fr_ht' ? service.description_kreyol : service.description_english;
                    const datetimeStr = language === 'fr_ht' 
                      ? `${service.day_kreyol} à ${service.time}`
                      : `${service.day_english} at ${service.time}`;
                    const thumbnail = service.image_url;

                    return (
                      <div className={`w-full max-w-2xl p-6 rounded-2xl border text-left ${isLight ? 'bg-white border-slate-200 shadow-lg' : 'bg-slate-900/80 border-slate-800 shadow-2xl'} transition-all duration-300 hover:border-amber-500/40 relative overflow-hidden group`}>
                        {/* Ambient background glow */}
                        <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/10 to-blue-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        
                        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
                          {/* Thumbnail image container */}
                          <div className={`w-full md:w-48 aspect-[4/3] rounded-xl overflow-hidden shrink-0 border ${isLight ? 'border-slate-100' : 'border-slate-800'} bg-slate-950 shadow-inner relative flex items-center justify-center`}>
                            {thumbnail ? (
                              <img 
                                src={thumbnail} 
                                alt={title} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const p = e.currentTarget.parentElement;
                                  if (p) {
                                    const fallbackIcon = p.querySelector('.fallback-icon-container');
                                    if (fallbackIcon) fallbackIcon.classList.remove('hidden');
                                  }
                                }}
                              />
                            ) : null}
                            
                            <div className={`fallback-icon-container ${thumbnail ? 'hidden absolute inset-0' : ''} flex flex-col items-center justify-center gap-2 p-4 text-center bg-gradient-to-br from-slate-900 to-slate-950 w-full h-full`}>
                              <Tv className="w-8 h-8 text-amber-500 animate-pulse" />
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Worship Service</span>
                            </div>

                            {/* Absolute Badge over Thumbnail */}
                            <span className="absolute top-2.5 left-2.5 text-[9px] font-extrabold uppercase tracking-widest bg-blue-600 text-white px-2.5 py-0.5 rounded-full shadow">
                              {language === 'fr_ht' ? 'Culte' : 'Service'}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-4 mb-3">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                                {isFallback 
                                  ? (language === 'fr_ht' ? 'Culte de remplacement' : 'Fallback Service')
                                  : (language === 'fr_ht' ? 'Prochain culte' : 'Next Service')}
                              </span>
                              <span className={`text-xs font-bold ${textTitle} flex items-center gap-1.5 shrink-0 bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/20`}>
                                <Clock className="w-3.5 h-3.5" />
                                <span>{datetimeStr}</span>
                              </span>
                            </div>
                            
                            <h5 className={`text-lg md:text-xl font-bold ${textTitle} leading-snug mb-2 font-serif group-hover:text-amber-500 transition-colors`}>
                              {title}
                            </h5>
                            
                            <p className={`${textBody} text-xs leading-relaxed line-clamp-3 mb-0`}>
                              {description || (language === 'fr_ht' 
                                ? 'Rejoignez-nous pour ce culte.'
                                : 'Join us for this worship service.')}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  };

                  return (
                    <div className={`flex-1 flex flex-col items-center justify-center text-center py-10 px-6 rounded-2xl ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border border-slate-850'}`}>
                      <div className={`w-14 h-14 rounded-full ${isLight ? 'bg-slate-200/50 border-slate-300 text-slate-400' : 'bg-slate-900 border-slate-800 text-slate-500'} flex items-center justify-center mb-4`}>
                        <Tv className="w-6 h-6 text-slate-400" />
                      </div>
                      <h6 className={`text-xl font-bold ${textTitle} mb-2`}>
                        {language === 'fr_ht' ? 'Aucune diffusion en direct pour le moment' : 'No active live stream at this time'}
                      </h6>
                      <p className={`${textBody} text-sm max-w-md leading-relaxed mb-6`}>
                        {language === 'fr_ht' 
                          ? 'Nos cultes sont diffusés en direct aux horaires habituels. Consultez ci-dessous les détails de notre prochain culte.'
                          : 'Our services are broadcast live during our regular scheduled hours. See details of our next upcoming service below.'}
                      </p>
                      
                      {settings.live_stream_event_id && settings.live_stream_event_id !== 'default' ? (() => {
                        const customEventId = settings.live_stream_event_id;
                        const selectedCustomEvent = events.find(e => String(e.id) === String(customEventId));
                        if (!selectedCustomEvent) {
                          /* Fallback to Live Stream Service if selected custom event doesn't exist anymore */
                          const fallbackLiveStream = getNextLiveStreamService();
                          return renderServiceCard(fallbackLiveStream, true);
                        }

                        const customTitle = language === 'fr_ht' 
                          ? selectedCustomEvent.title_kreyol 
                          : selectedCustomEvent.title_english;
                        const customDatetime = language === 'fr_ht' 
                          ? `${selectedCustomEvent.date} à ${selectedCustomEvent.time}`
                          : `${selectedCustomEvent.date} at ${selectedCustomEvent.time}`;
                        const customDescription = language === 'fr_ht' 
                          ? selectedCustomEvent.description_kreyol 
                          : selectedCustomEvent.description_english;
                        const customThumbnail = settings.custom_live_event_thumbnail_url;

                        return (
                          <div className={`w-full max-w-2xl p-6 rounded-2xl border text-left ${isLight ? 'bg-white border-slate-200 shadow-lg' : 'bg-slate-900/80 border-slate-800 shadow-2xl'} transition-all duration-300 hover:border-amber-500/40 relative overflow-hidden group`}>
                            {/* Ambient background glow */}
                            <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/10 to-blue-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            
                            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
                              {/* Thumbnail image container */}
                              <div className={`w-full md:w-48 aspect-[4/3] rounded-xl overflow-hidden shrink-0 border ${isLight ? 'border-slate-100' : 'border-slate-800'} bg-slate-950 shadow-inner relative flex items-center justify-center`}>
                                {customThumbnail ? (
                                  <img 
                                    src={customThumbnail} 
                                    alt={customTitle} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const p = e.currentTarget.parentElement;
                                      if (p) {
                                        const fallbackIcon = p.querySelector('.fallback-icon-container');
                                        if (fallbackIcon) fallbackIcon.classList.remove('hidden');
                                      }
                                    }}
                                  />
                                ) : null}
                                
                                <div className={`fallback-icon-container ${customThumbnail ? 'hidden absolute inset-0' : ''} flex flex-col items-center justify-center gap-2 p-4 text-center bg-gradient-to-br from-slate-900 to-slate-950 w-full h-full`}>
                                  <Tv className="w-8 h-8 text-amber-500 animate-pulse" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Special Event</span>
                                </div>

                                {/* Absolute Badge over Thumbnail */}
                                <span className="absolute top-2.5 left-2.5 text-[9px] font-extrabold uppercase tracking-widest bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full shadow">
                                  {language === 'fr_ht' ? 'Spécial' : 'Special'}
                                </span>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-4 mb-3">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                                    {language === 'fr_ht' ? 'Événement à venir' : 'Upcoming Event'}
                                  </span>
                                  <span className={`text-xs font-bold ${textTitle} flex items-center gap-1.5 shrink-0 bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/20`}>
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{customDatetime}</span>
                                  </span>
                                </div>
                                
                                <h5 className={`text-lg md:text-xl font-bold ${textTitle} leading-snug mb-2 font-serif group-hover:text-amber-500 transition-colors`}>
                                  {customTitle}
                                </h5>
                                
                                <p className={`${textBody} text-xs leading-relaxed line-clamp-3 mb-0`}>
                                  {customDescription || (language === 'fr_ht' 
                                    ? 'Rejoignez-nous pour cet événement spécial.'
                                    : 'Join us for this special upcoming event.')}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })() : (() => {
                        const liveStreamService = getNextLiveStreamService();
                        return renderServiceCard(liveStreamService, false);
                      })()}

                      <a 
                        href="#schedules"
                        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all duration-300 hover:scale-105"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{language === 'fr_ht' ? 'Voir tous les horaires des cultes' : 'View Full Service Schedule'}</span>
                      </a>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* SERMON ARCHIVES SECTION */}
            <div className="lg:col-span-5 flex flex-col h-full justify-between">
              <div className={`rounded-3xl ${bgCard} p-6 md:p-8 shadow-xl flex flex-col h-full`}>
                
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600/10 text-blue-400">
                      <Video className="w-5 h-5" />
                    </span>
                    <h5 className={`text-lg font-bold ${textTitle}`}>
                      {language === 'fr_ht' ? 'Archives des prédications' : 'Sermon Archives'}
                    </h5>
                  </div>
                </div>

                {/* Client Search bar */}
                <div className="relative mb-6">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`}>
                    <Search className="w-4 h-4" />
                  </span>
                  <input 
                    type="text"
                    value={sermonSearch}
                    onChange={(e) => setSermonSearch(e.target.value)}
                    placeholder={t.sermonSearchPlaceholder}
                    className={`w-full pl-9 pr-4 py-2.5 rounded-lg ${bgInput}`}
                  />
                </div>

                {/* Scrollable list of sermons */}
                <div className={`flex-1 space-y-4 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin ${isLight ? 'scrollbar-thumb-slate-200' : 'scrollbar-thumb-slate-800'} scrollbar-track-transparent`}>
                  {filteredSermons.length > 0 ? (
                    filteredSermons.map((sermon) => (
                      <div 
                        key={sermon.id}
                        onClick={() => setSelectedSermonVideo(sermon)}
                        className={`group flex gap-4 p-3 rounded-xl ${isLight ? 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 hover:border-blue-500/30' : 'bg-slate-950/40 hover:bg-slate-950 border-slate-850 hover:border-blue-500/40'} border transition-all duration-300 cursor-pointer`}
                      >
                        {/* YouTube Thumbnail preview */}
                        <div className={`relative w-24 h-16 rounded-lg ${isLight ? 'bg-slate-200 border-slate-300' : 'bg-slate-900 border-slate-800'} overflow-hidden flex-shrink-0 flex items-center justify-center group-hover:border-blue-500/30 transition-all`}>
                          <img 
                            src={getYouTubeThumbnailUrl(sermon.youtube_id)}
                            alt={language === 'fr_ht' ? sermon.title_kreyol : sermon.title_english}
                            className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-all"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <Play className="w-5 h-5 text-white/80 absolute group-hover:text-amber-400 transition-colors drop-shadow" />
                        </div>

                        {/* Sermon metadata */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h6 className={`text-sm font-bold ${textTitle} group-hover:text-amber-400 transition-colors truncate`}>
                            {language === 'fr_ht' ? sermon.title_kreyol : sermon.title_english}
                          </h6>
                          <p className={`text-[11px] ${textMuted} font-medium mt-1 truncate`}>
                            {t.sermonSpeaker}: <span className={textBody}>{sermon.speaker}</span>
                          </p>
                          <p className={`text-[10px] ${textMuted} font-medium mt-0.5`}>
                            {t.sermonDate}: {sermon.date}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={`text-center py-12 ${textMuted} text-sm`}>
                      {language === 'fr_ht' ? 'Aucune prédication ne correspond à votre recherche.' : 'No sermons found matching your search.'}
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SERMON PLAYBACK MODAL PANEL */}
      {selectedSermonVideo && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className={`relative w-full max-w-3xl rounded-3xl ${bgCard} p-6 md:p-8 shadow-2xl animate-scale-up`}>
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedSermonVideo(null)}
              className={`absolute top-4 right-4 p-1.5 rounded-lg ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800' : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white'} z-10`}
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-600/10 text-blue-400'}`}>
                  <Video className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-amber-400 tracking-wider">
                  {selectedSermonVideo.speaker} • {selectedSermonVideo.date}
                </span>
              </div>

              <h5 className={`text-xl md:text-2xl font-extrabold font-serif ${textTitle} mb-4 leading-tight`}>
                {language === 'fr_ht' ? selectedSermonVideo.title_kreyol : selectedSermonVideo.title_english}
              </h5>

              {/* Responsive Video Container */}
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-850 shadow-2xl relative mb-6">
                <iframe 
                  src={getYouTubeEmbedUrl(selectedSermonVideo.youtube_id, true)}
                  title={language === 'fr_ht' ? selectedSermonVideo.title_kreyol : selectedSermonVideo.title_english}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full absolute inset-0"
                />
              </div>

              <p className={`${textBody} text-sm leading-relaxed max-h-[100px] overflow-y-auto pr-1`}>
                {language === 'fr_ht' ? selectedSermonVideo.description_kreyol : selectedSermonVideo.description_english}
              </p>
            </div>

          </div>
        </div>
      )}

      {/* 4. MINISTRIES SHOWCASE SECTION (MINISTÈ YO) */}
      <section id="ministries" className={`py-24 ${isLight ? 'bg-slate-100/50 border-t border-slate-200' : 'bg-slate-900/30 border-t border-slate-900'} relative`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">{language === 'fr_ht' ? "L'œuvre de Dieu" : 'Our Work'}</h3>
            <h4 className={`text-3xl sm:text-4xl font-extrabold font-serif ${textTitle} mb-4`}>{t.navMinistries}</h4>
            <p className={`${textMuted} text-base`}>
              {language === 'fr_ht' 
                ? "Découvrez nos différents ministères, où vous pourrez servir, grandir et soutenir l'œuvre du Seigneur."
                : 'Explore our various ministries where you can serve, grow, and support the work of the Lord.'}
            </p>
          </div>

          {/* Premium Tab Selector */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {[
              { id: 'women', label: t.ministryWomen, icon: Heart },
              { id: 'men', label: t.ministryMen, icon: Users },
              { id: 'children', label: t.ministryChildren, icon: Sparkles },
              { id: 'missions', label: t.ministryMissions, icon: Globe2 }
            ].map(tab => {
              const IconComp = tab.icon;
              const isSelected = activeMinistryTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMinistryTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl border font-bold text-sm transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/20 scale-105'
                      : `${isLight ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'}`
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Contents */}
          <div className="mt-8 transition-all duration-500">
            {['women', 'men', 'children'].includes(activeMinistryTab) && (() => {
              const m = ministries.find(item => item.slug === activeMinistryTab);
              if (!m) return null;
              
              const title = language === 'fr_ht' ? m.title_kreyol : m.title_english;
              const desc = language === 'fr_ht' ? m.description_kreyol : m.description_english;
              const bulletsStr = language === 'fr_ht' ? m.bullets_kreyol : m.bullets_english;
              const bullets = bulletsStr.split('\n').filter(b => b.trim());
              
              return (
                <>
                  <div className={`grid md:grid-cols-2 gap-12 items-center p-8 rounded-3xl ${bgCard} animate-fade-in`}>
                    <div>
                      <h5 className={`text-2xl font-bold font-serif ${textTitle} mb-4`}>
                        {title}
                      </h5>
                      <p className={`${textBody} text-base leading-relaxed mb-6`}>
                        {desc}
                      </p>
                      <ul className="space-y-3 mb-6">
                        {bullets.map((bullet, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm font-medium">
                            <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            <span className={textBody}>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                      <MinistrySignupForm
                        slug={activeMinistryTab as MinistrySignupSlug}
                        ministry={m}
                        language={language}
                        isLight={isLight}
                        textTitle={textTitle}
                        textBody={textBody}
                        textMuted={textMuted}
                        bgCard={bgCard}
                        bgInput={bgInput}
                        registerLabel={t.btnRegister}
                        cancelLabel={t.btnCancel}
                        submitLabel={t.btnSubmit}
                      />
                    </div>
                    <div className="h-80 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
                      <img 
                        src={m.image_url} 
                        alt={title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </>
              );
            })()}

            {activeMinistryTab === 'missions' && (
              <div className="animate-fade-in">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 pb-4 border-b border-slate-800">
                  <div className="max-w-xl">
                    <h5 className={`text-2xl font-bold font-serif ${textTitle} mb-2`}>{t.missionsTitle}</h5>
                    <p className={`${textMuted} text-sm`}>{t.missionsSubtitle}</p>
                  </div>
                  <div className="mt-4 lg:mt-0">
                    <a 
                      href="#giving" 
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm transition-all duration-300 shadow-md shadow-amber-500/10 cursor-pointer"
                    >
                      <span>{language === 'fr_ht' ? 'Soutenir les missions' : 'Give to Missions'}</span>
                      <Heart className="w-4 h-4 fill-current" />
                    </a>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {missions.map((mission, index) => {
                    const pct = Math.min(100, Math.round((mission.funds_raised / mission.funds_goal) * 100)) || 0;
                    return (
                      <div 
                        key={mission.id || index} 
                        className={`rounded-2xl ${bgCard} overflow-hidden flex flex-col justify-between border ${borderCard}`}
                      >
                        <div>
                          <div className="relative h-48 overflow-hidden">
                            <img 
                              src={mission.image_url || 'https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=600&auto=format&fit=crop'} 
                              alt="Haiti Mission" 
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute top-3 left-3 px-2.5 py-1 rounded bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase shadow-sm">
                              Haiti Outreach
                            </span>
                          </div>
                          <div className="p-5">
                            <h6 className={`text-lg font-bold ${textTitle} mb-2 font-serif`}>
                              {language === 'fr_ht' ? mission.title_kreyol : mission.title_english}
                            </h6>
                            <p className={`${textBody} text-xs leading-relaxed`}>
                              {language === 'fr_ht' ? mission.description_kreyol : mission.description_english}
                            </p>
                          </div>
                        </div>

                        <div className={`p-5 pt-3 border-t ${borderDivider} ${bgCardAltNested}`}>
                          <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-2">
                            <span>{t.missionsRaised} <strong>${mission.funds_raised.toLocaleString()}</strong></span>
                            <span>{t.missionsGoal} <strong>${mission.funds_goal.toLocaleString()}</strong></span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-2">
                            <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-500">
                            <span>{language === 'fr_ht' ? 'Date' : 'Date'}: {mission.date}</span>
                            <span className="font-bold text-amber-400">{pct}% {t.missionsProgress}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 flex justify-start">
                  <MinistrySignupForm
                    slug="missions"
                    ministry={ministries.find((item) => item.slug === 'missions')}
                    language={language}
                    isLight={isLight}
                    textTitle={textTitle}
                    textBody={textBody}
                    textMuted={textMuted}
                    bgCard={bgCard}
                    bgInput={bgInput}
                    registerLabel={t.btnRegister}
                    cancelLabel={t.btnCancel}
                    submitLabel={t.btnSubmit}
                  />
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 5. ABOUT US & BELIEFS SECTION (ABOUT) */}
      <section id="about" className={`py-24 ${isLight ? 'bg-white border-t border-slate-200' : 'bg-slate-950 border-t border-slate-900'} relative`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">{language === 'fr_ht' ? 'Découvrez-nous' : 'Discover Us'}</h3>
            <h4 className={`text-3xl sm:text-4xl font-extrabold font-serif ${textTitle} mb-4`}>
              {language === 'fr_ht' ? 'À propos de notre ministère' : 'About Our Ministry'}
            </h4>
            <p className={`${textMuted} text-base`}>
              {language === 'fr_ht'
                ? 'Découvrez notre mission, nos croyances bibliques fondamentales, notre équipe dirigeante et ce qui vous attend.'
                : 'Get to know our mission, foundational biblical beliefs, leadership team, and what to expect.'}
            </p>
          </div>

          {/* Premium Sub-Tab Selector */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {[
              { id: 'aboutUs', label: dAboutUsTitle },
              { id: 'beliefs', label: dBeliefsTitle },
              { id: 'team', label: dTeamTitle },
              { id: 'expect', label: dExpectTitle }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveAboutTab(tab.id as any)}
                className={`px-5 py-3 rounded-xl border font-bold text-sm transition-all duration-300 cursor-pointer ${
                  activeAboutTab === tab.id
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/20'
                    : `${isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'}`
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* About Tab content */}
          <div className="transition-all duration-500">
            {activeAboutTab === 'aboutUs' && (
              <div className={`grid md:grid-cols-2 gap-12 items-center p-8 rounded-3xl ${bgCard} animate-fade-in`}>
                <div>
                  <h5 className={`text-2xl font-bold font-serif ${textTitle} mb-4`}>{dAboutUsTitle}</h5>
                  <p className={`${textBody} text-base leading-relaxed mb-4`}>
                    {language === 'fr_ht'
                      ? (settings.about_us_p1_ht || "Parousia Baptist Ministries est une communauté vivante de croyants consacrés à l'adoration de Dieu et dans l'attente du retour de Jésus-Christ. Notre mission est d'annoncer fidèlement l'Évangile, de former des disciples et de servir notre communauté locale ainsi que la diaspora.")
                      : (settings.about_us_p1_en || 'Parousia Baptist Ministries is a vibrant community of believers devoted to worshiping God and anticipating the second coming (Parousia) of our Lord Jesus Christ. Our mission is to preach the true Gospel, foster deep discipleship, and serve our local and diaspora community.')}
                  </p>
                  <p className={`${textBody} text-base leading-relaxed`}>
                    {language === 'fr_ht'
                      ? (settings.about_us_p2_ht || "Depuis nos débuts, nous nous attachons à vivre une foi biblique authentique, à soutenir des projets éducatifs et sanitaires en Haïti et à offrir un lieu accueillant où chacun peut trouver une véritable famille spirituelle.")
                      : (settings.about_us_p2_en || 'From our inception, we have focused on authentic biblical living, establishing direct educational and healthcare mission support in Haiti, and cultivating a welcoming space where everyone can experience genuine spiritual family.')}
                  </p>
                </div>
                <div className="h-80 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
                  <img 
                    src={settings.about_us_image_url || "https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=800&auto=format&fit=crop"} 
                    alt="Sanctuary Praise" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {activeAboutTab === 'beliefs' && (
              <div className={`p-8 rounded-3xl ${bgCard} animate-fade-in`}>
                <h5 className={`text-2xl font-bold font-serif ${textTitle} mb-6 border-b border-slate-800 pb-3`}>{dBeliefsTitle}</h5>
                <div className="grid md:grid-cols-2 gap-8">
                  {[
                    {
                      title: language === 'fr_ht' 
                        ? (settings.belief_1_title_ht || "L'autorité infaillible des Écritures")
                        : (settings.belief_1_title_en || 'Infallible Scripture'),
                      desc: language === 'fr_ht' 
                        ? (settings.belief_1_desc_ht || "Nous croyons que toute la Bible est la Parole inspirée, infaillible et sans erreur de Dieu, notre autorité suprême en matière de foi, de doctrine et de conduite.")
                        : (settings.belief_1_desc_en || 'We believe the Bible is the inspired, infallible, and inerrant Word of God, serving as our final authority in all matters of faith, doctrine, and conduct.')
                    },
                    {
                      title: language === 'fr_ht' 
                        ? (settings.belief_2_title_ht || 'La Sainte Trinité')
                        : (settings.belief_2_title_en || 'Holy Trinity'),
                      desc: language === 'fr_ht'
                        ? (settings.belief_2_desc_ht || "Nous croyons en un seul Dieu, existant éternellement en trois personnes égales : le Père, le Fils (Jésus-Christ) et le Saint-Esprit.")
                        : (settings.belief_2_desc_en || 'We believe in one God, eternally existing in three co-equal persons: God the Father, God the Son (Jesus Christ), and God the Holy Spirit.')
                    },
                    {
                      title: language === 'fr_ht' 
                        ? (settings.belief_3_title_ht || 'Le salut par la grâce')
                        : (settings.belief_3_title_en || 'Salvation by Grace'),
                      desc: language === 'fr_ht'
                        ? (settings.belief_3_desc_ht || "Le salut est un don de Dieu reçu par la repentance et la foi dans le sacrifice de Jésus-Christ. Nous sommes sauvés par la grâce seule, et non par nos œuvres.")
                        : (settings.belief_3_desc_en || "Salvation is a gift of God received through repentance and faith in Christ's substitutionary sacrifice on the cross. It is entirely by grace alone, not works.")
                    },
                    {
                      title: language === 'fr_ht' 
                        ? (settings.belief_4_title_ht || 'Le retour du Seigneur (Parousie)')
                        : (settings.belief_4_title_en || 'The Blessed Hope (Parousia)'),
                      desc: language === 'fr_ht'
                        ? (settings.belief_4_desc_ht || "Nous attendons avec espérance le retour personnel, visible et glorieux de Jésus-Christ, qui rassemblera son Église et établira son règne de justice.")
                        : (settings.belief_4_desc_en || 'We eagerly anticipate the personal, visible, and glorious return of Jesus Christ to gather His Church and establish His righteous kingdom.')
                    }
                  ].map((belief, idx) => (
                    <div key={idx} className={`p-5 rounded-xl ${bgCardAltNested} border ${borderCard}`}>
                      <h6 className="text-lg font-bold text-amber-400 mb-2 font-serif flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span>{belief.title}</span>
                      </h6>
                      <p className={`${textBody} text-sm leading-relaxed`}>{belief.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeAboutTab === 'team' && (
              <div className={`p-8 rounded-3xl ${bgCard} animate-fade-in`}>
                <div className="mb-10 border-b border-slate-800 pb-4">
                  <h5 className={`text-2xl font-bold font-serif ${textTitle}`}>{dTeamTitle}</h5>
                  <p className={`text-sm font-bold uppercase tracking-widest text-amber-400 mt-2`}>{dTeamSubtitle}</p>
                </div>

                <div className="space-y-12">
                  {teamDepartments.map((department) => (
                    <section key={department.id} className="space-y-6">
                      <h6 className={`text-lg font-bold uppercase tracking-wider text-amber-400 border-b ${borderDivider} pb-2`}>
                        {isHt ? department.title_ht : department.title_en}
                      </h6>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {department.members.map((member, idx) => (
                          <div
                            key={`${department.id}-${idx}`}
                            className={`rounded-2xl ${bgCardAltNested} overflow-hidden flex flex-col sm:flex-row border ${borderCard} h-full`}
                          >
                            {member.image_url && (
                              <div className="w-full sm:w-44 h-56 sm:h-auto relative flex-shrink-0">
                                <img
                                  src={member.image_url}
                                  alt={member.name || `Team Member ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="p-5 flex flex-col justify-between flex-grow">
                              <div>
                                <h6 className={`text-lg font-bold ${textTitle} font-serif`}>{member.name || `Team Member ${idx + 1}`}</h6>
                                {(member.role_en || member.role_ht) && (
                                  <p className="text-xs font-bold text-amber-400 uppercase mb-2">
                                    {isHt ? member.role_ht : member.role_en}
                                  </p>
                                )}
                                {(member.bio_en || member.bio_ht) && (
                                  <p className={`${textBody} text-xs leading-relaxed`}>
                                    {isHt ? member.bio_ht : member.bio_en}
                                  </p>
                                )}
                              </div>
                              {member.email && (
                                <div className="pt-3 border-t border-slate-800/50 mt-3 flex items-center gap-2 text-[10px] text-slate-500 truncate">
                                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="truncate">{member.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            )}

            {activeAboutTab === 'expect' && (
              <div className={`grid md:grid-cols-2 gap-12 items-center p-8 rounded-3xl ${bgCard} animate-fade-in`}>
                <div>
                  <h5 className={`text-2xl font-bold font-serif ${textTitle} mb-4`}>{dExpectTitle}</h5>
                  <p className={`${textBody} text-base leading-relaxed mb-4`}>
                    {language === 'fr_ht'
                      ? (settings.expect_p1_ht || "Lorsque vous venez adorer avec nous à Parousia Baptist Ministries, vous découvrez une atmosphère chaleureuse, accueillante et respectueuse. Nos cultes, en français et en anglais, permettent à chacun de participer pleinement.")
                      : (settings.expect_p1_en || 'When you step into a service at Parousia Baptist Ministries, you will experience a warm, friendly, and reverent atmosphere. Our worship is spirit-filled and biblical, and our bilingual environment welcomes all.')}
                  </p>
                  <ul className="space-y-3">
                    {[
                      {
                        en: settings.expect_bullet1_en || 'Christ-centered praise, blending traditional hymns and modern worship',
                        ht: settings.expect_bullet1_ht || 'Une louange centrée sur le Christ, entre cantiques traditionnels et chants contemporains'
                      },
                      {
                        en: settings.expect_bullet2_en || 'Expository, practical teaching straight from the holy scriptures',
                        ht: settings.expect_bullet2_ht || 'Un enseignement biblique, concret et fidèle aux Écritures'
                      },
                      {
                        en: settings.expect_bullet3_en || 'A supportive, tight-knit family that will welcome you with open arms',
                        ht: settings.expect_bullet3_ht || 'Une communauté fraternelle qui vous accueille à bras ouverts'
                      }
                    ].map((bulletObj, idx) => {
                      const bulletText = language === 'fr_ht' ? bulletObj.ht : bulletObj.en;
                      return (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <span className={textBody}>{bulletText}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="h-80 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
                  <img 
                    src={settings.expect_image_url || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop"} 
                    alt="Praise Expect" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 6. EVENTS CALENDAR & FRICTIONLESS SIGNUP */}
      <section id="events" className={`py-24 ${isLight ? 'bg-slate-100/50 border-t border-slate-200' : 'bg-slate-900/30 border-t border-slate-900'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">{language === 'fr_ht' ? 'Calendrier des activités' : 'Events Calendar'}</h3>
            <h4 className={`text-3xl sm:text-4xl font-extrabold font-serif ${textTitle} mb-4`}>{t.eventsTitle}</h4>
            <p className={`${textMuted} text-base`}>{t.eventsSubtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {events.map((event, index) => (
              <div 
                key={event.id || index} 
                className={`rounded-2xl ${bgCard} p-6 md:p-8 flex flex-col justify-between`}
              >
                <div>
                  {/* Event badge details */}
                  <div className="flex justify-between items-center mb-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md ${isLight ? 'bg-blue-50 border border-blue-100 text-blue-600' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'} text-xs font-bold`}>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{event.date}</span>
                    </span>
                    <span className={`text-xs font-medium ${textMuted}`}>
                      {event.time}
                    </span>
                  </div>

                  <h5 className={`text-xl font-bold ${textTitle} mb-3 font-serif`}>
                    {language === 'fr_ht' ? event.title_kreyol : event.title_english}
                  </h5>
                  
                  <p className={`${textBody} text-sm leading-relaxed mb-6`}>
                    {language === 'fr_ht' ? event.description_kreyol : event.description_english}
                  </p>
                </div>

                <div className={`pt-6 border-t ${borderDivider} flex items-center justify-between`}>
                  <div className={`flex items-center gap-1.5 text-xs ${textMuted} font-medium`}>
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'fr_ht' ? event.location_kreyol : event.location_english}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Add to Calendar Dropdown */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCalendarMenu(activeCalendarMenu?.type === 'event' && activeCalendarMenu.id === event.id ? null : { type: 'event', id: event.id });
                        }}
                        className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                          isLight 
                            ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' 
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                        title={language === 'fr_ht' ? 'Ajouter au calendrier' : 'Add to Calendar'}
                      >
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        <span className="hidden sm:inline">{language === 'fr_ht' ? 'Calendrier' : 'Add to Calendar'}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${activeCalendarMenu?.type === 'event' && activeCalendarMenu.id === event.id ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown Options */}
                      {activeCalendarMenu?.type === 'event' && activeCalendarMenu.id === event.id && (
                        <div className={`absolute bottom-full right-0 mb-2 z-20 min-w-[180px] rounded-xl border ${
                          isLight 
                            ? 'bg-white border-slate-200 shadow-xl' 
                            : 'bg-slate-950 border-slate-800 shadow-2xl'
                        } backdrop-blur-md p-1.5 flex flex-col gap-1 text-xs animate-scale-up`}>
                          <button
                            onClick={() => {
                              const [yr, mo, dy] = event.date.split('-');
                              const startDate = new Date(parseInt(yr), parseInt(mo) - 1, parseInt(dy));
                              const timeParts = event.time.split('-');
                              const startParsed = parseTimeString(timeParts[0]);
                              const endParsed = parseTimeString(timeParts[1] || timeParts[0]);
                              startDate.setHours(startParsed.hours, startParsed.minutes, 0, 0);
                              const endDate = new Date(parseInt(yr), parseInt(mo) - 1, parseInt(dy));
                              endDate.setHours(endParsed.hours, endParsed.minutes, 0, 0);

                              handleAddToGoogleCalendar(
                                language === 'fr_ht' ? event.title_kreyol : event.title_english,
                                language === 'fr_ht' ? event.description_kreyol : event.description_english,
                                language === 'fr_ht' ? event.location_kreyol : event.location_english,
                                startDate,
                                endDate,
                                false
                              );
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg hover:bg-amber-500/10 hover:text-amber-500 transition-colors cursor-pointer ${textBody}`}
                          >
                            📅 Google Calendar
                          </button>
                          <button
                            onClick={() => {
                              const [yr, mo, dy] = event.date.split('-');
                              const startDate = new Date(parseInt(yr), parseInt(mo) - 1, parseInt(dy));
                              const timeParts = event.time.split('-');
                              const startParsed = parseTimeString(timeParts[0]);
                              const endParsed = parseTimeString(timeParts[1] || timeParts[0]);
                              startDate.setHours(startParsed.hours, startParsed.minutes, 0, 0);
                              const endDate = new Date(parseInt(yr), parseInt(mo) - 1, parseInt(dy));
                              endDate.setHours(endParsed.hours, endParsed.minutes, 0, 0);

                              handleDownloadIcsFile(
                                language === 'fr_ht' ? event.title_kreyol : event.title_english,
                                language === 'fr_ht' ? event.description_kreyol : event.description_english,
                                language === 'fr_ht' ? event.location_kreyol : event.location_english,
                                startDate,
                                endDate,
                                false
                              );
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg hover:bg-amber-500/10 hover:text-amber-500 transition-colors cursor-pointer ${textBody}`}
                          >
                            🍏 Apple / Mac (.ics)
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Signup trigger button */}
                    <button 
                      onClick={() => {
                        setSelectedEvent(event);
                        setRegSuccess(false);
                        setRegError('');
                      }}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all duration-300 hover:scale-105 cursor-pointer"
                    >
                      {t.btnRegister}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* EVENT REGISTRATION MODAL PANEL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className={`relative w-full max-w-lg rounded-2xl ${bgCard} p-6 md:p-8 animate-scale-up`}>
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedEvent(null)}
              className={`absolute top-4 right-4 p-1.5 rounded-lg ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800' : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <X className="w-5 h-5" />
            </button>

            {!regSuccess ? (
              <form onSubmit={handleRegisterSubmit}>
                <h5 className={`text-2xl font-extrabold font-serif ${textTitle} mb-2`}>
                  {t.eventRegisterTitle}
                </h5>
                <p className="text-sm text-amber-400 font-medium mb-6">
                  {language === 'fr_ht' ? selectedEvent.title_kreyol : selectedEvent.title_english}
                </p>

                {regError && (
                  <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                    {regError}
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  <div>
                    <label className={`block text-xs font-bold uppercase ${textMuted} mb-1.5`}>{t.eventFieldName}</label>
                    <input 
                      type="text" 
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Jean Baptiste" 
                      className={`w-full px-4 py-3 rounded-lg ${bgInput} focus:border-blue-500 focus:outline-none text-sm transition-all`}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-bold uppercase ${textMuted} mb-1.5`}>{t.eventFieldEmail}</label>
                      <input 
                        type="email" 
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="e.g. jean@gmail.com" 
                        className={`w-full px-4 py-3 rounded-lg ${bgInput} focus:border-blue-500 focus:outline-none text-sm transition-all`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold uppercase ${textMuted} mb-1.5`}>{t.eventFieldPhone}</label>
                      <input 
                        type="tel" 
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="e.g. (954) 555-1122" 
                        className={`w-full px-4 py-3 rounded-lg ${bgInput} focus:border-blue-500 focus:outline-none text-sm transition-all`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase ${textMuted} mb-1.5`}>{t.eventFieldNotes}</label>
                    <textarea 
                      rows={3}
                      value={regNotes}
                      onChange={(e) => setRegNotes(e.target.value)}
                      placeholder="..." 
                      className={`w-full px-4 py-3 rounded-lg ${bgInput} focus:border-blue-500 focus:outline-none text-sm transition-all resize-none`}
                    />
                  </div>
                </div>

                <div className="flex gap-4 justify-end">
                  <button 
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className={`px-5 py-2.5 rounded-lg ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-950 hover:bg-slate-850 text-slate-300'} font-semibold text-sm transition-all`}
                  >
                    {t.btnCancel}
                  </button>
                  <button 
                    type="submit"
                    disabled={isPending}
                    className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm transition-all"
                  >
                    {isPending ? t.btnLoading : t.btnSubmit}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-6">
                <div className={`w-16 h-14 rounded-2xl ${isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400'} flex items-center justify-center mx-auto mb-6`}>
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h5 className={`text-2xl font-extrabold font-serif ${textTitle} mb-2`}>
                  {t.eventSuccessTitle}
                </h5>
                <p className={`${textBody} text-sm mb-8 leading-relaxed`}>
                  {t.eventSuccessMessage}
                </p>
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className={`px-6 py-2.5 rounded-lg ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-200'} font-bold text-sm`}
                >
                  OK
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 10. PASTOR'S BLOG SECTION */}
      <section id="blog" className={`py-24 ${isLight ? 'bg-slate-50' : 'bg-slate-950'} border-t ${borderMain} relative overflow-hidden`}>
        {/* Background glow */}
        <div className={`absolute top-1/3 left-[10%] w-96 h-96 ${isLight ? 'bg-blue-500/3' : 'bg-blue-600/5'} rounded-full blur-3xl pointer-events-none`} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${isLight ? 'bg-blue-100 text-blue-800' : 'bg-blue-500/10 text-blue-400'} text-xs font-bold uppercase tracking-wider mb-4`}>
              <FileText className="w-3.5 h-3.5" />
              <span>{t.navBlog}</span>
            </div>
            <h2 className={`text-3xl md:text-5xl font-extrabold font-serif ${textTitle} tracking-tight mb-4`}>
              {language === 'fr_ht' ? 'Le regard du pasteur' : "Pastor's Weekly Perspective"}
            </h2>
            <p className={`${textMuted} text-base md:text-lg leading-relaxed`}>
              {language === 'fr_ht' 
                ? 'Chaque semaine, une nourriture spirituelle, des conseils pastoraux et des réflexions bibliques pour guider votre marche.'
                : "Weekly spiritual nourishment, pastoral counsel, and sacred reflections to guide your journey."}
            </p>
          </div>

          {blogPosts.length === 0 ? (
            <div className={`p-12 text-center rounded-2xl ${bgCard} max-w-xl mx-auto border-dashed`}>
              <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4 animate-pulse" />
              <p className={`${textMuted} font-medium`}>{t.adminBlogEmpty}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => {
                const title = language === 'fr_ht' ? post.title_kreyol : post.title_english;
                const content = language === 'fr_ht' ? post.content_kreyol : post.content_english;
                // Excerpt helper
                const excerpt = content.length > 150 ? content.slice(0, 150) + '...' : content;
                
                return (
                  <div 
                    key={post.id} 
                    className={`group rounded-3xl ${bgCard} overflow-hidden hover:shadow-2xl hover:scale-[1.02] border transition-all duration-300 flex flex-col h-full`}
                  >
                    {/* Decorative Header Bar */}
                    <div className="h-2 bg-gradient-to-r from-blue-600 via-amber-500 to-indigo-600" />
                    
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded-md ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-950 text-slate-400'}`}>
                          📅 {post.date}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/10 text-amber-400'}`}>
                          {language === 'fr_ht' ? 'Message de la semaine' : "Pastor's Word"}
                        </span>
                      </div>
                      
                      <h3 className={`text-xl font-bold font-serif ${textTitle} group-hover:text-amber-500 line-clamp-2 mb-3 transition-colors duration-300`}>
                        {title}
                      </h3>
                      
                      <p className={`${textBody} text-sm line-clamp-4 leading-relaxed mb-6 flex-1`}>
                        {excerpt}
                      </p>
                      
                      <button
                        onClick={() => setSelectedBlogPost(post)}
                        className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                          isLight 
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' 
                            : 'bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-850 hover:border-slate-800'
                        }`}
                      >
                        <span>{language === 'fr_ht' ? 'Lire la suite' : 'Read More'}</span>
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Blog Post Modal */}
        {selectedBlogPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
              onClick={() => setSelectedBlogPost(null)}
            />
            
            {/* Modal Box */}
            <div className={`relative w-full max-w-3xl rounded-3xl ${isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-900 text-slate-100 border-slate-800'} border shadow-2xl overflow-hidden max-h-[85vh] flex flex-col z-10 animate-scale-up`}>
              <div className="h-2 bg-gradient-to-r from-blue-600 via-amber-500 to-indigo-600" />
              
              {/* Header */}
              <div className="p-6 md:p-8 border-b border-slate-800/20 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-950 text-slate-400'}`}>
                      📅 {selectedBlogPost.date}
                    </span>
                    <span className="text-xs font-semibold text-amber-500 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{language === 'fr_ht' ? 'Message pastoral' : 'Pastoral Word'}</span>
                    </span>
                  </div>
                  <h3 className={`text-2xl md:text-3xl font-bold font-serif ${textTitle}`}>
                    {language === 'fr_ht' ? selectedBlogPost.title_kreyol : selectedBlogPost.title_english}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedBlogPost(null)}
                  className={`p-2 rounded-xl border ${isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-white'} transition-all`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Scrollable Content */}
              <div className="p-6 md:p-8 overflow-y-auto flex-1 leading-relaxed text-sm md:text-base space-y-6">
                <div className="whitespace-pre-wrap font-sans font-medium text-slate-350">
                  {language === 'fr_ht' ? selectedBlogPost.content_kreyol : selectedBlogPost.content_english}
                </div>
              </div>

              {/* Footer */}
              <div className={`p-4 md:p-6 border-t ${isLight ? 'border-slate-100 bg-slate-50' : 'border-slate-855 bg-slate-955/50'} flex justify-end`}>
                <button 
                  onClick={() => setSelectedBlogPost(null)}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all"
                >
                  {language === 'fr_ht' ? 'Fermer' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 11. PUBLIC PRAYER WALL SECTION */}
      <section id="prayer-wall" className={`py-24 ${isLight ? 'bg-slate-100/50' : 'bg-slate-900/30'} border-t ${borderMain} relative overflow-hidden`}>
        {/* Background glow */}
        <div className={`absolute bottom-1/4 right-[10%] w-96 h-96 ${isLight ? 'bg-amber-500/2' : 'bg-amber-500/4'} rounded-full blur-3xl pointer-events-none`} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/10 text-amber-400'} text-xs font-bold uppercase tracking-wider mb-4`}>
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>{t.prayerTitle}</span>
            </div>
            <h2 className={`text-3xl md:text-5xl font-extrabold font-serif ${textTitle} tracking-tight mb-4`}>
              {language === 'fr_ht' ? 'Mur public de prière' : 'Public Prayer Wall'}
            </h2>
            <p className={`${textMuted} text-base md:text-lg leading-relaxed`}>
              {t.prayerSubtitle}
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-12 items-start">
            {/* Left Form Column */}
            <div className="lg:col-span-2">
              <div className={`rounded-3xl ${bgCard} border p-6 md:p-8 shadow-xl relative overflow-hidden`}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-yellow-600" />
                
                <h3 className={`text-xl font-bold font-serif ${textTitle} mb-6 flex items-center gap-2`}>
                  <MessageSquare className="w-5 h-5 text-amber-500" />
                  <span>{t.prayerFormTitle}</span>
                </h3>

                <form onSubmit={handlePrayerSubmit} className="space-y-5">
                  {prayerSuccess && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold leading-relaxed flex items-start gap-2 animate-fade-in">
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{t.prayerSuccess}</span>
                    </div>
                  )}

                  {prayerError && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold leading-relaxed animate-fade-in">
                      {prayerError}
                    </div>
                  )}

                  <div>
                    <label className={`block text-xs font-bold uppercase ${textMuted} mb-1.5`}>
                      {t.prayerFieldName}
                    </label>
                    <input 
                      type="text" 
                      disabled={prayerIsAnonymous}
                      value={prayerName}
                      onChange={(e) => setPrayerName(e.target.value)}
                      placeholder={language === 'fr_ht' ? 'p. ex. Marie Dupont' : 'e.g. Brother Thomas'}
                      className={`w-full px-4 py-3 rounded-xl ${bgInput} focus:border-amber-500 focus:outline-none text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase ${textMuted} mb-1.5`}>
                      {language === 'fr_ht' ? 'Votre demande de prière' : 'Your Prayer Request'}
                    </label>
                    <textarea 
                      rows={5}
                      required
                      value={prayerText}
                      onChange={(e) => setPrayerText(e.target.value)}
                      placeholder={t.prayerFieldText} 
                      className={`w-full px-4 py-3 rounded-xl ${bgInput} focus:border-amber-500 focus:outline-none text-sm transition-all resize-none`}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="prayerAnon"
                      checked={prayerIsAnonymous}
                      onChange={(e) => {
                        setPrayerIsAnonymous(e.target.checked);
                        if (e.target.checked) setPrayerName('');
                      }}
                      className="w-4 h-4 rounded border-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 bg-slate-950 cursor-pointer"
                    />
                    <label htmlFor="prayerAnon" className={`text-sm font-semibold ${textBody} select-none cursor-pointer`}>
                      {t.prayerLabelAnonymous}
                    </label>
                  </div>

                  <button 
                    type="submit"
                    disabled={prayerSubmitting}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 disabled:opacity-50 font-extrabold text-sm shadow-xl shadow-amber-500/10 cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    {prayerSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{t.btnLoading}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{t.prayerBtnSubmit}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Right List Column */}
            <div className="lg:col-span-3">
              <div className={`rounded-3xl ${bgCardAlt} border p-6 md:p-8 shadow-inner overflow-hidden max-h-[580px] flex flex-col`}>
                <h3 className={`text-xl font-bold font-serif ${textTitle} mb-6 flex items-center justify-between`}>
                  <span>{language === 'fr_ht' ? 'Prières de la communauté' : 'Active Intercessions'}</span>
                  <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full">
                    {prayerRequests.length} {language === 'fr_ht' ? 'demandes' : 'requests'}
                  </span>
                </h3>

                {prayerRequests.length === 0 ? (
                  <div className="p-12 text-center my-auto">
                    <p className={`${textMuted} text-sm font-medium`}>{t.prayerEmpty}</p>
                  </div>
                ) : (
                  <div className="space-y-4 overflow-y-auto pr-2 scrollbar-thin flex-1">
                    {prayerRequests.map((req) => (
                      <div 
                        key={req.id} 
                        className={`p-5 rounded-2xl ${bgCard} border border-slate-850 hover:border-amber-500/20 transition-all duration-300 relative group`}
                      >
                        <Heart className="w-4 h-4 text-rose-500/20 absolute top-5 right-5 group-hover:scale-110 group-hover:text-rose-500 transition-all duration-300 fill-current" />
                        
                        <div className="flex items-center gap-2 mb-2.5">
                          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          <span className={`text-sm font-extrabold ${textTitle}`}>
                            {req.is_anonymous === 1 || !req.requester_name ? t.prayerCardAnonymous : req.requester_name}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500 ml-auto">
                            {req.created_at ? req.created_at.split('T')[0] : ''}
                          </span>
                        </div>
                        
                        <p className={`${textBody} text-sm leading-relaxed whitespace-pre-wrap italic font-medium`}>
                          "{req.request_text}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. PREMIUM CONTACT US SECTION */}
      <section id="contact" className={`py-24 ${isLight ? 'bg-white' : 'bg-slate-950'} border-t ${borderMain} relative overflow-hidden`}>
        {/* Background glow */}
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${isLight ? 'bg-blue-500/3' : 'bg-blue-600/5'} rounded-full blur-3xl pointer-events-none`} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            
            {/* Info details column */}
            <div className="lg:col-span-2">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${isLight ? 'bg-blue-100 text-blue-800' : 'bg-blue-500/10 text-blue-400'} text-xs font-bold uppercase tracking-wider mb-4`}>
                <Mail className="w-3.5 h-3.5" />
                <span>{t.contactTitle}</span>
              </div>
              <h2 className={`text-3xl md:text-5xl font-extrabold font-serif ${textTitle} tracking-tight mb-6 leading-tight`}>
                {language === 'fr_ht' ? 'Prenez contact avec notre communauté' : 'Reach Out to Our Leadership'}
              </h2>
              <p className={`${textBody} text-base md:text-lg leading-relaxed mb-8`}>
                {language === 'fr_ht' 
                  ? "Que vous ayez besoin d'un accompagnement pastoral, de prières pour votre famille ou de renseignements sur nos ministères, notre équipe est à votre écoute."
                  : "Whether you need pastoral care, a prayer cover, or have questions about our ministries, our team is always ready to receive and listen to you."}
              </p>

              <div className="space-y-4">
                <div className={`flex items-center gap-4 p-4 rounded-2xl ${bgCardAlt} border border-slate-850/50`}>
                  <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.contactPhone}</span>
                    <a href={`tel:${settings.church_phone || '+1 (954) 555-1234'}`} className={`text-sm font-bold ${textTitle} hover:text-blue-500 transition-colors`}>{settings.church_phone || '+1 (954) 555-1234'}</a>
                  </div>
                </div>

                <div className={`flex items-center gap-4 p-4 rounded-2xl ${bgCardAlt} border border-slate-850/50`}>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.contactEmail}</span>
                    <a href={`mailto:${settings.church_email || 'info@parousiabaptist.org'}`} className={`text-sm font-bold ${textTitle} hover:text-amber-500 transition-colors`}>{settings.church_email || 'info@parousiabaptist.org'}</a>
                  </div>
                </div>

                <div className={`flex items-center gap-4 p-4 rounded-2xl ${bgCardAlt} border border-slate-850/50`}>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.contactAddress}</span>
                    <span className={`text-sm font-bold ${textTitle}`}>{settings.church_address || '789 Community Blvd, Fort Lauderdale, FL 33311'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form column */}
            <div className="lg:col-span-3">
              <div className={`rounded-3xl ${bgCard} border p-6 md:p-8 shadow-2xl relative overflow-hidden`}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
                
                <h3 className={`text-xl font-bold font-serif ${textTitle} mb-6`}>
                  {t.contactFormTitle}
                </h3>

                <form onSubmit={handleContactSubmit} className="space-y-5">
                  {contactSuccess && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold leading-relaxed flex items-start gap-2 animate-fade-in">
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{t.contactSuccess}</span>
                    </div>
                  )}

                  {contactError && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold leading-relaxed animate-fade-in">
                      {contactError}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-bold uppercase ${textMuted} mb-1.5`}>
                        {t.contactFieldName}
                      </label>
                      <input 
                        type="text" 
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Jean Baptiste" 
                        className={`w-full px-4 py-3 rounded-xl ${bgInput} focus:border-blue-500 focus:outline-none text-sm transition-all`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold uppercase ${textMuted} mb-1.5`}>
                        {t.contactFieldEmail}
                      </label>
                      <input 
                        type="email" 
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="e.g. jean@gmail.com" 
                        className={`w-full px-4 py-3 rounded-xl ${bgInput} focus:border-blue-500 focus:outline-none text-sm transition-all`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase ${textMuted} mb-1.5`}>
                      {t.contactFieldPhone}
                    </label>
                    <input 
                      type="tel" 
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="e.g. (954) 555-1122" 
                      className={`w-full px-4 py-3 rounded-xl ${bgInput} focus:border-blue-500 focus:outline-none text-sm transition-all`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase ${textMuted} mb-1.5`}>
                      {t.contactFieldMessage}
                    </label>
                    <textarea 
                      rows={5}
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="..." 
                      className={`w-full px-4 py-3 rounded-xl ${bgInput} focus:border-blue-500 focus:outline-none text-sm transition-all resize-none`}
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={contactSubmitting}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:opacity-50 font-extrabold text-sm shadow-xl shadow-blue-500/10 cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    {contactSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{t.btnLoading}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{t.contactBtnSubmit}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. TITHES & OFFERINGS MODULE (OFRANN EK DIM) */}
      <section id="giving" className={`py-24 ${isLight ? 'bg-white border-t border-slate-200' : 'bg-slate-950 border-t border-slate-900'} relative`}>
        <div className={`absolute bottom-0 right-1/4 w-80 h-80 ${isLight ? 'bg-amber-500/3' : 'bg-amber-500/5'} rounded-full blur-3xl pointer-events-none`} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            
            {/* Left intro details */}
            <div className="lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">{t.navGiving}</h3>
              <h4 className={`text-4xl font-extrabold font-serif ${textTitle} mb-6 leading-tight`}>{t.givingTitle}</h4>
              <p className={`${textBody} text-base leading-relaxed mb-8`}>
                {t.givingSubtitle}
              </p>
              
              {/* Informative list */}
              <div className="space-y-4">
                <div className="flex gap-3">
                  <span className={`flex-shrink-0 w-6 h-6 rounded-md ${isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400'} flex items-center justify-center font-bold`}>✔</span>
                  <p className={`text-sm ${textBody} font-medium`}>{t.givingBullet1}</p>
                </div>
                <div className="flex gap-3">
                  <span className={`flex-shrink-0 w-6 h-6 rounded-md ${isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400'} flex items-center justify-center font-bold`}>✔</span>
                  <p className={`text-sm ${textBody} font-medium`}>{t.givingBullet2}</p>
                </div>
                <div className="flex gap-3">
                  <span className={`flex-shrink-0 w-6 h-6 rounded-md ${isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400'} flex items-center justify-center font-bold`}>✔</span>
                  <p className={`text-sm ${textBody} font-medium`}>{t.givingBullet3}</p>
                </div>
              </div>
            </div>

            {/* Right Interactive Card giving box */}
            <div className="lg:col-span-3">
              <div className={`rounded-3xl ${bgCard} p-6 md:p-8 relative`}>
                {settings.hide_stripe === 'true' ? (
                  /* EXCLUSIVE MOBILE TRANSFER HUB */
                  <div className="space-y-6">
                    {/* Navigation Tabs for Mobile Payment Hub */}
                    <div className={`flex flex-wrap gap-2 p-1.5 ${bgCardAltNested} rounded-2xl`}>
                      <button
                        onClick={() => setActiveGivingTab('zelle')}
                        className={`flex-1 min-w-[70px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center select-none ${
                          activeGivingTab === 'zelle'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10'
                            : isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        Zelle
                      </button>
                      {settings.show_cashapp !== 'false' && settings.cashapp_id && (
                        <button
                          onClick={() => setActiveGivingTab('cashapp')}
                          className={`flex-1 min-w-[70px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center select-none ${
                            activeGivingTab === 'cashapp'
                              ? 'bg-[#00D632] text-slate-950 shadow-lg shadow-[#00D632]/10'
                              : isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                          }`}
                        >
                          CashApp
                        </button>
                      )}
                      {settings.show_venmo !== 'false' && settings.venmo_id && (
                        <button
                          onClick={() => setActiveGivingTab('venmo')}
                          className={`flex-1 min-w-[70px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center select-none ${
                            activeGivingTab === 'venmo'
                              ? 'bg-[#008CFF] text-white shadow-lg shadow-[#008CFF]/10'
                              : isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                          }`}
                        >
                          Venmo
                        </button>
                      )}
                      {settings.show_apple_pay !== 'false' && settings.apple_pay_phone && (
                        <button
                          onClick={() => setActiveGivingTab('applepay')}
                          className={`flex-1 min-w-[70px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center select-none ${
                            activeGivingTab === 'applepay'
                              ? isLight ? 'bg-slate-900 text-white shadow-lg shadow-black/10' : 'bg-white text-slate-950 shadow-lg shadow-white/10'
                              : isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                          }`}
                        >
                          Apple Pay
                        </button>
                      )}
                      {settings.show_check !== 'false' && (
                        <button
                          onClick={() => setActiveGivingTab('check')}
                          className={`flex-1 min-w-[70px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center select-none ${
                            activeGivingTab === 'check'
                              ? isLight ? 'bg-slate-200 text-slate-900 shadow-md' : 'bg-slate-200 text-slate-950 shadow-lg shadow-white/10'
                              : isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                          }`}
                        >
                          {language === 'fr_ht' ? 'Chèque / Mandat' : 'Check / M.O.'}
                        </button>
                      )}
                    </div>

                    {/* Active Tab rendering */}
                    {activeGivingTab === 'zelle' && (
                      <div className="space-y-6">
                        <div className={`text-center pb-4 border-b ${borderDivider}`}>
                          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4 animate-pulse">
                            <span className="text-lg font-extrabold font-serif italic tracking-wide">zelle</span>
                          </div>
                          <h5 className={`text-xl font-extrabold ${textTitle}`}>
                            {language === 'fr_ht' ? 'Faire un don par Zelle' : 'Give via Zelle'}
                          </h5>
                          <p className={`text-xs ${textMuted} mt-2 max-w-sm mx-auto`}>
                            {language === 'fr_ht'
                              ? "Utilisez les renseignements suivants dans votre application bancaire pour effectuer le virement."
                              : "Use the following details in your banking app to complete your transfer directly."}
                          </p>
                        </div>

                        <div className="space-y-4">
                          {/* Recipient Name Card */}
                          <div className={`p-4 rounded-2xl ${bgCardAltNested} flex items-center justify-between group transition-all duration-300`}>
                            <div>
                              <span className={`block text-[10px] font-bold uppercase tracking-wider ${textMuted} mb-1`}>
                                {language === 'fr_ht' ? 'Nom du bénéficiaire' : 'Recipient Name'}
                              </span>
                              <span className={`text-sm font-bold ${textTitle} font-serif`}>
                                {settings.zelle_name || 'Eglise Baptiste de la Parousie'}
                              </span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleCopy(settings.zelle_name || 'Eglise Baptiste de la Parousie', 'name')}
                              className={`p-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                                copiedName 
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                  : isLight ? 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30'
                              }`}
                            >
                              {copiedName ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                           {/* Phone Number Card */}
                          <div className={`p-4 rounded-2xl ${bgCardAltNested} flex items-center justify-between group transition-all duration-300`}>
                            <div>
                              <span className={`block text-[10px] font-bold uppercase tracking-wider ${textMuted} mb-1`}>
                                {language === 'fr_ht' ? 'Numéro de téléphone Zelle' : 'Zelle Phone Number'}
                              </span>
                              <span className="text-base font-extrabold text-indigo-500 tracking-wider font-mono">
                                {settings.zelle_phone || '929 599 8809'}
                              </span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleCopy(settings.zelle_phone || '929 599 8809', 'phone')}
                              className={`p-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                                copiedPhone 
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                  : isLight ? 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30'
                              }`}
                            >
                              {copiedPhone ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className={`p-4 rounded-2xl ${isLight ? 'bg-indigo-50 border border-indigo-100 text-indigo-700' : 'bg-indigo-500/5 border border-indigo-500/10 text-indigo-300'} text-[11px] flex items-start gap-3`}>
                          <Sparkles className={`w-4 h-4 ${isLight ? 'text-indigo-600' : 'text-indigo-400'} shrink-0 mt-0.5`} />
                          <p className="leading-relaxed">
                            {language === 'fr_ht'
                              ? "Zelle est un moyen rapide et sécurisé de faire un don sans frais de transaction. Merci pour votre fidèle soutien !"
                              : "Zelle is a direct and secure way to give without any transaction fees. Thank you for your faithful support!"}
                          </p>
                        </div>
                      </div>
                    )}

                    {activeGivingTab === 'cashapp' && settings.show_cashapp !== 'false' && settings.cashapp_id && (
                      <div className="space-y-6">
                        <div className={`text-center pb-4 border-b ${borderDivider}`}>
                          <div className="inline-flex p-3 rounded-2xl bg-[#00D632]/10 border border-[#00D632]/20 text-[#00D632] mb-4 animate-pulse">
                            <span className="text-lg font-extrabold font-serif italic tracking-wide">CashApp</span>
                          </div>
                          <h5 className={`text-xl font-extrabold ${textTitle}`}>
                            {language === 'fr_ht' ? 'Faire un don par CashApp' : 'Give via CashApp'}
                          </h5>
                          <p className={`text-xs ${textMuted} mt-2 max-w-sm mx-auto`}>
                            {language === 'fr_ht'
                              ? "Scannez ou copiez cet identifiant pour effectuer votre don directement dans l'application CashApp."
                              : "Scan or copy this CashApp ID to make your donation directly in the CashApp application."}
                          </p>
                        </div>

                        <div className="space-y-4">
                          {/* Recipient Name Card */}
                          <div className={`p-4 rounded-2xl ${bgCardAltNested} flex items-center justify-between group transition-all duration-300`}>
                            <div>
                              <span className={`block text-[10px] font-bold uppercase tracking-wider ${textMuted} mb-1`}>
                                {language === 'fr_ht' ? 'Nom du bénéficiaire' : 'Recipient Name'}
                              </span>
                              <span className={`text-sm font-bold ${textTitle} font-serif`}>
                                Eglise Baptiste de la Parousie
                              </span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleCopy('Eglise Baptiste de la Parousie', 'name')}
                              className={`p-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                                copiedName 
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                  : isLight ? 'bg-white border-slate-200 text-slate-500 hover:text-[#00D632] hover:border-[#00D632]/30' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-[#00D632] hover:border-[#00D632]/30'
                              }`}
                            >
                              {copiedName ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>

                          {/* CashApp ID Card */}
                          <div className={`p-4 rounded-2xl ${bgCardAltNested} flex items-center justify-between group transition-all duration-300`}>
                            <div>
                              <span className={`block text-[10px] font-bold uppercase tracking-wider ${textMuted} mb-1`}>
                                CashApp ID
                              </span>
                              <span className="text-base font-extrabold text-[#00D632] tracking-wider font-mono">
                                {settings.cashapp_id}
                              </span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleCopy(settings.cashapp_id || '', 'cashapp')}
                              className={`p-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                                copiedCashapp 
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                  : isLight ? 'bg-white border-slate-200 text-slate-500 hover:text-[#00D632] hover:border-[#00D632]/30' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-[#00D632] hover:border-[#00D632]/30'
                              }`}
                            >
                              {copiedCashapp ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className={`p-4 rounded-2xl ${isLight ? 'bg-[#00D632]/10 border border-[#00D632]/20 text-[#00a324]' : 'bg-[#00D632]/5 border border-[#00D632]/10 text-[#00D632]/80'} text-[11px] flex items-start gap-3`}>
                          <Sparkles className="w-4 h-4 text-[#00D632] shrink-0 mt-0.5" />
                          <p className="leading-relaxed">
                            {language === 'fr_ht'
                              ? "CashApp vous permet d'envoyer rapidement votre don sans frais de transaction. Merci pour votre générosité !"
                              : "CashApp allows you to send offerings instantly without any fees. Thank you for your generosity!"}
                          </p>
                        </div>
                      </div>
                    )}

                    {activeGivingTab === 'venmo' && settings.show_venmo !== 'false' && settings.venmo_id && (
                      <div className="space-y-6">
                        <div className={`text-center pb-4 border-b ${borderDivider}`}>
                          <div className="inline-flex p-3 rounded-2xl bg-[#008CFF]/10 border border-[#008CFF]/20 text-[#008CFF] mb-4 animate-pulse">
                            <span className="text-lg font-extrabold font-serif italic tracking-wide">Venmo</span>
                          </div>
                          <h5 className={`text-xl font-extrabold ${textTitle}`}>
                            {language === 'fr_ht' ? 'Faire un don par Venmo' : 'Give via Venmo'}
                          </h5>
                          <p className={`text-xs ${textMuted} mt-2 max-w-sm mx-auto`}>
                            {language === 'fr_ht'
                              ? "Copiez cet identifiant Venmo pour effectuer votre don rapidement et en toute sécurité."
                              : "Copy this Venmo ID to complete your donation safely within the Venmo app."}
                          </p>
                        </div>

                        <div className="space-y-4">
                          {/* Recipient Name Card */}
                          <div className={`p-4 rounded-2xl ${bgCardAltNested} flex items-center justify-between group transition-all duration-300`}>
                            <div>
                              <span className={`block text-[10px] font-bold uppercase tracking-wider ${textMuted} mb-1`}>
                                {language === 'fr_ht' ? 'Nom du bénéficiaire' : 'Recipient Name'}
                              </span>
                              <span className={`text-sm font-bold ${textTitle} font-serif`}>
                                Eglise Baptiste de la Parousie
                              </span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleCopy('Eglise Baptiste de la Parousie', 'name')}
                              className={`p-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                                copiedName 
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                  : isLight ? 'bg-white border-slate-200 text-slate-500 hover:text-[#008CFF] hover:border-[#008CFF]/30' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-[#008CFF] hover:border-[#008CFF]/30'
                              }`}
                            >
                              {copiedName ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>

                          {/* Venmo ID Card */}
                          <div className={`p-4 rounded-2xl ${bgCardAltNested} flex items-center justify-between group transition-all duration-300`}>
                            <div>
                              <span className={`block text-[10px] font-bold uppercase tracking-wider ${textMuted} mb-1`}>
                                Venmo ID
                              </span>
                              <span className="text-base font-extrabold text-[#008CFF] tracking-wider font-mono">
                                {settings.venmo_id}
                              </span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleCopy(settings.venmo_id || '', 'venmo')}
                              className={`p-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                                copiedVenmo 
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                  : isLight ? 'bg-white border-slate-200 text-slate-500 hover:text-[#008CFF] hover:border-[#008CFF]/30' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-[#008CFF] hover:border-[#008CFF]/30'
                              }`}
                            >
                              {copiedVenmo ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className={`p-4 rounded-2xl ${isLight ? 'bg-[#008CFF]/10 border border-[#008CFF]/20 text-[#0070db]' : 'bg-[#008CFF]/5 border border-[#008CFF]/10 text-[#008CFF]/80'} text-[11px] flex items-start gap-3`}>
                          <Sparkles className="w-4 h-4 text-[#008CFF] shrink-0 mt-0.5" />
                          <p className="leading-relaxed">
                            {language === 'fr_ht'
                              ? "Venmo est un moyen simple de soutenir notre communauté sans frais supplémentaires. Que Dieu vous bénisse !"
                              : "Venmo is a simple way to support our community without additional fees. God bless you!"}
                          </p>
                        </div>
                      </div>
                    )}

                    {activeGivingTab === 'applepay' && settings.show_apple_pay !== 'false' && settings.apple_pay_phone && (
                      <div className="space-y-6">
                        <div className={`text-center pb-4 border-b ${borderDivider}`}>
                          <div className={`inline-flex p-3 rounded-2xl ${isLight ? 'bg-slate-100 border border-slate-200 text-slate-800' : 'bg-white/10 border border-white/20 text-white'} mb-4 animate-pulse`}>
                            <span className="text-lg font-extrabold font-serif italic tracking-wide">Apple Pay</span>
                          </div>
                          <h5 className={`text-xl font-extrabold ${textTitle}`}>
                            {language === 'fr_ht' ? 'Faire un don par Apple Pay' : 'Give via Apple Pay'}
                          </h5>
                          <p className={`text-xs ${textMuted} mt-2 max-w-sm mx-auto`}>
                            {language === 'fr_ht'
                              ? "Utilisez ce numéro de téléphone ou cette adresse e-mail dans iMessage ou Apple Wallet pour envoyer votre don."
                              : "Use the following phone number/email directly in iMessage or your Apple Wallet to make a payment."}
                          </p>
                        </div>

                        <div className="space-y-4">
                          {/* Recipient Name Card */}
                          <div className={`p-4 rounded-2xl ${bgCardAltNested} flex items-center justify-between group transition-all duration-300`}>
                            <div>
                              <span className={`block text-[10px] font-bold uppercase tracking-wider ${textMuted} mb-1`}>
                                {language === 'fr_ht' ? 'Nom du bénéficiaire' : 'Recipient Name'}
                              </span>
                              <span className={`text-sm font-bold ${textTitle} font-serif`}>
                                Eglise Baptiste de la Parousie
                              </span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleCopy('Eglise Baptiste de la Parousie', 'name')}
                              className={`p-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                                copiedName 
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                  : isLight ? 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-white/30'
                              }`}
                            >
                              {copiedName ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>

                          {/* Apple Pay Phone/Email Card */}
                          <div className={`p-4 rounded-2xl ${bgCardAltNested} flex items-center justify-between group transition-all duration-300`}>
                            <div>
                              <span className={`block text-[10px] font-bold uppercase tracking-wider ${textMuted} mb-1`}>
                                {language === 'fr_ht' ? 'Téléphone / e-mail Apple Pay' : 'Apple Pay Phone / Email'}
                              </span>
                              <span className={`text-base font-extrabold ${isLight ? 'text-slate-800' : 'text-slate-200'} tracking-wider font-mono`}>
                                {settings.apple_pay_phone}
                              </span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleCopy(settings.apple_pay_phone || '', 'applepay')}
                              className={`p-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                                copiedApplePay 
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                  : isLight ? 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-white/30'
                              }`}
                            >
                              {copiedApplePay ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className={`p-4 rounded-2xl ${isLight ? 'bg-slate-100 border border-slate-200 text-slate-700' : 'bg-white/5 border border-white/10 text-white/80'} text-[11px] flex items-start gap-3`}>
                          <Sparkles className={`w-4 h-4 ${isLight ? 'text-slate-600' : 'text-white'} shrink-0 mt-0.5`} />
                          <p className="leading-relaxed">
                            {language === 'fr_ht'
                              ? "Apple Pay permet des virements mobiles rapides et sécurisés, sans frais de transaction. Merci !"
                              : "Apple Pay provides secure, instant transfers without any platform transaction fees. Thank you!"}
                          </p>
                        </div>
                      </div>
                    )}

                    {activeGivingTab === 'check' && settings.show_check !== 'false' && (
                      <div className="space-y-6">
                        <div className={`text-center pb-4 border-b ${borderDivider}`}>
                          <div className={`inline-flex p-3 rounded-2xl ${isLight ? 'bg-slate-100 border border-slate-200 text-amber-600' : 'bg-slate-800 border border-slate-700 text-slate-300'} mb-4 animate-pulse`}>
                            <CreditCard className="w-5 h-5 text-amber-500" />
                          </div>
                          <h5 className={`text-xl font-extrabold ${textTitle}`}>
                            {language === 'fr_ht' ? 'Chèque ou mandat' : 'Check or Money Order'}
                          </h5>
                          <p className={`text-xs ${textMuted} mt-2 max-w-sm mx-auto`}>
                            {language === 'fr_ht'
                              ? "Vous pouvez libeller un chèque ou un mandat et l'envoyer à l'adresse ci-dessous."
                              : "You can write a check or money order and mail it to our address below."}
                          </p>
                        </div>

                        <div className="space-y-4">
                          {/* Payable to */}
                          <div className={`p-4 rounded-2xl ${bgCardAltNested} flex items-center justify-between group transition-all duration-300`}>
                            <div className="min-w-0 flex-1 pr-3">
                              <span className={`block text-[10px] font-bold uppercase tracking-wider ${textMuted} mb-1`}>
                                {language === 'fr_ht' ? "À l'ordre de" : 'Pay to the order of'}
                              </span>
                              <span className={`text-sm font-bold ${textTitle} font-serif block truncate`}>
                                {settings.check_payable_to || 'Eglise Baptiste de la Parousie'}
                              </span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleCopy(settings.check_payable_to || 'Eglise Baptiste de la Parousie', 'payableto')}
                              className={`p-2.5 rounded-lg border transition-all duration-200 cursor-pointer shrink-0 ${
                                copiedPayableTo 
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                  : isLight ? 'bg-white border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/30'
                              }`}
                            >
                              {copiedPayableTo ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>

                          {/* Mailing Address */}
                          <div className={`p-4 rounded-2xl ${bgCardAltNested} flex items-center justify-between group transition-all duration-300`}>
                            <div className="min-w-0 flex-1 pr-3">
                              <span className={`block text-[10px] font-bold uppercase tracking-wider ${textMuted} mb-1`}>
                                {language === 'fr_ht' ? 'Adresse postale' : 'Mailing Address'}
                              </span>
                              <span className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-300'} font-mono block whitespace-pre-line leading-relaxed`}>
                                {settings.church_address || settings.check_mailing_address || '789 Community Blvd, Fort Lauderdale, FL 33311'}
                              </span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleCopy(settings.church_address || settings.check_mailing_address || '789 Community Blvd, Fort Lauderdale, FL 33311', 'mailaddr')}
                              className={`p-2.5 rounded-lg border transition-all duration-200 cursor-pointer shrink-0 ${
                                copiedMailingAddress 
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                  : isLight ? 'bg-white border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/30'
                              }`}
                            >
                              {copiedMailingAddress ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className={`p-4 rounded-2xl ${isLight ? 'bg-amber-50 border border-amber-100 text-amber-700' : 'bg-amber-500/5 border border-amber-500/10 text-amber-300'} text-[11px] flex items-start gap-3`}>
                          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <p className="leading-relaxed">
                            {language === 'fr_ht'
                              ? "Merci pour votre générosité et votre fidélité envers l'œuvre de Dieu !"
                              : "Thank you for your generous check or money order contribution to support God's ministry!"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  givingSuccess ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8" />
                      </div>
                      <h5 className={`text-2xl font-extrabold font-serif ${textTitle} mb-2`}>{t.givingSuccessTitle}</h5>
                      <p className={`${textMuted} text-sm leading-relaxed mb-8 max-w-sm mx-auto`}>
                        {t.givingSuccessMessage}
                      </p>
                      
                      {/* Simulated receipt */}
                      <div className={`rounded-xl ${isLight ? 'bg-slate-50 border border-slate-200 text-slate-500' : 'bg-slate-950 border border-slate-850 text-slate-400'} p-4 max-w-xs mx-auto mb-8 text-left text-xs font-mono space-y-1.5`}>
                        <div className="flex justify-between"><span>Trans:</span><span className={isLight ? 'text-slate-800' : 'text-slate-200'}>{givingTxId}</span></div>
                        <div className="flex justify-between"><span>Dest:</span><span className={isLight ? 'text-slate-800' : 'text-slate-200'}>{giveFund}</span></div>
                        <div className="flex justify-between"><span>{language === 'fr_ht' ? 'Fréquence' : 'Frequency'}:</span><span className={isLight ? 'text-slate-800' : 'text-slate-200'}>{giveFreq === 'monthly' ? (language === 'fr_ht' ? 'Mensuel' : 'Monthly') : (language === 'fr_ht' ? 'Ponctuel' : 'One-time')}</span></div>
                        <div className={`flex justify-between border-t ${isLight ? 'border-slate-200' : 'border-slate-800'} pt-1.5 text-sm font-bold`}><span>Total:</span><span className="text-amber-500">${isCustomAmount ? customAmount : giveAmount} USD</span></div>
                      </div>

                      <button 
                        onClick={() => setGivingSuccess(false)}
                        className={`px-6 py-2.5 rounded-lg border text-sm font-bold transition-all ${
                          isLight 
                            ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm' 
                            : 'bg-slate-950 hover:bg-slate-850 text-slate-200 border-slate-800'
                        }`}
                      >
                        {language === 'fr_ht' ? 'Faire un autre don' : 'Make another offering'}
                      </button>
                    </div>
                  ) : (
                    <>
                      <form onSubmit={handleGivingSubmit}>
                        
                        {/* Fund destination selector */}
                        <div className="mb-6">
                          <label className={`block text-xs font-bold uppercase ${textMuted} mb-2`}>{t.givingLabelFund}</label>
                          <select 
                            value={giveFund}
                            onChange={(e) => setGiveFund(e.target.value)}
                            className={`w-full px-4 py-3 rounded-lg ${bgInputAlt} text-sm font-semibold focus:outline-none cursor-pointer`}
                          >
                            <option value="General Fund">{t.givingFundGeneral}</option>
                            <option value="Local Outreach">{t.givingFundOutreach}</option>
                            <option value="Haiti Missions">{t.givingFundMissions}</option>
                          </select>
                        </div>

                        {/* Preselected Amounts */}
                        <div className="mb-6">
                          <label className={`block text-xs font-bold uppercase ${textMuted} mb-2`}>{t.givingLabelAmount}</label>
                          
                          {!isCustomAmount ? (
                            <div className="grid grid-cols-4 gap-3 mb-3">
                              {['10', '25', '50', '100'].map((amt) => (
                                <button
                                  key={amt}
                                  type="button"
                                  onClick={() => setRegGiveAmount(amt)}
                                  className={`py-3 rounded-lg border text-sm font-bold transition-all cursor-pointer ${
                                    giveAmount === amt 
                                      ? 'bg-amber-500 border-amber-500 text-slate-950' 
                                      : isLight 
                                        ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50' 
                                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                                  }`}
                                >
                                  ${amt}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="relative mb-3">
                              <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold ${textMuted} text-lg`}>$</span>
                              <input 
                                type="number" 
                                required
                                min="1"
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value)}
                                placeholder="Amount in USD" 
                                className={`w-full pl-8 pr-4 py-3 rounded-lg ${bgInputAlt} focus:outline-none text-base font-bold`}
                              />
                            </div>
                          )}

                          {/* Toggle Custom button */}
                          <button
                            type="button"
                            onClick={() => setIsCustomAmount(!isCustomAmount)}
                            className="text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors cursor-pointer"
                          >
                            {isCustomAmount ? (language === 'fr_ht' ? 'Choisir un montant prédéfini' : 'Choose pre-set amount') : (language === 'fr_ht' ? 'Saisir un autre montant' : 'Enter custom amount')}
                          </button>
                        </div>

                        {/* Frequency */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <button
                            type="button"
                            onClick={() => setGiveFreq('once')}
                            className={`py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              giveFreq === 'once' 
                                ? (isLight ? 'bg-slate-800 border-slate-800 text-white' : 'bg-slate-850 border-slate-750 text-white') 
                                : (isLight ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50' : 'bg-slate-950 border-slate-850 text-slate-400')
                            }`}
                          >
                            {t.givingFreqOnce}
                          </button>
                          <button
                            type="button"
                            onClick={() => setGiveFreq('monthly')}
                            className={`py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              giveFreq === 'monthly' 
                                ? (isLight ? 'bg-slate-800 border-slate-800 text-white' : 'bg-slate-850 border-slate-750 text-white') 
                                : (isLight ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50' : 'bg-slate-950 border-slate-850 text-slate-400')
                            }`}
                          >
                            {t.givingFreqMonthly}
                          </button>
                        </div>

                        {/* Secure Credit Card info inputs */}
                        <div className={`p-4 rounded-2xl ${bgCardAltNested} mb-6 space-y-4`}>
                          <div className={`flex items-center gap-1.5 ${textMuted} text-xs font-semibold uppercase tracking-wider mb-2`}>
                            <Lock className="w-3.5 h-3.5 text-blue-500" />
                            <span>{language === 'fr_ht' ? 'Paiement sécurisé par chiffrement SSL' : 'Secured SSL'}</span>
                          </div>

                          <div>
                            <label className={`block text-[10px] font-bold uppercase ${textMuted} mb-1`}>{t.givingCardName}</label>
                            <input 
                              type="text" 
                              required
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                              placeholder="e.g. Jean Robert" 
                              className={`w-full px-3 py-2 rounded ${bgInput} focus:outline-none text-xs transition-all font-medium`}
                            />
                          </div>

                          <div>
                            <label className={`block text-[10px] font-bold uppercase ${textMuted} mb-1`}>{t.givingCardNumber}</label>
                            <div className="relative">
                              <input 
                                type="text" 
                                required
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                placeholder="4242 •••• •••• 4242" 
                                className={`w-full pl-9 pr-3 py-2 rounded ${bgInput} focus:outline-none text-xs transition-all font-medium font-mono`}
                              />
                              <CreditCard className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={`block text-[10px] font-bold uppercase ${textMuted} mb-1`}>Expiry Date</label>
                              <input 
                                type="text" 
                                required
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                placeholder="MM / YY" 
                                className={`w-full px-3 py-2 rounded ${bgInput} focus:outline-none text-xs transition-all font-medium font-mono`}
                              />
                            </div>
                            <div>
                              <label className={`block text-[10px] font-bold uppercase ${textMuted} mb-1`}>CVC Code</label>
                              <input 
                                type="password" 
                                required
                                maxLength={3}
                                value={cardCvc}
                                onChange={(e) => setCardCVC(e.target.value)}
                                placeholder="•••" 
                                className={`w-full px-3 py-2 rounded ${bgInput} focus:outline-none text-xs transition-all font-medium font-mono`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={givingLoading}
                          className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/10 cursor-pointer"
                        >
                          {givingLoading ? t.btnLoading : t.btnGive}
                        </button>

                      </form>

                      {/* Mobile Payment Alternatives */}
                      <div className={`mt-6 pt-6 border-t ${borderDivider}`}>
                        <h6 className={`text-[10px] font-bold uppercase tracking-wider ${textMuted} mb-3 text-center`}>
                          {language === 'fr_ht' ? 'Ou faites un don par virement mobile direct' : 'Or give via direct mobile transfer'}
                        </h6>
                        <div className="space-y-2.5">
                          {/* Zelle */}
                          <div className={`p-3 rounded-xl ${bgCardAltNested} flex items-center justify-between gap-3 text-xs`}>
                            <div className="flex items-center gap-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-serif font-extrabold italic bg-indigo-500/10 text-indigo-400 select-none">
                                zelle
                              </span>
                              <span className={`font-mono font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>{settings.zelle_phone || '929 599 8809'}</span>
                            </div>
                            <div className="flex gap-1.5">
                              <button 
                                type="button"
                                onClick={() => handleCopy(settings.zelle_phone || '929 599 8809', 'phone')}
                                className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded border ${
                                  isLight 
                                    ? 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300' 
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-400'
                                } text-[10px] font-semibold transition-all cursor-pointer`}
                              >
                                {copiedPhone ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedPhone ? (language === 'fr_ht' ? 'Copié' : 'Copied') : (language === 'fr_ht' ? 'Copier' : 'Copy')}</span>
                              </button>
                            </div>
                          </div>

                          {/* CashApp */}
                          {settings.show_cashapp !== 'false' && settings.cashapp_id && (
                            <div className={`p-3 rounded-xl ${bgCardAltNested} flex items-center justify-between gap-3 text-xs`}>
                              <div className="flex items-center gap-2.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-[#00D632]/10 text-[#00D632] select-none">
                                  CashApp
                                </span>
                                <span className={`font-mono font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>{settings.cashapp_id}</span>
                              </div>
                              <div className="flex gap-1.5">
                                <button 
                                  type="button"
                                  onClick={() => handleCopy(settings.cashapp_id || '', 'cashapp')}
                                  className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded border ${
                                    isLight 
                                      ? 'bg-white border-slate-200 text-slate-500 hover:text-[#00D632] hover:border-[#00D632]/35' 
                                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-[#00D632]'
                                  } text-[10px] font-semibold transition-all cursor-pointer`}
                                >
                                  {copiedCashapp ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedCashapp ? (language === 'fr_ht' ? 'Copié' : 'Copied') : (language === 'fr_ht' ? 'Copier' : 'Copy')}</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Venmo */}
                          {settings.show_venmo !== 'false' && settings.venmo_id && (
                            <div className={`p-3 rounded-xl ${bgCardAltNested} flex items-center justify-between gap-3 text-xs`}>
                              <div className="flex items-center gap-2.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-[#008CFF]/10 text-[#008CFF] select-none">
                                  Venmo
                                </span>
                                <span className={`font-mono font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>{settings.venmo_id}</span>
                              </div>
                              <div className="flex gap-1.5">
                                <button 
                                  type="button"
                                  onClick={() => handleCopy(settings.venmo_id || '', 'venmo')}
                                  className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded border ${
                                    isLight 
                                      ? 'bg-white border-slate-200 text-slate-500 hover:text-[#008CFF] hover:border-[#008CFF]/35' 
                                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-[#008CFF]'
                                  } text-[10px] font-semibold transition-all cursor-pointer`}
                                >
                                  {copiedVenmo ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedVenmo ? (language === 'fr_ht' ? 'Copié' : 'Copied') : (language === 'fr_ht' ? 'Copier' : 'Copy')}</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Apple Pay */}
                          {settings.show_apple_pay !== 'false' && settings.apple_pay_phone && (
                            <div className={`p-3 rounded-xl ${bgCardAltNested} flex items-center justify-between gap-3 text-xs`}>
                              <div className="flex items-center gap-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${isLight ? 'bg-slate-200 text-slate-800' : 'bg-white/10 text-white'} select-none`}>
                                  Apple Pay
                                </span>
                                <span className={`font-mono font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>{settings.apple_pay_phone}</span>
                              </div>
                              <div className="flex gap-1.5">
                                <button 
                                  type="button"
                                  onClick={() => handleCopy(settings.apple_pay_phone || '', 'applepay')}
                                  className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded border ${
                                    isLight 
                                      ? 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300' 
                                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                  } text-[10px] font-semibold transition-all cursor-pointer`}
                                >
                                  {copiedApplePay ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedApplePay ? (language === 'fr_ht' ? 'Copié' : 'Copied') : (language === 'fr_ht' ? 'Copier' : 'Copy')}</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Check / Money Order */}
                          {settings.show_check !== 'false' && (
                            <div className={`p-3 rounded-xl ${bgCardAltNested} flex flex-col gap-2.5 text-xs`}>
                              <div className="flex items-center justify-between">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'} select-none`}>
                                  {language === 'fr_ht' ? 'Chèque ou mandat' : 'Check / Money Order'}
                                </span>
                              </div>
                              <div className="grid sm:grid-cols-2 gap-2">
                                <div className={`p-2 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} border rounded-lg flex items-center justify-between`}>
                                  <div className="min-w-0 flex-1 pr-1">
                                    <span className="block text-[8px] uppercase tracking-wider text-slate-500">{language === 'fr_ht' ? "À l'ordre de" : 'Pay to'}</span>
                                    <span className={`text-[11px] font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'} block truncate`}>{settings.check_payable_to || 'Eglise Baptiste de la Parousie'}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(settings.check_payable_to || 'Eglise Baptiste de la Parousie', 'payableto')}
                                    className={`p-1.5 rounded cursor-pointer shrink-0 transition-colors ${
                                      isLight 
                                        ? 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-amber-600 border border-slate-200' 
                                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-400'
                                    }`}
                                  >
                                    {copiedPayableTo ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                                <div className={`p-2 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} border rounded-lg flex items-center justify-between`}>
                                  <div className="min-w-0 flex-1 pr-1">
                                    <span className="block text-[8px] uppercase tracking-wider text-slate-500">{language === 'fr_ht' ? 'Adresse' : 'Mailing address'}</span>
                                    <span className={`text-[11px] font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'} block truncate`}>{settings.church_address || settings.check_mailing_address || '789 Community Blvd, Fort Lauderdale, FL 33311'}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(settings.church_address || settings.check_mailing_address || '789 Community Blvd, Fort Lauderdale, FL 33311', 'mailaddr')}
                                    className={`p-1.5 rounded cursor-pointer shrink-0 transition-colors ${
                                      isLight 
                                        ? 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-amber-600 border border-slate-200' 
                                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-400'
                                    }`}
                                  >
                                    {copiedMailingAddress ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Global Copy Beneficiary Name Button */}
                          <div className="text-center mt-2">
                            <button 
                              type="button"
                              onClick={() => handleCopy('Eglise Baptiste de la Parousie', 'name')}
                              className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border ${
                                isLight 
                                  ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800 shadow-sm' 
                                  : 'bg-slate-950/40 hover:bg-slate-950/80 border-slate-900 text-slate-500 hover:text-slate-300'
                              } text-[10px] font-bold transition-all cursor-pointer`}
                            >
                              {copiedName ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedName ? (language === 'fr_ht' ? 'Nom du bénéficiaire copié !' : 'Copied Name!') : (language === 'fr_ht' ? 'Copier le nom du bénéficiaire' : 'Copy Beneficiary Name')}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )
                )}

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 7.5 LEAD CAPTURE SECTION (FREE DEVOTIONAL) */}
      <section id="devotional-gift" className={`py-20 border-t ${borderMain} relative overflow-hidden`}>
        {/* Decorative ambient blobs */}
        <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl pointer-events-none ${isLight ? 'bg-amber-500/5' : 'bg-amber-500/10'}`} />
        <div className={`absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl pointer-events-none ${isLight ? 'bg-blue-500/5' : 'bg-blue-500/10'}`} />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className={`rounded-3xl ${bgCard} p-8 md:p-12 shadow-2xl relative overflow-hidden`}>
            
            {/* Overlay gradient accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-blue-500 to-amber-600" />
            
            <div className="grid md:grid-cols-5 gap-10 items-center">
              
              {/* Left Column: Premium Visual of the Devotional */}
              <div className="md:col-span-2 flex flex-col items-center text-center md:text-left md:items-start">
                <div className={`relative w-48 h-64 rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between p-6 ${
                  isLight 
                    ? 'bg-gradient-to-b from-amber-50 to-slate-100 border border-slate-200' 
                    : 'bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800'
                } group hover:scale-105 transition-all duration-300`}>
                  
                  {/* Spine effect */}
                  <div className="absolute left-0 top-0 h-full w-3 bg-gradient-to-r from-amber-600 to-amber-500/50 rounded-l-2xl" />
                  
                  <div className="flex justify-between items-start pl-2">
                    <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                    <span className="text-[10px] font-bold tracking-widest text-amber-500 uppercase">{language === 'fr_ht' ? 'Gratuit' : 'Free'}</span>
                  </div>
                  
                  <div className="pl-2 my-auto">
                    <BookOpen className="w-12 h-12 text-blue-500 mb-3" />
                    <h5 className={`font-serif font-extrabold text-base leading-tight ${textTitle}`}>
                      {language === 'fr_ht' ? (settings.free_gift_title_kreyol || 'Méditations Parousie 2026') : (settings.free_gift_title_english || 'Parousie Devotional 2026')}
                    </h5>
                    <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {language === 'fr_ht' ? 'Méditations et versets' : 'Meditations & Verses'}
                    </p>
                  </div>
                  
                  <div className="pl-2 flex justify-between items-center text-[9px] font-semibold border-t border-slate-200/20 pt-2">
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>{t.churchName}</span>
                  </div>
                </div>
                
                <h4 className={`text-2xl font-extrabold font-serif ${textTitle} mt-6 mb-3`}>
                  {language === 'fr_ht' ? (settings.free_gift_title_kreyol || 'Méditations Parousie 2026') : (settings.free_gift_title_english || t.leadSectionTitle)}
                </h4>
                <p className={`text-sm ${textBody} leading-relaxed max-w-sm`}>
                  {language === 'fr_ht' ? (settings.free_gift_desc_kreyol || 'Recevez gratuitement ce recueil de méditations et de versets pour nourrir votre foi au quotidien.') : (settings.free_gift_desc_english || t.leadSectionSubtitle)}
                </p>
              </div>
              
              {/* Right Column: Interaction Form */}
              <div className="md:col-span-3">
                {!leadSubmitted ? (
                  <form onSubmit={handleLeadSubmit} className="space-y-4">
                    {leadError && (
                      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                        {leadError}
                      </div>
                    )}
                    
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        {t.leadFieldName}
                      </label>
                      <input 
                        type="text" 
                        required
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        placeholder="Jean-Claude Pierre"
                        className={`w-full px-4 py-3 rounded-xl text-sm ${bgInput} focus:outline-none focus:border-amber-500 transition-all`}
                      />
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                          {t.leadFieldEmail}
                        </label>
                        <input 
                          type="email" 
                          required
                          value={leadEmail}
                          onChange={(e) => setLeadEmail(e.target.value)}
                          placeholder="jean@example.com"
                          className={`w-full px-4 py-3 rounded-xl text-sm ${bgInput} focus:outline-none focus:border-amber-500 transition-all`}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                          {t.leadFieldPhone}
                        </label>
                        <input 
                          type="tel" 
                          required
                          value={leadPhone}
                          onChange={(e) => setLeadPhone(e.target.value)}
                          placeholder="954-555-1234"
                          className={`w-full px-4 py-3 rounded-xl text-sm ${bgInput} focus:outline-none focus:border-amber-500 transition-all`}
                        />
                      </div>
                    </div>
                    
                    <button 
                      type="submit"
                      disabled={leadSubmitting}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {leadSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{t.btnLoading}</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>{t.leadBtnSubmit}</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-6 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 animate-bounce">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h5 className={`text-2xl font-extrabold ${textTitle} mb-3`}>
                      {t.leadSuccessTitle}
                    </h5>
                    <p className={`text-sm ${textBody} leading-relaxed max-w-md mb-8`}>
                      {t.leadSuccessMessage}
                    </p>
                    
                    <a 
                      href={settings.free_gift_file_url || "/devotional_parousie_2026.txt"}
                      download={(settings.free_gift_file_url || "/devotional_parousie_2026.txt").split('/').pop()}
                      onClick={handleGiftDownloadClick}
                      className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-sm shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      <FileText className="w-5 h-5" />
                      <span>{t.leadDownloadBtn}</span>
                    </a>
                  </div>
                )}
              </div>
              
            </div>
            
          </div>
        </div>
      </section>

      {/* 8. FOOTER & CONTACT SECTION */}
      <footer className={`${bgFooter} border-t ${borderMain} pt-20 pb-8 relative`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid md:grid-cols-3 gap-12 mb-16">
            
            {/* Church column */}
            <div>
              <a 
                href="#home" 
                onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}
                className="flex items-center gap-2 mb-4 cursor-pointer group"
              >
                <div className={`w-8 h-8 rounded bg-white border ${isLight ? 'border-slate-200' : 'border-slate-800'} overflow-hidden flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform duration-300`}>
                  <img src={logoUrl} alt="Eglise Baptiste de la Parousie Logo" className="w-full h-full object-contain" />
                </div>
                <h5 className={`font-bold font-serif text-lg ${textTitle} group-hover:text-amber-500 transition-colors duration-300`}>{t.churchName}</h5>
              </a>
              <p className={`text-sm leading-relaxed mb-6 font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {language === 'fr_ht' ? settings.pastor_message_kreyol : settings.pastor_message_english}
              </p>
            </div>

            {/* Contacts column */}
            <div>
              <h5 className={`font-bold uppercase text-xs tracking-widest mb-4 ${textTitle}`}>{t.contactTitle}</h5>
              
              <ul className={`space-y-4 text-sm font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <li className="flex gap-2.5 items-start">
                  <Phone className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>{settings.church_phone || '+1 (954) 555-1234'}</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <Mail className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>{settings.church_email || 'info@eglizparousie.org'}</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>{settings.church_address || '789 Community Blvd, Fort Lauderdale, FL 33311'}</span>
                </li>
              </ul>
            </div>

            {/* Portals Column */}
            <div>
              <h5 className={`font-bold uppercase text-xs tracking-widest mb-4 ${textTitle}`}>Portals & Links</h5>
              <div className="flex flex-col gap-3 text-sm">
                {!showAdminNav && (
                  <a href="/admin?from=site" className={`inline-flex items-center gap-1.5 transition-colors font-semibold ${isLight ? 'text-slate-600 hover:text-amber-600' : 'text-slate-300 hover:text-amber-400'}`}>
                    <Lock className="w-3.5 h-3.5 text-blue-500" />
                    <span>{t.navAdmin}</span>
                  </a>
                )}
              </div>
            </div>

          </div>

          <div className={`pt-8 border-t ${borderDivider} flex flex-col sm:flex-row justify-between items-center text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <p>&copy; {new Date().getFullYear()} {t.churchName}. {t.rightsReserved}</p>
            <p className="mt-2 sm:mt-0 text-slate-500">Français &amp; English</p>
          </div>

        </div>
      </footer>

    </div>
  );
}
