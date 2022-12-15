import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { IORedisKey } from '../redis.module';
import { AddParticipantData, CreatePollData } from './types';
import { Poll } from 'shared'; // <-- This is the shared poll type

@Injectable() // --> This Injectable which allows us to provide this repository as a service or provider (Etc: PollsModule)
export class PollsRepository {
  // to use time-to-live (ttl) from configuration
  private readonly ttl: number; // End up storing how long the poll is going to be available for in the database.
  private readonly logger = new Logger(PollsRepository.name);

  constructor(
    configService: ConfigService,
    @Inject(IORedisKey) private readonly redisClient: Redis,
  ) {
    this.ttl = configService.get('POLL_DURATION');
  }

  async createPoll({
    votesPerVoter, // <-- Come from the initial post to the polls controller endpoint - so this are posted via rest api
    topic, // <-- Come from the initial post to the polls controller endpoint - so this are posted via rest api
    pollID, // <-- Created in the createPoll method in the polls service
    userID, // <-- Created in the createPoll method in the polls service
  }: CreatePollData): Promise<Poll> {
    // this 'createPoll' method returns a Promise Poll type
    const initialPoll = {
      id: pollID,
      topic,
      votesPerVoter,
      participants: {}, // Initialize with the no participants
      adminID: userID,
    };

    this.logger.log(
      `Creating new poll: ${JSON.stringify(initialPoll, null, 2)} with TTL: ${
        this.ttl
      }`,
    );

    const key = `polls:${pollID}`; // store this entry in redis

    try {
      await this.redisClient // access redis IO client
        .multi([
          ['send_command', 'JSON.SET', key, '.', JSON.stringify(initialPoll)],
          ['expire', key, String(this.ttl)], // NOT SURE, normally this.ttl is enough
        ])
        .exec();
      return initialPoll;
    } catch (e) {
      this.logger.error(
        `Failed to add poll ${JSON.stringify(initialPoll)}\n${e}`,
      );
      throw new InternalServerErrorException();
    }
  }

  async getPoll(pollID: string): Promise<Poll> {
    this.logger.log(`Attempting to get poll with: ${pollID}`);

    const key = `polls:${pollID}`;

    try {
      const currentPoll = await this.redisClient.send_command(
        // CLI type of version of getting a JSON object from redis
        'JSON.GET',
        key,
        '.', // <-- This is the path to the poll object
      );

      this.logger.verbose(currentPoll);

      // if the poll started voting, then the poll is no longer available
      // if (currentPoll?.hasStarted) {
      //   throw new BadRequestException('The poll has already started');
      // }

      return JSON.parse(currentPoll);
    } catch (err) {
      this.logger.error(`Failed to get poll with ID: ${pollID}`);
      throw err;
    }
  }

  async addParticipant({
    pollID,
    userID,
    name,
  }: AddParticipantData): Promise<Poll> {
    this.logger.log(
      `Attempting to add participant id/name: ${userID}/${name} to poll: ${pollID}`,
    );
    const key = `polls:${pollID}`;

    const participantPath = `.participants.${userID}`; // <-- This is the path to the participants object

    try {
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        participantPath,
        JSON.stringify(name),
      );

      const pollJSON = await this.redisClient.send_command(
        'JSON.GET',
        key,
        '.',
      );

      const poll = JSON.parse(pollJSON) as Poll; // <-- This is the poll object

      this.logger.debug(
        `Current participants for poll: ${pollID}: `,
        poll.participants,
      );

      return poll;
    } catch (e) {
      this.logger.error(
        `Failed to add participant id/name: ${userID}/${name} to poll: ${pollID}`,
      );
      throw e;
    }
  }
}
