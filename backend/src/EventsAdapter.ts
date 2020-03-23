import { IoAdapter } from '@nestjs/platform-socket.io';
// import {  } from '@nestjs/platform-express';
import { Server } from 'socket.io';
import cookieSession = require('cookie-session');
import * as sharedsession from 'express-socket.io-session'
// import { ConfigService } from '../config/config.service'

/**
 * Enable session tokens for web sockets by using express-socket.io-session
 */
export class EventsAdapter extends IoAdapter {
  private app : any;

  constructor(app : any) {
      super(app)
      this.app = app
  }

  createIOServer(port: number, options?: any): any {
    console.log("Running:: ??!?")
    const server : Server = super.createIOServer(port, options);
    // const configService: ConfigService = this.app.get(ConfigService)
    
    const session = cookieSession({
      secret: 'b0853a553c34c111f279',
    });
    
    this.app.use(session)
    server.use(sharedsession(session, {
      autoSave:true
    }))
    return server;
  }
}