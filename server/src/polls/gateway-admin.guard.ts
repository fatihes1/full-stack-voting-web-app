// This guard will not work with 'polls.gateway's handleConnection methods

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PollsService } from './polls.service';
import { JwtService } from '@nestjs/jwt';
import { AuthPayload, SocketWithAuth } from './types';
import { WsUnauthorizedException } from '../exceptions/ws-exceptions';

@Injectable()
export class GatewayAdminGuard implements CanActivate {
  private readonly logger = new Logger(GatewayAdminGuard.name);
  constructor(
    private readonly pollService: PollsService,
    private readonly jwtService: JwtService,
  ) {}
  // With pollService we'll able to  acutally get the actual poll admin id from db
  // and compere it to the user id from the JWT token

  // generally CanActivate returns a boolean or a Promise<boolean>
  // so we can control if the request is allowed to continue or not
  // in this case we are going to return true if the user is an admin
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // regular Socker from socket.io is probably suffeceint
    const socket: SocketWithAuth = context.switchToWs().getClient();

    // For testing support, fallback to token header
    const token = // client || postman testing query
      socket.handshake.auth.token || socket.handshake.headers['token'];

    if (!token) {
      this.logger.log(`#SOCKET SAY: No token provided`);
      throw new WsUnauthorizedException('No token provided');
    }

    try {
      // verify the token or throw an error
      const payload = this.jwtService.verify<AuthPayload & { sub: string }>(
        token,
      );

      this.logger.debug(
        `#SOCKET SAY: Validating admin using token payload`,
        payload,
      );

      const { sub, pollID } = payload;

      const poll = await this.pollService.getPoll(pollID);

      if (sub !== poll.adminID) {
        throw new WsUnauthorizedException('Admin privileges required');
      }
      // else
      return true;
    } catch {
      throw new WsUnauthorizedException('Admin privileges required');
    }
  }
}
