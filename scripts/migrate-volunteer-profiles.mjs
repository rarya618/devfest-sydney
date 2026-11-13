// Stage 4d of the One GDG Sydney Site plan in PM.md: gives every volunteer and organiser a
// GDG-wide profile in `volunteerProfiles`, and points each signup in `volunteers` at it.
//
//   node scripts/migrate-volunteer-profiles.mjs --dry-run  # print what would be written
//   node scripts/migrate-volunteer-profiles.mjs            # write
//
// Additive only: it creates profiles and adds `profileId` to each signup. The person fields
// stay on the signups too, so the code running before 4d keeps working until 4d is deployed,
// and a later cleanup pass removes them. Signup ids never change (/volunteer/confirm tokens
// are signed over them). Run it BEFORE deploying 4d.
//
// Signups with the same email AND the same name are one person, as the new code decides it
// (findOrCreateVolunteerProfile): three people signed up twice for DevFest 2026. Their
// profile takes the accepted signup's details if there is one, otherwise the newest; a photo
// or LinkedIn on any of their signups is kept.

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

// Kept in step with VOLUNTEER_PROFILE_KEYS in src/lib/volunteerProfiles.ts.
const PROFILE_DEFAULTS = {
  name: '',
  email: '',
  phone: '',
  priorExperience: '',
  googleTechExperience: '',
  isTorrensStudentOrStaff: false,
  hasBeenGdgOnCampusExec: false,
  gdgOnCampusChapter: '',
  dietaryRequirements: '',
  photoUrl: '',
  linkedinUrl: '',
};

const [signupSnapshot, existingProfiles] = await Promise.all([
  db.collection('volunteers').get(),
  db.collection('volunteerProfiles').limit(1).get(),
]);
if (!existingProfiles.empty) {
  console.error('volunteerProfiles already has documents. This migration has run; nothing was written.');
  process.exit(1);
}

const signups = signupSnapshot.docs.map((doc) => ({ id: doc.id, ref: doc.ref, data: doc.data() }));
const missingEmail = signups.filter((signup) => !String(signup.data.email ?? '').trim());
if (missingEmail.length > 0) {
  console.error(`Signups with no email: ${missingEmail.map((signup) => signup.id).join(', ')}. Nothing was written.`);
  process.exit(1);
}

const personKey = (data) => `${String(data.email).trim().toLowerCase()}|${String(data.name ?? '').trim().toLowerCase()}`;
const groups = new Map();
for (const signup of signups) {
  const key = personKey(signup.data);
  groups.set(key, [...(groups.get(key) ?? []), signup]);
}

const submittedMillis = (signup) => signup.data.submittedAt?.toMillis?.() ?? 0;

const people = [...groups.values()].map((group) => {
  // The accepted signup if any, otherwise the newest, is the source of the person's details.
  const ordered = [...group].sort(
    (first, second) =>
      Number(second.data.status === 'accepted') - Number(first.data.status === 'accepted') ||
      submittedMillis(second) - submittedMillis(first)
  );
  const source = ordered[0].data;
  const profile = {};
  for (const [key, fallback] of Object.entries(PROFILE_DEFAULTS)) profile[key] = source[key] ?? fallback;
  for (const key of ['photoUrl', 'linkedinUrl']) {
    if (!profile[key]) profile[key] = ordered.map((signup) => signup.data[key]).find(Boolean) ?? '';
  }
  return {
    ref: db.collection('volunteerProfiles').doc(),
    signups: group,
    data: {
      ...profile,
      email: String(profile.email).trim(),
      emailNormalised: String(profile.email).trim().toLowerCase(),
      createdAt: group.map((signup) => signup.data.submittedAt).filter(Boolean).sort((a, b) => a.toMillis() - b.toMillis())[0] ?? FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
  };
});

const organisers = people.filter((person) => person.signups.some((signup) => signup.data.isOrganiser)).length;
const merged = people.filter((person) => person.signups.length > 1);
console.log(`${signups.length} signup(s) -> ${people.length} profile(s), ${organisers} of them organisers.`);
for (const person of merged) {
  console.log(`  one person, ${person.signups.length} signups: ${person.signups.map((signup) => signup.data.status).join(' + ')}`);
}

if (isDryRun) {
  console.log('\nDry run: nothing written.');
  process.exit(0);
}

const writes = people.flatMap((person) => [
  (batch) => batch.create(person.ref, person.data),
  ...person.signups.map((signup) => (batch) => batch.update(signup.ref, { profileId: person.ref.id })),
]);
for (let start = 0; start < writes.length; start += 400) {
  const batch = db.batch();
  writes.slice(start, start + 400).forEach((write) => write(batch));
  await batch.commit();
}
console.log(`\nWrote ${people.length} profile(s) and linked ${signups.length} signup(s).`);
process.exit(0);
