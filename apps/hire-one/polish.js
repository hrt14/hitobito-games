(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const nativeTimeout = window.__hireOneNativeTimeout || window.setTimeout.bind(window);
  const nextQueue = window.__hireOneNextQueue || [];

  const result = $('#decisionResult');
  const continueButton = $('#continueButton');
  const continueLabel = $('#continueLabel');
  const eventText = $('#eventText');
  const team = $('#team');
  const officeShell = $('#officeShell');
  const headcount = $('#headcountValue');
  const stageHint = $('#stageHint');
  const endingModal = $('#endingModal');

  document.title = '本日の採用、1名。 | hitobito games';

  function currentDay() {
    const m = ($('#dayLabel')?.textContent || '').match(/(\d+)/);
    return m ? Number(m[1]) : 1;
  }

  function updateStageHint() {
    if (!stageHint || !headcount) return;
    const n = Number(headcount.textContent || 0);
    let next = 5;
    let label = '小さな会社';
    if (n >= 25) { next = 30; label = '最終日'; }
    else if (n >= 18) { next = 25; label = '上場前夜'; }
    else if (n >= 11) { next = 18; label = '急成長オフィス'; }
    else if (n >= 5) { next = 11; label = '拡張フロア'; }
    if (n >= 30) {
      stageHint.innerHTML = '<span>30人の採用が完了</span><b>会社完成</b>';
      return;
    }
    stageHint.innerHTML = `<span>次のオフィス拡張</span><b>あと${Math.max(0, next - n)}人 · ${label}</b>`;
  }

  function polishCandidate(card) {
    if (!card || card.dataset.polished === '1') return;
    card.dataset.polished = '1';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    const labels = card.querySelectorAll('.signal span');
    if (labels[0]) labels[0].textContent = '売上';
    if (labels[1]) labels[1].textContent = '技術';
    if (labels[2]) labels[2].textContent = '波乱';

    const choose = () => {
      const button = card.querySelector('.hire-button');
      if (button && !button.disabled) button.click();
    };

    card.addEventListener('click', (e) => {
      if (!e.target.closest('button')) choose();
      nativeTimeout(() => {
        if (card.classList.contains('chosen')) showDecision(card);
      }, 10);
    });

    card.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('button')) {
        e.preventDefault();
        choose();
        nativeTimeout(() => {
          if (card.classList.contains('chosen')) showDecision(card);
        }, 10);
      }
    });
  }

  function polishAllCandidates() {
    $$('.candidate').forEach(polishCandidate);
  }

  function metricDeltas() {
    const items = [
      ['売上', '#revenueDelta'],
      ['技術', '#techDelta'],
      ['組織', '#cultureDelta'],
      ['カオス', '#chaosDelta']
    ];
    return items.map(([label, sel]) => {
      const value = $(sel)?.textContent?.trim();
      if (!value) return '';
      const bad = value.startsWith('-');
      return `<span class="decision-delta ${bad ? 'bad' : 'good'}">${label} ${value}</span>`;
    }).filter(Boolean).join('');
  }

  function showDecision(card) {
    if (!result || !card) return;
    const role = card.querySelector('.candidate-role')?.textContent?.trim() || '新入社員';
    const name = card.querySelector('.candidate-name')?.textContent?.trim() || '';
    const avatar = card.querySelector('.candidate-avatar')?.textContent?.trim() || '👤';
    const lost = $$('.candidate').find(c => c !== card)?.querySelector('.candidate-name')?.textContent?.trim();

    $('#decisionAvatar').textContent = avatar;
    $('#decisionRole').textContent = role;
    $('#decisionName').textContent = name;
    $('#decisionCopy').textContent = lost
      ? `${name}を採用。${lost}は見送った。この選択はやり直せない。`
      : `${name}を採用した。会社の空気が少し変わった。`;
    $('#decisionDeltas').innerHTML = metricDeltas();
    $('#decisionEvent').textContent = eventText?.textContent || '入社初日は静かに終わった。';
    result.hidden = false;
    continueButton.disabled = nextQueue.length === 0;
    continueLabel.textContent = nextQueue.length
      ? (currentDay() >= 30 ? '30日間の結果を見る' : '次の候補者を見る')
      : '入社の結果を確認中…';

    nativeTimeout(() => {
      $('#decisionDeltas').innerHTML = metricDeltas();
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 70);
  }

  function markNextReady() {
    if (!result || result.hidden || !continueButton) return;
    continueButton.disabled = false;
    continueLabel.textContent = currentDay() >= 30 ? '30日間の結果を見る' : '次の候補者を見る';
    $('#decisionEvent').textContent = eventText?.textContent || $('#decisionEvent').textContent;
    $('#decisionDeltas').innerHTML = metricDeltas();
  }

  window.addEventListener('hire-one:next-ready', markNextReady);

  continueButton?.addEventListener('click', () => {
    if (!nextQueue.length) return;
    continueButton.disabled = true;
    const next = nextQueue.shift();
    result.hidden = true;
    next();
    nativeTimeout(() => {
      polishAllCandidates();
      updateStageHint();
      if (!endingModal.classList.contains('show')) {
        $('#choiceArea')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  });

  new MutationObserver(() => polishAllCandidates()).observe($('#candidates'), { childList: true });
  new MutationObserver(() => updateStageHint()).observe(headcount, { childList: true, characterData: true, subtree: true });
  new MutationObserver(() => {
    if (!result.hidden) {
      $('#decisionEvent').textContent = eventText.textContent;
      $('#decisionDeltas').innerHTML = metricDeltas();
    }
  }).observe(eventText, { childList: true, characterData: true, subtree: true });

  const policyGroups = {
    '技術派': ['genius','ai','oldman','future','hacker','security','designer','researcher','robotics','opensource','inventor','alien','climate'],
    '売上派': ['salesgod','influencer','investor','grandma','copywriter','dog','vcgirl','translator','bartender','politician','headhunter'],
    '組織派': ['cat','hr','comedian','intern','chef','priest','farmer','support','labor','teacher','doctor'],
    'カオス派': ['cult','philosopher','psychic','spy','twins','idol','musician','nepo','magician'],
    '実行派': ['accountant','lawyer','manager','athlete','gamer','minimalist','logistic','chess','factory']
  };

  function hiringPolicy() {
    const ids = $$('.employee').map(el => el.dataset.id).filter(Boolean);
    let best = ['バランス派', 0];
    Object.entries(policyGroups).forEach(([name, group]) => {
      const score = ids.filter(id => group.includes(id)).length;
      if (score > best[1]) best = [name, score];
    });
    return best[0];
  }

  function fixEnding() {
    if (!endingModal.classList.contains('show')) return;
    const policy = $('#endingPolicy');
    if (policy) policy.textContent = `あなたの採用方針：${hiringPolicy()}`;

    const titles = $$('#endingCast span').map(el => el.title || '');
    const hasCat = titles.some(t => t.startsWith('猫 '));
    const hasDog = titles.some(t => t.startsWith('犬 '));
    if (hasCat && hasDog) {
      $('#endingIcon').textContent = '🐾';
      $('#endingTitle').textContent = '株式会社どうぶつ';
      $('#endingText').textContent = '人間より動物社員の方が人気になり、本業よりグッズと配信で成長した。社長の席には猫が座っている。';
    }
  }

  new MutationObserver(fixEnding).observe(endingModal, { attributes: true, attributeFilter: ['class'] });

  $('#shareButton')?.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    const title = $('#endingTitle')?.textContent || '30日経営完了';
    const text = `「本日の採用、1名。」30日経営した結果：${title}\n採用方針：${hiringPolicy()}\n売上 ${$('#revenueValue')?.textContent} / 技術 ${$('#techValue')?.textContent} / 組織 ${$('#cultureValue')?.textContent} / カオス ${$('#chaosValue')?.textContent}`;
    try {
      if (navigator.share) await navigator.share({ title: '本日の採用、1名。', text, url: location.href });
      else {
        await navigator.clipboard.writeText(`${text}\n${location.href}`);
        const toast = $('#toast');
        toast.textContent = '結果をコピーしました';
        toast.classList.add('show');
        nativeTimeout(() => toast.classList.remove('show'), 1800);
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        const toast = $('#toast');
        toast.textContent = '共有できませんでした';
        toast.classList.add('show');
        nativeTimeout(() => toast.classList.remove('show'), 1800);
      }
    }
  }, true);

  $('#startButton')?.addEventListener('click', () => {
    nativeTimeout(() => {
      polishAllCandidates();
      updateStageHint();
      $('#choiceArea')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  });

  $('#restartButton')?.addEventListener('click', () => {
    result.hidden = true;
    nextQueue.splice(0);
    nativeTimeout(() => {
      polishAllCandidates();
      updateStageHint();
    }, 80);
  });

  polishAllCandidates();
  updateStageHint();
})();
