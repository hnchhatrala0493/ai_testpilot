const { MasterData, allowedMasterDataTypes } = require("../models/masterData.model");
const { Role } = require("../models/role.model");
const { scopedFilter, withCompany } = require("../utils/companyScope");

const labels = {
  "project-category": "Project Category",
  "assignment-group": "Assignment Group",
  designation: "Designation",
  department: "Department",
};

const defaultMasterData = {
  "project-category": [
    { name: "Web Application", code: "web-application", description: "Browser-based applications" },
    { name: "Mobile Application", code: "mobile-application", description: "Android/iOS applications" },
    { name: "Desktop Application", code: "desktop-application", description: "Windows, Mac, Linux software" },
    { name: "API Service", code: "api-service", description: "REST, GraphQL, SOAP APIs" },
    { name: "Microservices", code: "microservices", description: "Distributed microservice architecture" },
    { name: "E-commerce", code: "e-commerce", description: "Online shopping platforms" },
    { name: "Banking & Finance", code: "banking-finance", description: "Banking, payments, fintech systems" },
    { name: "Insurance", code: "insurance", description: "Insurance-related applications" },
    { name: "Healthcare", code: "healthcare", description: "Medical and healthcare systems" },
    { name: "ERP System", code: "erp-system", description: "Enterprise Resource Planning solutions" },
    { name: "CRM System", code: "crm-system", description: "Customer Relationship Management systems" },
    { name: "HRMS", code: "hrms", description: "Human Resource Management systems" },
    { name: "ITSM", code: "itsm", description: "IT Service Management applications" },
    { name: "SaaS Platform", code: "saas-platform", description: "Software as a Service products" },
    { name: "Data Warehouse", code: "data-warehouse", description: "Data and analytics platforms" },
    { name: "AI/ML Application", code: "ai-ml-application", description: "AI and machine learning solutions" },
    { name: "IoT Application", code: "iot-application", description: "Internet of Things projects" },
    { name: "Cybersecurity", code: "cybersecurity", description: "Security and compliance systems" },
    { name: "Government Portal", code: "government-portal", description: "Government and public service portals" },
    { name: "Education Platform", code: "education-platform", description: "LMS and e-learning systems" },
    { name: "Internal Tool", code: "internal-tool", description: "Internal company applications" },
    { name: "Middleware", code: "middleware", description: "Integration and middleware solutions" },
    { name: "Legacy Application", code: "legacy-application", description: "Existing legacy systems" },
    { name: "Cloud Platform", code: "cloud-platform", description: "Cloud-native applications" },
    { name: "DevOps Platform", code: "devops-platform", description: "CI/CD and DevOps tools" },
  ],
  department: [
    { name: "Development Teams", code: "development-teams", description: "Software engineering and development teams" },
    { name: "Testing Teams", code: "testing-teams", description: "Quality assurance and testing teams" },
    { name: "Operations Teams", code: "operations-teams", description: "Release, infrastructure, and production operations" },
    { name: "Application Support", code: "application-support", description: "Application and technical support teams" },
    { name: "Project Management", code: "project-management", description: "Project, product, and business delivery teams" },
    { name: "Database & Integration", code: "database-integration", description: "Database, middleware, and integration teams" },
    { name: "Security & Compliance", code: "security-compliance", description: "Security, compliance, and risk teams" },
    { name: "AI & Innovation", code: "ai-innovation", description: "AI engineering, automation, and innovation teams" },
  ],
  designation: [
    { name: "Frontend Development Team", code: "frontend-development-team", parentCode: "development-teams" },
    { name: "Backend Development Team", code: "backend-development-team", parentCode: "development-teams" },
    { name: "Full Stack Development Team", code: "full-stack-development-team", parentCode: "development-teams" },
    { name: "Mobile Development Team", code: "mobile-development-team", parentCode: "development-teams" },
    { name: "API Development Team", code: "api-development-team", parentCode: "development-teams" },
    { name: "Integration Team", code: "integration-team", parentCode: "development-teams" },
    { name: "QA Team", code: "qa-team", parentCode: "testing-teams" },
    { name: "Manual Testing Team", code: "manual-testing-team", parentCode: "testing-teams" },
    { name: "Automation Testing Team", code: "automation-testing-team", parentCode: "testing-teams" },
    { name: "Performance Testing Team", code: "performance-testing-team", parentCode: "testing-teams" },
    { name: "Security Testing Team", code: "security-testing-team", parentCode: "testing-teams" },
    { name: "AI Testing Team", code: "ai-testing-team", parentCode: "testing-teams" },
    { name: "UAT Support Team", code: "uat-support-team", parentCode: "testing-teams" },
    { name: "DevOps Team", code: "devops-team", parentCode: "operations-teams" },
    { name: "Release Management Team", code: "release-management-team", parentCode: "operations-teams" },
    { name: "Production Support Team", code: "production-support-team", parentCode: "operations-teams" },
    { name: "Infrastructure Team", code: "infrastructure-team", parentCode: "operations-teams" },
    { name: "Cloud Operations Team", code: "cloud-operations-team", parentCode: "operations-teams" },
    { name: "Level 1 Support (L1)", code: "level-1-support-l1", parentCode: "application-support" },
    { name: "Level 2 Support (L2)", code: "level-2-support-l2", parentCode: "application-support" },
    { name: "Level 3 Support (L3)", code: "level-3-support-l3", parentCode: "application-support" },
    { name: "Application Support Team", code: "application-support-team", parentCode: "application-support" },
    { name: "Technical Support Team", code: "technical-support-team", parentCode: "application-support" },
    { name: "Project Management Office (PMO)", code: "project-management-office-pmo", parentCode: "project-management" },
    { name: "Business Analysis Team", code: "business-analysis-team", parentCode: "project-management" },
    { name: "Product Management Team", code: "product-management-team", parentCode: "project-management" },
    { name: "Scrum Team", code: "scrum-team", parentCode: "project-management" },
    { name: "Database Administration Team", code: "database-administration-team", parentCode: "database-integration" },
    { name: "Middleware Team", code: "middleware-team", parentCode: "database-integration" },
    { name: "Integration Support Team", code: "integration-support-team", parentCode: "database-integration" },
    { name: "Cyber Security Team", code: "cyber-security-team", parentCode: "security-compliance" },
    { name: "Compliance Team", code: "compliance-team", parentCode: "security-compliance" },
    { name: "Risk Management Team", code: "risk-management-team", parentCode: "security-compliance" },
    { name: "AI Engineering Team", code: "ai-engineering-team", parentCode: "ai-innovation" },
    { name: "AI Automation Team", code: "ai-automation-team", parentCode: "ai-innovation" },
    { name: "AI Bug Analysis Team", code: "ai-bug-analysis-team", parentCode: "ai-innovation" },
  ],
};

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeRolePayload(body, existing = {}) {
  const label = body.label || body.name;
  const key = body.key || slugify(label).replace(/-/g, "_");

  return {
    key,
    label,
    permissions: Array.isArray(body.permissions) ? body.permissions : existing.permissions || [],
    isSystem: body.isSystem === true || existing.isSystem === true,
  };
}

function normalizeMasterDataPayload(type, body) {
  const name = body.name || body.label;
  const code = body.code || slugify(name);

  return {
    type,
    name,
    code,
    description: body.description || "",
    parentType: body.parentType || (type === "designation" ? "department" : ""),
    parentCode: body.parentCode || "",
    isActive: body.isActive !== false,
  };
}

function assertType(type) {
  if (!allowedMasterDataTypes.includes(type)) {
    const error = new Error("Invalid master data type");
    error.status = 400;
    throw error;
  }
}

async function ensureDefaultMasterData(type, user) {
  if (type === "designation") {
    await ensureDefaultMasterData("department", user);
  }

  const defaults = defaultMasterData[type] || [];
  if (!defaults.length) return;

  await Promise.all(
    defaults.map((item) =>
      MasterData.findOneAndUpdate(
        scopedFilter(user, { type, code: item.code }),
        withCompany({ ...item, type, parentType: item.parentCode ? "department" : item.parentType || "", isActive: true }, user),
        { new: true, upsert: true, setDefaultsOnInsert: true },
      ),
    ),
  );
}

exports.getMasterDataTypes = async (req, res) => {
  res.status(200).json({
    result: allowedMasterDataTypes.map((type) => ({
      type,
      label: labels[type] || type,
    })),
  });
};

exports.listMasterData = async (req, res) => {
  try {
    const { type } = req.params;
    assertType(type);
    await ensureDefaultMasterData(type, req.user);

    const filter = scopedFilter(req.user, { type });
    if (req.query.parentCode) {
      filter.parentCode = req.query.parentCode;
    }

    const result = await MasterData.find(filter).sort({ parentCode: 1, name: 1 });
    res.status(200).json({ result });
  } catch (error) {
    res.status(error.status || 400).json({ message: error.message });
  }
};

exports.createMasterData = async (req, res) => {
  try {
    const { type } = req.params;
    assertType(type);

    const payload = normalizeMasterDataPayload(type, req.body);
    if (!payload.name || !payload.code) {
      return res.status(400).json({ message: "Name and code are required" });
    }

    const result = await MasterData.create(withCompany(payload, req.user));
    res.status(201).json({ result, message: `${labels[type]} created successfully` });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateMasterData = async (req, res) => {
  try {
    const { type, id } = req.params;
    assertType(type);

    const payload = normalizeMasterDataPayload(type, req.body);
    if (!payload.name || !payload.code) {
      return res.status(400).json({ message: "Name and code are required" });
    }

    const result = await MasterData.findOneAndUpdate(
      scopedFilter(req.user, { _id: id, type }),
      withCompany(payload, req.user),
      { new: true, runValidators: true },
    );

    if (!result) return res.status(404).json({ message: `${labels[type]} not found` });
    res.status(200).json({ result, message: `${labels[type]} updated successfully` });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteMasterData = async (req, res) => {
  try {
    const { type, id } = req.params;
    assertType(type);

    const result = await MasterData.findOneAndDelete(scopedFilter(req.user, { _id: id, type }));
    if (!result) return res.status(404).json({ message: `${labels[type]} not found` });
    res.status(200).json({ message: `${labels[type]} deleted successfully` });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.listRoles = async (req, res) => {
  try {
    const result = await Role.find(scopedFilter(req.user)).sort({ createdAt: 1 });
    res.status(200).json({ result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.createRole = async (req, res) => {
  try {
    const payload = normalizeRolePayload(req.body);
    if (!payload.key || !payload.label) {
      return res.status(400).json({ message: "Role key and label are required" });
    }

    const result = await Role.create(withCompany(payload, req.user));
    res.status(201).json({ result, message: "Role created successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const existing = await Role.findOne(scopedFilter(req.user, { _id: req.params.id }));
    if (!existing) return res.status(404).json({ message: "Role not found" });

    const payload = normalizeRolePayload(req.body, existing);
    if (!payload.key || !payload.label) {
      return res.status(400).json({ message: "Role key and label are required" });
    }

    const result = await Role.findOneAndUpdate(scopedFilter(req.user, { _id: existing.id }), withCompany(payload, req.user), {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ result, message: "Role updated successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const result = await Role.findOneAndDelete(scopedFilter(req.user, { _id: req.params.id }));
    if (!result) return res.status(404).json({ message: "Role not found" });
    res.status(200).json({ message: "Role deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
