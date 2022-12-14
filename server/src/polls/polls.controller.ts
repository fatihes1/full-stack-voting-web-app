import {Controller, Logger, Post, Body} from "@nestjs/common";
import {CreatePollDto, JoinPollDto} from "./dtos";

@Controller({path: 'polls'})
export class PollsController {
    @Post()
    async create(@Body() createPollDto: CreatePollDto) {
        Logger.log('--> Create a poll');
        return createPollDto;
    }

    @Post('/join')
    async join(@Body() joinPollDto: JoinPollDto) {
        Logger.log('--> Join a poll');
        return joinPollDto;
    }

    @Post('/rejoin')
    async rejoin() {
        Logger.log('--> Rejoin a poll');
    }

}