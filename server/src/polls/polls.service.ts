import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  AddParticipantFields,
  CreatePollFields,
  JoinPollFields,
  RejoinPollFields,
} from './types';
import { createPollID, createUserID } from '../ids';
import { PollsRepository } from './polls.repository';
import { Poll } from 'shared';

@Injectable() // -> This is a decorator that allows us to inject this service into other services and controllers or modules
export class PollsService {
  private readonly logger = new Logger(PollsService.name);

  // we defined the PollsRepository as a 'provider' in the 'PollsModule'
  // Now we want to use pollRepository in the PollsService, so we can 'inject' it into the 'constructor'
  constructor(
    private readonly pollsRepository: PollsRepository,
    private readonly jwtService: JwtService,
  ) {}

  async createPoll(fields: CreatePollFields) {
    const pollID = createPollID();
    const userID = createUserID();

    const createdPoll = await this.pollsRepository.createPoll({
      ...fields, // <-- Come from the rest api so it come with votesPerVoter and topic attrs.
      pollID,
      userID,
    });

    this.logger.debug(
      `Creating token string for user with ID: ${userID} for poll with ID: ${pollID}`,
    );

    const signedString = this.jwtService.sign(
      {
        pollID: createdPoll.id,
        name: fields.name,
      },
      {
        subject: userID,
      },
    );

    return {
      poll: createdPoll,
      accessToken: signedString,
    };
  }

  async joinPoll(fields: JoinPollFields) {
    const userID = createUserID();

    this.logger.debug(
      `Fetching poll with ID: ${fields.pollID} for user with ID: ${userID}`,
    );

    const joinedPoll = await this.pollsRepository.getPoll(fields.pollID);

    this.logger.debug(
      `Creating token string for user with ID: ${userID} / ${fields.name} for poll with ID: ${joinedPoll.id}`,
    );

    const signedString = this.jwtService.sign(
      {
        pollID: joinedPoll.id,
        name: fields.name,
      },
      {
        subject: userID,
      },
    );

    return {
      poll: joinedPoll,
      accessToken: signedString,
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

  async addParticipant(addParticipant: AddParticipantFields): Promise<Poll> {
    return this.pollsRepository.addParticipant(addParticipant);
  }

  async removeParticipant(
    pollID: string,
    userID: string,
  ): Promise<Poll | void> {
    const poll = await this.pollsRepository.getPoll(pollID);

    if (!poll.hasStarted) {
      const updatedPoll = await this.pollsRepository.removeParticipant(
        pollID,
        userID,
      );
      return updatedPoll;
    }
  }

  async getPoll(pollID: string): Promise<Poll> {
    return await this.pollsRepository.getPoll(pollID);
  }
}
