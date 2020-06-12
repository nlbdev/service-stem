/*jshint esversion: 8 */
import * as cheerio from "cheerio";
import * as Hapi from "@hapi/hapi";
import * as Joi from "@hapi/joi";
import * as Airbrake from "@airbrake/node"
import * as uuid from "uuid";
import * as ejs from "ejs";
import fetch from "node-fetch";
import { TextClass } from "./conversions/text";
import { SvgClass } from "./conversions/svg";

(() => {
  "use strict";

  async function GenerateAccessibleHtml(lang: string, display: string, text: string, image: string, svg: string, ascii: string): Promise<string> {
    const filename = `${__dirname}\\templates\\accessibleHtml.ejs`;
    const options = { async: true };
    const data = { language: lang, disp: display, txt: text, altimg: image, alttext: ascii, svg };

    return ejs.renderFile(filename, data, options).then((res: string) => res);
  }

  function PostprocessSVG(content: string, title: string): string {
    const $ = cheerio.load(content, {
      xmlMode: true
    });

    if ($("div.visual-math")[0].firstChild.tagName === "svg") {
      $("div.visual-math")[0].firstChild.attribs.class = "visual-math";
      $("div.visual-math")[0].firstChild.attribs["aria-hidden"] = "true";

      $("div.visual-math > svg").append(`<title>${title}</title`);
    }
    return $.html();
  }

  const Pack = { name: "service-stem", version: "2.0.0" };
  const identifier: string = uuid.v4();

  if (process.env.AIRBRAKE_PROJECT_ID) {
    const airbrake = new Airbrake.Notifier({
      projectId: parseInt(process.env.AIRBRAKE_PROJECT_ID, 10),
      projectKey: process.env.AIRBRAKE_PROJECT_KEY || "",
      environment: process.env.NODE_ENV || "development"
    });
  }

  process.on('SIGINT', () => {
    console.info(` | ${new Date().toISOString()}\t| ${identifier}\t| ${Pack.name}\t| Server stopped`);
    process.exit(1);
  });

  process.on('unhandledRejection', (err: Error) => {
    console.error(err);
    process.exit(1);
  });

  const init = async () => {
    const _server = Hapi.server({
      port: process.env.PORT || 443,
      host: process.env.HOST || "0.0.0.0"
    });

    // Healthcheck
    _server.route({
      method: 'GET',
      path: '/health',
      handler: async (request: Request, h: Event) => {
        return { name: Pack.name, version: Pack.version, instance: identifier, timestamp: new Date().toISOString() };
      }
    });
    // Routes
    _server.route({
      method: 'POST',
      path: '/',
      options: {
        cors: true,
        handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => HandleRequest(request, h),
        validate: {
          payload: {
            "contentType": Joi.allow(["math", "chemistry", "physics"]).default("math").required().description("The type of content"),
            "content": Joi.string().required().description("The content")
          }
        }
      }
    });
    _server.route({
      method: 'PUT',
      path: '/',
      options: {
        cors: true,
        handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => HandleDocumentRequest(request, h),
        validate: {
          payload: {
            maxBytes: 209715200,
            output: 'file',
            parse: true
          }
        }
      }
    });

    // Starting service
    await _server.start();
    console.info(` | ${new Date().toISOString()}\t| ${identifier}\t| ${Pack.name}\t\t\t| Server started, listening to ${_server.info.uri}/`);
  }

  async function HandleDocumentRequest(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const ident = request.headers["NLB-UUID"] || uuid.v1();
    console.info(` | ${new Date().toISOString()}\t| ${ident}\t| ${Pack.name}\t\t\t| Received HTTP ${request.method.toUpperCase()} with a file payload`);
    const payload: any = request.payload;
    try {
      const $ = cheerio.load(payload);

      $("math").each((index, element) => {
        //
        console.info(element);
      });
    }
    catch (ex) {
      //
    }
  }

  async function HandleRequest(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any> {
    const ident = request.headers["NLB-UUID"] || uuid.v1();
    console.info(` | ${new Date().toISOString()}\t| ${ident}\t| ${Pack.name}\t\t\t| Received HTTP ${request.method.toUpperCase()} with the payload: ${JSON.stringify(request.payload)}`);
    const payload: any = request.payload;

    const t = new TextClass();
    const s = new SvgClass();
    return await Promise.all([
      t.GenerateMath(payload.content).then(res => res).catch(err => err),
      s.GenerateSvg(payload.content).then(svg => svg).catch(err => err)
    ])
      .then(async (values: [{ success: boolean; language: string; words: string[]; ascii: string; display: string; imagepath: string; }, string]) => {
        const words = values[0].words;
        console.info(` | ${new Date().toISOString()}\t| ${ident}\t| ${Pack.name}\t\t\t| Generated text: '${words.join(" ")}'`);
        // Send generated text to translate service
        const opts = {
          method: "POST",
          headers: {
            "nlb-uuid": ident
          },
          timeout: 10000,
          body: JSON.stringify({ words })
        };
        const response = await fetch(`${process.env.NLB_SERVICE_TRANSLATE}/${values[0].language}`, opts);
        const res = await response.text();
        console.info(` | ${new Date().toISOString()}\t| ${ident}\t| ${Pack.name}\t\t\t| Translated text: '${res}'`);
        const processedSvg = PostprocessSVG(values[1], values[0].ascii);
        const accessibleHtml = await GenerateAccessibleHtml(values[0].language, values[0].display, res, values[0].imagepath, processedSvg, values[0].ascii);
        return {
          success: values[0].success,
          mathml: payload.content,
          generated: {
            text: res,
            html: accessibleHtml,
            ascii: values[0].ascii
          },
          uuid: ident
        };
      })
      .catch((err: Error) => {
        console.error(err);
        return { success: false, error: err.message, uuid: ident };
      });
  }

  init();
})();