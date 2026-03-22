document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('[data-summon-root]');
  const cardWrap = document.querySelector('[data-summon-card]');
  const card = document.querySelector('.tb-arcana-card');
  const status = document.querySelector('[data-summon-status]');
  const pameraImage = document.querySelector('[data-pamera-image]');

  alert(
    [
      `root: ${!!root}`,
      `cardWrap: ${!!cardWrap}`,
      `card: ${!!card}`,
      `status: ${!!status}`,
      `pameraImage: ${!!pameraImage}`,
      `url: ${location.href}`
    ].join('\n')
  );
});
