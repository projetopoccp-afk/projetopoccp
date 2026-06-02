export function translate(
  t: (key: string) => string,
  key: string,
  fallback: string
) {
  const value = t(key as never);

  if (!value || value === key) {
    return fallback;
  }

  return value;
}