const mongoose=require('mongoose')

const groupSchema=new mongoose.Schema({
   name:String,
   
   members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' 
  }],
      decks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Deck'
      }],
  invitationCode: String,
})

const Group=new mongoose.model('Group',groupSchema)
module.exports=Group;