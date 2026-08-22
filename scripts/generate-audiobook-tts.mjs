import fs from 'node:fs';
import path from 'node:path';

const accessToken = process.env.FIREBASE_ACCESS_TOKEN || process.env.GOOGLE_OAUTH_ACCESS_TOKEN;
const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'hitobito-levelup';
const bookPath = 'audio-site/books/shigoto-baisoku-kyokasho/book.json';
const outRoot = 'audio-site/generated-audio';
const apiUrl = 'https://texttospeech.googleapis.com/v1/text:synthesize';

if (!accessToken) throw new Error('FIREBASE_ACCESS_TOKEN is required for Cloud Text-to-Speech');

const voices = [
  { key: 'achernar', name: 'ja-JP-Chirp3-HD-Achernar', label: 'Achernar（女性）', gender: 'female' },
  { key: 'achird', name: 'ja-JP-Chirp3-HD-Achird', label: 'Achird（男性）', gender: 'male' },
  { key: 'aoede', name: 'ja-JP-Chirp3-HD-Aoede', label: 'Aoede（女性）', gender: 'female' },
];

const book = JSON.parse(fs.readFileSync(bookPath, 'utf8'));
if (!Array.isArray(book.chapters) || !book.chapters.length) throw new Error('No chapters found');

fs.rmSync(outRoot, { recursive: true, force: true });
fs.mkdirSync(outRoot, { recursive: true });

function byteLength(text) {
  return Buffer.byteLength(text, 'utf8');
}

function splitLongPiece(piece, maxBytes) {
  const out = [];
  let buf = '';
  for (const char of piece) {
    if (byteLength(buf + char) > maxBytes && buf) {
      out.push(buf);
      buf = '';
    }
    buf += char;
  }
  if (buf) out.push(buf);
  return out;
}

function splitForTts(text, maxBytes = 2800) {
  const cleaned = String(text || '')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const pieces = cleaned
    .split(/(?<=[。！？!?])|\n+/u)
    .map(s => s.trim())
    .filter(Boolean)
    .flatMap(piece => byteLength(piece) <= maxBytes ? [piece] : splitLongPiece(piece, maxBytes));

  const chunks = [];
  let buf = '';
  for (const piece of pieces) {
    const candidate = buf ? `${buf}\n${piece}` : piece;
    if (byteLength(candidate) > maxBytes && buf) {
      chunks.push(buf);
      buf = piece;
    } else {
      buf = candidate;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

async function synthesize(text, voiceName) {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=utf-8',
      'x-goog-user-project': projectId,
    },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: 'ja-JP', name: voiceName },
      audioConfig: { audioEncoding: 'MP3' },
    }),
  });
  const raw = await response.text();
  let body;
  try { body = JSON.parse(raw); } catch { body = null; }
  if (!response.ok || !body?.audioContent) {
    throw new Error(`Cloud TTS ${response.status}: ${body?.error?.message || raw.slice(0, 800)}`);
  }
  return Buffer.from(body.audioContent, 'base64');
}

function concatMp3(parts, output) {
  if (parts.length === 1) {
    fs.copyFileSync(parts[0], output);
    return;
  }
  fs.writeFileSync(output, Buffer.concat(parts.map(part => fs.readFileSync(part))));
}

const manifest = {
  bookId: book.id,
  model: 'Chirp 3: HD',
  language: 'ja-JP',
  generatedAt: new Date().toISOString(),
  voices,
  chapters: {},
};

for (const voice of voices) {
  const voiceDir = path.join(outRoot, voice.key);
  fs.mkdirSync(voiceDir, { recursive: true });
  console.log(`Generating ${voice.label} / ${voice.name}`);

  for (const chapter of book.chapters) {
    const chunks = splitForTts(chapter.text);
    const tempDir = path.join(outRoot, '.tmp', voice.key, chapter.id);
    fs.mkdirSync(tempDir, { recursive: true });
    const parts = [];

    for (let partIndex = 0; partIndex < chunks.length; partIndex++) {
      const partPath = path.join(tempDir, `${String(partIndex + 1).padStart(2, '0')}.mp3`);
      console.log(`  ${chapter.id} part ${partIndex + 1}/${chunks.length} (${byteLength(chunks[partIndex])} bytes)`);
      fs.writeFileSync(partPath, await synthesize(chunks[partIndex], voice.name));
      parts.push(partPath);
    }

    const outputPath = path.join(voiceDir, `${chapter.id}.mp3`);
    concatMp3(parts, outputPath);
    manifest.chapters[chapter.id] ||= {};
    manifest.chapters[chapter.id][voice.key] = `/${outputPath.replace(/^audio-site\//, '').replaceAll('\\', '/')}`;
  }
}

fs.rmSync(path.join(outRoot, '.tmp'), { recursive: true, force: true });
fs.writeFileSync(path.join(outRoot, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Generated ${voices.length * book.chapters.length} chapter audio files.`);
