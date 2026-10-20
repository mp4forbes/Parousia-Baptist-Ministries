export const HOME_PAGE_TABS_SETTING_KEYS = [
  'about_us_title_en',
  'about_us_title_ht',
  'about_us_p1_en',
  'about_us_p1_ht',
  'about_us_p2_en',
  'about_us_p2_ht',
  'about_us_image_url',
  'beliefs_title_en',
  'beliefs_title_ht',
  'belief_1_title_en',
  'belief_1_title_ht',
  'belief_1_desc_en',
  'belief_1_desc_ht',
  'belief_2_title_en',
  'belief_2_title_ht',
  'belief_2_desc_en',
  'belief_2_desc_ht',
  'belief_3_title_en',
  'belief_3_title_ht',
  'belief_3_desc_en',
  'belief_3_desc_ht',
  'belief_4_title_en',
  'belief_4_title_ht',
  'belief_4_desc_en',
  'belief_4_desc_ht',
  'team_title_en',
  'team_title_ht',
  'team_subtitle_en',
  'team_subtitle_ht',
  'team_departments_json',
  'team_members_json',
  'team_p1_name',
  'team_p1_role_en',
  'team_p1_role_ht',
  'team_p1_bio_en',
  'team_p1_bio_ht',
  'team_p1_image_url',
  'team_p1_email',
  'team_p2_name',
  'team_p2_role_en',
  'team_p2_role_ht',
  'team_p2_bio_en',
  'team_p2_bio_ht',
  'team_p2_image_url',
  'team_p2_email',
  'expect_title_en',
  'expect_title_ht',
  'expect_p1_en',
  'expect_p1_ht',
  'expect_image_url',
  'expect_bullet1_en',
  'expect_bullet1_ht',
  'expect_bullet2_en',
  'expect_bullet2_ht',
  'expect_bullet3_en',
  'expect_bullet3_ht',
] as const;

export type HomePageTabsSettingKey = (typeof HOME_PAGE_TABS_SETTING_KEYS)[number];

const HOME_PAGE_TABS_SETTING_KEY_SET = new Set<string>(HOME_PAGE_TABS_SETTING_KEYS);

export function pickHomePageTabsSettings(settingsMap: Record<string, string>): Record<string, string> {
  const picked: Record<string, string> = {};
  for (const key of HOME_PAGE_TABS_SETTING_KEYS) {
    if (key in settingsMap) {
      picked[key] = settingsMap[key];
    }
  }
  return picked;
}

export function isHomePageTabsSettingKey(key: string): boolean {
  return HOME_PAGE_TABS_SETTING_KEY_SET.has(key);
}
