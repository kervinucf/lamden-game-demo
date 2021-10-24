const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    wallet: {
        type: String,
        required: true,
        max: 255,
        min: 2
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Player', playerSchema);