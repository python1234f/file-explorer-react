export function nodeUrl(path: string, search = ''): string {
  return `/tree/${path.split('/').map(encodeURIComponent).join('/')}${search}`;
}

export function pathFromUrl(pathname: string): string | null {
  if (pathname === '/tree' || pathname === '/tree/') return null;
  try {
    return pathname.slice('/tree/'.length).split('/').map(decodeURIComponent).join('/');
  } catch {
    return '';
  }
}
