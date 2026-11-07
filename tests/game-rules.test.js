const assert = require('assert');
const { validateWinningHand, makeDeck, shuffle } = require('../game-rules');
const c = (s,r,id=`${s}${r}`) => ({suit:s,rank:r,id});
const joker = c('♥','6','JOKER');
const good = [
  c('♠','Q'), c('♥','Q'),
  c('♦','9'), c('♣','9'),
  c('♥','4'), c('♥','5'), joker, c('♥','7'),
  c('♣','2')
];
assert.strictEqual(validateWinningHand(good,joker).valid,true,'two pairs + heart 4-5-6-7 should win');
const aceLow = [c('♠','K'),c('♦','K'),c('♣','3'),c('♥','3'),c('♠','A'),c('♠','2'),c('♠','3'),c('♠','4'),c('♦','8')];
assert.strictEqual(validateWinningHand(aceLow,null).valid,true,'A-2-3-4 should be valid');
const aceHigh = [c('♠','K'),c('♦','K'),c('♣','3'),c('♥','3'),c('♠','J'),c('♠','Q'),c('♠','K'),c('♠','A'),c('♦','8')];
assert.strictEqual(validateWinningHand(aceHigh,null).valid,true,'J-Q-K-A should be valid');
const badCrossSuit = [c('♠','Q'),c('♥','Q'),c('♦','9'),c('♣','9'),c('♠','A'),c('♠','2'),joker,c('♠','4'),c('♣','2')];
assert.strictEqual(validateWinningHand(badCrossSuit,joker).valid,false,'joker cannot impersonate a different suit/rank in a sequence');
const badLength = good.slice(0,8);
assert.strictEqual(validateWinningHand(badLength,joker).valid,false,'show requires exactly 9 cards');
const deck=makeDeck();
assert.strictEqual(deck.length,52,'standard deck should contain 52 cards');
assert.strictEqual(new Set(deck.map(x=>x.id)).size,52,'every card should have a unique id');
const before=deck.map(x=>x.id).sort();
shuffle(deck);
assert.deepStrictEqual(deck.map(x=>x.id).sort(),before,'shuffle must preserve all cards');
const jokerPair = [c('♠','A'),joker,c('♦','2'),c('♣','2'),c('♠','4'),c('♠','5'),c('♠','6'),c('♠','7'),c('♥','9')];
assert.strictEqual(validateWinningHand(jokerPair,joker).valid,true,'joker must pair with a different rank card');
console.log('All HX Cards Play game-rule tests passed.');
