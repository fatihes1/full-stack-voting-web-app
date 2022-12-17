// Define some parameters for incoming fields to our service methods.
import { Request } from 'express';
import { Socket } from 'socket.io';
import { Nomination } from 'shared';

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

export type AddParticipantFields = {
  pollID: string;
  userID: string;
  name: string;
};

export type AddNominationFields = {
  pollID: string;
  userID: string;
  text: string;
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

// Nominations type

export type AddNominationData = {
  pollID: string;
  nominationID: string;
  nomination: Nomination;
};

// GUARD TYPES
// exported for the gateway-admin.guard.ts file
export type AuthPayload = {
  userID: string;
  pollID: string;
  name: string;
};
export type RequestWithAuth = Request & AuthPayload; // -> Merge the AuthPayload type with the Request type
export type SocketWithAuth = Socket & AuthPayload; // -> Merge the AuthPayload type with the Socket type
