// Stands in for Resend in emulated local dev (`npm run dev:emulated` sets RESEND_BASE_URL to
// this server), so every send in the admin can be pressed without emailing anyone.
//
//   npm run mail:emulated
//
// Each email is printed (to, subject) and saved in full to .emulator-mail/<time>-<n>.json
// (gitignored). Answers like Resend: { id } for a send, { data: [{ id }] } for a batch.

import { createServer } from 'http';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const PORT = 3102;
const outputDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../.emulator-mail');
mkdirSync(outputDirectory, { recursive: true });

let count = 0;

function save(email) {
  count += 1;
  const id = `emulated-${Date.now()}-${count}`;
  writeFileSync(resolve(outputDirectory, `${id}.json`), JSON.stringify(email, null, 2));
  const recipients = [email.to].flat().join(', ');
  console.log(`[mail] ${new Date().toLocaleTimeString()}  to ${recipients}  "${email.subject}"${email.attachments?.length ? `  (+${email.attachments.length} attachment)` : ''}`);
  return id;
}

createServer((request, response) => {
  let body = '';
  request.on('data', (chunk) => { body += chunk; });
  request.on('end', () => {
    response.setHeader('Content-Type', 'application/json');
    if (request.method !== 'POST') {
      response.end(JSON.stringify({}));
      return;
    }
    let payload;
    try {
      payload = JSON.parse(body || '{}');
    } catch {
      response.statusCode = 400;
      response.end(JSON.stringify({ name: 'validation_error', message: 'Body is not JSON.' }));
      return;
    }
    if (request.url?.startsWith('/emails/batch')) {
      const ids = (Array.isArray(payload) ? payload : []).map((email) => ({ id: save(email) }));
      response.end(JSON.stringify({ data: ids }));
      return;
    }
    if (request.url?.startsWith('/emails')) {
      response.end(JSON.stringify({ id: save(payload) }));
      return;
    }
    response.end(JSON.stringify({ id: `emulated-${Date.now()}` }));
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Catching emails on http://127.0.0.1:${PORT}, saving to ${outputDirectory}`);
});
