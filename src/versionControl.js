// versionControl.js
const LATEST_KEY = "LATEST_VERSION_LABEL";

/**
 * Generates a new version label with the date and Greek notation.
 * If type = "update", prefix with "update-"
 */
export async function generateVersionLabel(env, type = "") {
  // 1. Get today’s date string
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;

  // 2. Get the current count for how many versions exist today
  const todayKey = `VERSIONS_${dateStr}`;
  let versionCount = await env.KV_TCUK.get(todayKey);
  versionCount = versionCount ? parseInt(versionCount, 10) : 0;

  // 3. Convert versionCount to Greek label
  const greekLabel = convertCountToGreek(versionCount);

  // 4. Increment and store
  versionCount++;
  await env.KV_TCUK.put(todayKey, versionCount.toString());

  const baseLabel = `${dateStr}-${greekLabel}`;
  const finalLabel = type ? `${type}-${baseLabel}` : baseLabel;

  // 5. Update "latest" pointer
  await env.KV_TCUK.put(LATEST_KEY, finalLabel);

  return finalLabel;
}

/**
 * Convert a numeric counter to a Greek-based label.
 * Example approach: 0 -> 'alpha', 1 -> 'beta' ... 24 -> 'omega'
 * Then continue: 25 -> 'alpha-alpha', etc.
 */
function convertCountToGreek(count) {
  const greekAlphabet = [
    "alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta",
    "iota", "kappa", "lambda", "mu", "nu", "xi", "omicron", "pi", "rho",
    "sigma", "tau", "upsilon", "phi", "chi", "psi", "omega"
  ];

  // We can handle repeated cycles by recursively constructing a label
  const alphabetLength = greekAlphabet.length;

  if (count < alphabetLength) {
    return greekAlphabet[count];
  } else {
    const prefixIndex = Math.floor(count / alphabetLength) - 1;
    const remainder = count % alphabetLength;
    // e.g. 25 -> prefixIndex = 0, remainder = 1 => alpha-beta
    return convertCountToGreek(prefixIndex) + "-" + greekAlphabet[remainder];
  }
}

/**
 * Store any data structure to KV under a specific version label.
 */
export async function storeVersionData(versionLabel, data, env) {
  await env.KV_TCUK.put(versionLabel, JSON.stringify(data));
  // Optionally update the "latest" pointer
  await env.KV_TCUK.put(LATEST_KEY, versionLabel);
}

/**
 * Retrieve data by version label or fallback to latest
 */
export async function getVersionData(label, env) {
  if (label === "latest") {
    label = await env.KV_TCUK.get(LATEST_KEY);
    if (!label) {
      return null;
    }
  }
  const stored = await env.KV_TCUK.get(label);
  return stored ? JSON.parse(stored) : null;
}

/**
 * Rollback to a specified version.
 * This might mean making that version the new "latest," or
 * optionally re-uploading it to TrainerCentral if you prefer immediate reversion.
 */
export async function rollbackToVersion(versionLabel, env) {
  // Check it exists
  const data = await env.KV_TCUK.get(versionLabel);
  if (!data) {
    return { error: `Version ${versionLabel} not found.` };
  }

  // Mark it as the new latest
  await env.KV_TCUK.put(LATEST_KEY, versionLabel);

  // If you want to call `upload_content` automatically, you could do that here.

  return { message: `Rolled back to version ${versionLabel}`, versionLabel };
}
