// Create id with nanoid npm package for polls
import { customAlphabet, nanoid } from "nanoid";

export const createPollID =  customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 4);
export const createUserID = () => nanoid();
export const createNominationID = () => nanoid(8);