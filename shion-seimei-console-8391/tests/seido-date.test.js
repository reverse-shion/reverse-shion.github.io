const assert = require('assert');
const S = require('../assets/js/seido-date.js');
function calc(input){return S.calculatePrimaryDate({theme:'love_contact', premium_mode:false, day_key_card_number:7, additional_cards:'', client_words:'', ...input}).internal;}
let r=calc({season_year:2026,decan_card:'Wands 6',day_key_card_type:'numbered',day_key_card_suit:'Cups',day_key_card_rank:'7'});
assert.strictEqual(r.decan_start,'2026-08-02'); assert.strictEqual(r.decan_end,'2026-08-11'); assert.strictEqual(r.day_index,7); assert.strictEqual(r.base_date,'2026-08-08'); assert.strictEqual(r.suit_shift,0); assert.strictEqual(r.primary_date,'2026-08-08'); assert.strictEqual(r.preparation_date,'2026-08-06'); assert.strictEqual(r.caution_date,'2026-08-09'); assert.strictEqual(r.court_ruler,'King of Wands'); assert.strictEqual(r.major_theme,'Strength');
r=calc({season_year:2026,decan_card:'Wands 5',day_key_card_type:'ace',day_key_card_suit:'Wands',day_key_card_rank:'Ace'});
assert.strictEqual(r.decan_start,'2026-07-22'); assert.strictEqual(r.decan_end,'2026-08-01'); assert.strictEqual(r.day_index,1); assert.strictEqual(r.base_date,'2026-07-22'); assert.strictEqual(r.suit_shift,-1); assert.strictEqual(r.candidate_raw,'2026-07-21'); assert.strictEqual(r.primary_date,'2026-07-22'); assert.strictEqual(r.was_clipped,true);
r=calc({season_year:2026,decan_card:'Cups 10',day_key_card_type:'numbered',day_key_card_suit:'Pentacles',day_key_card_rank:'10'});
assert.strictEqual(r.decan_start,'2026-03-10'); assert.strictEqual(r.decan_end,'2026-03-19'); assert.strictEqual(r.day_index,10); assert.strictEqual(r.base_date,'2026-03-19'); assert.strictEqual(r.suit_shift,2); assert.strictEqual(r.candidate_raw,'2026-03-21'); assert.strictEqual(r.primary_date,'2026-03-19'); assert.strictEqual(r.was_clipped,true);
r=calc({season_year:2026,decan_card:'Swords 5',day_key_card_type:'court',day_key_card_suit:'Cups',day_key_card_rank:'Knight'});
assert.strictEqual(r.decan_start,'2026-01-20'); assert.strictEqual(r.decan_end,'2026-01-29'); assert.strictEqual(r.day_index,4); assert.strictEqual(r.base_date,'2026-01-23'); assert.strictEqual(r.suit_shift,0); assert.strictEqual(r.primary_date,'2026-01-23');
r=calc({season_year:2026,decan_card:'Pentacles 3',day_key_card_type:'numbered',day_key_card_suit:'Cups',day_key_card_rank:'2'});
assert.strictEqual(r.decan_start,'2026-12-31'); assert.strictEqual(r.decan_end,'2027-01-09');
r=calc({season_year:2025,decan_card:'Pentacles 3',day_key_card_type:'numbered',day_key_card_suit:'Cups',day_key_card_rank:'2'});
assert.strictEqual(r.decan_start,'2025-12-31'); assert.strictEqual(r.decan_end,'2026-01-09');
console.log('seido-date tests passed');
