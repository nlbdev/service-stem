#!/usr/bin/env node
/*jshint esversion: 8 */
require("dotenv").config();

const Hapi = require('@hapi/hapi');
const Joi = require("@hapi/joi");
const Pack = require("./package.json");
const X2JS = require("x2js");
const Boom = require("@hapi/boom");

const { PORT, HOST } = require("./configurations/appConfig");
const { DOMParser } = require("xmldom");
const { GenerateMath } = require("./conversions/text");
const { GenerateSvg } = require("./conversions/svg");

(() => {
    'use strict';


    const init = async () => {
        const server = Hapi.server({
            port: PORT,
            host: HOST,
            routes: {
                validate: {
                    failAction: async (request, h, err) => {
                      if (process.env.NODE_ENV === 'production') {
                        // In prod, log a limited error message and throw the default Bad Request error.
                        console.error('ValidationError:', err.message);
                        throw Boom.badRequest(`Invalid request payload input`);
                      } else {
                        // During development, log and respond with the full error.
                        console.error(err);
                        throw err;
                      }
                    }
                }
            }
        });
        server.validator(Joi);

        // Log every request
        server.events.on('response', (request) => {
            console.info(`${new Date().toISOString()}\tReceived request from ${request.info.remoteAddress}: ${request.method.toUpperCase()} ${request.url} and responded with ${request.response.statusCode}`);
        });

        server.route({
            method: 'GET',
            path: '/health',
            handler: async (request, h) => {
                return { name: Pack.name, version: Pack.version, timestamp: new Date().toISOString() };
            }
        });
        console.info(`${new Date().toISOString()}\t${Pack.name} health service is running on ${server.info.uri}/health`);

        server.route({
            method: 'GET',
            path: '/',
            handler: async (request, h) => {
                return { success: false, name: Pack.name, version: Pack.version, message: "Use POST instead of GET" };
            }
        });
        
        server.route({
            method: 'POST',
            path: '/',
            options: {
                validate: {
                    payload: {
                        content: Joi.string().required(),
                        contentType: Joi.string().allow(['math', 'chemistry', 'physics', 'other']).default('math').required()
                    }
                }
            },
            handler: async (request, h) => {
                var payload = request.payload;
                if (payload.contentType == "math") {
                    var p = [
                        GenerateMath(payload.content).then(res => res).catch(err => err)
                    ];
                    var doc = new DOMParser().parseFromString(payload.content);
                    if (!doc.documentElement.getAttribute("altimg")) p.push(GenerateSvg(payload.content).then(svg => svg).catch(err => err));

                    return Promise.all(p)
                        .then(values => {
                            // Generate return object
                            var obj = {
                                success: values[0].success,
                                generated: {
                                    text: values[0].words,
                                    ascii: values[0].ascii,
                                    alix: values[0].alix
                                },
                                attributes: {
                                    language: values[0].language,
                                    display: values[0].display,
                                    image: values[0].imagepath
                                }
                            };

                            if (values.length === 3) {
                                // Post-processing SVG
                                var x2js = new X2JS(), xmlDoc = x2js.xml2js(values[2]), svgDoc = xmlDoc.div;

                                svgDoc.svg._class = "visual-math";
                                svgDoc.svg["_aria-hidden"] = true;

                                var domDoc = x2js.js2dom(svgDoc);

                                var titleEl = domDoc.createElement("title"), titleText = domDoc.createTextNode(values[0].ascii);
                                titleEl.appendChild(titleText);
                                domDoc.firstChild.insertBefore(titleEl);
                                var tmpDoc = x2js.dom2js(domDoc);
                                obj.generated.svg = x2js.js2xml(tmpDoc);
                            }

                            return obj;
                        })
                        .catch(err => {
                            return { success: false, error: err };
                        })
                        .then((result) => {
                            // Return data
                            return result;
                        });
                }
                else if (payload.contentType == "chemistry" || payload.contentType == "physics" || payload.contentType == "other") {
                    // Return data
                    return { success: false, error: "non-mathematical formula" };
                }

            }
        });

        await server.start();
        console.info(`${new Date().toISOString()}\t${Pack.name} running on ${server.info.uri}/`);
    };

    process.on('unhandledRejection', (err) => {
        console.info(err);
        process.exit(1);
    });

    init();
})();