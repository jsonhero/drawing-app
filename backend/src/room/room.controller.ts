import { Controller, Get, Post, Session, Param, Body } from '@nestjs/common';
import { createRoom, roomExists, joinRoom, getRoom, markRoomUserActive } from '../game'; 

@Controller('room')
export class RoomController {

  @Get('profile')
  getProfile(@Session() session) {
    const roomId = session.room_id;
    if (!roomId) return { roomId: null };
    
    const userStillActive = markRoomUserActive(roomId, session.room_username);

    if (userStillActive) {
      return {
        roomId,
        username: session.room_username,
      }
    }

    // Reset s}ession if room does not exist;
    session.room_id = null;
    session.room_role = null;
    session.room_username = null;
    return {
      roomId: null,
      username: null,
    }
  }

  @Get(':id/healthcheck')
  healthcheckRoom(@Session() session, @Param('id') id: string) {
    return { isRoomActive: roomExists(id) };
  }

  @Post(':id/join')
  joinRoom(@Session() session, @Param('id') id: string, @Body() data) {
    const room = joinRoom(id, { id: '', username: data.username });

    session.room_id = room.id;
    session.room_role = 'PARTCIPANT';
    session.room_username = data.username;

    return { room: room.toJSON() };
  }

  @Get(':id')
  getRoom(@Session() session, @Param('id') id: string) {
    console.log('GETTING FOR:: ', session.room_username);
    if (session.room_id !== id) {
      throw new Error('User does not exist in room.');
    }

    const room = getRoom(id);
    return { room: room.toJSON() };
  }

  @Post()
  createRoom(@Session() session, @Body() data) {
    const room = createRoom({ username: data.username, id: ''});

    session.room_id = room.id;
    session.room_role = 'HOST';
    session.room_username = data.username;
    
    console.log(session.room_id, ':: Room ID');

    return { room: room.toJSON() };
  }
}