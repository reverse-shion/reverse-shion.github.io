export class AudioController {
  constructor(url, notify = () => {}, createAudio = () => new Audio()) {
    this.url = url; this.notify = notify; this.createAudio = createAudio;
    this.audio = null; this.enabled = false; this.active = false; this.mode = 'explore'; this.pending = null; this.disposed = false;
  }
  toggle() { if (this.disposed) return; this.enabled = !this.enabled; this.sync(); }
  setScene(mode, active) { this.mode = mode; this.active = active; this.sync(); }
  sync() {
    const wanted = this.enabled && this.active && !this.disposed;
    if (!wanted) { this.audio?.pause(); this.notify(this.enabled); return; }
    if (!this.audio) {
      this.audio = this.createAudio(); this.audio.preload = 'none'; this.audio.loop = true; this.audio.src = this.url;
      this.onError = () => { this.enabled = false; this.audio.pause(); this.notify(false, '音楽を読み込めませんでした。音楽ボタンで再試行できます。'); };
      this.audio.addEventListener('error', this.onError);
    }
    this.audio.volume = this.mode === 'skit' ? 0.18 : 0.34;
    this.notify(true);
    if (this.pending || !this.audio.paused) return;
    try {
      this.pending = Promise.resolve(this.audio.play()).catch(() => {
        if (this.enabled && this.active && !this.disposed) {
          this.enabled = false; this.notify(false, '音楽ボタンをもう一度押すと再生を試せます。');
        }
      }).finally(() => {
        this.pending = null;
        if (!this.enabled || !this.active || this.disposed) this.audio?.pause();
      });
    } catch (_) { this.enabled = false; this.notify(false, 'このブラウザで音楽を開始できませんでした。'); }
  }
  dispose() {
    this.disposed = true; this.enabled = false; this.active = false;
    if (this.audio) { this.audio.pause(); this.audio.removeEventListener('error', this.onError); this.audio.removeAttribute('src'); this.audio.load(); }
  }
}
