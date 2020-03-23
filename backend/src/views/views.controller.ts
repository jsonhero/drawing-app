import { Controller, Get, Session } from '@nestjs/common';
 
@Controller('views')
export class ViewsController {
  @Get()
  getViews(@Session() session: { views?: number }) {
    session.views = (session.views || 0) + 1;
    console.log(session, ':: Session');
    return session.views;
  }
}