import { Injectable, Logger } from '@nestjs/common';
import { VirtualConsole, JSDOM } from 'jsdom';
import { HappyDOMContext } from '@happy-dom/server-rendering';
import { Script } from 'vm';
import { ConfigService } from '@nestjs/config';
import { ThemeConfig } from '@ribajs/ssr';
import { resolve, extname } from 'path';
import * as consolidate from 'consolidate';
import type { Request } from 'express';
import { promises as fs } from 'fs';
import type {
  PageComponentAfterBindEventData,
  SharedContext,
  RenderEngine,
} from '@ribajs/ssr';
import type { RenderResult } from './types';
import { EventDispatcher } from '@ribajs/events';

@Injectable()
export class SsrService {
  log = new Logger(this.constructor.name);
  theme: ThemeConfig;
  constructor(config: ConfigService) {
    this.theme = config.get<ThemeConfig>('theme');
  }

  isRenderEngineValid(engine: RenderEngine) {
    switch (engine) {
      case 'happy-dom':
        return true;
      case 'jsdom':
        return true;
      default:
        return false;
        break;
    }
  }

  async getSharedContext(req: Request) {
    const sharedContext: SharedContext = {
      events: EventDispatcher.getInstance('ssr') as any, // TODO
      ctx: {
        // See https://expressjs.com/de/api.html#req
        app: req.app,
        baseUrl: req.baseUrl,
        body: req.body,
        cookies: req.cookies,
        fresh: req.fresh,
        hostname: req.hostname,
        ip: req.ip,
        ips: req.ips,
        method: req.method,
        originalUrl: req.originalUrl,
        params: req.params,
        path: req.path,
        protocol: req.protocol,
        query: req.query,
        route: req.route,
        secure: req.secure,
        signedCookies: req.signedCookies,
        stale: req.stale,
        subdomains: req.subdomains,
        xhr: req.xhr,
      },
    };
    return sharedContext;
  }

  getTemplateEngine(templatePath: string) {
    const ext = extname(templatePath);
    const def = this.theme.viewEngine;
    const detected = ext?.substring(1) || def; // Removes the dot of the file extension
    if (detected !== def) {
      this.log.warn(
        `Detected template engine is not the default: "${detected}" (Default: "${def}")'`,
      );
    }

    try {
      require.resolve(detected);
    } catch (error) {
      console.error(
        `Template engine not installed, try to run "yarn add ${detected}"`,
      );
    }

    return detected;
  }

  /**
   *
   * @param layout Layout content string
   * @param rootTag The placeholder tag, will be replaces by the page component tag
   * @param pageTag The page compontent tag to replace the placeholder tag
   */
  async transformLayout(layout: string, rootTag: string, pageTag: string) {
    layout = layout.replace(new RegExp(rootTag, 'gi'), pageTag);
    return layout;
  }

  async readSsrScripts() {
    const assetsPath = this.theme.assetsDir;
    const vendorPath = resolve(assetsPath, 'ssr', 'vendors.bundle.js');
    const mainPath = resolve(assetsPath, 'ssr', 'main.bundle.js');
    console.debug('vendorPath', vendorPath);
    console.debug('mainPath', mainPath);
    const vendors = await fs.readFile(vendorPath, 'utf8');
    const main = await fs.readFile(mainPath, 'utf8');
    this.log.debug('Scripts readed!');

    return {
      vendors,
      main,
    };
  }

  /**
   * Render a template by any supported template engine (pug, twig, liquid, ..)
   * @param templatePath Ren
   * @param variables
   */
  async renderTemplate(templatePath: string, variables: any) {
    if (!extname(templatePath)) {
      templatePath += '.' + this.theme.viewEngine;
    }
    const viewsDir: string = this.theme.viewsDir;
    const tplEngine = this.getTemplateEngine(templatePath);
    templatePath = resolve(viewsDir, templatePath);
    this.log.debug(`Template engine: ${tplEngine}, path: ${templatePath}`);
    try {
      const result = await consolidate[tplEngine](
        resolve(viewsDir, templatePath),
        variables,
      );
      return result;
    } catch (error) {
      this.log.error('Error on render template');
      console.error(error);
      throw error;
    }
  }

  /**
   * Start ssr using jsdom
   * @see https://github.com/jsdom/jsdom
   *
   * @param layout
   * @param componentTagName
   * @param sharedContext Shared context injected to window object of the fake browser enviromnent
   */
  async renderWithJSDom(
    layout: string,
    componentTagName: string,
    sharedContext: SharedContext,
  ) {
    const virtualConsole = new VirtualConsole();
    virtualConsole.sendTo(console);

    const dom = new JSDOM(layout, {
      virtualConsole,
      runScripts: 'outside-only', // 'dangerously',
      includeNodeLocations: true,
    });

    const { vendors, main } = await this.readSsrScripts();
    const script = new Script(vendors + ' ' + main, {
      filename: 'vender-main.js',
    });

    // Set shared context here
    const vmContext = dom.getInternalVMContext();
    const window: Window = vmContext.window;
    window.ssr = sharedContext;
    this.log.debug('Execute scripts...');
    script.runInContext(vmContext);

    this.log.debug('Wait for custom element...');
    // await dom.window.customElements.whenDefined(componentTagName);

    this.log.debug('Scripts executed!');
    return new Promise<RenderResult>((resolve, reject) => {
      sharedContext.events.once(
        'PageComponent:afterBind',
        (afterBindData: PageComponentAfterBindEventData) => {
          const html = dom.serialize();

          const result: RenderResult = {
            ...afterBindData,
            html: html,
            css: [],
          };

          return resolve(result);
        },
      );
      dom.window.addEventListener('error', (event: Event) => {
        console.error(event);
        return reject(event);
      });
    });
  }

  /**
   * Start ssr using happy-dom
   * @see https://github.com/capricorn86/happy-dom
   *
   * @param layout
   * @param componentTagName
   * @param sharedContext Shared context injected to window object of the fake browser enviromnent
   */
  async renderWithHappyDom(
    layout: string,
    componentTagName: string,
    sharedContext: SharedContext,
  ) {
    const context = new HappyDOMContext();
    const window = (context as any).window; // TODO window is private, make pr for this

    // Set shared context here
    window.ssr = sharedContext;

    const { vendors, main } = await this.readSsrScripts();
    const vendorsScript = new Script(vendors, {
      filename: 'vendor.bundle.js',
    });
    const mainScript = new Script(main, {
      filename: 'main.bundle.js',
    });

    // Do not use await here because we want to run the next method after we get the promise result
    const ssrResultPromise = context.render({
      html: layout,
      scripts: [vendorsScript, mainScript],
      customElements: {
        openShadowRoots: false,
        extractCSS: false,
        scopeCSS: false,
        addCSSToHead: false,
      },
    });

    const result = await new Promise<RenderResult>((resolve, reject) => {
      sharedContext.events.once(
        'PageComponent:afterBind',
        async (afterBindData: PageComponentAfterBindEventData) => {
          const ssrResult = await ssrResultPromise;

          const result: RenderResult = {
            ...afterBindData,
            html: ssrResult.html,
            css: ssrResult.css,
          };

          return resolve(result);
        },
      );

      window.addEventListener('error', (event: Event) => {
        console.error(event);
        return reject(event);
      });
    });

    return result;
  }

  async renderComponent({
    template,
    rootTag = 'ssr-root-page',
    componentTagName,
    engine,
    sharedContext,
  }: {
    template?: string;
    rootTag?: string;
    componentTagName: string;
    engine?: RenderEngine;
    sharedContext: SharedContext;
  }): Promise<RenderResult> {
    if (!rootTag) {
      rootTag = this.theme.ssr.rootTag || 'ssr-root-page';
    }

    if (engine && !this.isRenderEngineValid(engine)) {
      this.log.warn(`Ignore unknown render engine "${engine}"`);
    }
    if (!engine) {
      engine = this.theme.ssr.engine || 'jsdom';
    }
    if (!template) {
      template = this.theme.ssr.template || 'page-component.pug';
    }
    this.log.debug(`rootTag: ${rootTag}`);
    this.log.debug(`engine: ${engine}`);
    this.log.debug(`template: ${template}`);
    let layout = await this.renderTemplate(template, sharedContext);
    // this.log.debug(`layout: ${layout}`);
    layout = await this.transformLayout(layout, rootTag, componentTagName);
    // this.log.debug(`layout (transformed): ${layout}`);
    const renderData =
      engine === 'jsdom'
        ? await this.renderWithJSDom(layout, componentTagName, sharedContext)
        : await this.renderWithHappyDom(
            layout,
            componentTagName,
            sharedContext,
          );
    return renderData;
  }
}