import React, {useEffect, useState} from 'react';
import io from 'socket.io-client';
import {StoreProvider, useStoreActions, useStoreState} from 'easy-peasy';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useHistory,
  useParams,
} from "react-router-dom";

import fetchApi from './fetchApi';
import Editor from './Editor';
import store from './store';

import './App.css';
const socket = io('http://localhost:3000', { autoConnect: false });


function useSocket() {
  // useEffect(() => {
  //   socket.connect();
  // });
  return {socket};
}

function App() {

  console.log('App loaded')
  return (
    <Router>
      <StoreProvider store={store}>
        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', marginTop: 120}}>
          <div style={{ width: 500, backgroundColor: 'lightgray'}}>
            <Routing />
          </div>
        </div>
      </StoreProvider>
    </Router>
  );
}

function Home() {
  const history = useHistory();
  const username = useStoreState(state => state.profile.username);
  const setUsername = useStoreActions(actions => actions.profile.setUsername);

  const handleHost = () => {
    if (!username.length) {
      return alert('Username must be set.');
    }

    fetchApi('/api/room', {
      method: 'POST',
      body: {
        username
      }
    }).then(({ room }) => {
      console.log(room, ':data');
      history.push(`/room/${room['id']}`);
    });
  }

  return (
    <div>
      <input type="text" onChange={(e) => setUsername({ username: e.target.value })} value={username} />
      <div onClick={handleHost}>Host Game</div>
      <Link to="/join">Join Game</Link>
      <Link to="/draw">Draw</Link>
    </div>
  )
}

function JoinRoom() {
  const history = useHistory();
  const [code, setCode] = useState('');
  const username = useStoreState(state => state.profile.username);

  const handleJoin = () => {
    fetchApi(`/api/room/${code}/join`, {
      method: 'POST',
      body: {
        username
      }
    }).then(({ room }) => {
      console.log(room, ':data');
      history.push(`/room/${room['id']}`);
    });
  }

  return (
    <div>
      Enter Room Code:
      <input type="text" value={code} onChange={(e) => setCode(e.target.value)} />
      <button onClick={handleJoin}></button>
    </div>
  )
}

function Routing() {
  // const {socket} = useSocket();


  // useEffect(() => {
  //   console.log('mount')
  //   socket.on('connect', () => {
  //       console.log("We connected!!!");
  //   })

  //   socket.emit('events', {data: 'Oink'});
  // });
  // const username = useStoreState(state => state.profile.username);
  const setUsername = useStoreActions(actions => actions.profile.setUsername);
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    fetchApi(`/api/room/profile`, {
      method: 'GET',
    }).then(({ roomId, username }) => {
      setLoading(false);
      if (roomId) {
        setUsername({ username });
        history.push(`/room/${roomId}`);
      }
    })
  }, []);

  if (loading) {
    return <div>Loading...</div>
  }


  return (
    <Switch>
      <Route exact path="/">
        <Home />
      </Route>
      <Route path="/join">
        <JoinRoom />
      </Route>
      <Route path="/room/:roomId">
        <HostGame />
      </Route>
      <Route path='/draw'>
        <div className="App">
          <div style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'center'
          }}>
            <Editor />
          </div>
        </div>
      </Route>
    </Switch>
  );
}

async function pollRequest(requestFn, pollInterval) {
  function refresh() {
    setTimeout(async () => {
      await requestFn()
      refresh()
    }, pollInterval)
  }
  await requestFn();
  refresh();
}


function HostGame() {
  const [room, setRoom] = useState(null)
  const history = useHistory();
  const { roomId } = useParams();
  const username = useStoreState(state => state.profile.username);
  


  // const _pollFunc = async () => {
  //   const { room } = await fetchApi(`/api/room/${roomId}`, {
  //     method: 'GET',
  //   });
  //   setRoom(room);
  // }

  const handleLeaveRoom = () => {
    socket.emit('room_disconnect', null, () => {
      socket.disconnect();
      return history.push('/');
    });
  }

  const handleReady = () => {
    socket.emit('room_event', { type: 'READY' }, ({ error, data }) => {
      setRoom(data.room);
    });
  }

  useEffect(() => {
    socket.connect();
    console.log("CONNECTING!!!!!!");
    socket.emit('room_connect', null, ({ error, data }) => {
      if (error) return history.push('/');
      setRoom(data.room);
    })
    socket.on('room_state', ({ error, data }) => {
      setRoom(data.room);
    })
  }, []);

  if (!room) {
    return (
      <div>
        Loading...
      </div>
    )
  }

  console.log(room, ':: room', username);

  const me = room.users.find((user) => user.username === username);

  return (
    <div>
      <div>
        <button onClick={handleLeaveRoom}>Leave Room</button>
        <button onClick={handleReady}>{ me.ready ? 'Ready' : 'Not Ready'}</button>
      </div>
      <div>
        Users:
        {room.users.map(({ username, ready }) => (
          <div key={username}>
            <div style={{ color: ready ? 'green': 'red'}}>{username}</div>
          </div>
        ))}
      </div>
      <div>
        <button disabled={room.users.every((user) => !user.ready)}>Start Game</button>
      </div>
    </div>
  );
}



export default App;
