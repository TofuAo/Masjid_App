export const getAvailableRoles = (user) => {
  if (!user) return [];
  const rolesFromServer = Array.isArray(user.roles) && user.roles.length ? user.roles : [];
  const primary = user.role ? [user.role] : [];
  const combined = [...new Set([...rolesFromServer, ...primary])];
  return combined;
};

export const getEffectiveRole = (user) => {
  if (!user) return null;
  const roles = getAvailableRoles(user);
  if (user.activeRole && roles.includes(user.activeRole)) {
    return user.activeRole;
  }
  return roles[0] || user.role || null;
};

