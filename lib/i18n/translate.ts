export function translate<Key extends string>(
  t: (key: Key) => string,
  key: Key,
  fallback: string
) {
  const value = t(key);

  if (!value || value === key) {
    return fallback;
  }

  return value;
}