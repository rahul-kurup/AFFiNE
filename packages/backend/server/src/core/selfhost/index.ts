import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { ServerConfigModule } from '../config';
import { UserModule } from '../user';
import { CustomSetupController } from './controller';
import { SelfhostGuard } from './guard';
import { SetupMiddleware } from './setup';
import { StaticFilesResolver } from './static';
import { ProxyHeadersModule } from '../proxy-headers';

@Module({
  imports: [AuthModule, UserModule, ServerConfigModule, ProxyHeadersModule],
  providers: [SetupMiddleware, StaticFilesResolver, SelfhostGuard],
  controllers: [CustomSetupController],
})
export class SelfhostModule {}
