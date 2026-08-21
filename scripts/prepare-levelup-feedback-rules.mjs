import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const rulesPath = path.join(root, 'firestore.rules');
const marker = '// LEVEL UP public feedback fallback v1';

if (!fs.existsSync(rulesPath)) throw new Error('firestore.rules not found');
let rules = fs.readFileSync(rulesPath, 'utf8');
if (rules.includes(marker)) {
  console.log('[Firestore] LEVEL UP feedback fallback rules already present.');
  process.exit(0);
}

const block = `

    ${marker}
    // Create-only and schema-limited. Feedback contents remain private.
    match /levelupFeedback/{feedbackId} {
      allow read, update, delete: if false;
      allow create: if request.resource.data.keys().hasOnly([
          'schemaVersion',
          'source',
          'type',
          'message',
          'appSlug',
          'appTitle',
          'pageTitle',
          'pagePath',
          'screenLabel',
          'buildSha',
          'viewport',
          'status',
          'syncStatus',
          'createdAt'
        ])
        && request.resource.data.schemaVersion == 1
        && request.resource.data.source == 'levelup-feedback-widget-fallback'
        && request.resource.data.type in ['improvement', 'confusing', 'bug', 'idea']
        && request.resource.data.message is string
        && request.resource.data.message.size() >= 2
        && request.resource.data.message.size() <= 800
        && request.resource.data.appSlug is string
        && request.resource.data.appSlug.matches('^(home|[a-z0-9-]{1,64})$')
        && request.resource.data.appTitle is string
        && request.resource.data.appTitle.size() >= 1
        && request.resource.data.appTitle.size() <= 100
        && request.resource.data.pageTitle is string
        && request.resource.data.pageTitle.size() >= 1
        && request.resource.data.pageTitle.size() <= 120
        && request.resource.data.pagePath is string
        && request.resource.data.pagePath.size() >= 1
        && request.resource.data.pagePath.size() <= 300
        && request.resource.data.pagePath.matches('^/.*$')
        && request.resource.data.screenLabel is string
        && request.resource.data.screenLabel.size() <= 120
        && request.resource.data.buildSha is string
        && request.resource.data.buildSha.matches('^(local|[a-f0-9]{4,12})$')
        && request.resource.data.viewport is string
        && request.resource.data.viewport.matches('^[0-9]{2,5}x[0-9]{2,5}$')
        && request.resource.data.status == 'new'
        && request.resource.data.syncStatus == 'pending'
        && request.resource.data.createdAt == request.time;
    }
`;

const closing = '\n  }\n}\n';
const at = rules.lastIndexOf(closing);
if (at < 0) throw new Error('Could not locate Firestore rules closing braces');
rules = rules.slice(0, at) + block + rules.slice(at);
fs.writeFileSync(rulesPath, rules);
console.log('[Firestore] Added create-only LEVEL UP feedback fallback rules.');
