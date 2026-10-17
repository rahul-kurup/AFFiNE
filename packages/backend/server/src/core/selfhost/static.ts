import { join } from 'node:path';

import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { Application } from 'express';
import { static as serveStatic } from 'express';
import isMobile from 'is-mobile';

import { Config } from '../../base';
import { ProxyHeadersService } from '../proxy-headers';
import { SetupMiddleware } from './setup';

@Injectable()
export class StaticFilesResolver implements OnModuleInit {
  constructor(
    private readonly config: Config,
    private readonly adapterHost: HttpAdapterHost,
    private readonly check: SetupMiddleware,
    private readonly proxyHeaders: ProxyHeadersService
  ) {}

  onModuleInit() {
    // in command line mode
    if (!this.adapterHost.httpAdapter) {
      return;
    }

    const app = this.adapterHost.httpAdapter.getInstance<Application>();
    // for example, '/affine' in host [//host.com/affine]
    const basePath = this.config.server.path;
    const staticPath = join(env.projectRoot, 'static');

    // web => {
    //   affine: 'static/index.html',
    //   selfhost: 'static/selfhost.html'
    // }
    // admin => {
    //   affine: 'static/admin/index.html',
    //   selfhost: 'static/admin/selfhost.html'
    // }
    // mobile => {
    //   affine: 'static/mobile/index.html',
    //   selfhost: 'static/mobile/selfhost.html'
    // }
    // NOTE(@forehalo):
    //   the order following routes should be respected,
    //   otherwise the app won't work properly.

    // START REGION: /admin
    // do not allow '/index.html' url, redirect to '/'
    app.get(basePath + '/admin/index.html', (_req, res) => {
      return res.redirect(basePath + '/admin');
    });

    // serve all static files
    app.use(
      basePath + '/admin',
      serveStatic(join(staticPath, 'admin'), {
        redirect: false,
        index: false,
        fallthrough: true,
      })
    );

    // fallback all unknown routes
    app.get(
      [basePath + '/admin', basePath + '/admin/*path'],
      this.check.use,
      async (_req, res) => {
        const filePath = join(
          staticPath,
          'admin',
          env.selfhosted ? 'selfhost.html' : 'index.html'
        );
        try {
          const fs = await import('node:fs/promises');
          let content = await fs.readFile(filePath, 'utf8');
          const headers = await this.proxyHeaders.get();
          const script =
            '<script>window.__AFFINE_PROXY_HEADERS__ = ' +
            JSON.stringify(headers) +
            ';</script>';
          if (content.includes('</head>')) {
            content = content.replace('</head>', script + '</head>');
          } else {
            content = script + content;
          }
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.send(content);
        } catch {
          res.sendFile(filePath);
        }
      }
    );
    // END REGION

    // START REGION: /mobile
    // serve all static files
    app.use(
      basePath,
      serveStatic(join(staticPath, 'mobile'), {
        redirect: false,
        index: false,
        fallthrough: true,
      })
    );
    // END REGION

    // START REGION: /
    // do not allow '/index.html' url, redirect to '/'
    app.get(basePath + '/index.html', (_req, res) => {
      return res.redirect(basePath);
    });

    // serve all static files
    app.use(
      basePath,
      serveStatic(staticPath, {
        redirect: false,
        index: false,
        fallthrough: true,
        immutable: true,
        dotfiles: 'ignore',
      })
    );

    // fallback all unknown routes
    app.get([basePath, basePath + '/*path'], this.check.use, (req, res) => {
      const mobile =
        env.namespaces.canary &&
        isMobile({
          ua: req.headers['user-agent'] ?? undefined,
        });

      return res.sendFile(
        join(
          staticPath,
          mobile ? 'mobile' : '',
          env.selfhosted ? 'selfhost.html' : 'index.html'
        )
      );
    });
    // END REGION
  }
}
