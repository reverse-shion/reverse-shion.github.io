(function () {
  "use strict";

  const Engine = {
    // =========================
    // Core State
    // =========================
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

    // Exit / Bye
    exiting: false,
    userName: null,

    // End lock
    isEndReached: false,

    // timers
    byeTimer1: null,
    byeTimer2: null,

    // elements
    dialogueEl: null,
    nameEl: null,
    textEl: null,
    choicesEl: null,
    logPanel: null,
    logBody: null,
    autoBtn: null,
    byeBtn: null,
    nextBtn: null,

    // preload cache
    _preloadCache: new Map(),

    // =========================
    // Config
    // =========================
    config: {
      hostId: "sv-skit",
      returnMode: "callback",
      returnHref: "/",
      onReturn: null,
      onNext: null,
      byeDelayMs: 950,
      byeFadeMs: 420,
    },

    byeLines: {
      shiopon: [
        "${userName}、またねっ！ぴょん！",
        "${userName}、また来てね〜☆",
      ],
      shioriel: [
        "${userName}、また星の窓で会おう。",
        "別れは終わりじゃない。${userName}、またね。",
      ],
      lumiere: [
        "${userName}様、今日もありがとう。またね。",
        "${userName}様、道はいつでもここにあるよ。",
      ],
      shion: [
        "${userName}、いつでも来てね。また今度。",
        "またね、${userName}。寂しい時は一緒にいよう。",
      ],
      narration: ["${userName}、またね。"],
    },

    // =========================
    // Public API
    // =========================
    async start({
      rootEl,
      skitUrl,
      userName,
      returnMode,
      returnHref,
      onReturn,
      onNext,
    }) {
      // ① 前回を必ず停止
      this.stop();

      // ② rootをセット
      this.rootEl = rootEl;

      // ③ 見た目の残骸掃除（2回目事故防止）
      this.hardResetVisualState();

      // ④ 状態初期化
      this.skit = null;
      this.nodes = {};
      this.currentNode = null;
      this.log = [];
      this.autoMode = false;
      this.waitingChoice = false;
      this.exiting = false;
      this.isEndReached = false;

      // timers clear（念のため）
      clearTimeout(this.autoTimer);
      clearTimeout(this.byeTimer1);
      clearTimeout(this.byeTimer2);
      this.autoTimer = null;
      this.byeTimer1 = null;
      this.byeTimer2 = null;

      // ★ userName: passed > stored > guest
      const stored = (localStorage.getItem("sv_user_name") || "").trim();
      const passed = (userName && String(userName).trim()) || "";
      this.userName = passed || stored || "ゲスト";

      // config
      if (returnMode) this.config.returnMode = returnMode;
      if (returnHref) this.config.returnHref = returnHref;
      if (typeof onReturn === "function") this.config.onReturn = onReturn;
      if (typeof onNext === "function") this.config.onNext = onNext;
      else this.config.onNext = null;

      // ⑤ shell描画
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

        this.primePreloadCache(data);
        this.gotoNode(data.start);
      } catch (err) {
        this.showError(err?.message || "スキットの読み込みに失敗しました。");
      }
    },

    stop() {
      // timers
      clearTimeout(this.autoTimer);
      clearTimeout(this.byeTimer1);
      clearTimeout(this.byeTimer2);
      this.autoTimer = null;
      this.byeTimer1 = null;
      this.byeTimer2 = null;

      this.autoMode = false;
      this.waitingChoice = false;
      this.exiting = false;
      this.isEndReached = false;

      // visual cleanup
      if (this.rootEl) {
        this.rootEl.classList.remove("sv-fadeout", "sv-exiting");
        const d = this.rootEl.querySelector(".sv-dialogue");
        d?.classList.remove("sv-exit");
      }

      // log panel
      if (this.logPanel) {
        this.logPanel.classList.remove("sv-open");
        this.logPanel.setAttribute("aria-hidden", "true");
      }

      // key handler remove (capture true)
      if (this.keyHandler) {
        try {
          const panel = this.rootEl?.closest?.(".sv-overlay-panel");
          if (panel) panel.removeEventListener("keydown", this.keyHandler, true);
        } catch (_) {}
      }
      this.keyHandler = null;

      // element refs reset
      this.dialogueEl = null;
      this.nameEl = null;
      this.textEl = null;
      this.choicesEl = null;
      this.logPanel = null;
      this.logBody = null;
      this.autoBtn = null;
      this.byeBtn = null;
      this.nextBtn = null;
    },

    hardResetVisualState() {
      if (!this.rootEl) return;
      this.rootEl.classList.remove("sv-fadeout", "sv-exiting");
      const d = this.rootEl.querySelector(".sv-dialogue");
      d?.classList.remove("sv-exit");
    },

    // =========================
    // Rendering
    // =========================
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
            ${["left", "center", "right"].map((slot) => `
              <div class="sv-slot" data-slot="${slot}">
                <div class="sv-portrait" data-character="" data-motion="none">
                  <div class="sv-face-base" role="img" aria-label=""></div>
                  <div class="sv-face-top" aria-hidden="true"></div>
                </div>
              </div>
            `).join("")}
          </div>

          <div class="sv-dialogue" tabindex="0">
            <div class="sv-name">...</div>
            <div class="sv-text">読み込み中...</div>
            <div class="sv-choices" hidden></div>

            <div class="sv-dialogue-actions">
              <button type="button" class="sv-next-btn" aria-label="まだ一緒にいる" hidden>まだ一緒にいる</button>              <button type="button" class="sv-next-btn" aria-label="ま" hidden>つづける</button>       </div>

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
      this.byeBtn = this.rootEl.querySelector(".sv-bye-btn");
      this.nextBtn = this.rootEl.querySelector(".sv-next-btn");

      // click to advance
      this.dialogueEl?.addEventListener("click", () => this.handleAdvance());

      // auto
      this.autoBtn?.addEventListener("click", () => this.toggleAuto());

      // log open/close
      this.rootEl.querySelector(".sv-log-btn")?.addEventListener("click", () => this.toggleLog(true));
      this.rootEl.querySelector(".sv-log-close")?.addEventListener("click", () => this.toggleLog(false));

      // bye
      this.byeBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        this.runByeSequence();
      });

      // next (continue)
      this.nextBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        this.requestNextEpisode();
      });

      // keyboard
      const panel = this.rootEl.closest(".sv-overlay-panel");
      this.keyHandler = (e) => {
        if (!this.rootEl || !this.rootEl.isConnected) return;
        if (this.exiting) return;

        const key = e.key;
        const code = e.code;

        // Space = advance (only if not choices & not end)
        if (!this.waitingChoice && !this.isEndReached && (key === " " || code === "Space")) {
          e.preventDefault();
          this.handleAdvance();
          return;
        }

        // Enter at end = next episode (if end)
        if (this.isEndReached && (key === "Enter" || key === "Return")) {
          e.preventDefault();
          this.requestNextEpisode();
          return;
        }

        // Escape = bye
        if (key === "Escape") {
          e.preventDefault();
          this.runByeSequence();
          return;
        }
      };
      if (panel) panel.addEventListener("keydown", this.keyHandler, true);
    },

    // =========================
    // Data
    // =========================
    async fetchSkit(url) {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error("スキットデータを取得できませんでした。");
      return res.json();
    },

    validate(data) {
      if (!data || !data.start || !data.nodes) throw new Error("スキットデータが不正です。");
      if (!data.nodes[data.start]) throw new Error("開始ノードが見つかりません。");
    },

    // =========================
    // Node flow
    // =========================
    gotoNode(id) {
      if (this.exiting) return;

      const node = this.nodes[id];
      if (!node) {
        this.showError("次のシーンが見つかりません。");
        return;
      }

      this.currentNode = node;
      this.waitingChoice = Array.isArray(node.choices) && node.choices.length > 0;

      this.preloadForNode(node);
      this.renderNode(node);

      const isEnd = !!node.end || (!node.next && !this.waitingChoice);
      this.isEndReached = isEnd;

      // end UI
      this.updateEndActions();

      // auto schedule
      if (this.isEndReached) {
        clearTimeout(this.autoTimer);
        this.autoTimer = null;
        return;
      }
      this.scheduleAuto();
    },

    updateEndActions() {
      if (!this.nextBtn || !this.byeBtn) return;

      if (this.isEndReached) {
        // show "continue", keep "bye" always visible
        this.nextBtn.hidden = false;
        // hint at end
        const hint = this.rootEl?.querySelector?.(".sv-hint");
        if (hint) hint.textContent = "Enter / つづける で次のエピソードへ";
      } else {
        this.nextBtn.hidden = true;
        const hint = this.rootEl?.querySelector?.(".sv-hint");
        if (hint) hint.textContent = "タップ / クリック / Spaceで進む";
      }
    },

    renderNode(node) {
      this.renderCast(node.cast || [], node);
      this.renderDialogue(node);
    },

    // =========================
    // Smooth Swap Core
    // =========================
    swapPortraitImage(portrait, baseEl, topEl, url, ariaLabel) {
      if (!portrait || !baseEl || !topEl || !url) return;

      const token = (portrait.__svSwapToken = (portrait.__svSwapToken || 0) + 1);

      const currentUrl = baseEl.__svUrl || "";
      if (currentUrl === url) {
        if (ariaLabel) baseEl.setAttribute("aria-label", ariaLabel);
        return;
      }

      topEl.style.backgroundImage = `url("${url}")`;
      topEl.style.backgroundRepeat = "no-repeat";
      topEl.style.backgroundPosition = "center bottom";
      topEl.style.backgroundSize = "contain";

      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.src = url;

      const commit = () => {
        if (token !== portrait.__svSwapToken) return;

        portrait.classList.add("sv-swapping");

        requestAnimationFrame(() => {
          if (token !== portrait.__svSwapToken) return;

          const finalize = () => {
            if (token !== portrait.__svSwapToken) return;

            baseEl.style.backgroundImage = `url("${url}")`;
            baseEl.style.backgroundRepeat = "no-repeat";
            baseEl.style.backgroundPosition = "center bottom";
            baseEl.style.backgroundSize = "contain";
            baseEl.__svUrl = url;

            if (ariaLabel) baseEl.setAttribute("aria-label", ariaLabel);

            portrait.classList.remove("sv-swapping");
            topEl.style.backgroundImage = "";
          };

          clearTimeout(portrait.__svSwapFallback);
          portrait.__svSwapFallback = setTimeout(finalize, 260);

          const onEnd = () => {
            clearTimeout(portrait.__svSwapFallback);
            finalize();
          };
          topEl.addEventListener("transitionend", onEnd, { once: true });
        });
      };

      if (img.complete) commit();
      else {
        img.onload = commit;
        img.onerror = () => {
          if (token !== portrait.__svSwapToken) return;
          portrait.classList.remove("sv-swapping");
          topEl.style.backgroundImage = "";
        };
      }
    },

    // =========================
    // Cast
    // =========================
    renderCast(castFrames, node) {
      const slots = ["left", "center", "right"];
      const slotMap = { left: null, center: null, right: null };

      for (const frame of castFrames) {
        if (!frame || !frame.slot) continue;
        if (Object.prototype.hasOwnProperty.call(slotMap, frame.slot)) slotMap[frame.slot] = frame;
      }

      for (const slotName of slots) {
        const slotEl = this.rootEl.querySelector(`.sv-slot[data-slot="${slotName}"]`);
        if (!slotEl) continue;

        const portrait = slotEl.querySelector(".sv-portrait");
        const baseEl = slotEl.querySelector(".sv-face-base");
        const topEl = slotEl.querySelector(".sv-face-top");
        const frame = slotMap[slotName];

        if (!frame || frame.visible === false) {
          slotEl.classList.add("sv-hidden");
          slotEl.classList.remove("sv-speaking", "sv-dimmed");
          if (portrait) {
            portrait.dataset.character = "";
            portrait.dataset.motion = "none";
            portrait.__svSwapToken = (portrait.__svSwapToken || 0) + 1;
            portrait.classList.remove("sv-swapping");
          }
          if (baseEl) {
            baseEl.style.backgroundImage = "";
            baseEl.__svUrl = "";
            baseEl.setAttribute("aria-label", "");
          }
          if (topEl) topEl.style.backgroundImage = "";
          continue;
        }

        slotEl.classList.remove("sv-hidden");

        const character = (frame.character || "").trim().toLowerCase();
        const expression = (frame.expression || "").trim();
        if (portrait) portrait.dataset.character = character;

        const speaking =
          frame.speaking != null
            ? !!frame.speaking
            : (character && character === (node.speaker || "").toLowerCase());

        slotEl.classList.toggle("sv-speaking", speaking);
        slotEl.classList.toggle("sv-dimmed", !speaking);

        const url = this.resolvePortraitUrl(character, expression);
        const label = `${character} ${expression}`.trim();

        this.swapPortraitImage(portrait, baseEl, topEl, url, label);
        this.applyMotion(portrait, frame.motion);
      }
    },

    normalizeExpression(expression) {
      return (expression || "normal").trim().toLowerCase().replace(/\s+/g, "-");
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

    // =========================
    // Dialogue / Choices
    // =========================
    renderDialogue(node) {
      const speaker = node.speaker || "Narration";
      const text = node.text || "";

      const speakerId = this.getSpeakerIdFromSpeakerText(speaker);
      this.applySpeakerId(speakerId);

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
          if (this.exiting) return;
          this.waitingChoice = false;
          this.choicesEl.hidden = true;

          const next = choice.next;
          if (next) this.gotoNode(next);
        });

        this.choicesEl.appendChild(btn);
      });
    },

    normSpeaker(s) {
      return String(s || "")
        .trim()
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[（）()【】\[\]「」『』]/g, " ")
        .replace(/[・:：\-–—_]/g, " ")
        .replace(/\s+/g, " ");
    },

    getSpeakerIdFromSpeakerText(speaker) {
      const raw = this.normSpeaker(speaker);

      if (raw.includes("shiopon") || raw.includes("しおぽん")) return "shiopon";
      if (raw.includes("shioriel") || raw.includes("しおりえる") || raw.includes("シオリエル")) return "shioriel";
      if (raw.includes("lumiere") || raw.includes("りゅみえーる") || raw.includes("リュミエール")) return "lumiere";
      if (raw.includes("shion") || raw.includes("シオン")) return "shion";

      return "narration";
    },

    applySpeakerId(speakerId) {
      const host = document.getElementById(this.config.hostId);
      if (host) host.setAttribute("data-speaker-id", speakerId);

      this.dialogueEl?.setAttribute("data-speaker-id", speakerId);
      this.nameEl?.setAttribute("data-speaker-id", speakerId);
    },

    // =========================
    // Auto
    // =========================
    scheduleAuto() {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;

      if (!this.autoMode) return;
      if (this.waitingChoice) return;
      if (this.exiting) return;
      if (this.isEndReached) return;
      if (!this.currentNode?.next) return;

      this.autoTimer = setTimeout(() => this.handleAdvance(), this.autoDelay);
    },

    handleAdvance() {
      if (this.waitingChoice) return;
      if (!this.currentNode) return;
      if (this.exiting) return;
      if (this.isEndReached) return;

      const nextId = this.currentNode.next;
      if (nextId) this.gotoNode(nextId);
    },

    toggleAuto() {
      if (this.exiting) return;
      this.autoMode = !this.autoMode;
      this.autoBtn?.setAttribute("aria-pressed", String(this.autoMode));
      this.scheduleAuto();
    },

    // =========================
    // Next Episode (continuous)
    // =========================
    requestNextEpisode() {
      if (this.exiting) return;

      // End reached only: avoid accidental mid-skit jumps
      if (!this.isEndReached) return;

      // stop auto
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
      this.autoMode = false;
      this.autoBtn?.setAttribute("aria-pressed", "false");

      // Prefer callback
      if (typeof this.config.onNext === "function") {
        try {
          this.config.onNext();
        } catch (_) {}
        return;
      }

      // Fallback: notify loader
      try {
        window.dispatchEvent(new CustomEvent("sv:skit:next"));
      } catch (_) {
        // very old fallback
        try {
          window.dispatchEvent(new Event("sv:skit:next"));
        } catch (_) {}
      }
    },

    // =========================
    // Bye Sequence (manual only)
    // =========================
    runByeSequence() {
      if (this.exiting) return;
      this.exiting = true;

      clearTimeout(this.autoTimer);
      this.autoTimer = null;
      this.autoMode = false;
      this.autoBtn?.setAttribute("aria-pressed", "false");
      this.waitingChoice = false;

      // old bye timers kill
      clearTimeout(this.byeTimer1);
      clearTimeout(this.byeTimer2);
      this.byeTimer1 = null;
      this.byeTimer2 = null;

      if (this.logPanel) {
        this.logPanel.classList.remove("sv-open");
        this.logPanel.setAttribute("aria-hidden", "true");
      }

      this.rootEl?.classList.add("sv-exiting");

      const chosen = this.pickByeSpeaker();
      const line = this.pickByeLine(chosen);

      this.applySpeakerId(chosen);
      this.focusSpeakerSlot(chosen);

      const nameLabel = this.speakerDisplayName(chosen);
      if (this.nameEl) this.nameEl.textContent = nameLabel;
      if (this.textEl) this.textEl.textContent = line;

      // hide next button at exit
      if (this.nextBtn) this.nextBtn.hidden = true;

      const t1 = this.jitter(this.config.byeDelayMs, 180);
      const t2 = this.config.byeFadeMs;

      this.byeTimer1 = setTimeout(() => this.rootEl?.classList.add("sv-fadeout"), t1);
      this.byeTimer2 = setTimeout(() => this.returnToPage(), t1 + t2);
    },

    jitter(base, range) {
      const half = Math.floor(range / 2);
      return base + (Math.random() * range - half);
    },

    speakerDisplayName(id) {
      if (id === "shiopon") return "しおぽん";
      if (id === "shioriel") return "シオリエル";
      if (id === "lumiere") return "リュミエール";
      if (id === "shion") return "シオン";
      return "Narration";
    },

    pickByeLine(speakerId) {
      const list = this.byeLines[speakerId] || this.byeLines.narration;
      const raw = list[Math.floor(Math.random() * list.length)] || "${userName}、またね。";
      return raw.split("${userName}").join(this.userName || "ゲスト");
    },

    pickByeSpeaker() {
      const visible = [];
      for (const slotName of ["left", "center", "right"]) {
        const slotEl = this.rootEl?.querySelector(`.sv-slot[data-slot="${slotName}"]`);
        if (!slotEl || slotEl.classList.contains("sv-hidden")) continue;
        const portrait = slotEl.querySelector(".sv-portrait");
        const c = (portrait?.dataset?.character || "").trim().toLowerCase();
        if (!c) continue;
        if (this.byeLines[c]) visible.push(c);
      }
      if (visible.length) return visible[Math.floor(Math.random() * visible.length)];
      return "shiopon";
    },

    focusSpeakerSlot(speakerId) {
      let found = false;

      for (const slotName of ["left", "center", "right"]) {
        const slotEl = this.rootEl?.querySelector(`.sv-slot[data-slot="${slotName}"]`);
        if (!slotEl) continue;

        const portrait = slotEl.querySelector(".sv-portrait");
        const c = (portrait?.dataset?.character || "").trim().toLowerCase();

        const isTarget = c && c === speakerId;
        if (isTarget) found = true;

        slotEl.classList.toggle("sv-speaking", isTarget);
        slotEl.classList.toggle("sv-dimmed", !isTarget);
      }

      if (!found) {
        for (const slotName of ["left", "center", "right"]) {
          const slotEl = this.rootEl?.querySelector(`.sv-slot[data-slot="${slotName}"]`);
          if (!slotEl) continue;
          slotEl.classList.remove("sv-dimmed");
        }
      }
    },

    returnToPage() {
      this.stop();

      if (this.config.returnMode === "callback" && typeof this.config.onReturn === "function") {
        this.config.onReturn();
        return;
      }
      if (this.config.returnMode === "href") {
        location.href = this.config.returnHref || "/";
        return;
      }
      if (history.length > 1) history.back();
      else location.href = this.config.returnHref || "/";
    },

    // =========================
    // Log
    // =========================
    toggleLog(open) {
      if (!this.logPanel) return;
      if (this.exiting) return;

      const willOpen = open ?? !this.logPanel.classList.contains("sv-open");
      this.logPanel.classList.toggle("sv-open", willOpen);
      this.logPanel.setAttribute("aria-hidden", String(!willOpen));

      if (willOpen) this.logPanel.querySelector(".sv-log-close")?.focus({ preventScroll: true });
      else this.dialogueEl?.focus({ preventScroll: true });
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

    // =========================
    // Preload
    // =========================
    preloadImage(url) {
      if (!url) return;
      if (this._preloadCache.has(url)) return;

      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.src = url;

      this._preloadCache.set(url, img);
    },

    preloadForNode(node) {
      const cast = Array.isArray(node?.cast) ? node.cast : [];
      for (const frame of cast) {
        if (!frame || frame.visible === false) continue;
        const c = (frame.character || "").trim().toLowerCase();
        const e = (frame.expression || "").trim();
        const url = this.resolvePortraitUrl(c, e);
        this.preloadImage(url);
      }

      const nextId = node?.next;
      if (nextId && this.nodes[nextId]) {
        const nextNode = this.nodes[nextId];
        const nextCast = Array.isArray(nextNode?.cast) ? nextNode.cast : [];
        for (const frame of nextCast) {
          if (!frame || frame.visible === false) continue;
          const c = (frame.character || "").trim().toLowerCase();
          const e = (frame.expression || "").trim();
          const url = this.resolvePortraitUrl(c, e);
          this.preloadImage(url);
        }
      }
    },

    primePreloadCache(data) {
      const startNode = data?.nodes?.[data.start];
      if (startNode) this.preloadForNode(startNode);
    },

    // =========================
    // Error
    // =========================
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
