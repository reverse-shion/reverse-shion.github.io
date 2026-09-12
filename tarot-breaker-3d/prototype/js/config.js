export const VERSION = 'star-country-v1.1';
export const ROOT = new URL('../../../', import.meta.url);
export function asset(path) {
  const url = new URL(path, ROOT);
  if (url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) throw new Error('Invalid asset path');
  url.searchParams.set('v', VERSION);
  return url.href;
}
export async function loadJSON(url, signal) {
  const res = await fetch(url, { cache: 'no-store', signal });
  if (!res.ok) throw new Error(`データを読み込めませんでした (${res.status})`);
  return res.json();
}
