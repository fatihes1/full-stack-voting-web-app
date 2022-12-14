import { Injectable } from "@nestjs/common";
import {CreatePollFields, JoinPollFields, RejoinPollFields} from "./types";
import {createPollID, createUserID} from "../ids";

@Injectable() // -> This is a decorator that allows us to inject this service into other services and controllers or modules
export class PollsService {
    async createPoll(fields: CreatePollFields) {
        const pollID = createPollID();
        const userID = createUserID();

        return {
            ...fields,
            userID,
            pollID,
        }
    }

    async joinPoll(fields: JoinPollFields) {
        const userID = createUserID();

        return {
            ...fields,
            userID,
        }
    }

    async rejoinPoll(fields: RejoinPollFields) {
        return fields;
    }
}