import fs from 'node:fs';
import { initializeApp } from 'firebase-admin/app';
import { getSecurityRules } from 'firebase-admin/security-rules';

const source = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
if (!source.includes('match /levelupSessions/{sessionId}')) {
  throw new Error('Refusing to deploy unexpected firestore.rules: levelupSessions rule is missing.');
}

initializeApp();
const ruleset = await getSecurityRules().releaseFirestoreRulesetFromSource(source);
console.log(`Firestore rules released directly via Admin SDK: ${ruleset?.name || '(release completed)'}`);
