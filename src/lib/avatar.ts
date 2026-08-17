/**
 * Avatar URL sanitation and streaming helper.
 *
 * Replaces heavy inline base64 data URIs with lightweight cacheable endpoint URLs (`/api/avatar/[userId]`)
 * in directory listings and search APIs, shrinking payload sizes from megabytes to kilobytes.
 */

export function sanitizeAvatarUrl(
  avatarUrl: string | null | undefined,
  userId: string,
  version?: string | number | Date | null
): string | null {
  if (!avatarUrl) return null;

  // External URLs (e.g. Google, Cloudinary, S3, Dicebear) and preset icon names stay as-is
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }

  // Already a relative API URL
  if (avatarUrl.startsWith('/api/avatar/')) {
    return avatarUrl;
  }

  // Preset icon names (e.g. 'developer', 'hacker', 'designer')
  if (!avatarUrl.startsWith('data:image/')) {
    return avatarUrl;
  }

  // Heavy inline base64 image -> convert to lightweight cacheable endpoint URL with cache-busting version
  let vParam = '';
  if (version) {
    const v = version instanceof Date ? version.getTime() : version;
    vParam = `?v=${encodeURIComponent(String(v))}`;
  } else {
    // Deterministic hash based on avatar content to ensure instant browser cache busting when photo changes
    const sample = avatarUrl.slice(30, 70);
    let hash = 0;
    for (let i = 0; i < sample.length; i++) {
      hash = (hash << 5) - hash + sample.charCodeAt(i);
      hash |= 0;
    }
    vParam = `?v=${Math.abs(hash).toString(36)}`;
  }

  return `/api/avatar/${userId}${vParam}`;
}

export function parseDataUri(dataUri: string): { mimeType: string; buffer: Buffer } | null {
  const match = dataUri.match(/^data:([^;]+);base64,([\s\S]*)$/);
  if (!match) return null;

  const mimeType = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  return { mimeType, buffer };
}
