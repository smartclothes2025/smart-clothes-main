// src/lib/outfitStorage.js
const KEY = 'outfit_history';

export function getOutfits() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}

export function saveOutfits(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addOutfit({clothesIds = [], note = '', img = ''}) {
  const list = getOutfits();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const rec = {
    id: Date.now(),
    date: today,
    clothesIds,
    note: note || '無備註',
    img: img || '/default-outfit.png'
  };
  list.push(rec);
  saveOutfits(list);
  return rec;
}
