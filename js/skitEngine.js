(function () {
  "use strict";

  const Engine = {
    skit: null,
    nodes: {},
    currentNode: null,
    rootEl: null,

    autoTimer: null,
    autoMode: false,
    autoDelay: 3200,

    log: [],
    keyHandler: null,
    waitingChoice: false,

    // ====== Public API ======
    async start({ rootEl, skitUrl }) {
      this.stop();

      this.rootEl = rootEl;
      this.skit = null;
      this.nodes = {};
      this.currentNode = null;
      this.log = [];
      this.autoMode = false;
      this.waitingChoice = false;

      this.rootEl.innerHTML = this.renderShell();
      this.bindStaticElements();

      try {
        const data = await this.fetchSkit(skitUrl);
        this.validate(data);

        this.skit = data;
        this.nodes = data.nodes || {};

        const titleEl = this.rootEl.querySelector(".sv-title");
        if (titleEl) titleEl.textContent = data.meta?.title || "Skit Window";

        if (this.autoBtn) this.autoBtn.setAttribute("aria-pressed", "false");
        this.gotoNode(data.start);
      } catch (err) {
        this.showError(err?.message || "スキットの読み込みに失敗しました。");
      }
    },

    stop() {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
      this.autoMode = false;
      this.waitingChoice = false;

      if (this.logPanel) {
        this.logPanel.classList.remove("sv-open");
        this.logPanel.setAttribute("aria-hidden", "true");
      }

      // key handler cleanup
      if (this.keyHandler && this.rootEl) {
        const panel = this.rootEl.closest(".sv-overlay-panel");
        if (panel) panel.removeEventListener("keydown", this.keyHandler, true);
      }
      this.keyHandler = null;
    },

    // ====== Rendering ======
    renderShell() {
      return `
        <div class="sv-shell">
          <div class="sv-topbar">
            <div class="sv-title">${this.skit?.meta?.title || "Skit Window"}</div>
            <div class="sv-controls">
              <button type="button" class="sv-btn sv-log-btn">ログ</button>
              <button type="button" class="sv-btn sv-auto-btn" aria-pressed="false">Auto</button>
            </div>
          </div>

          <div class="sv-stage" aria-live="polite">
            ${["left", "center", "right"]
              .map(
                (slot) => `
              <div class="sv-slot" data-slot="${slot}">
                <div class="sv-portrait" data-character="" data-motion="none">
                  <div class="sv-face" role="img" aria-label=""></div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>

          <div class="sv-dialogue" tabindex="0">
            <div class="sv-name">...</div>
            <div class="sv-text">読み込み中...</div>
            <div class="sv-choices" hidden></div>
            <div class="sv-hint">タップ / クリック / Spaceで進む</div>
          </div>

          <div class="sv-log-panel" aria-hidden="true">
            <div class="sv-log-header">
              <div class="sv-log-title">ログ</div>
              <button class="sv-log-close" type="button">閉じる</button>
            </div>
            <div class="sv-log-body"></div>
          </div>
        </div>
      `;
    },

    bindStaticElements() {
      this.dialogueEl = this.rootEl.querySelector(".sv-dialogue");
      this.nameEl = this.rootEl.querySelector(".sv-name");
      this.textEl = this.rootEl.querySelector(".sv-text");
      this.choicesEl = this.rootEl.querySelector(".sv-choices");

      this.logPanel = this.rootEl.querySelector(".sv-log-panel");
      this.logBody = this.rootEl.querySelector(".sv-log-body");

      this.autoBtn = this.rootEl.querySelector(".sv-auto-btn");

      this.dialogueEl?.addEventListener("click", () => this.handleAdvance());
      this.autoBtn?.addEventListener("click", () => this.toggleAuto());

      this.rootEl.querySelector(".sv-log-btn")?.addEventListener("click", () => this.toggleLog(true));
      this.rootEl.querySelector(".sv-log-close")?.addEventListener("click", () => this.toggleLog(false));

      const panel = this.rootEl.closest(".sv-overlay-panel");
      this.keyHandler = (e) => {
        if (!this.rootEl || !this.rootEl.isConnected) return;
        if (this.waitingChoice) return;
        if (e.key === " " || e.code === "Space") {
          e.preventDefault();
          this.handleAdvance();
        }
      };
      if (panel) panel.addEventListener("keydown", this.keyHandler, true);
    },

    async fetchSkit(url) {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error("スキットデータを取得できませんでした。");
      return res.json();
    },

    validate(data) {
      if (!data || !data.start || !data.nodes) throw new Error("スキットデータが不正です。");
      if (!data.nodes[data.start]) throw new Error("開始ノードが見つかりません。");
    },

    gotoNode(id) {
      const node = this.nodes[id];
      if (!node) {
        this.showError("次のシーンが見つかりません。");
        return;
      }
      this.currentNode = node;
      this.waitingChoice = Array.isArray(node.choices) && node.choices.length > 0;

      this.renderNode(node);
      this.scheduleAuto();
    },

    renderNode(node) {
      this.renderCast(node.cast || [], node);
      this.renderDialogue(node);
    },

    // ====== Cast Rendering (512x512対応) ======
    renderCast(castFrames, node) {
      const slots = ["left", "center", "right"];
      const slotMap = { left: null, center: null, right: null };

      for (const frame of castFrames) {
        if (!frame || !frame.slot) continue;
        if (slotMap.hasOwnProperty(frame.slot)) slotMap[frame.slot] = frame;
      }

      for (const slotName of slots) {
        const slotEl = this.rootEl.querySelector(`.sv-slot[data-slot="${slotName}"]`);
        if (!slotEl) continue;

        const portrait = slotEl.querySelector(".sv-portrait");
        const faceEl = slotEl.querySelector(".sv-face");
        const frame = slotMap[slotName];

        // 非表示
        if (!frame || frame.visible === false) {
          slotEl.classList.add("sv-hidden");
          slotEl.classList.remove("sv-speaking", "sv-dimmed");
          if (portrait) {
            portrait.dataset.character = "";
            portrait.dataset.motion = "none";
          }
          if (faceEl) {
            faceEl.style.backgroundImage = "";
            faceEl.setAttribute("aria-label", "");
          }
          continue;
        }

        // 表示
        slotEl.classList.remove("sv-hidden");

        const character = (frame.character || "").trim().toLowerCase();
        const expression = (frame.expression || "").trim();

        if (portrait) portrait.dataset.character = character;

        // 画像URL
        const url = this.resolvePortraitUrl(character, expression);

        if (faceEl) {
          // 512x512 を「枠に綺麗に収める」基本設定
          faceEl.style.backgroundImage = `url("${url}")`;
          faceEl.style.backgroundRepeat = "no-repeat";
          faceEl.style.backgroundPosition = "center";
          // ↓ここ重要：切り抜きたくないなら contain / 迫力優先なら cover
          faceEl.style.backgroundSize = "contain";

          // 画像が見えない時の保険（透明背景想定）
          faceEl.style.imageRendering = "auto";

          faceEl.setAttribute("aria-label", `${character} ${expression}`.trim());
        }

        // 話者強調（frame.speaking 優先 → ないなら node.speaker と一致で speaking）
        const speaking = frame.speaking != null ? !!frame.speaking : (character && character === (node.speaker || "").toLowerCase());
        slotEl.classList.toggle("sv-speaking", speaking);
        slotEl.classList.toggle("sv-dimmed", !speaking);

        // モーション
        this.applyMotion(portrait, frame.motion);
      }
    },

    // "calm smile" -> "calm-smile"
    normalizeExpression(expression) {
      return (expression || "normal")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");
    },

    resolvePortraitUrl(character, expression) {
      const c = (character || "unknown").trim().toLowerCase();
      const e = this.normalizeExpression(expression);
      return `/assets/skit/${c}/${e}.png`;
    },

    applyMotion(portrait, motion) {
      if (!portrait) return;

      portrait.classList.remove("sv-motion-shake", "sv-motion-zoomIn", "sv-motion-zoomOut");
      portrait.dataset.motion = "none";

      if (!motion || !motion.type || motion.type === "none") return;

      const type = motion.type;
      const duration = Number.isFinite(motion.durationMs) ? motion.durationMs : 600;

      portrait.dataset.motion = type;

      if (type === "shake") portrait.classList.add("sv-motion-shake");
      if (type === "zoomIn") portrait.classList.add("sv-motion-zoomIn");
      if (type === "zoomOut") portrait.classList.add("sv-motion-zoomOut");

      clearTimeout(portrait.__svMotionTimer);
      portrait.__svMotionTimer = setTimeout(() => {
        portrait.classList.remove("sv-motion-shake", "sv-motion-zoomIn", "sv-motion-zoomOut");
      }, duration);
    },

    // ====== Dialogue / Choices ======
    renderDialogue(node) {
  const speaker = node.speaker || "Narration";
  const text = node.text || "";

  // 文字の正規化：記号/括弧/アクセント差を吸収
  const norm = (s) => String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")                 // é 等を分解
    .replace(/[\u0300-\u036f]/g, "")   // 分解した濁点/アクセント除去
    .replace(/[（）()【】\[\]「」『』]/g, " ")
    .replace(/\s+/g, " ");

  const raw = norm(node.speaker);

  const speakerId =
    raw.includes("shiopon") || raw.includes("しおぽん") ? "shiopon" :
    raw.includes("shioriel") || raw.includes("しおりえる") || raw.includes("シオリエル") ? "shioriel" :
    raw.includes("lumiere") || raw.includes("りゅみえーる") || raw.includes("リュミエール") ? "lumiere" :
    "narration";

  // #sv-skit（最強スコープ）へ付与
  const host = document.getElementById("sv-skit");
  if (host) host.setAttribute("data-speaker-id", speakerId);

  // 念のため dialogue / name にも付与
  this.dialogueEl?.setAttribute("data-speaker-id", speakerId);
  this.nameEl?.setAttribute("data-speaker-id", speakerId);

  // 表示
  if (this.nameEl) this.nameEl.textContent = speaker;
  if (this.textEl) this.textEl.textContent = text;

  if (!this.waitingChoice) {
    if (this.choicesEl) {
      this.choicesEl.hidden = true;
      this.choicesEl.innerHTML = "";
    }
    this.log.push({ speaker, text });
    this.refreshLog();
  } else {
    this.renderChoices(node.choices || []);
  }
},
    renderChoices(choices) {
      if (!this.choicesEl) return;

      this.choicesEl.innerHTML = "";
      this.choicesEl.hidden = false;

      choices.forEach((choice) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "sv-choice-btn";
        btn.textContent = choice.label ?? choice.text ?? "";

        btn.addEventListener("click", () => {
          this.waitingChoice = false;
          this.choicesEl.hidden = true;

          const next = choice.next;
          if (next) this.gotoNode(next);
        });

        this.choicesEl.appendChild(btn);
      });
    },

    // ====== Auto ======
    scheduleAuto() {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;

      if (!this.autoMode) return;
      if (this.waitingChoice) return;
      if (!this.currentNode?.next) return;

      this.autoTimer = setTimeout(() => this.handleAdvance(), this.autoDelay);
    },

    handleAdvance() {
      if (this.waitingChoice) return;
      if (!this.currentNode) return;

      const nextId = this.currentNode.next;
      if (nextId) this.gotoNode(nextId);
    },

    toggleAuto() {
      this.autoMode = !this.autoMode;
      this.autoBtn?.setAttribute("aria-pressed", String(this.autoMode));
      this.scheduleAuto();
    },

    // ====== Log ======
    toggleLog(open) {
      if (!this.logPanel) return;

      const willOpen = open ?? !this.logPanel.classList.contains("sv-open");
      this.logPanel.classList.toggle("sv-open", willOpen);
      this.logPanel.setAttribute("aria-hidden", String(!willOpen));

      if (willOpen) {
        this.logPanel.querySelector(".sv-log-close")?.focus({ preventScroll: true });
      } else {
        this.dialogueEl?.focus({ preventScroll: true });
      }
    },

    refreshLog() {
      if (!this.logBody) return;

      this.logBody.innerHTML = "";
      this.log.slice(-50).forEach((entry) => {
        const row = document.createElement("div");
        row.className = "sv-log-row";

        const sp = document.createElement("div");
        sp.className = "sv-log-speaker";
        sp.textContent = entry.speaker;

        const tx = document.createElement("div");
        tx.className = "sv-log-text";
        tx.textContent = entry.text;

        row.appendChild(sp);
        row.appendChild(tx);
        this.logBody.appendChild(row);
      });
    },

    // ====== Error ======
    showError(msg) {
      if (!this.rootEl) return;
      this.rootEl.innerHTML = `
        <div class="sv-shell">
          <div class="sv-dialogue">
            <div class="sv-name">Error</div>
            <div class="sv-text">${this.escapeHtml(msg)}</div>
          </div>
        </div>
      `;
    },

    escapeHtml(s) {
      return String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    },
  };

  window.SV_SkitEngine = Engine;
})();
