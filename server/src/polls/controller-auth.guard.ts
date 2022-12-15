import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ControllerAuthGuard implements CanActivate {
  private readonly logger = new Logger(ControllerAuthGuard.name);
  constructor(private readonly jwtService: JwtService) {}

  // This is the method that will be called by the framework to determine if the request is allowed to proceed
  // Mean if we return a true or a promise that return true or a promise that resolve to true
  // Then the request will be allowed to proceed by this controller or this guard otherwise it will be rejected (block)
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    this.logger.debug(`Checking for auth token on request body`, request.body);

    const { accessToken } = request.body;

    try {
      const payload = this.jwtService.verify(accessToken);
      // append user and poll to socket
      request.userID = payload.sub;
      request.pollID = payload.pollID;
      request.name = payload.name;
      return true;
    } catch {
      throw new ForbiddenException('Invalid access/authorization token');
    }
  }
}
