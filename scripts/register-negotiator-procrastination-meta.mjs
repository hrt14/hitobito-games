import { GAME_META } from './playtest-catalog.mjs';

GAME_META['negotiator-procrastination'] = [
  'levelup',
  '先延ばし中の「無理」「今じゃない」を入力に、25分→5分→60秒→30秒→10秒→5秒→1秒と要求条件を再交渉し、最小の着手まで連れていく。拒否理由に応じて返しを変え、最後は実際の短いタイマーで開始する。',
];

// This registrar is imported by the Firebase discovery/build commands.
// Apply app-specific card copy after those commands finish writing the bundle,
// so the repository's generic-card quality gate sees the final copy.
process.once('beforeExit', async () => {
  await import('./inject-negotiator-card-copy.mjs');
});