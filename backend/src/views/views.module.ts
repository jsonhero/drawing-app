import { Module } from '@nestjs/common';
import { ViewsController } from './views.controller';

@Module({
  imports: [],
  controllers: [ViewsController],
  providers: [],
})
export class ViewsModule {}
