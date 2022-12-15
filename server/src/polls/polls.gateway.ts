import { Logger } from '@nestjs/common';
import { OnGatewayInit, WebSocketGateway } from '@nestjs/websockets';
import { PollsService } from './polls.service';

@WebSocketGateway({ namespace: 'polls' }) // --> This decorates provides the namespace
export class PollsGateway implements OnGatewayInit {
  private readonly logger = new Logger(PollsGateway.name);
  constructor(private readonly pollsService: PollsService) {} // --> Inject service

  // Gateway initialized (provided in module and instantiated)
  afterInit(): void {
    this.logger.log(`#SOCKET SAY: Websocket gateway initialized`);
  }
}
