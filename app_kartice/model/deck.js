const mongoose = require('mongoose');
const Card = require('./card');

const deckSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cards: [Card.schema],
  shownCards: {
    type: [mongoose.Schema.Types.ObjectId],
    default: []
  },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true }
},{ collection: 'decks' });

module.exports = mongoose.model('Deck', deckSchema);