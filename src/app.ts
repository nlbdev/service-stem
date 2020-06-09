/*jshint esversion: 8 */
import * as cheerio from "cheerio";
import * as X2JS from "x2js";
import * as Hapi from "@hapi/hapi";
import * as Joi from "@hapi/joi";
import * as Airbrake from "@airbrake/node"
import * as uuid from "uuid";
import { TextClass } from "./conversions/text";
import { SvgClass } from "./conversions/svg";

function postprocessSVG(content: string, title: string): string {
  // Post-processing SVG
  const x2js:X2JS = new X2JS();
  const xmlDoc:any = x2js.xml2js(content);
  const svgDoc:any = xmlDoc.div;

  svgDoc.svg._class = "visual-math";
  svgDoc.svg["_aria-hidden"] = true;
  let domDoc: Document = new Document();

  try {
    domDoc = x2js.js2dom(svgDoc);
  }
  catch (ex) {
    return "";
  }

  const titleEl:HTMLTitleElement = domDoc.createElement("title");
  const titleText:Text = domDoc.createTextNode(title);
  titleEl.appendChild(titleText);
  domDoc.insertBefore(titleEl, domDoc.firstChild);
  const tmpDoc = x2js.dom2js(domDoc);
  return x2js.js2xml(tmpDoc);
}

(() => {
  "use strict";
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
    catch(ex) {
      //
    }
  }

  async function HandleRequest(request: Hapi.Request, h: Hapi.ResponseToolkit):Promise<any> {
    const ident = request.headers["NLB-UUID"] || uuid.v1();
    console.info(` | ${new Date().toISOString()}\t| ${ident}\t| ${Pack.name}\t\t\t| Received HTTP ${request.method.toUpperCase()} with the payload: ${JSON.stringify(request.payload)}`);
    const payload: any = request.payload;

    const t = new TextClass();
    const s = new SvgClass();
    return Promise.all([
      t.GenerateMath(payload.content).then(res => res).catch(err => err),
      s.GenerateSvg(payload.content).then(svg => svg).catch(err => err)
    ])
      .then(values => {
        // Generate return object
        const obj = {
          success: values[0].success,
          generated: {
            text: values[0],
            svg: postprocessSVG(values[1], values[0].ascii),
            ascii: values[0].ascii
          },
          attributes: {
            language: values[0].language,
            display: values[0].display,
            image: values[0].imagepath
          }
        };
        console.info(` | ${new Date().toISOString()}\t| ${ident}\t| ${Pack.name}\t| Generated text: ${values[0]}`);
        return obj;
      })
      .then((result) => {
        // Return data
        return { success: true, data: result };
      })
      .catch(err => {
        return { success: false, error: err };
      });
  }

  init();
})();