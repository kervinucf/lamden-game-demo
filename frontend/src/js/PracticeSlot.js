import Reel from "./PracticeReel.js";
import PracticeSymbol from "./PracticeSymbol.js";



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


export default class Slot {
    constructor(domElement, config = {}) {
        PracticeSymbol.preload();

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

        this.reels = Array.from(this.container.getElementsByClassName("practice-reel")).map(
        (reelContainer, idx) =>
            new Reel(reelContainer, idx, this.currentSymbols[idx])
        );

        this.resetSlotButton = document.getElementById("reset-practice-slot");
        this.resetSlotButton.addEventListener('click', () => {
            
            if (enabled) {
                let oldElements = document.getElementsByClassName('practice-tile-img')
                for (let m in oldElements) {
                    if (oldElements[m] != 15) {
                        this.img = oldElements[m]
                        this.img.className = 'practice-tile practice-tile-img'
                        this.img.src = `https://s3.wasabisys.com/lamden-telegram-casino/test/tau-practice.png`;
                    }
                }
            }            
        })

        this.spinButton = document.getElementById("practice-spin");
        let resetClicked = 0;
        this.spinButton.addEventListener("click", () => {
            
            if (enabled) {
                this.spin()
            }    
            else {
                if (resetClicked == 1) {
                    let clip = new Audio('/assests/sounds/invalid_button.mp3')
                    var un_mute = document.getElementById('un-mute');

                    if (un_mute) {
                      clip.play()
                    }                }
                else {
                    resetClicked = resetClicked + 1 
                }
                
            }    
        });


        if (config.inverted) {
        this.container.classList.add("inverted");
        }
    }

    spin = async () => {
        let practiceSlotLive = document.getElementById("practice-slot-live");
        if (practiceSlotLive) {

            this.onSpinStart();

        this.currentSymbols = this.nextSymbols;
        
        /** 
         * 0 "bitcoin",
         * 1 "rswp", 
         * 2 "ethereum", 
         * 3 "tau", 
         * 4 "diamond", 
         * 5 "star",
        6 "seven",
        7 "cherry",
        8 "grape"
        **/

        this.nextSymbols = [
            [PracticeSymbol.random(), PracticeSymbol.random(), PracticeSymbol.random()],
            [PracticeSymbol.random(), PracticeSymbol.random(), PracticeSymbol.random()],
            [PracticeSymbol.random(), PracticeSymbol.random(), PracticeSymbol.random()],
            [PracticeSymbol.random(), PracticeSymbol.random(), PracticeSymbol.random()],
            [PracticeSymbol.random(), PracticeSymbol.random(), PracticeSymbol.random()],
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
            /** Used to calculate total points [Practicesymbol. occurences] **/
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
            let slotTiles = document.getElementsByClassName('practice-tile')
            let matchingElements = [];
            for (let s in slotTiles) {
                if (indexSet.has(parseInt(s))) {
                    matchingElements.push(slotTiles[s])
                }
            }

            await sleep(800);
            for (let m in matchingElements) {
                this.img = matchingElements[m]
                let imgName = this.img.id.split('-')[0]
                this.img.className = 'matched'
                this.img.src = `https://s3.wasabisys.com/lamden-telegram-casino/test/${imgName}-match.png`;
                let clip = new Audio('/assests/sounds/screen_light.mp3')
                var un_mute = document.getElementById('un-mute');

                if (un_mute) {
                  clip.play()
                }
                await sleep(1000);

            }


        }
        ).then( async () => {     

            this.onSpinEnd();
            
            
        })

        }

        

    }

    onSpinStart() {
        this.spinButton.disabled = true;

        

        /**
         * console.log("SPIN START");
        console.log("SPIN DISABLED");
         * **/
        enabled = false;

        
        
    }

    onSpinEnd() {
        this.spinButton.disabled = false;

        
        /**
         * console.log("SPIN END");
        console.log("SPIN ENABLED");
         * **/
        enabled = true;
    }
    }

