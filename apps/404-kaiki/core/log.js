// Investigation Log（SPEC §38 §39 §40）
// Wikipedia的な説明画面にしない。404部が書いたノートにする。
import { POINTS } from '../data/case01.js';

const EVIDENCE = {
  P1: '電柱の貼り紙（掲示板の写真と同一）',
  P2: '捨てられていない新品のマスク',
  P3: 'コンビニ裏口。無人。ノブだけが動いた',
  P4: '割れた手鏡',
  P5: '鳥居。内側には入ってこない',
  O1: '公園のブランコ（レイが漕いだ）',
  O2: '自販機。肉まんは売り切れ',
  H1: '室外機の裏の落書き「404」',
};

export function buildRecord(state) {
  const found = POINTS
    .filter(p => state.isDone(p.id))
    .map(p => EVIDENCE[p.id])
    .filter(Boolean);

  const unresolved = [
    '結局、あれは何て答えるのが正解だったんだ？',
    'じゃあ、最初の目撃写真を撮ったのは誰？',
  ];
  if (state.flags.saw_graffiti_404) {
    unresolved.push('あの落書き、なんでうちらと同じ数字なんだ？');
  }

  return {
    case: 'CASE 01 / 口裂け女',
    rumor: '深夜の住宅街、マスクの女に「私、きれい？」と聞かれる',
    places: ['住宅街入口', '小さな公園', 'コンビニ裏', '細い路地', '神社周辺'],
    encounter: 'あり。「わたし、きれい？」と聞かれた（鳥居の外で停止）',
    evidence: found,
    optional: `${state.optionalDone()} / ${state.optionalTotal()}`,
    notes: [
      ['シロウ', '走れば勝てる'],
      ['レイ', '鳥居で止まったのは記録通り'],
      ['ヨツバ', '最初に見たとき、こっちを見ていた'],
    ],
    unresolved,
  };
}
