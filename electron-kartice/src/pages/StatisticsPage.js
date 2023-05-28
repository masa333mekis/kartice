import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './StatisticsStyles.css';

function StatisticsPage() {
  const [savedStatistics, setSavedStatistics] = useState([]);
  const { id, groupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { collection } = location.state || {}; 


  useEffect(() => {
    const fetchSavedStatistics = async () => {
      try {
        const token = localStorage.getItem('token');
        const queryParams = groupId ? `?group=${groupId}` : '';
        const response = await axios.get(
          `http://localhost:3002/statistics/${id}${queryParams}`,  {
            headers: {
              authorization: `Bearer ${token}`,
            },
            }
        );
        setSavedStatistics(response.data);
      } catch (error) {
        console.error('Failed to fetch saved statistics:', error);
      }
    };
    fetchSavedStatistics();
  }, [id, groupId]);

  const lastFiveStatistics = savedStatistics.slice(-5);

  
  const BacktoCards = () => {
    if(groupId)
    {
    navigate(`/decks/${id}/${groupId}`);
    }
    else{
        navigate(`/decks/${id}`,  { state: { collection } });
    }
  };

  return (
    <div className='saved-statistics-comp'>
        <h1>Saved Statistics</h1>
        {lastFiveStatistics && lastFiveStatistics.length > 0 ? (
        lastFiveStatistics.map((statistics, index) => (
          <div key={statistics._id}>

            <div className='statistics-details'>
              <h3>Statistics {index + 1}</h3>
              <p>Total Cards: {statistics.totalCards}</p>
              <p>Correct Cards: {statistics.correctCards}</p>
              <p>Incorrect Cards: {statistics.incorrectCards}</p>
              <p>Percentage Correct: {statistics.percentageCorrect}%</p>
              <p>Game Date: {statistics.date}</p>
            </div>


            {statistics.correctCardsIds && statistics.correctCardsIds.length > 0 && (
              <div className='correct-card-comp'>
                <h2>Correct Cards</h2>
                {statistics.correctCardsIds.map((card) => (
                  <div key={card._id} className="correct-card">
                    <p>{card.question}</p>
                    <p>{card.answer}</p>
                  </div>
                ))}
              </div>
            )}

            {statistics.incorrectCardsIds && statistics.incorrectCardsIds.length > 0 && (
              <div className='incorrect-card-comp'>
                <h2>Incorrect Cards</h2>
                {statistics.incorrectCardsIds.map((card) => (
                  <div key={card._id} className="incorrect-card">
                    <p>{card.question}</p>
                    <p>{card.answer}</p>
                  </div>
                ))}
              </div>
            )}
            
          </div>
          
        ))
      ) : (
        <p>No statistics found or here are no previous statistics.</p>
      )}
      <button className='back-btn' onClick={BacktoCards}>Back to Cards</button> {/* New button for showing statistics */}
    </div>
  );
}

export default StatisticsPage;