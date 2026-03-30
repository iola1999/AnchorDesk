export type SuperAdminLike = {
  isSuperAdmin?: boolean | null;
};

export function isSuperAdmin(user: SuperAdminLike | null | undefined) {
  return user?.isSuperAdmin === true;
}
