import { Module } from '@nestjs/common';

import { ModelsModule } from '../../models';
import { ProxyHeadersController } from './controller';
import { ProxyHeadersService } from './service';

@Module({
  imports: [ModelsModule],
  providers: [ProxyHeadersService],
  controllers: [ProxyHeadersController],
  exports: [ProxyHeadersService],
})
export class ProxyHeadersModule {}

export { ProxyHeadersService } from './service';
export type { ProxyHeader, ProxyHeaders } from './types';
