export function buildRedirectPath(pathname: string | null, queryString?: string): string {
  const safePath = pathname && pathname.startsWith("/") ? pathname : "/";
  if (!queryString) {
    return safePath;
  }

  return `${safePath}?${queryString}`;
}

export function sanitizeRedirectPath(input: string | null | undefined): string {
  if (!input) {
    return "/";
  }

  if (!input.startsWith("/")) {
    return "/";
  }

  if (input.startsWith("//")) {
    return "/";
  }

  return input;
}
