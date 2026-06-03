import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ProxyController } from './proxy.controller';
import { ServiceProxyService } from './service-proxy.service';

@Module({
  imports: [AuthModule],
  controllers: [ProxyController],
  providers: [ServiceProxyService],
})
export class ProxyModule {}
