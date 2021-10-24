
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
    console.log(arr, val)
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
                matches.push(intersection)
            }
        }
        
    }
    if (matches.length > 0) {
        scoreboard[direction] = matches
    }
    
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

    console.log('%RETURN IMPORTANT')
    console.log('SCOREBOARD')
    console.log(scoreboard)
    console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%')
    return scoreboard
    
}

function findMatches(slot) {
    let indexes = [...Array(15).keys()];
    let matrix = [];
    for (let s in slot) {
        matrix.push(...slot[s])
    }
    console.log('final grid: ', matrix)
    return findIndexGroups(matrix)

}





module.exports = function (gameResult, grid, houseBalance) {
    let matches = findMatches(grid);
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
                console.log(indexArray)
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
            console.log(values[v][0])
            var merged = [].concat.apply([], values[v]);
            let set = new Set(merged)
            sets = new Set([...set, ...sets])
        }
        indexSet = new Set([...indexSet, ...sets])
    }

    let score = 0;


    console.log(winningSymbols, winningMatches)

    for (let w in winningSymbols) {
        let sym = winningSymbols[w]
        let matches = winningMatches[w]
        let points;

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
                console.log(points, score,matches[m][m2])
                score = matches[m][m2].length * points + score

            }
        }
    }
    console.log('score: ', score)
    console.log('scoreValidity: ', score, ' result: ', gameResult)
    if (score == gameResult) return true;
    else return false;
}