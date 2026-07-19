const MEDIA_BASE_URL = (import.meta.env.VITE_MEDIA_BASE_URL ?? "").replace(
  /\/$/,
  "",
);

export function getMediaUrl(source: string): string {
  if (/^(https?:|blob:|data:)/.test(source)) {
    return source;
  }

  const normalizedSource = source.startsWith("/") ? source : `/${source}`;
  return `${MEDIA_BASE_URL}${normalizedSource}`;
}
