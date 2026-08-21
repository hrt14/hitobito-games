export const CONFIG={maxWave:8,baseGate:100,cannonDamage:72,reload:2350,blastRadius:58,oilCooldown:12500,oilDuration:4200};
export const ENEMIES={
  raider:{name:'斥候',hp:42,speed:44,damage:8,attackMs:900,r:13,body:'#d76855',shield:false},
  guard:{name:'盾兵',hp:120,speed:24,damage:11,attackMs:1050,r:16,body:'#7b91a7',shield:true},
  brute:{name:'破城兵',hp:220,speed:17,damage:18,attackMs:1250,r:20,body:'#9b7151',shield:false},
  ram:{name:'破城槌',hp:620,speed:11,damage:26,attackMs:1450,r:27,body:'#5d4b3e',shield:true}
};
export const UPGRADES=[
  {id:'damage',icon:'💥',title:'火薬を増やす',desc:'+26 主砲ダメージ',apply:s=>s.cannonDamage+=26},
  {id:'reload',icon:'⚙️',title:'装填手を増やす',desc:'主砲の再装填 -14%',apply:s=>s.reload=Math.max(900,s.reload*.86)},
  {id:'radius',icon:'⭕',title:'榴弾化',desc:'爆発範囲 +12',apply:s=>s.blastRadius+=12},
  {id:'archer',icon:'🏹',title:'城壁弓兵',desc:'自動射撃 +7 DPS',apply:s=>s.archerDps+=7},
  {id:'gate',icon:'🧱',title:'門を補強',desc:'耐久上限 +25 / 25回復',apply:s=>{s.maxGate+=25;s.gate=Math.min(s.maxGate,s.gate+25)}},
  {id:'oil',icon:'🔥',title:'油壺を備蓄',desc:'油壺の再使用 -18%',apply:s=>s.oilCooldown=Math.max(6500,s.oilCooldown*.82)},
  {id:'burn',icon:'🌋',title:'濃い油',desc:'油の燃焼ダメージ +45%',apply:s=>s.oilDps*=1.45},
  {id:'stun',icon:'⚡',title:'衝撃弾',desc:'砲撃した敵を0.5秒止める',apply:s=>s.stunMs+=500}
];
