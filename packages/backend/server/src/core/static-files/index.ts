import { Module } from '@nestjs/common';

import { StaticFilesResolver } from './static';
import { ProxyHeadersModule } from '../proxy-headers';

@Module({
  imports: [ProxyHeadersModule],
  providers: [StaticFilesResolver],
})
export class StaticFileModule {}
