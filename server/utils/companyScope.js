function isMainAdministrator(user = {}) {
  return ["super_admin", "admin"].includes(user.role);
}

function getCompanyId(user = {}) {
  return user.companyId?._id || user.companyId || null;
}

function scopedFilter(user = {}, baseFilter = {}) {
  if (isMainAdministrator(user) && !getCompanyId(user)) {
    return baseFilter;
  }

  const companyId = getCompanyId(user);
  return companyId ? { ...baseFilter, companyId } : baseFilter;
}

function withCompany(payload = {}, user = {}) {
  const companyId = payload.companyId || getCompanyId(user);
  return companyId ? { ...payload, companyId } : payload;
}

module.exports = {
  getCompanyId,
  isMainAdministrator,
  scopedFilter,
  withCompany,
};
