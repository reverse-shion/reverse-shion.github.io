window.ShionValidation = {
  validate(input) {
    const today = new Date().toISOString().slice(0, 10);

    const isInvalidDate = (value) => !value || Number.isNaN(new Date(value).getTime());

    if (isInvalidDate(input.readingDate)) return { ok: false, message: "診断日を入力してください。" };
    if (input.readingDate > today) return { ok: false, message: "未来日は入力できません。" };

    if (input.diagnosisType === "pair") {
      if (!input.userName) return { ok: false, message: "あなたの名前・ニックネームを入力してください。" };
      if (isInvalidDate(input.userBirthDate)) return { ok: false, message: "あなたの生年月日を入力してください。" };
      if (!input.partnerName) return { ok: false, message: "お相手の呼び名・ニックネームを入力してください。" };
      if (isInvalidDate(input.partnerBirthDate)) return { ok: false, message: "お相手の生年月日を入力してください。" };
      if (input.userBirthDate > today || input.partnerBirthDate > today) return { ok: false, message: "生年月日に未来日は入力できません。" };
    } else {
      if (!input.singleName) return { ok: false, message: "名前・ニックネームを入力してください。" };
      if (isInvalidDate(input.singleBirthDate)) return { ok: false, message: "生年月日を入力してください。" };
      if (input.singleBirthDate > today) return { ok: false, message: "生年月日に未来日は入力できません。" };
    }

    return { ok: true };
  }
};
