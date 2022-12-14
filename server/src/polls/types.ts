// Define some parameters for incoming fields to our service methods.

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