// Known repositories get an explicit category; anything new falls back to a
// best-effort inference from its public metadata.
const KNOWN_CATEGORIES = {
  'Uinxed-Kernel': 'Kernel',
  SpaceKernel: 'Kernel',
  Uinx: 'Language',
  PySpOS: 'System',
  ApexBIOS: 'System',
  Sim6502: 'System',
  'Uinxed-Agent': 'Tool',
  'Paizer-Open-source-instant-messenger': 'Tool',
  ModLoader: 'Tool',
  'GPT-2.0-Model-Training-Kit': 'Experimental',
  'uinxed-kernel-website': 'Web',
  web: 'Web',
};

const CATEGORY_RULES = [
  ['Kernel', ['kernel', 'microkernel', 'monolithic']],
  ['Language', ['compiler', 'programming language', 'llvm']],
  ['System', ['operating-system', 'operating system', ' os ', 'unix', 'bios', 'emulator', 'emulation', 'virtual-machine', 'runtime', 'driver', 'system']],
  ['Web', ['website', 'web', 'frontend', 'html', 'css']],
  ['Tool', ['tool', 'agent', 'cli', 'tui', 'loader', 'messenger']],
];

export const CATEGORIES = ['All', 'Kernel', 'Language', 'System', 'Tool', 'Web', 'Experimental'];

export const CATEGORY_LABELS = {
  All: '全部',
  Kernel: '内核',
  Language: '编程语言',
  System: '固件与模拟',
  Tool: '工具与应用',
  Web: 'Web',
  Experimental: '实验',
};

export function inferCategory(repo) {
  if (KNOWN_CATEGORIES[repo.name]) return KNOWN_CATEGORIES[repo.name];
  const haystack = ` ${(repo.name || '').toLowerCase()} ${(repo.description || '').toLowerCase()} ${(repo.language || '').toLowerCase()} ${(repo.topics || []).join(' ').toLowerCase()} `;
  for (const [category, needles] of CATEGORY_RULES) {
    if (needles.some((needle) => haystack.includes(needle))) return category;
  }
  return 'Experimental';
}

export function normalizeRepository(repo) {
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description || '此仓库暂未提供 GitHub Description。',
    language: repo.language || null,
    stars: Number(repo.stargazers_count || 0),
    forks: Number(repo.forks_count || 0),
    updatedAt: repo.updated_at,
    pushedAt: repo.pushed_at,
    topics: Array.isArray(repo.topics) ? repo.topics : [],
    license: repo.license?.spdx_id || repo.license?.name || null,
    archived: Boolean(repo.archived),
    disabled: Boolean(repo.disabled),
    url: repo.html_url,
    homepage: repo.homepage || null,
    defaultBranch: repo.default_branch,
    openIssues: Number(repo.open_issues_count || 0),
    category: inferCategory(repo),
  };
}

export function sortRepositories(repos) {
  return [...repos].sort((a, b) => {
    if (b.stars !== a.stars) return b.stars - a.stars;
    return new Date(b.pushedAt || b.updatedAt) - new Date(a.pushedAt || a.updatedAt);
  });
}

export function formatDate(dateValue) {
  if (!dateValue) return '—';
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateValue));
}

export function formatRelative(dateValue) {
  if (!dateValue) return '未知时间';
  const diff = new Date(dateValue).getTime() - Date.now();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' });
  if (abs < 60_000) return '刚刚';
  if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), 'minute');
  if (abs < 86_400_000) return rtf.format(Math.round(diff / 3_600_000), 'hour');
  if (abs < 30 * 86_400_000) return rtf.format(Math.round(diff / 86_400_000), 'day');
  return formatDate(dateValue);
}
