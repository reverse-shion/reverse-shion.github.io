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

    __endByeTimer: null,
    __byeT1: null,
    __byeT2: null,

    // =========================
    // Config
    // =========================
    config: {
      hostId: "sv-skit",
      returnMode: "history",   // "history" | "href" | "callback"
      returnHref: "/",
      onReturn: null,

      byeDelayMs: 950,
      byeFadeMs: 420,
      randomByeSpeaker: true,

      // ★重要：LOADER と Esc が競合するなら true（推奨）
      // true なら Engine 側は Esc を「またね」に使わない（×で閉じる/LOADER Escに任せる）
      // falseなら Engine Esc = またね演出（没入優先）
      disableEngineEsc: true,
    },

    // キャラ別「またね」台詞
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
    async start({ rootEl, skitUrl, userName, returnMode, returnHref, onReturn, disableEngineEsc } = {}) {
      this.stop();

      this.rootEl = rootEl;
      this.skit = null;
      this.nodes = {};
      this.currentNode = null;
      this.log = [];
      this.autoMode = false;
      this.waitingChoice = false;
      this.exiting = false;

      // userName（未指定ならlocalStorage）
      this.userName =
        (userName && String(userName).trim()) ||
        (localStorage.getItem("sv_user_name") || "").trim() ||
        "あなた";

      // return設定（必要なら上書き）
      if (returnMode) this.config.returnMode = returnMode;
      if (returnHref) this.config.returnHref = returnHref;
      if (typeof onReturn === "function") this.config.onReturn = onReturn;
      if (typeof disableEngineEsc === "boolean") this.config.disableEngineEsc = disableEngineEsc;

      // UI mount
      this.rootEl.innerHTML = this.renderShell();
      this.bindStaticElements();

      try {
        const data = await this.fetchSkit(skitUrl);
        this.validate(data);

        this.skit = data;
        this.nodes = data.nodes || {};

        const titleEl = this.rootEl.querySelector(".sv-title");
        if (titleEl) titleEl.textContent = data.meta?.title || "Skit Window";

        this.autoBtn?.setAttribute("aria-pressed", "false");

        // 先読み（初回表示の安定）
        this.primePreloadCache(data);

        this.gotoNode(data.start);
      } catch (err) {
        this.showError(err?.message || "スキットの読み込みに失敗しました。");
      }
    },

    stop() {
      // timers
      clearTimeout(this.autoTimer);
      clearTimeout(this.__endByeTimer);
      clearTimeout(this.__byeT1);
      clearTimeout(this.__byeT2);

      this.autoTimer = null;
      this.__endByeTimer = null;
      this.__byeT1 = null;
      this.__byeT2 = null;

      // flags
      this.autoMode = false;
      this.waitingChoice = false;
      this.exiting = false;

      // panels
      if (this.logPanel) {
        this.logPanel.classList.remove("sv-open");
        this.logPanel.setAttribute("aria-hidden", "true");
      }

      // remove exit classes
      this.rootEl?.classList.remove("sv-fadeout");
      this.dialogueEl?.classList.remove("sv-exit");

      // key handler cleanup
      if (this.keyHandler && this.rootEl) {
        const panel = this.rootEl.closest(".sv-overlay-panel");
        if (panel) panel.removeEventListener("keydown", this.keyHandler, true);
      }
      this.keyHandler = null;
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
            <div class="sv-hint">タップ / クリック / Spaceで進む</div>
          </div>

          <!-- ★常駐「またね」 -->
          <button type="button" class="sv-bye-btn" aria-label="またね">またね</button>

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

      // Advance click
      this.dialogueEl?.addEventListener("click", () => this.handleAdvance());

      // Auto
      this.autoBtn?.addEventListener("click", () => this.toggleAuto());

      // Log
      this.rootEl.querySelector(".sv-log-btn")?.addEventListener("click", () => this.toggleLog(true));
      this.rootEl.querySelector(".sv-log-close")?.addEventListener("click", () => this.toggleLog(false));

      // Bye (always available)
      this.byeBtn?.addEventListener("click", () => this.runByeSequence({ preferSpeakerFromCurrent: true }));

      // Keyboard
      const panel = this.rootEl.closest(".sv-overlay-panel");
      this.keyHandler = (e) => {
        if (!this.rootEl || !this.rootEl.isConnected) return;
        if (this.exiting) return;

        // Space: advance
        if (!this.waitingChoice && (e.key === " " || e.code === "Space")) {
          e.preventDefault();
          this.handleAdvance();
          return;
        }

        // Esc: 競合回避（推奨は LOADER側の Esc close）
        if (e.key === "Escape") {
          if (this.config.disableEngineEsc) return; // LOADERに任せる
          e.preventDefault();
          this.runByeSequence({ preferSpeakerFromCurrent: true });
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

      // 画像先読み
      this.preloadForNode(node);

      this.renderNode(node);

      // 終端検出：end:true or nextなし（choiceもない）
      const isEnd = !!node.end || (!node.next && !this.waitingChoice);
      if (isEnd) {
        this.scheduleEndAutoBye();
        return;
      }

      this.scheduleAuto();
    },

    renderNode(node) {
      this.renderCast(node.cast || [], node);
      this.renderDialogue(node);
    },

    scheduleEndAutoBye() {
      clearTimeout(this.__endByeTimer);
      this.__endByeTimer = setTimeout(() => {
        if (!this.exiting && this.rootEl && this.rootEl.isConnected) {
          this.runByeSequence({ preferSpeakerFromCurrent: true, fromEnd: true });
        }
      }, 900);
    },

    // ============================================================
    // Smooth Swap Core
    // ============================================================
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
        if (slotMap.hasOwnProperty(frame.slot)) slotMap[frame.slot] = frame;
      }

      for (const slotName of slots) {
        const slotEl = this.rootEl.querySelector(`.sv-slot[data-slot="${slotName}"]`);
        if (!slotEl) continue;

        const portrait = slotEl.querySelector(".sv-portrait");
        const baseEl = slotEl.querySelector(".sv-face-base");
        const topEl = slotEl.querySelector(".sv-face-top");
        const frame = slotMap[slotName];

        // 非表示
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

        // 表示
        slotEl.classList.remove("sv-hidden");

        const character = (frame.character || "").trim().toLowerCase();
        const expression = (frame.expression || "").trim();
        if (portrait) portrait.dataset.character = character;

        // speaking判定
        const speaking =
          frame.speaking != null
            ? !!frame.speaking
            : (character && character === (node.speaker || "").toLowerCase());

        slotEl.classList.toggle("sv-speaking", speaking);
        slotEl.classList.toggle("sv-dimmed", !speaking);

        // 画像URL
        const url = this.resolvePortraitUrl(character, expression);
        const label = `${character} ${expression}`.trim();

        this.swapPortraitImage(portrait, baseEl, topEl, url, label);

        this.applyMotion(portrait, frame.motion);
      }
    },

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

    // ========== SpeakerId helpers ==========
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
      if (!this.currentNode?.next) return;

      this.autoTimer = setTimeout(() => this.handleAdvance(), this.autoDelay);
    },

    handleAdvance() {
      if (this.waitingChoice) return;
      if (!this.currentNode) return;
      if (this.exiting) return;

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
    // Bye Sequence
    // =========================
    runByeSequence(opts = {}) {
      if (this.exiting) return;
      this.exiting = true;

      // lock
      clearTimeout(this.autoTimer);
      clearTimeout(this.__endByeTimer);
      this.autoTimer = null;
      this.__endByeTimer = null;

      this.autoMode = false;
      this.autoBtn?.setAttribute("aria-pressed", "false");

      // choices lock & hide
      this.waitingChoice = false;
      if (this.choicesEl) {
        this.choicesEl.hidden = true;
        this.choicesEl.innerHTML = "";
      }

      // disable buttons to prevent double-tap race
      this.autoBtn?.setAttribute("disabled", "disabled");
      this.byeBtn?.setAttribute("disabled", "disabled");

      // close log
      if (this.logPanel) {
        this.logPanel.classList.remove("sv-open");
        this.logPanel.setAttribute("aria-hidden", "true");
      }

      // dialogue soft switch
      this.dialogueEl?.classList.add("sv-exit");

      // choose speaker
      const chosen = this.pickByeSpeaker(!!opts.preferSpeakerFromCurrent);
      const line = this.pickByeLine(chosen);

      // apply speaker color
      this.applySpeakerId(chosen);

      // stage focus: one character forward
      this.focusSpeakerSlot(chosen);

      // set name + text (do NOT log)
      const nameLabel = this.speakerDisplayName(chosen);
      if (this.nameEl) this.nameEl.textContent = nameLabel;
      if (this.textEl) this.textEl.textContent = line;

      // fadeout & return
      const t1 = this.jitter(this.config.byeDelayMs, 180); // 0.8〜1.2秒帯
      const t2 = this.config.byeFadeMs;

      clearTimeout(this.__byeT1);
      clearTimeout(this.__byeT2);

      this.__byeT1 = setTimeout(() => {
        this.rootEl?.classList.add("sv-fadeout");
      }, t1);

      this.__byeT2 = setTimeout(() => {
        this.returnToPage();
      }, t1 + t2);
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
      return raw.replaceAll("${userName}", this.userName || "あなた");
    },

    pickByeSpeaker(preferCurrent) {
      // 1) current speaker優先
      if (preferCurrent && this.currentNode?.speaker) {
        const s = this.getSpeakerIdFromSpeakerText(this.currentNode.speaker);
        if (s && s !== "narration") return s;
      }

      // 2) 表示中のキャラからランダム
      const visible = [];
      for (const slotName of ["left", "center", "right"]) {
        const slotEl = this.rootEl?.querySelector(`.sv-slot[data-slot="${slotName}"]`);
        if (!slotEl || slotEl.classList.contains("sv-hidden")) continue;
        const portrait = slotEl.querySelector(".sv-portrait");
        const c = (portrait?.dataset?.character || "").trim().toLowerCase();
        if (!c) continue;
        visible.push(c);
      }
      if (visible.length) {
        const pick = visible[Math.floor(Math.random() * visible.length)];
        if (this.byeLines[pick]) return pick;
      }

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

    // ★ここが「完全接続」の核：callback優先
    returnToPage() {
      // エンジン内部を止める（タイマー/キー解除）
      this.stop();

      // 1) callback（LOADER close）を最優先
      if (this.config.returnMode === "callback" && typeof this.config.onReturn === "function") {
        try {
          this.config.onReturn();
        } catch (_) {
          // fallback
          window.dispatchEvent(new CustomEvent("sv:skit:close"));
        }
        return;
      }

      // 2) href
      if (this.config.returnMode === "href") {
        location.href = this.config.returnHref || "/";
        return;
      }

      // 3) history
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
    _preloadCache: new Map(),

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
