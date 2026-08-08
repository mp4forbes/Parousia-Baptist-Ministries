/** Trigger a browser download for a site asset, with optional fallback URL. */
export async function downloadAssetFile(
  primaryUrl: string,
  fallbackUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const tryDownload = async (url: string): Promise<boolean> => {
    const downloadUrl = url.startsWith('/api/assets/')
      ? `${url}${url.includes('?') ? '&' : '?'}download=1`
      : url;

    const response = await fetch(downloadUrl);
    if (!response.ok) return false;

    const blob = await response.blob();
    const filename =
      decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'download') || 'download';
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
    return true;
  };

  if (await tryDownload(primaryUrl)) {
    return { success: true };
  }

  if (fallbackUrl && fallbackUrl !== primaryUrl && (await tryDownload(fallbackUrl))) {
    return { success: true };
  }

  return {
    success: false,
    error: 'The devotional file is not available right now. Please contact the church office.',
  };
}
