const CATEGORY_RULES = [
  ['Kernel', ['kernel', 'microkernel', 'monolithic']],
  ['Operating System', ['operating-system', 'operating system', ' os ', 'unix', 'hobby-os']],
  ['System', ['bios', 'emulator', 'emulation', 'virtual-machine', 'runtime', 'driver', 'system']],
  ['Web', ['website', 'web', 'frontend', 'html', 'css']],
  ['Tool', ['tool', 'agent', 'cli', 'tui', 'loader', 'training', 'messenger']],
  ['Experimental', ['experimental', 'research', 'prototype']],
];

export const CATEGORIES = ['All', 'Operating System', 'Kernel', 'System', 'Tool', 'Web', 'Experimental'];

export function inferCategory(repo) {
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
