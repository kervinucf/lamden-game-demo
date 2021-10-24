
function generateUUID() { // Public Domain/MIT
    let u = Date.now().toString(16) + Math.random().toString(16) + '0'.repeat(16);
    return [u.substr(0,8), u.substr(8,4), '4000-8' + u.substr(13,3), u.substr(16,12)].join('-');
}


const cache = {};

export default class Symbol {
    constructor(name = Symbol.random()) {
        this.name = name;

        
        this.img = new Image();
        this.img.src = `https://s3.wasabisys.com/lamden-telegram-casino/test/${name}.png`;
        this.img.className = 'slot-tile tile-img'
        this.img.id = `${name + '-' + generateUUID()}` 
    }

    static preload() {
        Symbol.symbols.forEach((symbol) => new Symbol(symbol));
    }

    static get symbols() {

        let prod = [
            "bitcoin",
            "rswp",
            "ethereum",
            "tau",
            "diamond",
            "star",
            "seven",
            "cherry",
            "grape",
            ];

        let dev = [
            "bitcoin",
            "rswp"
            ];

        return prod
    }

    static random() {

        return this.symbols[Math.floor(Math.pow(10,14)*Math.random()*Math.random())%(this.symbols.length-1)];
    }
    static choose(index) {
        return this.symbols[index];
    }
    }

