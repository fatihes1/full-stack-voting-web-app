import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { IORedisKey } from '../redis.module';
import { AddNominationData, AddParticipantData, CreatePollData } from './types';
import { Poll } from 'shared'; // <-- This is the shared poll type

@Injectable() // --> This Injectable which allows us to provide this repository as a service or provider (Etc: PollsModule)
export class PollsRepository {
  // to use time-to-live (ttl) from configuration
  private readonly ttl: string; // End up storing how long the poll is going to be available for in the database.
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
      nominations: {}, // Initialize with no nominations
      adminID: userID,
      hasStarted: false,
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
          ['expire', key, this.ttl], // NOT SURE, normally this.ttl is enough
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
      throw new InternalServerErrorException(
        `Failed to get poll with ID: ${pollID}`,
      );
    }
  }

  async addParticipant({
    pollID,
    userID,
    name,
  }: AddParticipantData): Promise<Poll> {
    this.logger.log(
      `Attempting to add a participant with userID/name: ${userID}/${name} to pollID: ${pollID}`,
    );

    const key = `polls:${pollID}`;
    const participantPath = `.participants.${userID}`;

    try {
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        participantPath,
        JSON.stringify(name),
      );

      return this.getPoll(pollID);
    } catch (e) {
      this.logger.error(
        `Failed to add a participant with userID/name: ${userID}/${name} to pollID: ${pollID}`,
      );
      throw new InternalServerErrorException(
        `Failed to add participant with ID: ${userID}`,
      );
    }
  }

  async removeParticipant(pollID: string, userID: string): Promise<Poll> {
    this.logger.log(`removing userID: ${userID} from poll: ${pollID}`);

    const key = `polls:${pollID}`; // Main key to access redis json object
    const participantPath = `.participants.${userID}`;

    try {
      await this.redisClient.send_command('JSON.DEL', key, participantPath);

      return this.getPoll(pollID);
    } catch (e) {
      this.logger.error(
        `Failed to remove userID: ${userID} from poll: ${pollID}`,
        e,
      );
      throw new InternalServerErrorException('Failed to remove participant');
    }
  }

  async addNomination({
    pollID,
    nominationID,
    nomination,
  }: AddNominationData): Promise<Poll> {
    this.logger.log(
      `Attempting to add a nomination with nominationID / nomination: ${nominationID} / ${nomination.text} to pollID: ${pollID}`,
    );

    const key = `polls:${pollID}`;
    const nominationPath = `.nominations.${nominationID}`;

    try {
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        nominationPath,
        JSON.stringify(nomination),
      );

      return this.getPoll(pollID);
    } catch (err) {
      this.logger.error(
        `Failed to add a nomination with nominationID / nomination: ${nominationID} / ${nomination.text} to pollID: ${pollID}`,
      );
      throw new InternalServerErrorException(
        'Failed to add nomination to poll',
      );
    }
  }

  async removeNomination(pollID: string, nominationID: string): Promise<Poll> {
    this.logger.log(
      `removing nominationID: ${nominationID} from poll: ${pollID}`,
    );

    const key = `polls:${pollID}`; // Main key to access redis json object

    const nominationPath = `.nominations.${nominationID}`; // Path to the nomination object

    try {
      await this.redisClient.send_command('JSON.DEL', key, nominationPath);

      return this.getPoll(pollID);
    } catch (err) {
      this.logger.error(
        `Failed to remove nominationID: ${nominationID} from poll: ${pollID}`,
        err,
      );
      throw new InternalServerErrorException('Failed to remove nomination');
    }
  }
}
