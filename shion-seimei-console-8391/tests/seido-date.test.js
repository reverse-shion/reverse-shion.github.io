const assert = require('assert');
const S = require('../assets/js/seido-date.js');
function calc(input){return S.calculatePrimaryDate({season_year:2026,theme:'love_contact',client_words:'',client_desired_date:'',additional_cards:'',...input}).internal;}
let r=calc({decan_card:'The Emperor',day_key_card_type:'numbered',day_key_card_suit:'Wands',day_key_card_rank:'3'});
assert.strictEqual(r.primary_window_start,'2026-03-30'); assert.strictEqual(r.primary_window_end,'2026-04-08'); assert.strictEqual(r.primary_date,'2026-04-03'); assert.strictEqual(r.confidence_level,'high');
r=calc({decan_card:'Wands 3',day_key_card_type:'major',day_key_card_suit:'Major',day_key_card_rank:'Major',day_key_card_number:'4'});
assert.strictEqual(r.primary_window_start,'2026-03-30'); assert.strictEqual(r.primary_window_end,'2026-04-08'); assert.strictEqual(r.primary_date,'2026-04-03'); assert.strictEqual(r.confidence_level,'high');
r=calc({decan_card:'Wands 3',day_key_card_type:'numbered',day_key_card_suit:'Wands',day_key_card_rank:'3'});
assert.strictEqual(r.primary_window_start,'2026-03-30'); assert.strictEqual(r.primary_window_end,'2026-04-08'); assert.strictEqual(r.confidence_level,'high');
r=calc({decan_card:'The Emperor',day_key_card_type:'major',day_key_card_suit:'Major',day_key_card_rank:'Major',day_key_card_number:'6'});
assert.strictEqual(r.primary_window_start,'2026-03-20'); assert.strictEqual(r.secondary_windows[0].start,'2026-05-21'); assert.strictEqual(r.calculation_mode,'separated_windows'); assert.strictEqual(r.confidence_level,'caution');
r=calc({decan_card:'Wands 3',day_key_card_type:'numbered',day_key_card_suit:'Cups',day_key_card_rank:'5'});
assert.strictEqual(r.primary_window_start,'2026-03-30'); assert.strictEqual(r.secondary_windows[0].start,'2026-10-23'); assert.strictEqual(r.calculation_mode,'separated_windows');
r=calc({decan_card:'The Emperor',day_key_card_type:'major',day_key_card_suit:'Major',day_key_card_rank:'Major',day_key_card_number:'16'});
assert.strictEqual(r.primary_window_start,'2026-03-20'); assert.ok(r.calculation_note.includes('直接の日付対応を持たない'));
r=calc({decan_card:'The Emperor',day_key_card_type:'numbered',day_key_card_suit:'Wands',day_key_card_rank:'3',client_desired_date:'2026-04-05'});
assert.strictEqual(r.primary_window_start,'2026-03-30'); assert.strictEqual(r.primary_date,'2026-04-05'); assert.strictEqual(r.desired_date_status,'inside_primary');
r=calc({decan_card:'The Emperor',day_key_card_type:'numbered',day_key_card_suit:'Wands',day_key_card_rank:'3',client_desired_date:'2026-10-18'});
assert.strictEqual(r.primary_date,'2026-04-03'); assert.strictEqual(r.desired_date_status,'outside_all');
r=calc({decan_card:'The Devil',day_key_card_type:'numbered',day_key_card_suit:'Pentacles',day_key_card_rank:'3',client_desired_date:'2026-01-05'});
assert.strictEqual(r.period_card.start,'2025-12-21'); assert.strictEqual(r.day_key_card.start,'2025-12-31'); assert.strictEqual(r.primary_window_start,'2025-12-31'); assert.strictEqual(r.primary_window_end,'2026-01-09'); assert.strictEqual(r.primary_date,'2026-01-05');
r=calc({season_year:2026,decan_card:'The Star',day_key_card_type:'numbered',day_key_card_suit:'Swords',day_key_card_rank:'6'});
assert.strictEqual(r.period_card.start,'2027-01-20'); assert.strictEqual(r.day_key_card.start,'2027-01-30'); assert.strictEqual(r.primary_window_start,'2027-01-30'); assert.strictEqual(r.primary_window_end,'2027-02-08');
console.log('seido-date tests passed');

function assertGolden(name, input, expected) {
  const actual = calc(input);
  Object.entries(expected).forEach(([key, value]) => {
    assert.deepStrictEqual(actual[key], value, `${name}: ${key}`);
  });
}

assertGolden('通常デカン', {decan_card:'Wands 3',day_key_card_type:'numbered',day_key_card_suit:'Wands',day_key_card_rank:'3'}, {calculation_mode:'overlap',primary_window_start:'2026-03-30',primary_window_end:'2026-04-08',primary_date:'2026-04-03',preparation_date:'2026-04-01',caution_date:'2026-04-04',day_index:3,suit_shift:0,R:20,re_level:'careful_action_day'});
assertGolden('期間の重なりあり', {decan_card:'The Emperor',day_key_card_type:'numbered',day_key_card_suit:'Wands',day_key_card_rank:'3'}, {calculation_mode:'contained',primary_window_start:'2026-03-30',primary_window_end:'2026-04-08',primary_date:'2026-04-03',preparation_date:'2026-04-01',caution_date:'2026-04-04',suit_shift:0,R:18});
assertGolden('期間の重なりなし', {decan_card:'Wands 3',day_key_card_type:'numbered',day_key_card_suit:'Cups',day_key_card_rank:'5'}, {calculation_mode:'separated_windows',primary_window_start:'2026-03-30',primary_window_end:'2026-04-08',primary_date:'2026-04-03',secondary_windows:[{name:'Cups 5',start:'2026-10-23',end:'2026-11-01',role:'day_key'}],R:8});
assertGolden('希望日が本命期間内', {decan_card:'The Emperor',day_key_card_type:'numbered',day_key_card_suit:'Wands',day_key_card_rank:'3',client_desired_date:'2026-04-05'}, {primary_date:'2026-04-05',preparation_date:'2026-04-03',caution_date:'2026-04-06',desired_date_status:'inside_primary',R:34,re_level:'self_check_day'});
assertGolden('希望日が本命期間外', {decan_card:'The Emperor',day_key_card_type:'numbered',day_key_card_suit:'Wands',day_key_card_rank:'3',client_desired_date:'2026-10-18'}, {primary_date:'2026-04-03',desired_date_status:'outside_all',R:18});
assertGolden('山羊座年またぎ', {decan_card:'The Devil',day_key_card_type:'numbered',day_key_card_suit:'Pentacles',day_key_card_rank:'3',client_desired_date:'2026-01-05'}, {primary_window_start:'2025-12-31',primary_window_end:'2026-01-09',primary_date:'2026-01-05',preparation_date:'2026-01-03',caution_date:'2026-01-06'});
assertGolden('水瓶座年またぎ', {decan_card:'The Star',day_key_card_type:'numbered',day_key_card_suit:'Swords',day_key_card_rank:'6'}, {primary_window_start:'2027-01-30',primary_window_end:'2027-02-08',primary_date:'2027-02-03',preparation_date:'2027-02-01',caution_date:'2027-02-04'});
assertGolden('魚座年またぎ', {decan_card:'The Moon',day_key_card_type:'numbered',day_key_card_suit:'Cups',day_key_card_rank:'9'}, {primary_window_start:'2027-02-28',primary_window_end:'2027-03-09',primary_date:'2027-03-04',preparation_date:'2027-03-02',caution_date:'2027-03-05'});
assertGolden('Ace', {decan_card:'Wands 3',day_key_card_type:'ace',day_key_card_suit:'Wands',day_key_card_rank:'Ace'}, {calculation_mode:'single_date_source',primary_date:'2026-03-30',day_index:1,preparation_date:'2026-03-29',caution_date:'2026-03-31'});
assertGolden('数札', {decan_card:'Wands 3',day_key_card_type:'numbered',day_key_card_suit:'Wands',day_key_card_rank:'8'}, {calculation_mode:'separated_windows',primary_date:'2026-04-03',day_index:8,secondary_windows:[{name:'Wands 8',start:'2026-11-22',end:'2026-12-01',role:'day_key'}]});
assertGolden('Page', {decan_card:'Wands 3',day_key_card_type:'court',day_key_card_suit:'Wands',day_key_card_rank:'Page'}, {calculation_mode:'single_date_source',primary_date:'2026-03-31',day_index:2});
assertGolden('Knight', {decan_card:'Wands 3',day_key_card_type:'court',day_key_card_suit:'Wands',day_key_card_rank:'Knight'}, {calculation_mode:'single_date_source',primary_date:'2026-04-02',day_index:4});
assertGolden('Queen', {decan_card:'Wands 3',day_key_card_type:'court',day_key_card_suit:'Wands',day_key_card_rank:'Queen'}, {calculation_mode:'single_date_source',primary_date:'2026-04-05',day_index:7});
assertGolden('King', {decan_card:'Wands 3',day_key_card_type:'court',day_key_card_suit:'Wands',day_key_card_rank:'King'}, {calculation_mode:'single_date_source',primary_date:'2026-04-08',day_index:10});
assertGolden('Major', {decan_card:'Wands 3',day_key_card_type:'major',day_key_card_suit:'Major',day_key_card_rank:'Major',day_key_card_number:'4'}, {calculation_mode:'contained',primary_date:'2026-04-03',day_index:4,R:18});
assertGolden('日付非対応カード', {decan_card:'The Emperor',day_key_card_type:'major',day_key_card_suit:'Major',day_key_card_rank:'Major',day_key_card_number:'16'}, {calculation_mode:'single_date_source',primary_window_start:'2026-03-20',primary_window_end:'2026-04-19',primary_date:'2026-03-25',day_index:6,R:8});
assertGolden('準備日', {decan_card:'Wands 3',day_key_card_type:'court',day_key_card_suit:'Wands',day_key_card_rank:'King'}, {primary_date:'2026-04-08',preparation_date:'2026-04-06'});
assertGolden('慎重日', {decan_card:'Wands 3',day_key_card_type:'court',day_key_card_suit:'Wands',day_key_card_rank:'King'}, {primary_date:'2026-04-08',caution_date:'2026-04-09'});
assertGolden('Re判定有効', {decan_card:'Wands 3',day_key_card_type:'numbered',day_key_card_suit:'Wands',day_key_card_rank:'3',client_desired_date:'2026-04-03',client_words:'この日しかない。どうしても'}, {desired_date_status:'fixation_risk',R:54,re_level:'review_release_day'});
assertGolden('Re判定無効', {decan_card:'Wands 3',day_key_card_type:'numbered',day_key_card_suit:'Wands',day_key_card_rank:'3'}, {desired_date_status:'none',R:20,re_level:'careful_action_day'});

console.log('seido-date golden tests passed');
