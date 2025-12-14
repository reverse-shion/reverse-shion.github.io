// ======================================================
// Shionverse Common Utilities
// ユーザー名・共通状態管理
// ======================================================

(function(){
  "use strict";

  /**
   * ユーザー名を保存＆即時反映
   * @param {string} name
   */
  window.setUserName = function(name){
    const n = String(name || "").trim();
    if(!n) return;

    // 永続保存（エンジン標準）
    localStorage.setItem("sv_user_name", n);

    // 即時反映用（リロード不要）
    window.ShioponUserName = n;
  };

  /**
   * ユーザー名を取得（優先順あり）
   */
  window.getUserName = function(){
    return (
      window.ShioponUserName ||
      localStorage.getItem("sv_user_name") ||
      "ゲスト"
    );
  };

})();
