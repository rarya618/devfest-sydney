// Stage 4d cleanup pass (PM.md): removes the person fields migrate-volunteer-profiles.mjs
// left on each `volunteers` signup, now that every read takes them from the signup's profile.
//
//   node scripts/cleanup-volunteer-fields.mjs --dry-run  # print what would be removed
//   node scripts/cleanup-volunteer-fields.mjs            # remove
//
// The fields are VOLUNTEER_PROFILE_KEYS in src/lib/volunteerProfiles.ts. Signup ids never
// change (/volunteer/confirm tokens are signed over them).
//
// Refuses to run if a signup has no profile, or holds a value its profile doesn't (a phone
// number, say, where the profile's is blank), since removing it would lose the only copy.
// Where both have a value and they differ (the second signup of someone who signed up
// twice), the profile's is the one every page already shows, so the difference is listed
// but doesn't stop the run.

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');

// Parse .env.local manually (no dotenv dependency needed)
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((line) => line.trim() && !line.startsWith('#'))
    .map((line) => {
      const [key, ...rest] = line.split('=');
      const raw = rest.join('=').trim();
      const value = raw.match(/^(['"])([\s\S]*)\1$/) ? raw.slice(1, -1) : raw;
      return [key.trim(), value];
    })
);

initializeApp({
  credential: cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore();
const isDryRun = process.argv.includes('--dry-run');

// Keep in step with VOLUNTEER_PROFILE_KEYS in src/lib/volunteerProfiles.ts.
const PROFILE_KEYS = [
  'name',
  'email',
  'phone',
  'priorExperience',
  'googleTechExperience',
  'isTorrensStudentOrStaff',
  'hasBeenGdgOnCampusExec',
  'gdgOnCampusChapter',
  'dietaryRequirements',
  'photoUrl',
  'linkedinUrl',
];

// "N/A" and the like are answers to an optional question that say nothing, so losing one
// isn't losing data (a rejected duplicate signup had "N/A" for dietary requirements).
const PLACEHOLDER_ANSWERS = new Set(['n/a', 'na', 'none', 'nil', '-']);
const isBlank = (value) =>
  value === undefined ||
  value === null ||
  value === false ||
  (typeof value === 'string' && (value.trim() === '' || PLACEHOLDER_ANSWERS.has(value.trim().toLowerCase())));

const [signupSnapshot, profileSnapshot] = await Promise.all([
  db.collection('volunteers').get(),
  db.collection('volunteerProfiles').get(),
]);
const profilesById = new Map(profileSnapshot.docs.map((doc) => [doc.id, doc.data()]));

const problems = [];
const differences = [];
const updates = signupSnapshot.docs.flatMap((doc) => {
  const signup = doc.data();
  const present = PROFILE_KEYS.filter((key) => key in signup);
  if (present.length === 0) return [];
  const label = `${doc.id} (${signup.name ?? 'no name'})`;
  const profile = profilesById.get(String(signup.profileId ?? ''));
  if (!profile) {
    problems.push(`signup ${label} has no profile`);
    return [];
  }
  for (const key of present) {
    const ours = signup[key];
    const theirs = profile[key];
    if (isBlank(ours) || JSON.stringify(ours) === JSON.stringify(theirs)) continue;
    if (isBlank(theirs)) problems.push(`signup ${label} has ${key} but its profile doesn't`);
    else differences.push(`signup ${label}: ${key} differs from the profile's (the profile's is kept)`);
  }
  return [{ ref: doc.ref, label, fields: present }];
});

if (problems.length > 0) {
  console.error(`Can't clean up:\n  ${problems.join('\n  ')}\nNothing was written.`);
  process.exit(1);
}

for (const update of updates) console.log(`volunteers/${update.label}: ${update.fields.join(', ')}`);
if (differences.length > 0) console.log(`\n${differences.join('\n')}`);
console.log(`\n${updates.length} of ${signupSnapshot.size} signup(s) to clean.`);

if (isDryRun) {
  console.log('Dry run: nothing was written.');
  process.exit(0);
}

for (let start = 0; start < updates.length; start += 400) {
  const batch = db.batch();
  for (const update of updates.slice(start, start + 400)) {
    batch.update(update.ref, Object.fromEntries(update.fields.map((field) => [field, FieldValue.delete()])));
  }
  await batch.commit();
}
console.log('Done.');
