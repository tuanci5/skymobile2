const ADMIN_ROLES = ['Quản trị'];
const MANAGER_MARKERS = ['Trưởng phòng', 'Trưởng nhóm'];
const HR_MARKERS = ['Hành chính - Nhân sự', 'Hành chính & Nhân sự'];

const normalizeRole = (role?: string | null) =>
  (role || '')
    .normalize('NFC')
    .replace(/[\u00A0\u200B-\u200D\uFEFF]/g, ' ')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

export const normalizeRoleForSearch = (role?: string | null) =>
  normalizeRole(role)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const getRoleGroupKey = (role?: string | null) => {
  const searchableRole = normalizeRoleForSearch(role);
  if (searchableRole.includes('hanh chinh nhan su')) return 'hr_staff';
  return searchableRole;
};

export const isSameRoleGroup = (left?: string | null, right?: string | null) =>
  !!left && !!right && getRoleGroupKey(left) === getRoleGroupKey(right);

export const isAdminRole = (role?: string | null) => ADMIN_ROLES.includes(normalizeRole(role));

export const isManagerRole = (role?: string | null) => {
  const normalizedRole = normalizeRole(role);
  return !!normalizedRole && MANAGER_MARKERS.some(marker => normalizedRole.includes(marker));
};

export const isHrRole = (role?: string | null) => {
  const normalizedRole = normalizeRole(role);
  return !!normalizedRole && (
    HR_MARKERS.some(marker => normalizedRole.includes(marker))
    || getRoleGroupKey(role) === 'hr_staff'
  );
};
