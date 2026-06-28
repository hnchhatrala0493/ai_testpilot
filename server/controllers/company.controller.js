const { Company } = require("../models/company.model");
const { isMainAdministrator } = require("../utils/companyScope");

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCompanyPayload(body, user) {
  return {
    name: body.name,
    code: body.code || slugify(body.name),
    email: body.email,
    phone: body.phone,
    website: body.website,
    logo: body.logo || body.logoUrl,
    logoUrl: body.logoUrl || body.logo,
    size: body.size,
    industry: body.industry,
    country: body.country,
    state: body.state,
    city: body.city,
    address: body.address,
    status: body.status || "active",
    createdBy: body.createdBy || user?._id,
  };
}

function assertMainAdministrator(req, res) {
  if (!isMainAdministrator(req.user) || req.user.companyId) {
    res.status(403).json({ message: "Only the main administrator can manage companies" });
    return false;
  }

  return true;
}

exports.createCompany = async (req, res) => {
  try {
    if (!assertMainAdministrator(req, res)) return;

    const payload = normalizeCompanyPayload(req.body, req.user);
    if (!payload.name || !payload.code) {
      return res.status(400).json({ message: "Company name and code are required" });
    }

    const company = await Company.create(payload);
    res.status(201).json({ result: company, message: "Company created successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getCompanies = async (req, res) => {
  try {
    if (!assertMainAdministrator(req, res)) return;

    const companies = await Company.find().sort({ createdAt: -1 });
    res.status(200).json({ result: companies });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    if (!assertMainAdministrator(req, res)) return;

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      normalizeCompanyPayload(req.body, req.user),
      { new: true, runValidators: true },
    );
    if (!company) return res.status(404).json({ message: "Company not found" });
    res.status(200).json({ result: company, message: "Company updated successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    if (!assertMainAdministrator(req, res)) return;

    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    res.status(200).json({ message: "Company deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
