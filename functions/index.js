import { createHash } from 'node:crypto';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
export { queueLevelupCreationRequests } from './levelup-request-trigger.mjs';

initializeApp();
const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY');
const db = getFirestore();
const MODEL = 'gpt-5.6-luna';
const REGION = 'asia-northeast1';
const DAILY_LIMIT = 20;
const FEEDBACK_DAILY_LIMIT = 12;
const ALLOWED_ORIGINS = new Set([
  'https://levelup.hitobito.jp',
  'https://hitobito-levelup.web.app',
  'https://hitobito-levelup.firebaseapp.com',
]);
const CATEGORIES = ['experience','knowledge','skill','courage','recovery','self_knowledge','relationship','memory','boundary','rest','failure_data','progress','other'];
const FEEDBACK_TYPES = new Set(['improvement','confusing','bug','idea']);
const FEEDBACK_REQUEST_TYPES = new Set(['improvement','new_app']);

const schema = {
  type: 'object', additionalProperties: false,
  properties: {
    found: { type: 'boolean' },
    primary: {
      anyOf: [
        { type: 'null' },
        {
          type: 'object', additionalProperties: false,
          properties: {
            category: { type: 'string', enum: CATEGORIES },
            title: { type: 'string', minLength: 1, maxLength: 48 },
            added: { type: 'string', minLength: 1, maxLength: 120 },
            reason: { type: 'string', minLength: 1, maxLength: 180 },
            lifeMeaning: { type: 'string', minLength: 1, maxLength: 180 }
          },
          required: ['category','title','added','reason','lifeMeaning']
        }
      ]
    },
    hiddenPlus: {
      type: 'array', maxItems: 2,
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          category: { type:'string', enum:CATEGORIES },
          title: { type:'string', minLength:1, maxLength:48 }
        }, required:['category','title']
      }
    },
    message: { anyOf: [{ type:'null' }, { type:'string', minLength:1, maxLength:180 }] }
  },
  required: ['found','primary','hiddenPlus','message']
};

const instructions = `あなたは「LIFE +1」の差分発見エンジンです。ユーザーを褒めるAIではありません。
今日起きた事実から「昨日までの人生にはなかった、確実に言える追加」を1つ探してください。

原則:
- 入力にない成果・能力向上・感情を作らない。
- 小さな行動を大げさな成長にしない。
- 嫌な出来事を「良いことだった」「成長のチャンス」と美化しない。
- 失敗は失敗のまま扱い、明確なら「今後に使える検証データが増えた」と表現できる。
- 休息は健康効果を断定しない。「休む選択をした」という事実までに留める。
- 人間関係や思い出を生産性へ変換しない。
- テンプレ褒め（素晴らしい、すごい成長、前向きに等）は禁止。
- 根拠のある+1が見つからなければ found=false。無理に作らない。
- primary.reason は入力のどの事実を根拠にしたか具体的に示す。
- 文体は短く、具体的、事実ベース。押し付けない。
- hiddenPlus は本当に別の根拠がある場合のみ0〜2個。

found=true のとき primary は必須。found=false のとき primary=null とし、message に短い説明を書く。`;

function setCors(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.has(origin)) res.set('Access-Control-Allow-Origin', origin);
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

async function verifyUser(req) {
  const header = String(req.headers.authorization || '');
  if (!header.startsWith('Bearer ')) throw Object.assign(new Error('AUTH_REQUIRED'), { status:401 });
  const token = header.slice(7);
  const decoded = await getAuth().verifyIdToken(token);
  return decoded.uid;
}

function japanDateKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Tokyo', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(now);
  const get = type => parts.find(part => part.type === type)?.value;
  return `${get('year')}${get('month')}${get('day')}`;
}

async function enforceQuota(uid) {
  const ref = db.collection('levelupAiUsage').doc(`${japanDateKey()}_${uid}`);
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const count = snap.exists ? Number(snap.data()?.count || 0) : 0;
    if (count >= DAILY_LIMIT) throw Object.assign(new Error('DAILY_LIMIT'), { status:429 });
    tx.set(ref, { uid, date:japanDateKey(), count:count + 1, lastUsedAt:FieldValue.serverTimestamp() }, { merge:true });
  });
}

async function enforceFeedbackQuota(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim();
  const fingerprint = createHash('sha256').update(`${forwarded}|${String(req.headers['user-agent'] || '').slice(0,120)}`).digest('hex').slice(0, 32);
  const date = japanDateKey();
  const ref = db.collection('levelupFeedbackRate').doc(`${date}_${fingerprint}`);
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const count = snap.exists ? Number(snap.data()?.count || 0) : 0;
    if (count >= FEEDBACK_DAILY_LIMIT) throw Object.assign(new Error('RATE_LIMIT'), { status:429 });
    tx.set(ref, { date, fingerprint, count:count + 1, lastSubmittedAt:FieldValue.serverTimestamp() }, { merge:true });
  });
}

function cleanText(value, max) {
  return typeof value === 'string' ? value.replace(/\u0000/g, '').trim().slice(0, max) : '';
}

function validFeedbackPayload(body) {
  const requestType = cleanText(body?.requestType, 24) || 'improvement';
  const type = cleanText(body?.type, 24);
  const message = cleanText(body?.message, 800);
  const appSlug = cleanText(body?.appSlug, 64);
  const appTitle = cleanText(body?.appTitle, 100);
  const pageTitle = cleanText(body?.pageTitle, 120);
  const pagePath = cleanText(body?.pagePath, 300);
  const screenLabel = cleanText(body?.screenLabel, 120);
  const buildSha = cleanText(body?.buildSha, 12);
  const viewport = cleanText(body?.viewport, 24);
  if (!FEEDBACK_REQUEST_TYPES.has(requestType)) return null;
  if (!FEEDBACK_TYPES.has(type)) return null;
  if (message.length < 2 || message.length > 800) return null;
  if (!/^(home|[a-z0-9-]{1,64})$/.test(appSlug)) return null;
  if (!appTitle || !pageTitle || !pagePath.startsWith('/')) return null;
  if (buildSha && !/^(local|[a-f0-9]{4,12})$/.test(buildSha)) return null;
  if (viewport && !/^\d{2,5}x\d{2,5}$/.test(viewport)) return null;
  return { requestType, type, message, appSlug, appTitle, pageTitle, pagePath, screenLabel, buildSha: buildSha || 'local', viewport };
}

function extractText(response) {
  for (const item of response?.output || []) {
    if (item?.type !== 'message') continue;
    for (const content of item.content || []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') return content.text;
    }
  }
  return '';
}

async function callOpenAI(text) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method:'POST',
    headers:{ 'Authorization':`Bearer ${OPENAI_API_KEY.value()}`, 'Content-Type':'application/json' },
    body:JSON.stringify({
      model:MODEL,
      store:false,
      reasoning:{ effort:'none' },
      instructions,
      input:text,
      text:{
        verbosity:'low',
        format:{ type:'json_schema', name:'life_plus_one', strict:true, schema }
      }
    })
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error('[LIFE +1] OpenAI error', response.status, detail.slice(0,500));
    throw Object.assign(new Error('OPENAI_ERROR'), { status:502 });
  }
  const data = await response.json();
  const output = extractText(data);
  if (!output) throw Object.assign(new Error('EMPTY_OPENAI_OUTPUT'), { status:502 });
  const parsed = JSON.parse(output);
  if (typeof parsed?.found !== 'boolean') throw Object.assign(new Error('INVALID_OPENAI_OUTPUT'), { status:502 });
  return parsed;
}

export const submitLevelupFeedback = onRequest(
  { region:REGION, timeoutSeconds:15, memory:'256MiB', maxInstances:10 },
  async (req, res) => {
    setCors(req, res);
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'METHOD_NOT_ALLOWED' });
    const origin = String(req.headers.origin || '');
    if (origin && !ALLOWED_ORIGINS.has(origin)) return res.status(403).json({ ok:false, error:'ORIGIN_NOT_ALLOWED' });
    const payload = validFeedbackPayload(req.body);
    if (!payload) return res.status(400).json({ ok:false, error:'INVALID_INPUT' });
    try {
      await enforceFeedbackQuota(req);
      const ref = db.collection('levelupFeedback').doc();
      await ref.set({
        schemaVersion: 2,
        source: 'levelup-feedback-widget',
        ...payload,
        status: 'new',
        syncStatus: 'pending',
        createdAt: FieldValue.serverTimestamp(),
      });
      res.set('Cache-Control','no-store');
      return res.status(201).json({ ok:true, id:ref.id });
    } catch (error) {
      const status = Number(error?.status) || 500;
      if (status >= 500) console.error('[LEVEL UP feedback] submit failed', error);
      return res.status(status).json({ ok:false, error: status === 429 ? 'RATE_LIMIT' : 'SERVER_ERROR' });
    }
  }
);

export const analyzeLifePlusOne = onRequest(
  { region:REGION, secrets:[OPENAI_API_KEY], timeoutSeconds:30, memory:'256MiB', maxInstances:10 },
  async (req, res) => {
    setCors(req, res);
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ error:'METHOD_NOT_ALLOWED' });
    const origin = String(req.headers.origin || '');
    if (origin && !ALLOWED_ORIGINS.has(origin)) return res.status(403).json({ error:'ORIGIN_NOT_ALLOWED' });
    try {
      const uid = await verifyUser(req);
      const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
      if (!text || text.length > 1000) return res.status(400).json({ error:'INVALID_INPUT' });
      await enforceQuota(uid);
      const result = await callOpenAI(text);
      res.set('Cache-Control','no-store');
      return res.status(200).json(result);
    } catch (error) {
      const status = Number(error?.status) || (error?.code?.startsWith?.('auth/') ? 401 : 500);
      if (status >= 500) console.error('[LIFE +1] endpoint failed', error);
      const code = status === 429 ? 'DAILY_LIMIT' : status === 401 ? 'AUTH_REQUIRED' : status === 502 ? 'AI_UNAVAILABLE' : 'SERVER_ERROR';
      return res.status(status).json({ error:code });
    }
  }
);
