import { readCache, readStaleCache, writeCache } from './cache.js';

export const GITHUB_ORG = 'ViudiraTech';
const API = 'https://api.github.com';

async function request(path, { cacheKey, ttl = 5 * 60_000, accept = 'application/vnd.github+json' } = {}) {
  if (cacheKey) {
    const cached = readCache(cacheKey, ttl);
    if (cached) return { data: cached, cached: true, stale: false };
  }

  try {
    const response = await fetch(`${API}${path}`, {
      headers: {
        Accept: accept,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!response.ok) {
      const rateRemaining = response.headers.get('x-ratelimit-remaining');
      throw new Error(response.status === 403 && rateRemaining === '0' ? 'GitHub API 请求频率已达上限' : `GitHub API ${response.status}`);
    }
    const data = await response.json();
    if (cacheKey) writeCache(cacheKey, data);
    return { data, cached: false, stale: false };
  } catch (error) {
    const stale = cacheKey ? readStaleCache(cacheKey) : null;
    if (stale) return { data: stale, cached: true, stale: true, error };
    throw error;
  }
}

export async function fetchRepositories() {
  return request(`/orgs/${GITHUB_ORG}/repos?per_page=100&type=public&sort=updated`, {
    cacheKey: 'repos',
    ttl: 3 * 60_000,
  });
}

export async function fetchOrgActivity() {
  return request(`/orgs/${GITHUB_ORG}/events?per_page=30`, {
    cacheKey: 'events',
    ttl: 2 * 60_000,
  });
}

export async function fetchLanguages(fullName) {
  return request(`/repos/${fullName}/languages`, {
    cacheKey: `languages.${fullName}`,
    ttl: 30 * 60_000,
  });
}

export async function fetchReadme(fullName) {
  return request(`/repos/${fullName}/readme`, {
    cacheKey: `readme.${fullName}`,
    ttl: 30 * 60_000,
  });
}

export function decodeBase64Utf8(value = '') {
  const binary = atob(value.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}
