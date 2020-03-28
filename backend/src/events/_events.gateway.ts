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



@WebSocketGateway()
export class EventsGateway implements OnGatewayDisconnect, OnGatewayConnection, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  afterInit() {
    console.log('Calling once');

    registerInactivityChecker(this.server);
  }
  

  async handleDisconnect(client: Socket) {
    const session = client.handshake['session'];
    markRoomUserInactive(session.room_id, session.room_username);
  }

  async handleConnection(client: Socket, ...args: any[]) {
    console.log(client.handshake, ':: shakey');
    console.log(`Client connected: ${client.id}`);
   }


   response(obj = null) {
     return {
       status: 'OKAY',
       data: obj ? obj.toJSON(): null,
       error: null,
     };
   }

   clienterror(message = '') {
     return {
       status: 'ERROR',
       data: null,
       error: message
     }
   }


  @SubscribeMessage('events')
  handleEvent(@MessageBody() data: any, @ConnectedSocket() client: Socket): any {
    if (data.type === 'CREATE_GAME') {
      const room = createRoom({ id: client.id, username: data.payload.username });
      client.join(room['id']);
      console.log(client.rooms, ':: Rooms');
      return { error: null, data: room };
    } else if (data.type === 'JOIN_GAME') {
      try {
        const room = joinRoom(data.payload.roomId, { id: client.id, username: data.payload.username });
        client.to(room['id']).emit('users', { error: null, data: { users: room.users }})
        return { data: room };
      } catch (e) {
        return { error: e.message }
      }
    }
    return data;
  }

  @SubscribeMessage('room_connect')
  roomConnect(@MessageBody() data: any, @ConnectedSocket() client: Socket): any {
    const session = client.handshake['session'];

    if (!session.room_id) {
      client.emit('room_connect_error', { error: 'Invalid room id.'});
      return;
    }
    const room = getRoom(session.room_id);
    client.join(session.room_id);
    this.server.to(room.getId()).emit('room_state', { data: room.toJSON() });
    return;
  }

  @SubscribeMessage('room_disconnect')
  roomDisconnect(@MessageBody() data: any, @ConnectedSocket() client: Socket): any {
    const session = client.handshake['session'];
    if (!session.room_id) {
      throw new Error ('No room to leave');
    }

    const room = leaveRoom(session.room_id, session.room_username);
    client.to(session.room_id).emit('room_state', { data: room.toJSON() });

    session.room_id = null;
    session.room_role = null;
    session.room_username = null;
    return;
  }

  @SubscribeMessage('room_event')
  roomUser(@MessageBody() data: any, @ConnectedSocket() client: Socket): any {
    const session = client.handshake['session'];
    const room = getRoom(session.room_id);
    const roomUser = room.getUser(session.room_username);
    
    if (data.type === 'READY') {
      roomUser.toggleReady();
      this.server.to(room.getId()).emit('room_state', { data: room.toJSON()});
      return;
    } else if (data.type === 'START') {
      if (session.room_role !== 'HOST') {
        throw new Error('User is not host.');
      }
      room.startGame();
      this.server.to(room.getId()).emit('room_state', { data: room.toJSON()});
      return;
    }
  }

  @SubscribeMessage('identity')
  async identity(@MessageBody() data: number): Promise<number> {
    return data;
  }
}


// {
//   status: 'error',
//   message: ''
// }


// {
//   status: 'okay',
//   data: {
    
//   }
// }
