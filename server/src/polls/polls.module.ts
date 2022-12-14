import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { jwtModule, redisModule } from '../modules.config';
import { PollsRepository } from './polls.repository';
import { PollsGateway } from './polls.gateway';

@Module({
  imports: [ConfigModule, redisModule, jwtModule], // Allow us to get access environment variables inside the module
  controllers: [PollsController],
  providers: [PollsService, PollsRepository, PollsGateway], // -> This is a decorator that allows us to inject this service into other services and controllers or modules
  // PollsService was @Injectable() --> So we can inject it into other services and controllers or modules.
})
export class PollsModule {}
