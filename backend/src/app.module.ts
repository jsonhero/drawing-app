import { Module } from '@nestjs/common';
import {
  CookieSessionModule,
} from 'nestjs-cookie-session';

import { AppController } from './app.controller';
import { ViewsModule } from './views/views.module';

import { EventsModule } from './events/events.module';
// import { RoomModule } from './room/room.module';



@Module({
  imports: [
    // TypeOrmModule.forRoot(),
    // NoteModule,
    // CookieSessionModule.forRoot({
    //   session: { secret: 'b0853a553c34c111f279' },
    // }),
    EventsModule,
    ViewsModule,
    // RoomModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {
  // constructor(private readonly connection: Connection) { }
}
