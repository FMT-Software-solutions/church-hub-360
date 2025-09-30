/**
 * Utility function to get correct asset paths for both web and Electron environments
 * In Electron: Uses relative paths (./assets/...)
 * In Web: Uses absolute paths (/assets/...)
 */

/**
 * Check if we're running in an Electron environment
 */
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && window.electron !== undefined;
};

/**
 * Get the correct asset path based on the environment
 * @param assetPath - The asset path relative to the public directory (e.g., 'avatars/AV1.png')
 * @returns The correct path for the current environment
 */
export const getAssetPath = (assetPath: string): string => {
  // Remove leading slash if present
  const cleanPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
  
  if (isElectron()) {
    // In Electron, use relative paths
    return `./${cleanPath}`;
  } else {
    // In web, use absolute paths
    return `/${cleanPath}`;
  }
};

/**
 * Get the correct avatar path for the given avatar ID
 * @param avatarId - The avatar ID (e.g., '1', '43', etc.)
 * @returns The correct avatar path for the current environment
 */
export const getAvatarPath = (avatarId: string): string => {
  const cleanId = avatarId.replace('#', '');
  return getAssetPath(`avatars/AV${cleanId}.png`);
};

/**
 * Process an existing avatar URL to ensure it works in the current environment
 * @param avatarUrl - The existing avatar URL (could be absolute, relative, or external)
 * @returns The correct avatar URL for the current environment
 */
export const processAvatarUrl = (avatarUrl: string | null | undefined): string => {
  if (!avatarUrl) return '';
  
  // If it's an external URL (starts with http/https), return as-is
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }
  
  // If it's a local avatar path, ensure it's formatted correctly for the current environment
  if (avatarUrl.includes('/avatars/AV') && avatarUrl.includes('.png')) {
    // Extract the avatar ID from the path
    const match = avatarUrl.match(/AV(\d+)\.png/);
    if (match) {
      const avatarId = match[1];
      return getAvatarPath(avatarId);
    }
  }
  
  // For any other local paths, use getAssetPath
  if (avatarUrl.startsWith('/') || avatarUrl.startsWith('./')) {
    const cleanPath = avatarUrl.replace(/^(\.\/|\/)/g, '');
    return getAssetPath(cleanPath);
  }
  
  // If we can't determine the format, return as-is
  return avatarUrl;
};