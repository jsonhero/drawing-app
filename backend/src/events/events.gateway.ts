import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
  ConnectedSocket,
  OnGatewayDisconnect,
  OnGatewayConnection,
  OnGatewayInit,
  WsException,
} from '@nestjs/websockets';
import { UsePipes } from '@nestjs/common';


// import { from, Observable } from 'rxjs';
// import { map } from 'rxjs/operators';
import { Server, Socket } from 'socket.io';

import { createRoom, joinRoom, getRoom, leaveRoom, markRoomUserInactive, registerInactivityChecker } from '../game'; 


const clientSocketMap = {};

interface UserProfileBody {
  username: string;
}

interface JoinRoomBody {
  gameId: string;
  username: string;
}

interface createGameBody {
  username: string;
}


@WebSocketGateway()
export class EventsGateway implements OnGatewayDisconnect, OnGatewayConnection, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  afterInit() {
    console.log('Calling once');
  }

  response(obj = {}) {
    return {
      status: 'OKAY',
      ...obj
    };
  }

  error(message = '', type = 'error') {
    return {
      status: 'ERROR',
      error: {
        type,
        message
      }
    }
  }
  
  async handleDisconnect(client: Socket) {

  }

  async handleConnection(client: Socket, ...args: any[]) {
  }

  @SubscribeMessage('create_game')
  createGame(@MessageBody() data: createGameBody, @ConnectedSocket() client: Socket) {
    const { username } = data;

    try {
      const gameId = createRoom(username, client.id);
      client.join(gameId);
      return this.response({ gameId, username });
    } catch(e) {
      return this.error(e.message);
    }
  }


  @SubscribeMessage('join_game')
  joinGame(@MessageBody() data: JoinRoomBody, @ConnectedSocket() client: Socket) {
    const { gameId, username } = data;

    try {
      const user = joinRoom(gameId, username, client.id);
      client.join(gameId);
      this.server.to(gameId).emit('user_joined', this.response({ user: user.toJSON() }))
      return this.response({ gameId, username });
    } catch(e) {
      return this.error(e.message);
    }
  }

  @SubscribeMessage('leave_game')
  leaveGame(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const { gameId } = data;

    try {
      const game = getRoom(gameId);
      const user = game.getUser(client.id);
      leaveRoom(game.id, client.id)
      this.server.to(gameId).emit('user_quit', this.response({ userId: user.id }))
      return this.response();
    } catch(e) {
      return this.error(e.message);
    }
  }

  @SubscribeMessage('game_full_state')
  getFullGameState(@MessageBody() data: any) {
    const { gameId } = data;
    try {
      return this.response({ game: getRoom(gameId).toJSON() });
    } catch (e) {
      return this.error(e.message);
    }
  }
  
  @SubscribeMessage('user_toggle_ready')
  userReady(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const { gameId, ready } = data;
    try {
      const game = getRoom(gameId);
      const user = game.getUser(client.id);
      user.setReady(ready);
      this.server.to(gameId).emit('user_toggle_ready', this.response({ userId: user.id, ready: ready }));
    } catch (e) {
      return this.error(e.message);
    }
  }


}
