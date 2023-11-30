#!/usr/bin/env node
/*jshint esversion: 8 */
require("dotenv").config();
const Airbrake = require('@airbrake/node');

new Airbrake.Notifier({
    projectId: 257349,
    projectKey: '9331de259df466d79c1d0e786be78051',
    environment: process.env.NODE_ENV || 'development'
});

const Hapi = require('@hapi/hapi');
const Joi = require("@hapi/joi");
const Pack = require("./package.json");
const X2JS = require("x2js");
const Boom = require("@hapi/boom");
const ejs = require('ejs');
const Resolve = require("path").resolve;
const { XMLParser, XMLBuilder } = require("fast-xml-parser");

const MathML2Latex = require('mathml-to-latex');
const MathML2Ascii = require('mathml-to-asciimath');

const { PORT, HOST } = require("./configurations/appConfig");
const { GenerateMath } = require("./conversions/text");
const { GenerateSvg } = require("./conversions/svg");

(() => {
    'use strict';

    /**
     * Transforms MathML to AsciiMath
     * @param {{mathml: string;success: boolean;language: string;words: any[];ascii: string;display: string;imagepath: string;alix: number;}} mathObj Math Object
     * @returns {String} AsciiMath
     */
    const GenerateAsciiMath = (mathml, ascii) => {
        try {
            return MathML2Ascii(mathml);
        }
        catch(err) {
            return ascii;
        }
    }

    /**
     * Transforms MathML to Accessible HTML with ALIX
     * @param {{language: String;disp: String;txt: String;altimg: String;alttext: String;svg: String;alix: Number;alixThresholdNoImage: Number;}} opts options
     * @returns {Promise<String>} Accessible HTML with ALIX
     */
    const GenerateHtmlFromTemplate = async (opts) => {
        var filename = Resolve('./templates/accessibleHtmlWithAlix.ejs');

        // Validate opts
        if (opts === undefined) {
            opts = {};
        }
        if (opts.language === undefined) {
            opts.language = "no";
        }
        if (opts.disp === undefined) {
            opts.disp = "block";
        }
        if (opts.txt === undefined) {
            opts.txt = "";
        }
        if (opts.altimg === undefined) {
            opts.altimg = "";
        }
        if (opts.alttext === undefined) {
            opts.alttext = "";
        }
        if (opts.svg === undefined) {
            opts.svg = "";
        }
        if (opts.alix === undefined) {
            opts.alix = 0;
        }
        if (opts.alixThresholdNoImage === undefined) {
            opts.alixThresholdNoImage = 25;
        }

        // Render template
        return ejs.renderFile(filename, opts).then(res => {
            return res;
        });
    }

    /**
     * Translates the text array from English to a specified language
     * @param {Array<String>} inputText The English text as array
     * @param {String} lang The language to translate to
     * @returns {String} The translated text
     */
    const TranslateText = (inputText, lang) => {
        var text = inputText.join(" ");
        if (lang !== null) {
            try {
                var newText = text;
                const postProcess = require(`./translations/${lang}.json`);

                postProcess.forEach(p => {
                    var regexString = `\\b(${p.search})\\b`;
                    var re = new RegExp(regexString, "g");
                    newText = newText.replace(re, p.replace);
                });

                // Fixes punctuation errors
                const punctuations = require(`./translations/all.json`);
                punctuations.forEach(s => {
                    newText = newText.split(s.search).join(s.replace);
                });
                return newText;
            }
            catch (ex) {
                // File not found, just return the text
            }
        }
        return text;
    };

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
            console.info(`${new Date().toISOString()}\tA request from ${request.info.remoteAddress} (${request.method.toUpperCase()} ${request.url}) ended with ${request.response.statusCode}`);
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
                try {
                    const { payload } = request;
                    const { content, contentType } = payload;
                    if (contentType == "math") {
                        const parser = new XMLParser();
                        const builder = new XMLBuilder();

                        var XMLObject = parser.parse(content, {
                            ignoreAttributes: false,
                            ignoreNameSpace: false,
                        });
                        var XMLContent = builder.build(XMLObject);
                        var mathObj = GenerateMath(content);
                        var x2js = new X2JS();
                        var xmlDom = x2js.xml2dom(content);

                        // Extract language from m:math attribute
                        const languageStr = xmlDom.documentElement.getAttribute("xml:lang") || xmlDom.documentElement.getAttribute("lang") || "en";
                        // Extract display from m:math attribute
                        const displayStr = xmlDom.documentElement.getAttribute("display") || "block";
                        // Extract altimg from m:math attribute
                        const altimgStr = xmlDom.documentElement.getAttribute("altimg") || "";
                        // Extract alttext from m:math attribute
                        const alttextStr = xmlDom.documentElement.getAttribute("alttext") || "";

                        const latexStr = MathML2Latex.convert(XMLContent.replace(/<m:/g, "<").replace(/<\/m:/g, "</"));
                        const asciiStr = GenerateAsciiMath(XMLContent, alttextStr);
                        const translatedStr = TranslateText(mathObj.words, languageStr);

                        var returnObj = {
                            "success": mathObj.success,
                            "input": {
                                "mathml": content,
                            },
                            "output": {
                                "text": {
                                    "words": mathObj.words,
                                    "translated": translatedStr,
                                    "latex": latexStr,
                                    "ascii": asciiStr,
                                    "html": await GenerateHtmlFromTemplate({
                                        language: languageStr,
                                        disp: displayStr,
                                        txt: translatedStr,
                                        altimg: altimgStr,
                                        alttext: asciiStr,
                                        svg: null,
                                        alix: mathObj.alix,
                                        alixThresholdNoImage: 25
                                    }),
                                },
                                "image": {
                                    "path": altimgStr
                                },
                                "attributes": {
                                    "language": languageStr,
                                    "alix": mathObj.alix,
                                }
                            },
                        };
                        
                        if (altimgStr === "") {
                            // Post-processing SVG
                            return GenerateSvg(XMLContent).then(async svgObj => {
                                var x2js = new X2JS(), xmlDoc = x2js.xml2js(svgObj), svgDoc = xmlDoc.div;

                                svgDoc.svg._class = "visual-math";
                                svgDoc.svg["_aria-hidden"] = true;
    
                                var domDoc = x2js.js2dom(svgDoc);
    
                                var titleEl = domDoc.createElement("title"), titleText = domDoc.createTextNode(asciiStr);
                                titleEl.appendChild(titleText);
                                domDoc.firstChild.insertBefore(titleEl);
                                var tmpDoc = x2js.dom2js(domDoc);
                                var svgXml = x2js.js2xml(tmpDoc);
                                return {
                                    "success": mathObj.success,
                                    "input": {
                                        "mathml": content,
                                    },
                                    "output": {
                                        "text": {
                                            "words": mathObj.words,
                                            "translated": translatedStr,
                                            "latex": latexStr,
                                            "ascii": asciiStr,
                                            "html": await GenerateHtmlFromTemplate({ 
                                                language: languageStr,
                                                disp: displayStr,
                                                txt: translatedStr,
                                                altimg: altimgStr,
                                                alttext: asciiStr,
                                                svg: svgXml,
                                                alix: mathObj.alix,
                                                alixThresholdNoImage: 25
                                            }),
                                        },
                                        "image": {
                                            "svg": svgXml,
                                        },
                                        "attributes": {
                                            "language": languageStr,
                                            "alix": mathObj.alix,
                                        }
                                    },
                                };
                            });
                        }
                        return returnObj;
                    }
                    else if (contentType == "chemistry" || contentType == "physics" || contentType == "other") {
                        // Return data
                        return { success: false, error: "non-mathematical formula" };
                    }
                    else {
                        // Return data
                        return { success: false, error: "unknown content type" };
                    }
                } catch(appicationError) {
                    console.error(appicationError);
                    return { success: false, error: appicationError.message };
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