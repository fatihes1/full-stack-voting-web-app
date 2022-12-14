import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import {PollsController} from "./polls.controller";

@Module({
    imports: [ConfigModule], // Allow us to get access environment variables inside the module
    controllers: [PollsController],
    providers: [],
})
export class PollsModule {}