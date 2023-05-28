const mongoose = require('mongoose');

// Define a schema for statistics
const statisticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId},
  deckId: { type: mongoose.Schema.Types.ObjectId, required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId },
  totalCards: { type: Number, required: true },
  correctCards: { type: Number, required: true },
  incorrectCards: { type: Number, required: true },
  percentageCorrect: { type: Number, required: true },
  correctCardsIds: { type: Object },
  incorrectCardsIds: { type: Object },
  date: { type: String, required: true}
});

// Create a model based on the schema
const Statistics = mongoose.model('Statistics', statisticsSchema);

module.exports = Statistics;