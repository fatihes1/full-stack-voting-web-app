import { Injectable, Logger } from '@nestjs/common';
import { CreatePollFields, JoinPollFields, RejoinPollFields } from './types';
import { createPollID, createUserID } from '../ids';
import { PollsRepository } from './polls.repository';

@Injectable() // -> This is a decorator that allows us to inject this service into other services and controllers or modules
export class PollsService {
  private readonly logger = new Logger(PollsService.name);

  // we defined the PollsRepository as a 'provider' in the 'PollsModule'
  // Now we want to use pollRepository in the PollsService, so we can 'inject' it into the 'constructor'
  constructor(private readonly pollsRepository: PollsRepository) {}

  async createPoll(fields: CreatePollFields) {
    const pollID = createPollID();
    const userID = createUserID();

    const createdPoll = await this.pollsRepository.createPoll({
      ...fields, // <-- Come from the rest api so it come with votesPerVoter and topic attrs.
      pollID,
      userID,
    });

    // TODO: create an accessToken based off of the pollID and userID

    return {
      poll: createdPoll,
      // accessToken,
    };
  }

  async joinPoll(fields: JoinPollFields) {
    const userID = createUserID();

    this.logger.debug(
      `Fetching poll with ID: ${fields.pollID} for user with ID: ${userID}`,
    );

    const joinedPoll = await this.pollsRepository.getPoll(fields.pollID);

    // TODO: Create access token!

    return {
      poll: joinedPoll,
      // accessToken: signedString (JWT),
    };
  }

  async rejoinPoll(fields: RejoinPollFields) {
    this.logger.debug(
      `Rejoining poll with ID: ${fields.pollID} for user with ID: ${fields.userID} with name: ${fields.name}`,
    );
    const joinedPol = await this.pollsRepository.addParticipant(fields);
    return joinedPol;
    // return await this.pollsRepository.addParticipant(fields); // <-- This is the same as the above
  }
}
