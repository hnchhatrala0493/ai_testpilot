const TARGET_PATHS = [
  { key: "packageJson", label: "package.json", type: "file", match: (path) => /(^|\/)package\.json$/i.test(path) },
  { key: "routes", label: "routes folder", type: "directory", match: (path) => /(^|\/)routes(\/|$)/i.test(path) },
  { key: "controllers", label: "controllers folder", type: "directory", match: (path) => /(^|\/)controllers(\/|$)/i.test(path) },
  { key: "api", label: "api folder", type: "directory", match: (path) => /(^|\/)api(\/|$)/i.test(path) },
  {
    key: "openapi",
    label: "swagger/openapi file",
    type: "file",
    match: (path) => /(^|\/)(swagger|openapi)\.(json|ya?ml)$/i.test(path) || /(^|\/)swagger\/.+\.(json|ya?ml)$/i.test(path),
  },
  { key: "pages", label: "src/pages", type: "directory", match: (path) => /(^|\/)src\/pages(\/|$)/i.test(path) },
  { key: "components", label: "src/components", type: "directory", match: (path) => /(^|\/)src\/components(\/|$)/i.test(path) },
  { key: "envExample", label: "env.example", type: "file", match: (path) => /(^|\/)(\.env\.example|env\.example)$/i.test(path) },
  { key: "readme", label: "README.md", type: "file", match: (path) => /^readme\.md$/i.test(path) },
];

const MAX_FILES_PER_GROUP = 30;
const MAX_FILE_BYTES = 60 * 1024;
const ROUTE_METHODS = ["get", "post", "put", "patch", "delete", "use"];

function parseGitHubUrl(rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!value) return null;

  const shorthand = value.match(/^([\w.-]+)\/([\w.-]+)$/);
  if (shorthand) {
    return { owner: shorthand[1], repo: shorthand[2].replace(/\.git$/, "") };
  }

  const ssh = value.match(/^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/i);
  if (ssh) {
    return { owner: ssh[1], repo: ssh[2].replace(/\.git$/, "") };
  }

  try {
    const url = new URL(value);
    if (!/github\.com$/i.test(url.hostname)) return null;
    const [owner, repo] = url.pathname.replace(/^\/|\/$/g, "").split("/");
    if (!owner || !repo) return null;
    return { owner, repo: repo.replace(/\.git$/, "") };
  } catch (_error) {
    return null;
  }
}

function getGitHubHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ai-testpilot-repository-reader",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function githubRequest(url) {
  const response = await fetch(url, { headers: getGitHubHeaders() });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = body.message || `GitHub request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return body;
}

function groupTreeEntries(tree) {
  const groups = TARGET_PATHS.map((target) => ({
    ...target,
    found: false,
    files: [],
  }));

  tree
    .filter((entry) => entry.path && entry.type === "blob")
    .forEach((entry) => {
      groups.forEach((group) => {
        if (group.files.length >= MAX_FILES_PER_GROUP) return;
        if (group.match(entry.path)) {
          group.found = true;
          group.files.push({
            path: entry.path,
            sha: entry.sha,
            size: entry.size || 0,
            url: entry.url,
          });
        }
      });
    });

  tree
    .filter((entry) => entry.path && entry.type === "tree")
    .forEach((entry) => {
      groups.forEach((group) => {
        if (group.type === "directory" && group.match(entry.path)) {
          group.found = true;
        }
      });
    });

  return groups;
}

async function readFileContent(owner, repo, branch, file) {
  if (!file.sha || file.size > MAX_FILE_BYTES) {
    return {
      ...file,
      skipped: true,
      reason: file.size > MAX_FILE_BYTES ? `File is larger than ${MAX_FILE_BYTES} bytes` : "Missing blob SHA",
    };
  }

  const blob = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/git/blobs/${file.sha}`);
  const content = blob.encoding === "base64" ? Buffer.from(blob.content || "", "base64").toString("utf8") : "";

  return {
    ...file,
    branch,
    content,
    lines: content ? content.split(/\r?\n/).length : 0,
  };
}

function normalizeRoutePath(routePath) {
  const value = String(routePath || "").trim();
  if (!value) return "/";
  return value.startsWith("/") ? value : `/${value}`;
}

function extractRoutesFromContent(file) {
  if (!file.content || file.skipped) return [];

  const routes = [];
  const routePattern = /\b(?:router|app)\.(get|post|put|patch|delete|use)\s*\(\s*["'`]([^"'`]+)["'`]/gi;
  let match = routePattern.exec(file.content);

  while (match) {
    routes.push({
      method: match[1].toUpperCase(),
      path: normalizeRoutePath(match[2]),
      file: file.path,
    });
    match = routePattern.exec(file.content);
  }

  const routeImportPattern = /\bapp\.use\s*\(\s*["'`]([^"'`]+)["'`]\s*,\s*require\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/gi;
  match = routeImportPattern.exec(file.content);

  while (match) {
    routes.push({
      method: "USE",
      path: normalizeRoutePath(match[1]),
      file: file.path,
      mountedFrom: match[2],
    });
    match = routeImportPattern.exec(file.content);
  }

  return routes;
}

function buildRouteInventory(groups) {
  const routeFiles = groups
    .filter((group) => ["routes", "api"].includes(group.key))
    .flatMap((group) => group.files || [])
    .filter((file) => /\.(js|jsx|ts|tsx|mjs|cjs)$/i.test(file.path));

  const routes = routeFiles
    .flatMap(extractRoutesFromContent)
    .filter((route) => ROUTE_METHODS.includes(route.method.toLowerCase()));

  const uniqueRoutes = Array.from(
    new Map(routes.map((route) => [`${route.method}:${route.path}:${route.file}`, route])).values(),
  );

  return {
    routes: uniqueRoutes,
    count: uniqueRoutes.length,
    files: Array.from(new Set(routeFiles.map((file) => file.path))),
  };
}

async function buildRepositoryContext(githubUrl) {
  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed) {
    const error = new Error("Project does not have a valid GitHub repository URL.");
    error.status = 400;
    throw error;
  }

  const repo = await githubRequest(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`);
  const branch = repo.default_branch || "main";
  const tree = await githubRequest(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
  const groups = groupTreeEntries(tree.tree || []);

  const groupsWithContent = await Promise.all(
    groups.map(async (group) => ({
      key: group.key,
      label: group.label,
      found: group.found,
      files: await Promise.all(group.files.map((file) => readFileContent(parsed.owner, parsed.repo, branch, file))),
    })),
  );
  const routeInventory = buildRouteInventory(groupsWithContent);

  return {
    repository: {
      owner: parsed.owner,
      name: parsed.repo,
      fullName: repo.full_name,
      defaultBranch: branch,
      url: repo.html_url,
      private: repo.private,
    },
    requested: TARGET_PATHS.map(({ key, label }) => ({ key, label })),
    groups: groupsWithContent,
    routeInventory,
    summary: {
      foundGroups: groupsWithContent.filter((group) => group.found).length,
      totalGroups: TARGET_PATHS.length,
      filesRead: groupsWithContent.reduce((total, group) => total + group.files.filter((file) => !file.skipped).length, 0),
      filesMatched: groupsWithContent.reduce((total, group) => total + group.files.length, 0),
      apiRoutes: routeInventory.count,
      truncatedGroups: groupsWithContent
        .filter((group) => group.files.length >= MAX_FILES_PER_GROUP)
        .map((group) => group.key),
    },
  };
}

module.exports = {
  TARGET_PATHS,
  buildRepositoryContext,
  parseGitHubUrl,
};
