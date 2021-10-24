const express = require('express');
const Player = require('./model/Player');
const TxnHash = require('./model/TxnHash');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const scoreValidator = require('./routes/scoreValidator.js')
const envFilePath = path.resolve(__dirname, './.env');
const env = require("dotenv").config({ path: envFilePath });
const Lamden = require('lamden-js');
const axios = require('axios')
const Network = Lamden.Network;
var cors = require('cors');
const dotenv = require('dotenv')
dotenv.config();

if (env.error) {
  throw new Error(`Unable to load the .env file from ${envFilePath}. Please copy .env.example to ${envFilePath}`);
}


mongoose.connect(process.env.DB_CONNECT, { useNewUrlParser: true, useUnifiedTopology: true } ,  () => console.log('mongodb connected...'));

let host;
let network;
if (process.env.isProd == "true") {
    host = process.env.PROD_URL; // update to match the domain you will make the request from
    network = {
        name: 'Lamden Public Mainnet',
        type: "mainnet",
        url: "https://masternode-01.lamden.io:443"
      }
}
else {
    host = process.env.DEV_URL; // update to match the domain you will make the request from
    network = {
        name: 'Lamden Public Testnet',
        type: "testnet",
        url: "https://testnet-master-1.lamden.io:443"
      }
}

let networkInfo = {
    // Optional: Name of network
    name: network.name,

    // Required: type of network 'mockchain', 'testnet', 'mainnet'
    type: network.type,

    // Required: must begin with http or https
    hosts: [network.url]
}
console.log('Is prod: ', process.env.isProd, host, network)
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Origin", host); // update to match the domain you will make the request from

    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-Auth-Token");
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    next();
});

var server = require('http').createServer(app);
var io = require('socket.io')(server, {
    cors: { origin: host }
});
app.use(express.json());

// Pass a http.Server instance to the listen method

// The server should start listening
server.listen(3232);


// Handle connection

app.post('/api/sendWinnings', async (req, res) => {
    let wallet = req.body['wallet'];
    let score = req.body['score'];
    let grid = req.body['grid'];
    let txn = req.body['txn']
    let houseBalance = req.body['hb']
    /** validate score, validate **/
    let scoreIsValid;
    let newWinner;
    let prizeClaimed;
    let scoreValid = scoreValidator(score, grid, houseBalance);
    console.log('74 ', scoreValid)
    let modifiedTxn; 
    if (scoreValid) {
        scoreIsValid = true;
        console.log(txn)
        const txnInfo = await TxnHash.findOne({ txn: txn });
        if (txnInfo) {
            if (txnInfo.claimed) return res.send("Prize already claimed").end;
            else {
                if (wallet == txnInfo.wallet) {
                    modifiedTxn = {
                        wallet: wallet,
                        txn: txn,
                        score: score,
                        winner: true,
                        claimed: true
                    };

                    prizeClaimed = false;
                }
                else {
                    console.log('Wallet in DB does not match wallet provided')
                    return res.send("Error something went wrong.").end;
                }
            }
        }
        else {

            console.log('Txn hash not found in DB')

            return res.send("Error something went wrong.").end;
        }
    }
    else {
        console.log('Score does not match')

        return res.send("Error something went wrong.").end;

    }

    console.log(scoreIsValid, prizeClaimed)

    if (scoreIsValid && !prizeClaimed) {

            //Sender and Receiver public keys
            
        let senderVk = process.env.SENDER_VK
        let playerVk = wallet

        // Kwargs are the arugments you will send the contract method.  
        // For example the "currency" contract's "transfer" method needs two arguments to create a transfter; the person reciving the TAU and the amount to transfer.  So we create a kwargs object like so.
        let kwargs = {
                'to': playerVk,
                'amount': score
        }

        let txInfo = {
            senderVk,
            contractName: "currency",
            methodName: "transfer",
            kwargs,
            stampLimit: 1000, //Max stamps to be used. Could use less, won't use more.
        }
        console.log(kwargs)

        try {

            let tx = new Lamden.TransactionBuilder(networkInfo, txInfo)

            let senderSk = process.env.SENDER_SK
            let array;
            tx.events.on('response', async (response) => {

                if (typeof response.result != 'undefined') {
                    console.log(response)
                    const updatedPlayer = await TxnHash.findByIdAndUpdate(txn._id, modifiedTxn)
                    res.send(response.result);
                }
                if (tx.resultInfo.type === 'error') return
            })
            tx.send(senderSk).then(() => tx.checkForTransactionResult())
        }
        catch(err) {
            res.status(400).send(err);
        }

    }

    else {
        return res.send("Error something went wrong.").end;
    }
    

})

app.post('/api/confirmBuyIn', async (req, res) => {

    let wallet = req.body['wallet'];

    console.log(wallet)
    const player = await Player.findOne({ wallet: wallet });
    console.log(player, ' player')
    if (!player) {
        console.log('Player not found')
        const newPlayer = new Player({
            wallet: wallet

        });
        const savedPlayer = await newPlayer.save();
        res.send('Player Created')
    }
    else {

        console.log('Player found')
        const newPlayer = new Player({
            wallet: wallet
        });
        const savedPlayer = await newPlayer.save();
        res.send('Existing player found')

    }
            
    
})


io.on('connection', function (socket) {
    console.log("Connected succesfully to the socket ...");

    // Send news on the socket
    console.log(socket.id);
    socket.emit('initialize', socket.id);

    socket.on('register', async function (data) {
        
        let wallet = data.wallet;
        let id = data.id
        try {
            const player = await Player.findOne({ wallet: wallet });
            console.log(player, 314)
            if (!player) {
                const newPlayer = new Player({
                    wallet: wallet,
        
                });
                const savedPlayer = await newPlayer.save();
            }
            
        }
        catch(err) {
            io.to(id).emit(err);
        }

    });
});


let tauUSD;
let tauEUR;

app.get('/api/getPrice', async (req, res) => {
    let priceUpdated;
    let priceRefresh;
    
    if (!tauUSD || priceRefresh) {

        await (axios.get('https://api.coingecko.com/api/v3/simple/price?ids=lamden&vs_currencies=usd')).then((result) => {
            tauUSD = result.data.lamden.usd
          })
        await (axios.get('https://api.coingecko.com/api/v3/simple/price?ids=lamden&vs_currencies=eur')).then((result) => {
            tauEUR = result.data.lamden.eur
        })

        priceUpdated = new Date();
        priceRefresh = false

    }

    let currentTime = new Date();
    var timeDiff = currentTime - priceUpdated; //in ms
    // strip the ms
    timeDiff /= 1000;

    // get seconds 
    var seconds = Math.round(timeDiff);
    
    if (seconds > 3600) {
        priceRefresh = true;
    }

    let prices = {
        "usd": tauUSD,
        "eur": tauEUR
    }
    console.log(prices, tauEUR, tauUSD)
    res.send(prices)

})


app.post('/api/spin', async (req, res) => {

    let wallet = req.body['wallet'];
    let senderVk = process.env.SENDER_VK

    // Kwargs are the arugments you will send the contract method.  
    // For example the "currency" contract's "transfer" method needs two arguments to create a transfter; the person reciving the TAU and the amount to transfer.  So we create a kwargs object like so.
    let txInfo = {
        senderVk,
        contractName: "con_future_games_slots",
        methodName: "spin",
        stampLimit: 100, //Max stamps to be used. Could use less, won't use more.
    }

    const player = await Player.findOne({ wallet: wallet });
    console.log(player, ' player')
    if (!player) {
        console.log('Player not found')
        const newPlayer = new Player({
            wallet: wallet,
        });
        const savedPlayer = await newPlayer.save();
        res.send('Player registered. No spins available')
    }
    else {

        const modifiedPlayer = {
            wallet: wallet,
        };
        const updatedPlayer = await Player.findByIdAndUpdate(player._id, modifiedPlayer)
        try {

            let tx = new Lamden.TransactionBuilder(networkInfo, txInfo)
    
            let senderSk = process.env.SENDER_SK
            let array;
            tx.events.on('response', async (response) => {
    
                if (typeof response.result != 'undefined') {
                    
                    let gameResult = {
                        grid: response.result,
                        txn: response.hash
                    }
                    let newTxn = new TxnHash({
                        wallet: wallet,
                        txn: response.hash,
                        score: 'null',
                        winner: false,
                        claimed: false
                    })
                    const savedTxn = await newTxn.save();
                    console.log(newTxn)
                    res.send(gameResult);
                }
                if (tx.resultInfo.type === 'error') return
            })
            tx.send(senderSk).then(() => tx.checkForTransactionResult())
    
        }
        catch(err) {
            res.status(400).send(err);
        }

    }

            
    
})

app.post('/api/refund', async (req, res) => {

    let wallet = req.body['wallet'];
    let senderVk = process.env.SENDER_VK

    // Kwargs are the arugments you will send the contract method.  
    // For example the "currency" contract's "transfer" method needs two arguments to create a transfter; the person reciving the TAU and the amount to transfer.  So we create a kwargs object like so.
    let kwargs = {
        'to': wallet,
        'amount': 40
    }

    let txInfo = {
        senderVk,
        contractName: "currency",
        methodName: "transfer",
        kwargs,
        stampLimit: 1000, //Max stamps to be used. Could use less, won't use more.
    }

    const player = await Player.findOne({ wallet: wallet });
    console.log(player, ' player')
    if (!player) {
        console.log('Player not found')
        res.send('Player not found')
    }
    else {

        try {

            let tx = new Lamden.TransactionBuilder(networkInfo, txInfo)
    
            let senderSk = process.env.SENDER_SK
            tx.events.on('response', async (response) => {
    
                if (typeof response.result != 'undefined') {
                    res.send(response.result);
                }
                if (tx.resultInfo.type === 'error') return
            })
            tx.send(senderSk).then(() => tx.checkForTransactionResult())
    
        }
        catch(err) {
            res.status(400).send(err);
        }

    }

            
    
})