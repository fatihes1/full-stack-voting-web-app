import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { CreatePollDto, JoinPollDto } from './dtos';
import { PollsService } from './polls.service';
import { ControllerAuthGuard } from './controller-auth.guard';
import { RequestWithAuth } from './types';

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

  // Except JWT token
  // In guard we get necessary data from request body mean from JWT token
  // If request pass guard then we can get data from request body and use it in controller
  @UseGuards(ControllerAuthGuard)
  @Post('/rejoin')
  async rejoin(@Req() request: RequestWithAuth) {
    // After guard we have 'request' variable that container our data from JWT token
    const { userID, pollID, name } = request;
    const result = await this.pollsService.rejoinPoll({ userID, pollID, name });
    return result;
  }
}
