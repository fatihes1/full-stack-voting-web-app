import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { redisModule } from '../modules.config';

@Module({
  imports: [ConfigModule, redisModule], // Allow us to get access environment variables inside the module
  controllers: [PollsController],
  providers: [PollsService], // -> This is a decorator that allows us to inject this service into other services and controllers or modules
  // PollsService was @Injectable() --> So we can inject it into other services and controllers or modules.
})
export class PollsModule {}
