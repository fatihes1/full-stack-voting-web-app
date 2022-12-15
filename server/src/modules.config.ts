import { Logger } from '@nestjs/common'; // will log that our redis has been connected
import { ConfigModule, ConfigService } from '@nestjs/config'; // will allow us to get access to environment variables (.env)
import { RedisModule } from './redis.module'; // will allow us to get access to our redis module (we created)
import { JwtModule } from '@nestjs/jwt'; // will allow us to get access to our jwt module (we created)

export const redisModule = RedisModule.registerAsync({
  imports: [ConfigModule],
  // This is a factory function that will return a promise that resolves to an object with the connection options for redis
  // Known pattern for these useFactory type "providers"
  useFactory: async (configService: ConfigService) => {
    const logger = new Logger('RedisModule');
    return {
      connectionOptions: {
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
      },
      onClientReady: (client) => {
        logger.log('--> Redis client is ready to use');

        client.on('error', (err) => {
          logger.error('--> Redis Client error: ', err);
        });

        client.on('connect', () => {
          logger.log(
            `--> Connected to redis on ${configService.get(
              'REDIS_HOST',
            )}:${configService.get('REDIS_PORT')}`,
          );
        });
      },
    };
  },
  inject: [ConfigService],
});

export const jwtModule = JwtModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get<string>('JWT_SECRET'),
    signOptions: {
      expiresIn: parseInt(configService.get<string>('POLL_DURATION')),
    },
  }),
  inject: [ConfigService],
});
