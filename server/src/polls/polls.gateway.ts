import { Logger } from '@nestjs/common';
import {
  OnGatewayInit,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { PollsService } from './polls.service';
import { Namespace, Socket } from 'socket.io';

@WebSocketGateway({ namespace: 'polls' }) // --> This decorates provides the namespace
export class PollsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(PollsGateway.name);
  constructor(private readonly pollsService: PollsService) {} // --> Inject service

  @WebSocketServer() io: Namespace; // --> This is the socket-io namespace
  // Namespace used to emit events to all clients in the namespace!

  // Gateway initialized (provided in module and instantiated)
  afterInit(): void {
    this.logger.log(`#SOCKET SAY: Websocket gateway initialized`);
  }

  // These client will actually be a socket-io client
  handleConnection(client: Socket) {
    const sockets = this.io.sockets; // --> Get access all sockets in the namespace

    this.logger.log(`#SOCKET SAY: Client connected: ${client.id}`);
    this.logger.log(`#SOCKET SAY: Total clients: ${sockets.size}`);

    this.io.emit('hello', `from ${client.id}`); // --> Emit event to all clients in the namespace
  }

  handleDisconnect(client: Socket) {
    const sockets = this.io.sockets; // --> Get access all sockets in the namespace

    this.logger.log(`#SOCKET SAY: Client disconnected: ${client.id}`);
    this.logger.debug(`#SOCKET SAY: Total clients: ${sockets.size}`);
  }
}
