import React, {useEffect, useState, useMemo} from 'react';
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
import _ from 'lodash';

import fetchApi from './fetchApi';
import Editor from './Editor';
import store from './store';

import './App.css';
const socket = io('http://localhost:3000');


function useGameClient() {

  const emit = ({ event, eventData = {}, onSuccess = _.noop, onError = _.noop }) => {
    socket.emit(event, eventData, (data) => {
      if (data.status === 'ERROR') {
        return onError(data);
      }
      return onSuccess(data);
    })
  }

  const subscribe = (event, callback) => socket.on(eent, callback); 

  
  return [push, subscribe];
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
  const [push] = useGameClient();
  const history = useHistory();
  const username = useStoreState(state => state.profile.username);
  const setUsername = useStoreActions(actions => actions.profile.setUsername);

  const handleHost = () => {

    if (!username.length) {
      return alert('Username must be set.');
    }

    push({
      event: 'create_game',
      onSuccess: ({ gameId }) => {
        history.push(`/room/${gameId}`);
      }
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

function JoinGame() {
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
  return (
    <Switch>
      <Route exact path="/">
        <Home />
      </Route>
      <Route path="/join">
        <JoinGame />
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
  

  const roomUpdateHandler = ({ data }) => {
    setRoom(data);
  }

  const handleLeaveRoom = () => {
    socket.emit('leave_game');
    history.push('/');
  }

  const handleReady = () => {
    socket.emit('user_toggle_ready', { gameId:  'i'});
  }

  const handleStart = () => {
    socket.emit('room_event', { type: 'START' });
  }

  const allUsersReady = useMemo(() => {
    if (!room) return true;
    for (let i = 0; i < room.users.length; i++) {
      const roomUser = room.users[i];
      if (!roomUser.ready) return true;
    }
    return false;
  }, [room]);

  useEffect(() => {
    socket.connect();
    socket.emit('room_connect');
    socket.on('room_state', roomUpdateHandler);

    socket.on('client_error', ({ message }) => {
      alert(message);
    });
    socket.on('room_connect_error', ({ error }) => {
      alert(error);
      history.push('/');
    });

  }, []);

  if (!room) {
    return (
      <div>
        Loading...
      </div>
    )
  }

  console.log(room, ':: room');

  const me = room.users.find((user) => user.username === username);

  if (room.status === 'LOBBY') {
    return (
      <div>
        <div>
          <button onClick={handleLeaveRoom}>Leave Room</button>
          <button onClick={handleReady}>{ me.ready ? 'Not Ready' : 'Ready'}</button>
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
          {
            me.role === 'HOST' ? <button disabled={allUsersReady} onClick={handleStart}>Start Game</button> : null
          }
        </div>
      </div>
    );
  }

  return (
    <div>
      Werein te game.
    </div>
  );
}



export default App;
