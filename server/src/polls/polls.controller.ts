import { Controller, Post, Body } from '@nestjs/common';
import { CreatePollDto, JoinPollDto } from './dtos';
import { PollsService } from './polls.service';

@Controller({ path: 'polls' })
export class PollsController {
  // We can access Injected (Injectable) services in the controller by using the constructor
  constructor(private pollsService: PollsService) {}

  @Post()
  async create(@Body() createPollDto: CreatePollDto) {
    const result = await this.pollsService.createPoll(createPollDto);
    return result;
  }

  @Post('/join')
  async join(@Body() joinPollDto: JoinPollDto) {
    const result = await this.pollsService.joinPoll(joinPollDto);
    return result;
  }

  @Post('/rejoin')
  async rejoin() {
    const dummyData = {
      name: 'From Token',
      pollID: 'From Token',
      userID: 'Guess where this came from',
    };
    const result = await this.pollsService.rejoinPoll(dummyData);
    return result;
  }
}
