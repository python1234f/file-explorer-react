const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const unit = bytes < 1024 ** 2 ? 'KB' : 'MB';
  const value = bytes / (unit === 'KB' ? 1024 : 1024 ** 2);
  return `${numberFormatter.format(value)} ${unit}`;
}
