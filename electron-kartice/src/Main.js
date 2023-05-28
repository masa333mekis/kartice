import React, { useState, useEffect, useContext  } from "react"
import axios from "axios"
import { Link, useNavigate,useParams,useLocation } from "react-router-dom"
const { ipcRenderer } = window.require('electron');

function App() {
  const location=useLocation()
  const { id, groupId } = useParams();
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSlider, setShowSlider] = useState(false);
  const [currentSide,setCurrentSide]=useState(0)
  const [currentCardId, setCurrentCardId] = useState(null);

  const [gameFinished, setGameFinished] = useState(false);
 const { collection } = location.state || {}; 
  
  const [timer, setTimer] = useState(location?.state?.timer || 0);
  const isDark=location?.state?.isDark
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [newCard, setNewCard] = useState({
    question: "",
    answer: "",
  })
  const [showPopup, setShowPopup] = useState(false);


  const handleSliderButtonClick = () => {
    setShowSlider(true);
    setCurrentIndex(0)
    setCurrentSide(0)

  };
 
    useEffect(() => {
      getCards();
    }, []);



    const getCards=async()=>{
      try{
          const token = localStorage.getItem("token")
    const queryParams = groupId ? `?group=${groupId}` : '?collection=true';
         const result=await axios.get(`http://localhost:3002/decks/${id}/cards${queryParams}`,{
          headers: {
              authorization: `Bearer ${token}`,
            },
         })
       
         setCards(result.data.cards);
          // setTitles(result.data.decks)
      }
      catch(e){
        console.log(e)
        const notificationData = {
          title: 'Error',
          body: 'Something went wrong!'
        };
        ipcRenderer.send('show-error', notificationData);
      }
    }

    const handleCreateCard = async () => {
      try {
        const token = localStorage.getItem('token');
        const queryParams = groupId ? `?group=${groupId}` : '';
        const response = await axios.post(
          `http://localhost:3002/decks/${id}/cards${queryParams}`,
          {question: newCard.question, answer: newCard.answer},
          {
            headers: {
              authorization: `Bearer ${token}`,
            },
          }
        );
    
        if (!response.data.error) {
          // toast('Card created successfully!', {
          //   position: toast.POSITION.BOTTOM_RIGHT,
          // });
          const notificationData = {
            title: 'Created Card',
            body: 'You have created a new card!'
          };
          ipcRenderer.send('show-create', notificationData);
          getCards(); // Update the cards list
        } else {
          const notificationData = {
            title: 'Error',
            body: 'Something went wrong!'
          };
          ipcRenderer.send('show-error', notificationData);
        }
    
        setNewCard({
          question: "",
          answer: "",
          })  
        setShowPopup(false);
      } catch (error) {
        const notificationData = {
          title: 'Error',
          body: 'Something went wrong!'
        };
        ipcRenderer.send('show-error', notificationData);
      }
    };
    
    const handleDeleteCard = async (cardId) => {
      try {
        const token = localStorage.getItem('token');
        const queryParams = groupId ? `?group=${groupId}` : '';
        const response = await axios.delete(
          `http://localhost:3002/decks/${id}/cards/${cardId}${queryParams}`,
          {
            headers: {
              authorization: `Bearer ${token}`,
            },
          }
        );
    
        if (response.status === 200) {
          // toast('Card deleted successfully!', {
          //   position: toast.POSITION.BOTTOM_RIGHT,
          // });
          const notificationData = {
            title: 'Deleted Card',
            body: 'You have deleted a card!'
          };
          ipcRenderer.send('show-delete', notificationData);
          getCards(); // Update the cards list
        } else {
          const notificationData = {
            title: 'Error',
            body: 'Something went wrong!'
          };
          ipcRenderer.send('show-error', notificationData);
        }
      } catch (error) {
        const notificationData = {
          title: 'Error',
          body: 'Something went wrong!'
        };
        ipcRenderer.send('show-error', notificationData);
      }
    };
    

    const handleEditCard = (card) => {
      setSelectedCard(card);
      setShowPopup(true);
      setNewCard({
        //_id: card._id,
        question: card.question,
        answer: card.answer,
      });
    };
    
    const handleUpdateCard = async () => {
      try {
        const token = localStorage.getItem('token');
        const queryParams = groupId ? `?group=${groupId}` : '';
        const response = await axios.put(
          `http://localhost:3002/decks/${id}/cards/${selectedCard._id}${queryParams}`,
          {question: newCard.question, answer: newCard.answer},
          {
            headers: {
              authorization: `Bearer ${token}`,
            },
          }
        );
    
        if (!response.data.error) {
          const notificationData = {
            title: 'Updated Card',
            body: 'You have updated a new card!'
          };
          ipcRenderer.send('show-update', notificationData);
          getCards(); // Update the cards list
        } else {
          const notificationData = {
            title: 'Error',
            body: 'Something went wrong!'
          };
          ipcRenderer.send('show-error', notificationData);
        }
    
        setNewCard({
          question: "",
          answer: "",
          })  
        setSelectedCard(null);
        setShowPopup(false);
      } catch (error) {
        const notificationData = {
          title: 'Error',
          body: 'Something went wrong!'
        };
        ipcRenderer.send('show-error', notificationData);
      }
    };


  const handleStartGame = async (id) => {
    try {
      setShowSlider(false); // Reset showSlider to false
      const token = localStorage.getItem("token");
      const queryParams = groupId ? `?group=${groupId}` : '?collection=true';
      const response = await axios.get(`http://localhost:3002/decks/${id}/nextcard${queryParams}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      console.log(id)
      setCurrentCardId(response.data._id);
      setShowSlider(true);
      console.log(response.data._id)  
      setCurrentIndex(0);
      setCurrentSide(0);
      setGameFinished(false); 
  
    } catch (error) {
      const notificationData = {
        title: 'Error',
        body: 'Something went wrong!'
      };
      ipcRenderer.send('show-error', notificationData);
    }
  };




const handleNextCard = async () => {
  try {
    console.log(currentCardId) 
    const token = localStorage.getItem("token");
    const queryParams = groupId ? `?group=${groupId}` : '?collection=true';
    const response = await axios.get(`http://localhost:3002/decks/${id}/nextcard${queryParams}`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    if (response.status === 201) {
      setGameFinished(true);
    } else {
      setCurrentCardId(response.data._id);
      setShowSlider(true);
      console.log("Show Slider:", true);
      setCurrentSide(0);
      console.log(response.data._id) 
      //setCurrentIndex((prevIndex) => prevIndex + 1);
    }
  } catch (error) {
    const notificationData = {
      title: 'Error',
      body: 'Something went wrong!'
    };
    ipcRenderer.send('show-error', notificationData);
  }
};

  useEffect(() => {
    if (!gameFinished) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameFinished]);

  const handleCorrect = async (cardId) => {
    try {
      const token = localStorage.getItem("token");
      const queryParams = groupId ? `?group=${groupId}` : '?collection=true';
      await axios.put(
        `http://localhost:3002/decks/${id}/cards/${cardId}/correct${queryParams}`,
        { correct: true },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );
      handleNextCard(); // Go to the next card
      
    } catch (error) {
      const notificationData = {
        title: 'Error',
        body: 'Something went wrong!'
      };
      ipcRenderer.send('show-error', notificationData);
    }
  };
  
  const handleIncorrect = async (cardId) => {
    try {
      const token = localStorage.getItem("token");
      const queryParams = groupId ? `?group=${groupId}` : '?collection=true';
      await axios.put(
        `http://localhost:3002/decks/${id}/cards/${cardId}/correct${queryParams}`,
        { correct: false },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );
      handleNextCard(); // Go to the next card
      
    } catch (error) {
      const notificationData = {
        title: 'Error',
        body: 'Something went wrong!'
      };
      ipcRenderer.send('show-error', notificationData);
    }
  };

  const handleShowStatistics = () => {
  if(groupId) {
    navigate(`/decks/${id}/statistics/${groupId}`);
  } else  {
    navigate(`/decks/${id}/statistics`, { state: { collection } });
  }
  };

  const handleShowStatisticsPrevios = () => {
    if(groupId) {
      navigate(`/decks/${id}/statisticprev/${groupId}`);
    } else {
      navigate(`/decks/${id}/statisticprev` , { state: { collection } });
    }
    };

  const handlePopupClose = () => {
    setShowPopup(false);
  };

  const BacktoDecks = () => {
   // navigate("/decks/:id");
   if(groupId) {
    navigate(`/groups/${groupId}`);
  } 
  else {
    navigate(`/decks`);
  }
  };

  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/login")
  }

  return (
    <>
    
    <div className={`${isDark?'dark':'light'} main-container`}>
      
      <div id="search-container" className={`${isDark?'dark':'light'}`}>
  
      {!collection && (
                <>
        <button className="add-btn" onClick={() => setShowPopup(true)}>
          Add
        </button>
        </>
      )}
        <button className="start-game-btn" onClick={() => handleStartGame(id)} >Start Game</button>
        <button className="stat-prev-btn" onClick={handleShowStatisticsPrevios}>Show Statistics Previos</button>
        <button className="back-to-deck-btn" onClick={BacktoDecks}>Back to Decks</button>
        <button className="logout-btn" id={`${isDark?'button-dark':'button-light'}`} onClick={handleLogout}>
          Logout
        </button>
      </div>
        <div className="questions">
          <div className={`App ${isDark?'dark':'light'}`}>
            {cards &&
              cards.map((card, index) => (
                <div key={index} className="question-card">
                  {!collection && (
                    <>
                  <button className="q-delete-btn" onClick={() => handleDeleteCard(card._id)}>Delete</button>
                  <button className="q-edit-btn" onClick={() => handleEditCard(card)}>Edit</button>
                  <br />
                  </>
                  )}
                  <h2>{card.question}</h2>
                  <p>{card.answer}</p>
                </div>
              ))}
        </div>
        </div>

      {showPopup && (
      <div id="popup-box" className="popup">
        <div className="popup-content">
  
            <div className="form-group">
              <label htmlFor="title">Question:</label>
              <input
                type="text"
                value={newCard.question}
                onChange={(e) =>
                  setNewCard({ ...newCard, question: e.target.value })
                }
                id="title"
                name="title"
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Answer:</label>
              <textarea
                id="description"
                value={newCard.answer}
                onChange={(e) =>
                  setNewCard({ ...newCard, answer: e.target.value })
                }
                name="description"
              ></textarea>
            </div>
            <button onClick={!selectedCard ? handleCreateCard : handleUpdateCard}>
      {!selectedCard ? 'Create' : 'Update'}
    </button>

    <button onClick={handlePopupClose}>Close</button> 
        </div>
      </div>
)}

    <div>
      {showSlider && !gameFinished && (
        <div className="slider">
          <Card
            element={cards.find(card => card._id === currentCardId)}
            currentSide={currentSide}
            onFlip={() => setCurrentSide(currentSide === 0 ? 1 : 0)}
            onNext={handleNextCard}
            isDark={isDark}
            currentIndex={currentIndex}
            handleSliderButtonClick={handleSliderButtonClick}
           gameFinished={gameFinished}
          timer={timer}
          handleCorrect={handleCorrect}
          handleIncorrect={handleIncorrect}
          />      
            
        </div>
      )}
      {gameFinished && (
        <div>
          <p>Game Finished</p>
          <p>Timer: {timer} seconds</p>
          <button onClick={handleShowStatistics}>Show Statistics</button>
        </div>
      )}
    </div>
    </div>
    </>
    
  );
}

const Card = ({ element, currentSide, onFlip, onNext, gameFinished, timer, handleCorrect, handleIncorrect }) => {

  const handleFlipButtonClick = () => {
    onFlip();
  };
  const handleCorrectButtonClick = () => {
    handleCorrect(element._id);
  };

  const handleIncorrectButtonClick = () => {
    handleIncorrect(element._id); 
  };


  return (
<div className="card">
      {!currentSide?
      <div className={`card-side ${currentSide === 0 ? 'front' : 'back'}`}>
        <p>{element.question}</p>
        <div className="buttons">
        <button onClick={()=>handleFlipButtonClick()}>Flip the Card</button>
        </div>
      </div>:
      <div className={`card-side ${currentSide === 1 ? 'front' : 'back'}`}>
        <p>{element.answer}</p>
           {/* <button onClick={()=>handleNextButtonClick()}>Next</button> */}
          <div className="buttons">
            <button className="correct-btn" onClick={handleCorrectButtonClick}>Correct</button>
            <button onClick={handleIncorrectButtonClick}>Incorrect</button>
          </div>
        </div>
      }
  </div>
 );
};

export default App