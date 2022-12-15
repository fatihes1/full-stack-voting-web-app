// Define some parameters for incoming fields to our service methods.
import { Request } from '@nestjs/common';

// SERVICE TYPES
export type CreatePollFields = {
  topic: string;
  votesPerVoter: number;
  name: string;
};

export type JoinPollFields = {
  pollID: string;
  name: string;
};

export type RejoinPollFields = {
  pollID: string;
  userID: string;
  name: string;
};

// REPOSITORY TYPES
export type CreatePollData = {
  pollID: string;
  topic: string;
  votesPerVoter: number;
  userID: string;
};

export type AddParticipantData = {
  pollID: string;
  userID: string;
  name: string;
};

// GUARD TYPES
type AuthPayload = {
  userID: string;
  pollID: string;
  name: string;
};
export type RequestWithAuth = Request & AuthPayload; // -> Merge the AuthPayload type with the Request type
