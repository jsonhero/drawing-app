import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import crypto = require('crypto');

function generateRoomCode() {
  return crypto.randomBytes(3).toString('hex');
}


enum RoomRole {
  Host = 'HOST',
  Partcipant = 'PARTICPANT'
}

enum RoomStatus {
  LOBBY = 'LOBBY',
  IN_GAME = 'IN_GAME'
}


class User {
  id: string;
  username: string;
  isInactive: boolean = false;
  inactiveTimestamp: number = null;
  role: RoomRole;
  isReady: boolean = false;
  socketId: string;

  constructor(username: string, role: RoomRole, socketId: string) {
    this.id = uuidv4();
    this.role = role;
    this.username = username;
    this.socketId = socketId;
  }
 
  setInactive() {
    this.isInactive = true;
    this.inactiveTimestamp = Date.now();
  }

  setActive() {
    this.isInactive = false;
    this.inactiveTimestamp = null;
  }

  toggleReady() {
    if (this.isReady) {
      this.isReady = false;
    } else {
      this.isReady = true;
    }
  }

  setReady(ready: boolean) {
    this.isReady = ready;
  }
  
  toJSON() {
    return {
      ready: this.isReady,
      username: this.username,
      role: this.role.toString(),
    };
  }

}

class Room {
  id: string;
  users: User[] = [];
  status: RoomStatus = RoomStatus.LOBBY

  constructor(roomId: string) {
    this.id = roomId;
  }

  getId() {
    return this.id;
  }

  addUser(user: User) {
    this.users.push(user);
  }

  removeUser(socketId: string) {
    this.users = this.users.filter((user: User) => user.socketId !== socketId);
  }

  removeInactiveUsers(expireTime: number = 15000) {
    this.users = this.users.filter((user: User) => {
      const now = Date.now();
      if (!user.isInactive) return true;

      const shouldRemoveUser = now - user.inactiveTimestamp >= expireTime;
      if (shouldRemoveUser) {
        console.log(`Removing inactive user '${user.username}' from Room:${this.id}`);
      }
      return !shouldRemoveUser;
    });
    if (this.users.length === 0) {
      rooms.delete(this.id);
    }
  }

  getUser(socketId: string) {
    return this.users.find((user: User) => user.socketId === socketId);
  }

  startGame() {
    this.status = RoomStatus.IN_GAME;
  }

  toJSON() {
    return {
      id: this.id,
      status: this.status.toString(),
      users: this.users.map((user: User) => user.toJSON()),
    };
  }


}

export const rooms = new Map<string, Room>();

export function registerInactivityChecker(server: Server) {
  setInterval(() => {
    for (let roomKey of rooms.keys()) {
      const room: Room = rooms.get(roomKey);
      const totalRoomUsers: number = room.users.length;
      room.removeInactiveUsers();
      if (totalRoomUsers !== room.users.length) {
        server.to(room.id).emit('room_state', { error: null, data: { room: room.toJSON() }});
      }
    }
  }, 2500);
}

export function markRoomUserInactive(roomId, username) {
  if (!rooms.has(roomId)) {
    return;
  }

  const room = rooms.get(roomId);
  const user = room.getUser(username);
  user.setInactive();

  // setTimeout(() => {
  //   const cRoom = rooms.get(roomId);
  //   const cUser = cRoom.users.find(({ username: name }) => name === username);
  //   if (cUser.isInactive) {
  //     console.log("Timeout met...removing user", username, roomId);
  //     leaveRoom(roomId, username);
  //     return callback(true);
  //   }
  //   callback(false);
  // }, 15000)
}


export function markRoomUserActive(roomId, username) {
  if (!rooms.has(roomId)) {
    return false
  }

  const room = rooms.get(roomId);
  const user = room.getUser(username);

  if (!user) {
    return false;
  }
  console.log(room, '::; curr room');

  user.setActive();

  return true;
}


export function createRoom(username, socketId) {
  const newRoomCode = generateRoomCode();
  if (rooms.has(newRoomCode)) {
    throw new Error('Room already exists.');
  }

  const newRoom = new Room(newRoomCode);
  newRoom.addUser(new User(username, RoomRole.Host, socketId))

  rooms.set(newRoomCode, newRoom);
  return newRoomCode;
}

export function joinRoom(roomId, username, socketId) {
  if (!rooms.has(roomId)) {
    throw new Error('Room does not exist.');
  }

  const room: Room = rooms.get(roomId);

  for (let i = 0; i < room.users.length; i++) {
    const roomUser: User = room.users[i];
    if (roomUser.username === username) {
      throw new Error('User already exists with username');
    }
  }

  const user = new User(username, RoomRole.Partcipant, socketId)
  room.addUser(user);
  return user;
}

export function roomExists(roomId) {
  return rooms.has(roomId);
}

export function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    throw new Error('Room does not exist.');
  }
  return rooms.get(roomId);
}

export function leaveRoom(roomId, socketId) {
  if (!rooms.has(roomId)) {
    throw new Error('Room does not exist.');
  }
  const room = rooms.get(roomId);
  room.removeUser(socketId);
  if (!room.users.length) {
    rooms.delete(roomId);
  }
  return room;
}