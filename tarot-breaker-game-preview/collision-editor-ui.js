(() => {
  'use strict';

  const body = document.body;
  const toolsToggle = document.getElementById('editor-tools-toggle');
  const labelToggle = document.getElementById('label-toggle');
  const modePan = document.getElementById('mode-pan');
  const modeEdit = document.getElementById('mode-edit');
  const modeDraw = document.getElementById('mode-draw');
  const kindWalk = document.getElementById('kind-walk');
  const kindBlocked = document.getElementById('kind-blocked');
  const closeHelp = document.getElementById('close-help');

  let editorMode = 'pan';

  function setToolsCollapsed(collapsed) {
    body.classList.toggle('tools-collapsed', collapsed);
    toolsToggle.textContent = collapsed ? '編集' : '閉じる';
    toolsToggle.setAttribute('aria-expanded', String(!collapsed));
  }

  function setEditorMode(mode) {
    editorMode = mode;
    body.dataset.editorMode = mode;
  }

  function setLabelsAll(enabled) {
    body.classList.toggle('labels-all', enabled);
    body.classList.toggle('labels-minimal', !enabled);
    labelToggle.setAttribute('aria-pressed', String(enabled));
    labelToggle.textContent = enabled ? '番号：全表示' : '番号：選択のみ';
  }

  toolsToggle.addEventListener('click', () => {
    setToolsCollapsed(!body.classList.contains('tools-collapsed'));
  });

  labelToggle.addEventListener('click', () => {
    setLabelsAll(!body.classList.contains('labels-all'));
  });

  modePan.addEventListener('click', () => {
    setEditorMode('pan');
    window.setTimeout(() => setToolsCollapsed(true), 80);
  });

  modeEdit.addEventListener('click', () => {
    setEditorMode('edit');
    window.setTimeout(() => setToolsCollapsed(true), 80);
  });

  modeDraw.addEventListener('click', () => {
    setEditorMode('draw');
    setToolsCollapsed(false);
  });

  const collapseAfterKindChoice = () => {
    if (editorMode === 'draw') window.setTimeout(() => setToolsCollapsed(true), 80);
  };
  kindWalk.addEventListener('click', collapseAfterKindChoice);
  kindBlocked.addEventListener('click', collapseAfterKindChoice);

  closeHelp?.addEventListener('click', () => setToolsCollapsed(true));

  setEditorMode('pan');
  setLabelsAll(false);
  setToolsCollapsed(true);
})();
