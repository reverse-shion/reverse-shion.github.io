(function(root,factory){const api=factory(); if(typeof module!=='undefined'&&module.exports) module.exports=api; root.ShionMessages=api;})(typeof globalThis!=='undefined'?globalThis:window,function(){'use strict';
const THEMES={love_contact:'連絡',love_confession:'告白',love_reconciliation:'復縁',love_waiting:'待つ',general:'総合'};
const ACTIONS={love_contact:{rec:'短く自然な連絡、軽い近況確認、相手の反応を見る',avoid:'長文、追いLINE、返事の催促、過去の責め言葉',words:['最近ふと思い出して、少し話したくなった','元気にしてる？','この前のこと、少しだけ話せたら嬉しい']},love_confession:{rec:'素直な気持ちを短く伝える、相手に答えを急がせない、自分の本音を中心にする',avoid:'重すぎる告白、相手の気持ちを決めつける、返事をその場で求める',words:['ちゃんと伝えたくて、私はまだ大切に思っています','答えを急がせたいわけじゃなくて、自分の気持ちを伝えたかった']},love_reconciliation:{rec:'責めない、本音を整えて伝える、相手の状況を尊重する、会話の扉を開く',avoid:'過去の蒸し返し、返事の催促、「戻りたい」と一気に迫る、被害者意識の強い言葉',words:['責めたいわけじゃなくて、少しだけ話がしたい','まだ大切に思っている気持ちがあるから、ちゃんと伝えたかった']},love_waiting:{rec:'待つ期限を決める、自分の生活を整える、感情的な確認を避ける',avoid:'何度も確認する、SNSを見張る、勝手に悪い想像を膨らませる',words:['落ち着いたら、また話せたら嬉しい','無理に返事を急がせたいわけじゃないよ']},general:{rec:'小さく動く、状況確認、無理に結果を求めない、準備を整える',avoid:'焦って決める、相手を動かそうとする、感情的に判断する',words:['少し確認したくて連絡しました','急ぎではないけど、話せたら嬉しいです']}};
const MAJOR={"The Emperor":"自分の軸を持って動く","The Hierophant":"誠実さ、信頼、常識","The Lovers":"選択、本音、関係性","The Chariot":"気持ちを守りながら進む",Strength:"焦らず、優しく強く向き合う","The Hermit":"一度内側を見つめる",Justice:"冷静な判断、対等な関係",Death:"終わりと再生、区切り",Temperance:"距離感、調整、歩み寄り","The Devil":"執着と欲望を見つめる","The Star":"希望、回復、未来への信頼","The Moon":"不安、揺れ、直感の整理"};
const COURT={Page:'軽い連絡、様子見、入口を作る',Knight:'動く、誘う、勢い。ただし急ぎすぎに注意する',Queen:'感情を整え、優しく伝え、受容する',King:'現実的に向き合い、確認し、話し合う'};
function jpDate(s){const [,m,d]=s.split('-').map(Number);return `${m}月${d}日`;} function courtStyle(c){return COURT[(c||'').split(' ')[0]]||'落ち着いて状況に合わせる';}
function reMessage(i){if(!i.premium_mode) return ''; switch(i.re_level||i.day_type){case 'action_day':return `
Re判定では、この日に気持ちが重く固定されすぎている流れは強くありません。短く自然に動くことで、言葉が届きやすくなります。`; case 'careful_action_day':return `
Re判定では、この日は少し慎重に使いたい流れもあります。「この日で決めたい」と思いすぎると、言葉が重くなりやすい日です。短く、相手が返しやすい言葉を意識してください。`; case 'self_check_day':return `
Re判定では、この日は「動きたい気持ち」と「結果を急ぎたい気持ち」が重なりやすい流れです。連絡する前に、一度下書きを作り、時間を置いて読み返してください。不安からの確認ではなく、本音を静かに伝えることが大切です。`; case 'review_release_day':return `
Re判定では、この日への意味づけがかなり強くなっています。「この日しかない」と思うほど、言葉は重くなり、相手の反応に心が縛られやすくなります。今日は結論を取りに行くより、気持ちを整え、送る言葉を軽くすることを優先してください。`; default:return '';}}
function generateCustomerMessage(result){const i=result.internal,a=ACTIONS[i.theme]||ACTIONS.general; const re=reMessage(i); const full=`星が導く本命日は、${jpDate(i.primary_date)}です。${re}

この日は、${MAJOR[i.major_theme]||'流れを静かに見つめる'}という期間テーマの中で、あなたの気持ちを言葉にしやすい日です。動き方は「${courtStyle(i.court_ruler)}」を意識してください。

準備日は${jpDate(i.preparation_date)}です。この日に伝えたいことを一度整理しておくと、本命日に落ち着いて動けます。

慎重日は${jpDate(i.caution_date)}です。この日は相手の反応を急がず、追いLINEや強い確認を控えることが大切です。

おすすめ行動：${a.rec}
避ける行動：${a.avoid}
言葉の温度感：${a.words.map(w=>'「'+w+'」').join(' / ')}

結果を急がず、言葉の温度を大切にしてください。`; return{full,meaning:`${MAJOR[i.major_theme]||'星座全体の流れ'}を背景に、${courtStyle(i.court_ruler)}日です。`,recommended:a.rec,avoid:a.avoid,tone:a.words.join(' / '),short:`本命日：${jpDate(i.primary_date)}。準備日：${jpDate(i.preparation_date)}。慎重日：${jpDate(i.caution_date)}。短く自然に、結果を急がず言葉の温度を大切に。`};}
return{THEMES,ACTIONS,MAJOR,COURT,generateCustomerMessage,jpDate};});
