// /di/js/result.js
import { init } from "./result/index.js";

// main.js が期待するグローバルを生やす（ビルド無し運用の正解）
window.DI_RESULT = { init };
window.TB_RESULT = window.TB_RESULT || {};
