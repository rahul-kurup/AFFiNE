import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import type { Response } from 'express';

import { Public } from '../auth';
import { ProxyHeadersService } from './service';
import type { ProxyHeaders } from './types';

@Public()
@Controller('/api/proxy-headers')
export class ProxyHeadersController {
  constructor(private readonly service: ProxyHeadersService) {}

  @Get()
  async get(): Promise<ProxyHeaders> {
    return this.service.get();
  }

  @Post()
  async set(
    @Body() body: { headers?: ProxyHeaders },
    @Res() res: Response
  ): Promise<void> {
    await this.service.set(body.headers ?? []);
    res.status(204).end();
  }
}
