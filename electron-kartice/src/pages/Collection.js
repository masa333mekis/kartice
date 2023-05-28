import './CollectionStyles.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate,useParams,useLocation } from "react-router-dom"
const { ipcRenderer } = window.require('electron');



const Collection = () => {
    const location=useLocation()
    const navigate = useNavigate();
    const [decks, setDecks] = useState([]);
    const [userDecks, setUserDecks] = useState([]);
    const [selectedDeck, setSelectedDeck] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const[showPopupDelete,setShowPopupDelete]=useState(false)
    const isDark=location?.state?.isDark

    // Fetch all decks from the collection
    const fetchDecks = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3002/collection/decks', {
            headers: {
                authorization: `Bearer ${token}`,
              },
            });
        setDecks(response.data);
      } catch (error) {
        console.error(error);
      }
    };
  
    // Fetch user's decks
    const fetchUserDecks = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3002/decks', {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });
        setUserDecks(response.data.decks);
      } catch (error) {
        console.error(error);
      }
    };
  
    // Add a deck to the collection
    const addDeckToCollection = async () => {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`http://localhost:3002/collection/decks/${selectedDeck}`, null, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });
        fetchDecks(); // Fetch decks after adding a new one
        setShowPopup(false);
        const notificationData = {
          title: 'Added to Users library!',
          body: 'Deck added to the users library.'
        };
        ipcRenderer.send('show-addtolibrary', notificationData);
      } catch (error) {
        console.error(error);
        const notificationData = {
          title: 'Error',
          body: 'Something went wrong!'
        };
        ipcRenderer.send('show-error', notificationData);
      }
    };
  
    useEffect(() => {
      fetchDecks();
      fetchUserDecks();
    }, []);
  
    const handlePopupClose = () => {
      setShowPopup(false);
      setShowPopupDelete(false);
    };

    // Delete a deck from the collection
  const deleteDeckFromCollection = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3002/collection/decks/${selectedDeck}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      fetchDecks(); // Fetch decks after deleting one
      setShowPopupDelete(false);
      const notificationData = {
        title: 'Deleted from Users library!',
        body: 'You have removed a deck from the users library.'
      };
      ipcRenderer.send('show-deletefromlibrary', notificationData);
    } catch (error) {
      console.error(error);
      const notificationData = {
        title: 'Error',
        body: 'Something went wrong!'
      };
      ipcRenderer.send('show-error', notificationData);
    }
  };

 
  const BacktoUsersDecks = () => {

     navigate('/decks');
   
   };

   const collection = true;
  return (
  
    <div>
    <h1>Deck Collection</h1>
    <div className='collection-btns'>
          <button className='deck-back-btn' onClick={BacktoUsersDecks}>Back to Users Decks</button>
          <button className='deck-add-btn' onClick={() => setShowPopup(true)}>Add deck to the collection</button>
          {showPopup && (
                  <div className="popup">
                    <h4 style={{color:'white'}}>Select a group to add the deck to:</h4>
                    {userDecks.map((deck) => (
                      <div key={deck._id}>
                        <input
                          type="radio"
                          name="userdecks"
                          value={selectedDeck}
                          checked={selectedDeck === deck._id}
                          onChange={(e) => setSelectedDeck(deck._id)}
                        />
                        <label className='group-name' htmlFor={deck._id}>{deck.name}</label>
                      </div>
                    ))}
                        <button onClick={addDeckToCollection} disabled={!selectedDeck}>
                    Add to Collection
                  </button>
                    <button onClick={handlePopupClose}>Close</button> {/* Button to close the popup */}
                  </div>
                )}

          <button className='deck-remove-btn' onClick={() => setShowPopupDelete(true)}>Remove deck to the collection</button>
          {showPopupDelete && (
                  <div className="popup">
                    <h4 style={{color:'white'}} >Select a group to remove the deck to:</h4>
                    {userDecks.map((deck) => (
                      <div key={deck._id}>
                        <input
                          type="radio"
                          name="userdecks"
                          value={selectedDeck}
                          checked={selectedDeck === deck._id}
                          onChange={(e) => setSelectedDeck(deck._id)}
                        />
                        <label className='group-name' htmlFor={deck._id}>{deck.name}</label>
                      </div>
                    ))}
                        <button onClick={deleteDeckFromCollection} disabled={!selectedDeck}>
                    Remove from Collection
                  </button>
                    <button onClick={handlePopupClose}>Close</button> {/* Button to close the popup */}
                  </div>
                )}
      </div>

        <h2>Decks in the Collection:</h2>
        <div className='decks-collection-second-row'>             
          {decks.map((deck) => (
            <div key={deck._id} className="deck-collection-card">
            <Link to={`/decks/${deck._id}`} state={{ isDark, collection } }>
                <h3>{deck.name}</h3>
              </Link>
            </div>
          ))}
        </div> 
      </div>
  );
};

export default Collection;