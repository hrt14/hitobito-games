import fs from 'node:fs';
import { initializeApp } from 'firebase-admin/app';
import { getSecurityRules } from 'firebase-admin/security-rules';

let source = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
if (!source.includes('match /levelupSessions/{sessionId}')) {
  throw new Error('Refusing to deploy unexpected firestore.rules: levelupSessions rule is missing.');
}

// Public clients may read one opaque status document by its random feedback ID.
// The document contains only status/app slug/build metadata; raw feedback text stays private.
// Listing and all client writes remain forbidden.
if (!source.includes('match /levelupFeedbackStatus/{feedbackId}')) {
  const anchor = '    // One opaque document per LEVEL UP page/game session.\n';
  const rule = `    // Sanitized per-feedback delivery status. Random IDs are known only to the submitting browser.\n    match /levelupFeedbackStatus/{feedbackId} {\n      allow get: if feedbackId.matches('^([A-Za-z0-9]{16,48}|session-[a-z0-9]{8,24})$');\n      allow list, create, update, delete: if false;\n    }\n\n`;
  if (!source.includes(anchor)) throw new Error('Unable to insert levelupFeedbackStatus rule: anchor missing.');
  source = source.replace(anchor, rule + anchor);
}

initializeApp();
const ruleset = await getSecurityRules().releaseFirestoreRulesetFromSource(source);
console.log(`Firestore rules released directly via Admin SDK: ${ruleset?.name || '(release completed)'}`);