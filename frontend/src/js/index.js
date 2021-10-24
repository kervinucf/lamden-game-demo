import Slot from "./Slot.js";
import PracticeSlot from './PracticeSlot.js'
const config = {
  inverted: false, // true: reels spin from top to bottom; false: reels spin from bottom to top
};

export function slot() {
  return new Slot(document.getElementById("slot"), config);
}

export function practiceSlot() {
  return new PracticeSlot(document.getElementById("practice-slot"), config);
}

const isProd = __myapp.env.isProd
const prod_URL = 'https://futuregames.io'
const dev_URL = 'http://localhost:3232'

function setHost() {
  let prod = true;
    if (prod) return prod_URL;
    else return dev_URL;
}

export const host = setHost()