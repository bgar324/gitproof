// file: lib/packageJsonCache.ts

/**
 * A simple in‐memory map that records, for each "owner/repo" string,
 * whether fetching `/contents/package.json` succeeded (true) or failed (false).
 *
 * Once we set it here, any subsequent calls for the same key will be instant.
 */
const packageJsonCache = new Map<string, boolean>();

/**
 * Attempt to fetch `package.json` for a given GitHub repo. 
 *   - If we already have a cache entry for this repo, return it immediately.
 *   - Otherwise, do a network call; cache the final result (true if 200, false if 404/any‐error).
 *
 * @param owner  GitHub repo owner (e.g. "bgar324")
 * @param name   GitHub repo name (e.g. "weather")
 * @param token  optional GitHub token if you want to authenticate (otherwise it’s unauthenticated)
 * @returns      `true` if package.json exists, `false` if it does not (404 or error)
 */
export async function checkPackageJsonExists(
  owner: string,
  name: string,
  token?: string
): Promise<boolean> {
  const key = `${owner}/${name}`;

  // 1) If it’s already in the cache, just return that:
  if (packageJsonCache.has(key)) {
    return packageJsonCache.get(key)!;
  }

  // 2) Otherwise, do a fetch once:
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };
    if (token) {
      headers["Authorization"] = `token ${token}`;
    }

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${name}/contents/package.json`,
      { headers }
    );
    if (res.ok) {
      // Found package.json (200). Cache and return true.
      packageJsonCache.set(key, true);
      return true;
    } else {
      // Hit a 404 (or some other non‐200). We consider that “not there.”
      packageJsonCache.set(key, false);
      return false;
    }
  } catch (err) {
    // In case of network error, treat as “not found” but cache so we don’t retry repeatedly.
    packageJsonCache.set(key, false);
    return false;
  }
}
