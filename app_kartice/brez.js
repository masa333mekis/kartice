const express = require('express');
const app = express();
require("dotenv").config();
const jwt = require('jsonwebtoken');
const cors = require("cors")
const multer = require("multer")

//app.listen(3000, () => console.log("Server je na 3000"));
const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(cors())

  // const upload = multer({
  //   storage: multer.diskStorage({
  //     destination: function (req, file, cb) {
  //       const userUploadsDir = `./uploads/${req.user.userId}`; // dela lahko iz kerekoli mape uploadaš
  //       fs.mkdirSync(userUploadsDir, { recursive: true }); // create the directory if it doesn't exist
  //       cb(null, userUploadsDir);
  //     },
  //     filename: function (req, file, cb) {
  //       cb(null, Date.now() + '-' + file.originalname);
  //     }
  //   })
  // });

const mongoose = require('mongoose');
mongoose.connect(
  process.env.MONGODB_URL, 
  {
      useNewUrlParser: true,
      useUnifiedTopology: true
  }
);

const Deck = require('./model/deck');
const Card = require('./model/card');
const User = require('./model/user');
const Group = require('./model/group');
const Collection = require('./model/collection');
const Statistics = require('./model/statistics');


// Register a new user
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if the email is already registered
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.json({ error: true, message: 'Username already registered' });
    }
    const IsUserExist = await User.findOne({ email })
    if (IsUserExist) {
      res.json({ error: true, message: "User already exist with this email." })
      return
    }
    // Create a new user
    const user = new User({ username, email, password });
    await user.save();

    res.status(200).json({ error: false, message: "User registered successfully. " })
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if the user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.json({ error: true, message: 'Invalid username' });
    }

    // Check if the password is correct
    if (!(await user.isValidPassword(password))) {
      return res.json({ error: true, message: 'Invalid password' });
    }

    // Create a JWT token with the user ID and email
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );

    res.status(200).json({ error: false, message: "Login Successfully.", token: token})
    ///res.json({ token: token });
    
  } catch (err) {
    res.json({ error: true, message: "Something went wrong." })
  }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
 
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.user = user; //req.user.userId
    next();
    }
  );
};

// Get all decks
app.get('/decks', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const decks = await Deck.find({userId});
   // if (!decks) {
     // return res.status(404).json({ message: 'Deck not found' });
   // }
    res.json({ error: false, decks })
    // res.send(decks);
  } catch (err) {
    //res.json({ error: true, message: "Something went wrong." })
    // res.sendStatus(500);
    res.json({ error: true, message: "Ni avtorizacije." })
  }
});


// Create a new deck
app.post('/decks', authenticateToken, async (req, res) => {
  try {

    const groupId = req.query.group;

    if (groupId) {
      // Request is for the group's library
      const group = await Group.findOne({ _id: groupId, members: req.user.userId });
      if (!group) {
        return res.status(404).json({ message: 'Group not found or user is not a member' });
      }

      const deck = new Deck({
       userId: groupId, // Indicate that it belongs to the group, not the user
        name: req.body.name,
        cards: req.body.cards || []
      })
      deck.shownCards = [];
      await deck.save();

      group.decks.push(deck._id);
      await group.save();

      return res.json({ error: false, message: 'New Deck successfully added to the group' });
    } else {


    const deck = new Deck({
      userId: req.user.userId,
      name: req.body.name,
      cards: req.body.cards || []
    });
    deck.shownCards = []; //to sem zdaj dodala 
    await deck.save();
    res.json({ error: false, message: "New Deck uspesno dodan" })

  } 
} 
  catch (err) {
    res.json({ error: true, message: "Something went wrong." })
    //console.error(err);
   // res.sendStatus(500);
  }
});

//search the deck by name
app.get('/decks/search', authenticateToken, async (req, res) => {
  const { q } = req.query;
  try {
    const userId = req.user.userId;
    const decks = await Deck.find({ name: { $regex: new RegExp(q, 'i') }, userId });
    res.json(decks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//search the cards by question
app.get('/cards/search', authenticateToken, async (req, res) => {
  const { q } = req.query;
  try {
    const userId = req.user.userId;
    const cards = await Card.find({ 
      $or: [
        { question: { $regex: new RegExp(q, 'i') }, userId },
      ]
    });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Get a single deck by ID
app.get('/decks/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const deck = await Deck.findOne({ _id: req.params.id, userId});
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found, not authorized to see it' });
    }
    res.send(deck);
  
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Update a deck by ID
app.put('/decks/:id', authenticateToken,  async (req, res) => {
  try {
    const userId = req.user.userId;
    const deck = await Deck.findOneAndUpdate({_id: req.params.id, userId}, {name:req.body.name});
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found, not authorized to see it' });
    }
   res.json({ error: false, message: "Title of Deck updated successfully." })

  } catch (err) {
    res.json({
      error: true,
      message: "Id does not match with records Or Something went Wrong.",
    })
  }
});

// Delete a deck by ID
app.delete('/decks/:id',authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const deck = await Deck.findOneAndDelete({_id: req.params.id, userId});
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found, not authorized to see it' });
    }
   // res.send(deck);
    res.json({ error: false, message: "Deck of cards deleted successfully." })
  } catch (err) {
    res.json({
      error: true,
      message: "Id does not match with records Or Something went Wrong.",
    })
  }
});


app.get('/decks/:id/cards', authenticateToken, async (req, res) => {
  try {
    const groupId = req.query.group;
    const isCollection = req.query.collection === 'true';

    if (isCollection) {
      // Retrieve all cards from the deck, regardless of the user
      const deck = await Deck.findOne({ _id: req.params.id });
      if (!deck) {
        return res.status(404).json({ message: 'Deck not found' });
      }

      const cards = deck.cards;
      res.json({ error: false, cards });
    } else if (groupId) {
      // Retrieve groupId from the request query parameters or frontend
      const group = await Group.findOne({ _id: groupId, members: req.user.userId });
      if (!group) {
        return res.status(404).json({ message: 'Group not found or user is not a member' });
      }

      const deck = await Deck.findOne({ _id: req.params.id, userId: groupId });
      if (!deck) {
        return res.status(404).json({ message: 'Deck not found, user is not authorized to view this deck' });
      }
      const cards = deck.cards;
      if(!cards)  {
        return res.status(404).json({ message: 'Cards not found, user is not authorized to view this deck' });
      }
      res.json({ error: false, cards });
    } else {
      const userId = req.user.userId;
      const deck = await Deck.findOne({ _id: req.params.id, userId });
      if (!deck) {
        return res.status(404).json({ message: 'Deck not found, user is not authorized to view this deck' });
      }

      const cards = deck.cards;
      res.json({ error: false, cards });
    }
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

//create a new card for a deck
  app.post('/decks/:id/cards', authenticateToken, async (req, res) => {
    try {

      const userId = req.user.userId;
      const deckId = req.params.id;
      const groupId = req.query.group;
  
      if (groupId) {
        // Request is for the group's library
        const group = await Group.findOne({ _id: groupId, members: userId });
        if (!group) {
          return res.status(404).json({ message: 'Group not found or user is not a member' });
        }
  
        const groupDeck = await Deck.findOne({ _id: req.params.id, userId: groupId });
        if (!groupDeck || !group.decks.includes(deckId)) {
          return res.status(404).json({ message: 'Deck not found or not associated with the group' });
        }
  
        const card = new Card({
          question: req.body.question,
          answer: req.body.answer,
        });
  
        groupDeck.cards.push(card);
        await groupDeck.save();
  
        return res.send(card);
      } else {

      const userId = req.user.userId;
      const deck = await Deck.findOne({_id: req.params.id, userId});
      if (!deck) {
        return res.status(404).json({ message: 'Deck not found, it is not authorized create card for this deck' });
      }
      const card = new Card({
        question: req.body.question,
        answer: req.body.answer,
      });
      deck.cards.push(card);
      await deck.save();
      res.send(card);
    } }catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  });

// Get a single card by ID for a deck
app.get('/decks/:deckId/cards/:cardId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const deck = await Deck.findOne({_id: req.params.deckId, userId});
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found, it is not authorized to view this deck' });
    }
    const card = deck.cards.id(req.params.cardId);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    res.json(card);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// Update a card by ID for a deck
  app.put('/decks/:deckId/cards/:cardId', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const deckId = req.params.deckId;
      const groupId = req.query.group;

      if (groupId) {
        // Request is for the group's library
        const group = await Group.findOne({ _id: groupId, members: userId });
        if (!group) {
          return res.status(404).json({ message: 'Group not found or user is not a member' });
        }
  
        const groupDeck = await Deck.findOne({ _id: req.params.deckId, userId: groupId });
        if (!groupDeck || !group.decks.includes(deckId)) {
          return res.status(404).json({ message: 'Deck not found or not associated with the group' });
        }
        const card = groupDeck.cards.id(req.params.cardId);
  
        // update other card fields
        card.question = req.body.question || card.question;
        card.answer = req.body.answer || card.answer;

        await groupDeck.save();
  
        return res.send(card);
      } else {

      const userId = req.user.userId;
      const deck = await Deck.findOne({_id: req.params.deckId, userId});
      if (!deck) {
        return res.status(404).json({ message: 'Deck not found, it is not authorized to view this deck' });
      }
      const card = deck.cards.id(req.params.cardId);
  
      // update other card fields
      card.question = req.body.question || card.question;
      card.answer = req.body.answer || card.answer;
      await deck.save();
      res.send(card);
    }} catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  });


// Delete a card in a deck
app.delete('/decks/:deckId/cards/:cardId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const deckId = req.params.deckId;
    const groupId = req.query.group;

    if (groupId) {
      // Request is for the group's library
      const group = await Group.findOne({ _id: groupId, members: userId });
      if (!group) {
        return res.status(404).json({ message: 'Group not found or user is not a member' });
      }

      const groupDeck = await Deck.findOne({ _id: req.params.deckId, userId: groupId });
      if (!groupDeck || !group.decks.includes(deckId)) {
        return res.status(404).json({ message: 'Deck not found or not associated with the group' });
      }
      groupDeck.cards.id(req.params.cardId).deleteOne(); 
      await groupDeck.save();
      res.sendStatus(200);
    } else {

    const userId = req.user.userId;
    const deck = await Deck.findOne({_id: req.params.deckId, userId});
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found, it is not authorized to view this deck' });
    }
    deck.cards.id(req.params.cardId).deleteOne(); 
    await deck.save();
    res.sendStatus(200);
  }} catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

//get the next card from a deck, ensuring that the same card is not shown twice in a row
app.get('/decks/:id/nextcard', authenticateToken, async (req, res) => {  //cese tu vedno nazaj naredi corect na default potem pa se enkrat nextcard klice se nena shrani nic, razen ce se za vsako posebej naredi nazaj??
    try {
     const userId = req.user.userId;
      const deckId = req.params.id;
      const groupId = req.query.group;
      const isCollection = req.query.collection === 'true';

      if (isCollection) {
        // Retrieve all cards from the deck, regardless of the user
        const deck = await Deck.findOne({ _id: req.params.id });
        if (!deck) {
          return res.status(404).json({ message: 'Deck not found' });
        }
        // If all cards have been shown, reset the shownCards array
        if (deck.shownCards.length === deck.cards.length) {
          deck.shownCards = []; //to se more dat nazaj v prazno ko se spet začne igra..popravljeno dela vse
          await deck.save();
          return res.status(201).send('All cards have been shown');
        }

        // Get the index of the current card being displayed, or choose a random card if no ID is provided
        let currentIndex;
        if (req.query.currentCardId && deck.cards.some(card => card._id.equals(req.query.currentCardId))) {
          currentIndex = deck.cards.findIndex(card => card._id.equals(req.query.currentCardId));
        } else {
          do {
            currentIndex = Math.floor(Math.random() * deck.cards.length);
          } while (deck.shownCards.includes(deck.cards[currentIndex]._id));
        }

        // Find the next card that hasn't been shown yet
        let nextCard;
        do {
          currentIndex = (currentIndex + 1) % deck.cards.length;
          nextCard = deck.cards[currentIndex];
        } while (deck.shownCards.includes(nextCard._id));
        
        // Add the card to the shownCards array and save the deck
        deck.shownCards.push(nextCard._id);
        await deck.save();

        res.send(nextCard);





      } else if(groupId) {
        // Request is for the group's library
        const group = await Group.findOne({ _id: groupId, members: userId });
        if (!group) {
          return res.status(404).json({ message: 'Group not found or user is not a member' });
        }
  
        const groupDeck = await Deck.findOne({ _id: deckId, userId: groupId });
  
        if (groupDeck.shownCards.length === groupDeck.cards.length) {
          groupDeck.shownCards = []; //to se more dat nazaj v prazno ko se spet začne igra..popravljeno dela vse
          await groupDeck.save();
          return res.status(201).send('All cards have been shown');
        }
    
        // Get the index of the current card being displayed, or choose a random card if no ID is provided
        let currentIndex;
        if (req.query.currentCardId && groupDeck.cards.some(card => card._id.equals(req.query.currentCardId))) {
          currentIndex = groupDeck.cards.findIndex(card => card._id.equals(req.query.currentCardId));
        } else {
          do {
            currentIndex = Math.floor(Math.random() * groupDeck.cards.length);
          } while (groupDeck.shownCards.includes(groupDeck.cards[currentIndex]._id));
        }
    
        // Find the next card that hasn't been shown yet
        let nextCard;
        do {
          currentIndex = (currentIndex + 1) % groupDeck.cards.length;
          nextCard = groupDeck.cards[currentIndex];
        } while (groupDeck.shownCards.includes(nextCard._id));
        
        // Add the card to the shownCards array and save the deck
        groupDeck.shownCards.push(nextCard._id);
        await groupDeck.save();
    
        res.send(nextCard);

      }
else{
      const userId = req.user.userId;
      const deck = await Deck.findOne({_id: req.params.id, userId});
      if (!deck) {
        return res.status(404).json({ message: 'Deck not found' });
      }
  
      // If all cards have been shown, reset the shownCards array
      if (deck.shownCards.length === deck.cards.length) {
        deck.shownCards = []; //to se more dat nazaj v prazno ko se spet začne igra..popravljeno dela vse
        await deck.save();
        return res.status(201).send('All cards have been shown');
      }
  
      // Get the index of the current card being displayed, or choose a random card if no ID is provided
      let currentIndex;
      if (req.query.currentCardId && deck.cards.some(card => card._id.equals(req.query.currentCardId))) {
        currentIndex = deck.cards.findIndex(card => card._id.equals(req.query.currentCardId));
      } else {
        do {
          currentIndex = Math.floor(Math.random() * deck.cards.length);
        } while (deck.shownCards.includes(deck.cards[currentIndex]._id));
      }
  
      // Find the next card that hasn't been shown yet
      let nextCard;
      do {
        currentIndex = (currentIndex + 1) % deck.cards.length;
        nextCard = deck.cards[currentIndex];
      } while (deck.shownCards.includes(nextCard._id));
      
      // Add the card to the shownCards array and save the deck
      deck.shownCards.push(nextCard._id);
      await deck.save();
  
      res.send(nextCard);
    } } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  });

  // API route to reset the "correct" field for all cards in a deck, call this before next card endpoint -- to kličeš prej kot nextcard z nekim gumbom
app.put('/decks/:id/reset-correct', authenticateToken, async (req, res) => {
  try {

    const userId = req.user.userId;
    const deck = await Deck.findOne({_id: req.params.id, userId});
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }
    deck.cards.forEach(card => card.correct = false);
    await deck.save();
    res.sendStatus(200).send('Correct field reset for all cards');
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Get cards that wans't answered correctly
app.get('/decks/:id/incorrect', authenticateToken, async (req, res) => {
    try {

      const userId = req.user.userId;
      const deckId = req.params.id;
      const groupId = req.query.group;

      if (groupId) {
        // Request is for the group's library
        const group = await Group.findOne({ _id: groupId, members: userId });
        if (!group) {
          return res.status(404).json({ message: 'Group not found or user is not a member' });
        }
  
        const groupDeck = await Deck.findOne({ _id: deckId, userId: groupId });

        const cards = groupDeck.cards.filter(card => !card.correct);

        if (cards.length === 0) {
          return res.status(404).send('No inccorect cards found.');
        }
        
        res.send(cards);

      } else {
      const userId = req.user.userId;
    const deck = await Deck.findOne({_id: req.params.id, userId});
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }
      const cards = deck.cards.filter(card => !card.correct);
      
      if (cards.length === 0) {
        return res.status(404).send('No inccorect cards found.');
      }

      res.send(cards);
    } } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  });

// Get cards that wans answered correctly
app.get('/decks/:id/correct', authenticateToken, async (req, res) => {
  try {

    const userId = req.user.userId;
      const deckId = req.params.id;
      const groupId = req.query.group;

      if (groupId) {
        // Request is for the group's library
        const group = await Group.findOne({ _id: groupId, members: userId });
        if (!group) {
          return res.status(404).json({ message: 'Group not found or user is not a member' });
        }
  
        const groupDeck = await Deck.findOne({ _id: deckId, userId: groupId });

        const cards = groupDeck.cards.filter(card => card.correct);

        if (cards.length === 0) {
          return res.status(404).send('No inccorect cards found.');
        }
        
        res.send(cards);

      } else {
    const userId = req.user.userId;
    const deck = await Deck.findOne({_id: req.params.id, userId});
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }
    const cards = deck.cards.filter(card => card.correct);
    
    if (cards.length === 0) {
      return res.status(404).send('No inccorect cards found.');
    }

    res.send(cards);
  } }catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// API route to update a specific card's "correct" field
app.put('/decks/:deckId/cards/:cardId/correct', authenticateToken, async (req, res) => { //avtorizacijo za vse naredit se  
    try {
      const userId = req.user.userId;
      const deckId = req.params.deckId;
      const groupId = req.query.group;

      const isCollection = req.query.collection === 'true';

      if (isCollection) {
        // Retrieve all cards from the deck, regardless of the user
        const deck = await Deck.findOne({ _id: req.params.deckId });
        if (!deck) {
          return res.status(404).json({ message: 'Deck not found' });
        }
        const card = deck.cards.id(req.params.cardId);
        if (!card) {
          return res.status(404).json({ message: 'Card not found' });
        }
        card.correct = req.body.correct;
        await deck.save();
        res.json(card);

      }
        else if (groupId) {
        // Request is for the group's library
        const group = await Group.findOne({ _id: groupId, members: userId });
        if (!group) {
          return res.status(404).json({ message: 'Group not found or user is not a member' });
        }

      
      const groupDeck = await Deck.findOne({ _id: deckId, userId: groupId });

      if (!groupDeck) {
        return res.status(404).json({ message: 'Deck not found' });
      }

      const card = groupDeck.cards.id(req.params.cardId);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    card.correct = req.body.correct;
    await groupDeck.save();
    res.json(card);

      } else {
      const userId = req.user.userId;
      const deckId = req.params.deckId;
      const deck = await Deck.findOne({_id: deckId, userId});
      if (!deck) {
        return res.status(404).json({ message: 'Deck not found' });
      }
    //  const card = deck.cards.id(req.params.cardId).correct = req.body.correct; //da se posodobi nazaj na default če greš od začetka spet novo igro?!..mogoce tam pri play da se vsem carticam correct fieldi ponastavijo na false narediš
    const card = deck.cards.id(req.params.cardId);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    card.correct = req.body.correct;
    await deck.save();
    res.json(card);
    } } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  });


// API route to update a specific card's "correct" field
app.put('/decks/:deckId/cards/:cardId/incorect', authenticateToken, async (req, res) => { //avtorizacijo za vse naredit se  
  try {
    const userId = req.user.userId;
    const deckId = req.params.deckId;
    const groupId = req.query.group;

    if (groupId) {
      // Request is for the group's library
      const group = await Group.findOne({ _id: groupId, members: userId });
      if (!group) {
        return res.status(404).json({ message: 'Group not found or user is not a member' });
      }

    
    const groupDeck = await Deck.findOne({ _id: deckId, userId: groupId });

    if (!groupDeck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    const card = groupDeck.cards.id(req.params.cardId);
  if (!card) {
    return res.status(404).json({ message: 'Card not found' });
  }
  card.correct = req.body.correct;
  await groupDeck.save();
  res.json(card);

    } else {
    const userId = req.user.userId;
    const deckId = req.params.deckId;
    const deck = await Deck.findOne({_id: deckId, userId});
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }
  //  const card = deck.cards.id(req.params.cardId).correct = req.body.correct; //da se posodobi nazaj na default če greš od začetka spet novo igro?!..mogoce tam pri play da se vsem carticam correct fieldi ponastavijo na false narediš
  const card = deck.cards.id(req.params.cardId);
  if (!card) {
    return res.status(404).json({ message: 'Card not found' });
  }
  card.correct = req.body.correct;
  await deck.save();
  res.json(card);
  } } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

  // API route to retrieve performance statistics for a specific deck
    app.get('/decks/:id/statistics', authenticateToken, async (req, res) => {
    try {

      const userId = req.user.userId;
      const deckId = req.params.id;
      const groupId = req.query.group;

      const isCollection = req.query.collection === 'true';

      if (isCollection) {
        // Retrieve all cards from the deck, regardless of the user
        const deck = await Deck.findOne({ _id: req.params.id });
        if (!deck) {
          return res.status(404).json({ message: 'Deck not found' });
        }
        const totalCards = deck.cards.length;
        const correctCards = deck.cards.filter((c) => c.correct).length;
        const incorrectCards = deck.cards.filter((c) => !c.correct).length;
        const percentageCorrect = Math.round((correctCards / totalCards) * 100);
        // const incorrectCardsIds = deck.cards.filter((c) => !c.correct).map((c) => c._id);
        // const correctCardsIds = deck.cards.filter((c) => c.correct).map((c) => c._id);
  
        const incorrectCardsIds = deck.cards.filter((c) => !c.correct);
        const correctCardsIds = deck.cards.filter((c) => c.correct);
        res.json({
          totalCards,
          correctCards,
          incorrectCards,
          percentageCorrect,
          incorrectCardsIds,
          correctCardsIds,
        });

      }

      else if (groupId) {
        // Request is for the group's library
        const group = await Group.findOne({ _id: groupId, members: userId });
        if (!group) {
          return res.status(404).json({ message: 'Group not found or user is not a member' });
        }
      const groupDeck = await Deck.findOne({ _id: deckId, userId: groupId });

      if (!groupDeck) {
        return res.status(404).json({ message: 'Deck not found' });
      }

      const totalCards = groupDeck.cards.length;
      const correctCards = groupDeck.cards.filter((c) => c.correct).length;
      const incorrectCards = groupDeck.cards.filter((c) => !c.correct).length;
      const percentageCorrect = Math.round((correctCards / totalCards) * 100);
      const incorrectCardsIds = groupDeck.cards.filter((c) => !c.correct);
      //const correctCardsIds = groupDeck.cards.filter((c) => c.correct).map((c) => c._id);
      const correctCardsIds = groupDeck.cards.filter((c) => c.correct);
      //tu sem spremenila to
      res.json({
        totalCards,
        correctCards,
        incorrectCards,
        percentageCorrect,
        incorrectCardsIds,
        correctCardsIds,
      });


    }else{

      const userId = req.user.userId;
      const deck = await Deck.findOne({_id: req.params.id, userId});
      if (!deck) {
        return res.status(404).json({ message: 'Deck not found' });
      }
      const totalCards = deck.cards.length;
      const correctCards = deck.cards.filter((c) => c.correct).length;
      const incorrectCards = deck.cards.filter((c) => !c.correct).length;
      const percentageCorrect = Math.round((correctCards / totalCards) * 100);
      // const incorrectCardsIds = deck.cards.filter((c) => !c.correct).map((c) => c._id);
      // const correctCardsIds = deck.cards.filter((c) => c.correct).map((c) => c._id);

      const incorrectCardsIds = deck.cards.filter((c) => !c.correct);
      const correctCardsIds = deck.cards.filter((c) => c.correct);
      res.json({
        totalCards,
        correctCards,
        incorrectCards,
        percentageCorrect,
        incorrectCardsIds,
        correctCardsIds,
      });
    } }catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  });



  function generateInvitationCode() {
    // Your code to generate a unique invitation code goes here
    // For example, you can use a combination of alphanumeric characters
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const codeLength = 8;
    let invitationCode = '';
    
    for (let i = 0; i < codeLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      invitationCode += characters.charAt(randomIndex);
    }
    
    return invitationCode;
  }

  app.get('/groups', authenticateToken, async (req, res) => {
    try {
      const groups = await Group.find({ members: req.user.userId });
      res.json(groups);
    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  });

  app.post('/groups', authenticateToken, async (req, res) => {
    try {
      const { name } = req.body;
      const invitationCode = generateInvitationCode(); // Generate a unique invitation code
      const group = new Group({
        name,
        members: [req.user.userId],
        decks: [],
        invitationCode,
      });
      await group.save();
      res.json({ group, invitationCode });
    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  });

  app.post('/groups/join', authenticateToken, async (req, res) => {
    try {
      const { invitationCode } = req.body;
      const group = await Group.findOneAndUpdate(
        { invitationCode },
        { $addToSet: { members: req.user.userId } },
        { new: true }
      );
      if (!group) {
        return res.json({ message: 'Invalid invitation code' });
      }
      res.json(group);
    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  });


  app.put('/groups/:groupId/addDeck', authenticateToken, async (req, res) => {
    try {
      const { groupId } = req.params;
      const deckId = req.query.deckId;
  
      const group = await Group.findOne({ _id: groupId, members: req.user.userId });
      if (!group) {
        return res.status(404).json({ message: 'Group not found or user is not a member' });
      }
  
      const userDeck = await Deck.findOne({ _id: deckId, userId: req.user.userId });
      if (!userDeck) {
        return res.status(404).json({ message: 'Deck not found' });
      }
  
      //deckId
      if (group.decks.includes(userDeck._id)) {
        return res.status(400).json({ message: 'Deck is already added to the group' });
      }
  
      // Create a new deck instance specifically for the group
      const groupDeck = new Deck({
        userId: groupId,
        name: userDeck.name,
        cards: [...userDeck.cards], // Copy the cards from the user's deck
        shownCards: [...userDeck.shownCards], // Copy the shownCards from the user's deck
      });
  
      await groupDeck.save(); // Save the new group deck
  
      group.decks.push(groupDeck._id); // Add the group deck ID to the group
      await group.save();
  
      res.json(group);
    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  });


  app.get('/groups/:groupId/decks', authenticateToken, async (req, res) => {
    try {
      const { groupId } = req.params;
      const group = await Group.findOne({ _id: groupId, members: req.user.userId })
        .populate({
          path: 'decks',
          populate: {
            path: 'cards',
          },
        });
  
      if (!group) {
        return res.status(404).json({ message: 'Group not found or user is not a member' });
      }
  
      res.json(group.decks);
    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  });

  app.delete('/groups/:groupId/decks', authenticateToken, async (req, res) => {
    try {
      const { groupId } = req.params;
      const deckId = req.query.deckId;
  
      const group = await Group.findOneAndUpdate(
        { _id: groupId, members: req.user.userId },
        { $pull: { decks: deckId } },
        { new: true }
      );
  
      if (!group) {
        return res.status(404).json({ message: 'Group not found or user is not a member' });
      }
  
      res.json(group);
    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  });


  app.put('/groups/:groupId/decks', authenticateToken, async (req, res) => {
    try {
      const { groupId } = req.params;
      const deckId = req.query.deckId;
  

      const group = await Group.findOne({ _id: groupId, members: req.user.userId });

      const deck = await Deck.findOneAndUpdate(
        { _id: deckId, userId: groupId },
        { name: req.body.name },
        { new: true }
      );
  
      if (!deck) {
        return res.status(404).json({ message: 'Deck not found, not authorized to update it' });
      }
  
      res.json({ error: false, message: "Title of Deck updated successfully." });
  
      if (!group) {
        return res.status(404).json({ message: 'Group not found or user is not a member' });
      }
  
      //res.json(group);
    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  });


  app.delete('/groups/:groupId/leave', authenticateToken, async (req, res) => {
    try {
      const { groupId } = req.params;
      const group = await Group.findOneAndUpdate(
        { _id: groupId, members: req.user.userId },
        { $pull: { members: req.user.userId} },
        { new: true }
      );
  
      if (!group) {
        return res.status(404).json({ message: 'Group not found or user is not a member' });
      }
  
      res.json(group);
    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  });

// Add a deck to the collection
app.post('/collection/decks/:deckId', authenticateToken, async (req, res) => {
  try {
    const deckId = req.params.deckId;
    const userId = req.user.userId;

    let collection = await Collection.findOne();

    if (!collection) {
      const newCollection = new Collection({
        decks: [] // Initialize the decks array
      });
      collection = await newCollection.save(); // Assign the saved collection to the variable
    }

    const userDeck = await Deck.findOne({ _id: deckId, userId: userId });

    if (!userDeck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    if (collection.decks.some(deck => deck._id.equals(userDeck._id))) {
      return res.status(400).json({ message: 'Deck is already added to the group' });
    }

    const newDeck = new Deck({
      name: userDeck.name,
      cards: [...userDeck.cards],
      shownCards: [...userDeck.shownCards],
      userId: userDeck.userId
    });
    await newDeck.save();

    collection.decks.push(newDeck._id);

    await collection.save();
    res.json(collection);
    console.log(collection);

  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Get all decks from the collection
app.get('/collection/decks', authenticateToken, async (req, res) => {
  try {
  
    const collection = await Collection.findOne().populate('decks');
    console.log(collection)
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    const decks = collection.decks.map(deck => ({
      _id: deck._id,
      name: deck.name,
      cards: deck.cards,
      shownCards: deck.shownCards,
      userId: deck.userId
    }));

    res.json(decks);
    console.log(decks);
    //res.json(collection.decks);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.delete('/collection/decks/:deckId', authenticateToken, async (req, res) => {
  try {
    const deckId = req.params.deckId;

    const collection = await Collection.findOne();
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    const deckIndex = collection.decks.indexOf(deckId);
    if (deckIndex === -1) {
      return res.status(404).json({ message: 'Deck not found in the collection' });
    }

    collection.decks.splice(deckIndex, 1);
    await collection.save();

    res.json(collection);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.post('/statistics', authenticateToken, async (req, res) => {
  try {
    const groupId = req.query.group;
    const userId = req.user.userId;
    const { deckId, totalCards,
       correctCards,
       incorrectCards,
       percentageCorrect, incorrectCardsIds, correctCardsIds } = req.body;

    const localDate = new Date().toLocaleString("en-GB").replace(/,/g, "");
    // Save the statistics to your database or perform any desired actions
    // For example:
    await Statistics.create({
      userId: userId || null,
      deckId,
      groupId: groupId || null,
     totalCards,
       correctCards,
    incorrectCards,
      percentageCorrect,
      correctCardsIds,
      incorrectCardsIds,
      date: localDate
    });

    res.json({ message: 'Statistics saved successfully' });
  } catch (error) {
    console.error('Failed to save statistics:', error);
    res.sendStatus(500);
  }
});


app.get('/statistics/:deckId', authenticateToken, async (req, res) => {
  try {
    const  deckId  = req.params.deckId;
    const groupId = req.query.group;
    const userId = req.user.userId;
    const isCollection = req.query.collection === 'true';

    let query = {};

    if (groupId) {
      // If groupId is provided, find statistics based on groupId and deckId
      query = {
        groupId,
        deckId,
        userId
       
      };
    }   else if (isCollection) {
      query = {
        deckId,
      };
    }else{
      // If groupId is not provided, find statistics based on userId and deckId
      query = {
        userId,
        deckId,
      };
    }
  
    const savedStatistics = await Statistics.find(query);

    res.json(savedStatistics);
  } catch (error) {
    console.error('Failed to retrieve statistics:', error);
    res.sendStatus(500);
  }
});

app.post("/syncdeckdata",authenticateToken,async(req,res)=>{
  console.log("syncing")
  const decks=req.body.decks;
  console.log(decks)
  try{
  for(let i=0;i<decks.length;i++){
    let newDeck=new Deck({
      name:decks[i].name,
      userId:req.user.userId,
      cards: req.body.cards || []
    })
    newDeck.shownCards = [];
    await newDeck.save()

  }
  res.json({ message: "successfuly synced data." })
 
  }catch(e){
    console.log(e)
    res.json({ error: true, message: "Something went wrong" })

  }
})