(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ShionValidation = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  function isRealDate(value) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const [y,m,d] = value.split('-').map(Number); const dt = new Date(Date.UTC(y, m-1, d)); return dt.getUTCFullYear() === y && dt.getUTCMonth() === m-1 && dt.getUTCDate() === d; }
  function validateBirthDate(value, today = new Date()) {
    if (!value) return '生年月日を入力してください。';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '生年月日は YYYY-MM-DD 形式で入力してください。';
    if (!isRealDate(value)) return '存在する日付を入力してください。';
    const [y,m,d] = value.split('-').map(Number); const input = new Date(Date.UTC(y,m-1,d)); const now = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    if (input > now) return '未来の日付は使えません。今日以前の日付を入力してください。';
    return '';
  }
  function validateBaseInput(input) { const errors = []; const birth = validateBirthDate(input.birthDate); if (birth) errors.push(birth); if (!input.topic) errors.push('相談ジャンルを選択してください。'); return errors; }
  function validateTarot(cards, count) { const errors = []; for (let i=0; i<count; i += 1) { if (!cards[i] || !cards[i].name) errors.push(`${i+1}枚目のタロットカードを選択してください。`); if (!cards[i] || !cards[i].orientation) errors.push(`${i+1}枚目の正位置/逆位置を選択してください。`); } return errors; }
  return { isRealDate, validateBirthDate, validateBaseInput, validateTarot };
});
