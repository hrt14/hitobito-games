(() => {
  'use strict';

  const CATEGORIES = {
    person: { label: '人', emoji: '👤', color: '#ff8fb8', lens: '人を見る' },
    system: { label: '仕組み', emoji: '⚙️', color: '#b49cff', lens: '仕組みを見る' },
    tool: { label: '道具', emoji: '🧰', color: '#66d9ff', lens: '道具を見る' },
    energy: { label: 'エネルギー', emoji: '⚡', color: '#ffcc68', lens: 'エネルギーを見る' },
    nature: { label: '自然', emoji: '🌿', color: '#77e3ad', lens: '自然を見る' },
    history: { label: '蓄積', emoji: '📚', color: '#ff9f7f', lens: '時間を戻す' }
  };

  const LENS_ORDER = ['person', 'system', 'tool', 'energy', 'nature', 'history'];

  const s = (name, emoji, category, depth, why) => ({ name, emoji, category, depth, why, correct: true });
  const d = (name, emoji, why = 'この場面を直接は支えていない') => ({ name, emoji, correct: false, why });

  const SCENES = [
    {
      id: 'water', title: '水道をひねる', icon: '🚰', noun: '水道', level: 1,
      supports: [
        s('水道局','🏢','person',1,'水を届ける仕事を動かす'), s('配管工','🧑‍🔧','person',2,'管をつなぎ、直す'),
        s('浄水場','🏭','system',2,'水を安全に処理する'), s('水質検査','🧪','system',3,'安全を確かめ続ける'),
        s('配水管','🪈','tool',1,'家まで水を運ぶ'), s('ポンプ','🔩','tool',3,'水を押し出す'),
        s('電力','⚡','energy',3,'ポンプや設備を動かす'), s('ダム','🌊','system',3,'水量を蓄え調整する'),
        s('川','🏞️','nature',3,'水源になる'), s('雨','🌧️','nature',4,'水源を補給する'),
        s('森','🌲','nature',4,'水を蓄え流れを整える'), s('土木技術','📐','history',4,'長年の設計知識が網を作った'),
        s('衛生の知識','📘','history',4,'安全な水の基準を積み上げた'), s('道路工事の人','👷','person',2,'地下の配管を維持する')
      ],
      decoys: [d('映画館','🎬'), d('宇宙服','🧑‍🚀'), d('花火大会','🎆'), d('サーフボード','🏄')]
    },
    {
      id: 'train', title: '電車に乗る', icon: '🚃', noun: '電車', level: 1,
      supports: [
        s('運転士','🧑‍✈️','person',1,'列車を安全に動かす'), s('駅員','🧑‍💼','person',1,'駅の流れと安全を支える'),
        s('整備士','🧑‍🔧','person',2,'車両を点検し続ける'), s('ダイヤ','🗓️','system',2,'大量の列車を衝突なく組む'),
        s('信号システム','🚦','system',2,'列車同士の間隔を守る'), s('線路','🛤️','tool',1,'列車の道になる'),
        s('架線','〰️','tool',2,'車両へ電気を届ける'), s('電力','⚡','energy',2,'モーターを動かす'),
        s('変電所','🔋','energy',3,'電圧を列車向けに変える'), s('鉄','🔩','nature',4,'線路や車両の材料になる'),
        s('都市計画','🗺️','history',4,'駅と路線の配置を積み重ねた'), s('鉄道技術','📚','history',4,'安全運行の知識を積み上げた'),
        s('清掃員','🧹','person',2,'車内と駅を使える状態に保つ'), s('保線作業','🛠️','system',3,'夜間も線路を点検する')
      ],
      decoys: [d('漁網','🎣'), d('天体望遠鏡','🔭'), d('サボテン','🌵'), d('スキー板','🎿')]
    },
    {
      id: 'light', title: '部屋の明かりをつける', icon: '💡', noun: '明かり', level: 1,
      supports: [
        s('発電所の人','👷','person',2,'電力を作る設備を運用する'), s('電気工事士','🧑‍🔧','person',2,'家まで安全に配線する'),
        s('送電網','🗼','system',2,'遠くの電気を運ぶ'), s('需給調整','📊','system',3,'使う量と作る量を合わせる'),
        s('電線','🔌','tool',1,'電気を部屋まで運ぶ'), s('電球','💡','tool',1,'電気を光に変える'),
        s('発電','⚡','energy',2,'光の元になる電気を作る'), s('変圧器','🔋','energy',3,'使える電圧へ変える'),
        s('水・風・燃料','🌬️','nature',4,'発電の元になる'), s('銅','🟤','nature',4,'電線の材料になる'),
        s('電気の研究','🧠','history',4,'安全に扱う知識を積み上げた'), s('規格','📏','history',4,'電圧や器具の互換性を作った'),
        s('検針・保守','🧰','person',3,'故障を見つけ復旧する'), s('ブレーカー','🎚️','system',2,'異常時に電気を止める')
      ],
      decoys: [d('砂時計','⌛'), d('釣り竿','🎣'), d('太鼓','🥁'), d('水中メガネ','🥽')]
    },
    {
      id: 'road', title: '道を歩く', icon: '🚶', noun: '道', level: 1,
      supports: [
        s('道路作業員','👷','person',1,'傷んだ道を補修する'), s('清掃員','🧹','person',2,'通れる状態を保つ'),
        s('交通ルール','📕','system',2,'人と車の動きを整理する'), s('排水','🕳️','system',2,'雨水を道から逃がす'),
        s('アスファルト','⬛','tool',1,'歩ける表面を作る'), s('街灯','🏮','tool',2,'夜も見えるようにする'),
        s('電力','⚡','energy',3,'街灯や信号を動かす'), s('石油','🛢️','nature',4,'舗装材の原料になる'),
        s('砂・石','🪨','nature',3,'路盤を支える'), s('測量','📐','history',3,'安全な勾配と位置を測る'),
        s('都市の設計','🗺️','history',4,'人が移動する道を積み上げた'), s('信号','🚦','system',2,'交差点を安全に使う'),
        s('植栽管理','🌳','person',3,'倒木や枝の危険を減らす'), s('横断歩道','🦓','tool',2,'渡る位置を共有する')
      ],
      decoys: [d('潜水艦','🚤'), d('将棋盤','♟️'), d('ハンモック','🏕️'), d('顕微鏡','🔬')]
    },
    {
      id: 'convenience', title: 'コンビニで買う', icon: '🏪', noun: 'コンビニ', level: 2,
      supports: [
        s('店員','🧑‍💼','person',1,'品出しと会計をする'), s('配送ドライバー','🚚','person',2,'商品を店へ運ぶ'),
        s('発注システム','📲','system',2,'売れ方に合わせ補充する'), s('物流網','🗺️','system',2,'多店舗へ商品を分ける'),
        s('レジ','🧾','tool',1,'会計を処理する'), s('冷蔵庫','🧊','tool',2,'食品を適温に保つ'),
        s('電力','⚡','energy',2,'店の設備を動かす'), s('燃料','⛽','energy',3,'配送を動かす'),
        s('農家','🧑‍🌾','person',3,'食品の原料を作る'), s('水・土・太陽','☀️','nature',4,'食べ物の元を育てる'),
        s('包装技術','📦','history',4,'長く安全に運ぶ知識'), s('商品開発','🧠','history',3,'買いやすい商品を設計する'),
        s('工場','🏭','system',3,'大量に安定生産する'), s('清掃','🧹','person',2,'店を使える状態に保つ')
      ],
      decoys: [d('スケートリンク','⛸️'), d('潜望鏡','🔭'), d('火山口','🌋'), d('ヨット','⛵')]
    },
    {
      id: 'breakfast', title: '朝ごはんを食べる', icon: '🍚', noun: '朝ごはん', level: 2,
      supports: [
        s('農家','🧑‍🌾','person',2,'食材を育てる'), s('漁師','🎣','person',2,'魚介を獲る'),
        s('流通','🚚','system',2,'食材を店まで動かす'), s('食品検査','🧪','system',3,'安全性を確認する'),
        s('炊飯器','🍚','tool',1,'米を炊く'), s('冷蔵庫','🧊','tool',2,'食材を保存する'),
        s('ガス・電気','🔥','energy',2,'調理を可能にする'), s('水','💧','nature',3,'調理と作物に必要'),
        s('土','🌱','nature',4,'作物を育てる'), s('太陽','☀️','nature',4,'植物を育てる'),
        s('品種改良','🌾','history',4,'食べやすい作物を育ててきた'), s('料理の知識','📖','history',3,'調理方法を受け継いだ'),
        s('食器を作る人','🏺','person',3,'食べる道具を作る'), s('衛生ルール','🧼','system',3,'食中毒を減らす')
      ],
      decoys: [d('人工衛星','🛰️'), d('ボウリング球','🎳'), d('潜水服','🤿'), d('絵筆','🖌️')]
    },
    {
      id: 'delivery', title: '荷物が届く', icon: '📦', noun: '宅配', level: 2,
      supports: [
        s('配達員','🧑‍🚚','person',1,'最後に家まで運ぶ'), s('仕分けスタッフ','🧑‍🏭','person',2,'荷物を行き先別に分ける'),
        s('住所制度','🏠','system',2,'届け先を特定できる'), s('追跡システム','📍','system',2,'荷物の現在地を共有する'),
        s('トラック','🚚','tool',1,'大量の荷物を運ぶ'), s('バーコード','▥','tool',2,'荷物を機械で識別する'),
        s('燃料','⛽','energy',2,'車を動かす'), s('電力','⚡','energy',3,'仕分け機を動かす'),
        s('道路','🛣️','system',2,'家まで運ぶ経路を作る'), s('紙・木','🌲','nature',4,'箱の材料になる'),
        s('物流技術','📚','history',4,'大量配送の方法を積み上げた'), s('地図','🗺️','history',3,'場所の知識を共有する'),
        s('整備士','🧑‍🔧','person',3,'配送車を動ける状態に保つ'), s('倉庫','🏭','tool',2,'荷物を一時保管する')
      ],
      decoys: [d('水族館','🐠'), d('トランペット','🎺'), d('雪だるま','⛄'), d('サーフィン','🏄')]
    },
    {
      id: 'cold-drink', title: '冷たい飲み物を飲む', icon: '🥤', noun: '冷たい飲み物', level: 2,
      supports: [
        s('飲料工場の人','🧑‍🏭','person',2,'飲み物を製造する'), s('配送員','🚚','person',2,'店まで冷たく運ぶ'),
        s('衛生管理','🧼','system',3,'安全な製造を保つ'), s('コールドチェーン','❄️','system',3,'低温を途切れさせない'),
        s('冷蔵庫','🧊','tool',1,'飲み物を冷やす'), s('ボトル','🧴','tool',2,'中身を保護する'),
        s('電力','⚡','energy',2,'冷却装置を動かす'), s('水','💧','nature',2,'飲み物の主原料'),
        s('砂糖の原料','🌿','nature',4,'味の元になる'), s('冷却技術','📘','history',4,'熱を移す知識を積み上げた'),
        s('容器設計','📐','history',4,'持ち運べる形にした'), s('自販機補充員','🧑‍🔧','person',2,'買える状態を維持する'),
        s('浄水','🏭','system',3,'原料水を処理する'), s('リサイクル','♻️','system',3,'容器を回収する仕組み')
      ],
      decoys: [d('望遠鏡','🔭'), d('スノーボード','🏂'), d('碁石','⚫'), d('風鈴','🎐')]
    },
    {
      id: 'phone', title: 'スマホを見る', icon: '📱', noun: 'スマホ', level: 3,
      supports: [
        s('基地局の保守員','🧑‍🔧','person',2,'通信設備を維持する'), s('アプリ開発者','🧑‍💻','person',2,'使える機能を作る'),
        s('通信網','📡','system',1,'データを行き来させる'), s('時刻同期','🕒','system',3,'通信機器の時間を揃える'),
        s('半導体','🔲','tool',2,'計算と通信を処理する'), s('タッチパネル','🪟','tool',1,'指の操作を読み取る'),
        s('バッテリー','🔋','energy',1,'持ち歩ける電力を蓄える'), s('電力','⚡','energy',2,'充電と基地局を動かす'),
        s('リチウム等の鉱物','⛏️','nature',4,'電子部品の材料になる'), s('シリコン','🏖️','nature',4,'半導体材料になる'),
        s('通信研究','📚','history',4,'無線で情報を送る知識'), s('文字と規格','🔤','history',4,'端末間で同じ情報を読める'),
        s('データセンター','🏢','system',3,'サービスを動かす計算機を置く'), s('海底ケーブル','🌊','tool',3,'大陸間のデータを運ぶ')
      ],
      decoys: [d('土鍋','🍲'), d('浮き輪','🛟'), d('竹馬','🎋'), d('スコップ','🪏')]
    },
    {
      id: 'work', title: 'パソコンで仕事をする', icon: '💻', noun: '仕事', level: 3,
      supports: [
        s('同僚','🧑‍🤝‍🧑','person',1,'情報や役割を分ける'), s('IT担当','🧑‍💻','person',2,'環境を使える状態に保つ'),
        s('会社のルール','📋','system',2,'仕事の分担と判断を揃える'), s('クラウド','☁️','system',2,'データと機能を共有する'),
        s('パソコン','💻','tool',1,'作業を処理する'), s('キーボード','⌨️','tool',1,'文字を入力する'),
        s('電力','⚡','energy',2,'端末とネットワークを動かす'), s('通信','📡','energy',2,'遠くと情報をやり取りする'),
        s('金属・鉱物','⛏️','nature',4,'端末の材料になる'), s('紙・木','🌲','nature',4,'資料や机の材料になる'),
        s('先人の知識','📚','history',3,'今の仕事の方法を積み上げた'), s('教育','🎓','history',3,'読み書きや専門知識を受け継ぐ'),
        s('清掃員','🧹','person',2,'働ける場所を維持する'), s('バックアップ','💾','system',3,'失敗時にデータを戻せる')
      ],
      decoys: [d('釣り船','🛥️'), d('テント','⛺'), d('サックス','🎷'), d('雪かき','🪏')]
    },
    {
      id: 'message', title: 'メッセージを送る', icon: '💬', noun: 'メッセージ', level: 3,
      supports: [
        s('通信技術者','🧑‍🔧','person',2,'ネットワークを維持する'), s('サービス開発者','🧑‍💻','person',2,'送受信機能を作る'),
        s('インターネット','🌐','system',1,'データの経路を作る'), s('ルーティング','🧭','system',3,'宛先まで経路を選ぶ'),
        s('基地局・Wi-Fi','📡','tool',2,'端末をネットへつなぐ'), s('サーバー','🗄️','tool',2,'メッセージを処理する'),
        s('電力','⚡','energy',2,'通信機器を動かす'), s('電波','〰️','energy',2,'空間を通って情報を運ぶ'),
        s('金属・鉱物','⛏️','nature',4,'機器の材料になる'), s('海','🌊','nature',4,'海底ケーブルの経路になる'),
        s('言語','🔤','history',3,'意味を共有できる'), s('通信規格','📘','history',4,'異なる機器同士をつなぐ'),
        s('暗号化','🔐','system',3,'内容を守って送る'), s('海底ケーブル敷設員','🚢','person',4,'大陸間の線を作り維持する')
      ],
      decoys: [d('フライパン','🍳'), d('縄跳び','🪢'), d('植木鉢','🪴'), d('そり','🛷')]
    },
    {
      id: 'elevator', title: 'エレベーターに乗る', icon: '🛗', noun: 'エレベーター', level: 3,
      supports: [
        s('保守員','🧑‍🔧','person',1,'定期点検と修理をする'), s('建築士','🧑‍🏗️','person',3,'建物と動線を設計する'),
        s('安全装置','🛑','system',2,'異常時に止める'), s('点検制度','📋','system',3,'保守を継続させる'),
        s('モーター','⚙️','tool',1,'かごを動かす'), s('ワイヤー','🪢','tool',2,'かごを支える'),
        s('電力','⚡','energy',1,'モーターを回す'), s('非常電源','🔋','energy',3,'停電時の安全を支える'),
        s('鉄','🔩','nature',4,'構造やレールの材料'), s('銅','🟤','nature',4,'モーターや配線の材料'),
        s('制御工学','📚','history',4,'滑らかに止める知識'), s('建築基準','📐','history',4,'安全条件を積み上げた'),
        s('センサー','📟','tool',2,'位置やドアを検知する'), s('遠隔監視','🖥️','system',3,'異常を早く見つける')
      ],
      decoys: [d('カヌー','🛶'), d('天ぷら鍋','🍤'), d('虫取り網','🦋'), d('砂浜','🏖️')]
    },
    {
      id: 'trash', title: 'ゴミが街から消える', icon: '🗑️', noun: 'ゴミ収集', level: 4,
      supports: [
        s('収集員','🧑‍🚒','person',1,'各家庭から回収する'), s('処理場の人','🧑‍🏭','person',2,'安全に処理する'),
        s('収集ルール','📅','system',1,'出す日と種類を揃える'), s('分別','♻️','system',2,'処理方法ごとに分ける'),
        s('収集車','🚛','tool',1,'大量のゴミを運ぶ'), s('焼却炉','🔥','tool',2,'ゴミを減量・処理する'),
        s('燃料','⛽','energy',2,'収集車を動かす'), s('電力','⚡','energy',3,'処理設備を動かす'),
        s('水','💧','nature',4,'処理や洗浄に使われる'), s('土地','🏞️','nature',4,'処理施設や最終処分に必要'),
        s('公衆衛生の知識','📚','history',4,'街を清潔に保つ知恵を積んだ'), s('リサイクル技術','🔁','history',4,'資源を再利用する方法を作った'),
        s('道路','🛣️','system',2,'収集ルートを支える'), s('車両整備','🧰','person',3,'収集車を止めない')
      ],
      decoys: [d('望遠鏡','🔭'), d('パラシュート','🪂'), d('琴','🎼'), d('スケート靴','⛸️')]
    },
    {
      id: 'dry-home', title: '雨でも家の中が濡れない', icon: '🏠', noun: '家', level: 4,
      supports: [
        s('大工','🧑‍🔨','person',1,'屋根と壁を作る'), s('防水職人','🧑‍🔧','person',2,'水の侵入を防ぐ'),
        s('排水設計','📐','system',2,'雨水を外へ逃がす'), s('建築基準','📋','system',3,'安全な作り方を定める'),
        s('屋根','🏠','tool',1,'雨を受け流す'), s('雨どい','〰️','tool',2,'雨水を集めて下へ流す'),
        s('ポンプ','⚙️','energy',3,'地下などの水を排出する'), s('木・石・土','🌲','nature',3,'家の材料になる'),
        s('雨','🌧️','nature',1,'防ぐ対象そのもの'), s('地形','⛰️','nature',4,'水の流れ方を左右する'),
        s('建築の知恵','📚','history',4,'長く雨を防ぐ方法を積み上げた'), s('材料科学','🧪','history',4,'防水材を改良してきた'),
        s('窓サッシ','🪟','tool',2,'開口部からの水を防ぐ'), s('下水・側溝','🕳️','system',3,'街全体で雨水を逃がす')
      ],
      decoys: [d('スノードーム','❄️'), d('グローブ','🥊'), d('チェス盤','♟️'), d('潜水艦','🚤')]
    },
    {
      id: 'signal', title: '信号がいつも動いている', icon: '🚦', noun: '信号', level: 4,
      supports: [
        s('保守員','🧑‍🔧','person',2,'故障を点検・修理する'), s('交通管制の人','🧑‍💼','person',2,'交通量を見て運用する'),
        s('信号制御','🧠','system',1,'交差点ごとの時間を管理する'), s('交通ルール','📕','system',2,'色の意味を全員で共有する'),
        s('LED','🔴','tool',1,'色を明るく表示する'), s('制御盤','🎛️','tool',2,'点灯順を切り替える'),
        s('電力','⚡','energy',1,'信号を動かす'), s('バックアップ電源','🔋','energy',3,'停電時を支える'),
        s('金属','🔩','nature',4,'柱や配線の材料になる'), s('シリコン','🏖️','nature',4,'制御部品の材料になる'),
        s('交通工学','📚','history',4,'安全な時間配分を研究した'), s('色の標準化','🎨','history',4,'赤黄青の意味を共有した'),
        s('道路センサー','📟','tool',3,'車の量を検知する'), s('監視ネットワーク','📡','system',3,'異常を遠隔で見つける')
      ],
      decoys: [d('ケーキ型','🎂'), d('寝袋','🛌'), d('水鉄砲','🔫'), d('編み針','🧶')]
    },
    {
      id: 'shop-open', title: '朝、店が開いている', icon: '🛍️', noun: '店', level: 4,
      supports: [
        s('開店準備する人','🧑‍💼','person',1,'客が来る前に店を整える'), s('清掃員','🧹','person',2,'使える状態に戻す'),
        s('シフト','🗓️','system',1,'必要な時間に人を配置する'), s('仕入れ','📦','system',2,'売る商品を補充する'),
        s('レジ','🧾','tool',1,'会計を処理する'), s('鍵・シャッター','🔑','tool',2,'閉店中の店を守る'),
        s('電力','⚡','energy',2,'照明やレジを動かす'), s('燃料','⛽','energy',3,'物流を動かす'),
        s('原材料','🌾','nature',4,'商品そのものの元になる'), s('水','💧','nature',4,'清掃や製造を支える'),
        s('商売の知識','📚','history',3,'陳列や接客の方法を積み上げた'), s('会計制度','📒','history',4,'取引を記録できるようにした'),
        s('配送員','🚚','person',2,'開店前後に商品を届ける'), s('防犯','📹','system',3,'安全に営業できるようにする')
      ],
      decoys: [d('潜水ゴーグル','🥽'), d('天体観測所','🔭'), d('そり','🛷'), d('竹馬','🎋')]
    }
  ];

  const POSITIONS = [
    [17,18],[50,13],[82,19],[12,42],[88,42],[14,70],[86,70],[28,86],[52,88],[73,85],[28,29],[72,30],[27,63],[73,63],[50,25],[50,76]
  ];

  const $ = (id) => document.getElementById(id);
  const screens = ['startScreen','gameScreen','roundScreen','finalScreen'];

  const els = {
    soundButton: $('soundButton'), startButton: $('startButton'), startBest: $('startBest'), startTotal: $('startTotal'), startLens: $('startLens'),
    roundNumber: $('roundNumber'), timerWrap: $('timerWrap'), timerRing: $('timerRing'), timerText: $('timerText'), scoreText: $('scoreText'),
    comboBadge: $('comboBadge'), comboText: $('comboText'), constellation: $('constellation'), lineLayer: $('lineLayer'), nodeLayer: $('nodeLayer'), sparkLayer: $('sparkLayer'),
    sceneIcon: $('sceneIcon'), sceneTitle: $('sceneTitle'), scenePrompt: $('scenePrompt'), lensChips: $('lensChips'), microFeedback: $('microFeedback'), choices: $('choices'),
    roundFound: $('roundFound'), roundMiniMap: $('roundMiniMap'), roundFoundStat: $('roundFoundStat'), roundComboStat: $('roundComboStat'), roundBreadthStat: $('roundBreadthStat'), roundDeepStat: $('roundDeepStat'), roundInsight: $('roundInsight'), nextRoundButton: $('nextRoundButton'),
    finalRank: $('finalRank'), finalScore: $('finalScore'), finalFound: $('finalFound'), finalCombo: $('finalCombo'), finalBreadth: $('finalBreadth'), lensUnlock: $('lensUnlock'), replayButton: $('replayButton'), homeButton: $('homeButton')
  };

  const STORAGE_KEY = 'thanks-hunt-v1';
  const defaultSave = { bestScore: 0, bestCombo: 0, totalFound: 0, plays: 0, unlockedLens: 1, sound: true, seen: [] };

  function loadSave() {
    try { return { ...defaultSave, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) }; }
    catch { return { ...defaultSave }; }
  }
  let save = loadSave();

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(save)); } catch { /* play remains available */ }
  }

  let audioCtx = null;
  function tone(freq, duration = .05, gain = .035, delay = 0) {
    if (!save.sound) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const start = audioCtx.currentTime + delay;
      const osc = audioCtx.createOscillator();
      const amp = audioCtx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(freq, start);
      amp.gain.setValueAtTime(0.0001, start);
      amp.gain.exponentialRampToValueAtTime(gain, start + .008);
      amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(amp); amp.connect(audioCtx.destination);
      osc.start(start); osc.stop(start + duration + .02);
    } catch { /* audio is optional */ }
  }

  function correctSound(combo) {
    const base = 440 + Math.min(combo, 12) * 28;
    tone(base, .07, .03);
    if (combo >= 10) { tone(base * 1.25, .09, .025, .035); tone(base * 1.5, .1, .02, .07); }
  }
  function missSound() { tone(180, .06, .018); }
  function finishSound() { [392,494,587].forEach((f,i) => tone(f,.14,.025,i*.065)); }

  let state = {};

  function resetRun() {
    const maxLevel = Math.min(4, 1 + Math.floor(save.plays / 2));
    const pool = shuffle(SCENES.filter(scene => scene.level <= maxLevel));
    state = {
      rounds: pool.slice(0, 3), roundIndex: 0, totalScore: 0, totalFound: 0, runBestCombo: 0,
      maxBreadth: 0, round: null, timerId: null, frameId: null
    };
  }

  function shuffle(items) {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function showScreen(id) {
    screens.forEach(name => $(name).classList.toggle('screen--active', name === id));
  }

  function updateHomeStats() {
    els.startBest.textContent = save.bestScore.toLocaleString('ja-JP');
    els.startTotal.textContent = save.totalFound.toLocaleString('ja-JP');
    els.startLens.textContent = `${save.unlockedLens}/6`;
    els.soundButton.classList.toggle('is-muted', !save.sound);
    els.soundButton.textContent = save.sound ? '♪' : '×';
  }

  function startRun() {
    resetRun();
    showScreen('gameScreen');
    startRound();
  }

  function startRound() {
    clearTimers();
    const scene = state.rounds[state.roundIndex];
    const supports = shuffle(scene.supports).map((item, index) => ({ ...item, key: `${scene.id}-s-${index}` }));
    const decoys = shuffle(scene.decoys).map((item, index) => ({ ...item, key: `${scene.id}-d-${index}` }));
    state.round = {
      scene, supports, decoys, remaining: [...supports], decoyQueue: [...decoys], shown: [], found: [], foundKeys: new Set(),
      combo: 0, bestCombo: 0, score: 0, categories: new Set(), deep: 0, startedAt: performance.now(), timeLeft: 10
    };

    els.roundNumber.textContent = state.roundIndex + 1;
    els.sceneIcon.textContent = scene.icon;
    els.sceneTitle.textContent = scene.title;
    els.scenePrompt.textContent = 'これを支えているものは？';
    els.scoreText.textContent = state.totalScore.toLocaleString('ja-JP');
    els.comboText.textContent = '0';
    els.comboBadge.className = 'combo-badge';
    els.nodeLayer.innerHTML = '';
    els.lineLayer.innerHTML = '';
    els.sparkLayer.innerHTML = '';
    els.constellation.style.setProperty('--light', '.08');
    els.constellation.style.setProperty('--sat', '.55');
    els.constellation.classList.remove('is-lit');
    els.microFeedback.textContent = '支えているものをタップ';
    els.microFeedback.className = 'micro-feedback';
    renderLens();
    refillChoices();

    const baseStart = performance.now();
    state.round.startedAt = baseStart;
    state.frameId = requestAnimationFrame(updateTimer);
  }

  function renderLens() {
    const round = state.round;
    const unlocked = LENS_ORDER.slice(0, save.unlockedLens);
    els.lensChips.innerHTML = unlocked.map(category => {
      const meta = CATEGORIES[category];
      const hit = round?.categories.has(category) ? ' is-hit' : '';
      return `<span class="lens-chip${hit}" style="--node-color:${meta.color}">${meta.emoji} ${meta.lens}</span>`;
    }).join('');
  }

  function refillChoices() {
    const r = state.round;
    if (!r) return;
    const targetCorrect = Math.min(3, r.remaining.length);
    const corrects = [];
    while (corrects.length < targetCorrect && r.remaining.length) {
      corrects.push(r.remaining.shift());
    }
    let decoy = null;
    if (r.decoyQueue.length) {
      decoy = r.decoyQueue.shift();
      r.decoyQueue.push(decoy);
    }
    r.shown = shuffle([...corrects, ...(decoy ? [decoy] : [])]);
    renderChoices();
  }

  function renderChoices() {
    const r = state.round;
    els.choices.innerHTML = '';
    r.shown.forEach(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'choice';
      button.dataset.key = item.key;
      button.innerHTML = `<span class="choice-emoji">${item.emoji}</span><span class="choice-text"><strong>${item.name}</strong><small>${item.correct ? CATEGORIES[item.category].label + '・深さ' + item.depth : 'どっちだ？'}</small></span>`;
      button.addEventListener('click', () => pick(item, button));
      els.choices.appendChild(button);
    });
  }

  function pick(item, button) {
    const r = state.round;
    if (!r || r.timeLeft <= 0 || button.disabled) return;
    button.disabled = true;

    if (item.correct) {
      if (r.foundKeys.has(item.key)) return;
      r.foundKeys.add(item.key);
      r.combo += 1;
      r.bestCombo = Math.max(r.bestCombo, r.combo);
      state.runBestCombo = Math.max(state.runBestCombo, r.combo);
      r.categories.add(item.category);
      if (item.depth >= 3) r.deep += 1;
      const comboBoost = r.combo >= 10 ? 1.7 : r.combo >= 7 ? 1.4 : r.combo >= 4 ? 1.2 : 1;
      const points = Math.round(100 * comboBoost);
      r.score += points;
      state.totalScore += points;
      r.found.push(item);
      r.shown = r.shown.filter(x => x.key !== item.key);
      button.classList.add('is-correct');
      correctSound(r.combo);
      addNode(item, r.found.length - 1);
      sparkBurst();
      updateLiveHUD();
      feedback(`${item.emoji} ${item.name} — ${item.why}`, 'good');
      setTimeout(fillSingleCorrect, 65);
    } else {
      r.combo = 0;
      button.classList.add('is-wrong');
      missSound();
      updateLiveHUD();
      feedback(`これはいったん外。次！`, 'miss');
      setTimeout(() => { button.disabled = false; button.classList.remove('is-wrong'); }, 180);
    }
  }

  function fillSingleCorrect() {
    const r = state.round;
    if (!r || r.timeLeft <= 0) return;
    const hasDecoy = r.shown.some(x => !x.correct);
    while (r.shown.filter(x => x.correct).length < 3 && r.remaining.length) {
      r.shown.push(r.remaining.shift());
    }
    if (!hasDecoy && r.decoyQueue.length) {
      const decoy = r.decoyQueue.shift();
      r.decoyQueue.push(decoy);
      r.shown.push(decoy);
    }
    r.shown = shuffle(r.shown).slice(0, 4);
    renderChoices();
  }

  function feedback(text, type) {
    els.microFeedback.textContent = text;
    els.microFeedback.className = `micro-feedback is-${type}`;
  }

  function updateLiveHUD() {
    const r = state.round;
    els.scoreText.textContent = state.totalScore.toLocaleString('ja-JP');
    els.comboText.textContent = r.combo;
    els.comboBadge.classList.toggle('is-live', r.combo > 1);
    els.comboBadge.classList.toggle('is-hot', r.combo >= 10);
    els.comboBadge.classList.remove('is-pop');
    void els.comboBadge.offsetWidth;
    if (r.combo > 1) els.comboBadge.classList.add('is-pop');
    renderLens();

    const progress = Math.min(1, r.found.length / 12);
    els.constellation.style.setProperty('--light', String(.08 + progress * .52));
    els.constellation.style.setProperty('--sat', String(.55 + progress * .7));
    els.constellation.classList.toggle('is-lit', r.found.length >= 3);
  }

  function addNode(item, index) {
    const pos = POSITIONS[index % POSITIONS.length];
    const meta = CATEGORIES[item.category];
    const node = document.createElement('div');
    node.className = 'support-node';
    node.style.left = `${pos[0]}%`;
    node.style.top = `${pos[1]}%`;
    node.style.setProperty('--node-color', meta.color);
    node.innerHTML = `<span class="node-emoji">${item.emoji}</span><span class="node-name">${item.name}</span><span class="node-depth">${meta.label} D${item.depth}</span>`;
    els.nodeLayer.appendChild(node);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1','50'); line.setAttribute('y1','50'); line.setAttribute('x2', String(pos[0])); line.setAttribute('y2', String(pos[1]));
    line.style.stroke = meta.color;
    els.lineLayer.appendChild(line);
  }

  function sparkBurst() {
    const count = state.round.combo >= 10 ? 9 : 4;
    for (let i = 0; i < count; i++) {
      const spark = document.createElement('i');
      spark.className = 'spark';
      spark.style.left = '50%'; spark.style.top = '50%';
      const angle = Math.random() * Math.PI * 2;
      const dist = 45 + Math.random() * 85;
      spark.style.setProperty('--sx', `${Math.cos(angle) * dist}px`);
      spark.style.setProperty('--sy', `${Math.sin(angle) * dist}px`);
      els.sparkLayer.appendChild(spark);
      setTimeout(() => spark.remove(), 600);
    }
  }

  function updateTimer(now) {
    const r = state.round;
    if (!r) return;
    const elapsed = (now - r.startedAt) / 1000;
    r.timeLeft = Math.max(0, 10 - elapsed);
    els.timerText.textContent = r.timeLeft.toFixed(1);
    const circumference = 113.1;
    els.timerRing.style.strokeDashoffset = String(circumference * (1 - r.timeLeft / 10));
    els.timerWrap.classList.toggle('is-urgent', r.timeLeft <= 3);
    if (r.timeLeft <= 0) {
      endRound();
      return;
    }
    state.frameId = requestAnimationFrame(updateTimer);
  }

  function endRound() {
    clearTimers();
    const r = state.round;
    r.timeLeft = 0;
    els.timerText.textContent = '0.0';
    els.choices.querySelectorAll('button').forEach(button => button.disabled = true);

    const breadth = r.categories.size;
    const breadthBonus = breadth >= 6 ? 1000 : breadth === 5 ? 700 : breadth === 4 ? 400 : breadth === 3 ? 200 : 0;
    const deepBonus = r.deep >= 3 ? 500 : 0;
    r.score += breadthBonus + deepBonus;
    state.totalScore += breadthBonus + deepBonus;
    state.totalFound += r.found.length;
    state.maxBreadth = Math.max(state.maxBreadth, breadth);
    finishSound();
    setTimeout(showRoundResult, 280);
  }

  function showRoundResult() {
    const r = state.round;
    showScreen('roundScreen');
    els.roundFound.textContent = r.found.length;
    els.roundFoundStat.textContent = r.found.length;
    els.roundComboStat.textContent = `×${r.bestCombo}`;
    els.roundBreadthStat.textContent = `${r.categories.size}/6`;
    els.roundDeepStat.textContent = r.deep;
    els.roundMiniMap.innerHTML = r.found.slice(0, 10).map((item, i) => {
      const meta = CATEGORIES[item.category];
      return `<span class="mini-node" style="--node-color:${meta.color}; z-index:${20-i}" title="${item.name}">${item.emoji}</span>`;
    }).join('');

    const missing = LENS_ORDER.filter(category => !r.categories.has(category));
    if (r.categories.size >= 5) {
      els.roundInsight.innerHTML = `<strong>観察幅 ${r.categories.size}/6。</strong> 人だけでなく、仕組み・自然・過去の蓄積まで見えている。`;
    } else if (missing.length) {
      const next = CATEGORIES[missing[0]];
      els.roundInsight.innerHTML = `<strong>次のLENS: ${next.emoji} ${next.lens}</strong><br>${next.label}の方向を1つ足すと、同じ日常がもう一段深く見える。`;
    } else {
      els.roundInsight.innerHTML = `<strong>全部の方向を見つけた。</strong> 直接の支えから、そのさらに後ろまでつながった。`;
    }

    const isLast = state.roundIndex >= state.rounds.length - 1;
    els.nextRoundButton.textContent = isLast ? '3ラウンドの結果を見る' : '次の日常を見る';
  }

  function nextRound() {
    if (state.roundIndex >= state.rounds.length - 1) {
      finishRun();
      return;
    }
    state.roundIndex += 1;
    showScreen('gameScreen');
    startRound();
  }

  function finishRun() {
    const rank = state.totalScore >= 7000 ? 'S' : state.totalScore >= 5000 ? 'A' : state.totalScore >= 3200 ? 'B' : 'C';
    save.plays += 1;
    save.bestScore = Math.max(save.bestScore, state.totalScore);
    save.bestCombo = Math.max(save.bestCombo, state.runBestCombo);
    save.totalFound += state.totalFound;
    save.seen = [...new Set([...(save.seen || []), ...state.rounds.map(x => x.id)])].slice(-32);

    const oldLens = save.unlockedLens;
    const unlockByFound = Math.min(6, 1 + Math.floor(save.totalFound / 35));
    const unlockByPlay = Math.min(6, 1 + Math.floor(save.plays / 2));
    save.unlockedLens = Math.max(save.unlockedLens, unlockByFound, unlockByPlay);
    persist();

    els.finalRank.textContent = rank;
    els.finalScore.textContent = state.totalScore.toLocaleString('ja-JP');
    els.finalFound.textContent = state.totalFound;
    els.finalCombo.textContent = `×${state.runBestCombo}`;
    els.finalBreadth.textContent = `${state.maxBreadth}/6`;

    if (save.unlockedLens > oldLens) {
      const category = LENS_ORDER[save.unlockedLens - 1];
      const meta = CATEGORIES[category];
      els.lensUnlock.innerHTML = `<strong>NEW LENS UNLOCKED</strong><br>${meta.emoji} <b>${meta.lens}</b> — 次から候補を見る方向が1つ増える。`;
    } else {
      const nextIndex = Math.min(5, save.unlockedLens);
      const nextMeta = CATEGORIES[LENS_ORDER[nextIndex]];
      if (save.unlockedLens < 6) {
        els.lensUnlock.innerHTML = `<strong>NEXT LENS</strong><br>${nextMeta.emoji} ${nextMeta.lens} — 累計発見を増やすと解放。`;
      } else {
        els.lensUnlock.innerHTML = `<strong>6 LENS READY</strong><br>人・仕組み・道具・エネルギー・自然・蓄積。全部の方向を使える。`;
      }
    }
    updateHomeStats();
    showScreen('finalScreen');
    finishSound();
  }

  function clearTimers() {
    if (state.frameId) cancelAnimationFrame(state.frameId);
    if (state.timerId) clearTimeout(state.timerId);
    state.frameId = null; state.timerId = null;
  }

  function toggleSound() {
    save.sound = !save.sound;
    persist();
    updateHomeStats();
    if (save.sound) tone(520, .08, .025);
  }

  els.startButton.addEventListener('click', startRun);
  els.nextRoundButton.addEventListener('click', nextRound);
  els.replayButton.addEventListener('click', startRun);
  els.homeButton.addEventListener('click', () => { clearTimers(); updateHomeStats(); showScreen('startScreen'); });
  els.soundButton.addEventListener('click', toggleSound);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.round?.timeLeft > 0) {
      state.round.startedAt = performance.now() - 10000;
    }
  });

  updateHomeStats();
  showScreen('startScreen');
})();
