const crypto = require("crypto");
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const rankValue = r => ({ A: 1, J: 11, Q: 12, K: 13, ...Object.fromEntries(Array.from({length:9},(_,i)=>[String(i+2),i+2])) })[r];
function makeDeck() {
  const deck=[];
  for(const suit of SUITS) for(const rank of RANKS) deck.push({id:`${suit}${rank}-${crypto.randomBytes(4).toString("hex")}`,suit,rank});
  return deck;
}
function shuffle(arr) {
  for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
  return arr;
}
function isJoker(card,joker){return !!card&&!!joker&&card.id===joker.id;}
function matchesSequenceValue(card, value) {
  if(value===14) return card.rank==="A";
  return rankValue(card.rank)===value;
}
function validateWinningHand(hand,joker) {
  if(!Array.isArray(hand)||hand.length!==9) return {valid:false,reason:"Show ke liye exactly 9 cards hone chahiye."};
  const sequences=[];
  const patterns=[];
  for(let start=1;start<=10;start++) patterns.push([start,start+1,start+2,start+3]);
  patterns.push([11,12,13,14]); // J-Q-K-A high
  for(const suit of SUITS) for(const pattern of patterns){
    const indices=[];let ok=true;
    for(const value of pattern){
      const idx=hand.findIndex((c,i)=>!indices.includes(i)&&c.suit===suit&&matchesSequenceValue(c,value));
      if(idx<0){ok=false;break;}indices.push(idx);
    }
    if(ok) sequences.push(indices);
  }
  for(const sequence of sequences){
    const remaining=hand.map((_,i)=>i).filter(i=>!sequence.includes(i));
    const pairChoices=[];
    for(let a=0;a<remaining.length;a++) for(let b=a+1;b<remaining.length;b++){
      const ia=remaining[a],ib=remaining[b],ca=hand[ia],cb=hand[ib];
      if(ca.rank===cb.rank||isJoker(ca,joker)||isJoker(cb,joker)) pairChoices.push([ia,ib]);
    }
    for(let i=0;i<pairChoices.length;i++) for(let j=i+1;j<pairChoices.length;j++){
      const p1=pairChoices[i],p2=pairChoices[j];
      if(new Set([...p1,...p2]).size===4){
        return {valid:true,reason:"2 pairs + 1 valid 4-card sequence",groups:{pairs:[p1.map(i=>hand[i]),p2.map(i=>hand[i])],sequence:sequence.map(i=>hand[i])},unused:remaining.filter(i=>!p1.includes(i)&&!p2.includes(i)).map(i=>hand[i])};
      }
    }
  }
  return {valid:false,reason:"2 valid pairs aur same-suit 4-card sequence nahi mili."};
}
module.exports={makeDeck,shuffle,validateWinningHand};
