import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>/^[A-Z_]+=/.test(l)).map(l=>{const i=l.indexOf('=');return [l.slice(0,i), l.slice(i+1).replace(/^"|"$/g,'')]}));
initializeApp({ credential: cert({ projectId: env.FIREBASE_PROJECT_ID, clientEmail: env.FIREBASE_CLIENT_EMAIL, privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g,'\n') }) });
const db = getFirestore();
const token = (id) => Buffer.from(id).toString('base64url') + '.' + createHmac('sha256', env.VOLUNTEER_CONFIRM_SECRET).update(id).digest('base64url');
const base = { email:'preview@example.com', status:'accepted', submittedAt: Timestamp.now(), isOrganiser:false, assignedArea:'registration', assignedShift:'morning', acceptanceEmailSentAt: Timestamp.now(), confirmByDate: Timestamp.fromDate(new Date(Date.now()+5*864e5)) };
if (process.argv[2] === 'delete') {
  await db.collection('volunteers').doc('zz-preview-pending').delete();
  await db.collection('volunteers').doc('zz-preview-confirmed').delete();
  console.log('deleted');
} else {
  await db.collection('volunteers').doc('zz-preview-pending').set({ ...base, name:'Preview Pending' });
  await db.collection('volunteers').doc('zz-preview-confirmed').set({ ...base, name:'Preview Confirmed', volunteerConfirmedAt: Timestamp.now() });
  console.log('http://localhost:3000/volunteer/confirm?token=' + token('zz-preview-pending'));
  console.log('http://localhost:3000/volunteer/confirm?token=' + token('zz-preview-confirmed'));
}
