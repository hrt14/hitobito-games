(() => {
  'use strict';

  const team = document.querySelector('#team');
  const eventText = document.querySelector('#eventText');
  const eventStrip = document.querySelector('#eventStrip');
  const endingModal = document.querySelector('#endingModal');
  const endingCast = document.querySelector('#endingCast');
  let animalEventShown = false;

  const hasCatAndDog = () => {
    const titles = [...team.querySelectorAll('.employee')].map((el) => el.title || '');
    return titles.some((t) => t.startsWith('猫 /')) && titles.some((t) => t.startsWith('犬 /'));
  };

  const flashAnimalEvent = () => {
    if (animalEventShown || !hasCatAndDog()) return;
    animalEventShown = true;
    eventText.textContent = '猫と犬が社内の人気を二分。採用広報だけは過去最高に伸びた。';
    eventStrip.classList.remove('flash');
    void eventStrip.offsetWidth;
    eventStrip.classList.add('flash');
  };

  const fixAnimalEnding = () => {
    if (!endingModal.classList.contains('show')) return;
    const titles = [...endingCast.querySelectorAll('span')].map((el) => el.title || '');
    const hasCat = titles.some((t) => t.startsWith('猫 '));
    const hasDog = titles.some((t) => t.startsWith('犬 '));
    if (!hasCat || !hasDog) return;
    document.querySelector('#endingIcon').textContent = '🐾';
    document.querySelector('#endingTitle').textContent = '株式会社どうぶつ';
    document.querySelector('#endingText').textContent = '人間より動物社員の方が人気になり、本業よりグッズと配信で成長した。社長の席には猫が座っている。';
  };

  new MutationObserver(() => flashAnimalEvent()).observe(team, { childList: true });
  new MutationObserver(() => fixAnimalEnding()).observe(endingModal, { attributes: true, attributeFilter: ['class'] });
})();
