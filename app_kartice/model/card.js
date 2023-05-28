const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
    question: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true
    },
    questionImage: {
      type: String
    },
    answerImage: {
      type: String
    },
    correct: {
        type: Boolean,
        default: false, // default value for "correct" field
      },
      //userId: { type: mongoose.Schema.Types.ObjectId, required: true }
  }, { collection: 'cards' });
  
  module.exports = mongoose.model('Card', cardSchema);