import Reel from "./Reel.js";
import Symbol from "./Symbol.js";
import axios from 'axios';
import { host } from './index'
import { Network} from 'lamden-js'
let currentNetwork;
function setNetwork() {
    let network
    if (__myapp.env.isProd == "true") {
      network = {
        "name": 'Lamden Public Mainnet',
        "type": "mainnet",
        "url": "https://masternode-01.lamden.io:443"
      }
      return network
    }
    else {
      network = {
        "name": 'Lamden Public Testnet',
        "type": "testnet",
        "url": "https://testnet-master-1.lamden.io:443"
      }
      return network
    }
  }
currentNetwork = setNetwork()
let lamdenNetwork = new Network({
    name: currentNetwork.name,
    type: currentNetwork.type,
    hosts: [currentNetwork.url]
  })

function setScore(score, grid, txn, houseBalance) {
    localStorage.setItem('score', score);
    let wallet = localStorage.getItem('wallet');
    if (score > 0) {
        axios({
            method: 'post',
            url: host + __myapp.env.API_WIN,
            data: {
              score: score,
              wallet: wallet,
              grid: grid,
              txn: txn,
              hb: houseBalance
            }
          });
    }
    else {
        let loserClips = ['loser', 'loser1', 'loser3'];

        const loserClipFound = loserClips[Math.floor(Math.random() * loserClips.length)];
        let loserClip = new Audio('/assests/sounds/' + loserClipFound + '.mp3')
        var un_mute = document.getElementById('un-mute');

        if (un_mute) {
            loserClip.play()
        }
    }
}



function generateIndexGroups(num) {
    let ind = 0
    let matrixBox = [];
    const fourSumSet = new Set([0, 1, 2, 3, 4, 5])
    const fiveSumSet = new Set([0, 1, 2])


    /**  Grid
     * [0] [3] [6] [9] [12]
     * [1] [4] [7] [10] [13]
     * [2] [5] [8] [11] [14]
     * ** */

    while (true) {
        if (ind < 13 && num == 1) {
            /** top --> bottom **/
            matrixBox.push([ind, ind + (num), ind + (2*num)])
            
            ind = ind + 3
            
        } 
        else if (num > 1) {
            if (num == 2) {
                if (ind < 10) {
                    /** diagonal bottom --> right **/
                    if (ind < 2) {
                        ind = 2
                    }
                    matrixBox.push([ind, ind + (num), ind + (2*num)])
                    ind = ind + 3
                }
                else {
                    break
                }

            }
               
            if (num == 3) {
                if (ind < 9) {
                    /** left ---> right **/
                    matrixBox.push([ind, ind + (num), ind + (2*num)])
                    if (fourSumSet.has(ind)) {
                        matrixBox.push([ind, ind + (num), ind + (2*num), ind + (3*num)])
                    }
                    if (fiveSumSet.has(ind)) {
                        matrixBox.push([ind, ind + (num), ind + (2*num), ind + (3*num), ind + (4*num)])
                    }
                    ind = ind + 1
                }
                else {
                    break
                }
            }
            
            if (num == 4) {
                if (ind < 7) {
                    /** diagonal top --> right **/
                    matrixBox.push([ind, ind + (num), ind + (2*num)])
                    ind = ind + 3
                }
                else {
                    break
                }
            }
            
        }
        else {
            break
        }
        
    }
    return matrixBox

}

function indexOfAll(arr, val) {
    arr = arr.reduce((acc, el, i) => (el === val ? [...acc, i] : acc), []);
    if (arr.length < 3) {
        return null
    }
    else {
        return arr
    }
}


function isArrayInArray(arr, item){
    var item_as_string = JSON.stringify(item);
  
    var contains = arr.some(function(ele){
      return JSON.stringify(ele) === item_as_string;
    });
    return contains;
  }
  function arr_diff (a1, a2) {

    var a = [], diff = [];

    for (var i = 0; i < a1.length; i++) {
        a[a1[i]] = true;
    }

    for (var i = 0; i < a2.length; i++) {
        if (a[a2[i]]) {
            delete a[a2[i]];
        } else {
            a[a2[i]] = true;
        }
    }

    for (var k in a) {
        diff.push(k);
    }

    return diff;
}
function validateMatch(array) {
    let lastNum = array[0]
    let bin;
    let arrayCopy = [...array];
    arrayCopy.shift()
    let valid;
    let diff;
    for (let a in arrayCopy) {
        diff = Math.abs(arrayCopy[a] - lastNum)
        if (typeof bin == 'undefined') {
            bin = diff
        }
        if (diff != bin || diff > 5) {
            valid = false
        }
        else {
            valid = true
        }
        lastNum = arrayCopy[a]
    }
    if (valid) {
        return true
    }
}
function cleanMatches(matches, intersection) {
    let matchOverlap = false
    if (intersection.length < 5) {
        for (let m in matches) {
            let checkDiff = matches[m].filter(n => !intersection.includes(n))
            if (checkDiff.length < 3) {
                matchOverlap = true
            }
        }
    }
    return matchOverlap
}
function checkWinners(direction, zones, results, scoreboard) {
    
    let res = results
    let matches = []
    if (direction == 'l2r') {
        zones.sort(function (a, b) { return b.length - a.length; });
        
    }
    let longerMatch = []
    let matchExists;
    for (let z in zones) {
        let zone = zones[z]
        let intersection = res.filter(value => zone.includes(value));
        if (direction == 'l2r') {
             matchExists = cleanMatches(matches, intersection)
        }
        if (intersection.length > 2) {
            if (!isArrayInArray(matches, intersection) && validateMatch(intersection) && !matchExists) {
                if (intersection.length == 4) { 
                    let one = intersection[0]
                    let two = intersection[1]
                    let three = intersection[2]
                    let four= intersection[3]
    
                    let middleCheck = three - two;
                    let firstCheck = two - one
    
                    if (middleCheck == firstCheck) {
                        matches.push(intersection)
                    }
    
                }
                else {
                    matches.push(intersection)
                }
            }
        }
        
    }
    if (matches.length > 0) {
        scoreboard[direction] = matches
    }
    
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

function findIndexGroups(matrix) {
    

    var eligible = {}
    var symbols = ["bitcoin", "rswp", "ethereum", "tau", "diamond", "star", "seven", "cherry", "grape"]

    for (let s in symbols) {
        eligible[symbols[s]] = indexOfAll(matrix, symbols[s])
    }
    var filtered = Object.fromEntries(Object.entries(eligible).filter(([k,v]) => v != null));
    let keys = Object.keys(filtered);
    var topToBottom = generateIndexGroups(1)
    var diagonalTopToBottom = generateIndexGroups(2)
    var leftToRight = generateIndexGroups(3)

    var diagonalBottomToTop = generateIndexGroups(4)
    let scoreboard = {}

    if (keys.length > 0) {
        let cleaned;
        for (let k in keys) {
            let scoreDict = {} 
            let index = filtered[keys[k]]
            checkWinners('l2r', leftToRight, index, scoreDict)
            checkWinners('t2b', topToBottom, index, scoreDict)
            checkWinners('dt2b', diagonalTopToBottom, index, scoreDict)
            checkWinners('db2t', diagonalBottomToTop, index, scoreDict)
            if (Object.keys(scoreDict).length > 0) {
                scoreboard[keys[k]] = scoreDict
            }
        }
        
        
    }  

    else {
        return 'user lost'
    }
    return scoreboard
    
}

function findMatches(slot) {
    let indexes = [...Array(15).keys()];
    let matrix = [];
    for (let s in slot) {
        matrix.push(...slot[s])
    }
    return findIndexGroups(matrix)

}

let eventAdded;
let enabled = true;
let slotLoaded = false;
let slotLoadStart = false;

export default class Slot {
    constructor(domElement, config = {}) {
        Symbol.preload();

        this.currentSymbols = [
        ["tau", "tau", "tau"],
        ["tau", "tau", "tau"],
        ["tau", "tau", "tau"],
        ["tau", "tau", "tau"],
        ["tau", "tau", "tau"],
        ];

        this.nextSymbols = [
        ["tau", "tau", "tau"],
        ["tau", "tau", "tau"],
        ["tau", "tau", "tau"],
        ["tau", "tau", "tau"],
        ["tau", "tau", "tau"],
        ];

        this.container = domElement;

        this.reels = Array.from(this.container.getElementsByClassName("reel")).map(
        (reelContainer, idx) =>
            new Reel(reelContainer, idx, this.currentSymbols[idx])
        );

        this.resetSlotButton = document.getElementById("reset-slot");
        this.resetSlotButton.addEventListener('click', () => {
            let oldElements = document.getElementsByClassName('tile-img')
            for (let m in oldElements) {
                if (oldElements[m] != 15) {
                    this.img = oldElements[m]
                    this.img.className = 'slot-tile tile-img'
                    this.img.src = `https://s3.wasabisys.com/lamden-telegram-casino/test/tau.png`;
                }
            }
            
        })
        this.setSlotLoadingButton = document.getElementById("load-slot");
        this.setSlotLoadingButton.addEventListener('click', async () => {
            slotLoadStart = false;
            slotLoaded = false;
            let currentElements = document.getElementsByClassName('slot-tile')
            let cE = [
                currentElements[0], currentElements[3], currentElements[6], currentElements[9], currentElements[12],
                currentElements[1], currentElements[4], currentElements[7], currentElements[10], currentElements[13],
                currentElements[2], currentElements[5], currentElements[8], currentElements[11], currentElements[14], 
            ]
            if (!slotLoadStart) {
                slotLoadStart = true
                while(!slotLoaded) {
                    for (let m in cE) {
                        if (cE[m] != 15) {
                            let img = cE[m]
                            img.className = 'slot-tile tile-img'
                            img.src = `/assests/symbols/tau-practice.png`; 
                            await sleep(200)
                            img.src = `/assests/symbols/tau.png`; 
                        }
                        
                    }
                 }
            }
            
             
                        
        })


        

        this.spinButton = document.getElementById("spin");
        this.spinButton.addEventListener('click',  async () => {

            let slotLive = document.getElementById("slot-live")
            if (enabled && slotLive) {
                enabled = false;
                let websocket_id = localStorage.getItem('websocket_id')
                let wallet = localStorage.getItem('wallet');
                this.setSlotLoadingButton = document.getElementById("load-slot");
                this.setSlotLoadingButton.click()
                let gameInfo = await (    axios({
                    method: 'post',
                    url: host + __myapp.env.API_SPIN,
                    data: {
                    wallet: wallet,
                    id: websocket_id
                    }
                }).then((result) => {
                    return result
                }));
                if (typeof gameInfo != 'undefined' && gameInfo.data && gameInfo.data.grid) {
                    slotLoaded = true            
                    let clip = new Audio('/assests/sounds/countdown.mp3')
                    var un_mute = document.getElementById('un-mute');
                    if (un_mute) {
                        clip.play()
                    }    
                    await sleep(3000)
                    if (un_mute) {
                        clip.pause()
                    }  

                    slotLoadStart = false
                    this.spin(gameInfo)
                }
                else {
                    await (    axios({
                        method: 'post',
                        url: host + __myapp.env.API_REFUND,
                        data: {
                        wallet: wallet
                        }
                    }).then((result) => {
                        return result
                    }));
                    document.getElementById('failedTxn').click()
                    slotLoaded = true            
                    enabled = true
                    slotLoadStart = false
            
                    this.slotSpun = document.getElementById("spin");
                    this.slotSpun.innerHTML = "Reset"
                }
                
            }
            else {
                let clip = new Audio('/assests/sounds/invalid_button.mp3')
                var un_mute = document.getElementById('un-mute');

                if (un_mute) {
                    clip.play()
                }
            }
        });


        if (config.inverted) {
        this.container.classList.add("inverted");
        }
    }

     spin = async (gameInfo) => {
        
        let spinClips = ['slot_spin', 'slot_spin1'];
        let loserClips = ['loser', 'loser1', 'loser2'];
 
        this.onSpinStart();

        this.currentSymbols = this.nextSymbols;
        
        /* *  axios --> backend  * */
        
        const spinClipFound = spinClips[Math.floor(Math.random() * spinClips.length)];
        let spinClip = new Audio('/assests/sounds/' + spinClipFound + '.mp3')
        var un_mute = document.getElementById('un-mute');

        if (un_mute) {
            spinClip.play()
        }   
        let grid = JSON.parse(gameInfo.data.grid);
        let txn = gameInfo.data.txn;
        localStorage.setItem('result-txn', txn);
        let playerWon;
        let score = 0;
        this.nextSymbols = [
            [Symbol.choose(grid[0]), Symbol.choose(grid[1]), Symbol.choose(grid[2])],
            [Symbol.choose(grid[3]), Symbol.choose(grid[4]), Symbol.choose(grid[5])],
            [Symbol.choose(grid[6]), Symbol.choose(grid[7]), Symbol.choose(grid[8])],
            [Symbol.choose(grid[9]), Symbol.choose(grid[10]), Symbol.choose(grid[11])],
            [Symbol.choose(grid[12]), Symbol.choose(grid[13]), Symbol.choose(grid[14])],
        ];
        return Promise.all(
            
            this.reels.map((reel) => {
                reel.renderSymbols(this.nextSymbols[reel.idx]);
                
                return reel.spin();
            })).then(
                async () => {

                function onlyUnique(value, index, self) {
                    return self.indexOf(value) === index;
                }

                let pointsScored = []
                let matches = findMatches(this.nextSymbols);
                if (matches != 'user lost') {

                    let winningSymbols = Object.keys(matches)
                    let winningMatches = Object.keys(matches).map(function(key){
                        let innerMatches = matches[key];
                        let values = Object.keys(innerMatches).map(function(key){
                            return innerMatches[key];
                        });
                        for (let v in values) {
                            let points = 0;
                            let indexArray = values
                            for (let v2 in indexArray) {
                                return indexArray
                            }
                        }
                    });

                    let indexSet = new Set()
                    for (let m in matches) {
                        let indexes = matches[m]
                        var values = Object.keys(indexes).map(function(key){
                            return indexes[key];
                        });
                        let sets = new Set()
                        for (let v in values) {
                            var merged = [].concat.apply([], values[v]);
                            let set = new Set(merged)
                            sets = new Set([...set, ...sets])
                        }
                        indexSet = new Set([...indexSet, ...sets])
                    }
                    /** Used to finding matching elements **/
                    let slotTiles = document.getElementsByClassName('slot-tile')
                    let matchingElements = [];
                    for (let s in slotTiles) {
                        if (indexSet.has(parseInt(s))) {
                            matchingElements.push(slotTiles[s])
                        }
                    }
                    
                    var un_mute = document.getElementById('un-mute');

                    if (un_mute) {
                        spinClip.pause()
                    }
                    await sleep(800);
                    for (let m in matchingElements) {
                        this.img = matchingElements[m]
                        let imgName = this.img.id.split('-')[0]
                        this.img.className = 'matched tile-img'
                        this.img.src = `https://s3.wasabisys.com/lamden-telegram-casino/test/${imgName}-match.png`;
                        let clip = new Audio('/assests/sounds/screen_light.mp3')
                        var un_mute = document.getElementById('un-mute');

                        if (un_mute) {
                            clip.play()
                        }
                        await sleep(1000);

                    }
                    let houseBalance;

                    async function tallyPoints(sym, matches) {
                        let points;
                        let houseVk = __myapp.env.HOUSE_VK

                        async function getBalance(wallet) {
                            let balance;
                            await lamdenNetwork.API.getCurrencyBalance(wallet).then(function(result) {
                                balance = result.c[0];
                            })
                            return balance
                        }
                    
                        await getBalance(houseVk).then(async function(result) {
                            houseBalance = await result;
                        })
            

                        

                        if (sym == 'ethereum') {
                            points = parseInt((.02 * houseBalance)) 
                        }
                        if (sym == 'cherry') {
                            points = parseInt(.03 * houseBalance)
                        }
                        if (sym == 'grape') {
                            points = parseInt(.04 * houseBalance)
                        }
                        if (sym == 'seven') {
                            points = parseInt(.05 * houseBalance)
                        }
                        if (sym == 'star') {
                            points = parseInt(.06 * houseBalance)
                        }
                        if (sym == 'diamond') {
                            points = parseInt(.07 * houseBalance)
                        }
                        if (sym == 'rswp') {
                            points = parseInt(.08 * houseBalance)
                        }
                        if (sym == 'bitcoin') {
                            points = parseInt(.09 * houseBalance)
                        }
                        if (sym == 'tau') {
                            points = parseInt(.1 * houseBalance)
                        }

                        points = parseInt(points / 3)

                        for (let m in matches) {
                            for (let m2 in matches[m]) {
                                /**
                                 *  let multiplier = 1;
                                    console.log(points, score,matches[m][m2])
                                    if (matches[m][m2].length == 4) {
                                        multiplier = 2
                                    }

                                    if (matches[m][m2].length == 5) {
                                        multiplier = 4
                                    }
                                 * **/

                                score = (matches[m][m2].length * points + score) 

                            }
                        }
                    }

                    for (let w in winningSymbols) {
                        await tallyPoints(winningSymbols[w], winningMatches[w])
                    }

                    setScore(score, this.nextSymbols, txn, houseBalance)
                    playerWon = true
                    document.getElementById("tester").click()


                    /* *  take score and send to winnings and to frontend  * */

                }
                
            /** Used to calculate total points [symbol. occurences] **/
            

        }
    ).then( async () => {     
        this.onSpinEnd();
        let victoryClip;
        if (playerWon) {
            let foundMatches = new Audio('/assests/sounds/slot_winner.mp3')
            var un_mute = document.getElementById('un-mute');


            document.getElementById("jackpot-balance").click()
            document.getElementById("player-balance").click()
            if (score > 0) {
                if (score > 150) {
                    if (un_mute) {
                        foundMatches.play()
                    }
                    await sleep(1500);
                    victoryClip = new Audio('/assests/sounds/bigWinner.mp3')
    
                    if (un_mute) {
                        victoryClip.play()
                    }                
                    await sleep(700);
                }
                else {
                    if (un_mute) {
                        foundMatches.play()
                    }
                    await sleep(1500);
                    victoryClip = new Audio('/assests/sounds/smallWinner.mp3')
    
                    if (un_mute) {
                        victoryClip.play()
                    }
                    await sleep(300);
                }
            }
            
        }
        document.getElementById("player-balance").click()
    })
    
    }

    onSpinStart() {
        this.spinButton.disabled = true;

        
        /**
         * console.log("SPIN START");
        console.log("SPIN DISABLED");
         * **/
        let spinEnabled = document.getElementById("spin-enabled")
        spinEnabled.setAttribute("id", "spin-disabled")
        
        
    }

    onSpinEnd() {
        this.spinButton.disabled = false;
        /**
         * console.log("SPIN END");
        console.log("SPIN ENABLED");
         * **/
        
        enabled = true;
        slotLoaded = false

        let spinDisabled = document.getElementById("spin-disabled")
        spinDisabled.setAttribute("id", "spin-enabled")

		this.slotSpun = document.getElementById("spin");
        this.slotSpun.innerHTML = "Reset"
    }
    }

