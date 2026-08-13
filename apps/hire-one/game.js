(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
  const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];
  const shuffle = (arr) => [...arr].sort(() => Math.random()-.5);

  const CANDIDATES = [
    {id:'genius',emoji:'🧑‍💻',role:'天才エンジニア',name:'神崎 コウ',catch:'「仕様書は読まない。未来なら見える」',traits:['天才','徹夜型','説明が苦手'],tech:18,culture:-5,revenue:2,chaos:7,color:'#d8e7ff',tags:['engineer','genius']},
    {id:'salesgod',emoji:'🕺',role:'営業の神',name:'轟 マサル',catch:'「売るものがなくても、先に売れます」',traits:['超営業','人脈','話が長い'],tech:-1,culture:3,revenue:18,chaos:5,color:'#ffe2c9',tags:['sales','extrovert']},
    {id:'ai',emoji:'🤖',role:'自称・社員AI',name:'A-001',catch:'給与はいりません。権限だけください。',traits:['24時間稼働','高速学習','権限要求'],tech:20,culture:-3,revenue:6,chaos:12,color:'#d9edf6',tags:['ai','engineer']},
    {id:'cat',emoji:'🐈',role:'猫',name:'部長',catch:'履歴書は空白。なぜか役員推薦。',traits:['かわいい','寝る','会議に強い'],tech:0,culture:18,revenue:2,chaos:8,color:'#fff0bd',tags:['cat','animal']},
    {id:'oldman',emoji:'👴',role:'100歳の職人',name:'伊吹 源蔵',catch:'「その仕事、まだ手でやっとるのか」',traits:['職人技','遅い','絶対辞めない'],tech:12,culture:9,revenue:5,chaos:-2,color:'#e6edd9',tags:['craft','senior']},
    {id:'future',emoji:'🧑‍🚀',role:'未来人',name:'西暦2148年の人',catch:'御社、歴史の教科書に載ってましたよ。',traits:['未来知識','ネタバレ','戸籍なし'],tech:16,culture:-2,revenue:10,chaos:15,color:'#e0dcfa',tags:['future','research']},
    {id:'accountant',emoji:'🧮',role:'鬼の経理',name:'黒田 ミチル',catch:'1円のズレで全員を止める。',traits:['黒字化','監査','融通ゼロ'],tech:3,culture:-2,revenue:11,chaos:-9,color:'#e5e3dd',tags:['finance','order']},
    {id:'influencer',emoji:'🤳',role:'フォロワー300万人',name:'MIMI',catch:'「会社より先に社長をバズらせます」',traits:['拡散','炎上','撮影中'],tech:-2,culture:6,revenue:13,chaos:12,color:'#ffd9eb',tags:['media','sales']},
    {id:'lawyer',emoji:'⚖️',role:'最強法務',name:'御手洗 レイ',catch:'「それ、利用規約のどこに書いてあります？」',traits:['契約','防御','止める力'],tech:1,culture:-1,revenue:3,chaos:-12,color:'#e1e8f0',tags:['legal','order']},
    {id:'hacker',emoji:'🧑‍🎤',role:'野良ハッカー',name:'0xNeko',catch:'面接中に御社のWi-Fiへ入ってきた。',traits:['侵入','裏技','信用不明'],tech:17,culture:-6,revenue:4,chaos:15,color:'#d9f6df',tags:['hacker','engineer']},
    {id:'security',emoji:'🕵️',role:'元・情報機関',name:'灰谷 シン',catch:'「質問は以上です。後ろを見ないで」',traits:['防衛','無口','身辺調査'],tech:10,culture:-4,revenue:1,chaos:-8,color:'#dde0e4',tags:['security','order']},
    {id:'hr',emoji:'🫶',role:'人事の聖母',name:'春日 ユイ',catch:'退職届を出した人が、なぜか戻ってくる。',traits:['採用','仲裁','褒める'],tech:0,culture:17,revenue:3,chaos:-4,color:'#ffe0de',tags:['hr','culture']},
    {id:'cult',emoji:'🧙',role:'カリスマ研修講師',name:'光輪 セイジ',catch:'「社員ではない。同志と呼びましょう」',traits:['熱狂','朝礼','思想強め'],tech:2,culture:8,revenue:8,chaos:20,color:'#e7dcf7',tags:['cult','culture']},
    {id:'philosopher',emoji:'🧔',role:'哲学者',name:'ソクラテス田中',catch:'「そもそも売上とは何でしょうか」',traits:['本質','議論','納期無視'],tech:5,culture:8,revenue:-4,chaos:6,color:'#efe3d6',tags:['philosophy','culture']},
    {id:'investor',emoji:'🦈',role:'投資家',name:'鮫島 キャピタル',catch:'入社希望なのに、逆に株を欲しがっている。',traits:['資金調達','圧','EXIT'],tech:0,culture:-5,revenue:16,chaos:9,color:'#dbeaf2',tags:['finance','ipo']},
    {id:'designer',emoji:'🎨',role:'天才デザイナー',name:'色部 アオ',catch:'「機能はそのままで、世界観だけ変えます」',traits:['ブランド','美学','ピクセル警察'],tech:6,culture:5,revenue:8,chaos:2,color:'#f5dfc9',tags:['design','product']},
    {id:'researcher',emoji:'🥼',role:'謎の研究者',name:'白石 Dr.',catch:'面接に培養槽を持ってきた。',traits:['研究','特許','倫理審査中'],tech:18,culture:-4,revenue:1,chaos:13,color:'#dff2ea',tags:['research','science']},
    {id:'comedian',emoji:'🤡',role:'元お笑い芸人',name:'笑福亭 KPI',catch:'「スベったら、撤退判断ってことで」',traits:['ムード','企画','ふざける'],tech:0,culture:15,revenue:5,chaos:8,color:'#ffe5b7',tags:['culture','media']},
    {id:'manager',emoji:'👔',role:'大企業の部長',name:'稟議 守',catch:'「まず会議体を設計しましょう」',traits:['管理','稟議','Excel'],tech:2,culture:1,revenue:6,chaos:-7,color:'#dfe6ed',tags:['manager','order']},
    {id:'intern',emoji:'🧑‍🎓',role:'大学1年生',name:'若葉 ハル',catch:'経験ゼロ。質問だけは100個ある。',traits:['成長','素直','給料安い'],tech:4,culture:10,revenue:1,chaos:1,color:'#e3f1dc',tags:['junior','culture']},
    {id:'chef',emoji:'👨‍🍳',role:'元三つ星シェフ',name:'味岡 レン',catch:'なぜIT企業に来たのか、本人も知らない。',traits:['福利厚生','執念','包丁'],tech:1,culture:14,revenue:4,chaos:7,color:'#f0e8db',tags:['food','culture']},
    {id:'yakuza',emoji:'😎',role:'交渉のプロ',name:'龍崎 ジン',catch:'前職については「聞かない方がいい」。',traits:['交渉','忠義','圧が強い'],tech:0,culture:2,revenue:14,chaos:16,color:'#e4e0df',tags:['sales','chaos']},
    {id:'child',emoji:'🧒',role:'12歳の起業家',name:'天城 ミライ',catch:'すでに会社を2社売却済み。保護者同伴。',traits:['発想','Z世代','22時退社'],tech:12,culture:5,revenue:10,chaos:8,color:'#dcecff',tags:['genius','junior']},
    {id:'grandma',emoji:'👵',role:'町内会の会長',name:'米山 フミ',catch:'社員より顧客の家族構成に詳しい。',traits:['口コミ','世話焼き','最強コミュ力'],tech:-2,culture:15,revenue:11,chaos:2,color:'#f5e6d5',tags:['sales','senior']},
    {id:'robotics',emoji:'🦾',role:'ロボット博士',name:'鉄野 ギア',catch:'「人手不足？ 人を増やすからですよ」',traits:['自動化','機械愛','危険物'],tech:19,culture:-4,revenue:5,chaos:9,color:'#dae8ef',tags:['engineer','science']},
    {id:'psychic',emoji:'🔮',role:'占い師',name:'星見 ルナ',catch:'明日の売上だけ、なぜか当たる。',traits:['予言','採用勘','根拠なし'],tech:-2,culture:9,revenue:8,chaos:14,color:'#ebdff8',tags:['mystic','culture']},
    {id:'athlete',emoji:'🏃',role:'元オリンピアン',name:'速水 リク',catch:'KPIを見ると走り出す。',traits:['実行力','朝型','全部競争'],tech:1,culture:12,revenue:7,chaos:3,color:'#dff0dc',tags:['execution','culture']},
    {id:'copywriter',emoji:'✍️',role:'コピーライター',name:'言葉 ミコト',catch:'商品名を変えただけで、売上が伸びた。',traits:['言語化','広告','締切前覚醒'],tech:1,culture:5,revenue:13,chaos:3,color:'#f4eadf',tags:['media','design']},
    {id:'opensource',emoji:'🧑‍🔬',role:'OSS原理主義者',name:'Free 山田',catch:'「全部公開しましょう。コードも給与も」',traits:['共有','開発力','秘密がない'],tech:14,culture:7,revenue:-2,chaos:11,color:'#e0f2e7',tags:['engineer','community']},
    {id:'priest',emoji:'🧘',role:'僧侶',name:'無量寺 空',catch:'Slackの通知を全部「無」にする。',traits:['平常心','相談役','利益に執着なし'],tech:-1,culture:18,revenue:-3,chaos:-3,color:'#efe5c9',tags:['culture','mystic']},
    {id:'spy',emoji:'🥸',role:'競合出身の謎社員',name:'鈴木（仮）',catch:'競合の新製品を、なぜか全部知っている。',traits:['情報','二重スパイ？','偽名'],tech:8,culture:-8,revenue:12,chaos:15,color:'#e3e1db',tags:['spy','chaos']},
    {id:'farmer',emoji:'🧑‍🌾',role:'農家',name:'土井 ミノル',catch:'「会社も畑も、土づくりからです」',traits:['長期目線','堅実','季節休暇'],tech:2,culture:12,revenue:5,chaos:-5,color:'#e4ecd7',tags:['craft','culture']},
    {id:'gamer',emoji:'🎮',role:'世界王者ゲーマー',name:'NOOB_KING',catch:'負け筋を見つけるのが異常に速い。',traits:['最適化','集中','昼夜逆転'],tech:11,culture:3,revenue:5,chaos:5,color:'#dfe0f5',tags:['execution','junior']},
    {id:'support',emoji:'🎧',role:'伝説のCS',name:'聞上 サトミ',catch:'怒鳴っていた顧客が、最後には友達になる。',traits:['顧客理解','傾聴','電話長め'],tech:1,culture:13,revenue:9,chaos:-3,color:'#e0eef1',tags:['customer','culture']},
    {id:'inventor',emoji:'🛠️',role:'発明家',name:'珍田 エジソン',catch:'面接室の椅子を勝手に改造した。',traits:['発明','試作','よく爆発'],tech:16,culture:1,revenue:6,chaos:14,color:'#f4e4bd',tags:['engineer','product']},
    {id:'exceo',emoji:'🧑‍💼',role:'元CEO',name:'社長だった人',catch:'「役職は何でもいいです。たぶん」',traits:['経営','プライド','社長癖'],tech:4,culture:-3,revenue:12,chaos:7,color:'#e1e5eb',tags:['manager','ipo']},
    {id:'dog',emoji:'🐕',role:'犬',name:'営業二課 ポチ',catch:'名刺交換だけ異様にうまい。',traits:['忠誠','散歩','好感度'],tech:0,culture:16,revenue:7,chaos:5,color:'#f3e6cc',tags:['animal','sales']},
    {id:'alien',emoji:'👽',role:'宇宙人',name:'Ξ-44',catch:'日本語は完璧。地球の商習慣だけ知らない。',traits:['異星技術','異文化','在留資格？'],tech:20,culture:-2,revenue:3,chaos:20,color:'#d9f0d3',tags:['future','science']},
    {id:'clone',emoji:'👥',role:'双子（1枠扱い）',name:'佐藤・佐藤',catch:'「給与は1人分で大丈夫です」',traits:['二人いる','同期','たまに入替'],tech:9,culture:8,revenue:8,chaos:10,color:'#e5dded',tags:['chaos','execution']},
    {id:'idol',emoji:'🎤',role:'地下アイドル',name:'推野 ミライ',catch:'社内会議にファンが来る。',traits:['ファン','イベント','本番強い'],tech:-1,culture:12,revenue:12,chaos:10,color:'#f9dce8',tags:['media','culture']},
    {id:'minimalist',emoji:'🧹',role:'断捨離コンサル',name:'無田 ナシ',catch:'初日に会議を半分、資料を9割消します。',traits:['効率','削除','私物禁止'],tech:5,culture:0,revenue:8,chaos:-8,color:'#ebe9e1',tags:['order','execution']},
    {id:'union',emoji:'📣',role:'労務の達人',name:'権田 マモル',catch:'「健康な会社しか、長く勝てません」',traits:['労務','公平','残業嫌い'],tech:0,culture:16,revenue:1,chaos:-7,color:'#e3e9f1',tags:['hr','order']},
    {id:'vcgirl',emoji:'💸',role:'VC育ちの若者',name:'月島 ARR',catch:'会話の半分が英語の略語。',traits:['成長率','資金調達','燃焼率'],tech:5,culture:-2,revenue:14,chaos:8,color:'#dbe9df',tags:['finance','ipo']},
    {id:'archaeologist',emoji:'🏺',role:'考古学者',name:'古森 ハッカ',catch:'競合分析に3000年前の事例を持ってくる。',traits:['長期史観','発見','現代に弱い'],tech:7,culture:7,revenue:2,chaos:4,color:'#efe0c7',tags:['research','philosophy']},
    {id:'musician',emoji:'🎸',role:'バンドマン',name:'爆音 タケル',catch:'「チームって、バンドと同じっすよ」',traits:['熱量','ライブ','金欠'],tech:1,culture:13,revenue:4,chaos:11,color:'#ecdede',tags:['culture','media']},
    {id:'logistic',emoji:'📦',role:'物流の鬼',name:'箱崎 トオル',catch:'人を見ると動線を引きたくなる。',traits:['効率','在庫','整理'],tech:7,culture:0,revenue:10,chaos:-6,color:'#e9e5d7',tags:['execution','order']},
    {id:'doctor',emoji:'🩺',role:'元救急医',name:'命守 ヒカル',catch:'障害対応で誰よりも落ち着いている。',traits:['危機対応','体調管理','夜勤慣れ'],tech:5,culture:14,revenue:2,chaos:-7,color:'#e1eff0',tags:['culture','security']},
    {id:'nepo',emoji:'🧑‍🍼',role:'社長の知り合いの子',name:'コネ田 コネ夫',catch:'能力は不明。紹介者だけ超大物。',traits:['コネ','未知数','空気読まない'],tech:0,culture:-6,revenue:12,chaos:13,color:'#f1dfce',tags:['sales','chaos']},
    {id:'translator',emoji:'🗣️',role:'12言語の通訳',name:'橋渡 リン',catch:'会議の「空気」まで翻訳する。',traits:['多言語','調整','海外'],tech:2,culture:11,revenue:9,chaos:1,color:'#e0edf2',tags:['sales','culture']},
    {id:'teacher',emoji:'🧑‍🏫',role:'元・幼稚園の先生',name:'育野 メグ',catch:'大人30人を、5歳児より上手にまとめる。',traits:['育成','説明上手','怒らない'],tech:2,culture:17,revenue:2,chaos:-5,color:'#f3e4d5',tags:['hr','culture']},
    {id:'chess',emoji:'♟️',role:'チェス世界王者',name:'王手 ケイ',catch:'「三手先までは、だいたい見えます」',traits:['戦略','無表情','長考'],tech:8,culture:-1,revenue:10,chaos:0,color:'#e5e2dd',tags:['manager','execution']},
    {id:'bartender',emoji:'🍸',role:'伝説のバーテンダー',name:'夜城 ジン',catch:'顧客の本音を、二杯目までに聞き出す。',traits:['聞き上手','夜型','紹介'],tech:0,culture:13,revenue:11,chaos:4,color:'#eadfd8',tags:['customer','sales']},
    {id:'politician',emoji:'🎙️',role:'元・市長',name:'票田 ノボル',catch:'賛成0人の会議を、全会一致で終わらせる。',traits:['合意形成','演説','根回し'],tech:0,culture:8,revenue:10,chaos:7,color:'#dde6ef',tags:['manager','sales']},
    {id:'factory',emoji:'🏭',role:'工場長',name:'現場 カズオ',catch:'「机上の空論は、現場で3秒で分かる」',traits:['現場','改善','安全第一'],tech:9,culture:6,revenue:9,chaos:-6,color:'#e8e3d7',tags:['execution','order','craft']},
    {id:'angler',emoji:'🎣',role:'プロ釣り師',name:'待田 イサム',catch:'半年ボウズでも平気。待つ能力だけは異常。',traits:['忍耐','観察','朝4時'],tech:3,culture:9,revenue:4,chaos:-2,color:'#dce9df',tags:['research','culture']},
    {id:'angrycustomer',emoji:'😤',role:'元・激怒顧客',name:'客野 キビシ',catch:'御社に47件クレームを入れた後、応募してきた。',traits:['顧客目線','辛口','改善魔'],tech:5,culture:-5,revenue:13,chaos:8,color:'#f2dfd7',tags:['customer','product']},
    {id:'headhunter',emoji:'🦅',role:'伝説のヘッドハンター',name:'狩野 サエ',catch:'入社前から、次に採るべき人を3人連れてきた。',traits:['採用','人脈','口説く'],tech:0,culture:12,revenue:7,chaos:5,color:'#e6e0f0',tags:['hr','sales']},
    {id:'climate',emoji:'🌦️',role:'気候科学者',name:'天気森 ミナ',catch:'100年先のリスクを、今日の会議に持ち込む。',traits:['長期予測','データ','慎重'],tech:14,culture:3,revenue:1,chaos:-2,color:'#dcedee',tags:['research','science']},
    {id:'magician',emoji:'🎩',role:'プロマジシャン',name:'幻堂 クロ',catch:'予算が足りないと、予算書から数字を消す。',traits:['演出','観察','種明かし禁止'],tech:3,culture:11,revenue:9,chaos:12,color:'#eadcf0',tags:['media','chaos']},
    {id:'nomad',emoji:'🧳',role:'世界を旅するノマド',name:'風来 ソラ',catch:'住所はない。顧客は27か国にいる。',traits:['海外','自由','時差'],tech:6,culture:5,revenue:11,chaos:6,color:'#e8ead6',tags:['sales','community']}
  ];

  const SYNERGIES = [
    {a:'engineer',b:'sales',text:'開発と営業が意気投合。まだない製品を売って、その夜に作った。',d:{revenue:18,tech:6,culture:4,chaos:5}},
    {a:'cat',b:'hr',text:'猫が人事面談に同席。なぜか離職率がゼロになった。',d:{culture:18,revenue:4,chaos:-3}},
    {a:'cat',b:'dog',text:'社内が犬派と猫派に二分。だが採用広報は過去最高に伸びた。',d:{culture:4,revenue:10,chaos:13}},
    {a:'ai',b:'senior',text:'AIと100歳級の知恵が融合。誰も説明できない新製品が完成した。',d:{tech:20,revenue:13,chaos:8}},
    {a:'hacker',b:'security',text:'ハッカーと警備担当が一晩中攻防。朝にはセキュリティが異常に強くなった。',d:{tech:14,chaos:-10,culture:-2}},
    {a:'media',b:'legal',text:'炎上寸前の投稿を法務が3秒で止めた。話題だけ残り、売上が伸びた。',d:{revenue:15,chaos:-8}},
    {a:'cult',b:'philosophy',text:'朝礼が「会社とは何か」という2時間の問答になった。社員の目が妙に輝いている。',d:{culture:12,chaos:18,revenue:-4}},
    {a:'future',b:'research',text:'未来知識を研究チームが論文にした。まだ存在しない市場の特許を出願。',d:{tech:22,revenue:11,chaos:10}},
    {a:'finance',b:'ipo',text:'財務チームが深夜に集結。「上場」という単語が社内で飛び交い始めた。',d:{revenue:18,chaos:-3}},
    {a:'design',b:'media',text:'ブランドが急に洗練され、何を売っている会社か分からないのに人気になった。',d:{revenue:16,culture:5}},
    {a:'craft',b:'engineer',text:'手仕事と自動化が衝突。喧嘩の末、量産できる職人技が生まれた。',d:{tech:14,revenue:12,culture:3}},
    {a:'mystic',b:'finance',text:'占いと経理の予測が一致。全員が怖くなってその数字を信じた。',d:{revenue:12,chaos:9}},
    {a:'animal',b:'media',text:'社員動物の動画が世界で拡散。本業よりチャンネル収益が大きくなった。',d:{revenue:17,culture:8,chaos:6}},
    {a:'manager',b:'junior',text:'元部長が若手に教えるつもりが、逆に全部の会議を廃止された。',d:{tech:6,culture:9,chaos:-4}},
    {a:'science',b:'chaos',text:'危険なアイデアを「一回だけ」で試した。爆発したが、特許も取れた。',d:{tech:15,revenue:8,chaos:16,culture:-3}},
    {a:'order',b:'chaos',text:'秩序派とカオス派が大激論。ルールが半分になり、なぜか仕事は速くなった。',d:{tech:5,revenue:7,culture:2,chaos:-3}},
    {a:'customer',b:'product',text:'顧客の声がその日のうちに製品へ反映され、熱狂的なファンが生まれた。',d:{revenue:14,tech:7,culture:5}},
    {a:'community',b:'media',text:'全部公開したらコミュニティが勝手に宣伝と改善を始めた。',d:{tech:9,revenue:11,culture:8,chaos:5}}
  ];

  const SMALL_EVENTS = [
    {need:'culture',text:'昼休みに雑談から新企画が生まれた。',d:{revenue:5,culture:3}},
    {need:'engineer',text:'深夜に勝手な改善が入り、翌朝ちょっと便利になっていた。',d:{tech:6,chaos:2}},
    {need:'sales',text:'誰かが偶然、大口顧客を連れてきた。',d:{revenue:8}},
    {need:'order',text:'散らかっていた業務フローが整理された。',d:{chaos:-5,tech:2}},
    {need:'media',text:'会社の何気ない一枚がSNSで伸びた。',d:{revenue:6,chaos:3}},
    {need:'chaos',text:'誰の許可もない新プロジェクトが始まった。',d:{tech:4,revenue:3,chaos:6}},
    {need:'research',text:'「使い道は後で考える」技術がひとつ完成した。',d:{tech:8,chaos:3}},
    {need:'finance',text:'見落としていた収益源が発見された。',d:{revenue:7}},
    {need:'animal',text:'取引先が社員動物に会いに来て、そのまま契約した。',d:{revenue:6,culture:5}},
    {need:'junior',text:'若手の「なんで？」から、古いルールがひとつ消えた。',d:{culture:4,chaos:-2}}
  ];

  const state = {day:1,revenue:0,tech:0,culture:50,chaos:0,employees:[],used:new Set(),events:[],locked:false,lastPair:[],synergyKeys:new Set()};

  const els = {
    day:$('#dayLabel'),revenue:$('#revenueValue'),tech:$('#techValue'),culture:$('#cultureValue'),chaos:$('#chaosValue'),headcount:$('#headcountValue'),team:$('#team'),candidates:$('#candidates'),eventText:$('#eventText'),eventStrip:$('#eventStrip'),officeShell:$('#officeShell'),officeStage:$('#officeStage'),whiteboard:$('#whiteboardText'),logCount:$('#logCount'),timeline:$('#timeline'),intro:$('#introModal'),log:$('#logModal'),ending:$('#endingModal'),toast:$('#toast')
  };

  function resetState(){
    Object.assign(state,{day:1,revenue:0,tech:0,culture:50,chaos:0,employees:[],used:new Set(),events:[],locked:false,lastPair:[],synergyKeys:new Set()});
    els.team.innerHTML='';
    els.timeline.innerHTML='';
    els.eventText.textContent='履歴書が2通届いた。今日採れるのは、1人だけ。';
    updateAll();
  }

  function formatRevenue(v){ return v>=1000 ? `${(v/1000).toFixed(v>=10000?0:1)}億` : `${Math.max(0,v)}万`; }
  function scoreLabel(v){ if(v>=150)return '神'; if(v>=100)return 'S'; if(v>=70)return 'A'; if(v>=45)return 'B'; if(v>=20)return 'C'; return 'D'; }

  function updateMetric(key,delta){
    const id = key==='revenue'?'revenueDelta':key==='tech'?'techDelta':key==='culture'?'cultureDelta':'chaosDelta';
    const n=$("#"+id); if(!n||!delta)return;
    n.textContent=(delta>0?'+':'')+delta;
    n.style.color=delta>0?'#2d7d54':'#c34237';
    n.classList.remove('pop'); void n.offsetWidth; n.classList.add('pop');
  }

  function applyDelta(d={},silent=false){
    for(const key of ['revenue','tech','culture','chaos']){
      const val=d[key]||0; if(!val)continue;
      state[key]+=val;
      if(key==='culture')state[key]=clamp(state[key],0,200);
      if(key==='chaos')state[key]=clamp(state[key],0,250);
      if(!silent)updateMetric(key,val);
    }
    updateAll();
  }

  function updateAll(){
    els.day.textContent=`DAY ${state.day}`;
    els.revenue.textContent=formatRevenue(state.revenue);
    els.tech.textContent=state.tech;
    els.culture.textContent=state.culture;
    els.chaos.textContent=state.chaos;
    els.headcount.textContent=state.employees.length;
    els.logCount.textContent=state.events.length;
    updateOfficeStage();
  }

  function updateOfficeStage(){
    const n=state.employees.length;
    let stage=1,label='創業初日',board='最初の一人を\n採用しよう';
    if(n>=25){stage=5;label='上場前夜';board='DAY 30\n生き残れ';}
    else if(n>=18){stage=4;label='急成長オフィス';board='採用が\n会社を変える';}
    else if(n>=11){stage=3;label='拡張フロア';board='次の柱を\nつくれ';}
    else if(n>=5){stage=2;label='小さな会社';board='チームが\nできてきた';}
    els.officeShell.className=`office-shell stage-${stage}`;
    els.officeStage.textContent=label;
    els.whiteboard.innerHTML=board.replace('\n','<br>');
  }

  function getPair(){
    const available=CANDIDATES.filter(c=>!state.used.has(c.id));
    if(available.length<2) CANDIDATES.forEach(c=>state.used.delete(c.id));
    let pool=CANDIDATES.filter(c=>!state.used.has(c.id));
    let pair=shuffle(pool).slice(0,2);
    if(state.day===1){
      const starters=CANDIDATES.filter(c=>['genius','salesgod','cat','oldman'].includes(c.id));
      pair=shuffle(starters).slice(0,2);
    }
    state.lastPair=pair;
    pair.forEach(c=>state.used.add(c.id));
    return pair;
  }

  function signal(v){ return v>=15?'★★★★★':v>=10?'★★★★':v>=5?'★★★':v>=1?'★★':'★'; }

  function renderCandidates(){
    const pair=getPair();
    els.candidates.innerHTML=pair.map((c,i)=>`
      <article class="candidate" data-id="${c.id}" style="--avatar:${c.color};--accent:${i===0?'#3569dd':'#d54d42'}">
        <div class="candidate-top"><div class="candidate-avatar">${c.emoji}</div><div class="candidate-meta"><div class="candidate-role">${c.role}</div><div class="candidate-name">${c.name}</div></div></div>
        <div class="candidate-catch">${c.catch}</div>
        <div class="traits">${c.traits.map(t=>`<span class="trait">${t}</span>`).join('')}</div>
        <div class="candidate-signals">
          <div class="signal"><span>稼ぐ</span><b>${signal(Math.max(0,c.revenue))}</b></div>
          <div class="signal"><span>つくる</span><b>${signal(Math.max(0,c.tech))}</b></div>
          <div class="signal"><span>クセ</span><b>${signal(Math.max(0,c.chaos))}</b></div>
        </div>
        <button class="hire-button" type="button" data-hire="${c.id}">この人を採用</button>
      </article>`).join('');
    els.candidates.querySelectorAll('[data-hire]').forEach(btn=>btn.addEventListener('click',()=>hire(btn.dataset.hire)));
  }

  function employeeNode(c){
    const wrap=document.createElement('div');
    wrap.className='employee'; wrap.dataset.id=c.id; wrap.title=`${c.role} / ${c.name}`;
    wrap.innerHTML=`<span class="person-avatar" style="background:${c.color}">${c.emoji}</span><small>${c.name.replace(/ .*/, '')}</small>`;
    return wrap;
  }

  function addEvent(text,type='normal'){
    const entry={day:state.day,text,type}; state.events.unshift(entry);
    els.eventText.textContent=text;
    els.eventStrip.classList.remove('flash'); void els.eventStrip.offsetWidth; els.eventStrip.classList.add('flash');
    els.logCount.textContent=state.events.length;
    renderTimeline();
  }

  function renderTimeline(){
    els.timeline.innerHTML=state.events.map(e=>`<div class="timeline-item"><div class="timeline-day">DAY ${e.day}</div><p>${e.type==='hire'?'<strong>採用</strong> ':''}${e.text}</p></div>`).join('') || '<div class="timeline-item"><p>まだ何も起きていない。</p></div>';
  }

  function findSynergy(newHire){
    const others=shuffle(state.employees.filter(e=>e.id!==newHire.id));
    for(const other of others){
      for(const syn of SYNERGIES){
        const key=[newHire.id,other.id,syn.a,syn.b].sort().join(':');
        if(state.synergyKeys.has(key))continue;
        const match=(newHire.tags.includes(syn.a)&&other.tags.includes(syn.b))||(newHire.tags.includes(syn.b)&&other.tags.includes(syn.a));
        if(match){state.synergyKeys.add(key);return {syn,other};}
      }
    }
    return null;
  }

  function maybeSmallEvent(newHire){
    if(Math.random()>.36)return null;
    const tags=new Set(state.employees.flatMap(e=>e.tags));
    const possible=SMALL_EVENTS.filter(e=>tags.has(e.need));
    if(!possible.length)return null;
    return pick(possible);
  }

  function hire(id){
    if(state.locked)return; state.locked=true;
    const chosen=state.lastPair.find(c=>c.id===id); if(!chosen)return;
    const cards=[...els.candidates.querySelectorAll('.candidate')];
    cards.forEach(card=>{card.querySelector('button').disabled=true;card.classList.toggle('chosen',card.dataset.id===id);card.classList.toggle('lost',card.dataset.id!==id)});

    state.employees.push(chosen);
    const node=employeeNode(chosen); els.team.appendChild(node);
    applyDelta({revenue:chosen.revenue,tech:chosen.tech,culture:chosen.culture,chaos:chosen.chaos});
    addEvent(`${chosen.role}「${chosen.name}」が入社した。`, 'hire');

    const synergy=findSynergy(chosen);
    const small=!synergy?maybeSmallEvent(chosen):null;
    setTimeout(()=>{
      if(synergy){
        applyDelta(synergy.syn.d);
        addEvent(synergy.syn.text,'synergy');
        [node,els.team.querySelector(`[data-id="${synergy.other.id}"]`)].filter(Boolean).forEach(n=>{n.classList.add('spark');setTimeout(()=>n.classList.remove('spark'),1000)});
      } else if(small){
        applyDelta(small.d);
        addEvent(small.text,'event');
      }
      setTimeout(nextDay,610);
    },500);
  }

  function nextDay(){
    if(state.day>=30){showEnding();return;}
    state.day++;
    state.locked=false;
    updateAll(); renderCandidates();
    window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});
  }

  function ending(){
    const count=(tag)=>state.employees.filter(e=>e.tags.includes(tag)).length;
    if(count('cat')>=1 && count('animal')>=3) return {icon:'🐾',title:'株式会社どうぶつ',text:'人間より動物社員の方が人気になり、本業よりグッズと配信で成長した。社長の席には猫が座っている。'};
    if(count('cult')>=1 && state.chaos>=155 && state.culture>=90) return {icon:'🔆',title:'宗教法人になった',text:'企業理念が強くなりすぎた。顧客は「会員」、朝礼は「儀式」、新入社員は「同志」と呼ばれている。売上は意外と悪くない。'};
    if(count('ai')>=1 && state.tech>=170 && state.chaos>=120) return {icon:'🤖',title:'AIに社長を解任された',text:'効率化は完璧だった。ある朝ログインすると、あなたの権限だけが消えていた。会社は史上最高益を更新中。'};
    if(count('ipo')>=2 && state.revenue>=300 && state.chaos<125) return {icon:'🔔',title:'上場しました',text:'30日で監査も組織も数字も整った。鐘を鳴らすあなたの後ろで、採らなかった人たちがニュースを見ている。'};
    if(state.revenue>=380 && state.tech>=150) return {icon:'🦄',title:'ユニコーン誕生',text:'何を売っているのか説明しづらいが、とにかく伸びた。世界中の投資家が「次の巨大企業」と呼び始めた。'};
    if(count('craft')>=3 && state.culture>=95) return {icon:'🪵',title:'世界一小さな名門企業',text:'急成長はしなかった。でも誰にも真似できない仕事が残った。予約は3年待ち、社員はほとんど辞めない。'};
    if(count('community')>=1 && state.tech>=130 && state.revenue<220) return {icon:'🌐',title:'会社をオープンソース化',text:'製品もノウハウも公開しすぎて会社の境界が消えた。世界中の知らない人が勝手に働いている。'};
    if(state.chaos>=185) return {icon:'🌋',title:'毎日が創業初日',text:'部署は生まれては消え、プロジェクト名は毎朝変わる。誰も会社の全貌を知らない。それでも妙に面白いものだけは生まれ続ける。'};
    if(state.culture<=35) return {icon:'🏚️',title:'社員が静かに消えた',text:'数字だけを追いすぎた。オフィスは立派なのに、チャットには誰も返事をしない。最後に残ったのは観葉植物だった。'};
    if(state.tech>=175 && state.revenue<180) return {icon:'🧪',title:'すごいものはできた',text:'世界初の技術が12個、売上につながった技術は0個。研究者たちは最高に楽しそうなので、たぶん成功。'};
    if(state.revenue>=300) return {icon:'💰',title:'めちゃくちゃ儲かった',text:'思想も技術もよく分からない。でも売れる人を採り続けた結果、現金だけは積み上がった。経営会議はいつも笑顔だ。'};
    if(state.culture>=145) return {icon:'🏡',title:'会社が家族になった',text:'売上会議より誕生日会の方が多い。成長はゆっくりだが、退職者はゼロ。月曜を嫌う社員もほとんどいない。'};
    return {icon:'🏢',title:'ふつうに良い会社',text:'派手な事件は起きなかった。でも30人が働き、顧客がいて、明日も会社は開く。それは意外とすごいことかもしれない。'};
  }

  function showEnding(){
    const e=ending();
    $('#endingIcon').textContent=e.icon; $('#endingTitle').textContent=e.title; $('#endingText').textContent=e.text;
    $('#endingStats').innerHTML=`
      <div class="ending-stat"><span>売上</span><b>${formatRevenue(state.revenue)}</b></div>
      <div class="ending-stat"><span>技術</span><b>${scoreLabel(state.tech)}</b></div>
      <div class="ending-stat"><span>組織</span><b>${scoreLabel(state.culture)}</b></div>
      <div class="ending-stat"><span>カオス</span><b>${scoreLabel(state.chaos)}</b></div>`;
    $('#endingCast').innerHTML=state.employees.map(x=>`<span title="${x.role} ${x.name}">${x.emoji}</span>`).join('');
    els.ending.classList.add('show');
  }

  async function shareResult(){
    const title=$('#endingTitle').textContent;
    const text=`「一人だけ採用」30日経営した結果：${title}\n売上 ${formatRevenue(state.revenue)} / 技術 ${scoreLabel(state.tech)} / 組織 ${scoreLabel(state.culture)} / カオス ${scoreLabel(state.chaos)}`;
    try{
      if(navigator.share) await navigator.share({title:'一人だけ採用',text,url:location.href});
      else {await navigator.clipboard.writeText(`${text}\n${location.href}`);showToast('結果をコピーしました');}
    }catch(e){ if(e && e.name!=='AbortError')showToast('共有できませんでした'); }
  }

  let toastTimer;
  function showToast(t){els.toast.textContent=t;els.toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>els.toast.classList.remove('show'),1800)}

  $('#startButton').addEventListener('click',()=>{els.intro.classList.remove('show');resetState();renderCandidates()});
  $('#logButton').addEventListener('click',()=>{renderTimeline();els.log.classList.add('show')});
  $('#closeLog').addEventListener('click',()=>els.log.classList.remove('show'));
  els.log.addEventListener('click',e=>{if(e.target===els.log)els.log.classList.remove('show')});
  $('#restartButton').addEventListener('click',()=>{els.ending.classList.remove('show');resetState();renderCandidates();window.scrollTo({top:0,behavior:'smooth'})});
  $('#shareButton').addEventListener('click',shareResult);

  updateAll();
})();
