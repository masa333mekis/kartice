import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Link, useNavigate,useParams,useLocation } from "react-router-dom"
import './Statistics.css';
const { ipcRenderer } = window.require('electron');

function StatisticsPage() {
//const StatisticsPage () => {
  const [statistics, setStatistics] = useState(null);
  const { id, groupId } = useParams();
  const navigate = useNavigate()
  const location=useLocation()
  const [showCorrectCards, setShowCorrectCards] = useState(false);
  const [showInCorrectCards, setShowInCorrectCards] = useState(false);
  const isDark=location?.state?.isDark
  const [statisticsSaved, setStatisticsSaved] = useState(false);
  const { collection } = location.state || {}; 

useEffect(() => {
  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = groupId ? `?group=${groupId}` : '?collection=true';
      const response = await axios.get(`http://localhost:3002/decks/${id}/statistics${queryParams}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
     
    setStatistics(response.data);
    } catch (error) {
      console.error(error);
    }
  };
  fetchStatistics();

}, [id, groupId]);

const saveStatistics = async () => {
  try {
    const token = localStorage.getItem('token');
    const queryParams = groupId ? `?group=${groupId}` : '';
    const response = await axios.post(
      `http://localhost:3002/statistics${queryParams}`,
      {
        // Include the necessary data to save the statistics
        // For example:
        deckId: id,
        groupId: groupId,
        totalCards: statistics.totalCards,
        correctCards: statistics.correctCards,
        incorrectCards: statistics.incorrectCards,
        percentageCorrect: statistics.percentageCorrect,
        correctCardsIds: statistics.correctCardsIds,
        incorrectCardsIds: statistics.incorrectCardsIds,
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );
    console.log('Statistics saved:', response.data);
    const notificationData = {
      title: 'Statistics saved!',
      body: 'Statistics was automatically saved.'
    };
    ipcRenderer.send('show-statisticssaved', notificationData);
    // Handle any further actions after saving the statistics, such as displaying a success message or updating the UI.
  } catch (error) {
    console.error('Failed to save statistics:', error);
    // Handle error cases, such as displaying an error message or taking corrective actions.
  }
};
useEffect(() => {
  if (statistics && !statisticsSaved) {
    saveStatistics();
    setStatisticsSaved(true);
  }
}, [statistics, statisticsSaved]);

  // const handleSaveStatistics = () => {
  //   saveStatistics(); // Call the saveStatistics function with the statistics data
  // };

  const BacktoCards = () => {
    if(groupId)
    {
    navigate(`/decks/${id}/${groupId}`);
    }
    else if(collection === true) {
      navigate(`/decks/${id}`, { state: { collection } });
    }
    else{
        navigate(`/decks/${id}`);
    }
  };

  if (!statistics) {
    return <div>Loading...</div>;
  }
  

  const {
    totalCards,
    correctCards,
    incorrectCards,
    percentageCorrect,
    correctCardsIds,
    incorrectCardsIds,

  } = statistics;



  return (
    <div className={`${isDark?'dark':'light'} main-container`}>
    <div>
      <h1>Statistics</h1>
      <p>Total Cards: {totalCards}</p>
      <p>Correct Cards: {correctCards}</p>
      <p>Incorrect Cards: {incorrectCards}</p>
      <p>Percentage Correct: {percentageCorrect}%</p>
     
<button className='show-incorrect-btn' onClick={() => setShowInCorrectCards(true)}>Show Incorrect Cards</button>
<button className='show-correct-btn' onClick={() => setShowCorrectCards(true)}>Show Correct Cards</button>

{showCorrectCards && (
    <div>
      <h2>Correct Cards</h2>
      {correctCardsIds.map((card) => (
        <div key={card._id} className="card">
          <p>{card.question}</p>
          <p>{card.answer}</p>
        </div>
      ))}
    </div>
  )}

{showInCorrectCards && (
    <div>
      <h2>InCorrect Cards</h2>
      {incorrectCardsIds.map((card) => (
        <div key={card._id} className="card">
          <p>{card.question}</p>
          <p>{card.answer}</p>
        </div>
      ))}
    </div>
  )}

     <button onClick={BacktoCards}>Back to Cards</button> 

</div>
</div>
  );
};

export default StatisticsPage;