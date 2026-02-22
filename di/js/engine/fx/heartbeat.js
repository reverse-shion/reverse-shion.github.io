// /di/js/engine/fx/heartbeat.js
export function attachHeartbeat(FX) {
  FX.prototype.heartbeat = function () {
    this.app.classList.add("isHeartbeat");
    setTimeout(() => {
      this.app.classList.remove("isHeartbeat");
    }, 650);
  };
}
