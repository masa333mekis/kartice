import { useState,useEffect } from 'react';
import './styles.css';
import { Link, NavLink ,useNavigate,useParams} from 'react-router-dom';
import axios from 'axios';
const { ipcRenderer } = window.require('electron');


function App() {
  const [showPopup, setShowPopup] = useState(false);
  const [titles, setTitles] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [selectedDeck,setSelectedDeck]=useState(false)
  const navigate=useNavigate()
  const [isDark,setIsDark]=useState(window.matchMedia("(prefers-color-scheme: dark)").matches)
  const [timer, setTimer] = useState(300000)
  const [searchQuery, setSearchQuery] = useState("");
  const [groupName, setGroupName] = useState('');
  const [groupInfo, setGroupInfo] = useState(null);
  const [groupId, setGroupId] = useState(null);
  const [showPopupGroup, setShowPopupGroup] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showPopupGroupDeck, setPopupGroupDeck] = useState(false);
  const [deckId, setDeckId] = useState([]);
  const [invitationCode, setInvitationCode] = useState('');
  const [showPopupJoin, setShowPopupJoin] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSynced, setIsSynced] = useState(true);


  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (!isSynced) {
        syncDB(); // Call syncDB only if sync is not completed
      }
    };
  
    const handleOffline = () => {
      setIsOnline(false);
      setIsSynced(false); 
    };
  
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isSynced]);

  useEffect(() => {
    if (!isOnline) {  
      // User is offline, save decks to local storage
      localStorage.setItem('decks', JSON.stringify(titles));

    } })

  const getDecks=async()=>{
    if (!isOnline) {
      // User is offline, retrieve decks from local storage
      const savedDecks = localStorage.getItem('decks');
      if (savedDecks) {
        const decks = JSON.parse(savedDecks);
        setTitles(decks);
      }
      return;
    }
    try{
        const token = localStorage.getItem("token")
       const result=await axios.get('http://localhost:3002/decks',{
        headers: {
            authorization: `Bearer ${token}`,
          },
       })
      
         setTitles(result.data.decks)
    }
    catch(e){
      const notificationData = {
        title: 'Error',
        body: 'Something went wrong!'
      };
      ipcRenderer.send('show-error', notificationData);
    }
  }

  useEffect(()=>{
   getDecks()
  },[])

  const handleCreateClick = () => {
    setShowPopup(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/login")
  }

  
  useEffect(() => {
    const savedDecks = JSON.parse(localStorage.getItem('decks'));
    if (savedDecks && savedDecks.length > 0) {
      setTitles((prevTitles) => [...prevTitles, ...savedDecks]);
      syncDB();
    }
  }, []);


  const handleSaveClick =async () => {
    if (!isOnline) {
      // User is offline, save deck to local storage
      const savedDecks = JSON.parse(localStorage.getItem('decks')) || [];
      const updatedDecks = [...savedDecks, { name: newTitle }];
      localStorage.setItem('decks', JSON.stringify(updatedDecks));
      const notificationData = {
        title: 'Created Deck Locally',
        body: 'You have saved deck locally!'
      };
      ipcRenderer.send('show-create', notificationData);
      setTitles((prevTitles) => [...prevTitles, { name: newTitle }]);
      setNewTitle('');
      setShowPopup(false);
      return;
    }

    try{
    const token = localStorage.getItem("token")
    const result=await axios.post('http://localhost:3002/decks',{name:newTitle},{
        headers: {
          authorization: `Bearer ${token}`,
        },
      })
      if (!result.data.error) {
        const notificationData = {
          title: 'Created Deck',
          body: 'You have created a new deck!'
        };
        ipcRenderer.send('show-createdeck', notificationData);
        getDecks()
      } else {
        const notificationData = {
          title: 'Error',
          body: 'Something went wrong!'
        };
        ipcRenderer.send('show-error', notificationData);
      }
    //setTitles([...titles, newTitle]);
    setTitles((prevTitles) => [...prevTitles, { name: newTitle }]);
  
    setNewTitle('');
    setShowPopup(false);
    }
    catch(e){
      const notificationData = {
        title: 'Error',
        body: 'Something went wrong!'
      };
      ipcRenderer.send('show-error', notificationData);
    }  
};

const syncDB = async () => {
  try {
    const decks = JSON.parse(localStorage.getItem('decks'));
    if (decks && decks.length > 0) {
      const token = localStorage.getItem('token');
      const unsyncedDecks = decks.filter(deck => !deck._id);
      if (unsyncedDecks.length > 0) {
      const result = await axios.post(
        'http://localhost:3002/syncdeckdata',
        { decks: unsyncedDecks },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );
      if (!result.data.error) {
        const notificationData = {
          title: 'Successfully Synced',
          body: 'You have successfully synced your data!'
        };
        ipcRenderer.send('show-sync', notificationData);
        setIsSynced(true); // Set the flag to indicate sync is completed
        localStorage.removeItem('decks'); // Remove the decks from local storage
        getDecks();
      } else {
        const notificationData = {
          title: 'Error',
          body: 'Something went wrong!'
        };
        ipcRenderer.send('show-error', notificationData);
      }
    } else {
      setIsSynced(true);
      localStorage.removeItem('decks');
      const notificationData = {
        title: 'Nothing to Sync',
        body: 'You have no deck to sync!'
      };
      ipcRenderer.send('show-nosync', notificationData);
    }
  }
  } catch (e) {
    const notificationData = {
      title: 'Error',
      body: 'Something went wrong!'
    };
    ipcRenderer.send('show-error', notificationData);
    getDecks();
  }
};

const handleEdit=async(deck)=>{
 setSelectedDeck(deck)
 setShowPopup(true)
 setNewTitle(deck.name)
}

const handleUpdateClick=async()=>{
    try{
        const token = localStorage.getItem("token")
        const result=await axios.put(`http://localhost:3002/decks/${selectedDeck._id}`,{name:newTitle},{
            headers: {
              authorization: `Bearer ${token}`,
            }}
            )
         setNewTitle('')
         setSelectedDeck(false) 
         setShowPopup(false)
         if(!result.data.error){
         const notificationData = {
          title: 'Updated Deck',
          body: 'You have updated a new deck!'
        };
        ipcRenderer.send('show-updatedeck', notificationData); 
       } else{
        const notificationData = {
          title: 'Error',
          body: 'Something went wrong!'
        };
        ipcRenderer.send('show-error', notificationData);
          getDecks()
    }}
    catch(e){
      const notificationData = {
        title: 'Error',
        body: 'Something went wrong!'
      };
      ipcRenderer.send('show-error', notificationData);
    }
}


const handleDelete=async(id)=>{
  try{
    const token = localStorage.getItem("token")

    const result=await axios.delete(`http://localhost:3002/decks/${id}`,{
        headers: {
          authorization: `Bearer ${token}`,
        }})
    if (!result.data.error) {
      const notificationData = {
        title: 'Deleted Deck',
        body: 'You have deleted a deck!'
      };
      ipcRenderer.send('show-deletedeck', notificationData);
        getDecks()
      } else {
        const notificationData = {
          title: 'Error',
          body: 'Something went wrong!'
        };
        ipcRenderer.send('show-error', notificationData);
    }
  }
  catch(e){
    const notificationData = {
      title: 'Error',
      body: 'Something went wrong!'
    };
    ipcRenderer.send('show-error', notificationData);
  }
  }


  const handleSearch = async (event) => {
    event.preventDefault();
    try {
      const token = localStorage.getItem("token")
      const result = await axios.get(
        `http://localhost:3002/decks/search?q=${searchQuery}`,{
          headers: {
            authorization: `Bearer ${token}`,
          }})
          console.log(result.data)
      setTitles(result.data);
    } catch (err) {
      const notificationData = {
        title: 'Error',
        body: 'Something went wrong!'
      };
      ipcRenderer.send('show-error', notificationData);
    }
  };


  useEffect(() => {
    const token = localStorage.getItem('token');
    const fetchGroups = async () => {
      try {
        const response = await axios.get('http://localhost:3002/groups', {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });
        setGroups(response.data);   

      } catch (error) {
        console.error(error);
      }
    };

    fetchGroups();
  }, []);
  
  
    const handleGroupNameChange = (event) => {
      setGroupName(event.target.value);
    };
  
    const handleSubmit = async (event) => {
      event.preventDefault();
  
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post('http://localhost:3002/groups', { name: groupName }, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });
  
        const { group, invitationCode } = response.data;
       // onGroupCreated(group, invitationCode);

       setGroups([...groups, group]); 
  
        // Set the group information to be displayed
        // Navigate to the group page with the groupId
      
        // setGroups([...groups, response.data]);
      // Clear the group name input
      setGroupName('');
      setGroupInfo({ name: group.name, invitationCode });
      const notificationData = {
        title: 'Created Group',
        body: 'You have created a new group!'
      };
      ipcRenderer.send('show-creategroup', notificationData);
      } catch (error) {
        console.error(error);
      }
      setShowPopupGroup(false)
    }

     const handleAddToGroup = (deckId) => {
       setDeckId(deckId);
      //showPopupGroupDeck(true);
    };

    const handleSelectGroup = async () => {
      const token = localStorage.getItem('token');
      console.log('Selected Group:', selectedGroup);
  console.log('Deck id:', deckId);

      try {
       await axios.put(
          `http://localhost:3002/groups/${selectedGroup}/addDeck?deckId=${deckId}`,
          {},
          {
            headers: {
              authorization: `Bearer ${token}`,
            },
          }
        );
      
        setPopupGroupDeck(false);
        // handle success
        const notificationData = {
          title: 'Deck added to the group',
          body: 'You have added a deck to the group!'
        };
        ipcRenderer.send('show-adddeck', notificationData);
      } catch (error) {
        const notificationData = {
          title: 'Error',
          body: 'Something went wrong!'
        };
        ipcRenderer.send('show-error', notificationData);
      }
    };

    const handleInputChange = (event) => {
      setInvitationCode(event.target.value);
    };
  
    const handleJoin = async (event) => {
      event.preventDefault();
  
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
          'http://localhost:3002/groups/join',
          { invitationCode: invitationCode },
          {
            headers: {
              authorization:  `Bearer ${token}`,
            },
          }
        );
        // Handle the response or update the state as needed
        const  group  = response.data;
        
          // Add the new group to the list of groups -------preveri če dela

          setGroups([...groups, group]);
        // Reset the invitation code field
        setInvitationCode('');
        // Close the popup
        setShowPopupJoin(false);
        const notificationData = {
          title: 'Joined Group',
          body: 'You have joined a group!'
        };
        ipcRenderer.send('show-joingroup', notificationData);
      } catch (error) {
        const notificationData = {
          title: 'Error',
          body: 'Something went wrong!'
        };
        ipcRenderer.send('show-error', notificationData);
      }
    };

    const handleLeaveGroup = async (groupId) => {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:3002/groups/${groupId}/leave`, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });
    
        // Update the groups state by filtering out the group that was left
        setGroups(groups.filter((group) => group._id !== groupId));
        const notificationData = {
          title: 'Leaved Group',
          body: 'You have leaved a group!'
        };
        ipcRenderer.send('show-leavegroup', notificationData);
      } catch (error) {
        const notificationData = {
          title: 'Error',
          body: 'Something went wrong!'
        };
        ipcRenderer.send('show-error', notificationData);
      }
    };

    const handlePopupClose = () => {
      setShowPopupGroup(false);
      setShowPopup(false);
      setShowPopupJoin(false);
      setPopupGroupDeck(false);
    };


  return (

    <>
 <div className={`${isDark?'dark':'light'} main-container`}>
     
    <button className='logout-button' id={`${isDark?'button-dark':'button-light'}`} onClick={handleLogout}>
      Logout
    </button>
     
    <div className="timer">
          <label style={isDark?{color:'white'}:{color:'black'}}>Mode:</label>
          <select
            defaultValue="default"
            onChange={(e) =>{
              if(e.target.value=='default'){
              setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches)
              }
              else{
                setIsDark(!window.matchMedia("(prefers-color-scheme: dark)").matches)
              }
            }}          
          >
            <option value="custom">{window.matchMedia("(prefers-color-scheme: dark)").matches?'light':'Dark'}</option>

            <option value="default">default</option>
          </select>
    </div>

    <div className='deck-alignment'>
        <div className='deck-create-component'>
          <h1 style={isDark?{color:'white'}:{color:'black'}}>Decks</h1>
          <button className='create-btn' onClick={handleCreateClick}>Create</button>
          <Link style={isDark?{color:'white'}:{color:'black'}} className='user-library' to="/collection" state={{isDark}}>Users Library</Link>

          <button className='create-group' onClick={() => setShowPopupGroup(true)}>Create Group</button>
          <button className='join-group' onClick={() => setShowPopupJoin(true)}>Join Group</button>
        </div>
    </div>
     
    <form className='search-component' onSubmit={handleSearch}>
        <input 
          placeholder="Search deck by name"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
            id="search-box"
          />
          <button className='search-btn' type="submit">Search</button>
    </form>


    {showPopupGroup && (
       <div className="popup">
            <input
            type="text"
            value={groupName}
            onChange={handleGroupNameChange}
            placeholder="Enter group name"
          />
          <button className='popup-create-btn' onClick={handleSubmit}>Create</button>
          <button className='popup-close-btn' onClick={handlePopupClose}>Close</button> {/* Button to close the popup */}
        </div>
      )}
     

{/* <button onClick={() => setShowPopupGroup(true)}>Create Group</button> */}


    <div className='group-list'>
      <ul>
        {groups.map((group) => (
          <div className={`${isDark?'group-card-dark':'group-card-light'}`}>
              <li key={group._id} >
                <Link to={`/groups/${group._id}`} state={{ isDark, timer }}>
                    {/* <p className={`${isDark?'group-name-dark':'group-name-light'}`} >Group Name: {group.name}</p> */}
                    <p className='group-name' >Group Name: {group.name}</p>
                </Link>
                <p>Invitation Code: {group.invitationCode}</p>
                <button onClick={() => handleLeaveGroup(group._id)}>Leave Group</button>
              </li>
          </div>
        ))}
      </ul>
    </div>

{showPopupGroupDeck && (
        <div className="popup">
          <h4 style={{color:'white'}}>Select a group to add the deck to:</h4>
          {groups.map((group) => (
            <div key={group._id}>
              <input
                type="radio"
                name="group"
                value={group._id}
                checked={selectedGroup === group._id}
                onChange={() => setSelectedGroup(group._id)}
              />
              <label className='group-name' htmlFor={group._id}>{group.name}</label>
            </div>
          ))}
          <button onClick={handleSelectGroup}>Add to Group</button>
          <button onClick={handlePopupClose}>Close</button> {/* Button to close the popup */}
        </div>
      )}

{/* <button onClick={() => setShowPopupJoin(true)}>Join Group</button> */}

      {showPopupJoin && (
        <div className="popup">
        
        <input
            type="text"
            value={invitationCode}
            onChange={handleInputChange}
            placeholder="Enter invitation code"
          />
       
            <button onClick={handleJoin}>Join</button>
            <button onClick={handlePopupClose}>Close</button> {/* Button to close the popup */}
        </div>
      )}


    {/* <div className='topBar'>
      <h1 style={isDark?{color:'white'}:{color:'black'}}>Decks</h1>
      <button onClick={handleCreateClick}>Create</button>
      <Link to="/collection" state={{isDark}}>Users Library</Link>
    </div> */}


      {showPopup && (
        <div className="popup">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Enter deck name"
          />
          <button onClick={!selectedDeck?handleSaveClick:handleUpdateClick}>{!selectedDeck?'Create':'Update'}</button>
          <button onClick={handlePopupClose}>Close</button>
        </div>
      )}

      <div className="deck-list">
        {titles &&
              titles.map((item, index) => (
                <div key={index} className="card">
                  <button onClick={()=>handleDelete(item._id)}>Delete</button>
                  <button onClick={()=>handleEdit(item)}>Edit</button>
                  <button onClick={() => { console.log('Deck ID:', item._id); handleAddToGroup(item._id); setPopupGroupDeck(true); }}>Add to Group</button>
                  <br />
                  <Link to={`/decks/${item._id}`} onClick={() => setSelectedDeck(item._id)} state={{isDark}}>
                  <h2>{item.name}</h2>
                  </Link>
                </div>
              ))}
      </div>
    </div>

    </>
  );
}

export default App;
