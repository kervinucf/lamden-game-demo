const mongoose = require('mongoose');

const txnHashSchema = new mongoose.Schema({
    wallet: {
        type: String,
        required: true,
        max: 255,
        min: 2  
    },
    txn: {
        type: String,
        required: true,
        max: 255,
        min: 2
    },
    score: {
        type: String,
        required: true,
        max: 255,
        min: 2
    },
    winner: {
        type: Boolean,
        required: true,
        max: 255,
        min: 2
    },
    claimed: {
        type: Boolean,
        required: true,
        max: 255,
        min: 2
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('TxnHash', txnHashSchema);