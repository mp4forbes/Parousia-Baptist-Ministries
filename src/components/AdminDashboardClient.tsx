'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { 
  ServiceSchedule, 
  HaitiMission, 
  LocalOutreach, 
  EventRecord, 
  Registration,
  Sermon,
  KnowledgeBaseItem,
  Lead,
  DailyDevotional,
  AdminRecord,
  PrayerRequest,
  ContactSubmission,
  BlogPost,
  Ministry,
  MinistrySignup
} from '@/lib/db';
import { 
  logoutAdmin, 
  updateGlobalSettings, 
  saveServiceSchedule, 
  deleteServiceSchedule,
  saveHaitiMission,
  deleteHaitiMission,
  saveLocalOutreach,
  deleteLocalOutreach,
  saveEvent,
  deleteEvent,
  deleteRegistration,
  saveSermon,
  deleteSermon,
  backupWebsite,
  syncSermonsFromYoutube,
  addKnowledgeBaseItem,
  deleteKnowledgeBaseItem,
  automateWebsiteContentFromPdf,
  deleteLead,
  saveDailyDevotional,
  approveDailyDevotional,
  deleteDailyDevotional,
  generateDevotionalAction,
  getAdmins,
  addAdminEmail,
  prevalidateAdminInviteEmail,
  deleteAdminEmail,
  setAdminSuperAdminStatus,
  getContactSubmissions,
  deleteContactSubmission,
  getPrayerRequests,
  deletePrayerRequest,
  getBlogPosts,
  saveBlogPost,
  deleteBlogPost,
  saveMinistry,
  translateBlogContentAction,
  translateAdminTextsAction,
  getMinistrySignups,
  deleteMinistrySignup,
  exportMinistrySignupsSpreadsheet,
  markAdminEntryFromSite,
  verifyAssetUrl,
} from '@/lib/actions';
import AdminSectionContactExport from '@/components/AdminSectionContactExport';
import AdminBilingualTranslateBar from '@/components/AdminBilingualTranslateBar';
import AdminDocumentsMenu from '@/components/AdminDocumentsMenu';
import { MINISTRY_SIGNUP_FIELDS, MinistrySignupSlug } from '@/lib/ministry-signup-fields';
import { useRouter } from 'next/navigation';
import { clearAdminUiClient, setAdminUiClient } from '@/lib/admin-cookies';
import { flattenTeamMembers, parseTeamDepartments, type TeamDepartment, type TeamMember } from '@/lib/team-departments';
import { getYouTubeThumbnailUrl } from '@/lib/youtube';
import {
  BilingualTextField,
  TranslateDirection,
  applyTranslatedFields,
  collectTextsForTranslation,
  resolveTranslateSourceLang,
} from '@/lib/admin-translate';
import { 
  Church, 
  Globe2, 
  LogOut, 
  Settings, 
  Clock, 
  Heart, 
  Users, 
  Calendar, 
  BookOpen, 
  Trash2, 
  Plus, 
  Edit, 
  Check, 
  Save, 
  Phone, 
  Mail, 
  MapPin, 
  Lock,
  UserCheck,
  Video,
  UploadCloud,
  Palette,
  Database,
  FileText,
  FileSpreadsheet,
  Link2,
  RefreshCw,
  Eye,
  EyeOff,
  Wand2,
  Layers,
  ArrowUp,
  ArrowDown,
  AlertTriangle
} from 'lucide-react';

interface AdminDashboardProps {
  schedules: ServiceSchedule[];
  missions: HaitiMission[];
  outreaches: LocalOutreach[];
  events: EventRecord[];
  registrations: Registration[];
  settings: Record<string, string>;
  sermons: Sermon[];
  knowledgeBaseItems?: KnowledgeBaseItem[];
  leads?: Lead[];
  initialDevotionals?: DailyDevotional[];
  isSuperAdmin?: boolean;
  initialMinistries?: Ministry[];
  initialAdmins?: AdminRecord[];
  envSuperAdminEmails?: string[];
}

type TabType = 'settings' | 'hometabs' | 'schedules' | 'missions' | 'outreach' | 'events' | 'registrations' | 'sermons' | 'subscribers' | 'devotional' | 'admins' | 'contact' | 'prayers' | 'blog' | 'ministries';

type TeamMemberKey = `${number}-${number}`;


export default function AdminDashboardClient({ 
  schedules, 
  missions, 
  outreaches, 
  events, 
  registrations, 
  settings,
  sermons,
  knowledgeBaseItems = [],
  leads = [],
  initialDevotionals = [],
  isSuperAdmin = false,
  initialMinistries = [],
  initialAdmins = [],
  envSuperAdminEmails = []
}: AdminDashboardProps) {
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setAdminUiClient();
  }, []);

  // Active Management Tab State
  const [activeTab, setActiveTab] = useState<TabType>('settings');

  // Parousia Baptist Ministries new state variables
  const [devotionalThemeEnabled, setDevotionalThemeEnabled] = useState(settings.devotional_theme_enabled === 'true');
  const [devotionalThemePrompt, setDevotionalThemePrompt] = useState(() => {
    const theme = settings.devotional_theme || '';
    return theme === 'none' ? '' : theme;
  });
  const [adminList, setAdminList] = useState<AdminRecord[]>(initialAdmins);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminEmailError, setNewAdminEmailError] = useState('');
  const [contactLogs, setContactLogs] = useState<ContactSubmission[]>([]);
  const [moderationPrayers, setModerationPrayers] = useState<PrayerRequest[]>([]);
  const [blogPostsList, setBlogPostsList] = useState<BlogPost[]>([]);
  const [editingBlogPostId, setEditingBlogPostId] = useState<number | null>(null);
  const [blogForm, setBlogForm] = useState({
    title_english: '',
    title_kreyol: '',
    content_english: '',
    content_kreyol: '',
    date: ''
  });
  const [isTranslating, setIsTranslating] = useState(false);
  const [bilingualTranslateDirection, setBilingualTranslateDirection] = useState<TranslateDirection>('auto');
  const [isBilingualTranslating, setIsBilingualTranslating] = useState(false);

  // Ministry edit states
  const [ministriesList, setMinistriesList] = useState<Ministry[]>(initialMinistries);
  const [selectedMinistrySlug, setSelectedMinistrySlug] = useState<string>('women');
  const [minForm, setMinForm] = useState({
    title_english: '',
    title_kreyol: '',
    description_english: '',
    description_kreyol: '',
    image_url: '',
    bullets_english: '',
    bullets_kreyol: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    notification_emails: ''
  });
  const [ministrySignups, setMinistrySignups] = useState<MinistrySignup[]>([]);
  const [loadingMinistrySignups, setLoadingMinistrySignups] = useState(false);
  const [exportingMinistrySignups, setExportingMinistrySignups] = useState(false);

  useEffect(() => {
    setMinistriesList(initialMinistries);
  }, [initialMinistries]);

  useEffect(() => {
    const current = ministriesList.find(m => m.slug === selectedMinistrySlug);
    if (current) {
      setMinForm({
        title_english: current.title_english || '',
        title_kreyol: current.title_kreyol || '',
        description_english: current.description_english || '',
        description_kreyol: current.description_kreyol || '',
        image_url: current.image_url || '',
        bullets_english: current.bullets_english || '',
        bullets_kreyol: current.bullets_kreyol || '',
        contact_name: current.contact_name || '',
        contact_email: current.contact_email || '',
        contact_phone: current.contact_phone || '',
        notification_emails: current.notification_emails || ''
      });
    }
  }, [selectedMinistrySlug, ministriesList]);

  const loadMinistrySignups = async (slug: string) => {
    setLoadingMinistrySignups(true);
    try {
      const rows = await getMinistrySignups(slug);
      setMinistrySignups(rows);
    } catch (err) {
      console.error(err);
      setMinistrySignups([]);
    } finally {
      setLoadingMinistrySignups(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ministries') {
      loadMinistrySignups(selectedMinistrySlug);
    }
  }, [activeTab, selectedMinistrySlug]);

  
  // Flash alert message
  const [alertMsg, setAlertMsg] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');

  const triggerAlert = (msg: string, type: 'success' | 'error' = 'success') => {
    setAlertMsg(msg);
    setAlertType(type);
    setTimeout(() => {
      setAlertMsg('');
    }, 4000);
  };

  const clientUploadAsset = async (fileName: string, dataOrFile: string | File): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      let file: File;
      if (dataOrFile instanceof File) {
        file = dataOrFile;
      } else {
        const response = await fetch(dataOrFile);
        const blob = await response.blob();
        file = new File([blob], fileName, { type: blob.type });
      }

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        return { success: false, error: errData.error || `Server responded with ${res.status}` };
      }

      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred' };
    }
  };

  // Sign out
  const handleSignOut = async () => {
    const { redirectTo } = await logoutAdmin();
    clearAdminUiClient();
    window.location.href = redirectTo;
  };

  const handleViewWebsite = () => {
    startTransition(async () => {
      setAdminUiClient();
      await markAdminEntryFromSite();
      window.location.href = '/';
    });
  };

  // 1. GLOBAL SETTINGS FORM STATE
  const [pastorName, setPastorName] = useState(settings.pastor_name || 'Pasteur Jean-Claude');
  const [pMsgHt, setPMsgHt] = useState(settings.pastor_message_kreyol || '');
  const [pMsgEn, setPMsgEn] = useState(settings.pastor_message_english || '');
  const [chPhone, setChPhone] = useState(settings.church_phone || '');
  const [chEmail, setChEmail] = useState(settings.church_email || '');
  const [chAddr, setChAddress] = useState(settings.church_address || '');
  const [adminPass, setAdminPass] = useState(settings.admin_password || '');
  const [bgUrl, setBgUrl] = useState(settings.home_background_url || '');
  const [liveActive, setLiveActive] = useState(settings.live_stream_active || 'false');
  const [liveUrl, setLiveUrl] = useState(settings.live_stream_url || '');
  const [ytChannelUrl, setYtChannelUrl] = useState(settings.youtube_channel_url || '');
  const [liveStreamEventId, setLiveStreamEventId] = useState(settings.live_stream_event_id || 'default');
  const [customLiveEventThumbnailUrl, setCustomLiveEventThumbnailUrl] = useState(settings.custom_live_event_thumbnail_url || '');
  const [isDraggingCustomThumbnail, setIsDraggingCustomThumbnail] = useState(false);
  const [hideStripe, setHideStripe] = useState(settings.hide_stripe || 'false');
  const [cashappId, setCashappId] = useState(settings.cashapp_id || '');
  const [venmoId, setVenmoId] = useState(settings.venmo_id || '');
  const [applePayPhone, setApplePayPhone] = useState(settings.apple_pay_phone || '');
  const [zellePhone, setZellePhone] = useState(settings.zelle_phone || '929 599 8809');
  const [zelleName, setZelleName] = useState(settings.zelle_name || 'Eglise Baptiste de la Parousie');
  const [showCashapp, setShowCashapp] = useState(settings.show_cashapp || 'true');
  const [showVenmo, setShowVenmo] = useState(settings.show_venmo || 'true');
  const [showApplePay, setShowApplePay] = useState(settings.show_apple_pay || 'true');
  const [showCheck, setShowCheck] = useState(settings.show_check || 'true');
  const [checkPayableTo, setCheckPayableTo] = useState(settings.check_payable_to || '');
  const [checkMailingAddress, setCheckMailingAddress] = useState(
    settings.check_mailing_address === '789 Community Blvd, Fort Lauderdale, FL 33311'
      ? (settings.church_address || '789 Community Blvd, Fort Lauderdale, FL 33311')
      : (settings.check_mailing_address || settings.church_address || '')
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);

  // Knowledge Base States
  const [kbList, setKbList] = useState<KnowledgeBaseItem[]>(knowledgeBaseItems);
  const [isDraggingKb, setIsDraggingKb] = useState(false);
  const [kbManualTitle, setKbManualTitle] = useState('');
  const [kbManualUrl, setKbManualUrl] = useState('');
  const [kbManualType, setKbManualType] = useState('link'); // 'pdf' | 'google_doc' | 'google_sheet' | 'link'
  const [kbIsUploading, setKbIsUploading] = useState(false);
  const [automateWithDoc, setAutomateWithDoc] = useState(false);

  useEffect(() => {
    setKbList(knowledgeBaseItems);
  }, [knowledgeBaseItems]);

  // Custom logo and color scheme states
  const [logoUrl, setLogoUrl] = useState(settings.logo_url || '/logo.png');
  const [themePrimary, setThemePrimary] = useState(settings.theme_primary || '#f59e0b');
  const [themeHover, setThemeHover] = useState(settings.theme_hover || '#d97706');
  const [themeAccent, setThemeAccent] = useState(settings.theme_accent || '#3b82f6');
  const [themeMode, setThemeMode] = useState(settings.theme_mode || 'dark');
  const [heroBgOpacityLight, setHeroBgOpacityLight] = useState(settings.hero_bg_opacity_light || '15');
  const [heroBgOpacityDark, setHeroBgOpacityDark] = useState(settings.hero_bg_opacity_dark || '25');
  const [softenHeroTextBg, setSoftenHeroTextBg] = useState(settings.soften_hero_text_bg || 'true');

  // Subscribers List State
  const [subscriberList, setSubscriberList] = useState<Lead[]>(leads);
  const [subSearch, setSubSearch] = useState('');
  useEffect(() => {
    setSubscriberList(leads);
  }, [leads]);

  // Daily Devotionals State
  const [devotionalList, setDevotionalList] = useState<DailyDevotional[]>(initialDevotionals);
  const [devotionalAutoPublish, setDevotionalAutoPublish] = useState(settings.devotional_auto_publish || 'false');
  const [editingDevotionalId, setEditingDevotionalId] = useState<number | null>(null);
  const [devotionalSearch, setDevotionalSearch] = useState('');
  const [editDevotionalForm, setEditDevotionalForm] = useState({
    verse_ref_english: '',
    verse_ref_kreyol: '',
    verse_text_english: '',
    verse_text_kreyol: '',
    lesson_english: '',
    lesson_kreyol: '',
    status: 'pending' as 'pending' | 'approved'
  });

  useEffect(() => {
    setDevotionalList(initialDevotionals);
  }, [initialDevotionals]);

  useEffect(() => {
    setAdminList(initialAdmins);
  }, [initialAdmins]);

  // Fetch lists based on active tab
  useEffect(() => {
    async function loadTabSpecificData() {
      try {
        if (activeTab === 'admins') {
          const res = await getAdmins();
          setAdminList(res);
        } else if (activeTab === 'contact') {
          const res = await getContactSubmissions();
          setContactLogs(res);
        } else if (activeTab === 'prayers') {
          const res = await getPrayerRequests();
          setModerationPrayers(res);
        } else if (activeTab === 'blog') {
          const res = await getBlogPosts();
          setBlogPostsList(res);
        }
      } catch (err: any) {
        console.error('Error loading tab data:', err);
      }
    }
    loadTabSpecificData();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'admins' || !newAdminEmail.trim()) {
      setNewAdminEmailError('');
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(async () => {
      const validation = await prevalidateAdminInviteEmail(newAdminEmail, language);
      if (!cancelled) {
        setNewAdminEmailError(validation.error || '');
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [activeTab, newAdminEmail, language]);

  // NEW HANDLERS FOR PAROUSIA BAPTIST MINISTRIES
  const handleAddAdminEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    if (newAdminEmailError) {
      triggerAlert(newAdminEmailError, 'error');
      return;
    }
    try {
      const res = await addAdminEmail(newAdminEmail.trim());
      if (res.success) {
        triggerAlert(language === 'fr_ht' ? 'Administrateur autorisé avec succès !' : 'Admin authorized successfully!', 'success');
        setNewAdminEmail('');
        setNewAdminEmailError('');
        const list = await getAdmins();
        setAdminList(list);
        router.refresh();
      } else {
        triggerAlert(res.error || 'Failed to add admin', 'error');
      }
    } catch (err: any) {
      triggerAlert(err.message || 'Error occurred', 'error');
    }
  };

  const handleDeleteAdminEmail = async (id: number) => {
    if (!confirm(language === 'fr_ht' ? 'Êtes-vous sûr de vouloir révoquer cet administrateur ?' : 'Are you sure you want to revoke this admin?')) return;
    try {
      const res = await deleteAdminEmail(id);
      if (res.success) {
        triggerAlert(language === 'fr_ht' ? 'Administrateur révoqué avec succès !' : 'Admin revoked successfully!', 'success');
        const list = await getAdmins();
        setAdminList(list);
        router.refresh();
      } else {
        triggerAlert(res.error || 'Failed to delete admin', 'error');
      }
    } catch (err: any) {
      triggerAlert(err.message || 'Error occurred', 'error');
    }
  };

  const handleToggleAdminSuperAdmin = async (admin: AdminRecord, checked: boolean) => {
    try {
      const res = await setAdminSuperAdminStatus(admin.id, checked);
      if (res.success) {
        const list = await getAdmins();
        setAdminList(list);
        router.refresh();
        triggerAlert(
          checked
            ? (language === 'fr_ht' ? 'Accès super-administrateur activé.' : 'Super-admin access enabled.')
            : (language === 'fr_ht' ? 'Accès super-administrateur supprimé.' : 'Super-admin access removed.'),
          'success'
        );
      } else {
        triggerAlert(res.error || 'Failed to update super-admin access', 'error');
      }
    } catch (err: any) {
      triggerAlert(err.message || 'Error occurred', 'error');
    }
  };

  const isEnvSuperAdmin = (email: string) => envSuperAdminEmails.includes(email.toLowerCase().trim());
  const isAdminSuperAdmin = (admin: AdminRecord) => admin.is_super_admin === 1 || isEnvSuperAdmin(admin.email);

  const handleSaveMinistry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalImgUrl = minForm.image_url;
      if (minForm.image_url && minForm.image_url.startsWith('data:')) {
        triggerAlert(language === 'en' ? 'Uploading ministry image...' : 'Téléversement de l’image du ministère...', 'success');
        const uploadRes = await clientUploadAsset(`ministry_${selectedMinistrySlug}_bg.jpg`, minForm.image_url);
        if (uploadRes.success && uploadRes.url) {
          finalImgUrl = uploadRes.url;
          // Update the state so the form reflects the uploaded path
          setMinForm(prev => ({ ...prev, image_url: uploadRes.url! }));
        } else {
          triggerAlert(uploadRes.error || 'Failed to upload ministry image', 'error');
          return;
        }
      }

      const formToSave = { ...minForm, image_url: finalImgUrl };
      const res = await saveMinistry(selectedMinistrySlug, formToSave);
      if (res.success) {
        setMinistriesList(prev => prev.map(m => m.slug === selectedMinistrySlug ? { ...m, ...formToSave } : m));
        triggerAlert(language === 'en' ? 'Ministry saved successfully!' : 'Ministère enregistré avec succès !', 'success');
      } else {
        triggerAlert(res.error || 'Failed to save ministry', 'error');
      }
    } catch (err: any) {
      console.error(err);
      triggerAlert(err.message || 'Error occurred while saving ministry', 'error');
    }
  };

  const handleDeleteMinistrySignup = async (id: number) => {
    if (!confirm(language === 'fr_ht' ? 'Supprimer cette inscription ?' : 'Delete this signup?')) return;
    try {
      const res = await deleteMinistrySignup(id);
      if (res.success) {
        setMinistrySignups((prev) => prev.filter((row) => row.id !== id));
        triggerAlert(language === 'en' ? 'Signup deleted.' : 'Inscription supprimée.', 'success');
      } else {
        triggerAlert(res.error || 'Failed to delete signup', 'error');
      }
    } catch (err: any) {
      triggerAlert(err.message || 'Error occurred', 'error');
    }
  };

  const handleExportMinistrySignupsSpreadsheet = async () => {
    setExportingMinistrySignups(true);
    try {
      const res = await exportMinistrySignupsSpreadsheet(selectedMinistrySlug);
      if (!res.success || !res.data) {
        triggerAlert(res.error || 'Failed to export spreadsheet', 'error');
        return;
      }

      const bytes = Uint8Array.from(atob(res.data), (char) => char.charCodeAt(0));
      const blob = new Blob([bytes], {
        type: res.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = res.filename || `${selectedMinistrySlug}-signups.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      triggerAlert(
        language === 'en'
          ? 'Spreadsheet downloaded. Open it in Excel or Google Sheets.'
          : 'Fichier téléchargé. Vous pouvez l’ouvrir dans Excel ou Google Sheets.',
        'success'
      );
    } catch (err: any) {
      triggerAlert(err.message || 'Error occurred', 'error');
    } finally {
      setExportingMinistrySignups(false);
    }
  };

  const handleDeleteContactLog = async (id: number) => {
    if (!confirm(language === 'fr_ht' ? 'Supprimer ce message ?' : 'Delete this message?')) return;
    try {
      const res = await deleteContactSubmission(id);
      if (res.success) {
        triggerAlert(language === 'fr_ht' ? 'Message supprimé !' : 'Message deleted successfully!', 'success');
        const list = await getContactSubmissions();
        setContactLogs(list);
      } else {
        triggerAlert(res.error || 'Failed to delete message', 'error');
      }
    } catch (err: any) {
      triggerAlert(err.message || 'Error occurred', 'error');
    }
  };

  const handleDeletePrayer = async (id: number) => {
    if (!confirm(language === 'fr_ht' ? 'Voulez-vous supprimer cette demande du mur de prière ?' : 'Delete this prayer request from the wall?')) return;
    try {
      const res = await deletePrayerRequest(id);
      if (res.success) {
        triggerAlert(language === 'fr_ht' ? 'Demande de prière supprimée avec succès !' : 'Prayer request deleted successfully!', 'success');
        const list = await getPrayerRequests();
        setModerationPrayers(list);
      } else {
        triggerAlert(res.error || 'Failed to delete prayer request', 'error');
      }
    } catch (err: any) {
      triggerAlert(err.message || 'Error occurred', 'error');
    }
  };

  const handleStartCreateBlog = () => {
    setEditingBlogPostId(0);
    setBlogForm({
      title_english: '',
      title_kreyol: '',
      content_english: '',
      content_kreyol: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleStartEditBlog = (post: BlogPost) => {
    setEditingBlogPostId(post.id);
    setBlogForm({
      title_english: post.title_english,
      title_kreyol: post.title_kreyol,
      content_english: post.content_english,
      content_kreyol: post.content_kreyol,
      date: post.date
    });
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await saveBlogPost(
        editingBlogPostId === 0 ? null : editingBlogPostId,
        blogForm.title_kreyol,
        blogForm.title_english,
        blogForm.content_kreyol,
        blogForm.content_english,
        blogForm.date
      );
      if (res.success) {
        triggerAlert(language === 'fr_ht' ? 'Article de blogue enregistré avec succès !' : 'Blog post saved successfully!', 'success');
        setEditingBlogPostId(null);
        const list = await getBlogPosts();
        setBlogPostsList(list);
      } else {
        triggerAlert(res.error || 'Failed to save blog post', 'error');
      }
    } catch (err: any) {
      triggerAlert(err.message || 'Error occurred', 'error');
    }
  };

  const handleDeleteBlog = async (id: number) => {
    if (!confirm(language === 'fr_ht' ? 'Supprimer cet article ?' : 'Are you sure you want to delete this blog post?')) return;
    try {
      const res = await deleteBlogPost(id);
      if (res.success) {
        triggerAlert(language === 'fr_ht' ? 'Article supprimé !' : 'Blog post deleted successfully!', 'success');
        const list = await getBlogPosts();
        setBlogPostsList(list);
      } else {
        triggerAlert(res.error || 'Failed to delete blog post', 'error');
      }
    } catch (err: any) {
      triggerAlert(err.message || 'Error occurred', 'error');
    }
  };


  // Free Giveaway Customizable E-Book / Devotional settings
  const [giftTitleHt, setGiftTitleHt] = useState(settings.free_gift_title_kreyol || 'Livre de dévotion Parousie 2026');
  const [giftTitleEn, setGiftTitleEn] = useState(settings.free_gift_title_english || 'Parousie Devotional 2026');
  const [giftDescHt, setGiftDescHt] = useState(settings.free_gift_desc_kreyol || 'Indiquez votre nom, votre adresse courriel et votre numéro de téléphone pour télécharger notre magnifique livre de dévotion, qui contient des méditations et des versets pour vous aider à grandir chaque jour dans la Parole.');
  const [giftDescEn, setGiftDescEn] = useState(settings.free_gift_desc_english || 'Enter your name, email, and phone to receive our beautiful Daily Devotional booklet containing scripture plans and prayers designed to help you grow daily in Christ.');
  const [giftFileUrl, setGiftFileUrl] = useState(settings.free_gift_file_url || '/devotional_parousie_2026.txt');
  const [giftAdminNotes, setGiftAdminNotes] = useState(settings.free_gift_admin_notes || '');

  useEffect(() => {
    if (!giftFileUrl.startsWith('/api/assets/')) return;
    verifyAssetUrl(giftFileUrl).then((result) => {
      if (!result.exists) {
        triggerAlert(
          language === 'fr_ht'
            ? 'Le fichier du cadeau gratuit configuré est introuvable. Téléversez-le à nouveau dans les paramètres du site.'
            : 'The configured free gift file is missing. Please upload it again in site settings.',
          'error'
        );
      }
    });
  }, [giftFileUrl, language]);
  const [isDraggingGift, setIsDraggingGift] = useState(false);
  const [giftIsUploading, setGiftIsUploading] = useState(false);

  // Drag visual feedback states
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isDraggingHero, setIsDraggingHero] = useState(false);
  const [isDraggingSched, setIsDraggingSched] = useState(false);
  const [isDraggingMin, setIsDraggingMin] = useState(false);
  const [isDraggingMiss, setIsDraggingMiss] = useState(false);

  // 12. HOME SUB-TABS EDITING STATE
  const [aboutUsTitleEn, setAboutUsTitleEn] = useState(settings.about_us_title_en || 'About Us');
  const [aboutUsTitleHt, setAboutUsTitleHt] = useState(settings.about_us_title_ht || 'Qui sommes-nous');
  const [aboutUsP1En, setAboutUsP1En] = useState(settings.about_us_p1_en || 'Parousia Baptist Ministries is a vibrant community of believers devoted to worshiping God and anticipating the second coming (Parousia) of our Lord Jesus Christ. Our mission is to preach the true Gospel, foster deep discipleship, and serve our local and diaspora community.');
  const [aboutUsP1Ht, setAboutUsP1Ht] = useState(settings.about_us_p1_ht || 'Parousia Baptist Ministries est une communauté de croyants qui attend le retour de Jésus-Christ. Notre vision est claire : proclamer l’Évangile, former des disciples et servir notre diaspora au moyen de projets communautaires et d’une formation spirituelle.');
  const [aboutUsP2En, setAboutUsP2En] = useState(settings.about_us_p2_en || 'From our inception, we have focused on authentic biblical living, establishing direct educational and healthcare mission support in Haiti, and cultivating a welcoming space where everyone can experience genuine spiritual family.');
  const [aboutUsP2Ht, setAboutUsP2Ht] = useState(settings.about_us_p2_ht || 'Depuis nos débuts, nous nous consacrons à bâtir une foi solide et authentique, à soutenir des projets scolaires et de santé en Haïti, et à offrir un lieu où chaque frère et chaque sœur peut trouver une véritable famille spirituelle.');
  const [aboutUsImageUrl, setAboutUsImageUrl] = useState(settings.about_us_image_url || 'https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=800&auto=format&fit=crop');

  const [beliefsTitleEn, setBeliefsTitleEn] = useState(settings.beliefs_title_en || 'Our Beliefs');
  const [beliefsTitleHt, setBeliefsTitleHt] = useState(settings.beliefs_title_ht || 'Nos croyances');
  
  const [belief1TitleEn, setBelief1TitleEn] = useState(settings.belief_1_title_en || 'Infallible Scripture');
  const [belief1TitleHt, setBelief1TitleHt] = useState(settings.belief_1_title_ht || 'La Bible, vérité absolue');
  const [belief1DescEn, setBelief1DescEn] = useState(settings.belief_1_desc_en || 'We believe the Bible is the inspired, infallible, and inerrant Word of God, serving as our final authority in all matters of faith, doctrine, and conduct.');
  const [belief1DescHt, setBelief1DescHt] = useState(settings.belief_1_desc_ht || 'Nous croyons que toute la Bible est la Parole inspirée de Dieu. Elle est l’autorité suprême pour notre foi et notre conduite quotidienne.');

  const [belief2TitleEn, setBelief2TitleEn] = useState(settings.belief_2_title_en || 'Holy Trinity');
  const [belief2TitleHt, setBelief2TitleHt] = useState(settings.belief_2_title_ht || 'La Sainte Trinité');
  const [belief2DescEn, setBelief2DescEn] = useState(settings.belief_2_desc_en || 'We believe in one God, eternally existing in three co-equal persons: God the Father, God the Son (Jesus Christ), and God the Holy Spirit.');
  const [belief2DescHt, setBelief2DescHt] = useState(settings.belief_2_desc_ht || 'Nous croyons en un seul Dieu qui existe en trois personnes : le Père, le Fils (Jésus-Christ) et le Saint-Esprit, égaux en puissance et en gloire.');

  const [belief3TitleEn, setBelief3TitleEn] = useState(settings.belief_3_title_en || 'Salvation by Grace');
  const [belief3TitleHt, setBelief3TitleHt] = useState(settings.belief_3_title_ht || 'Le salut par la grâce seule');
  const [belief3DescEn, setBelief3DescEn] = useState(settings.belief_3_desc_en || "Salvation is a gift of God received through repentance and faith in Christ's substitutionary sacrifice on the cross. It is entirely by grace alone, not works.");
  const [belief3DescHt, setBelief3DescHt] = useState(settings.belief_3_desc_ht || 'Le salut est un don de Dieu reçu par la foi en Jésus-Christ. Il ne vient pas des bonnes œuvres : nous sommes sauvés par la grâce seule.');

  const [belief4TitleEn, setBelief4TitleEn] = useState(settings.belief_4_title_en || 'The Blessed Hope (Parousia)');
  const [belief4TitleHt, setBelief4TitleHt] = useState(settings.belief_4_title_ht || 'Le retour du Seigneur (Parousie)');
  const [belief4DescEn, setBelief4DescEn] = useState(settings.belief_4_desc_en || 'We eagerly anticipate the personal, visible, and glorious return of Jesus Christ to gather His Church and establish His righteous kingdom.');
  const [belief4DescHt, setBelief4DescHt] = useState(settings.belief_4_desc_ht || 'Nous plaçons notre grande espérance dans le retour visible et glorieux de Jésus-Christ, qui enlèvera l’Église et jugera le monde selon sa justice.');

  const [teamTitleEn, setTeamTitleEn] = useState(settings.team_title_en || 'Our Team');
  const [teamTitleHt, setTeamTitleHt] = useState(settings.team_title_ht || 'Notre équipe');
  const [teamSubtitleEn, setTeamSubtitleEn] = useState(settings.team_subtitle_en || 'Departments & Associations');
  const [teamSubtitleHt, setTeamSubtitleHt] = useState(settings.team_subtitle_ht || 'Départements et associations');

  const [teamDepartments, setTeamDepartments] = useState<TeamDepartment[]>(() => parseTeamDepartments(settings));
  const [draggingMemberIndex, setDraggingMemberIndex] = useState<TeamMemberKey | null>(null);
  const [translatingTeamMemberKey, setTranslatingTeamMemberKey] = useState<TeamMemberKey | null>(null);

  const [expectTitleEn, setExpectTitleEn] = useState(settings.expect_title_en || 'What to Expect');
  const [expectTitleHt, setExpectTitleHt] = useState(settings.expect_title_ht || 'À quoi vous attendre');
  const [expectP1En, setExpectP1En] = useState(settings.expect_p1_en || 'When you step into a service at Parousia Baptist Ministries, you will experience a warm, friendly, and reverent atmosphere. Our worship is spirit-filled and biblical, and our bilingual environment welcomes all.');
  const [expectP1Ht, setExpectP1Ht] = useState(settings.expect_p1_ht || 'Lorsque vous venez adorer avec nous à Parousia Baptist Ministries, vous découvrez une atmosphère chaleureuse où Dieu est célébré avec révérence et joie. Nos cultes sont offerts en français et en anglais afin que chacun puisse y participer pleinement.');
  const [expectImageUrl, setExpectImageUrl] = useState(settings.expect_image_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop');
  const [expectBullet1En, setExpectBullet1En] = useState(settings.expect_bullet1_en || 'Christ-centered praise, blending traditional hymns and modern worship');
  const [expectBullet1Ht, setExpectBullet1Ht] = useState(settings.expect_bullet1_ht || 'Une adoration et des louanges qui édifient');
  const [expectBullet2En, setExpectBullet2En] = useState(settings.expect_bullet2_en || 'Expository, practical teaching straight from the holy scriptures');
  const [expectBullet2Ht, setExpectBullet2Ht] = useState(settings.expect_bullet2_ht || 'Des messages solides, fondés sur la Bible');
  const [expectBullet3En, setExpectBullet3En] = useState(settings.expect_bullet3_en || 'A supportive, tight-knit family that will welcome you with open arms');
  const [expectBullet3Ht, setExpectBullet3Ht] = useState(settings.expect_bullet3_ht || 'Une communauté qui vous accueille à bras ouverts');

  // Drag visual feedback states for Home Tabs
  const [isDraggingAboutUs, setIsDraggingAboutUs] = useState(false);
  const [isDraggingExpect, setIsDraggingExpect] = useState(false);

  // Home sub-tab state for editing
  const [homeSubTab, setHomeSubTab] = useState<'about' | 'beliefs' | 'team' | 'expect'>('about');

  // Backup state & callback
  const [isBackingUp, setIsBackingUp] = useState(false);
  const handleBackupClick = async () => {
    setIsBackingUp(true);
    triggerAlert(language === 'fr_ht' ? 'Création de la sauvegarde...' : 'Creating website backup...', 'success');
    try {
      const res = await backupWebsite();
      if (res.success) {
        triggerAlert(language === 'fr_ht' 
          ? `Sauvegarde créée dans Parousie/backups/backup_${res.timestamp}!`
          : `Backup created successfully in Parousie/backups/backup_${res.timestamp}!`, 
          'success'
        );
      } else {
        triggerAlert(res.error || 'Failed to create backup', 'error');
      }
    } catch (err: any) {
      triggerAlert(err.message || 'Error occurred', 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleSyncYoutube = async () => {
    if (!ytChannelUrl) {
      triggerAlert(language === 'fr_ht' ? 'Veuillez d’abord saisir l’URL d’une chaîne.' : 'Please enter a channel URL first.', 'error');
      return;
    }
    
    setIsSyncing(true);
    triggerAlert(language === 'fr_ht' ? 'Synchronisation des vidéos depuis YouTube...' : 'Syncing streams from YouTube...', 'success');
    
    try {
      const result = await syncSermonsFromYoutube(ytChannelUrl);
      if (result.success) {
        triggerAlert(language === 'fr_ht' 
          ? `Synchronisation terminée ! ${result.count} nouvelles vidéos importées avec succès.`
          : `Sync complete! Imported ${result.count} new videos successfully.`, 
          'success'
        );
        router.refresh();
      } else {
        triggerAlert(result.error || 'Sync failed', 'error');
      }
    } catch (err: any) {
      triggerAlert(err.message || 'Error running sync', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const compressAndResizeImage = (
    file: File, 
    maxWidth: number, 
    maxHeight: number, 
    quality: number, 
    callback: (base64: string) => void
  ) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          callback(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Use PNG for logos to preserve transparency, JPEG for hero background for high compression ratio
        const isPNG = file.type === 'image/png' || file.name.endsWith('.png');
        const format = isPNG ? 'image/png' : 'image/jpeg';
        const compressedB64 = canvas.toDataURL(format, isPNG ? undefined : quality);
        callback(compressedB64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // File loading and drag-and-drop / paste helpers
  const handleLogoFile = (file: File | undefined) => {
    if (!file) return;
    compressAndResizeImage(file, 400, 400, 0.9, (b64) => {
      setLogoUrl(b64);
      extractColorsFromLogo(b64);
    });
  };

  const handleHeroFile = (file: File | undefined) => {
    if (!file) return;
    compressAndResizeImage(file, 1920, 1080, 0.8, (b64) => {
      setBgUrl(b64);
    });
  };

  const handlePasteLogo = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) handleLogoFile(file);
        break;
      }
    }
  };

  const handlePasteHero = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) handleHeroFile(file);
        break;
      }
    }
  };

  const handleDropLogo = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleLogoFile(files[0]);
    }
  };

  const handleDropHero = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingHero(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleHeroFile(files[0]);
    }
  };

  const handleCustomThumbnailFile = (file: File | undefined) => {
    if (!file) return;
    compressAndResizeImage(file, 800, 600, 0.8, (b64) => {
      setCustomLiveEventThumbnailUrl(b64);
    });
  };

  const handlePasteCustomThumbnail = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) handleCustomThumbnailFile(file);
        break;
      }
    }
  };

  const handleDropCustomThumbnail = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCustomThumbnail(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleCustomThumbnailFile(files[0]);
    }
  };

  const handleSchedFile = (file: File | undefined) => {
    if (!file) return;
    compressAndResizeImage(file, 800, 600, 0.85, (b64) => {
      setSchedImg(b64);
    });
  };

  const handlePasteSched = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) handleSchedFile(file);
        break;
      }
    }
  };

  const handleDropSched = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingSched(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleSchedFile(files[0]);
    }
  };

  // MINISTRY IMAGE HANDLERS
  const handleMinFile = (file: File | undefined) => {
    if (!file) return;
    compressAndResizeImage(file, 800, 600, 0.85, (b64) => {
      setMinForm(prev => ({ ...prev, image_url: b64 }));
    });
  };

  const handlePasteMin = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) handleMinFile(file);
        break;
      }
    }
  };

  const handleDropMin = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingMin(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleMinFile(files[0]);
    }
  };

  // HAITI MISSION IMAGE HANDLERS
  const handleMissFile = (file: File | undefined) => {
    if (!file) return;
    compressAndResizeImage(file, 800, 600, 0.85, (b64) => {
      setPMissImg(b64);
    });
  };

  const handlePasteMiss = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) handleMissFile(file);
        break;
      }
    }
  };

  const handleDropMiss = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingMiss(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleMissFile(files[0]);
    }
  };

  // HOME TABS IMAGE HANDLERS
  const handleAboutUsFile = (file: File | undefined) => {
    if (!file) return;
    compressAndResizeImage(file, 800, 600, 0.85, (b64) => {
      setAboutUsImageUrl(b64);
    });
  };

  const handlePasteAboutUs = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) handleAboutUsFile(file);
        break;
      }
    }
  };

  const handleDropAboutUs = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAboutUs(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleAboutUsFile(files[0]);
    }
  };

  const handleTeamMemberFile = (deptIndex: number, memberIndex: number, file: File | undefined) => {
    if (!file) return;
    compressAndResizeImage(file, 400, 400, 0.85, (b64) => {
      setTeamDepartments((prev) => {
        const copy = prev.map((department) => ({
          ...department,
          members: [...department.members],
        }));
        copy[deptIndex].members[memberIndex] = {
          ...copy[deptIndex].members[memberIndex],
          image_url: b64,
        };
        return copy;
      });
    });
  };

  const handlePasteTeamMember = (deptIndex: number, memberIndex: number, e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) handleTeamMemberFile(deptIndex, memberIndex, file);
        break;
      }
    }
  };

  const handleDropTeamMember = (deptIndex: number, memberIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleTeamMemberFile(deptIndex, memberIndex, files[0]);
    }
  };

  const handleAddTeamMember = (deptIndex: number) => {
    setTeamDepartments((prev) =>
      prev.map((department, index) =>
        index === deptIndex
          ? {
              ...department,
              members: [
                ...department.members,
                {
                  name: '',
                  role_en: '',
                  role_ht: '',
                  bio_en: '',
                  bio_ht: '',
                  image_url: '',
                  email: '',
                },
              ],
            }
          : department
      )
    );
  };

  const handleDeleteTeamMember = (deptIndex: number, memberIndex: number) => {
    const department = teamDepartments[deptIndex];
    if (!department || department.members.length <= 1) {
      triggerAlert(
        language === 'fr_ht'
          ? 'Chaque département doit conserver au moins un membre.'
          : 'Each department must have at least one member.',
        'error'
      );
      return;
    }
    if (!confirm(language === 'fr_ht' ? 'Voulez-vous supprimer ce membre de l’équipe ?' : 'Are you sure you want to delete this team member?')) {
      return;
    }
    setTeamDepartments((prev) =>
      prev.map((currentDepartment, index) =>
        index === deptIndex
          ? {
              ...currentDepartment,
              members: currentDepartment.members.filter((_, i) => i !== memberIndex),
            }
          : currentDepartment
      )
    );
  };

  const handleMoveTeamMember = (deptIndex: number, memberIndex: number, direction: 'up' | 'down') => {
    const department = teamDepartments[deptIndex];
    if (!department) return;
    if (direction === 'up' && memberIndex === 0) return;
    if (direction === 'down' && memberIndex === department.members.length - 1) return;
    const targetIndex = direction === 'up' ? memberIndex - 1 : memberIndex + 1;
    setTeamDepartments((prev) =>
      prev.map((currentDepartment, index) => {
        if (index !== deptIndex) return currentDepartment;
        const members = [...currentDepartment.members];
        const temp = members[memberIndex];
        members[memberIndex] = members[targetIndex];
        members[targetIndex] = temp;
        return { ...currentDepartment, members };
      })
    );
  };

  const handleUpdateTeamMember = (
    deptIndex: number,
    memberIndex: number,
    field: keyof TeamMember,
    value: string
  ) => {
    setTeamDepartments((prev) =>
      prev.map((department, index) => {
        if (index !== deptIndex) return department;
        const members = [...department.members];
        members[memberIndex] = { ...members[memberIndex], [field]: value };
        return { ...department, members };
      })
    );
  };

  const handleUpdateTeamDepartment = (
    deptIndex: number,
    field: 'title_en' | 'title_ht',
    value: string
  ) => {
    setTeamDepartments((prev) =>
      prev.map((department, index) =>
        index === deptIndex ? { ...department, [field]: value } : department
      )
    );
  };

  const handleAddTeamDepartment = () => {
    setTeamDepartments((prev) => [
      ...prev,
      {
        id: `department-${Date.now()}`,
        title_en: 'New Department',
        title_ht: 'Nouveau département',
        members: [
          {
            name: '',
            role_en: '',
            role_ht: '',
            bio_en: '',
            bio_ht: '',
            image_url: '',
            email: '',
          },
        ],
      },
    ]);
  };

  const handleDeleteTeamDepartment = (deptIndex: number) => {
    if (teamDepartments.length <= 1) {
      triggerAlert(
        language === 'fr_ht'
          ? 'Vous devez conserver au moins un département.'
          : 'You must keep at least one department.',
        'error'
      );
      return;
    }
    if (!confirm(language === 'fr_ht' ? 'Voulez-vous supprimer ce département ?' : 'Are you sure you want to delete this department?')) {
      return;
    }
    setTeamDepartments((prev) => prev.filter((_, index) => index !== deptIndex));
  };

  const handleMoveTeamDepartment = (deptIndex: number, direction: 'up' | 'down') => {
    if (direction === 'up' && deptIndex === 0) return;
    if (direction === 'down' && deptIndex === teamDepartments.length - 1) return;
    const targetIndex = direction === 'up' ? deptIndex - 1 : deptIndex + 1;
    setTeamDepartments((prev) => {
      const copy = [...prev];
      const temp = copy[deptIndex];
      copy[deptIndex] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const runBilingualTranslation = async (
    fields: BilingualTextField[],
    onApply: (updated: BilingualTextField[]) => void,
    contextLabel: string
  ) => {
    const payload = collectTextsForTranslation(fields, bilingualTranslateDirection, language);
    if (!payload) {
      triggerAlert(
        language === 'fr_ht'
          ? 'Veuillez saisir du texte dans la langue source avant de lancer la traduction.'
          : 'Please enter source-language text before translating.',
        'error'
      );
      return;
    }

    setIsBilingualTranslating(true);
    triggerAlert(
      language === 'fr_ht' ? 'Traduction intelligente en cours...' : 'Smart translation in progress...',
      'success'
    );

    try {
      const res = await translateAdminTextsAction(payload.items, payload.fromLang, contextLabel);
      if (res.success && res.translations) {
        onApply(applyTranslatedFields(fields, res.translations, payload.fromLang));
        triggerAlert(
          language === 'fr_ht' ? 'Traduction terminée avec succès !' : 'Translation completed successfully!',
          'success'
        );
      } else {
        triggerAlert(res.error || (language === 'fr_ht' ? 'Échec de la traduction.' : 'Translation failed.'), 'error');
      }
    } catch (err: any) {
      triggerAlert(err.message || (language === 'fr_ht' ? 'Une erreur est survenue pendant la traduction.' : 'An error occurred during translation.'), 'error');
    } finally {
      setIsBilingualTranslating(false);
    }
  };

  const getHomeTabBilingualFields = (): BilingualTextField[] => {
    if (homeSubTab === 'about') {
      return [
        { id: 'about_title', kreyol: aboutUsTitleHt, english: aboutUsTitleEn },
        { id: 'about_p1', kreyol: aboutUsP1Ht, english: aboutUsP1En },
        { id: 'about_p2', kreyol: aboutUsP2Ht, english: aboutUsP2En },
      ];
    }

    if (homeSubTab === 'beliefs') {
      return [
        { id: 'beliefs_title', kreyol: beliefsTitleHt, english: beliefsTitleEn },
        { id: 'belief_1_title', kreyol: belief1TitleHt, english: belief1TitleEn },
        { id: 'belief_1_desc', kreyol: belief1DescHt, english: belief1DescEn },
        { id: 'belief_2_title', kreyol: belief2TitleHt, english: belief2TitleEn },
        { id: 'belief_2_desc', kreyol: belief2DescHt, english: belief2DescEn },
        { id: 'belief_3_title', kreyol: belief3TitleHt, english: belief3TitleEn },
        { id: 'belief_3_desc', kreyol: belief3DescHt, english: belief3DescEn },
        { id: 'belief_4_title', kreyol: belief4TitleHt, english: belief4TitleEn },
        { id: 'belief_4_desc', kreyol: belief4DescHt, english: belief4DescEn },
      ];
    }

    if (homeSubTab === 'team') {
      return [
        { id: 'team_title', kreyol: teamTitleHt, english: teamTitleEn },
        { id: 'team_subtitle', kreyol: teamSubtitleHt, english: teamSubtitleEn },
        ...teamDepartments.map((department, index) => ({
          id: `dept_${index}_title`,
          kreyol: department.title_ht,
          english: department.title_en,
        })),
      ];
    }

    return [
      { id: 'expect_title', kreyol: expectTitleHt, english: expectTitleEn },
      { id: 'expect_p1', kreyol: expectP1Ht, english: expectP1En },
      { id: 'expect_bullet1', kreyol: expectBullet1Ht, english: expectBullet1En },
      { id: 'expect_bullet2', kreyol: expectBullet2Ht, english: expectBullet2En },
      { id: 'expect_bullet3', kreyol: expectBullet3Ht, english: expectBullet3En },
    ];
  };

  const applyHomeTabBilingualFields = (updated: BilingualTextField[]) => {
    const byId = Object.fromEntries(updated.map((field) => [field.id, field]));

    if (homeSubTab === 'about') {
      if (byId.about_title) {
        setAboutUsTitleHt(byId.about_title.kreyol);
        setAboutUsTitleEn(byId.about_title.english);
      }
      if (byId.about_p1) {
        setAboutUsP1Ht(byId.about_p1.kreyol);
        setAboutUsP1En(byId.about_p1.english);
      }
      if (byId.about_p2) {
        setAboutUsP2Ht(byId.about_p2.kreyol);
        setAboutUsP2En(byId.about_p2.english);
      }
      return;
    }

    if (homeSubTab === 'beliefs') {
      if (byId.beliefs_title) {
        setBeliefsTitleHt(byId.beliefs_title.kreyol);
        setBeliefsTitleEn(byId.beliefs_title.english);
      }
      if (byId.belief_1_title) {
        setBelief1TitleHt(byId.belief_1_title.kreyol);
        setBelief1TitleEn(byId.belief_1_title.english);
      }
      if (byId.belief_1_desc) {
        setBelief1DescHt(byId.belief_1_desc.kreyol);
        setBelief1DescEn(byId.belief_1_desc.english);
      }
      if (byId.belief_2_title) {
        setBelief2TitleHt(byId.belief_2_title.kreyol);
        setBelief2TitleEn(byId.belief_2_title.english);
      }
      if (byId.belief_2_desc) {
        setBelief2DescHt(byId.belief_2_desc.kreyol);
        setBelief2DescEn(byId.belief_2_desc.english);
      }
      if (byId.belief_3_title) {
        setBelief3TitleHt(byId.belief_3_title.kreyol);
        setBelief3TitleEn(byId.belief_3_title.english);
      }
      if (byId.belief_3_desc) {
        setBelief3DescHt(byId.belief_3_desc.kreyol);
        setBelief3DescEn(byId.belief_3_desc.english);
      }
      if (byId.belief_4_title) {
        setBelief4TitleHt(byId.belief_4_title.kreyol);
        setBelief4TitleEn(byId.belief_4_title.english);
      }
      if (byId.belief_4_desc) {
        setBelief4DescHt(byId.belief_4_desc.kreyol);
        setBelief4DescEn(byId.belief_4_desc.english);
      }
      return;
    }

    if (homeSubTab === 'team') {
      if (byId.team_title) {
        setTeamTitleHt(byId.team_title.kreyol);
        setTeamTitleEn(byId.team_title.english);
      }
      if (byId.team_subtitle) {
        setTeamSubtitleHt(byId.team_subtitle.kreyol);
        setTeamSubtitleEn(byId.team_subtitle.english);
      }
      setTeamDepartments((prev) =>
        prev.map((department, index) => {
          const titleField = byId[`dept_${index}_title`];
          if (!titleField) return department;
          return {
            ...department,
            title_ht: titleField.kreyol,
            title_en: titleField.english,
          };
        })
      );
      return;
    }

    if (byId.expect_title) {
      setExpectTitleHt(byId.expect_title.kreyol);
      setExpectTitleEn(byId.expect_title.english);
    }
    if (byId.expect_p1) {
      setExpectP1Ht(byId.expect_p1.kreyol);
      setExpectP1En(byId.expect_p1.english);
    }
    if (byId.expect_bullet1) {
      setExpectBullet1Ht(byId.expect_bullet1.kreyol);
      setExpectBullet1En(byId.expect_bullet1.english);
    }
    if (byId.expect_bullet2) {
      setExpectBullet2Ht(byId.expect_bullet2.kreyol);
      setExpectBullet2En(byId.expect_bullet2.english);
    }
    if (byId.expect_bullet3) {
      setExpectBullet3Ht(byId.expect_bullet3.kreyol);
      setExpectBullet3En(byId.expect_bullet3.english);
    }
  };

  const handleTranslatePastorMessage = async () => {
    await runBilingualTranslation(
      [{ id: 'pastor_message', kreyol: pMsgHt, english: pMsgEn }],
      (updated) => {
        setPMsgHt(updated[0].kreyol);
        setPMsgEn(updated[0].english);
      },
      'pastor welcome message'
    );
  };

  const handleTranslateHomeTab = async () => {
    await runBilingualTranslation(
      getHomeTabBilingualFields(),
      applyHomeTabBilingualFields,
      `home page ${homeSubTab} content`
    );
  };

  const handleTranslateTeamMember = async (deptIndex: number, memberIndex: number) => {
    const member = teamDepartments[deptIndex]?.members[memberIndex];
    if (!member) return;

    const memberKey: TeamMemberKey = `${deptIndex}-${memberIndex}`;
    setTranslatingTeamMemberKey(memberKey);
    try {
      await runBilingualTranslation(
        [
          { id: 'role', kreyol: member.role_ht, english: member.role_en },
          { id: 'bio', kreyol: member.bio_ht, english: member.bio_en },
        ],
        (updated) => {
          const byId = Object.fromEntries(updated.map((field) => [field.id, field]));
          setTeamDepartments((prev) =>
            prev.map((department, currentDeptIndex) => {
              if (currentDeptIndex !== deptIndex) return department;
              return {
                ...department,
                members: department.members.map((current, currentMemberIndex) =>
                  currentMemberIndex === memberIndex
                    ? {
                        ...current,
                        role_ht: byId.role?.kreyol ?? current.role_ht,
                        role_en: byId.role?.english ?? current.role_en,
                        bio_ht: byId.bio?.kreyol ?? current.bio_ht,
                        bio_en: byId.bio?.english ?? current.bio_en,
                      }
                    : current
                ),
              };
            })
          );
        },
        member.name || `team member ${memberIndex + 1}`
      );
    } finally {
      setTranslatingTeamMemberKey(null);
    }
  };

  const handleTranslateMinistry = async () => {
    await runBilingualTranslation(
      [
        { id: 'ministry_title', kreyol: minForm.title_kreyol, english: minForm.title_english },
        { id: 'ministry_description', kreyol: minForm.description_kreyol, english: minForm.description_english },
        { id: 'ministry_bullets', kreyol: minForm.bullets_kreyol, english: minForm.bullets_english },
      ],
      (updated) => {
        const byId = Object.fromEntries(updated.map((field) => [field.id, field]));
        setMinForm((prev) => ({
          ...prev,
          title_kreyol: byId.ministry_title?.kreyol ?? prev.title_kreyol,
          title_english: byId.ministry_title?.english ?? prev.title_english,
          description_kreyol: byId.ministry_description?.kreyol ?? prev.description_kreyol,
          description_english: byId.ministry_description?.english ?? prev.description_english,
          bullets_kreyol: byId.ministry_bullets?.kreyol ?? prev.bullets_kreyol,
          bullets_english: byId.ministry_bullets?.english ?? prev.bullets_english,
        }));
      },
      `${selectedMinistrySlug} ministry content`
    );
  };

  const handleTranslateSchedule = async () => {
    await runBilingualTranslation(
      [
        { id: 'day', kreyol: schedDayHt, english: schedDayEn },
        { id: 'title', kreyol: schedTitleHt, english: schedTitleEn },
        { id: 'description', kreyol: schedDescHt, english: schedDescEn },
      ],
      (updated) => {
        const byId = Object.fromEntries(updated.map((field) => [field.id, field]));
        if (byId.day) {
          setSchedDayHt(byId.day.kreyol);
          setSchedDayEn(byId.day.english);
        }
        if (byId.title) {
          setSchedTitleHt(byId.title.kreyol);
          setSchedTitleEn(byId.title.english);
        }
        if (byId.description) {
          setSchedDescHt(byId.description.kreyol);
          setSchedDescEn(byId.description.english);
        }
      },
      'service schedule'
    );
  };

  const handleTranslateMission = async () => {
    await runBilingualTranslation(
      [
        { id: 'title', kreyol: missTitleHt, english: missTitleEn },
        { id: 'description', kreyol: missDescHt, english: missDescEn },
      ],
      (updated) => {
        const byId = Object.fromEntries(updated.map((field) => [field.id, field]));
        if (byId.title) {
          setPMissTitleHt(byId.title.kreyol);
          setPMissTitleEn(byId.title.english);
        }
        if (byId.description) {
          setPMissDescHt(byId.description.kreyol);
          setPMissDescEn(byId.description.english);
        }
      },
      'Haiti mission project'
    );
  };

  const handleTranslateOutreach = async () => {
    await runBilingualTranslation(
      [
        { id: 'title', kreyol: outrTitleHt, english: outrTitleEn },
        { id: 'description', kreyol: outrDescHt, english: outrDescEn },
        { id: 'schedule', kreyol: outrSchedHt, english: outrSchedEn },
      ],
      (updated) => {
        const byId = Object.fromEntries(updated.map((field) => [field.id, field]));
        if (byId.title) {
          setOutrTitleHt(byId.title.kreyol);
          setOutrTitleEn(byId.title.english);
        }
        if (byId.description) {
          setOutrDescHt(byId.description.kreyol);
          setOutrDescEn(byId.description.english);
        }
        if (byId.schedule) {
          setOutrSchedHt(byId.schedule.kreyol);
          setOutrSchedEn(byId.schedule.english);
        }
      },
      'local outreach project'
    );
  };

  const handleTranslateEvent = async () => {
    await runBilingualTranslation(
      [
        { id: 'title', kreyol: evTitleHt, english: evTitleEn },
        { id: 'location', kreyol: evLocHt, english: evLocEn },
        { id: 'description', kreyol: evDescHt, english: evDescEn },
      ],
      (updated) => {
        const byId = Object.fromEntries(updated.map((field) => [field.id, field]));
        if (byId.title) {
          setEvTitleHt(byId.title.kreyol);
          setEvTitleEn(byId.title.english);
        }
        if (byId.location) {
          setEvLocHt(byId.location.kreyol);
          setEvLocEn(byId.location.english);
        }
        if (byId.description) {
          setEvDescHt(byId.description.kreyol);
          setEvDescEn(byId.description.english);
        }
      },
      'church event'
    );
  };

  const handleTranslateSermon = async () => {
    await runBilingualTranslation(
      [
        { id: 'title', kreyol: sermTitleHt, english: sermTitleEn },
        { id: 'description', kreyol: sermDescHt, english: sermDescEn },
      ],
      (updated) => {
        const byId = Object.fromEntries(updated.map((field) => [field.id, field]));
        if (byId.title) {
          setSermTitleHt(byId.title.kreyol);
          setSermTitleEn(byId.title.english);
        }
        if (byId.description) {
          setSermDescHt(byId.description.kreyol);
          setSermDescEn(byId.description.english);
        }
      },
      'sermon archive entry'
    );
  };

  const handleTranslateDevotional = async () => {
    await runBilingualTranslation(
      [
        { id: 'verse_ref', kreyol: editDevotionalForm.verse_ref_kreyol, english: editDevotionalForm.verse_ref_english },
        { id: 'verse_text', kreyol: editDevotionalForm.verse_text_kreyol, english: editDevotionalForm.verse_text_english },
        { id: 'lesson', kreyol: editDevotionalForm.lesson_kreyol, english: editDevotionalForm.lesson_english },
      ],
      (updated) => {
        const byId = Object.fromEntries(updated.map((field) => [field.id, field]));
        setEditDevotionalForm((prev) => ({
          ...prev,
          verse_ref_kreyol: byId.verse_ref?.kreyol ?? prev.verse_ref_kreyol,
          verse_ref_english: byId.verse_ref?.english ?? prev.verse_ref_english,
          verse_text_kreyol: byId.verse_text?.kreyol ?? prev.verse_text_kreyol,
          verse_text_english: byId.verse_text?.english ?? prev.verse_text_english,
          lesson_kreyol: byId.lesson?.kreyol ?? prev.lesson_kreyol,
          lesson_english: byId.lesson?.english ?? prev.lesson_english,
        }));
      },
      'daily devotional'
    );
  };

  const handleTranslateFreeGift = async () => {
    await runBilingualTranslation(
      [
        { id: 'gift_title', kreyol: giftTitleHt, english: giftTitleEn },
        { id: 'gift_desc', kreyol: giftDescHt, english: giftDescEn },
      ],
      (updated) => {
        const byId = Object.fromEntries(updated.map((field) => [field.id, field]));
        if (byId.gift_title) {
          setGiftTitleHt(byId.gift_title.kreyol);
          setGiftTitleEn(byId.gift_title.english);
        }
        if (byId.gift_desc) {
          setGiftDescHt(byId.gift_desc.kreyol);
          setGiftDescEn(byId.gift_desc.english);
        }
      },
      'free spiritual gift resource'
    );
  };

  const handleAutoTranslate = async () => {
    const hasHt = blogForm.title_kreyol.trim() || blogForm.content_kreyol.trim();
    const hasEn = blogForm.title_english.trim() || blogForm.content_english.trim();

    if (!hasHt && !hasEn) {
      triggerAlert(
        language === 'fr_ht'
          ? 'Veuillez saisir du texte en français ou en anglais avant de lancer la traduction.'
          : 'Please enter content in either French or English before translating.',
        'error'
      );
      return;
    }

    let fromLang: 'en' | 'fr_ht' | null = resolveTranslateSourceLang(
      bilingualTranslateDirection,
      `${blogForm.title_kreyol}\n${blogForm.content_kreyol}`,
      `${blogForm.title_english}\n${blogForm.content_english}`,
      language
    );

    if (!fromLang) {
      triggerAlert(
        language === 'fr_ht'
          ? 'Veuillez saisir du texte en français ou en anglais avant de lancer la traduction.'
          : 'Please enter content in either French or English before translating.',
        'error'
      );
      return;
    }

    setIsTranslating(true);
    triggerAlert(
      language === 'fr_ht'
        ? 'Traduction intelligente en cours...'
        : 'Smart translation in progress...',
      'success'
    );

    try {
      const sourceTitle = fromLang === 'en' ? blogForm.title_english : blogForm.title_kreyol;
      const sourceContent = fromLang === 'en' ? blogForm.content_english : blogForm.content_kreyol;

      const res = await translateBlogContentAction(sourceTitle, sourceContent, fromLang);
      if (res.success && res.translatedTitle && res.translatedContent) {
        setBlogForm(prev => {
          if (fromLang === 'en') {
            return {
              ...prev,
              title_kreyol: res.translatedTitle!,
              content_kreyol: res.translatedContent!
            };
          } else {
            return {
              ...prev,
              title_english: res.translatedTitle!,
              content_english: res.translatedContent!
            };
          }
        });
        triggerAlert(
          language === 'fr_ht'
            ? 'Traduction terminée avec succès !'
            : 'Translation completed successfully!',
          'success'
        );
      } else {
        triggerAlert(res.error || 'Translation failed', 'error');
      }
    } catch (err: any) {
      triggerAlert(err.message || 'An error occurred during translation', 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleExpectFile = (file: File | undefined) => {
    if (!file) return;
    compressAndResizeImage(file, 800, 600, 0.85, (b64) => {
      setExpectImageUrl(b64);
    });
  };

  const handlePasteExpect = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) handleExpectFile(file);
        break;
      }
    }
  };

  const handleDropExpect = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingExpect(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleExpectFile(files[0]);
    }
  };

  const handleHomeTabsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalAboutUsImg = aboutUsImageUrl;
      if (aboutUsImageUrl && aboutUsImageUrl.startsWith('data:')) {
        triggerAlert(language === 'fr_ht' ? 'Téléversement de l’image « Qui sommes-nous »...' : 'Uploading "About Us" image...', 'success');
        const res = await clientUploadAsset('home_about_us_bg.jpg', aboutUsImageUrl);
        if (res.success && res.url) {
          finalAboutUsImg = res.url;
          setAboutUsImageUrl(res.url);
        } else {
          triggerAlert(res.error || 'Failed to upload "About Us" image', 'error');
          return;
        }
      }

      // Upload any new team member photos
      const updatedTeamDepartments = teamDepartments.map((department) => ({
        ...department,
        members: [...department.members],
      }));
      let uploadCounter = 0;
      for (let deptIndex = 0; deptIndex < updatedTeamDepartments.length; deptIndex++) {
        for (let memberIndex = 0; memberIndex < updatedTeamDepartments[deptIndex].members.length; memberIndex++) {
          const member = updatedTeamDepartments[deptIndex].members[memberIndex];
          if (member.image_url && member.image_url.startsWith('data:')) {
            uploadCounter += 1;
            triggerAlert(
              language === 'fr_ht'
                ? `Téléversement de la photo de ${member.name || 'responsable ' + uploadCounter}...`
                : `Uploading photo for ${member.name || 'leader ' + uploadCounter}...`,
              'success'
            );
            const res = await clientUploadAsset(
              `home_team_member_${deptIndex}_${memberIndex}_${Date.now()}.jpg`,
              member.image_url
            );
            if (res.success && res.url) {
              updatedTeamDepartments[deptIndex].members[memberIndex] = { ...member, image_url: res.url };
            } else {
              triggerAlert(res.error || `Failed to upload photo for ${member.name || 'leader ' + uploadCounter}`, 'error');
              return;
            }
          }
        }
      }
      setTeamDepartments(updatedTeamDepartments);
      const updatedTeamMembers = flattenTeamMembers(updatedTeamDepartments);

      let finalExpectImg = expectImageUrl;
      if (expectImageUrl && expectImageUrl.startsWith('data:')) {
        triggerAlert(language === 'fr_ht' ? 'Téléversement de l’image « À quoi vous attendre »...' : 'Uploading "What to Expect" image...', 'success');
        const res = await clientUploadAsset('home_expect_bg.jpg', expectImageUrl);
        if (res.success && res.url) {
          finalExpectImg = res.url;
          setExpectImageUrl(res.url);
        } else {
          triggerAlert(res.error || 'Failed to upload "What to Expect" image', 'error');
          return;
        }
      }

      triggerAlert(language === 'fr_ht' ? 'Enregistrement des modifications...' : 'Saving changes...', 'success');

      const settingsMap: Record<string, string> = {
        about_us_title_en: aboutUsTitleEn,
        about_us_title_ht: aboutUsTitleHt,
        about_us_p1_en: aboutUsP1En,
        about_us_p1_ht: aboutUsP1Ht,
        about_us_p2_en: aboutUsP2En,
        about_us_p2_ht: aboutUsP2Ht,
        about_us_image_url: finalAboutUsImg,

        beliefs_title_en: beliefsTitleEn,
        beliefs_title_ht: beliefsTitleHt,
        belief_1_title_en: belief1TitleEn,
        belief_1_title_ht: belief1TitleHt,
        belief_1_desc_en: belief1DescEn,
        belief_1_desc_ht: belief1DescHt,
        belief_2_title_en: belief2TitleEn,
        belief_2_title_ht: belief2TitleHt,
        belief_2_desc_en: belief2DescEn,
        belief_2_desc_ht: belief2DescHt,
        belief_3_title_en: belief3TitleEn,
        belief_3_title_ht: belief3TitleHt,
        belief_3_desc_en: belief3DescEn,
        belief_3_desc_ht: belief3DescHt,
        belief_4_title_en: belief4TitleEn,
        belief_4_title_ht: belief4TitleHt,
        belief_4_desc_en: belief4DescEn,
        belief_4_desc_ht: belief4DescHt,

        team_title_en: teamTitleEn,
        team_title_ht: teamTitleHt,
        team_subtitle_en: teamSubtitleEn,
        team_subtitle_ht: teamSubtitleHt,
        team_departments_json: JSON.stringify(updatedTeamDepartments),
        team_members_json: JSON.stringify(updatedTeamMembers),
        // Legacy keys for backwards compatibility:
        team_p1_name: updatedTeamMembers[0]?.name || '',
        team_p1_role_en: updatedTeamMembers[0]?.role_en || '',
        team_p1_role_ht: updatedTeamMembers[0]?.role_ht || '',
        team_p1_bio_en: updatedTeamMembers[0]?.bio_en || '',
        team_p1_bio_ht: updatedTeamMembers[0]?.bio_ht || '',
        team_p1_image_url: updatedTeamMembers[0]?.image_url || '',
        team_p1_email: updatedTeamMembers[0]?.email || '',
        team_p2_name: updatedTeamMembers[1]?.name || '',
        team_p2_role_en: updatedTeamMembers[1]?.role_en || '',
        team_p2_role_ht: updatedTeamMembers[1]?.role_ht || '',
        team_p2_bio_en: updatedTeamMembers[1]?.bio_en || '',
        team_p2_bio_ht: updatedTeamMembers[1]?.bio_ht || '',
        team_p2_image_url: updatedTeamMembers[1]?.image_url || '',
        team_p2_email: updatedTeamMembers[1]?.email || '',

        expect_title_en: expectTitleEn,
        expect_title_ht: expectTitleHt,
        expect_p1_en: expectP1En,
        expect_p1_ht: expectP1Ht,
        expect_image_url: finalExpectImg,
        expect_bullet1_en: expectBullet1En,
        expect_bullet1_ht: expectBullet1Ht,
        expect_bullet2_en: expectBullet2En,
        expect_bullet2_ht: expectBullet2Ht,
        expect_bullet3_en: expectBullet3En,
        expect_bullet3_ht: expectBullet3Ht,
      };

      const res = await updateGlobalSettings(settingsMap);
      if (res.success) {
        triggerAlert(language === 'fr_ht' ? 'Onglets de la page d’accueil configurés avec succès !' : 'Home tabs configured successfully!', 'success');
      } else {
        triggerAlert(res.error || 'Failed to save configuration', 'error');
      }
    } catch (err: any) {
      console.error(err);
      triggerAlert(err.message || 'An error occurred while saving', 'error');
    }
  };

  // FREE GIFT FILE HANDLERS & HELPERS
  const handleGiftFile = (file: File | undefined) => {
    if (!file) return;
    setGiftIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target?.result) {
        setGiftFileUrl(e.target.result as string);
        triggerAlert(language === 'fr_ht' ? 'Fichier chargé dans le cache avec succès !' : 'File loaded into cache successfully!', 'success');
      }
      setGiftIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handlePasteGift = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const file = items[i].getAsFile();
      if (file) {
        handleGiftFile(file);
        break;
      }
    }
  };

  const handleDropGift = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingGift(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleGiftFile(files[0]);
    }
  };

  // SUBSCRIBERS UTILITY ACTIONS
  const [copiedSubscribers, setCopiedSubscribers] = useState(false);
  const handleCopySubscribersEmails = () => {
    const emails = subscriberList.map(s => s.email).filter(Boolean).join(', ');
    if (!emails) {
      triggerAlert(language === 'fr_ht' ? 'Aucune adresse courriel n’est disponible.' : 'No email addresses available.', 'error');
      return;
    }
    navigator.clipboard.writeText(emails);
    setCopiedSubscribers(true);
    triggerAlert(language === 'fr_ht' ? 'Liste des adresses courriel copiée !' : 'Emails list copied!', 'success');
    setTimeout(() => {
      setCopiedSubscribers(false);
    }, 2000);
  };

  const handleDeleteSubscriber = async (id: number) => {
    if (!confirm(language === 'fr_ht' ? 'Êtes-vous sûr de vouloir supprimer cet abonnement ?' : 'Are you sure you want to delete this subscriber?')) {
      return;
    }
    
    const previousList = subscriberList;
    setSubscriberList(subscriberList.filter(sub => sub.id !== id));
    
    try {
      const res = await deleteLead(id);
      if (!res.success) {
        triggerAlert(language === 'fr_ht' ? 'Erreur : ' + res.error : 'Error: ' + res.error, 'error');
        setSubscriberList(previousList);
      } else {
        triggerAlert(language === 'fr_ht' ? 'Abonnement supprimé avec succès !' : 'Subscriber deleted successfully!', 'success');
      }
    } catch (err: any) {
      triggerAlert(err.message || 'Error occurred', 'error');
      setSubscriberList(previousList);
    }
  };

  // DAILY DEVOTIONAL HANDLERS
  const handleToggleAutoPublish = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    const val = isChecked ? 'true' : 'false';
    setDevotionalAutoPublish(val);
    try {
      const res = await updateGlobalSettings({ devotional_auto_publish: val });
      if (res.success) {
        triggerAlert(
          language === 'fr_ht'
            ? 'Parfait ! Les paramètres ont été enregistrés.'
            : 'Settings updated successfully.',
          'success'
        );
      } else {
        triggerAlert(res.error || 'Failed to update auto-publish state', 'error');
      }
    } catch (err: any) {
      triggerAlert(err.message || 'Error updating settings', 'error');
    }
  };

  const handleDevotionalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDevotionalId === null) return;

    try {
      const res = await saveDailyDevotional(
        editingDevotionalId,
        editDevotionalForm.verse_ref_english,
        editDevotionalForm.verse_ref_kreyol,
        editDevotionalForm.verse_text_english,
        editDevotionalForm.verse_text_kreyol,
        editDevotionalForm.lesson_english,
        editDevotionalForm.lesson_kreyol,
        editDevotionalForm.status
      );

      if (res.success) {
        setDevotionalList(prev =>
          prev.map(d =>
            d.id === editingDevotionalId
              ? {
                  ...d,
                  verse_ref_english: editDevotionalForm.verse_ref_english,
                  verse_ref_kreyol: editDevotionalForm.verse_ref_kreyol,
                  verse_text_english: editDevotionalForm.verse_text_english,
                  verse_text_kreyol: editDevotionalForm.verse_text_kreyol,
                  lesson_english: editDevotionalForm.lesson_english,
                  lesson_kreyol: editDevotionalForm.lesson_kreyol,
                  status: editDevotionalForm.status
                }
              : d
          )
        );
        setEditingDevotionalId(null);
        triggerAlert(
          language === 'fr_ht' ? 'Dévotion enregistrée avec succès !' : 'Devotional saved successfully!',
          'success'
        );
      } else {
        triggerAlert(res.error || 'Failed to save', 'error');
      }
    } catch (err: any) {
      triggerAlert(err.message || 'Error saving', 'error');
    }
  };

  const handleDevotionalApprove = async (id: number) => {
    try {
      const res = await approveDailyDevotional(id);
      if (res.success) {
        setDevotionalList(prev =>
          prev.map(d => (d.id === id ? { ...d, status: 'approved' } : d))
        );
        triggerAlert(
          language === 'fr_ht' ? 'Dévotion approuvée et publiée !' : 'Devotional approved and published!',
          'success'
        );
      } else {
        triggerAlert(res.error || 'Failed to approve', 'error');
      }
    } catch (err: any) {
      triggerAlert(err.message || 'Error approving', 'error');
    }
  };

  const handleDevotionalDelete = async (id: number) => {
    if (
      !confirm(
        language === 'fr_ht'
          ? 'Êtes-vous sûr de vouloir supprimer cette dévotion ?'
          : 'Are you sure you want to delete this devotional?'
      )
    ) {
      return;
    }

    try {
      const res = await deleteDailyDevotional(id);
      if (res.success) {
        setDevotionalList(prev => prev.filter(d => d.id !== id));
        triggerAlert(
          language === 'fr_ht' ? 'Dévotion supprimée !' : 'Devotional deleted successfully!',
          'success'
        );
      } else {
        triggerAlert(res.error || 'Failed to delete', 'error');
      }
    } catch (err: any) {
      triggerAlert(err.message || 'Error deleting', 'error');
    }
  };

  const handleDevotionalGenerate = async () => {
    if (devotionalThemeEnabled && !devotionalThemePrompt.trim()) {
      triggerAlert(t.devotionalThemeWarning, 'error');
      return;
    }

    // Generate for today's date in local system timezone (YYYY-MM-DD format)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const trimmedPrompt = devotionalThemePrompt.trim();

    try {
      await updateGlobalSettings({
        devotional_theme_enabled: devotionalThemeEnabled ? 'true' : 'false',
        devotional_theme: devotionalThemeEnabled ? trimmedPrompt : 'none',
      });

      triggerAlert(
        language === 'fr_ht' ? 'Génération d’une nouvelle dévotion...' : 'Generating new devotional...',
        'success'
      );
      const res = await generateDevotionalAction(dateStr, {
        useTheme: devotionalThemeEnabled,
        themePrompt: devotionalThemeEnabled ? trimmedPrompt : undefined,
      });
      if (res.success && res.devotional) {
        // Since we might already have this date, insert or replace it in the local state
        setDevotionalList(prev => {
          const filtered = prev.filter(d => d.date !== dateStr);
          return [res.devotional!, ...filtered];
        });
        triggerAlert(
          language === 'fr_ht'
            ? 'Nouvelle dévotion générée avec succès !'
            : 'New devotional generated successfully!',
          'success'
        );
      } else {
        triggerAlert(res.error || 'Failed to generate devotional', 'error');
      }
    } catch (err: any) {
      triggerAlert(err.message || 'Error generating', 'error');
    }
  };

  const startEditDevotional = (devotional: DailyDevotional) => {
    setEditingDevotionalId(devotional.id);
    setEditDevotionalForm({
      verse_ref_english: devotional.verse_ref_english,
      verse_ref_kreyol: devotional.verse_ref_kreyol,
      verse_text_english: devotional.verse_text_english,
      verse_text_kreyol: devotional.verse_text_kreyol,
      lesson_english: devotional.lesson_english,
      lesson_kreyol: devotional.lesson_kreyol,
      status: devotional.status
    });
  };

  // KNOWLEDGE BASE (GLOBAL CONTEXT) HANDLERS
  const handleKbFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      triggerAlert(language === 'fr_ht' ? 'Seuls les fichiers PDF sont acceptés par glisser-déposer.' : 'Only PDF files are supported for drag & drop.', 'error');
      return;
    }

    setKbIsUploading(true);
    triggerAlert(language === 'fr_ht' ? 'Téléversement du fichier PDF...' : 'Uploading PDF file...', 'success');

    try {
      const res = await clientUploadAsset(file.name, file);
      if (res.success && res.url) {
        const title = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, ' ');
        const saveRes = await addKnowledgeBaseItem(title, 'pdf', res.url);
        if (saveRes.success) {
          triggerAlert(language === 'fr_ht' ? 'PDF ajouté à la base de connaissances !' : 'PDF successfully added to Knowledge Base!', 'success');
          
          if (automateWithDoc) {
            triggerAlert(language === 'fr_ht' 
              ? 'L’IA analyse le PDF et met automatiquement le site à jour...'
              : 'AI is extracting PDF contents and automating website updates...', 'success');
            
            const autoRes = await automateWebsiteContentFromPdf(res.url);
            if (autoRes.success) {
              triggerAlert(autoRes.message || 'Successfully updated content!', 'success');
            } else {
              triggerAlert(autoRes.error || 'AI Extraction failed', 'error');
            }
          }

          router.refresh();
        } else {
          triggerAlert(saveRes.error || 'Failed to save to database', 'error');
        }
      } else {
        triggerAlert(res.error || 'Failed to upload PDF', 'error');
      }
      setKbIsUploading(false);
    } catch (err: any) {
      triggerAlert(err.message || 'Error uploading PDF', 'error');
      setKbIsUploading(false);
    }
  };

  const handleKbTextOrUrl = async (text: string) => {
    if (!text) return;
    const cleanUrl = text.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      triggerAlert(language === 'fr_ht' ? 'Seules les URL commençant par http/https sont acceptées.' : 'Only URLs starting with http/https are supported.', 'error');
      return;
    }

    setKbIsUploading(true);
    let type = 'link';
    let title = 'Lien de référence';

    if (cleanUrl.includes('docs.google.com/document')) {
      type = 'google_doc';
      title = language === 'fr_ht' ? 'Document Google' : 'Google Doc Reference';
    } else if (cleanUrl.includes('docs.google.com/spreadsheets')) {
      type = 'google_sheet';
      title = language === 'fr_ht' ? 'Feuille Google' : 'Google Sheet Reference';
    } else {
      title = language === 'fr_ht' ? 'Lien de référence' : 'Web Resource Link';
    }

    try {
      const saveRes = await addKnowledgeBaseItem(title, type, cleanUrl);
      if (saveRes.success) {
        triggerAlert(language === 'fr_ht' ? 'Lien de référence ajouté !' : 'Link successfully added to Knowledge Base!', 'success');
        router.refresh();
      } else {
        triggerAlert(saveRes.error || 'Failed to save link', 'error');
      }
    } catch (err: any) {
      triggerAlert(err.message || 'Error saving link', 'error');
    } finally {
      setKbIsUploading(false);
    }
  };

  const handleKbPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (text) {
      handleKbTextOrUrl(text);
    }
  };

  const handleKbDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingKb(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleKbFile(files[0]);
    } else {
      const text = e.dataTransfer.getData('text');
      if (text) {
        handleKbTextOrUrl(text);
      }
    }
  };

  const handleManualKbSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kbManualTitle || !kbManualUrl) {
      triggerAlert(language === 'fr_ht' ? 'Le titre et l’URL sont obligatoires.' : 'Title and URL are required.', 'error');
      return;
    }

    setKbIsUploading(true);
    try {
      const saveRes = await addKnowledgeBaseItem(kbManualTitle, kbManualType, kbManualUrl);
      if (saveRes.success) {
        triggerAlert(language === 'fr_ht' ? 'Ressource ajoutée avec succès !' : 'Resource added successfully!', 'success');
        setKbManualTitle('');
        setKbManualUrl('');
        router.refresh();
      } else {
        triggerAlert(saveRes.error || 'Failed to save resource', 'error');
      }
    } catch (err: any) {
      triggerAlert(err.message || 'Error saving resource', 'error');
    } finally {
      setKbIsUploading(false);
    }
  };

  const handleDeleteKb = async (id: number) => {
    if (!confirm(language === 'fr_ht' ? 'Êtes-vous sûr de vouloir supprimer cette ressource ?' : 'Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      const res = await deleteKnowledgeBaseItem(id);
      if (res.success) {
        triggerAlert(language === 'fr_ht' ? 'Ressource supprimée !' : 'Resource deleted successfully!', 'success');
        router.refresh();
      } else {
        triggerAlert(res.error || 'Failed to delete resource', 'error');
      }
    } catch (err: any) {
      triggerAlert(err.message || 'Error deleting resource', 'error');
    }
  };

  const handleResetContentFromPdf = async (pdfUrl: string, documentTitle: string) => {
    const warningMessage = language === 'fr_ht'
      ? `AVERTISSEMENT CRITIQUE : cette opération effacera et remplacera tous les horaires de culte, projets communautaires, événements et paramètres actuels par les données du document « ${documentTitle} ». Toutes les modifications manuelles seront perdues. Voulez-vous vraiment continuer ?`
      : `CRITICAL WARNING: This will overwrite and completely replace your current service schedules, community outreach projects, upcoming events, and global configurations with the content extracted from "${documentTitle}". Any manual edits made will be lost. Are you sure you want to continue?`;
    
    if (window.confirm(warningMessage)) {
      setKbIsUploading(true);
      triggerAlert(language === 'fr_ht' 
        ? 'L’IA analyse le PDF et met automatiquement le site à jour...'
        : 'AI is extracting PDF contents and automating website updates...', 'success');
      
      try {
        const autoRes = await automateWebsiteContentFromPdf(pdfUrl);
        if (autoRes.success) {
          triggerAlert(autoRes.message || 'Successfully updated content!', 'success');
          router.refresh();
        } else {
          triggerAlert(autoRes.error || 'AI Extraction failed', 'error');
        }
      } catch (err: any) {
        triggerAlert(err.message || 'Error processing document content', 'error');
      } finally {
        setKbIsUploading(false);
      }
    }
  };

  // Automated client-side canvas color extraction
  const extractColorsFromLogo = (base64Image: string) => {
    const getLuminance = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

    const lightenForButtons = (r: number, g: number, b: number, minLuminance = 95): [number, number, number] => {
      let nr = r;
      let ng = g;
      let nb = b;
      let lum = getLuminance(nr, ng, nb);

      while (lum < minLuminance && lum < 255) {
        nr = Math.min(255, Math.round(nr + (255 - nr) * 0.2));
        ng = Math.min(255, Math.round(ng + (255 - ng) * 0.2));
        nb = Math.min(255, Math.round(nb + (255 - nb) * 0.2));
        const nextLum = getLuminance(nr, ng, nb);
        if (nextLum <= lum) break;
        lum = nextLum;
      }

      return [nr, ng, nb];
    };

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = 40;
      canvas.height = 40;
      ctx.drawImage(img, 0, 0, 40, 40);
      
      const imgData = ctx.getImageData(0, 0, 40, 40).data;
      const colorMap: Record<string, number> = {};
      
      for (let i = 0; i < imgData.length; i += 4) {
        const r = imgData[i];
        const g = imgData[i+1];
        const b = imgData[i+2];
        const a = imgData[i+3];
        
        if (a < 180) continue; // Skip transparency
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        
        if (diff < 20) continue; // Skip neutral grays/blacks/whites
        
        const luminance = getLuminance(r, g, b);
        if (luminance < 70 || luminance > 220) continue; // Skip too dark/too bright for buttons
        
        const rgbKey = `${r},${g},${b}`;
        colorMap[rgbKey] = (colorMap[rgbKey] || 0) + 1;
      }
      
      const sortedColors = Object.entries(colorMap).sort((a, b) => b[1] - a[1]);
      
      if (sortedColors.length > 0) {
        const [domR, domG, domB] = sortedColors[0][0].split(',').map(Number);
        const [btnR, btnG, btnB] = lightenForButtons(domR, domG, domB);
        
        const rgbToHex = (r: number, g: number, b: number) => 
          "#" + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
          }).join("");
          
        const primaryHex = rgbToHex(btnR, btnG, btnB);
        
        // Hover is a slightly darker version
        const hoverR = Math.max(0, Math.floor(btnR * 0.85));
        const hoverG = Math.max(0, Math.floor(btnG * 0.85));
        const hoverB = Math.max(0, Math.floor(btnB * 0.85));
        const hoverHex = rgbToHex(hoverR, hoverG, hoverB);
        
        // Find a distinct secondary accent color from top 10 dominant colors
        let accentHex = '#3b82f6';
        let foundDistinct = false;
        for (let j = 1; j < Math.min(10, sortedColors.length); j++) {
          const [secR, secG, secB] = sortedColors[j][0].split(',').map(Number);
          const distance = Math.sqrt(
            Math.pow(secR - btnR, 2) + 
            Math.pow(secG - btnG, 2) + 
            Math.pow(secB - btnB, 2)
          );
          if (distance > 70) {
            accentHex = rgbToHex(secR, secG, secB);
            foundDistinct = true;
            break;
          }
        }
        if (!foundDistinct) {
          accentHex = rgbToHex(255 - btnR, 255 - btnG, 255 - btnB);
        }
        
        setThemePrimary(primaryHex);
        setThemeHover(hoverHex);
        setThemeAccent(accentHex);
        triggerAlert(t.adminColorPaletteDetected, 'success');
      }
    };
    img.src = base64Image;
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalLogoUrl = logoUrl;
    let finalBgUrl = bgUrl;
    let finalGiftFileUrl = giftFileUrl;

    // Check if new logo needs to be uploaded as a file
    if (logoUrl.startsWith('data:')) {
      const uploadRes = await clientUploadAsset('logo.png', logoUrl);
      if (uploadRes.success && uploadRes.url) {
        finalLogoUrl = uploadRes.url;
        setLogoUrl(uploadRes.url); // Update state
      } else {
        triggerAlert(language === 'fr_ht' ? 'Erreur lors du téléversement du logo : ' + uploadRes.error : 'Error uploading logo: ' + uploadRes.error, 'error');
        return;
      }
    }

    // Check if new background needs to be uploaded as a file
    if (bgUrl.startsWith('data:')) {
      const uploadRes = await clientUploadAsset('hero_bg.jpg', bgUrl);
      if (uploadRes.success && uploadRes.url) {
        finalBgUrl = uploadRes.url;
        setBgUrl(uploadRes.url); // Update state
      } else {
        triggerAlert(language === 'fr_ht' ? 'Erreur lors du téléversement de l’arrière-plan : ' + uploadRes.error : 'Error uploading background: ' + uploadRes.error, 'error');
        return;
      }
    }

    // Check if new free gift file needs to be uploaded as a file
    if (giftFileUrl.startsWith('data:')) {
      let ext = 'txt';
      if (giftFileUrl.includes('application/pdf')) ext = 'pdf';
      else if (giftFileUrl.includes('msword') || giftFileUrl.includes('officedocument')) ext = 'docx';
      
      const uploadRes = await clientUploadAsset(`free_gift_${Date.now()}.${ext}`, giftFileUrl);
      if (uploadRes.success && uploadRes.url) {
        finalGiftFileUrl = uploadRes.url;
        setGiftFileUrl(uploadRes.url); // Update state
      } else {
        triggerAlert(language === 'fr_ht' ? 'Erreur lors du téléversement du cadeau : ' + uploadRes.error : 'Error uploading free gift: ' + uploadRes.error, 'error');
        return;
      }
    } else if (finalGiftFileUrl.startsWith('/api/assets/')) {
      const assetCheck = await verifyAssetUrl(finalGiftFileUrl);
      if (!assetCheck.exists) {
        triggerAlert(
          language === 'fr_ht'
            ? 'Le fichier du cadeau gratuit est introuvable sur le serveur. Veuillez le téléverser à nouveau avant d’enregistrer.'
            : 'The free gift file is missing from server storage. Please upload it again before saving.',
          'error'
        );
        return;
      }
    }

    // Check if new custom live event thumbnail needs to be uploaded as a file
    let finalCustomLiveEventThumbnailUrl = customLiveEventThumbnailUrl;
    if (customLiveEventThumbnailUrl.startsWith('data:')) {
      const uploadRes = await clientUploadAsset(`custom_live_event_thumbnail_${Date.now()}.jpg`, customLiveEventThumbnailUrl);
      if (uploadRes.success && uploadRes.url) {
        finalCustomLiveEventThumbnailUrl = uploadRes.url;
        setCustomLiveEventThumbnailUrl(uploadRes.url); // Update state
      } else {
        triggerAlert(language === 'fr_ht' ? 'Erreur lors du téléversement de la miniature : ' + uploadRes.error : 'Error uploading custom live stream event thumbnail: ' + uploadRes.error, 'error');
        return;
      }
    }

    const res = await updateGlobalSettings({
      pastor_name: pastorName,
      pastor_message_kreyol: pMsgHt,
      pastor_message_english: pMsgEn,
      church_phone: chPhone,
      church_email: chEmail,
      church_address: chAddr,
      admin_password: adminPass,
      home_background_url: finalBgUrl,
      live_stream_active: liveActive,
      live_stream_url: liveUrl,
      youtube_channel_url: ytChannelUrl,
      live_stream_event_id: liveStreamEventId,
      custom_live_event_thumbnail_url: finalCustomLiveEventThumbnailUrl,
      logo_url: finalLogoUrl,
      theme_primary: themePrimary,
      theme_hover: themeHover,
      theme_accent: themeAccent,
      theme_mode: themeMode,
      hero_bg_opacity_light: heroBgOpacityLight,
      hero_bg_opacity_dark: heroBgOpacityDark,
      soften_hero_text_bg: softenHeroTextBg,
      hide_stripe: hideStripe,
      cashapp_id: cashappId,
      venmo_id: venmoId,
      apple_pay_phone: applePayPhone,
      zelle_phone: zellePhone,
      zelle_name: zelleName,
      show_cashapp: showCashapp,
      show_venmo: showVenmo,
      show_apple_pay: showApplePay,
      show_check: showCheck,
      check_payable_to: checkPayableTo,
      check_mailing_address: checkMailingAddress,
      free_gift_title_kreyol: giftTitleHt,
      free_gift_title_english: giftTitleEn,
      free_gift_desc_kreyol: giftDescHt,
      free_gift_desc_english: giftDescEn,
      free_gift_file_url: finalGiftFileUrl,
      free_gift_admin_notes: giftAdminNotes
    });

    if (res.success) {
      triggerAlert(t.adminSaveSuccess, 'success');
      
      // Auto-trigger a website backup on successful settings save for total convenience!
      const backupRes = await backupWebsite();
      if (backupRes.success) {
        triggerAlert(language === 'fr_ht' 
          ? `Site sauvegardé dans Parousie/backups/backup_${backupRes.timestamp}!`
          : `Website backed up successfully in Parousie/backups/backup_${backupRes.timestamp}!`, 
          'success'
        );
      }
      
      router.refresh();
    } else {
      triggerAlert(res.error || 'Update failed', 'error');
    }
  };

  // 2. SERVICE SCHEDULES SUB-MUTATIONS STATE
  const parseTimeToMinutes = (timeStr: string): number => {
    const clean = timeStr.trim().toUpperCase();
    const match = clean.match(/(\d+)(?::(\d+))?\s*(AM|PM)/);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const ampm = match[3];
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const parseTimeRange = (rangeStr: string): { start: number; end: number } | null => {
    const parts = rangeStr.split('-');
    if (parts.length !== 2) return null;
    const start = parseTimeToMinutes(parts[0]);
    const end = parseTimeToMinutes(parts[1]);
    if (start === 0 && end === 0) return null;
    return { start, end };
  };

  const intervalsOverlap = (r1: { start: number; end: number }, r2: { start: number; end: number }): boolean => {
    return Math.max(r1.start, r2.start) < Math.min(r1.end, r2.end);
  };

  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [schedDayHt, setSchedDayHt] = useState('');
  const [schedDayEn, setSchedDayEn] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [schedTitleHt, setSchedTitleHt] = useState('');
  const [schedTitleEn, setSchedTitleEn] = useState('');
  const [schedDescHt, setSchedDescHt] = useState('');
  const [schedDescEn, setSchedDescEn] = useState('');
  const [schedImg, setSchedImg] = useState('');
  const [schedIsLiveStream, setSchedIsLiveStream] = useState(false);
  const [hasManuallyToggledLiveStream, setHasManuallyToggledLiveStream] = useState(false);

  // Auto-default Sunday Services to be checked for live stream
  useEffect(() => {
    if (editingScheduleId === null && !hasManuallyToggledLiveStream) {
      const dayEnLower = schedDayEn.toLowerCase().trim();
      const dayHtLower = schedDayHt.toLowerCase().trim();
      const isSunday = 
        dayEnLower === 'sunday' || 
        dayHtLower === 'dimanch' ||
        dayEnLower.startsWith('sun') ||
        dayHtLower.startsWith('dim');
      
      setSchedIsLiveStream(isSunday);
    }
  }, [schedDayEn, schedDayHt, editingScheduleId, hasManuallyToggledLiveStream]);

  const getScheduleConflict = () => {
    if (!schedIsLiveStream || !schedTime || !schedDayEn) return null;

    const currentRange = parseTimeRange(schedTime);
    if (!currentRange) return null;

    const conflict = schedules.find(s => {
      if (s.id === editingScheduleId) return false;
      if (s.is_livestreamed !== 1) return false;

      const isSameDay = 
        s.day_english.toLowerCase().trim() === schedDayEn.toLowerCase().trim() ||
        s.day_kreyol.toLowerCase().trim() === schedDayHt.toLowerCase().trim();

      if (!isSameDay) return false;

      const otherRange = parseTimeRange(s.time);
      if (!otherRange) return false;

      return intervalsOverlap(currentRange, otherRange);
    });

    return conflict || null;
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    const conflict = getScheduleConflict();
    if (conflict) {
      const confirmSave = confirm(
        language === 'fr_ht'
          ? `Attention : un autre événement diffusé en direct est prévu à la même heure (${conflict.time}). Voulez-vous tout de même l’enregistrer ?`
          : `Warning: cannot schedule 2 live stream events at the same time. This overlaps with "${conflict.title_english}" (${conflict.time}). Do you want to proceed anyway?`
      );
      if (!confirmSave) return;
    }

    let finalImgUrl = schedImg;
    if (schedImg && schedImg.startsWith('data:')) {
      triggerAlert(language === 'en' ? 'Uploading schedule image...' : 'Téléversement de l’image de l’horaire...', 'success');
      const uploadRes = await clientUploadAsset(`schedule_${Date.now()}.jpg`, schedImg);
      if (uploadRes.success && uploadRes.url) {
        finalImgUrl = uploadRes.url;
        setSchedImg(uploadRes.url!);
      } else {
        triggerAlert(uploadRes.error || 'Failed to upload schedule image', 'error');
        return;
      }
    }

    const res = await saveServiceSchedule(editingScheduleId, {
      day_kreyol: schedDayHt,
      day_english: schedDayEn,
      time: schedTime,
      title_kreyol: schedTitleHt,
      title_english: schedTitleEn,
      description_kreyol: schedDescHt,
      description_english: schedDescEn,
      image_url: finalImgUrl || undefined,
      is_livestreamed: schedIsLiveStream ? 1 : 0
    });
    if (res.success) {
      triggerAlert(t.adminSaveSuccess, 'success');
      resetScheduleForm();
      router.refresh();
    } else {
      triggerAlert(res.error || 'Failed to save', 'error');
    }
  };

  const resetScheduleForm = () => {
    setEditingScheduleId(null);
    setSchedDayHt('');
    setSchedDayEn('');
    setSchedTime('');
    setSchedTitleHt('');
    setSchedTitleEn('');
    setSchedDescHt('');
    setSchedDescEn('');
    setSchedImg('');
    setSchedIsLiveStream(false);
    setHasManuallyToggledLiveStream(false);
  };

  const handleEditScheduleClick = (sched: ServiceSchedule) => {
    setEditingScheduleId(sched.id);
    setSchedDayHt(sched.day_kreyol);
    setSchedDayEn(sched.day_english);
    setSchedTime(sched.time);
    setSchedTitleHt(sched.title_kreyol);
    setSchedTitleEn(sched.title_english);
    setSchedDescHt(sched.description_kreyol || '');
    setSchedDescEn(sched.description_english || '');
    setSchedImg(sched.image_url || '');
    setSchedIsLiveStream(sched.is_livestreamed === 1);
    setHasManuallyToggledLiveStream(true);
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm(language === 'fr_ht' ? 'Êtes-vous sûr de vouloir supprimer cet horaire ?' : 'Are you sure you want to delete this schedule?')) return;
    const res = await deleteServiceSchedule(id);
    if (res.success) {
      triggerAlert(t.adminSaveSuccess, 'success');
      router.refresh();
    } else {
      triggerAlert(res.error || 'Failed to delete', 'error');
    }
  };

  // 3. HAITI MISSIONS SUB-MUTATIONS STATE
  const [editingMissionId, setEditingMissionId] = useState<number | null>(null);
  const [missTitleHt, setPMissTitleHt] = useState('');
  const [missTitleEn, setPMissTitleEn] = useState('');
  const [missDescHt, setPMissDescHt] = useState('');
  const [missDescEn, setPMissDescEn] = useState('');
  const [missImg, setPMissImg] = useState('');
  const [missRaised, setPMissRaised] = useState(0);
  const [missGoal, setPMissGoal] = useState(0);
  const [missDate, setPMissDate] = useState('');

  const handleSaveMission = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalImgUrl = missImg;
    if (missImg && missImg.startsWith('data:')) {
      triggerAlert(language === 'en' ? 'Uploading project image...' : 'Téléversement de l’image du projet...', 'success');
      const uploadRes = await clientUploadAsset(`mission_${Date.now()}.jpg`, missImg);
      if (uploadRes.success && uploadRes.url) {
        finalImgUrl = uploadRes.url;
        setPMissImg(uploadRes.url!);
      } else {
        triggerAlert(uploadRes.error || 'Failed to upload project image', 'error');
        return;
      }
    }

    const res = await saveHaitiMission(editingMissionId, {
      title_kreyol: missTitleHt,
      title_english: missTitleEn,
      description_kreyol: missDescHt,
      description_english: missDescEn,
      image_url: finalImgUrl,
      funds_raised: Number(missRaised),
      funds_goal: Number(missGoal),
      date: missDate || new Date().toISOString().split('T')[0]
    });
    if (res.success) {
      triggerAlert(t.adminSaveSuccess, 'success');
      resetMissionForm();
      router.refresh();
    } else {
      triggerAlert(res.error || 'Failed to save', 'error');
    }
  };

  const resetMissionForm = () => {
    setEditingMissionId(null);
    setPMissTitleHt('');
    setPMissTitleEn('');
    setPMissDescHt('');
    setPMissDescEn('');
    setPMissImg('');
    setPMissRaised(0);
    setPMissGoal(0);
    setPMissDate('');
  };

  const handleEditMissionClick = (miss: HaitiMission) => {
    setEditingMissionId(miss.id);
    setPMissTitleHt(miss.title_kreyol);
    setPMissTitleEn(miss.title_english);
    setPMissDescHt(miss.description_kreyol);
    setPMissDescEn(miss.description_english);
    setPMissImg(miss.image_url || '');
    setPMissRaised(miss.funds_raised);
    setPMissGoal(miss.funds_goal);
    setPMissDate(miss.date);
  };

  const handleDeleteMission = async (id: number) => {
    if (!confirm(language === 'fr_ht' ? 'Êtes-vous sûr de vouloir supprimer ce projet ?' : 'Are you sure you want to delete this project?')) return;
    const res = await deleteHaitiMission(id);
    if (res.success) {
      triggerAlert(t.adminSaveSuccess, 'success');
      router.refresh();
    } else {
      triggerAlert(res.error || 'Failed to delete', 'error');
    }
  };

  // 4. LOCAL OUTREACH SUB-MUTATIONS STATE
  const [editingOutreachId, setEditingOutreachId] = useState<number | null>(null);
  const [outrTitleHt, setOutrTitleHt] = useState('');
  const [outrTitleEn, setOutrTitleEn] = useState('');
  const [outrDescHt, setOutrDescHt] = useState('');
  const [outrDescEn, setOutrDescEn] = useState('');
  const [outrSchedHt, setOutrSchedHt] = useState('');
  const [outrSchedEn, setOutrSchedEn] = useState('');

  const handleSaveOutreach = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await saveLocalOutreach(editingOutreachId, {
      title_kreyol: outrTitleHt,
      title_english: outrTitleEn,
      description_kreyol: outrDescHt,
      description_english: outrDescEn,
      schedule_kreyol: outrSchedHt,
      schedule_english: outrSchedEn
    });
    if (res.success) {
      triggerAlert(t.adminSaveSuccess, 'success');
      resetOutreachForm();
      router.refresh();
    } else {
      triggerAlert(res.error || 'Failed to save', 'error');
    }
  };

  const resetOutreachForm = () => {
    setEditingOutreachId(null);
    setOutrTitleHt('');
    setOutrTitleEn('');
    setOutrDescHt('');
    setOutrDescEn('');
    setOutrSchedHt('');
    setOutrSchedEn('');
  };

  const handleEditOutreachClick = (outr: LocalOutreach) => {
    setEditingOutreachId(outr.id);
    setOutrTitleHt(outr.title_kreyol);
    setOutrTitleEn(outr.title_english);
    setOutrDescHt(outr.description_kreyol);
    setOutrDescEn(outr.description_english);
    setOutrSchedHt(outr.schedule_kreyol);
    setOutrSchedEn(outr.schedule_english);
  };

  const handleDeleteOutreach = async (id: number) => {
    if (!confirm(language === 'fr_ht' ? 'Voulez-vous supprimer ce projet communautaire ?' : 'Are you sure you want to delete this community project?')) return;
    const res = await deleteLocalOutreach(id);
    if (res.success) {
      triggerAlert(t.adminSaveSuccess, 'success');
      router.refresh();
    } else {
      triggerAlert(res.error || 'Failed to delete', 'error');
    }
  };

  // 5. EVENTS SUB-MUTATIONS STATE
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [evTitleHt, setEvTitleHt] = useState('');
  const [evTitleEn, setEvTitleEn] = useState('');
  const [evDate, setEvDate] = useState('');
  const [evTime, setEvTime] = useState('');
  const [evLocHt, setEvLocHt] = useState('');
  const [evLocEn, setEvLocEn] = useState('');
  const [evDescHt, setEvDescHt] = useState('');
  const [evDescEn, setEvDescEn] = useState('');

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await saveEvent(editingEventId, {
      title_kreyol: evTitleHt,
      title_english: evTitleEn,
      date: evDate,
      time: evTime,
      location_kreyol: evLocHt,
      location_english: evLocEn,
      description_kreyol: evDescHt,
      description_english: evDescEn
    });
    if (res.success) {
      triggerAlert(t.adminSaveSuccess, 'success');
      resetEventForm();
      router.refresh();
    } else {
      triggerAlert(res.error || 'Failed to save', 'error');
    }
  };

  const resetEventForm = () => {
    setEditingEventId(null);
    setEvTitleHt('');
    setEvTitleEn('');
    setEvDate('');
    setEvTime('');
    setEvLocHt('');
    setEvLocEn('');
    setEvDescHt('');
    setEvDescEn('');
  };

  const handleEditEventClick = (ev: EventRecord) => {
    setEditingEventId(ev.id);
    setEvTitleHt(ev.title_kreyol);
    setEvTitleEn(ev.title_english);
    setEvDate(ev.date);
    setEvTime(ev.time);
    setEvLocHt(ev.location_kreyol);
    setEvLocEn(ev.location_english);
    setEvDescHt(ev.description_kreyol || '');
    setEvDescEn(ev.description_english || '');
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm(language === 'fr_ht' ? 'Voulez-vous supprimer cet événement ?' : 'Are you sure you want to delete this event?')) return;
    const res = await deleteEvent(id);
    if (res.success) {
      triggerAlert(t.adminSaveSuccess, 'success');
      router.refresh();
    } else {
      triggerAlert(res.error || 'Failed to delete', 'error');
    }
  };

  // 6. EVENT REGISTRATION DELETIONS
  const handleDeleteRegistration = async (id: number) => {
    if (!confirm(language === 'fr_ht' ? 'Voulez-vous supprimer cette inscription ?' : 'Are you sure you want to delete this registration?')) return;
    const res = await deleteRegistration(id);
    if (res.success) {
      triggerAlert(t.adminSaveSuccess, 'success');
      router.refresh();
    } else {
      triggerAlert(res.error || 'Failed to delete', 'error');
    }
  };

  // 7. SERMONS (VIDEO ARCHIVES) SUB-MUTATIONS STATE
  const [editingSermonId, setEditingSermonId] = useState<number | null>(null);
  const [sermTitleHt, setSermTitleHt] = useState('');
  const [sermTitleEn, setSermTitleEn] = useState('');
  const [sermDate, setSermDate] = useState('');
  const [sermSpeaker, setSermSpeaker] = useState('');
  const [sermYoutubeId, setSermYoutubeId] = useState('');
  const [sermDescHt, setSermDescHt] = useState('');
  const [sermDescEn, setSermDescEn] = useState('');

  const handleSaveSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await saveSermon(editingSermonId, {
      title_kreyol: sermTitleHt,
      title_english: sermTitleEn,
      date: sermDate,
      speaker: sermSpeaker,
      youtube_id: sermYoutubeId,
      description_kreyol: sermDescHt,
      description_english: sermDescEn
    });
    if (res.success) {
      triggerAlert(t.adminSaveSuccess, 'success');
      resetSermonForm();
      router.refresh();
    } else {
      triggerAlert(res.error || 'Failed to save', 'error');
    }
  };

  const resetSermonForm = () => {
    setEditingSermonId(null);
    setSermTitleHt('');
    setSermTitleEn('');
    setSermDate('');
    setSermSpeaker('');
    setSermYoutubeId('');
    setSermDescHt('');
    setSermDescEn('');
  };

  const handleEditSermonClick = (serm: Sermon) => {
    setEditingSermonId(serm.id);
    setSermTitleHt(serm.title_kreyol);
    setSermTitleEn(serm.title_english);
    setSermDate(serm.date);
    setSermSpeaker(serm.speaker);
    setSermYoutubeId(serm.youtube_id);
    setSermDescHt(serm.description_kreyol || '');
    setSermDescEn(serm.description_english || '');
  };

  const handleDeleteSermon = async (id: number) => {
    if (!confirm(language === 'fr_ht' ? 'Voulez-vous supprimer ce sermon ?' : 'Are you sure you want to delete this sermon?')) return;
    const res = await deleteSermon(id);
    if (res.success) {
      triggerAlert(t.adminSaveSuccess, 'success');
      router.refresh();
    } else {
      triggerAlert(res.error || 'Failed to delete', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --primary-color: ${themePrimary};
          --primary-hover: ${themeHover};
          --accent-color: ${themeAccent};
        }
      `}} />
      
      {/* Admin Dashboard header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-800 overflow-hidden flex items-center justify-center p-0.5 shadow-md">
              <img src={logoUrl} alt="Eglise Baptiste de la Parousie Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold font-serif text-white">{t.churchName}</h1>
              <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">{t.adminWelcome}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <AdminDocumentsMenu language={language} />

            <button
              type="button"
              onClick={handleViewWebsite}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-semibold hover:border-amber-500 text-slate-200 hover:text-white transition-all cursor-pointer"
            >
              <Globe2 className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.adminViewWebsite}</span>
            </button>

            {/* Language Switcher */}
            <button 
              onClick={() => setLanguage(language === 'fr_ht' ? 'en' : 'fr_ht')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-semibold hover:border-amber-500 text-amber-400 cursor-pointer"
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>{language === 'fr_ht' ? 'English' : 'Français'}</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.adminSignOut}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 grid lg:grid-cols-4 gap-8">
        
        {/* Floating Admin alerts */}
        {alertMsg && (
          <div className={`fixed top-6 right-6 z-50 px-5 py-4 rounded-xl border shadow-2xl flex items-center gap-3 animate-slide-in ${alertType === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
            <Check className="w-5 h-5" />
            <span className="text-sm font-semibold">{alertMsg}</span>
          </div>
        )}

        {/* Sidebar Tabs Selectors */}
        <aside className="lg:col-span-1 flex flex-col gap-2">
          
          <button 
            onClick={() => { setActiveTab('settings'); }}
            className={`w-full text-left px-4 py-3.5 rounded-xl border flex items-center gap-3 text-sm font-semibold transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/10' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
          >
            <Settings className="w-4 h-4" />
            <span>{t.adminTabSettings}</span>
          </button>

          <button 
            onClick={() => { setActiveTab('hometabs'); }}
            className={`w-full text-left px-4 py-3.5 rounded-xl border flex items-center gap-3 text-sm font-semibold transition-all cursor-pointer ${activeTab === 'hometabs' ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/10' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
          >
            <Layers className="w-4 h-4" />
            <span>{t.adminTabHomeTabs}</span>
          </button>

          <button 
            onClick={() => { setActiveTab('schedules'); }}
            className={`w-full text-left px-4 py-3.5 rounded-xl border flex items-center gap-3 text-sm font-semibold transition-all cursor-pointer ${activeTab === 'schedules' ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/10' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
          >
            <Clock className="w-4 h-4" />
            <span>{t.adminTabSchedules}</span>
          </button>

          <button 
            onClick={() => { setActiveTab('missions'); }}
            className={`w-full text-left px-4 py-3.5 rounded-xl border flex items-center gap-3 text-sm font-semibold transition-all cursor-pointer ${activeTab === 'missions' ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/10' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
          >
            <Heart className="w-4 h-4" />
            <span>{t.adminTabMissions}</span>
          </button>

          <button 
            onClick={() => { setActiveTab('outreach'); }}
            className={`w-full text-left px-4 py-3.5 rounded-xl border flex items-center gap-3 text-sm font-semibold transition-all cursor-pointer ${activeTab === 'outreach' ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/10' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{t.adminTabOutreach}</span>
          </button>

          <button 
            onClick={() => { setActiveTab('ministries'); }}
            className={`w-full text-left px-4 py-3.5 rounded-xl border flex items-center gap-3 text-sm font-semibold transition-all cursor-pointer ${activeTab === 'ministries' ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/10' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
          >
            <Users className="w-4 h-4" />
            <span>{language === 'en' ? 'Ministries' : 'Ministères'}</span>
          </button>

          <button 
            onClick={() => { setActiveTab('events'); }}
            className={`w-full text-left px-4 py-3.5 rounded-xl border flex items-center gap-3 text-sm font-semibold transition-all cursor-pointer ${activeTab === 'events' ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/10' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
          >
            <Calendar className="w-4 h-4" />
            <span>{t.adminTabEvents}</span>
          </button>

          <button 
            onClick={() => { setActiveTab('registrations'); }}
            className={`w-full text-left px-4 py-3.5 rounded-xl border flex justify-between items-center text-sm font-semibold transition-all cursor-pointer ${activeTab === 'registrations' ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/10' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
          >
            <div className="flex items-center gap-3">
              <UserCheck className="w-4 h-4" />
              <span>{t.adminRegistrationsTitle}</span>
            </div>
            {registrations.length > 0 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeTab === 'registrations' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950'}`}>
                {registrations.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => { setActiveTab('sermons'); }}
            className={`w-full text-left px-4 py-3.5 rounded-xl border flex justify-between items-center text-sm font-semibold transition-all cursor-pointer ${activeTab === 'sermons' ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/10' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
          >
            <div className="flex items-center gap-3">
              <Video className="w-4 h-4" />
              <span>{t.navSermons}</span>
            </div>
            {sermons.length > 0 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeTab === 'sermons' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950'}`}>
                {sermons.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => { setActiveTab('subscribers'); }}
            className={`w-full text-left px-4 py-3.5 rounded-xl border flex justify-between items-center text-sm font-semibold transition-all cursor-pointer ${activeTab === 'subscribers' ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/10' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4" />
              <span>{t.adminTabSubscribers}</span>
            </div>
            {subscriberList.length > 0 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeTab === 'subscribers' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950'}`}>
                {subscriberList.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => { setActiveTab('devotional'); }}
            className={`w-full text-left px-4 py-3.5 rounded-xl border flex justify-between items-center text-sm font-semibold transition-all cursor-pointer ${activeTab === 'devotional' ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/10' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4" />
              <span>{t.adminTabDevotional}</span>
            </div>
            {devotionalList.filter(d => d.status === 'pending').length > 0 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeTab === 'devotional' ? 'bg-slate-950 text-amber-400' : 'bg-red-500 text-white'}`}>
                {devotionalList.filter(d => d.status === 'pending').length}
              </span>
            )}
          </button>

          {/* SECURITY & ADMINS TAB */}
          {isSuperAdmin && (
            <button 
              onClick={() => { setActiveTab('admins'); }}
              className={`w-full text-left px-4 py-3.5 rounded-xl border flex items-center gap-3 text-sm font-semibold transition-all cursor-pointer ${activeTab === 'admins' ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/10' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
            >
              <UserCheck className="w-4 h-4" />
              <span>{t.adminTabAdmins}</span>
            </button>
          )}

          {/* CONTACT MESSAGES TAB */}
          <button 
            onClick={() => { setActiveTab('contact'); }}
            className={`w-full text-left px-4 py-3.5 rounded-xl border flex justify-between items-center text-sm font-semibold transition-all cursor-pointer ${activeTab === 'contact' ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/10' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
          >
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4" />
              <span>{t.adminTabContact}</span>
            </div>
            {contactLogs.length > 0 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeTab === 'contact' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950'}`}>
                {contactLogs.length}
              </span>
            )}
          </button>

          {/* PRAYER MODERATION TAB */}
          <button 
            onClick={() => { setActiveTab('prayers'); }}
            className={`w-full text-left px-4 py-3.5 rounded-xl border flex justify-between items-center text-sm font-semibold transition-all cursor-pointer ${activeTab === 'prayers' ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/10' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
          >
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4" />
              <span>{t.adminTabPrayers}</span>
            </div>
            {moderationPrayers.length > 0 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeTab === 'prayers' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950'}`}>
                {moderationPrayers.length}
              </span>
            )}
          </button>

          {/* PASTOR'S BLOG TAB */}
          <button 
            onClick={() => { setActiveTab('blog'); }}
            className={`w-full text-left px-4 py-3.5 rounded-xl border flex justify-between items-center text-sm font-semibold transition-all cursor-pointer ${activeTab === 'blog' ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/10' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'}`}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4" />
              <span>{t.adminTabBlog}</span>
            </div>
            {blogPostsList.length > 0 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeTab === 'blog' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950'}`}>
                {blogPostsList.length}
              </span>
            )}
          </button>

          <div className="mt-8 p-4 rounded-xl bg-slate-900/30 border border-slate-850 text-xs text-slate-500">
            <span className="font-bold block text-slate-400 uppercase tracking-wider mb-1">Accès permanent</span>
            <span>Pour toute modification directe du code du système.</span>
          </div>

        </aside>

        {/* Tab Panel Content Box */}
        <section className="lg:col-span-3 rounded-2xl bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-xl">
          
          {/* TAB 1: GLOBAL SITE SETTINGS */}
          {activeTab === 'settings' && (<>
            <form onSubmit={handleSettingsSubmit} className="space-y-6">
              <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-3 font-serif">
                {t.adminTabSettings}
              </h3>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Pastor&apos;s Name / Nom du pasteur</label>
                <input 
                  type="text" 
                  value={pastorName}
                  onChange={(e) => setPastorName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-sm text-slate-100 transition-all font-semibold"
                  placeholder="e.g. Pasteur Jean-Claude"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Pastor Message (Français)</label>
                  <textarea 
                    rows={4}
                    value={pMsgHt}
                    onChange={(e) => setPMsgHt(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-sm text-slate-100 transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Pastor Message (English)</label>
                  <textarea 
                    rows={4}
                    value={pMsgEn}
                    onChange={(e) => setPMsgEn(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-sm text-slate-100 transition-all resize-none"
                  />
                </div>
              </div>

              <AdminBilingualTranslateBar
                language={language}
                direction={bilingualTranslateDirection}
                onDirectionChange={setBilingualTranslateDirection}
                onTranslate={handleTranslatePastorMessage}
                isTranslating={isBilingualTranslating}
              />

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Church Phone</label>
                  <input 
                    type="text" 
                    value={chPhone}
                    onChange={(e) => setChPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-sm text-slate-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Church Email</label>
                  <input 
                    type="email" 
                    value={chEmail}
                    onChange={(e) => setChEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-sm text-slate-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Church Address</label>
                  <input 
                    type="text" 
                    value={chAddr}
                    onChange={(e) => {
                      const newVal = e.target.value;
                      setChAddress(newVal);
                      if (!checkMailingAddress || checkMailingAddress === '789 Community Blvd, Fort Lauderdale, FL 33311' || checkMailingAddress === chAddr) {
                        setCheckMailingAddress(newVal);
                      }
                    }}
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-sm text-slate-100 transition-all"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 flex items-center gap-3">
                <Lock className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Gemini API Configuration (Secure)</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Your Gemini API key is now securely managed via environment variables (<code>GEMINI_API_KEY</code>) to prevent data exposure or scraper theft. No client-side storage is used.
                  </p>
                </div>
              </div>

              {/* CHURCH BRANDING, LOGO, & COLORS SECTION */}
              <div className="grid lg:grid-cols-2 gap-6 p-6 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-xl">
                {/* Church Logo Customizer */}
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      <span>{t.adminLogoTitle}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      {t.adminLogoDesc}
                    </p>
                  </div>

                  <div 
                    onClick={() => document.getElementById('logo-file-input')?.click()}
                    onPaste={handlePasteLogo}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingLogo(true); }}
                    onDragLeave={() => setIsDraggingLogo(false)}
                    onDrop={handleDropLogo}
                    className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all min-h-[160px] group overflow-hidden ${
                      isDraggingLogo 
                        ? 'border-amber-500 bg-amber-500/10 scale-[1.02]' 
                        : 'border-slate-800 hover:border-amber-500/50 bg-slate-950/50'
                    }`}
                  >
                    <input 
                      type="file" 
                      id="logo-file-input" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleLogoFile(e.target.files?.[0])} 
                    />
                    
                    {logoUrl ? (
                      <div className="flex items-center gap-4 z-10 w-full">
                        <div className="w-20 h-20 rounded-lg bg-white border border-slate-800 overflow-hidden p-1 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-all">
                          <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-xs font-bold text-slate-200 block truncate">{t.adminLogoActive}</span>
                          <span className="text-[10px] text-slate-400 mt-1 block">{t.adminLogoChangeHint}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <UploadCloud className="w-8 h-8 group-hover:text-amber-400 transition-all animate-bounce" />
                        <span className="text-xs font-bold">{t.adminLogoUpload}</span>
                        <span className="text-[10px] text-slate-500">{t.adminLogoFormats}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 text-[10px] text-slate-500">
                    {t.adminLogoAutoColorNote}
                  </div>
                </div>

                {/* Color Adjuster & Preview */}
                <div className="flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      <span>{t.adminColorTitle}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      {t.adminColorDesc}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-850">
                      <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">{t.adminColorPrimary}</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={themePrimary} 
                          onChange={(e) => setThemePrimary(e.target.value)}
                          className="w-7 h-7 rounded border border-slate-800 bg-transparent cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={themePrimary} 
                          onChange={(e) => setThemePrimary(e.target.value)}
                          className="w-full px-1.5 py-1 rounded bg-slate-900 border border-slate-800 focus:outline-none text-[10px] font-mono text-slate-300"
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-850">
                      <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">{t.adminColorHover}</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={themeHover} 
                          onChange={(e) => setThemeHover(e.target.value)}
                          className="w-7 h-7 rounded border border-slate-800 bg-transparent cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={themeHover} 
                          onChange={(e) => setThemeHover(e.target.value)}
                          className="w-full px-1.5 py-1 rounded bg-slate-900 border border-slate-800 focus:outline-none text-[10px] font-mono text-slate-300"
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-850">
                      <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">{t.adminColorAccent}</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={themeAccent} 
                          onChange={(e) => setThemeAccent(e.target.value)}
                          className="w-7 h-7 rounded border border-slate-800 bg-transparent cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={themeAccent} 
                          onChange={(e) => setThemeAccent(e.target.value)}
                          className="w-full px-1.5 py-1 rounded bg-slate-900 border border-slate-800 focus:outline-none text-[10px] font-mono text-slate-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Theme Mode Selector */}
                  <div className="mb-4 p-3 rounded-lg bg-slate-950 border border-slate-850">
                    <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">{t.adminColorThemeMode}</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setThemeMode('dark')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                          themeMode === 'dark'
                            ? 'bg-slate-900 border-amber-500 text-white shadow-lg'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-850" />
                        <span>{t.adminColorDarkMode}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setThemeMode('light')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                          themeMode === 'light'
                            ? 'bg-white border-amber-500 text-slate-950 shadow-lg'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300" />
                        <span>{t.adminColorLightMode}</span>
                      </button>
                    </div>
                  </div>

                  {/* Hero Background Opacity Settings */}
                  <div className="mb-4 p-3 rounded-lg bg-slate-950 border border-slate-850 space-y-4">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.adminColorHeroOpacity}</label>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-slate-400 font-semibold">{t.adminColorOpacityLight}: {heroBgOpacityLight}%</span>
                          <span className="text-[10px] text-amber-500 font-bold">{Number(heroBgOpacityLight) < 20 ? t.adminColorOpacityCrisp : t.adminColorOpacityHigh}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={heroBgOpacityLight} 
                            onChange={(e) => setHeroBgOpacityLight(e.target.value)}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-slate-400 font-semibold">{t.adminColorOpacityDark}: {heroBgOpacityDark}%</span>
                          <span className="text-[10px] text-amber-500 font-bold">{Number(heroBgOpacityDark) < 30 ? t.adminColorOpacityCinematic : t.adminColorOpacityHigh}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={heroBgOpacityDark} 
                            onChange={(e) => setHeroBgOpacityDark(e.target.value)}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Glassmorphic Text Shield Toggle */}
                  <div className="mb-4 p-3 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-between">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t.adminColorSoftenBackdrop}</label>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {t.adminColorSoftenDesc}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                      <input 
                        type="checkbox" 
                        checked={softenHeroTextBg === 'true'} 
                        onChange={(e) => setSoftenHeroTextBg(e.target.checked ? 'true' : 'false')}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-focus:ring-2 peer-focus:ring-amber-500/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-white" />
                    </label>
                  </div>

                  {/* Interactive Live Preview Component */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-850 flex items-center justify-between gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.adminColorLiveDemo}</span>
                    <div className="flex items-center gap-3">
                      {/* Button styled dynamically */}
                      <button 
                        type="button"
                        style={{ backgroundColor: themePrimary }}
                        className="px-3 py-1.5 rounded-lg text-slate-950 text-xs font-bold shadow-md opacity-90 hover:opacity-100 transition-all pointer-events-none"
                      >
                        {t.adminColorDemoBtn}
                      </button>
                      {/* Accent color dot/badge */}
                      <span 
                        style={{ backgroundColor: themeAccent }}
                        className="px-2 py-0.5 rounded-full text-white text-[9px] font-bold uppercase animate-pulse pointer-events-none"
                      >
                        {t.sermonLiveNow}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* HERO BACKGROUND IMAGE AND LIVE BROADCAST SETTINGS */}
              <div className="grid md:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-950 border border-slate-850">
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Home Page Hero Background Image</label>
                    <p className="text-[10px] text-slate-500 mb-3">
                      Faites glisser, collez ou choisissez une nouvelle image d’arrière-plan ici. (Drag/drop, copy/paste, or browse hero bg image).
                    </p>
                  </div>

                  <div 
                    onClick={() => document.getElementById('hero-file-input')?.click()}
                    onPaste={handlePasteHero}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingHero(true); }}
                    onDragLeave={() => setIsDraggingHero(false)}
                    onDrop={handleDropHero}
                    className={`relative border border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all min-h-[110px] group overflow-hidden ${
                      isDraggingHero 
                        ? 'border-amber-500 bg-amber-500/10 scale-[1.02]' 
                        : 'border-slate-800 hover:border-amber-500/50 bg-slate-900/40'
                    }`}
                  >
                    <input 
                      type="file" 
                      id="hero-file-input" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleHeroFile(e.target.files?.[0])} 
                    />

                    {bgUrl ? (
                      <div className="flex items-center gap-3 z-10 w-full">
                        <div className="w-16 h-12 rounded bg-slate-950 border border-slate-800 overflow-hidden shrink-0 shadow-lg">
                          <img src={bgUrl} alt="Background preview" className="w-full h-full object-cover opacity-80" />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-xs font-bold text-slate-200 block truncate">Fondo_Home_Page.jpg</span>
                          <span className="text-[9px] text-slate-400 block mt-1">Cliquez pour modifier, faites glisser une autre image ou collez-en une ici</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-400">
                        <UploadCloud className="w-6 h-6 group-hover:text-amber-400 transition-all" />
                        <span className="text-[11px] font-semibold">Glisser ou coller l’image</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5">
                    <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Direct URL Input (Facultatif / Optional)</label>
                    <input 
                      type="text" 
                      value={bgUrl}
                      onChange={(e) => setBgUrl(e.target.value)}
                      className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-[10px] text-slate-100 transition-all font-mono"
                      placeholder="Vous pouvez également coller l’URL d’une image ici..."
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-between h-full">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Live Stream Broadcast Settings</label>
                    <p className="text-[10px] text-slate-500 mb-3">
                      Configurez et activez la diffusion en direct des cultes sur le site.
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-850 flex flex-col gap-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Status</label>
                        <select 
                          value={liveActive}
                          onChange={(e) => setLiveActive(e.target.value)}
                          className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs text-slate-100 transition-all font-semibold"
                        >
                          <option value="true">Active (En direct / Live)</option>
                          <option value="false">Inactive (Offline)</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">YouTube Video ID</label>
                        <input 
                          type="text" 
                          value={liveUrl}
                          onChange={(e) => setLiveUrl(e.target.value)}
                          className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs text-slate-100 transition-all font-mono font-bold"
                          placeholder="e.g. dQw4w9WgXcQ"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Streamed Event / Événement à diffuser</label>
                      <select 
                        value={liveStreamEventId}
                        onChange={(e) => setLiveStreamEventId(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs text-slate-100 transition-all font-semibold"
                      >
                        <option value="default">Default: Sunday Services (Cultes du dimanche – Automatique)</option>
                        {events.map((evt) => (
                          <option key={evt.id} value={String(evt.id)}>
                            {evt.date} - {language === 'fr_ht' ? evt.title_kreyol : evt.title_english}
                          </option>
                        ))}
                      </select>
                    </div>

                    {liveStreamEventId !== 'default' && (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Event Thumbnail Preset / Modèle de miniature</label>
                          <select 
                            value={
                              customLiveEventThumbnailUrl === 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop' ? 'wedding' :
                              customLiveEventThumbnailUrl === 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=600&auto=format&fit=crop' ? 'funeral' :
                              customLiveEventThumbnailUrl === 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=600&auto=format&fit=crop' ? 'seminar' :
                              customLiveEventThumbnailUrl === 'https://images.unsplash.com/photo-1444212477490-ca407925329e?q=80&w=600&auto=format&fit=crop' ? 'worship' :
                              customLiveEventThumbnailUrl ? 'custom' : 'none'
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'wedding') {
                                setCustomLiveEventThumbnailUrl('https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop');
                              } else if (val === 'funeral') {
                                setCustomLiveEventThumbnailUrl('https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=600&auto=format&fit=crop');
                              } else if (val === 'seminar') {
                                setCustomLiveEventThumbnailUrl('https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=600&auto=format&fit=crop');
                              } else if (val === 'worship') {
                                setCustomLiveEventThumbnailUrl('https://images.unsplash.com/photo-1444212477490-ca407925329e?q=80&w=600&auto=format&fit=crop');
                              } else if (val === 'none') {
                                setCustomLiveEventThumbnailUrl('');
                              } else {
                                setCustomLiveEventThumbnailUrl(settings.custom_live_event_thumbnail_url || 'custom_upload_placeholder');
                              }
                            }}
                            className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs text-slate-100 transition-all font-semibold"
                          >
                            <option value="none">No Thumbnail / Aucune miniature</option>
                            <option value="wedding">💍 Wedding / Maryaj (Preset)</option>
                            <option value="funeral">🕊️ Funeral & Memorial / Fineral (Preset)</option>
                            <option value="seminar">📚 Seminar & Conference / Séminaire (Preset)</option>
                            <option value="worship">🎸 Special Worship & Concert / Adorasyon (Preset)</option>
                            <option value="custom">🖼️ Custom Upload / Téléverser votre image</option>
                          </select>
                        </div>

                        {(!['https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop',
                           'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=600&auto=format&fit=crop',
                           'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=600&auto=format&fit=crop',
                           'https://images.unsplash.com/photo-1444212477490-ca407925329e?q=80&w=600&auto=format&fit=crop'].includes(customLiveEventThumbnailUrl) && customLiveEventThumbnailUrl !== '') && (
                          <div className="mt-2 w-full">
                            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Custom Event Thumbnail / Choisir votre miniature</label>
                            <div 
                              onClick={() => document.getElementById('custom-thumbnail-file-input')?.click()}
                              onPaste={handlePasteCustomThumbnail}
                              onDragOver={(e) => { e.preventDefault(); setIsDraggingCustomThumbnail(true); }}
                              onDragLeave={() => setIsDraggingCustomThumbnail(false)}
                              onDrop={handleDropCustomThumbnail}
                              className={`relative border border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all min-h-[110px] group overflow-hidden ${
                                isDraggingCustomThumbnail 
                                  ? 'border-amber-500 bg-amber-500/10 scale-[1.02]' 
                                  : 'border-slate-800 hover:border-amber-500/50 bg-slate-900/40'
                              }`}
                            >
                              <input 
                                type="file" 
                                id="custom-thumbnail-file-input" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleCustomThumbnailFile(e.target.files?.[0])} 
                              />

                              {customLiveEventThumbnailUrl && customLiveEventThumbnailUrl !== 'custom_upload_placeholder' ? (
                                <div className="flex items-center gap-3 z-10 w-full">
                                  <div className="w-16 h-12 rounded bg-slate-950 border border-slate-800 overflow-hidden shrink-0 shadow-lg">
                                    <img src={customLiveEventThumbnailUrl} alt="Custom thumbnail preview" className="w-full h-full object-cover opacity-80" />
                                  </div>
                                  <div className="flex-1 text-left">
                                    <span className="text-xs font-bold text-slate-200 block truncate">Custom_Thumbnail.jpg</span>
                                    <span className="text-[9px] text-slate-400 block mt-1">Cliquez pour modifier, faites glisser une autre image ou collez-en une ici</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-1 text-slate-400">
                                  <UploadCloud className="w-6 h-6 group-hover:text-amber-400 transition-all" />
                                  <span className="text-[11px] font-semibold">Glisser ou coller l’image</span>
                                </div>
                              )}
                            </div>

                            <div className="mt-2.5">
                              <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Direct Thumbnail URL / URL directe de l’image</label>
                              <input 
                                type="text" 
                                value={customLiveEventThumbnailUrl === 'custom_upload_placeholder' ? '' : customLiveEventThumbnailUrl}
                                onChange={(e) => setCustomLiveEventThumbnailUrl(e.target.value)}
                                className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-[10px] text-slate-100 transition-all font-mono"
                                placeholder="Collez l’URL d’une image ici..."
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  <span className="text-[10px] text-slate-500 mt-2 block">Lorsqu’elle est activée, une bannière « En direct / Live Now » et le lecteur vidéo apparaissent sur la page d’accueil.</span>
                </div>
              </div>



              {/* Stripe & Cash Transfer Payment Panel Control */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-850 shadow-inner">
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Tithes & Offerings / Dîmes et offrandes</label>
                <div className="flex items-start gap-3 mt-3">
                  <input 
                    type="checkbox" 
                    id="hide-stripe-checkbox"
                    checked={hideStripe === 'true'}
                    onChange={(e) => setHideStripe(e.target.checked ? 'true' : 'false')}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-800 focus:ring-amber-500 focus:ring-2 mt-0.5 cursor-pointer"
                  />
                  <div className="flex-1">
                    <label htmlFor="hide-stripe-checkbox" className="text-sm text-slate-200 font-semibold cursor-pointer block">
                      {language === 'fr_ht' 
                        ? "Masquer le panneau Stripe (carte de crédit) sur la page Dîmes et offrandes"
                        : "Hide Stripe panel (Credit Card form) on the Tithes & Offerings page"}
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                      {language === 'fr_ht'
                        ? "Si l’église n’a pas de compte Stripe, activez cette option pour masquer le formulaire de carte de crédit et afficher les modes de transfert mobile (Zelle, Cash App, etc.)."
                        : "If the church does not have a Stripe merchant account, turn this on to hide the credit card inputs and prominently display direct mobile transfer options."}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-900/60">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-bold uppercase text-slate-400">CashApp ID / KasApp</label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-500 hover:text-slate-300 font-semibold select-none">
                        <input 
                          type="checkbox"
                          checked={showCashapp === 'true'}
                          onChange={(e) => setShowCashapp(e.target.checked ? 'true' : 'false')}
                          className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer"
                        />
                        {language === 'fr_ht' ? 'Afficher' : 'Show'}
                      </label>
                    </div>
                    <input 
                      type="text"
                      value={cashappId}
                      onChange={(e) => setCashappId(e.target.value)}
                      placeholder="e.g. $EgliseParousie"
                      disabled={showCashapp !== 'true'}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs text-slate-100 transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-bold uppercase text-slate-400">Venmo ID</label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-500 hover:text-slate-300 font-semibold select-none">
                        <input 
                          type="checkbox"
                          checked={showVenmo === 'true'}
                          onChange={(e) => setShowVenmo(e.target.checked ? 'true' : 'false')}
                          className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer"
                        />
                        {language === 'fr_ht' ? 'Afficher' : 'Show'}
                      </label>
                    </div>
                    <input 
                      type="text"
                      value={venmoId}
                      onChange={(e) => setVenmoId(e.target.value)}
                      placeholder="e.g. @EgliseParousie"
                      disabled={showVenmo !== 'true'}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs text-slate-100 transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-bold uppercase text-slate-400">Apple Pay Phone / Email</label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-500 hover:text-slate-300 font-semibold select-none">
                        <input 
                          type="checkbox"
                          checked={showApplePay === 'true'}
                          onChange={(e) => setShowApplePay(e.target.checked ? 'true' : 'false')}
                          className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer"
                        />
                        {language === 'fr_ht' ? 'Afficher' : 'Show'}
                      </label>
                    </div>
                    <input 
                      type="text"
                      value={applePayPhone}
                      onChange={(e) => setApplePayPhone(e.target.value)}
                      placeholder="e.g. 929 599 8809"
                      disabled={showApplePay !== 'true'}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs text-slate-100 transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-900/40">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-bold uppercase text-slate-400">Zelle Recipient Name / Nom du bénéficiaire Zelle</label>
                    </div>
                    <input 
                      type="text"
                      value={zelleName}
                      onChange={(e) => setZelleName(e.target.value)}
                      placeholder="e.g. Eglise Baptiste de la Parousie"
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs text-slate-100 transition-all"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-bold uppercase text-slate-400">Zelle Phone Number or Email / Numéro ou adresse courriel Zelle</label>
                    </div>
                    <input 
                      type="text"
                      value={zellePhone}
                      onChange={(e) => setZellePhone(e.target.value)}
                      placeholder="e.g. 929 599 8809"
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs text-slate-100 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-900/40">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-bold uppercase text-slate-400">Pay to the order of (Check / Money Order) / Libeller le chèque ou le mandat à l’ordre de</label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-500 hover:text-slate-300 font-semibold select-none">
                        <input 
                          type="checkbox"
                          checked={showCheck === 'true'}
                          onChange={(e) => setShowCheck(e.target.checked ? 'true' : 'false')}
                          className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer"
                        />
                        {language === 'fr_ht' ? 'Afficher' : 'Show'}
                      </label>
                    </div>
                    <input 
                      type="text"
                      value={checkPayableTo}
                      onChange={(e) => setCheckPayableTo(e.target.value)}
                      placeholder="e.g. Eglise Baptiste de la Parousie"
                      disabled={showCheck !== 'true'}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs text-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-bold uppercase text-slate-400">Mailing Address / Adresse postale pour les chèques et mandats</label>
                    </div>
                    <input 
                      type="text"
                      value={checkMailingAddress}
                      onChange={(e) => setCheckMailingAddress(e.target.value)}
                      placeholder="e.g. 789 Community Blvd, Fort Lauderdale, FL 33311"
                      disabled={showCheck !== 'true'}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs text-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Free Giveaway Spiritual Resource Customizer */}
              <div className="p-6 rounded-xl bg-slate-950 border border-slate-850 space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    <span>Ressource de dévotion et cadeau spirituel (Configurable Giveaway)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Les visiteurs qui s’abonnent pour grandir dans la foi recevront ce cadeau spirituel (livre numérique, plan de méditation, versets, etc.).
                  </p>
                </div>

                <AdminBilingualTranslateBar
                  language={language}
                  direction={bilingualTranslateDirection}
                  onDirectionChange={setBilingualTranslateDirection}
                  onTranslate={handleTranslateFreeGift}
                  isTranslating={isBilingualTranslating}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Titre du cadeau ou de la ressource (Français)</label>
                    <input 
                      type="text" 
                      value={giftTitleHt} 
                      onChange={(e) => setGiftTitleHt(e.target.value)}
                      placeholder="e.g. Livre de dévotion Parousie 2026"
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs text-slate-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Giveaway Title (English)</label>
                    <input 
                      type="text" 
                      value={giftTitleEn} 
                      onChange={(e) => setGiftTitleEn(e.target.value)}
                      placeholder="e.g. Parousie Devotional 2026"
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs text-slate-100 transition-all"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Description du cadeau ou de la ressource (Français)</label>
                    <textarea 
                      rows={3}
                      value={giftDescHt} 
                      onChange={(e) => setGiftDescHt(e.target.value)}
                      placeholder="Ajoutez une brève description des bienfaits que ce livre apportera..."
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs text-slate-100 transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Giveaway Description (English)</label>
                    <textarea 
                      rows={3}
                      value={giftDescEn} 
                      onChange={(e) => setGiftDescEn(e.target.value)}
                      placeholder="Write a brief encouraging description of the booklet..."
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs text-slate-100 transition-all resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Fichier cadeau (Giveaway E-Book/PDF/File Resource)</label>
                  
                  <div 
                    onClick={() => document.getElementById('gift-file-input')?.click()}
                    onPaste={handlePasteGift}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingGift(true); }}
                    onDragLeave={() => setIsDraggingGift(false)}
                    onDrop={handleDropGift}
                    className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all min-h-[140px] group overflow-hidden ${
                      isDraggingGift 
                        ? 'border-amber-500 bg-amber-500/10 scale-[1.02]' 
                        : 'border-slate-800 hover:border-amber-500/50 bg-slate-950/50'
                    }`}
                  >
                    <input 
                      type="file" 
                      id="gift-file-input" 
                      accept=".pdf,.txt,.docx,.doc" 
                      className="hidden" 
                      onChange={(e) => handleGiftFile(e.target.files?.[0])} 
                    />
                    
                    {giftFileUrl ? (
                      <div className="flex items-center gap-4 z-10 w-full">
                        <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
                          <FileText className="w-6 h-6 text-amber-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-xs font-bold text-slate-200 block truncate">
                            {giftFileUrl.startsWith('data:') ? 'Nouveau_Fichier_Téléversé.pdf' : giftFileUrl.split('/').pop()}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            Faites glisser un autre fichier ou collez-en un ici pour le remplacer
                          </span>
                          {giftFileUrl.startsWith('/') && (
                            <a 
                              href={giftFileUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              onClick={(e) => e.stopPropagation()} 
                              className="text-[10px] text-amber-500 hover:underline mt-1 inline-block"
                            >
                              Afficher le fichier actuel
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <UploadCloud className="w-8 h-8 group-hover:text-amber-400 transition-all animate-bounce" />
                        <span className="text-xs font-bold">Choisir, glisser ou coller le livre ou PDF cadeau</span>
                        <span className="text-[10px] text-slate-500">Formats acceptés : PDF, TXT ou DOCX</span>
                      </div>
                    )}

                    {giftIsUploading && (
                      <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center gap-3">
                        <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
                        <span className="text-xs text-slate-300 font-semibold">Chargement du fichier dans le cache...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Reference Notes (Private/Hidden) */}
                <div className="pt-4 border-t border-slate-900">
                  <label className="block text-[10px] font-bold uppercase text-amber-500 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3 h-3" />
                    <span>Notes de référence de l’administrateur (Private Admin Reference Notes) — Non visible sur la page principale</span>
                  </label>
                  <p className="text-[10px] text-slate-500 mb-2">
                    Conservez le contexte, les liens vers la source de ce contenu ou des notes sur sa création pour consultation ultérieure.
                  </p>
                  <textarea 
                    rows={4}
                    value={giftAdminNotes} 
                    onChange={(e) => setGiftAdminNotes(e.target.value)}
                    placeholder="Ajoutez ici des liens, des notes de référence ou des renseignements sur la création de ce cadeau spirituel..."
                    className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs text-slate-100 transition-all font-mono"
                  />
                </div>
              </div>

              {isSuperAdmin && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Update Security Code / Admin Password</label>
                  <div className="relative max-w-sm">
                    <input 
                      type={showAdminPass ? "text" : "password"} 
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs text-slate-200 transition-all font-mono font-bold"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                      aria-label={showAdminPass ? "Hide password" : "Show password"}
                    >
                      {showAdminPass ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4">
                <button 
                  type="button"
                  onClick={handleBackupClick}
                  disabled={isBackingUp}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-bold transition-all text-xs cursor-pointer disabled:opacity-50"
                >
                  <Database className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isBackingUp ? (language === 'fr_ht' ? 'Sauvegarde en cours...' : 'Backing up...') : (language === 'fr_ht' ? 'Créer une sauvegarde du site' : 'Create Site Backup')}</span>
                </button>

                <button 
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-all shadow-lg cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{t.btnSave}</span>
                </button>
              </div>
            </form>

              <div className="border-t border-slate-800 my-10 pt-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-serif">
                      {language === 'fr_ht' ? 'Base de connaissances et contexte global' : 'Knowledge Base & Global Context'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {language === 'fr_ht' 
                        ? 'Gérez les documents et les références qui alimentent la base de connaissances de l’église.'
                        : 'Manage documents and references that define the church knowledge base.'}
                    </p>
                  </div>
                </div>

                <div className="grid lg:grid-cols-5 gap-8">
                  {/* Left Column: Upload / Manual Entry */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Automation Toggle Switch */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-850 shadow-sm w-full">
                      <div className="flex flex-col gap-0.5 max-w-[75%]">
                        <span className="text-xs font-bold text-slate-200">
                          {language === 'fr_ht' 
                            ? 'Mettre automatiquement le site à jour'
                            : 'Automate Website Updates'}
                        </span>
                        <span className="text-[10px] text-slate-500 leading-normal">
                          {language === 'fr_ht' 
                            ? 'Utilisez l’extracteur IA pour actualiser automatiquement les horaires et le contenu lors du téléversement d’un nouveau PDF'
                            : 'Use AI Extractor to automatically refresh schedules and content upon uploading a new PDF'}
                        </span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setAutomateWithDoc(!automateWithDoc)}
                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          automateWithDoc ? 'bg-amber-500' : 'bg-slate-800'
                        }`}
                        role="switch"
                        aria-checked={automateWithDoc}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                            automateWithDoc ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* D&D Landing zone */}
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingKb(true); }}
                      onDragLeave={() => setIsDraggingKb(false)}
                      onDrop={handleKbDrop}
                      onPaste={handleKbPaste}
                      className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-center cursor-pointer transition-all min-h-[180px] group ${
                        isDraggingKb 
                          ? 'border-amber-500 bg-amber-500/10 scale-[1.01]' 
                          : 'border-slate-800 hover:border-amber-500/40 bg-slate-950/40'
                      }`}
                    >
                      <input 
                        type="file" 
                        id="kb-pdf-file-input" 
                        accept=".pdf" 
                        className="hidden" 
                        onChange={(e) => handleKbFile(e.target.files?.[0])} 
                      />
                      
                      <div className="flex flex-col items-center gap-2">
                        {kbIsUploading ? (
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                            <span className="text-xs font-bold text-amber-500">
                              {language === 'fr_ht' ? 'Traitement du document...' : 'Processing document...'}
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="p-3 rounded-full bg-slate-900 group-hover:bg-amber-500/10 text-slate-400 group-hover:text-amber-500 transition-all">
                              <UploadCloud className="w-8 h-8 animate-pulse" />
                            </div>
                            <span className="text-xs font-bold text-slate-200">
                              {language === 'fr_ht' ? 'Glissez un PDF ou collez un lien' : 'Drag & Drop PDF or Paste Links'}
                            </span>
                            <span className="text-[10px] text-slate-500 max-w-[200px] leading-relaxed">
                              {language === 'fr_ht' 
                                ? 'PDF, liens Google Docs/Sheets ou texte à coller ici'
                                : 'Supports local PDFs, Google Docs/Sheets URL pasting'}
                            </span>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => document.getElementById('kb-pdf-file-input')?.click()}
                        className="mt-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-300 transition-all cursor-pointer"
                      >
                        {language === 'fr_ht' ? 'Choisir un PDF sur l’ordinateur' : 'Browse Local PDF'}
                      </button>
                    </div>

                    {/* Manual Form */}
                    <form onSubmit={handleManualKbSubmit} className="p-5 rounded-2xl bg-slate-950 border border-slate-850 space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-amber-500" />
                        <span>{language === 'fr_ht' ? 'Ajouter manuellement' : 'Manual Resource Registration'}</span>
                      </h4>

                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Resource Title / Titre de la ressource</label>
                        <input 
                          type="text"
                          required
                          value={kbManualTitle}
                          onChange={(e) => setKbManualTitle(e.target.value)}
                          placeholder="e.g. Histoire de l’église"
                          className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Resource Type / Type</label>
                          <select 
                            value={kbManualType}
                            onChange={(e) => setKbManualType(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-[11px] text-white font-semibold"
                          >
                            <option value="pdf">PDF File</option>
                            <option value="google_doc">Google Doc</option>
                            <option value="google_sheet">Google Sheet</option>
                            <option value="link">Web Link</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button
                            type="submit"
                            disabled={kbIsUploading}
                            className="w-full py-1.5 rounded bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{language === 'fr_ht' ? 'Enregistrer' : 'Register'}</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Resource URL / Lien</label>
                        <input 
                          type="text"
                          required
                          value={kbManualUrl}
                          onChange={(e) => setKbManualUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs text-white font-mono"
                        />
                      </div>
                    </form>
                  </div>

                  {/* Right Column: Resource Grid / List */}
                  <div className="lg:col-span-3">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 h-full flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
                          <span>{language === 'fr_ht' ? 'Ressources enregistrées' : 'Registered Knowledge Assets'}</span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[9px] font-mono text-slate-400">
                            {kbList.length} total
                          </span>
                        </h4>

                        {kbList.length === 0 ? (
                          <div className="h-[260px] border border-dashed border-slate-850 rounded-xl flex flex-col items-center justify-center text-center p-6 text-slate-500 gap-2">
                            <BookOpen className="w-8 h-8 text-slate-700 animate-pulse" />
                            <span className="text-xs font-bold">{language === 'fr_ht' ? 'Aucune ressource dans la base de connaissances' : 'No knowledge assets found'}</span>
                            <span className="text-[10px] max-w-[200px] leading-relaxed">
                              {language === 'fr_ht' 
                                ? 'Téléversez des PDF ou enregistrez des liens pour enrichir le contexte de l’église.'
                                : 'Upload PDFs or link reference materials to feed church context.'}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                            {kbList.map((item) => {
                              // Choose Icon and color based on type
                              let Icon = Link2;
                              let iconColor = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
                              let badgeText = 'Web Link';
                              if (item.type === 'pdf') {
                                Icon = FileText;
                                iconColor = 'text-red-400 bg-red-500/10 border-red-500/20';
                                badgeText = 'PDF Document';
                              } else if (item.type === 'google_doc') {
                                Icon = FileText;
                                iconColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
                                badgeText = 'Google Doc';
                              } else if (item.type === 'google_sheet') {
                                Icon = FileSpreadsheet;
                                iconColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                                badgeText = 'Google Sheet';
                              }

                              return (
                                <div 
                                  key={item.id} 
                                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-850 flex items-center justify-between gap-4 hover:border-slate-700 transition-all group"
                                >
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className={`p-2 rounded-lg border shrink-0 ${iconColor}`}>
                                      <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-100 truncate block">
                                          {item.title}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-950 border border-slate-800 text-slate-400 uppercase tracking-widest shrink-0">
                                          {badgeText}
                                        </span>
                                      </div>
                                      <a 
                                        href={item.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-[9px] text-slate-500 hover:text-amber-500 font-mono truncate block mt-0.5 transition-all"
                                      >
                                        {item.url}
                                      </a>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {item.type === 'pdf' && (
                                      <button
                                        type="button"
                                        onClick={() => handleResetContentFromPdf(item.url, item.title)}
                                        className="p-2 rounded-lg hover:bg-amber-500/10 text-slate-500 hover:text-amber-500 border border-transparent hover:border-amber-500/20 transition-all cursor-pointer"
                                        title={language === 'fr_ht' ? 'Actualiser le contenu à partir de ce PDF' : 'Reset content using this PDF'}
                                      >
                                        <Wand2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteKb(item.id)}
                                      className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                                      title={language === 'fr_ht' ? 'Supprimer' : 'Delete'}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 p-3 rounded-xl bg-slate-900/20 border border-slate-850/60 text-[10px] text-slate-500 leading-relaxed">
                        <span className="font-bold text-slate-400 uppercase block mb-0.5 tracking-wider">
                          {language === 'fr_ht' ? 'À propos de la base de connaissances' : 'About the Knowledge Base'}
                        </span>
                        {language === 'fr_ht' 
                          ? 'Ces ressources servent à vérifier et à enrichir les données automatisées du site (pasteurs, intervenants, activités, etc.).'
                          : 'These resources enrich the context used for auto-populating summaries, stream ingestion, and pastor details.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </>)}

          {/* TAB 1.5: HOME SUB-TABS MANAGER */}
          {activeTab === 'hometabs' && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white font-serif">
                    {language === 'fr_ht' ? 'Configurer les onglets de la page d’accueil' : 'Configure Home Page Tabs'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {language === 'fr_ht' 
                      ? 'Configurez le contenu dynamique et les images des onglets « Qui sommes-nous », « Nos croyances », « Notre équipe » et « À quoi vous attendre ».'
                      : 'Configure dynamic content and premium image uploads for "About Us", "Beliefs", "Our Team", and "What to Expect".'}
                  </p>
                </div>
              </div>

              {/* Sub-Tabs Pill Navigation */}
              <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-850/60 max-w-2xl">
                <button
                  type="button"
                  onClick={() => setHomeSubTab('about')}
                  className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                    homeSubTab === 'about'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {language === 'fr_ht' ? 'Qui sommes-nous' : 'About Us'}
                </button>
                <button
                  type="button"
                  onClick={() => setHomeSubTab('beliefs')}
                  className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                    homeSubTab === 'beliefs'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {language === 'fr_ht' ? 'Nos croyances' : 'Our Beliefs'}
                </button>
                <button
                  type="button"
                  onClick={() => setHomeSubTab('team')}
                  className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                    homeSubTab === 'team'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {language === 'fr_ht' ? 'Notre équipe' : 'Our Team'}
                </button>
                <button
                  type="button"
                  onClick={() => setHomeSubTab('expect')}
                  className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                    homeSubTab === 'expect'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {language === 'fr_ht' ? 'À quoi vous attendre' : 'What to Expect'}
                </button>
              </div>

              <form onSubmit={handleHomeTabsSubmit} className="space-y-6">
                
                {/* SUB-TAB: ABOUT US */}
                {homeSubTab === 'about' && (
                  <div className="p-6 rounded-xl bg-slate-950 border border-slate-850/60 space-y-6">
                    <div className="border-b border-slate-900 pb-3">
                      <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <Church className="w-4 h-4" />
                        <span>{language === 'fr_ht' ? 'Page « Qui sommes-nous »' : 'About Us Page Content'}</span>
                      </h4>
                    </div>

                    <AdminBilingualTranslateBar
                      language={language}
                      direction={bilingualTranslateDirection}
                      onDirectionChange={setBilingualTranslateDirection}
                      onTranslate={handleTranslateHomeTab}
                      isTranslating={isBilingualTranslating}
                    />

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Title (Français)</label>
                        <input
                          type="text"
                          required
                          value={aboutUsTitleHt}
                          onChange={(e) => setAboutUsTitleHt(e.target.value)}
                          className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Title (English)</label>
                        <input
                          type="text"
                          required
                          value={aboutUsTitleEn}
                          onChange={(e) => setAboutUsTitleEn(e.target.value)}
                          className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Paragraph 1 (Français)</label>
                          <textarea
                            required
                            value={aboutUsP1Ht}
                            onChange={(e) => setAboutUsP1Ht(e.target.value)}
                            className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white h-24 resize-none leading-relaxed"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Paragraph 1 (English)</label>
                          <textarea
                            required
                            value={aboutUsP1En}
                            onChange={(e) => setAboutUsP1En(e.target.value)}
                            className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white h-24 resize-none leading-relaxed"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Paragraph 2 (Français)</label>
                          <textarea
                            required
                            value={aboutUsP2Ht}
                            onChange={(e) => setAboutUsP2Ht(e.target.value)}
                            className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white h-24 resize-none leading-relaxed"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Paragraph 2 (English)</label>
                          <textarea
                            required
                            value={aboutUsP2En}
                            onChange={(e) => setAboutUsP2En(e.target.value)}
                            className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white h-24 resize-none leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Drag-Drop-Paste Image Zone */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase text-slate-400">Background Image / Imaj background</label>
                      <div
                        onClick={() => document.getElementById('about-us-file-input')?.click()}
                        onPaste={handlePasteAboutUs}
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingAboutUs(true); }}
                        onDragLeave={() => setIsDraggingAboutUs(false)}
                        onDrop={handleDropAboutUs}
                        className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all min-h-[160px] group overflow-hidden ${
                          isDraggingAboutUs 
                            ? 'border-amber-500 bg-amber-500/10 scale-[1.01]' 
                            : 'border-slate-800 hover:border-amber-500/50 bg-slate-950/50'
                        }`}
                      >
                        <input
                          type="file"
                          id="about-us-file-input"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleAboutUsFile(e.target.files?.[0])}
                        />

                        {aboutUsImageUrl ? (
                          <div className="flex flex-col md:flex-row items-center gap-4 z-10 w-full">
                            <div className="w-32 h-20 rounded-lg border border-slate-800 overflow-hidden shrink-0 shadow-lg group-hover:scale-105 transition-all">
                              <img src={aboutUsImageUrl} alt="About Us background preview" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 text-left">
                              <span className="text-xs font-bold text-slate-200 block truncate">about_us_bg.jpg</span>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {language === 'fr_ht' 
                                  ? 'Cliquez pour modifier, faites glisser une autre image ou collez-en une ici.'
                                  : 'Click to choose, drag and drop another image, or paste an image here.'}
                              </span>
                              <input 
                                type="text"
                                value={aboutUsImageUrl.startsWith('data:') ? 'Base64 image asset...' : aboutUsImageUrl}
                                readOnly
                                className="w-full mt-2 px-2 py-1 rounded bg-slate-900 border border-slate-850 text-[10px] text-slate-400 pointer-events-none"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <UploadCloud className="w-8 h-8 group-hover:text-amber-400 transition-all animate-bounce" />
                            <span className="text-xs font-bold">{language === 'fr_ht' ? 'Choisir, glisser ou coller une image' : 'Select, Drag & Drop, or Paste an Image'}</span>
                            <span className="text-[10px] text-slate-500">Image PNG ou JPG</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-TAB: OUR BELIEFS */}
                {homeSubTab === 'beliefs' && (
                  <div className="p-6 rounded-xl bg-slate-950 border border-slate-850/60 space-y-6">
                    <div className="border-b border-slate-900 pb-3">
                      <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        <span>{language === 'fr_ht' ? 'Page « Nos croyances »' : 'Our Beliefs Page Content'}</span>
                      </h4>
                    </div>

                    <AdminBilingualTranslateBar
                      language={language}
                      direction={bilingualTranslateDirection}
                      onDirectionChange={setBilingualTranslateDirection}
                      onTranslate={handleTranslateHomeTab}
                      isTranslating={isBilingualTranslating}
                    />

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Section Title (Français)</label>
                        <input
                          type="text"
                          required
                          value={beliefsTitleHt}
                          onChange={(e) => setBeliefsTitleHt(e.target.value)}
                          className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Section Title (English)</label>
                        <input
                          type="text"
                          required
                          value={beliefsTitleEn}
                          onChange={(e) => setBeliefsTitleEn(e.target.value)}
                          className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                        />
                      </div>
                    </div>

                    {/* Belief 1 */}
                    <div className="p-4 rounded-lg bg-slate-900/30 border border-slate-850 space-y-4">
                      <h5 className="text-xs font-bold text-amber-400/80 uppercase">Kwayans 1 / Belief 1</h5>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Title (Français)</label>
                          <input
                            type="text"
                            required
                            value={belief1TitleHt}
                            onChange={(e) => setBelief1TitleHt(e.target.value)}
                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Title (English)</label>
                          <input
                            type="text"
                            required
                            value={belief1TitleEn}
                            onChange={(e) => setBelief1TitleEn(e.target.value)}
                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white font-semibold"
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description (Français)</label>
                          <textarea
                            required
                            value={belief1DescHt}
                            onChange={(e) => setBelief1DescHt(e.target.value)}
                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white h-16 resize-none leading-relaxed"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description (English)</label>
                          <textarea
                            required
                            value={belief1DescEn}
                            onChange={(e) => setBelief1DescEn(e.target.value)}
                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white h-16 resize-none leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Belief 2 */}
                    <div className="p-4 rounded-lg bg-slate-900/30 border border-slate-850 space-y-4">
                      <h5 className="text-xs font-bold text-amber-400/80 uppercase">Kwayans 2 / Belief 2</h5>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Title (Français)</label>
                          <input
                            type="text"
                            required
                            value={belief2TitleHt}
                            onChange={(e) => setBelief2TitleHt(e.target.value)}
                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Title (English)</label>
                          <input
                            type="text"
                            required
                            value={belief2TitleEn}
                            onChange={(e) => setBelief2TitleEn(e.target.value)}
                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white font-semibold"
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description (Français)</label>
                          <textarea
                            required
                            value={belief2DescHt}
                            onChange={(e) => setBelief2DescHt(e.target.value)}
                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white h-16 resize-none leading-relaxed"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description (English)</label>
                          <textarea
                            required
                            value={belief2DescEn}
                            onChange={(e) => setBelief2DescEn(e.target.value)}
                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white h-16 resize-none leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Belief 3 */}
                    <div className="p-4 rounded-lg bg-slate-900/30 border border-slate-850 space-y-4">
                      <h5 className="text-xs font-bold text-amber-400/80 uppercase">Kwayans 3 / Belief 3</h5>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Title (Français)</label>
                          <input
                            type="text"
                            required
                            value={belief3TitleHt}
                            onChange={(e) => setBelief3TitleHt(e.target.value)}
                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Title (English)</label>
                          <input
                            type="text"
                            required
                            value={belief3TitleEn}
                            onChange={(e) => setBelief3TitleEn(e.target.value)}
                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white font-semibold"
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description (Français)</label>
                          <textarea
                            required
                            value={belief3DescHt}
                            onChange={(e) => setBelief3DescHt(e.target.value)}
                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white h-16 resize-none leading-relaxed"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description (English)</label>
                          <textarea
                            required
                            value={belief3DescEn}
                            onChange={(e) => setBelief3DescEn(e.target.value)}
                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white h-16 resize-none leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Belief 4 */}
                    <div className="p-4 rounded-lg bg-slate-900/30 border border-slate-850 space-y-4">
                      <h5 className="text-xs font-bold text-amber-400/80 uppercase">Kwayans 4 / Belief 4</h5>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Title (Français)</label>
                          <input
                            type="text"
                            required
                            value={belief4TitleHt}
                            onChange={(e) => setBelief4TitleHt(e.target.value)}
                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Title (English)</label>
                          <input
                            type="text"
                            required
                            value={belief4TitleEn}
                            onChange={(e) => setBelief4TitleEn(e.target.value)}
                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white font-semibold"
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description (Français)</label>
                          <textarea
                            required
                            value={belief4DescHt}
                            onChange={(e) => setBelief4DescHt(e.target.value)}
                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white h-16 resize-none leading-relaxed"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description (English)</label>
                          <textarea
                            required
                            value={belief4DescEn}
                            onChange={(e) => setBelief4DescEn(e.target.value)}
                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white h-16 resize-none leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-TAB: OUR TEAM */}
                {homeSubTab === 'team' && (
                  <div className="p-6 rounded-xl bg-slate-950 border border-slate-850/60 space-y-6">
                    <div className="border-b border-slate-900 pb-3">
                      <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{language === 'fr_ht' ? 'Page « Notre équipe »' : 'Our Team Page Content'}</span>
                      </h4>
                    </div>

                    <AdminBilingualTranslateBar
                      language={language}
                      direction={bilingualTranslateDirection}
                      onDirectionChange={setBilingualTranslateDirection}
                      onTranslate={handleTranslateHomeTab}
                      isTranslating={isBilingualTranslating && translatingTeamMemberKey === null}
                      hint={language === 'fr_ht'
                        ? 'Traduit le titre de la page, le sous-titre et les en-têtes de département. Utilisez la barre dans chaque fiche membre pour traduire cette personne.'
                        : 'Translates the page title, subtitle, and department headers. Use the bar inside each member card to translate that person.'}
                    />

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Page Title (Français)</label>
                        <input
                          type="text"
                          required
                          value={teamTitleHt}
                          onChange={(e) => setTeamTitleHt(e.target.value)}
                          className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Page Title (English)</label>
                        <input
                          type="text"
                          required
                          value={teamTitleEn}
                          onChange={(e) => setTeamTitleEn(e.target.value)}
                          className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Subtitle (Français)</label>
                        <input
                          type="text"
                          required
                          value={teamSubtitleHt}
                          onChange={(e) => setTeamSubtitleHt(e.target.value)}
                          className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Subtitle (English)</label>
                        <input
                          type="text"
                          required
                          value={teamSubtitleEn}
                          onChange={(e) => setTeamSubtitleEn(e.target.value)}
                          className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-8">
                      {teamDepartments.map((department, deptIndex) => (
                        <div key={department.id} className="p-5 rounded-xl bg-slate-900/20 border border-slate-850 space-y-5">
                          <div className="flex items-center justify-between border-b border-slate-850 pb-3 gap-3">
                            <h5 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                              {language === 'fr_ht' ? `Département ${deptIndex + 1}` : `Department ${deptIndex + 1}`}
                            </h5>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                title={language === 'fr_ht' ? 'Monter le département' : 'Move department up'}
                                onClick={() => handleMoveTeamDepartment(deptIndex, 'up')}
                                disabled={deptIndex === 0}
                                className="p-1 rounded bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 text-slate-400 hover:text-amber-400 disabled:opacity-30 transition-all cursor-pointer"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                title={language === 'fr_ht' ? 'Descendre le département' : 'Move department down'}
                                onClick={() => handleMoveTeamDepartment(deptIndex, 'down')}
                                disabled={deptIndex === teamDepartments.length - 1}
                                className="p-1 rounded bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 text-slate-400 hover:text-amber-400 disabled:opacity-30 transition-all cursor-pointer"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                title={language === 'fr_ht' ? 'Supprimer le département' : 'Delete department'}
                                onClick={() => handleDeleteTeamDepartment(deptIndex)}
                                className="p-1 rounded bg-slate-950 border border-rose-950 hover:border-rose-500 hover:bg-rose-950/20 text-rose-400/80 hover:text-rose-400 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Department Header (Français)</label>
                              <input
                                type="text"
                                required
                                value={department.title_ht}
                                onChange={(e) => handleUpdateTeamDepartment(deptIndex, 'title_ht', e.target.value)}
                                className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white font-semibold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Department Header (English)</label>
                              <input
                                type="text"
                                required
                                value={department.title_en}
                                onChange={(e) => handleUpdateTeamDepartment(deptIndex, 'title_en', e.target.value)}
                                className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white font-semibold"
                              />
                            </div>
                          </div>

                          <div className="space-y-5">
                            {department.members.map((member, memberIndex) => {
                              const memberKey: TeamMemberKey = `${deptIndex}-${memberIndex}`;
                              return (
                                <div
                                  key={memberKey}
                                  className={`p-5 rounded-lg bg-slate-900/30 border space-y-4 transition-all ${
                                    translatingTeamMemberKey === memberKey
                                      ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/5'
                                      : 'border-slate-850'
                                  }`}
                                >
                                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                                    <h6 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                      {language === 'fr_ht'
                                        ? `Membre ${memberIndex + 1}`
                                        : `Member ${memberIndex + 1}`}
                                      {member.name ? ` - ${member.name}` : ''}
                                    </h6>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        title={language === 'fr_ht' ? 'Monter' : 'Move Up'}
                                        onClick={() => handleMoveTeamMember(deptIndex, memberIndex, 'up')}
                                        disabled={memberIndex === 0}
                                        className="p-1 rounded bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 text-slate-400 hover:text-amber-400 disabled:opacity-30 transition-all cursor-pointer"
                                      >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        title={language === 'fr_ht' ? 'Descendre' : 'Move Down'}
                                        onClick={() => handleMoveTeamMember(deptIndex, memberIndex, 'down')}
                                        disabled={memberIndex === department.members.length - 1}
                                        className="p-1 rounded bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 text-slate-400 hover:text-amber-400 disabled:opacity-30 transition-all cursor-pointer"
                                      >
                                        <ArrowDown className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        title={language === 'fr_ht' ? 'Supprimer' : 'Delete'}
                                        onClick={() => handleDeleteTeamMember(deptIndex, memberIndex)}
                                        className="p-1 rounded bg-slate-950 border border-rose-950 hover:border-rose-500 hover:bg-rose-950/20 text-rose-400/80 hover:text-rose-400 transition-all cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <AdminBilingualTranslateBar
                                    compact
                                    language={language}
                                    direction={bilingualTranslateDirection}
                                    onDirectionChange={setBilingualTranslateDirection}
                                    onTranslate={() => handleTranslateTeamMember(deptIndex, memberIndex)}
                                    isTranslating={isBilingualTranslating && translatingTeamMemberKey === memberKey}
                                    hint={language === 'fr_ht'
                                      ? `Traduit le rôle et la biographie de ${member.name || `membre ${memberIndex + 1}`} uniquement.`
                                      : `Translates only the role and biography for ${member.name || `member ${memberIndex + 1}`}.`}
                                  />

                                  <div className="grid md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2 space-y-4">
                                      <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Name / Non</label>
                                          <input
                                            type="text"
                                            required
                                            value={member.name}
                                            onChange={(e) => handleUpdateTeamMember(deptIndex, memberIndex, 'name', e.target.value)}
                                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white font-semibold"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Email / Adresse courriel (optionnel)</label>
                                          <input
                                            type="text"
                                            value={member.email || ''}
                                            onChange={(e) => handleUpdateTeamMember(deptIndex, memberIndex, 'email', e.target.value)}
                                            placeholder={language === 'fr_ht' ? 'Laisser vide si non applicable' : 'Leave blank if not applicable'}
                                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                                          />
                                        </div>
                                      </div>

                                      <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Rôle (français)</label>
                                          <input
                                            type="text"
                                            value={member.role_ht}
                                            onChange={(e) => handleUpdateTeamMember(deptIndex, memberIndex, 'role_ht', e.target.value)}
                                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Role (English)</label>
                                          <input
                                            type="text"
                                            value={member.role_en}
                                            onChange={(e) => handleUpdateTeamMember(deptIndex, memberIndex, 'role_en', e.target.value)}
                                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                                          />
                                        </div>
                                      </div>

                                      <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Biographie (français)</label>
                                          <textarea
                                            value={member.bio_ht}
                                            onChange={(e) => handleUpdateTeamMember(deptIndex, memberIndex, 'bio_ht', e.target.value)}
                                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white h-20 resize-none leading-relaxed"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Bio / Biography (English)</label>
                                          <textarea
                                            value={member.bio_en}
                                            onChange={(e) => handleUpdateTeamMember(deptIndex, memberIndex, 'bio_en', e.target.value)}
                                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white h-20 resize-none leading-relaxed"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Photo / Foto (400x400)</label>
                                      <div
                                        onClick={() => document.getElementById(`team-member-file-input-${memberKey}`)?.click()}
                                        onPaste={(e) => handlePasteTeamMember(deptIndex, memberIndex, e)}
                                        onDragOver={(e) => { e.preventDefault(); setDraggingMemberIndex(memberKey); }}
                                        onDragLeave={() => setDraggingMemberIndex(null)}
                                        onDrop={(e) => { handleDropTeamMember(deptIndex, memberIndex, e); setDraggingMemberIndex(null); }}
                                        className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all min-h-[180px] h-full group/drop overflow-hidden ${
                                          draggingMemberIndex === memberKey
                                            ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
                                            : 'border-slate-800 hover:border-amber-500/50 bg-slate-950/50'
                                        }`}
                                      >
                                        <input
                                          type="file"
                                          id={`team-member-file-input-${memberKey}`}
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => handleTeamMemberFile(deptIndex, memberIndex, e.target.files?.[0])}
                                        />

                                        {member.image_url ? (
                                          <div className="text-center z-10 w-full space-y-2">
                                            <div className="relative w-20 h-20 mx-auto shrink-0">
                                              <div className="w-20 h-20 rounded-full border-2 border-slate-800 overflow-hidden shadow-lg group-hover/drop:scale-105 transition-all">
                                                <img src={member.image_url} alt="Team member preview" className="w-full h-full object-cover" />
                                              </div>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleUpdateTeamMember(deptIndex, memberIndex, 'image_url', '');
                                                }}
                                                className="absolute -top-1 -right-1 p-1 rounded-full bg-slate-950 border border-rose-900 hover:border-rose-500 hover:bg-rose-950 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                                                title={language === 'fr_ht' ? 'Supprimer la photo' : 'Remove photo'}
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-300 block truncate">
                                              {member.name ? `${member.name.replace(/\s+/g, '_')}.jpg` : `Member_${memberIndex + 1}.jpg`}
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="flex flex-col items-center gap-1 text-slate-400 text-center">
                                            <UploadCloud className="w-6 h-6 group-hover/drop:text-amber-400 transition-all" />
                                            <span className="text-[10px] font-bold">
                                              {language === 'fr_ht' ? 'Choisir ou coller une photo' : 'Choose or Paste Photo'}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex justify-center border-t border-slate-850 pt-4">
                            <button
                              type="button"
                              onClick={() => handleAddTeamMember(deptIndex)}
                              className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-amber-400 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              <span>{language === 'fr_ht' ? 'Ajouter un membre' : 'Add Member'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-center border-t border-slate-900 pt-4">
                      <button
                        type="button"
                        onClick={handleAddTeamDepartment}
                        className="px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-amber-500/5 hover:-translate-y-0.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{language === 'fr_ht' ? 'Ajouter un département' : 'Add Department'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* SUB-TAB: WHAT TO EXPECT */}
                {homeSubTab === 'expect' && (
                  <div className="p-6 rounded-xl bg-slate-950 border border-slate-850/60 space-y-6">
                    <div className="border-b border-slate-900 pb-3">
                      <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        <span>{language === 'fr_ht' ? 'Page « À quoi vous attendre »' : 'What to Expect Page Content'}</span>
                      </h4>
                    </div>

                    <AdminBilingualTranslateBar
                      language={language}
                      direction={bilingualTranslateDirection}
                      onDirectionChange={setBilingualTranslateDirection}
                      onTranslate={handleTranslateHomeTab}
                      isTranslating={isBilingualTranslating}
                    />

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Section Title (Français)</label>
                        <input
                          type="text"
                          required
                          value={expectTitleHt}
                          onChange={(e) => setExpectTitleHt(e.target.value)}
                          className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Section Title (English)</label>
                        <input
                          type="text"
                          required
                          value={expectTitleEn}
                          onChange={(e) => setExpectTitleEn(e.target.value)}
                          className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Description (Français)</label>
                        <textarea
                          required
                          value={expectP1Ht}
                          onChange={(e) => setExpectP1Ht(e.target.value)}
                          className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white h-24 resize-none leading-relaxed"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Description (English)</label>
                        <textarea
                          required
                          value={expectP1En}
                          onChange={(e) => setExpectP1En(e.target.value)}
                          className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white h-24 resize-none leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Bullet Points */}
                    <div className="p-4 rounded-lg bg-slate-900/30 border border-slate-850 space-y-4">
                      <h5 className="text-xs font-bold text-amber-400/80 uppercase">Points clés / Bullet Points (3 items)</h5>
                      
                      <div className="space-y-4">
                        {/* Bullet 1 */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Bullet 1 (Français)</label>
                            <input
                              type="text"
                              required
                              value={expectBullet1Ht}
                              onChange={(e) => setExpectBullet1Ht(e.target.value)}
                              className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Bullet 1 (English)</label>
                            <input
                              type="text"
                              required
                              value={expectBullet1En}
                              onChange={(e) => setExpectBullet1En(e.target.value)}
                              className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                            />
                          </div>
                        </div>

                        {/* Bullet 2 */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Bullet 2 (Français)</label>
                            <input
                              type="text"
                              required
                              value={expectBullet2Ht}
                              onChange={(e) => setExpectBullet2Ht(e.target.value)}
                              className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Bullet 2 (English)</label>
                            <input
                              type="text"
                              required
                              value={expectBullet2En}
                              onChange={(e) => setExpectBullet2En(e.target.value)}
                              className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                            />
                          </div>
                        </div>

                        {/* Bullet 3 */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Bullet 3 (Français)</label>
                            <input
                              type="text"
                              required
                              value={expectBullet3Ht}
                              onChange={(e) => setExpectBullet3Ht(e.target.value)}
                              className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Bullet 3 (English)</label>
                            <input
                              type="text"
                              required
                              value={expectBullet3En}
                              onChange={(e) => setExpectBullet3En(e.target.value)}
                              className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Drag-Drop-Paste Image Zone */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase text-slate-400">Section Image / Imaj Seksyon</label>
                      <div
                        onClick={() => document.getElementById('expect-file-input')?.click()}
                        onPaste={handlePasteExpect}
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingExpect(true); }}
                        onDragLeave={() => setIsDraggingExpect(false)}
                        onDrop={handleDropExpect}
                        className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all min-h-[160px] group overflow-hidden ${
                          isDraggingExpect 
                            ? 'border-amber-500 bg-amber-500/10 scale-[1.01]' 
                            : 'border-slate-800 hover:border-amber-500/50 bg-slate-950/50'
                        }`}
                      >
                        <input
                          type="file"
                          id="expect-file-input"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleExpectFile(e.target.files?.[0])}
                        />

                        {expectImageUrl ? (
                          <div className="flex flex-col md:flex-row items-center gap-4 z-10 w-full">
                            <div className="w-32 h-20 rounded-lg border border-slate-800 overflow-hidden shrink-0 shadow-lg group-hover:scale-105 transition-all">
                              <img src={expectImageUrl} alt="What to Expect preview" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 text-left">
                              <span className="text-xs font-bold text-slate-200 block truncate">expect_bg.jpg</span>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {language === 'fr_ht' 
                                  ? 'Cliquez pour modifier, faites glisser une autre image ou collez-en une ici.'
                                  : 'Click to choose, drag and drop another image, or paste an image here.'}
                              </span>
                              <input 
                                type="text"
                                value={expectImageUrl.startsWith('data:') ? 'Base64 image asset...' : expectImageUrl}
                                readOnly
                                className="w-full mt-2 px-2 py-1 rounded bg-slate-900 border border-slate-850 text-[10px] text-slate-400 pointer-events-none"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <UploadCloud className="w-8 h-8 group-hover:text-amber-400 transition-all animate-bounce" />
                            <span className="text-xs font-bold">{language === 'fr_ht' ? 'Choisir, glisser ou coller une image' : 'Select, Drag & Drop, or Paste an Image'}</span>
                            <span className="text-[10px] text-slate-500">Image PNG ou JPG</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Persistent Save Button for all sub-sections */}
                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center gap-2 text-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>{language === 'fr_ht' ? 'Enregistrer toutes les modifications' : 'Save All Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: SERVICE SCHEDULES MANAGER */}
          {activeTab === 'schedules' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-xl font-bold text-white font-serif">{t.adminTabSchedules}</h3>
                {editingScheduleId && (
                  <button 
                    onClick={resetScheduleForm}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-850 text-xs font-bold"
                  >
                    {t.btnAddNew}
                  </button>
                )}
              </div>

              {/* Form to Add or Edit */}
              <form onSubmit={handleSaveSchedule} className="p-5 rounded-xl bg-slate-950 border border-slate-850 space-y-4">
                <h4 className="text-xs font-bold uppercase text-amber-400">
                  {editingScheduleId ? 'Modify Schedule / Modifier' : 'Create New Schedule / Ajouter un horaire'}
                </h4>

                <AdminBilingualTranslateBar
                  language={language}
                  direction={bilingualTranslateDirection}
                  onDirectionChange={setBilingualTranslateDirection}
                  onTranslate={handleTranslateSchedule}
                  isTranslating={isBilingualTranslating}
                />
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Jour (français)</label>
                    <input 
                      type="text" required placeholder="e.g. Dimanch" value={schedDayHt} onChange={e => setSchedDayHt(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Day / Jou (English)</label>
                    <input 
                      type="text" required placeholder="e.g. Sunday" value={schedDayEn} onChange={e => setSchedDayEn(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Heure</label>
                    <input 
                      type="text" required placeholder="e.g. 9:00 AM - 11:30 AM" value={schedTime} onChange={e => setSchedTime(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Title (Français)</label>
                    <input 
                      type="text" required value={schedTitleHt} onChange={e => setSchedTitleHt(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Title (English)</label>
                    <input 
                      type="text" required value={schedTitleEn} onChange={e => setSchedTitleEn(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description (Français)</label>
                    <textarea 
                      rows={2} value={schedDescHt} onChange={e => setSchedDescHt(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description (English)</label>
                    <textarea 
                      rows={2} value={schedDescEn} onChange={e => setSchedDescEn(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white resize-none"
                    />
                  </div>
                </div>


                {/* Visual Image Dropzone / Clipboard Paste / File Browse */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-500">
                    {language === 'fr_ht' ? 'Image de l’horaire des cultes (facultative)' : 'Service Schedule Image (Optional)'}
                  </label>
                  
                  <div 
                    onClick={() => document.getElementById('sched-file-input')?.click()}
                    onPaste={handlePasteSched}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingSched(true); }}
                    onDragLeave={() => setIsDraggingSched(false)}
                    onDrop={handleDropSched}
                    className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all min-h-[120px] group overflow-hidden ${
                      isDraggingSched 
                        ? 'border-amber-500 bg-amber-500/10 scale-[1.01]' 
                        : 'border-slate-800 hover:border-amber-500/50 bg-slate-900/50 hover:bg-slate-900/85'
                    }`}
                  >
                    <input 
                      type="file" 
                      id="sched-file-input" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleSchedFile(e.target.files?.[0])} 
                    />
                    
                    {schedImg ? (
                      <div className="flex items-center gap-4 z-10 w-full">
                        <div className="w-16 h-16 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden p-0.5 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-all">
                          <img src={schedImg} alt="Schedule preview" className="w-full h-full object-cover rounded" />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-xs font-bold text-slate-200 block truncate">
                            {language === 'fr_ht' ? 'Image_Active.png' : 'Active_Image.png'}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {language === 'fr_ht' 
                              ? 'Cliquez pour modifier, faites glisser une autre image ou collez-en une ici'
                              : 'Click to change, drag another image, or copy-paste here'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSchedImg('');
                          }}
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:bg-rose-950 hover:border-rose-900 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title={language === 'fr_ht' ? 'Supprimer l’image' : 'Remove image'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-slate-400">
                        <UploadCloud className="w-7 h-7 group-hover:text-amber-400 transition-all animate-bounce" />
                        <span className="text-xs font-bold text-center">
                          {language === 'fr_ht' 
                            ? 'Choisir, glisser ou coller une image'
                            : 'Browse, Drag, or Paste an Image'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {language === 'fr_ht' 
                            ? 'Formats PNG et JPG acceptés (compression automatique)'
                            : 'Supports PNG, JPG (Will be auto-compressed)'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2">
                    <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">
                      {language === 'fr_ht' ? 'URL directe de l’image (facultative)' : 'Direct URL Input (Optional)'}
                    </label>
                    <input 
                      type="text" 
                      value={schedImg}
                      onChange={(e) => setSchedImg(e.target.value)}
                      className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-[10px] text-slate-100 transition-all font-mono"
                      placeholder={language === 'fr_ht' ? "Ou collez l’URL d’une image ici..." : "Or paste any image URL here..."}
                    />
                  </div>
                </div>

                {/* Conflict Warning banner */}
                {getScheduleConflict() && (
                  <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/60 text-rose-200 flex items-start gap-2.5 text-xs animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-400">
                        {language === 'fr_ht' 
                          ? 'Attention : conflit d’horaire !'
                          : 'Warning: cannot schedule 2 live stream events at the same time'}
                      </p>
                      <p className="text-[10px] text-rose-300/80 mt-0.5">
                        {language === 'fr_ht'
                          ? `Cet horaire entre en conflit avec "${getScheduleConflict()?.title_kreyol}" (${getScheduleConflict()?.time})`
                          : `This conflicts with "${getScheduleConflict()?.title_english}" (${getScheduleConflict()?.time})`}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-slate-900">
                  {/* Neon Glow Purple Live Stream Checkbox */}
                  <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => {
                    setSchedIsLiveStream(!schedIsLiveStream);
                    setHasManuallyToggledLiveStream(true);
                  }}>
                    <div className={`w-5.5 h-5.5 rounded border flex items-center justify-center transition-all ${
                      schedIsLiveStream 
                        ? 'border-purple-500 bg-purple-600/20 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)]' 
                        : 'border-slate-700 bg-slate-900 text-transparent hover:border-purple-500/50'
                    }`}>
                      {schedIsLiveStream && (
                        <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-lg font-bold text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.3)] font-sans tracking-wide">
                      {language === 'fr_ht' ? 'Diffusion en direct' : 'Live Stream'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {editingScheduleId && (
                      <button 
                        type="button" onClick={resetScheduleForm}
                        className="px-4 py-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300"
                      >
                        {t.btnCancel}
                      </button>
                    )}
                    <button 
                      type="submit"
                      className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                    >
                      {t.btnSave}
                    </button>
                  </div>
                </div>
              </form>

              {/* Schedules List Grid */}
              <div className="space-y-4">
                {schedules.map(sched => (
                  <div key={sched.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/20 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {sched.image_url && (
                        <div className="w-10 h-10 rounded bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                          <img src={sched.image_url} alt={sched.title_english} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                            {sched.day_kreyol} / {sched.day_english}
                          </span>
                          <span className="text-xs font-medium text-slate-500">{sched.time}</span>
                          {sched.is_livestreamed === 1 && (
                            <span className="text-[10px] font-bold text-purple-400 bg-purple-950/40 border border-purple-800/60 px-2 py-0.5 rounded shadow-[0_0_8px_rgba(168,85,247,0.2)] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shrink-0" />
                              {language === 'fr_ht' ? 'En direct' : 'Live Stream'}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white">
                          {sched.title_kreyol} <span className="text-slate-500">|</span> {sched.title_english}
                        </h4>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditScheduleClick(sched)}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteSchedule(sched.id)}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: HAITI MISSIONS MANAGER */}
          {activeTab === 'missions' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-xl font-bold text-white font-serif">{t.adminTabMissions}</h3>
                {editingMissionId && (
                  <button onClick={resetMissionForm} className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-850 text-xs font-bold">
                    {t.btnAddNew}
                  </button>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleSaveMission} className="p-5 rounded-xl bg-slate-950 border border-slate-850 space-y-4">
                <h4 className="text-xs font-bold uppercase text-amber-400">
                  {editingMissionId ? 'Modify Haiti Project' : 'Create New Haiti Mission'}
                </h4>

                <AdminBilingualTranslateBar
                  language={language}
                  direction={bilingualTranslateDirection}
                  onDirectionChange={setBilingualTranslateDirection}
                  onTranslate={handleTranslateMission}
                  isTranslating={isBilingualTranslating}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Project Name (Français)</label>
                    <input 
                      type="text" required value={missTitleHt} onChange={e => setPMissTitleHt(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Project Name (English)</label>
                    <input 
                      type="text" required value={missTitleEn} onChange={e => setPMissTitleEn(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description (Français)</label>
                    <textarea 
                      rows={3} value={missDescHt} onChange={e => setPMissDescHt(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description (English)</label>
                    <textarea 
                      rows={3} value={missDescEn} onChange={e => setPMissDescEn(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white resize-none"
                    />
                  </div>
                </div>

                {/* Visual Image Dropzone / Clipboard Paste / File Browse */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-500">
                    {language === 'fr_ht' ? 'Image de la mission (facultative)' : 'Mission Image (Optional)'}
                  </label>
                  
                  <div 
                    onClick={() => document.getElementById('miss-file-input')?.click()}
                    onPaste={handlePasteMiss}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingMiss(true); }}
                    onDragLeave={() => setIsDraggingMiss(false)}
                    onDrop={handleDropMiss}
                    className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all min-h-[120px] group overflow-hidden ${
                      isDraggingMiss 
                        ? 'border-amber-500 bg-amber-500/10 scale-[1.01]' 
                        : 'border-slate-800 hover:border-amber-500/50 bg-slate-900/50 hover:bg-slate-900/85'
                    }`}
                  >
                    <input 
                      type="file" 
                      id="miss-file-input" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleMissFile(e.target.files?.[0])} 
                    />
                    
                    {missImg ? (
                      <div className="flex items-center gap-4 z-10 w-full">
                        <div className="w-16 h-16 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden p-0.5 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-all">
                          <img src={missImg} alt="Mission preview" className="w-full h-full object-cover rounded" />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-xs font-bold text-slate-200 block truncate">
                            {language === 'fr_ht' ? 'Image_Mission.png' : 'Mission_Image.png'}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {language === 'fr_ht' 
                              ? 'Cliquez pour modifier, faites glisser une autre image ou collez-en une ici'
                              : 'Click to change, drag another image, or copy-paste here'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPMissImg('');
                          }}
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:bg-rose-950 hover:border-rose-900 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title={language === 'fr_ht' ? 'Supprimer l’image' : 'Remove image'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-slate-400">
                        <UploadCloud className="w-7 h-7 group-hover:text-amber-400 transition-all animate-bounce" />
                        <span className="text-xs font-bold text-center">
                          {language === 'fr_ht' 
                            ? 'Choisir, glisser ou coller une image'
                            : 'Browse, Drag, or Paste an Image'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {language === 'fr_ht' 
                            ? 'Formats PNG et JPG acceptés (compression automatique)'
                            : 'Supports PNG, JPG (Will be auto-compressed)'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2">
                    <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">
                      {language === 'fr_ht' ? 'URL directe de l’image (facultative)' : 'Direct URL Input (Optional)'}
                    </label>
                    <input 
                      type="text" 
                      value={missImg}
                      onChange={(e) => setPMissImg(e.target.value)}
                      className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-[10px] text-slate-100 transition-all font-mono"
                      placeholder={language === 'fr_ht' ? "Ou collez l’URL d’une image ici..." : "Or paste any image URL here..."}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Funds Raised ($)</label>
                    <input 
                      type="number" value={missRaised} onChange={e => setPMissRaised(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Goal ($)</label>
                    <input 
                      type="number" value={missGoal} onChange={e => setPMissGoal(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  {editingMissionId && (
                    <button type="button" onClick={resetMissionForm} className="px-4 py-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-300">
                      {t.btnCancel}
                    </button>
                  )}
                  <button type="submit" className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs">
                    {t.btnSave}
                  </button>
                </div>
              </form>

              {/* List */}
              <div className="space-y-4">
                {missions.map(miss => (
                  <div key={miss.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/20 flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-bold text-white">{miss.title_kreyol} <span className="text-slate-500">|</span> {miss.title_english}</h4>
                      <p className="text-xs text-slate-400 mt-1">Goal: ${miss.funds_goal.toLocaleString()} | Raised: ${miss.funds_raised.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditMissionClick(miss)} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteMission(miss.id)} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <AdminSectionContactExport
                section="haiti_missions"
                exportSlug="haiti_missions"
                language={language === 'fr_ht' ? 'fr_ht' : 'en'}
                listTitle={language === 'en' ? 'Haiti Missions Export' : 'Exportation des missions en Haïti'}
                listDescription={
                  language === 'en'
                    ? 'Download an Excel-compatible spreadsheet you can open in Excel or Google Sheets.'
                    : 'Téléchargez un fichier compatible avec Excel ou Google Sheets.'
                }
                recordCount={missions.length}
                emptyMessage={language === 'en' ? 'No Haiti mission projects to export yet.' : 'Aucun projet missionnaire en Haïti à exporter pour le moment.'}
              />
            </div>
          )}

          {/* TAB 4: LOCAL OUTREACH MANAGER */}
          {activeTab === 'outreach' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-xl font-bold text-white font-serif">{t.adminTabOutreach}</h3>
                {editingOutreachId && (
                  <button onClick={resetOutreachForm} className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-850 text-xs font-bold">
                    {t.btnAddNew}
                  </button>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleSaveOutreach} className="p-5 rounded-xl bg-slate-950 border border-slate-850 space-y-4">
                <h4 className="text-xs font-bold uppercase text-amber-400">
                  {editingOutreachId ? 'Modify Outreach Project' : 'Create New Outreach Project'}
                </h4>

                <AdminBilingualTranslateBar
                  language={language}
                  direction={bilingualTranslateDirection}
                  onDirectionChange={setBilingualTranslateDirection}
                  onTranslate={handleTranslateOutreach}
                  isTranslating={isBilingualTranslating}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Project Name (Français)</label>
                    <input 
                      type="text" required value={outrTitleHt} onChange={e => setOutrTitleHt(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Project Name (English)</label>
                    <input 
                      type="text" required value={outrTitleEn} onChange={e => setOutrTitleEn(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description (Français)</label>
                    <textarea 
                      rows={2} value={outrDescHt} onChange={e => setOutrDescHt(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description (English)</label>
                    <textarea 
                      rows={2} value={outrDescEn} onChange={e => setOutrDescEn(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white resize-none"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Schedule Info (Français)</label>
                    <input 
                      type="text" required placeholder="p. ex. Chaque samedi, 8 h" value={outrSchedHt} onChange={e => setOutrSchedHt(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Schedule Info (English)</label>
                    <input 
                      type="text" required placeholder="e.g. Every Saturday, 8:00 AM" value={outrSchedEn} onChange={e => setOutrSchedEn(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  {editingOutreachId && (
                    <button type="button" onClick={resetOutreachForm} className="px-4 py-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-300">
                      {t.btnCancel}
                    </button>
                  )}
                  <button type="submit" className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs">
                    {t.btnSave}
                  </button>
                </div>
              </form>

              {/* List */}
              <div className="space-y-4">
                {outreaches.map(outr => (
                  <div key={outr.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/20 flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-bold text-white">{outr.title_kreyol} <span className="text-slate-500">|</span> {outr.title_english}</h4>
                      <p className="text-xs text-slate-400 mt-1">Schedule: {outr.schedule_kreyol} / {outr.schedule_english}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditOutreachClick(outr)} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteOutreach(outr.id)} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <AdminSectionContactExport
                section="local_outreach"
                exportSlug="local_outreach"
                language={language === 'fr_ht' ? 'fr_ht' : 'en'}
                listTitle={language === 'en' ? 'Local Outreach Export' : 'Exportation de l’action communautaire locale'}
                listDescription={
                  language === 'en'
                    ? 'Download an Excel-compatible spreadsheet you can open in Excel or Google Sheets.'
                    : 'Téléchargez un fichier compatible avec Excel ou Google Sheets.'
                }
                recordCount={outreaches.length}
                emptyMessage={language === 'en' ? 'No local outreach projects to export yet.' : 'Aucun projet d’action communautaire locale à exporter pour le moment.'}
              />
            </div>
          )}

          {/* TAB 5: EVENTS MANAGER */}
          {activeTab === 'events' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-xl font-bold text-white font-serif">{t.adminTabEvents}</h3>
                {editingEventId && (
                  <button onClick={resetEventForm} className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-850 text-xs font-bold">
                    {t.btnAddNew}
                  </button>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleSaveEvent} className="p-5 rounded-xl bg-slate-950 border border-slate-850 space-y-4">
                <h4 className="text-xs font-bold uppercase text-amber-400">
                  {editingEventId ? 'Modify Event Details' : 'Create New Event'}
                </h4>

                <AdminBilingualTranslateBar
                  language={language}
                  direction={bilingualTranslateDirection}
                  onDirectionChange={setBilingualTranslateDirection}
                  onTranslate={handleTranslateEvent}
                  isTranslating={isBilingualTranslating}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Event Title (Français)</label>
                    <input 
                      type="text" required value={evTitleHt} onChange={e => setEvTitleHt(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Event Title (English)</label>
                    <input 
                      type="text" required value={evTitleEn} onChange={e => setEvTitleEn(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Date</label>
                    <input 
                      type="date" required value={evDate} onChange={e => setEvDate(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Time</label>
                    <input 
                      type="text" required placeholder="e.g. 6:00 PM" value={evTime} onChange={e => setEvTime(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Location (Français)</label>
                    <input 
                      type="text" required value={evLocHt} onChange={e => setEvLocHt(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Location (English)</label>
                    <input 
                      type="text" required value={evLocEn} onChange={e => setEvLocEn(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description (Français)</label>
                    <textarea 
                      rows={2} value={evDescHt} onChange={e => setEvDescHt(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description (English)</label>
                    <textarea 
                      rows={2} value={evDescEn} onChange={e => setEvDescEn(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  {editingEventId && (
                    <button type="button" onClick={resetEventForm} className="px-4 py-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-300">
                      {t.btnCancel}
                    </button>
                  )}
                  <button type="submit" className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs">
                    {t.btnSave}
                  </button>
                </div>
              </form>

              {/* List */}
              <div className="space-y-4">
                {events.map(ev => (
                  <div key={ev.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/20 flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-bold text-white">{ev.title_kreyol} <span className="text-slate-500">|</span> {ev.title_english}</h4>
                      <p className="text-xs text-slate-400 mt-1">{ev.date} at {ev.time} | {ev.location_kreyol}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditEventClick(ev)} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteEvent(ev.id)} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <AdminSectionContactExport
                section="events_signups"
                exportSlug="events"
                language={language === 'fr_ht' ? 'fr_ht' : 'en'}
                listTitle={language === 'en' ? 'Events Export' : 'Exportation des événements'}
                listDescription={
                  language === 'en'
                    ? 'Download an Excel-compatible spreadsheet you can open in Excel or Google Sheets.'
                    : 'Téléchargez un fichier compatible avec Excel ou Google Sheets.'
                }
                recordCount={events.length}
                emptyMessage={language === 'en' ? 'No events to export yet.' : 'Aucun événement à exporter pour le moment.'}
              />
            </div>
          )}

          {/* TAB 6: EVENT REGISTRATIONS VIEWER */}
          {activeTab === 'registrations' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3 font-serif">
                {t.adminRegistrationsTitle}
              </h3>

              <AdminSectionContactExport
                section="events_signups"
                exportSlug="event_registrations"
                language={language === 'fr_ht' ? 'fr_ht' : 'en'}
                listTitle={language === 'en' ? 'Event Registrations Export' : 'Exportation des inscriptions aux événements'}
                listDescription={
                  language === 'en'
                    ? 'Download an Excel-compatible spreadsheet you can open in Excel or Google Sheets.'
                    : 'Téléchargez un fichier compatible avec Excel ou Google Sheets.'
                }
                recordCount={registrations.length}
                emptyMessage={language === 'en' ? 'No event registrations to export yet.' : 'Aucune inscription à un événement à exporter pour le moment.'}
                showContactConfig={false}
              />

              {registrations.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  Aucune inscription à un événement pour le moment. / No registrations yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/20">
                  <table className="w-full border-collapse text-left text-xs font-semibold">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-4 uppercase tracking-wider">Registrant</th>
                        <th className="p-4 uppercase tracking-wider">Contact</th>
                        <th className="p-4 uppercase tracking-wider">Event Details</th>
                        <th className="p-4 uppercase tracking-wider">Notes</th>
                        <th className="p-4 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/80">
                      {registrations.map(reg => (
                        <tr key={reg.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="p-4">
                            <span className="font-bold text-white text-sm block">{reg.name}</span>
                          </td>
                          <td className="p-4 space-y-0.5 font-medium text-slate-300">
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-500" /> {reg.phone}</span>
                            {reg.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-500" /> {reg.email}</span>}
                          </td>
                          <td className="p-4 font-medium text-amber-400">
                            {language === 'fr_ht' ? reg.event_title_kreyol : reg.event_title_english}
                          </td>
                          <td className="p-4 max-w-xs truncate font-normal text-slate-400">
                            {reg.notes || '—'}
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => handleDeleteRegistration(reg.id)}
                              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: SERMONS/ARCHIVES MANAGER */}
          {activeTab === 'sermons' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-xl font-bold text-white font-serif">{t.navSermons}</h3>
                {editingSermonId && (
                  <button 
                    onClick={resetSermonForm}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-850 text-xs font-bold"
                  >
                    {t.btnAddNew}
                  </button>
                )}
              </div>

              {/* YOUTUBE CHANNELS AUTO SYNC AND STREAM INGESTION SETTINGS */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-850 space-y-4 shadow-xl">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Video className="w-4 h-4 text-amber-500" />
                    <span>YouTube Channel Auto-Synchronization / Otomatik Senkronizasyon</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Indiquez l’URL de votre chaîne pour importer automatiquement toutes les diffusions en direct dans la bibliothèque du site, sans devoir les ajouter une à une.
                  </p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">YouTube Streams Page URL</label>
                    <input 
                      type="text" 
                      value={ytChannelUrl}
                      onChange={(e) => setYtChannelUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-xs text-slate-200 font-mono"
                      placeholder="e.g. https://www.youtube.com/@parousiabaptistchurch1438/streams"
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleSyncYoutube}
                    disabled={isSyncing}
                    className="px-5 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-all h-[36px] flex items-center gap-1.5 cursor-pointer shadow whitespace-nowrap"
                  >
                    {isSyncing ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Synchronisation en cours...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Senkronize Videyo (Sync Streams)</span>
                      </>
                    )}
                  </button>
                </div>
                
                <span className="text-[10px] text-slate-500 block">
                  L’outil parcourra la page, récupérera toutes les vidéos diffusées en direct et les enregistrera ou les mettra à jour dans la base SQLite, en vérifiant les dates et les noms des pasteurs.
                </span>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveSermon} className="p-5 rounded-2xl bg-slate-950/40 border border-slate-850 space-y-4">
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                  {editingSermonId ? (language === 'fr_ht' ? 'Modifier le sermon' : 'Edit Sermon') : (language === 'fr_ht' ? 'Ajouter un sermon' : 'Add a New Sermon')}
                </h4>

                <AdminBilingualTranslateBar
                  language={language}
                  direction={bilingualTranslateDirection}
                  onDirectionChange={setBilingualTranslateDirection}
                  onTranslate={handleTranslateSermon}
                  isTranslating={isBilingualTranslating}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Title (Français)</label>
                    <input 
                      type="text" required value={sermTitleHt} onChange={e => setSermTitleHt(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Title (English)</label>
                    <input 
                      type="text" required value={sermTitleEn} onChange={e => setSermTitleEn(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{t.sermonDate} (YYYY-MM-DD)</label>
                    <input 
                      type="date" required value={sermDate} onChange={e => setSermDate(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{t.sermonSpeaker}</label>
                    <input 
                      type="text" required value={sermSpeaker} onChange={e => setSermSpeaker(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">YouTube Video ID</label>
                    <input 
                      type="text" required value={sermYoutubeId} onChange={e => setSermYoutubeId(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white font-mono"
                      placeholder="e.g. dQw4w9WgXcQ"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description (Français)</label>
                    <textarea 
                      rows={2} value={sermDescHt} onChange={e => setSermDescHt(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description (English)</label>
                    <textarea 
                      rows={2} value={sermDescEn} onChange={e => setSermDescEn(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 text-xs text-white resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  {editingSermonId && (
                    <button type="button" onClick={resetSermonForm} className="px-4 py-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-300">
                      {t.btnCancel}
                    </button>
                  )}
                  <button type="submit" className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs">
                    {t.btnSave}
                  </button>
                </div>
              </form>

              {/* List */}
              <div className="space-y-4">
                {sermons.map(serm => (
                  <div key={serm.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/20 flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                      <div className="w-20 aspect-video rounded bg-slate-950 border border-slate-850 overflow-hidden flex items-center justify-center text-[10px] text-slate-500 font-mono relative">
                        <img 
                          src={getYouTubeThumbnailUrl(serm.youtube_id)} 
                          alt="preview" 
                          className="w-full h-full object-cover opacity-50"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/40 font-mono text-[8px] text-slate-300 truncate px-1">
                          {serm.youtube_id.length > 11 ? serm.youtube_id.substring(0, 8) + '...' : serm.youtube_id}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {language === 'fr_ht' ? serm.title_kreyol : serm.title_english}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {serm.date} | {t.sermonSpeaker}: {serm.speaker}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditSermonClick(serm)} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteSermon(serm.id)} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subscribers Tab (Framed as Subscribers / Moun ki Abòne yo) */}
          {activeTab === 'subscribers' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-950/40 border border-slate-850">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-500" />
                    <span>Abonnés (Subscribers List)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Liste des personnes abonnées pour recevoir le cadeau spirituel, les messages de dévotion ou d’autres nouvelles de l’église.
                  </p>
                </div>
                
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handleCopySubscribersEmails}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer"
                  >
                    {copiedSubscribers ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-400">Toutes les adresses courriel ont été copiées !</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5 text-amber-500" />
                        <span>Copier toutes les adresses courriel</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <AdminSectionContactExport
                section="ebook_subscribers"
                exportSlug="ebook_subscribers"
                language={language === 'fr_ht' ? 'fr_ht' : 'en'}
                listTitle={language === 'en' ? 'Ebook Subscribers Export' : 'Exportation des abonnés au livre numérique'}
                listDescription={
                  language === 'en'
                    ? 'Download an Excel-compatible spreadsheet you can open in Excel or Google Sheets.'
                    : 'Téléchargez un fichier compatible avec Excel ou Google Sheets.'
                }
                recordCount={subscriberList.length}
                emptyMessage={t.adminSubscribersEmpty}
              />

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={language === 'fr_ht' ? 'Rechercher par nom, adresse courriel ou téléphone...' : 'Search by name, email, or phone...'}
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/50 border border-slate-850 focus:border-amber-500 focus:outline-none text-xs text-slate-200 transition-all"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">🔍</span>
                {subSearch && (
                  <button
                    onClick={() => setSubSearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-[10px] font-bold"
                  >
                    KLOSE
                  </button>
                )}
              </div>

              {/* Subscribers list display */}
              {subscriberList.filter(sub => {
                const term = subSearch.toLowerCase();
                return (
                  (sub.name || '').toLowerCase().includes(term) ||
                  (sub.email || '').toLowerCase().includes(term) ||
                  (sub.phone || '').toLowerCase().includes(term)
                );
              }).length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-950/20 border border-slate-850">
                  <p className="text-sm text-slate-500">
                    {language === 'fr_ht' ? 'Aucun abonné ne correspond à cette recherche.' : 'No subscribers match this search.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-850 bg-slate-950/20">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 bg-slate-950/40">
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-amber-500">Non (Name)</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-amber-500">Adresse courriel (Email)</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-amber-500">Téléphone (Phone)</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-amber-500">Date (Date Subscribed)</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-amber-500 text-right">Actions (Action)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {subscriberList.filter(sub => {
                        const term = subSearch.toLowerCase();
                        return (
                          (sub.name || '').toLowerCase().includes(term) ||
                          (sub.email || '').toLowerCase().includes(term) ||
                          (sub.phone || '').toLowerCase().includes(term)
                        );
                      }).map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-950/40 transition-colors group">
                          <td className="p-4 text-xs font-bold text-slate-100">{sub.name}</td>
                          <td className="p-4 text-xs font-mono text-slate-300">{sub.email || '—'}</td>
                          <td className="p-4 text-xs text-slate-300">{sub.phone || '—'}</td>
                          <td className="p-4 text-xs text-slate-400">
                            {sub.created_at ? new Date(sub.created_at).toLocaleDateString(language === 'fr_ht' ? 'fr-FR' : 'en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : '—'}
                          </td>
                          <td className="p-4 text-xs text-right">
                            <button
                              onClick={() => handleDeleteSubscriber(sub.id)}
                              className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-500 transition-all cursor-pointer opacity-40 group-hover:opacity-100"
                              title={language === 'fr_ht' ? 'Supprimer l’abonné' : 'Delete Subscriber'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Devotional Tab */}
          {activeTab === 'devotional' && (
            <div className="space-y-6">
              {/* Header card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-950/40 border border-slate-850">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-500" />
                    <span>{t.devotionalTitle}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {t.devotionalSubtitle}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Auto-publish toggle */}
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                    <input 
                      type="checkbox" 
                      checked={devotionalAutoPublish === 'true'} 
                      onChange={handleToggleAutoPublish}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900 bg-slate-950 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-300">
                      {t.devotionalAutoPublish}
                    </span>
                  </label>

                  <button
                    onClick={handleDevotionalGenerate}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all text-slate-950 text-xs font-bold cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>{t.devotionalBtnGenerate}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-850 space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 shrink-0">
                    <input
                      type="checkbox"
                      checked={devotionalThemeEnabled}
                      onChange={(e) => setDevotionalThemeEnabled(e.target.checked)}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900 bg-slate-950 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-300">
                      {t.devotionalThemeUse}
                    </span>
                  </label>

                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">
                      {t.devotionalThemePrompt}
                    </label>
                    <input
                      type="text"
                      list="devotional-theme-suggestions"
                      value={devotionalThemePrompt}
                      onChange={(e) => setDevotionalThemePrompt(e.target.value)}
                      disabled={!devotionalThemeEnabled}
                      placeholder={t.devotionalThemePlaceholder}
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs transition-all font-semibold ${
                        devotionalThemeEnabled
                          ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-amber-500 focus:outline-none'
                          : 'bg-slate-950 border-slate-850 text-slate-500 cursor-not-allowed'
                      }`}
                    />
                    <datalist id="devotional-theme-suggestions">
                      <option value="Forgiveness" />
                      <option value="Easter" />
                      <option value="Christmas" />
                      <option value="Miracles" />
                      <option value="Compassion" />
                      <option value="Faith" />
                      <option value="Love" />
                      <option value="Hope" />
                      <option value="Peace" />
                      <option value="Grace" />
                      <option value="Strength" />
                      <option value="Thanksgiving" />
                    </datalist>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {t.devotionalThemeHint}
                </p>
              </div>

              {/* Editing Form (if editing) */}
              {editingDevotionalId !== null && (
                <form onSubmit={handleDevotionalSave} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Edit className="w-4 h-4 text-amber-500" />
                      <span>{language === 'fr_ht' ? 'Modifier la dévotion' : 'Edit Devotional'}</span>
                    </h4>
                    <span className="text-xs font-semibold text-slate-400">
                      ID: #{editingDevotionalId}
                    </span>
                  </div>

                  <AdminBilingualTranslateBar
                    language={language}
                    direction={bilingualTranslateDirection}
                    onDirectionChange={setBilingualTranslateDirection}
                    onTranslate={handleTranslateDevotional}
                    isTranslating={isBilingualTranslating}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* References */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">{t.devotionalVerseRefHt}</label>
                      <input 
                        type="text"
                        value={editDevotionalForm.verse_ref_kreyol}
                        onChange={(e) => setEditDevotionalForm(prev => ({ ...prev, verse_ref_kreyol: e.target.value }))}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">{t.devotionalVerseRefEn}</label>
                      <input 
                        type="text"
                        value={editDevotionalForm.verse_ref_english}
                        onChange={(e) => setEditDevotionalForm(prev => ({ ...prev, verse_ref_english: e.target.value }))}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    {/* Texts */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">{t.devotionalVerseTextHt}</label>
                      <textarea
                        rows={3}
                        value={editDevotionalForm.verse_text_kreyol}
                        onChange={(e) => setEditDevotionalForm(prev => ({ ...prev, verse_text_kreyol: e.target.value }))}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">{t.devotionalVerseTextEn}</label>
                      <textarea
                        rows={3}
                        value={editDevotionalForm.verse_text_english}
                        onChange={(e) => setEditDevotionalForm(prev => ({ ...prev, verse_text_english: e.target.value }))}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    {/* Lessons */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">{t.devotionalLessonHt}</label>
                      <textarea
                        rows={3}
                        value={editDevotionalForm.lesson_kreyol}
                        onChange={(e) => setEditDevotionalForm(prev => ({ ...prev, lesson_kreyol: e.target.value }))}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">{t.devotionalLessonEn}</label>
                      <textarea
                        rows={3}
                        value={editDevotionalForm.lesson_english}
                        onChange={(e) => setEditDevotionalForm(prev => ({ ...prev, lesson_english: e.target.value }))}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    {/* Status */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-400 mb-1">{t.devotionalStatus}</label>
                      <select
                        value={editDevotionalForm.status}
                        onChange={(e) => setEditDevotionalForm(prev => ({ ...prev, status: e.target.value as 'pending' | 'approved' }))}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="pending">{t.devotionalPending}</option>
                        <option value="approved">{t.devotionalApproved}</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                    <button
                      type="button"
                      onClick={() => setEditingDevotionalId(null)}
                      className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 transition-all cursor-pointer"
                    >
                      {t.btnCancel}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all cursor-pointer"
                    >
                      {t.btnSave}
                    </button>
                  </div>
                </form>
              )}

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={language === 'fr_ht' ? 'Rechercher par date ou référence...' : 'Search by date or reference...'}
                  value={devotionalSearch}
                  onChange={(e) => setDevotionalSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/50 border border-slate-850 focus:border-amber-500 focus:outline-none text-xs text-slate-200 transition-all"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">🔍</span>
                {devotionalSearch && (
                  <button
                    onClick={() => setDevotionalSearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-[10px] font-bold"
                  >
                    KLOSE
                  </button>
                )}
              </div>

              {/* Devotional List */}
              {devotionalList.filter(d => {
                const term = devotionalSearch.toLowerCase();
                return (
                  (d.date || '').toLowerCase().includes(term) ||
                  (d.verse_ref_english || '').toLowerCase().includes(term) ||
                  (d.verse_ref_kreyol || '').toLowerCase().includes(term)
                );
              }).length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-950/20 border border-slate-850">
                  <p className="text-sm text-slate-500">
                    {language === 'fr_ht' ? 'Aucune dévotion trouvée.' : 'No devotionals found.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {devotionalList.filter(d => {
                    const term = devotionalSearch.toLowerCase();
                    return (
                      (d.date || '').toLowerCase().includes(term) ||
                      (d.verse_ref_english || '').toLowerCase().includes(term) ||
                      (d.verse_ref_kreyol || '').toLowerCase().includes(term)
                    );
                  }).map((d) => (
                    <div 
                      key={d.id} 
                      className={`p-5 rounded-2xl border transition-all hover:bg-slate-950/30 ${
                        d.status === 'approved' 
                          ? 'bg-slate-950/10 border-slate-850' 
                          : 'bg-amber-950/5 border-amber-900/30'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850/50 pb-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                            📅 {d.date}
                          </span>
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            d.status === 'approved' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {d.status === 'approved' ? t.devotionalApproved : t.devotionalPending}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {d.status === 'pending' && (
                            <button
                              onClick={() => handleDevotionalApprove(d.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 mr-1"
                              title={t.devotionalBtnApprove}
                            >
                              <Check className="w-3 h-3" />
                              <span>{language === 'fr_ht' ? 'Approuver' : 'Approve'}</span>
                            </button>
                          )}
                          <button
                            onClick={() => startEditDevotional(d)}
                            className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                            title={language === 'fr_ht' ? 'Modifier' : 'Edit'}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDevotionalDelete(d.id)}
                            className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
                            title={language === 'fr_ht' ? 'Supprimer' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* French version (stored in legacy _kreyol fields) */}
                        <div className="space-y-2 border-r border-slate-850/30 pr-0 md:pr-4">
                          <div className="text-amber-500 font-extrabold flex items-center gap-1.5">
                            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">FR</span>
                            <span>{d.verse_ref_kreyol}</span>
                          </div>
                          <p className="text-slate-200 italic font-medium leading-relaxed">
                            "{d.verse_text_kreyol}"
                          </p>
                          <p className="text-slate-400 leading-relaxed bg-slate-950/20 p-2.5 rounded-lg border border-slate-850/50">
                            {d.lesson_kreyol}
                          </p>
                        </div>

                        {/* English Version */}
                        <div className="space-y-2">
                          <div className="text-amber-500 font-extrabold flex items-center gap-1.5">
                            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">EN</span>
                            <span>{d.verse_ref_english}</span>
                          </div>
                          <p className="text-slate-200 italic font-medium leading-relaxed">
                            "{d.verse_text_english}"
                          </p>
                          <p className="text-slate-400 leading-relaxed bg-slate-950/20 p-2.5 rounded-lg border border-slate-850/50">
                            {d.lesson_english}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 10: SECURITY & ADMINS PANEL */}
          {activeTab === 'admins' && isSuperAdmin && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-850">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-500" />
                  <span>{t.adminAdminsTitle}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'fr_ht' 
                    ? 'Ajoutez ou révoquez les adresses courriel des administrateurs autorisés à se connecter au système par code OTP.'
                    : 'Add or revoke administrator email addresses authorized to log in via 2FA/OTP.'}
                </p>
              </div>

              {/* Add Admin Form */}
              <form onSubmit={handleAddAdminEmail} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-end gap-3">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-slate-400 mb-2">
                      {language === 'fr_ht' ? 'Adresse courriel de l’administrateur' : 'Administrator Email Address'}
                    </label>
                    <input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder={t.adminAdminsAddPlaceholder}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                      required
                    />
                    {newAdminEmailError && (
                      <p className="text-[11px] text-rose-400 mt-2 leading-relaxed font-semibold">
                        {newAdminEmailError}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={Boolean(newAdminEmailError)}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all text-slate-950 text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.adminAdminsBtnAdd}</span>
                  </button>
                </div>
              </form>

              {/* Admins Table */}
              <div className="rounded-2xl border border-slate-850 bg-slate-950/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950/60 border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="px-5 py-4">{t.adminAdminsColEmail}</th>
                        <th className="px-5 py-4">{t.adminAdminsColSuperAdmin}</th>
                        <th className="px-5 py-4">{t.adminAdminsColDate}</th>
                        <th className="px-5 py-4 text-right">{language === 'fr_ht' ? 'Actions' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/40">
                      {adminList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                            {t.adminAdminsEmpty}
                          </td>
                        </tr>
                      ) : (
                        adminList.map((admin) => (
                          <tr key={admin.id} className="hover:bg-slate-950/20 transition-all">
                            <td className="px-5 py-4 font-mono font-semibold text-slate-200">
                              {admin.email}
                            </td>
                            <td className="px-5 py-4">
                              <label className="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isAdminSuperAdmin(admin)}
                                  disabled={isEnvSuperAdmin(admin.email)}
                                  onChange={(e) => handleToggleAdminSuperAdmin(admin, e.target.checked)}
                                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
                                  title={
                                    isEnvSuperAdmin(admin.email)
                                      ? (language === 'fr_ht'
                                        ? 'Super-administrateur permanent défini dans la configuration de l’environnement'
                                        : 'Permanent super-admin configured in environment')
                                      : undefined
                                  }
                                />
                                <span className="text-slate-400 text-[11px]">
                                  {isAdminSuperAdmin(admin)
                                    ? (language === 'fr_ht' ? 'Oui' : 'Yes')
                                    : (language === 'fr_ht' ? 'Non' : 'No')}
                                </span>
                              </label>
                            </td>
                            <td className="px-5 py-4 text-slate-400">
                              {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={() => handleDeleteAdminEmail(admin.id)}
                                className="p-2 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all cursor-pointer inline-flex"
                                title={t.btnDelete}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: CONTACT MESSAGES SUBMISSIONS PANEL */}
          {activeTab === 'contact' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Mail className="w-5 h-5 text-amber-500" />
                    <span>{t.adminContactTitle}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {language === 'fr_ht' 
                      ? 'Consultez les demandes, les commentaires et les messages envoyés par les visiteurs du site.'
                      : 'View care requests, feedback, and messages submitted by website visitors.'}
                  </p>
                </div>
              </div>

              <AdminSectionContactExport
                section="contact_submissions"
                exportSlug="contact_submissions"
                language={language === 'fr_ht' ? 'fr_ht' : 'en'}
                listTitle={language === 'en' ? 'Contact Submissions Export' : 'Exportation des messages de contact'}
                listDescription={
                  language === 'en'
                    ? 'Download an Excel-compatible spreadsheet you can open in Excel or Google Sheets.'
                    : 'Téléchargez un fichier compatible avec Excel ou Google Sheets.'
                }
                recordCount={contactLogs.length}
                emptyMessage={t.adminContactEmpty}
              />

              {/* Messages Table/Cards */}
              {contactLogs.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-950/20 border border-slate-850">
                  <p className="text-sm text-slate-500">{t.adminContactEmpty}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contactLogs.map((log) => (
                    <div key={log.id} className="p-5 rounded-2xl bg-slate-950/10 border border-slate-850 hover:bg-slate-950/20 transition-all relative group">
                      <button
                        onClick={() => handleDeleteContactLog(log.id)}
                        className="absolute top-4 right-4 p-2 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                        title={t.btnDelete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex flex-col md:flex-row md:items-center gap-2 border-b border-slate-850/50 pb-3 mb-3">
                        <span className="font-bold text-sm text-white">{log.name}</span>
                        <span className="hidden md:inline text-slate-600">•</span>
                        <span className="font-mono text-xs text-amber-400 font-semibold">{log.email}</span>
                        {log.phone && (
                          <>
                            <span className="hidden md:inline text-slate-600">•</span>
                            <span className="text-xs text-slate-400 font-medium">📞 {log.phone}</span>
                          </>
                        )}
                        <span className="md:ml-auto text-[10px] text-slate-500 font-bold bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                        </span>
                      </div>

                      <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap bg-slate-950/40 p-4 rounded-xl border border-slate-850/50">
                        {log.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 12: PRAYER WALL MODERATION PANEL */}
          {activeTab === 'prayers' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-850">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-amber-500" />
                  <span>{t.adminPrayersTitle}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'fr_ht' 
                    ? 'Modérez et supprimez les demandes de prière publiées sur le mur public.'
                    : 'Moderate and delete prayer requests posted on the public prayer wall.'}
                </p>
              </div>

              <AdminSectionContactExport
                section="prayer_moderation"
                exportSlug="prayer_moderation"
                language={language === 'fr_ht' ? 'fr_ht' : 'en'}
                listTitle={language === 'en' ? 'Prayer Requests Export' : 'Exportation des demandes de prière'}
                listDescription={
                  language === 'en'
                    ? 'Download an Excel-compatible spreadsheet you can open in Excel or Google Sheets.'
                    : 'Téléchargez un fichier compatible avec Excel ou Google Sheets.'
                }
                recordCount={moderationPrayers.length}
                emptyMessage={t.adminPrayersEmpty}
              />

              {/* Prayers List */}
              {moderationPrayers.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-950/20 border border-slate-850">
                  <p className="text-sm text-slate-500">{t.adminPrayersEmpty}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {moderationPrayers.map((prayer) => (
                    <div key={prayer.id} className="p-5 rounded-2xl bg-slate-950/10 border border-slate-850 hover:bg-slate-950/20 transition-all flex justify-between items-start gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {prayer.is_anonymous === 1 ? (
                              <span className="text-amber-500 italic bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/10 text-[10px]">
                                {t.prayerCardAnonymous}
                              </span>
                            ) : (
                              prayer.requester_name || t.prayerCardAnonymous
                            )}
                          </span>
                          <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-850 font-bold">
                            📅 {prayer.created_at}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-serif bg-slate-950/30 p-3 rounded-lg border border-slate-850/40">
                          {prayer.request_text}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeletePrayer(prayer.id)}
                        className="p-2 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-500 hover:text-red-400 transition-all cursor-pointer shrink-0"
                        title={t.btnDelete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 13: BLOG CRUD PANEL */}
          {activeTab === 'blog' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-500" />
                    <span>{t.adminBlogTitle}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {language === 'fr_ht' 
                      ? 'Publiez des notes, des réflexions et des articles pastoraux pour la communauté.'
                      : 'Publish weekly thoughts, reflections, and pastoral viewpoints for the church blog.'}
                  </p>
                </div>
                
                {editingBlogPostId === null && (
                  <button
                    onClick={handleStartCreateBlog}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all text-slate-950 text-xs font-bold cursor-pointer shadow-lg shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.adminBlogBtnCreate}</span>
                  </button>
                )}
              </div>

              {/* Creation / Editing Form overlay / view */}
              {editingBlogPostId !== null ? (
                <form onSubmit={handleSaveBlog} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-3 mb-2">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Edit className="w-4 h-4 text-amber-500" />
                      <span>{editingBlogPostId === 0 ? t.adminBlogNewTitle : t.adminBlogEditTitle}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEditingBlogPostId(null)}
                      className="text-xs text-slate-400 hover:text-white transition-all cursor-pointer font-bold"
                    >
                      {language === 'fr_ht' ? 'ANNULER' : 'CANCEL'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Dates & Reference */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">{t.adminBlogFieldDate}</label>
                      <input 
                        type="date"
                        value={blogForm.date}
                        onChange={(e) => setBlogForm(prev => ({ ...prev, date: e.target.value }))}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                        required
                      />
                    </div>

                    {/* Titles */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">{t.adminBlogFieldTitleHt}</label>
                      <input 
                        type="text"
                        value={blogForm.title_kreyol}
                        onChange={(e) => setBlogForm(prev => ({ ...prev, title_kreyol: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">{t.adminBlogFieldTitleEn}</label>
                      <input 
                        type="text"
                        value={blogForm.title_english}
                        onChange={(e) => setBlogForm(prev => ({ ...prev, title_english: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                        required
                      />
                    </div>

                    {/* Auto-Translate Controls */}
                    <div className="md:col-span-2">
                      <AdminBilingualTranslateBar
                        language={language}
                        direction={bilingualTranslateDirection}
                        onDirectionChange={setBilingualTranslateDirection}
                        onTranslate={handleAutoTranslate}
                        isTranslating={isTranslating}
                      />
                    </div>

                    {/* Contents */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">{t.adminBlogFieldContentHt}</label>
                      <textarea
                        rows={8}
                        value={blogForm.content_kreyol}
                        onChange={(e) => setBlogForm(prev => ({ ...prev, content_kreyol: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 leading-relaxed font-serif"
                        placeholder="Saisissez le contenu de la réflexion en français..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">{t.adminBlogFieldContentEn}</label>
                      <textarea
                        rows={8}
                        value={blogForm.content_english}
                        onChange={(e) => setBlogForm(prev => ({ ...prev, content_english: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 leading-relaxed font-serif"
                        placeholder="Enter the post content in English..."
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-850">
                    <button
                      type="button"
                      onClick={() => setEditingBlogPostId(null)}
                      className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 transition-all cursor-pointer"
                    >
                      {t.btnCancel}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>{t.adminBlogSaveBtn}</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Post List Display */
                <div className="rounded-2xl border border-slate-850 bg-slate-950/20 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-950/60 border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="px-5 py-4">{t.adminBlogColTitle}</th>
                          <th className="px-5 py-4">{t.adminBlogColDate}</th>
                          <th className="px-5 py-4 text-right">{language === 'fr_ht' ? 'Actions' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/40">
                        {blogPostsList.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-5 py-8 text-center text-slate-500">
                              {t.adminBlogEmpty}
                            </td>
                          </tr>
                        ) : (
                          blogPostsList.map((post) => (
                            <tr key={post.id} className="hover:bg-slate-950/20 transition-all">
                              <td className="px-5 py-4 text-slate-200 font-medium">
                                {language === 'fr_ht' ? post.title_kreyol : post.title_english}
                              </td>
                              <td className="px-5 py-4 text-slate-400 font-mono">
                                {post.date}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    onClick={() => handleStartEditBlog(post)}
                                    className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                                    title={t.btnEdit}
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBlog(post.id)}
                                    className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                                    title={t.btnDelete}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 14: MINISTRIES MANAGER */}
          {activeTab === 'ministries' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-500" />
                    <span>{language === 'en' ? 'Core Ministries Configuration' : 'Configuration des ministères'}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {language === 'en'
                      ? 'Configure images, descriptions, committee contacts, notifications, and signup lists for each ministry.'
                      : 'Configurez les images, les descriptions, les contacts des comités, les notifications et les listes d’inscription de chaque ministère.'}
                  </p>
                </div>
              </div>

              {/* Ministry Selector Tabs */}
              <div className="flex gap-2 border-b border-slate-850 pb-px">
                {['women', 'men', 'children', 'missions'].map((slug) => {
                  const label = slug === 'women' 
                    ? (language === 'en' ? "Women's Ministry" : "Ministère des femmes")
                    : slug === 'men'
                    ? (language === 'en' ? "Men's Ministry" : "Ministère des hommes")
                    : slug === 'children'
                    ? (language === 'en' ? "Children & Youth" : "Ministère des enfants et des jeunes")
                    : (language === 'en' ? 'Missions' : 'Missions');
                  return (
                    <button
                      key={slug}
                      onClick={() => setSelectedMinistrySlug(slug)}
                      type="button"
                      className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                        selectedMinistrySlug === slug
                          ? 'border-amber-500 text-amber-400 bg-slate-950/20'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <AdminBilingualTranslateBar
                language={language}
                direction={bilingualTranslateDirection}
                onDirectionChange={setBilingualTranslateDirection}
                onTranslate={handleTranslateMinistry}
                isTranslating={isBilingualTranslating}
              />

              {/* Form */}
              <form onSubmit={handleSaveMinistry} className="p-5 rounded-2xl bg-slate-950/30 border border-slate-850 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      {language === 'en' ? 'Ministry Title (English)' : 'Titre du ministère (anglais)'}
                    </label>
                    <input
                      type="text"
                      required
                      value={minForm.title_english}
                      onChange={(e) => setMinForm(prev => ({ ...prev, title_english: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      {language === 'en' ? 'Ministry Title (French)' : 'Titre du ministère (français)'}
                    </label>
                    <input
                      type="text"
                      required
                      value={minForm.title_kreyol}
                      onChange={(e) => setMinForm(prev => ({ ...prev, title_kreyol: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      {language === 'en' ? 'Description (English)' : 'Description (anglais)'}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={minForm.description_english}
                      onChange={(e) => setMinForm(prev => ({ ...prev, description_english: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 leading-relaxed font-serif"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      {language === 'en' ? 'Description (French)' : 'Description (français)'}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={minForm.description_kreyol}
                      onChange={(e) => setMinForm(prev => ({ ...prev, description_kreyol: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 leading-relaxed font-serif"
                    />
                  </div>
                </div>

                {/* Visual Image Dropzone / Clipboard Paste / File Browse */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400">
                    {language === 'en' ? 'Ministry Image' : 'Image du ministère'}
                  </label>
                  
                  <div 
                    onClick={() => document.getElementById('min-file-input')?.click()}
                    onPaste={handlePasteMin}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingMin(true); }}
                    onDragLeave={() => setIsDraggingMin(false)}
                    onDrop={handleDropMin}
                    className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all min-h-[120px] group overflow-hidden ${
                      isDraggingMin 
                        ? 'border-amber-500 bg-amber-500/10 scale-[1.01]' 
                        : 'border-slate-800 hover:border-amber-500/50 bg-slate-900/50 hover:bg-slate-900/85'
                    }`}
                  >
                    <input 
                      type="file" 
                      id="min-file-input" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleMinFile(e.target.files?.[0])} 
                    />
                    
                    {minForm.image_url ? (
                      <div className="flex items-center gap-4 z-10 w-full">
                        <div className="w-16 h-16 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden p-0.5 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-all">
                          <img src={minForm.image_url} alt="Ministry preview" className="w-full h-full object-cover rounded" />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-xs font-bold text-slate-200 block truncate">
                            {language === 'en' ? 'Ministry_Image.png' : 'Image_Ministère.png'}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {language === 'en' 
                              ? 'Click to change, drag another image, or copy-paste here' 
                              : 'Cliquez pour modifier, faites glisser une autre image ou collez-en une ici'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMinForm(prev => ({ ...prev, image_url: '' }));
                          }}
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:bg-rose-950 hover:border-rose-900 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title={language === 'en' ? 'Remove image' : 'Supprimer l’image'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-slate-400">
                        <UploadCloud className="w-7 h-7 group-hover:text-amber-400 transition-all animate-bounce" />
                        <span className="text-xs font-bold text-center">
                          {language === 'en' 
                            ? 'Browse, Drag, or Paste an Image' 
                            : 'Choisir, glisser ou coller une image'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {language === 'en' 
                            ? 'Supports PNG, JPG (Will be auto-compressed)'
                            : 'Formats PNG et JPG acceptés (compression automatique)'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2">
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                      {language === 'en' ? 'Direct URL Input (Required)' : 'URL directe de l’image (obligatoire)'}
                    </label>
                    <input 
                      type="text" 
                      required
                      value={minForm.image_url}
                      onChange={(e) => setMinForm(prev => ({ ...prev, image_url: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-[10px] text-slate-100 transition-all font-mono"
                      placeholder={language === 'en' ? "Or paste any image URL here..." : "Ou collez l’URL d’une image ici..."}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold uppercase text-slate-400">
                        {language === 'en' ? 'Bullet Points / Key Events (English)' : 'Événements et points clés (anglais)'}
                      </label>
                      <span className="text-[9px] text-slate-500 font-bold uppercase">{language === 'en' ? 'One per line' : 'Un par ligne'}</span>
                    </div>
                    <textarea
                      rows={6}
                      value={minForm.bullets_english}
                      onChange={(e) => setMinForm(prev => ({ ...prev, bullets_english: e.target.value }))}
                      placeholder={language === 'en' ? "Weekly Prayer Meeting\nMonthly Fellowship Brunch\nAnnual Retreat" : "Weekly Prayer Meeting\nMonthly Fellowship Brunch\nAnnual Retreat"}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold uppercase text-slate-400">
                        {language === 'en' ? 'Bullet Points / Key Events (French)' : 'Événements et points clés (français)'}
                      </label>
                      <span className="text-[9px] text-slate-500 font-bold uppercase">{language === 'en' ? 'One per line' : 'Un par ligne'}</span>
                    </div>
                    <textarea
                      rows={6}
                      value={minForm.bullets_kreyol}
                      onChange={(e) => setMinForm(prev => ({ ...prev, bullets_kreyol: e.target.value }))}
                      placeholder={language === 'en' ? "Réunion de prière hebdomadaire\nRepas fraternel mensuel\nRetraite annuelle" : "Réunion de prière hebdomadaire\nRepas fraternel mensuel\nRetraite annuelle"}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-850">
                  <h4 className="text-sm font-bold text-white mb-3">
                    {language === 'en' ? 'Committee Contact & Notifications' : 'Contact du comité et notifications'}
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                        {language === 'en' ? 'Contact Name' : 'Nom du contact'}
                      </label>
                      <input
                        type="text"
                        value={minForm.contact_name}
                        onChange={(e) => setMinForm(prev => ({ ...prev, contact_name: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                        {language === 'en' ? 'Contact Email' : 'Adresse courriel du contact'}
                      </label>
                      <input
                        type="email"
                        value={minForm.contact_email}
                        onChange={(e) => setMinForm(prev => ({ ...prev, contact_email: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                        {language === 'en' ? 'Contact Phone' : 'Téléphone du contact'}
                      </label>
                      <input
                        type="text"
                        value={minForm.contact_phone}
                        onChange={(e) => setMinForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-1 gap-4 mt-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                        {language === 'en' ? 'Notification Recipients' : 'Destinataires des notifications'}
                      </label>
                      <textarea
                        rows={3}
                        value={minForm.notification_emails}
                        onChange={(e) => setMinForm(prev => ({ ...prev, notification_emails: e.target.value }))}
                        placeholder={language === 'en' ? 'leader@church.org, committee@church.org' : 'responsable@eglise.org, comite@eglise.org'}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        {language === 'en' ? 'Comma or line-separated emails notified on each new signup.' : 'Adresses courriel séparées par des virgules ou des sauts de ligne, avisées à chaque nouvelle inscription.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-850">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>{language === 'en' ? 'Save Ministry Settings' : 'Enregistrer les paramètres du ministère'}</span>
                  </button>
                </div>
              </form>

              <div className="p-5 rounded-2xl bg-slate-950/30 border border-slate-850 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                      <span>{language === 'en' ? 'Ministry Signups' : 'Inscriptions au ministère'}</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {language === 'en'
                        ? 'Download an Excel-compatible spreadsheet you can open in Excel or Google Sheets.'
                        : 'Téléchargez un fichier compatible avec Excel ou Google Sheets.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => loadMinistrySignups(selectedMinistrySlug)}
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-xs font-bold text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingMinistrySignups ? 'animate-spin' : ''}`} />
                      <span>{language === 'en' ? 'Refresh' : 'Actualiser'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={exportingMinistrySignups}
                      onClick={handleExportMinistrySignupsSpreadsheet}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Download Spreadsheet (.xlsx)' : 'Télécharger la feuille de calcul (.xlsx)'}</span>
                    </button>
                  </div>
                </div>

                {loadingMinistrySignups ? (
                  <p className="text-xs text-slate-400">{language === 'en' ? 'Loading signups...' : 'Chargement des inscriptions...'}</p>
                ) : ministrySignups.length === 0 ? (
                  <p className="text-xs text-slate-500">{language === 'en' ? 'No signups yet for this ministry.' : 'Aucune inscription pour ce ministère pour le moment.'}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-850">
                          <th className="py-2 pr-3 font-bold uppercase">{language === 'en' ? 'Date' : 'Date'}</th>
                          <th className="py-2 pr-3 font-bold uppercase">{language === 'en' ? 'Name' : 'Non'}</th>
                          <th className="py-2 pr-3 font-bold uppercase">{language === 'en' ? 'Email' : 'Adresse courriel'}</th>
                          <th className="py-2 pr-3 font-bold uppercase">{language === 'en' ? 'Phone' : 'Téléphone'}</th>
                          {MINISTRY_SIGNUP_FIELDS[selectedMinistrySlug as MinistrySignupSlug]?.map((field) => (
                            <th key={field.key} className="py-2 pr-3 font-bold uppercase">{field.label_en}</th>
                          ))}
                          <th className="py-2 font-bold uppercase">{language === 'en' ? 'Actions' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ministrySignups.map((signup) => {
                          let responses: Record<string, string> = {};
                          try {
                            responses = JSON.parse(signup.responses || '{}');
                          } catch {
                            responses = {};
                          }
                          return (
                            <tr key={signup.id} className="border-b border-slate-900/80 text-slate-200">
                              <td className="py-2 pr-3 whitespace-nowrap">{new Date(signup.created_at).toLocaleString()}</td>
                              <td className="py-2 pr-3">{signup.name}</td>
                              <td className="py-2 pr-3">{signup.email}</td>
                              <td className="py-2 pr-3">{signup.phone || '—'}</td>
                              {MINISTRY_SIGNUP_FIELDS[selectedMinistrySlug as MinistrySignupSlug]?.map((field) => (
                                <td key={field.key} className="py-2 pr-3 max-w-[180px] truncate" title={responses[field.key] || ''}>
                                  {responses[field.key] || '—'}
                                </td>
                              ))}
                              <td className="py-2">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMinistrySignup(signup.id)}
                                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:bg-rose-950 hover:border-rose-900 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                  title={language === 'en' ? 'Delete signup' : 'Supprimer enskripsyon'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </section>

      </main>
    </div>
  );
}
