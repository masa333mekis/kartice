const mongoose=require('mongoose')

const collectionSchema=new mongoose.Schema({
  // userId: { type: mongoose.Schema.Types.ObjectId, required: true },
      decks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Deck'
      }]
})

const Collection=new mongoose.model('Collection',collectionSchema)
module.exports=Collection;