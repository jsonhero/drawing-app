import { Server } from 'socket.io';
import crypto = require('crypto');

function generateRoomCode() {
  return crypto.randomBytes(3).toString('hex');
}


enum RoomRole {
  Host = 'HOST',
  Partcipant = 'PARTICPANT'
}


class User {
  username: string;
  isInactive: boolean = false;
  inactiveTimestamp: number = null;
  role: RoomRole;
  isReady: boolean = false;

  constructor(username: string, role: RoomRole) {
    this.role = role;
    this.username = username;
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

  constructor(roomId: string) {
    this.id = roomId;
  }

  getId() {
    return this.id;
  }

  addUser(user: User) {
    this.users.push(user);
  }

  removeUser(username: string) {
    this.users = this.users.filter((user: User) => user.username !== username);
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

  getUser(username: string) {
    return this.users.find((user: User) => user.username === username);
  }

  toJSON() {
    return {
      id: this.id,
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


export function createRoom({ id = '', username }) {
  const newRoomCode = generateRoomCode();
  if (rooms.has(newRoomCode)) {
    throw new Error('Room already exists.');
  }

  const newRoom = new Room(newRoomCode);
  newRoom.addUser(new User(username, RoomRole.Host))

  rooms.set(newRoomCode, newRoom);
  return newRoom;
}

export function joinRoom(roomId, { id, username }) {
  console.log(roomId, username);
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

  room.addUser(new User(username, RoomRole.Partcipant));
  return room;
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

export function leaveRoom(roomId, username) {
  console.log(rooms, roomId, ':: roomie')
  if (!rooms.has(roomId)) {
    throw new Error('Room does not exist.');
  }
  console.log('leavin dat shit');
  const room = rooms.get(roomId);
  room.removeUser(username);
  if (!room.users.length) {
    rooms.delete(roomId);
  }
  return room;
}