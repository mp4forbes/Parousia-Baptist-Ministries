import { getSettings } from "@/lib/actions";
import DevotionalDownloadClient from "@/components/DevotionalDownloadClient";

// Disable route-level caching to fetch live settings from database
export const revalidate = 0;

export default async function FreeGiftPage() {
  const settings = await getSettings();

  return (
    <DevotionalDownloadClient settings={settings} />
  );
}
