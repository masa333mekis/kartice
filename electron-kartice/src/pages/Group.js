import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './GroupStyles.css';

import { useParams } from 'react-router-dom';
import { Link,useNavigate, useLocation} from 'react-router-dom';
const { ipcRenderer } = window.require('electron');

const GroupPage = () => {
  const { id } = useParams();
  const [decks, setDecks] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = location?.state?.isDark;
  const [showPopup, setShowPopup] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [isEditing, setIsEditing] = useState(false);



  const fetchDecks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3002/groups/${id}/decks`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      setDecks(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const handleDeleteDeck = async (deckId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3002/groups/${id}/decks?deckId=${deckId}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      fetchDecks();
      const notificationData = {
        title: 'Deleted from Group!',
        body: 'You have deleted a deck from the group.'
      };
      ipcRenderer.send('show-deletefromgroup', notificationData);
    } catch (error) {
      console.error(error);
      const notificationData = {
        title: 'Error',
        body: 'Something went wrong!'
      };
      ipcRenderer.send('show-error', notificationData);
    }
  };

  const handleDeckAction = async () => {
    try {
      const token = localStorage.getItem('token');
      let result;
  
      if (isEditing) {
        // Update deck
        result = await axios.put(
          `http://localhost:3002/groups/${id}/decks?deckId=${selectedDeckId}`,
          { name: newTitle },
          {
            headers: {
              authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        // Create deck
        result = await axios.post(
          `http://localhost:3002/decks?group=${id}`,
          { name: newTitle },
          {
            headers: {
              authorization: `Bearer ${token}`,
            },
          }
        );
      }
  
      console.log(result);
      if (!result.data.error) {
        const notificationData = {
          title: 'Updated or Created deck!',
          body: 'You have updated or created deck in the group.'
        };
        ipcRenderer.send('show-updatecreatefromgroup', notificationData);
        fetchDecks();
      } else {
        const notificationData = {
          title: 'Error',
          body: 'Something went wrong!'
        };
        ipcRenderer.send('show-error', notificationData);
      }
      setNewTitle('');
      setSelectedDeckId('');
      setShowPopup(false);
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      const notificationData = {
        title: 'Error',
        body: 'Something went wrong!'
      };
      ipcRenderer.send('show-error', notificationData);
    }
  };
  
  const handleDeckEdit = (deckId, deckName) => {
    setSelectedDeckId(deckId);
    setNewTitle(deckName);
    setIsEditing(true);
    setShowPopup(true);
  };
  
  const handleDeckCreate = () => {
    setSelectedDeckId('');
    setNewTitle('');
    setIsEditing(false);
    setShowPopup(true);
  };

  const BacktoUsersDecks = () => {
     navigate(`/decks`);
   };
   const handlePopupClose = () => {
    setShowPopup(false);
  };
 
  return (
    <>
      <div className={`${isDark ? 'dark' : 'light'} main-container`}>
        <h1 style={isDark?{color:'white'}:{color:'black'}}>Group Page</h1>
        <div className='decks-container'>
          <h2>Decks:</h2>
          <div className='group-decks-list'>
            {decks.length === 0 ? (
              <p>No decks available in this group.</p>
            ) : (
              <ul>
                {decks.map((deck) => (
                  <div className={`${isDark?'group-decks-dark':'group-decks-light'}`}>
                    <li key={deck._id}>
                      <Link to={`/decks/${deck._id}/${id}`}>
                        <h3 className='deck-name'>{deck.name}</h3>
                      </Link>
                      <button className='delete-btn' onClick={() => handleDeleteDeck(deck._id)}>Delete</button>
                      <button className='update-btn' onClick={handleDeckEdit.bind(null, deck._id, deck.name)}>Update</button>
                    </li>
                  </div>
                ))}
              </ul>
            )}
          </div>
        </div>

        {showPopup && (
          <div className="popup">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter deck name"
              />
            <button onClick={handleDeckAction}>{isEditing ? 'Update' : 'Create'}</button>
            <button onClick={handlePopupClose}>Close</button> {/* Button to close the popup */}
          </div>
        )}
        <div className='btns'>
          <button className='add-deck' onClick={handleDeckCreate}>Add Deck</button>
          <button className='back-deck' onClick={BacktoUsersDecks}>Back to Users Decks</button>
        </div>
      </div>
    </>
  );
};

export default GroupPage;
