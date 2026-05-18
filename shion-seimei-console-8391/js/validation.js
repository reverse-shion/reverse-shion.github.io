(function (root, factory) {
  const api = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.ShionValidation = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  const CONFIG = {
    minYear: 1900,
    maxNameLength: 40,
    maxMemoLength: 500,
    minTargetYear: 1900,
    maxTargetYear: 2200,
    allowedTopics: [
      '総合',
      '恋愛',
      '仕事',
      '金運',
      '人間関係',
      '今月の運勢'
    ],
    allowedSpreads: [1, 2, 3, 4, 5]
  };

  function text(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  function isBlank(value) {
    return text(value).length === 0;
  }

  function isRealDate(value) {
    const dateText = text(value);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
      return false;
    }

    const [year, month, day] = dateText.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }

  function toUtcDateOnly(value) {
    const [year, month, day] = text(value).split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  function todayUtc(today = new Date()) {
    return new Date(Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ));
  }

  function unique(values) {
    return Array.from(new Set(values));
  }

  function validateName(value) {
    const name = text(value);

    if (!name) {
      return '';
    }

    if (name.length > CONFIG.maxNameLength) {
      return `お名前は${CONFIG.maxNameLength}文字以内で入力してください。`;
    }

    return '';
  }

  function validateBirthDate(value, today = new Date()) {
    const birthDate = text(value);

    if (!birthDate) {
      return '生年月日を入力してください。星命の芯を見るために必要な情報です。';
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      return '生年月日は YYYY-MM-DD 形式で入力してください。';
    }

    if (!isRealDate(birthDate)) {
      return '存在する日付を入力してください。';
    }

    const [year] = birthDate.split('-').map(Number);

    if (year < CONFIG.minYear) {
      return `${CONFIG.minYear}年以降の生年月日を入力してください。`;
    }

    const inputDate = toUtcDateOnly(birthDate);
    const currentDate = todayUtc(today);

    if (inputDate > currentDate) {
      return '未来の日付は使えません。今日以前の日付を入力してください。';
    }

    return '';
  }

  function validateTopic(value) {
    const topic = text(value);

    if (!topic) {
      return '相談ジャンルを選択してください。今どこを見たいのかを決めると、鑑定の言葉が届きやすくなります。';
    }

    if (!CONFIG.allowedTopics.includes(topic)) {
      return '相談ジャンルの選択内容を確認してください。';
    }

    return '';
  }

  function validateMemo(value) {
    const memo = text(value);

    if (!memo) {
      return '';
    }

    if (memo.length > CONFIG.maxMemoLength) {
      return `相談メモは${CONFIG.maxMemoLength}文字以内で入力してください。少し短くすると、鑑定の焦点が定まりやすくなります。`;
    }

    return '';
  }

  function normalizeTargetYear(value, today = new Date()) {
    const currentYear = today.getFullYear();
    const raw = text(value);
    if (!raw) return currentYear;
    const year = Number(raw);
    if (!Number.isInteger(year)) return currentYear;
    return Math.max(CONFIG.minTargetYear, Math.min(CONFIG.maxTargetYear, year));
  }

  function validateTargetYear(value) {
    const raw = text(value);
    if (!raw) return '';
    const year = Number(raw);
    if (!Number.isInteger(year)) return '鑑定対象年は西暦の数字で入力してください。未入力なら現在年で鑑定します。';
    if (year < CONFIG.minTargetYear) return `${CONFIG.minTargetYear}年以降を入力してください。`;
    if (year > CONFIG.maxTargetYear) return `${CONFIG.maxTargetYear}年までを目安に入力してください。`;
    return '';
  }

  function validateSpread(value) {
    const spread = Number(value);

    if (!Number.isInteger(spread)) {
      return 'カード枚数を選択してください。';
    }

    if (!CONFIG.allowedSpreads.includes(spread)) {
      return 'カード枚数の選択内容を確認してください。';
    }

    return '';
  }

  function validateBaseInput(input = {}) {
    const errors = [];

    const nameError = validateName(input.name);
    if (nameError) errors.push(nameError);

    const birthError = validateBirthDate(input.birthDate);
    if (birthError) errors.push(birthError);

    const topicError = validateTopic(input.topic);
    if (topicError) errors.push(topicError);

    const spreadError = validateSpread(input.spread);
    if (spreadError) errors.push(spreadError);

    const targetYearError = validateTargetYear(input.targetYear);
    if (targetYearError) errors.push(targetYearError);

    const memoError = validateMemo(input.memo);
    if (memoError) errors.push(memoError);

    return errors;
  }

  function validateTarot(cards = [], count = 0) {
    const errors = [];
    const spread = Number(count);

    if (!Number.isInteger(spread) || !CONFIG.allowedSpreads.includes(spread)) {
      errors.push('カード枚数の選択内容を確認してください。');
      return errors;
    }

    if (!Array.isArray(cards)) {
      errors.push('タロットカードの選択内容を確認してください。');
      return errors;
    }

    if (cards.length < spread) {
      errors.push('選択されたカード枚数が不足しています。カードを選び直してください。');
      return errors;
    }

    const selectedNames = [];

    for (let index = 0; index < spread; index += 1) {
      const card = cards[index] || {};
      const cardName = text(card.name);

      if (isBlank(cardName)) {
        continue;
      }

      selectedNames.push(cardName);
    }

    const duplicated = selectedNames.filter((name, index, list) => {
      return list.indexOf(name) !== index;
    });

    if (duplicated.length > 0) {
      errors.push(
        `同じカードが重複しています：${unique(duplicated).join('、')}。詩韻式では、それぞれの位置に別の象徴を置いて流れを読みます。`
      );
    }

    return errors;
  }

  function validateBeforeReading(input = {}, cards = []) {
    const baseErrors = validateBaseInput(input);
    const tarotErrors = cards && cards.length
      ? validateTarot(cards, input.spread)
      : [];

    return baseErrors.concat(tarotErrors);
  }

  return {
    isRealDate,
    validateBirthDate,
    validateName,
    validateTopic,
    validateMemo,
    validateSpread,
    validateTargetYear,
    normalizeTargetYear,
    validateBaseInput,
    validateTarot,
    validateBeforeReading
  };
});
