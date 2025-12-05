/**
 * Get the avatar URL from user data
 * @param {Object} user - User object with avatar property
 * @returns {string|null} - Avatar URL or null if no avatar
 */
export function getAvatarUrl(user) {
  if (!user || !user.avatar || user.avatar === 'user') {
    return null
  }

  let avatar = user.avatar

  // If it's already a full URL, return it with cache-busting
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar.includes('?t=') ? avatar : `${avatar}?t=${Date.now()}`
  }

  // If it's a relative path, construct full URL
  if (avatar.startsWith('/api/files/avatars/')) {
    return `http://localhost:5000${avatar}?t=${Date.now()}`
  }

  // If it's just a filename, construct full URL
  if (avatar.includes('.')) {
    return `http://localhost:5000/api/files/avatars/${avatar}?t=${Date.now()}`
  }

  return null
}

