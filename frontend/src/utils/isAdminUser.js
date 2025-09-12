const ADMIN_ID = Number(import.meta.env.VITE_ADMIN_ID || NaN);

export function isAdminUser(user) {
  if (!user) return false;
  if (!Number.isNaN(ADMIN_ID) && Number(user.id) === ADMIN_ID) return true;
  return String(user.username || '').toLowerCase() === 'admin';
}
