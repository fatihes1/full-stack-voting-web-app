import {
  Logger,
  UseFilters,
  UseGuards,
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
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { PollsService } from './polls.service';
import { Namespace } from 'socket.io';
import { SocketWithAuth } from './types';

import { WsCatchAllFilter } from '../exceptions/ws-catch-all-filter';
import { GatewayAdminGuard } from './gateway-admin.guard';
import { NominationDto } from './dtos';

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
  async handleConnection(client: SocketWithAuth) {
    const sockets = this.io.sockets; // --> Get access all sockets in the namespace

    this.logger.error(
      `---> Socket connected with userId: ${client.userID}, pollId: ${client.pollID}, and name : ${client.name}`,
    );

    this.logger.log(`#SOCKET SAY: Client connected: ${client.id}`);
    this.logger.log(`#SOCKET SAY: Total clients: ${sockets.size}`);

    const roomName = client.pollID;
    await client.join(roomName);

    const connectedClients =
      (await this.io.adapter.rooms?.get(roomName)?.size) ?? 0;

    this.logger.debug(
      `userID: ${client.userID} joined room with name: ${roomName}`,
    );
    this.logger.debug(
      `Total clients connected to room '${roomName}': ${connectedClients}`,
    );

    const updatedPoll = await this.pollsService.addParticipant({
      pollID: client.pollID,
      userID: client.userID,
      name: client.name,
    });

    this.io.to(roomName).emit('poll_updated', updatedPoll); // --> Emit event to all clients in the namespace
  }

  async handleDisconnect(client: SocketWithAuth) {
    const sockets = this.io.sockets;

    const { pollID, userID } = client;
    const updatedPoll = await this.pollsService.removeParticipant(
      pollID,
      userID,
    );

    const roomName = client.pollID;
    const clientCount = this.io.adapter.rooms?.get(roomName)?.size ?? 0;

    this.logger.log(`Disconnected socket id: ${client.id}`);
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);
    this.logger.debug(
      `Total clients connected to room '${roomName}': ${clientCount}`,
    );

    // updatedPoll could be undefined if the the poll already started
    // in this case, the socket is disconnect, but no the poll state
    if (updatedPoll) {
      this.io.to(pollID).emit('poll_updated', updatedPoll);
    }
  }

  @UseGuards(GatewayAdminGuard) // --> Use the guard
  @SubscribeMessage('remove_participant') // --> Subscribe to the event
  async removeParticipant(
    @MessageBody('id') id: string,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    this.logger.debug(
      `Attempting to remove participant with id: ${id} from poll with id: ${client.pollID}`,
    );

    const updatedPoll = await this.pollsService.removeParticipant(
      client.pollID,
      id,
    );

    if (updatedPoll) {
      this.io.to(client.pollID).emit('poll_updated', updatedPoll); // --> Emit event to all clients in the namespace
    }
    // updatedPoll && this.io.to(client.pollID).emit('poll_updated', updatedPoll);
  }

  @SubscribeMessage('nominate')
  async nominate(
    @MessageBody() nomination: NominationDto,
    @ConnectedSocket() client: SocketWithAuth,
  ): Promise<void> {
    this.logger.debug(
      `Attempting to add nominate for user ${client.userID} to poll ${client.pollID} and content is ${nomination.text}`,
    );

    const updatedPoll = await this.pollsService.addNomination({
      pollID: client.pollID,
      userID: client.userID,
      text: nomination.text,
    });

    this.io.to(client.pollID).emit('poll_updated', updatedPoll); // --> Emit event to all clients in the namespace
  }

  // Only admin can remove a nomination
  @UseGuards(GatewayAdminGuard) // --> Use the guard
  @SubscribeMessage('remove_nomination')
  async removeNomination(
    @MessageBody('id') nominationID: string,
    @ConnectedSocket() client: SocketWithAuth,
  ): Promise<void> {
    this.logger.debug(
      `Attempting to remove nomination with id ${nominationID} from poll ${client.pollID}`,
    );

    const updatedPoll = await this.pollsService.removeNomination(
      client.pollID,
      nominationID,
    );

    this.io.to(client.pollID).emit('poll_updated', updatedPoll);
  }
}
