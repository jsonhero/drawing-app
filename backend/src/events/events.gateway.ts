import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
  ConnectedSocket,
  OnGatewayDisconnect,
  OnGatewayConnection,
  OnGatewayInit
} from '@nestjs/websockets';

// import { from, Observable } from 'rxjs';
// import { map } from 'rxjs/operators';
import { Server, Socket } from 'socket.io';

import { createRoom, joinRoom, getRoom, leaveRoom, markRoomUserInactive, registerInactivityChecker } from '../game'; 

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
    console.log(`Client connected: ${client.id}`);
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
    console.log(session.room_id, ':: rooom id');
    if (!session.room_id) {
      return { error: 'No room id.', data: null };
    }
    const room = getRoom(session.room_id);
    client.join(session.room_id);
    client.to(room.getId()).emit('room_state', { error: null, data: { room: room.toJSON() }});
    console.log(room.toJSON(), '::: ROOOM')
    return { error: null, data: { room: room.toJSON() }};
  }

  @SubscribeMessage('room_disconnect')
  roomDisconnect(@MessageBody() data: any, @ConnectedSocket() client: Socket): any {
    const session = client.handshake['session'];
    if (!session.room_id) {
      return { error: 'No room to leave', data: null };
    }

    const room = leaveRoom(session.room_id, session.room_username);
    client.to(session.room_id).emit('room_state', { error: null, data: { room: room.toJSON() }});

    session.room_id = null;
    session.room_role = null;
    session.room_username = null;

    return { error: null, data: null };
  }

  @SubscribeMessage('room_event')
  roomUser(@MessageBody() data: any, @ConnectedSocket() client: Socket): any {
    const session = client.handshake['session'];
    const room = getRoom(session.room_id);
    const roomUser = room.getUser(session.room_username);
    
    if (data.type === 'READY') {
      roomUser.toggleReady();
      client.to(room.getId()).emit('room_state', { error: null, data: { room: room.toJSON() }});
      console.log(room.toJSON());
      return { error: null, data: { room: room.toJSON() }}
    }
  }

  @SubscribeMessage('identity')
  async identity(@MessageBody() data: number): Promise<number> {
    return data;
  }
}