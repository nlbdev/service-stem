#!/usr/bin/env node
/*jshint esversion: 8 */
require("dotenv").config();

const Hapi = require('@hapi/hapi');
const Joi = require("@hapi/joi");
const Pack = require("./package.json");
const X2JS = require("x2js");
const Boom = require("@hapi/boom");
const cheerio = require("cheerio");
const ejs = require('ejs');
const Resolve = require("path").resolve;

const MathML2Latex = require('mathml-to-latex');
const MathML2Ascii = require('mathml-to-asciimath');

const { PORT, HOST } = require("./configurations/appConfig");
const { DOMParser } = require("xmldom");
const { GenerateMath } = require("./conversions/text");
const { GenerateSvg } = require("./conversions/svg");

(() => {
    'use strict';

    /**
     * Transforms MathML so that parser can handle it
     * @param {String} payload Unprocessed MathML
     * @returns {String} Processed MathML
     */
    const PreProcessMathML = (payload) => {
        console.log(payload);
        const $ = cheerio.load(payload, {
            xmlMode: true,
            decodeEntities: false
        });

        // Removes attributes from m:math
        $.root().children().first().removeAttr('xmlns:m');
        $.root().children().first().removeAttr('display');
        $.root().children().first().removeAttr('altimg');
        $.root().children().first().removeAttr('alttext');

        // Removes namespace from elements
        $.root().find('m\\:math').each((i, item) => (item.tagName = item.tagName.replace(/m:/g, "")));
        $.root().find('m\\:mn').each((i, item) => (item.tagName = item.tagName.replace(/m:/g, "")));
        $.root().find('m\\:mo').each((i, item) => (item.tagName = item.tagName.replace(/m:/g, "")));
        $.root().find('m\\:mi').each((i, item) => (item.tagName = item.tagName.replace(/m:/g, "")));
        $.root().find('m\\:mtext').each((i, item) => (item.tagName = item.tagName.replace(/m:/g, "")));
        $.root().find('m\\:mfrac').each((i, item) => (item.tagName = item.tagName.replace(/m:/g, "")));
        $.root().find('m\\:mroot').each((i, item) => (item.tagName = item.tagName.replace(/m:/g, "")));
        $.root().find('m\\:msqrt').each((i, item) => (item.tagName = item.tagName.replace(/m:/g, "")));
        $.root().find('m\\:mfenced').each((i, item) => (item.tagName = item.tagName.replace(/m:/g, "")));
        $.root().find('m\\:msubsup').each((i, item) => (item.tagName = item.tagName.replace(/m:/g, "")));
        $.root().find('m\\:munderover').each((i, item) => (item.tagName = item.tagName.replace(/m:/g, "")));
        $.root().find('m\\:munder').each((i, item) => (item.tagName = item.tagName.replace(/m:/g, "")));
        $.root().find('m\\:mover').each((i, item) => (item.tagName = item.tagName.replace(/m:/g, "")));
        $.root().find('m\\:msup').each((i, item) => (item.tagName = item.tagName.replace(/m:/g, "")));
        $.root().find('m\\:msub').each((i, item) => (item.tagName = item.tagName.replace(/m:/g, "")));
        $.root().find('m\\:mtd').each((i, item) => (item.tagName = item.tagName.replace(/m:/g, "")));
        $.root().find('m\\:mlabeledtr').each((i, item) => (item.tagName = item.tagName.replace(/m:/g, "")));
        $.root().find('m\\:mtr').each((i, item) => (item.tagName = item.tagName.replace(/m:/g, "")));
        $.root().find('m\\:mtable').each((i, item) => (item.tagName = item.tagName.replace(/m:/g, "")));
        $.root().find('m\\:mmultiscripts').each((i, item) => (item.tagName = item.tagName.replace(/m:/g, "")));
        $.root().find('m\\:mrow').each((i, item) => (item.tagName = item.tagName.replace(/m:/g, "")));
        $.root().find('m\\:semantics').each((i, item) => (item.tagName = item.tagName.replace(/m:/g, "")));

        var xml = $.xml();
        console.log(xml);
        return xml;
    }

    /**
     * Transforms MathML to AsciiMath
     * @param {{mathml: string;success: boolean;language: string;words: any[];ascii: string;display: string;imagepath: string;alix: number;}} mathObj Math Object
     * @returns {String} AsciiMath
     */
    const GenerateAsciiMath = (mathObj) => {
        try {
            return MathML2Ascii(mathObj.mathml);
        }
        catch(err) {
            return mathObj.ascii;
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
                try {
                    var payload = request.payload;
                    if (payload.contentType == "math") {
                        var mathml = payload.content;
                        const dom = new DOMParser({
                            locator: {},
                            errorHandler: { warning: function (w) { }, 
                            error: function (e) { }, 
                            fatalError: function (e) { console.error(e) } }
                        });
                        var doc = dom.parseFromString(mathml, "text/xml");
                        return GenerateMath(mathml).then(async mathObj => {
                            var parMath = PreProcessMathML(mathml);
                            const latexStr = MathML2Latex.convert(parMath);
                            const asciiStr = GenerateAsciiMath({"mathml": parMath, ...mathObj});
                            const translatedStr = TranslateText(mathObj.words, mathObj.language);

                            var returnObj = {
                                "success": mathObj.success,
                                "input": {
                                    "mathml": mathml,
                                },
                                "output": {
                                    "text": {
                                        "words": mathObj.words,
                                        "translated": translatedStr,
                                        "latex": latexStr,
                                        "ascii": asciiStr,
                                        "html": await GenerateHtmlFromTemplate({
                                            language: mathObj.lang,
                                            disp: mathObj.display,
                                            txt: translatedStr,
                                            altimg: mathObj.imagepath,
                                            alttext: asciiStr,
                                            svg: null,
                                            alix: mathObj.alix,
                                            alixThresholdNoImage: 25
                                        }),
                                    },
                                    "image": {
                                        "path": mathObj.imagepath
                                    },
                                    "attributes": {
                                        "language": mathObj.language,
                                        "alix": mathObj.alix,
                                    }
                                },
                            };
                            console.debug(returnObj);
                            
                            if (!doc.documentElement.getAttribute("altimg")) {
                                // Post-processing SVG
                                return GenerateSvg(mathml).then(async svgObj => {
                                    var x2js = new X2JS(), xmlDoc = x2js.xml2js(svgObj), svgDoc = xmlDoc.div;

                                    svgDoc.svg._class = "visual-math";
                                    svgDoc.svg["_aria-hidden"] = true;
        
                                    var domDoc = x2js.js2dom(svgDoc);
        
                                    var titleEl = domDoc.createElement("title"), titleText = domDoc.createTextNode(mathObj.ascii);
                                    titleEl.appendChild(titleText);
                                    domDoc.firstChild.insertBefore(titleEl);
                                    var tmpDoc = x2js.dom2js(domDoc);
                                    var svgXml = x2js.js2xml(tmpDoc);
                                    return {
                                        "success": mathObj.success,
                                        "input": {
                                            "mathml": mathml,
                                        },
                                        "output": {
                                            "text": {
                                                "words": mathObj.words,
                                                "translated": translatedStr,
                                                "latex": latexStr,
                                                "ascii": asciiStr,
                                                "html": await GenerateHtmlFromTemplate({ 
                                                    language: mathObj.lang,
                                                    disp: mathObj.display,
                                                    txt: translatedStr,
                                                    altimg: mathObj.imagepath,
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
                                                "language": mathObj.language,
                                                "alix": mathObj.alix,
                                            }
                                        },
                                    };
                                });
                            }
                            return returnObj;
                        });
                    }
                    else if (payload.contentType == "chemistry" || payload.contentType == "physics" || payload.contentType == "other") {
                        // Return data
                        return { success: false, error: "non-mathematical formula" };
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