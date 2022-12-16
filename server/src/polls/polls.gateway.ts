import {
  BadRequestException,
  Logger,
  UseFilters,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  OnGatewayInit,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { PollsService } from './polls.service';
import { Namespace } from 'socket.io';
import { SocketWithAuth } from './types';

import { WsCatchAllFilter } from '../exceptions/ws-catch-all-filter';

@UsePipes(new ValidationPipe())
@UseFilters(new WsCatchAllFilter())
@WebSocketGateway({ namespace: 'polls' }) // --> This decorates provides the namespace
export class PollsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(PollsGateway.name);
  constructor(private readonly pollsService: PollsService) {} // --> Inject service

  @WebSocketServer() io: Namespace; // --> This is the socket-io name-space
  // Namespace used to emit events to all clients in the namespace!

  // Gateway initialized (provided in module and instantiated)
  afterInit(): void {
    this.logger.log(`#SOCKET SAY: Websocket gateway initialized`);
  }

  // These client will actually be a socket-io client
  handleConnection(client: SocketWithAuth) {
    const sockets = this.io.sockets; // --> Get access all sockets in the namespace

    this.logger.debug(
      `---> Socket connected with userId: ${client.userID}, pollId: ${client.pollID}, and name : ${client.name}`,
    );

    this.logger.log(`#SOCKET SAY: Client connected: ${client.id}`);
    this.logger.log(`#SOCKET SAY: Total clients: ${sockets.size}`);

    this.io.emit('hello', `from ${client.id}`); // --> Emit event to all clients in the namespace
  }

  handleDisconnect(client: SocketWithAuth) {
    const sockets = this.io.sockets; // --> Get access all sockets in the namespace

    this.logger.debug(
      `---> Socket disconnected with userId: ${client.userID}, pollId: ${client.pollID}, and name : ${client.name}`,
    );

    this.logger.log(`#SOCKET SAY: Client disconnected: ${client.id}`);
    this.logger.debug(`#SOCKET SAY: Total clients: ${sockets.size}`);
  }

  @SubscribeMessage('test')
  async handleTest(client: any, payload: any) {
    this.logger.log(
      `#SOCKET SAY: Test message received: ${payload} from ${client.id}`,
    );
    if (payload === 'error') {
      this.logger.log(`#SOCKET SAY: Test message error`);
      throw new BadRequestException({ test: 'test' });
    }
  }
}
