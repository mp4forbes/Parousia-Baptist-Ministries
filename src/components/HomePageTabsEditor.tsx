'use client';

import React, { useState } from 'react';
import {
  Church,
  BookOpen,
  Users,
  Heart,
  Trash2,
  Plus,
  Save,
  UploadCloud,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { translateAdminTextsAction, updateHomePageTabsSettings } from '@/lib/actions';
import AdminBilingualTranslateBar from '@/components/AdminBilingualTranslateBar';
import {
  applyTranslatedFields,
  prepareBilingualTranslation,
  type BilingualTextField,
  type TranslateDirection,
} from '@/lib/admin-translate';
import { flattenTeamMembers, parseTeamDepartments, type TeamDepartment, type TeamMember } from '@/lib/team-departments';

type TeamMemberKey = `${number}-${number}`;

async function clientUploadAsset(fileName: string, dataOrFile: string | File): Promise<{ success: boolean; url?: string; error?: string }> {
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

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || `Server responded with ${res.status}` };
    }

    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error occurred' };
  }
}

export interface HomePageTabsEditorProps {
  initialSettings: Record<string, string>;
  variant?: 'admin' | 'coordinator';
  onNotify?: (message: string, type: 'success' | 'error') => void;
  showHeader?: boolean;
}

function compressAndResizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number,
  callback: (base64: string) => void
) {
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
      const isPNG = file.type === 'image/png' || file.name.endsWith('.png');
      const format = isPNG ? 'image/png' : 'image/jpeg';
      const compressedB64 = canvas.toDataURL(format, isPNG ? undefined : quality);
      callback(compressedB64);
    };
    img.src = event.target?.result as string;
  };
  reader.readAsDataURL(file);
}

export default function HomePageTabsEditor({
  initialSettings: settings,
  variant = 'admin',
  onNotify,
  showHeader = true,
}: HomePageTabsEditorProps) {
  const { language } = useLanguage();
  const isCoordinator = variant === 'coordinator';

  const notify = (message: string, type: 'success' | 'error') => {
    onNotify?.(message, type);
  };

  const [bilingualTranslateDirection, setBilingualTranslateDirection] = useState<TranslateDirection>('auto');
  const [isBilingualTranslating, setIsBilingualTranslating] = useState(false);

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
      notify(
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
      notify(
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
    const prepared = prepareBilingualTranslation(fields, bilingualTranslateDirection, language);

    if (!prepared.payload && !prepared.clearedOnly) {
      notify(
        language === 'fr_ht'
          ? 'Veuillez saisir du texte dans la langue source avant de lancer la traduction.'
          : 'Please enter source-language text before translating.',
        'error'
      );
      return;
    }

    if (!prepared.payload && prepared.clearedOnly) {
      onApply(prepared.fields);
      notify(
        language === 'fr_ht' ? 'Champs cible effacés.' : 'Target language fields cleared.',
        'success'
      );
      return;
    }

    const payload = prepared.payload!;

    setIsBilingualTranslating(true);
    notify(
      language === 'fr_ht' ? 'Traduction intelligente en cours...' : 'Smart translation in progress...',
      'success'
    );

    try {
      const res = await translateAdminTextsAction(
        payload.items,
        payload.fromLang,
        contextLabel,
        isCoordinator ? 'home_tabs' : undefined
      );
      if (res.success && res.translations) {
        onApply(applyTranslatedFields(prepared.fields, res.translations, payload.fromLang));
        notify(
          language === 'fr_ht' ? 'Traduction terminée avec succès !' : 'Translation completed successfully!',
          'success'
        );
      } else {
        notify(res.error || (language === 'fr_ht' ? 'Échec de la traduction.' : 'Translation failed.'), 'error');
      }
    } catch (err: any) {
      notify(err.message || (language === 'fr_ht' ? 'Une erreur est survenue pendant la traduction.' : 'An error occurred during translation.'), 'error');
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
        notify(language === 'fr_ht' ? 'Téléversement de l’image « Qui sommes-nous »...' : 'Uploading "About Us" image...', 'success');
        const res = await clientUploadAsset('home_about_us_bg.jpg', aboutUsImageUrl);
        if (res.success && res.url) {
          finalAboutUsImg = res.url;
          setAboutUsImageUrl(res.url);
        } else {
          notify(res.error || 'Failed to upload "About Us" image', 'error');
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
            notify(
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
              notify(res.error || `Failed to upload photo for ${member.name || 'leader ' + uploadCounter}`, 'error');
              return;
            }
          }
        }
      }
      setTeamDepartments(updatedTeamDepartments);
      const updatedTeamMembers = flattenTeamMembers(updatedTeamDepartments);

      let finalExpectImg = expectImageUrl;
      if (expectImageUrl && expectImageUrl.startsWith('data:')) {
        notify(language === 'fr_ht' ? 'Téléversement de l’image « À quoi vous attendre »...' : 'Uploading "What to Expect" image...', 'success');
        const res = await clientUploadAsset('home_expect_bg.jpg', expectImageUrl);
        if (res.success && res.url) {
          finalExpectImg = res.url;
          setExpectImageUrl(res.url);
        } else {
          notify(res.error || 'Failed to upload "What to Expect" image', 'error');
          return;
        }
      }

      notify(language === 'fr_ht' ? 'Enregistrement des modifications...' : 'Saving changes...', 'success');

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

      const res = await updateHomePageTabsSettings(settingsMap);
      if (res.success) {
        notify(language === 'fr_ht' ? 'Onglets de la page d’accueil configurés avec succès !' : 'Home tabs configured successfully!', 'success');
      } else {
        notify(res.error || 'Failed to save configuration', 'error');
      }
    } catch (err: any) {
      console.error(err);
      notify(err.message || 'An error occurred while saving', 'error');
    }
  };

  const formId = variant === 'admin' ? 'admin-active-form' : 'home-page-tabs-form';

  return (
            <div className="space-y-8">
              {showHeader && (
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
              )}

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

              <form id={formId} onSubmit={handleHomeTabsSubmit} className="space-y-6">
                
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
                      <label className="block text-[10px] font-bold uppercase text-slate-400">Background Image / Image d&apos;arrière-plan</label>
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
                      <h5 className="text-xs font-bold text-amber-400/80 uppercase">Croyance 1 / Belief 1</h5>
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
                      <h5 className="text-xs font-bold text-amber-400/80 uppercase">Croyance 2 / Belief 2</h5>
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
                      <h5 className="text-xs font-bold text-amber-400/80 uppercase">Croyance 3 / Belief 3</h5>
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
                      <h5 className="text-xs font-bold text-amber-400/80 uppercase">Croyance 4 / Belief 4</h5>
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
                                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Name / Nom</label>
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
                                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Photo (400x400)</label>
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
                      <label className="block text-[10px] font-bold uppercase text-slate-400">Section Image / Image de section</label>
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
  );
}
