require("dotenv").config();
const Airbrake = require('@airbrake/node');

new Airbrake.Notifier({
    projectId: 257349,
    projectKey: '9331de259df466d79c1d0e786be78051',
    environment: process.env.NODE_ENV || 'development'
});

(() => {
    'use strict';

    const Pack = require("./package.json");
    const X2JS = require("x2js");
    const ejs = require('ejs');
    const Resolve = require("path").resolve;
    const { XMLParser, XMLBuilder } = require("fast-xml-parser");

    const MathML2Latex = require('mathml-to-latex');
    const MathML2Ascii = require('mathml-to-asciimath');

    const { PORT, HOST } = require("./configurations/appConfig");
    const { GenerateMath } = require("./conversions/text");
    // const { GenerateSvg } = require("./conversions/svg");

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

    const express = require('express');
    const app = express();
    const bodyParser = require('body-parser');
    
    // create application/json parser
    const jsonParser = bodyParser.json()
    
    app.set('view engine', 'ejs');
    app.set("view options", { layout: true });

    // On all requests, log the it
    app.use((request, response, next) => {
        console.info(`${new Date().toISOString()}\tA request from ${request.ip} (${request.method.toUpperCase()} ${request.url}) ended with ${response.statusCode}`);
        next();
    });

    // Define routes
    app.get('/health', jsonParser, (req, res) => {
        res.send({
            name: Pack.name,
            version: Pack.version,
            timestamp: new Date().toISOString()
        });
    });

    app.get('/', jsonParser, (req, res) => {
        res.status(400).send({
            success: false,
            name: Pack.name,
            version: Pack.version,
            message: "Use POST instead of GET with optional query variables: 'noImage' (ALIX threshold number) and 'noEquationText' (ALIX threshold number), and payload: { \"contentType\": \"math|chemistry|physics|other\", \"content\": \"...\" }"
        });
    });

    // POST / payload: { "contentType": "math|chemistry|physics|other", "content": "..." } 
    app.post('/', jsonParser, async (req, res) => {
        const { contentType, content } = req.body;
        const { noImage, noEquationText } = req.query;
        const noImageInt = parseInt(noImage) || 25;
        const noEquationTextInt = parseInt(noEquationText) || 12;

        const alixThresholds = {
            "noImage": noImageInt,
            "noEquationText": noEquationTextInt
        };
        if (!contentType || !content) {
            res.status(400).send("Missing contentType or content");
            return;
        }

        let result = null;
        switch (contentType) {
            case "math":
                result = GenerateMath(content, alixThresholds);
                break;
            case "chemistry":
                res.status(501).json({ success: false, error: "non-mathematical formula" });
                break;
            case "physics":
                res.status(501).json({ success: false, error: "non-mathematical formula" });
                break;
            case "other":
                res.status(501).json({ success: false, error: "non-mathematical formula" });
                break;
            default:
                res.status(400).json({ success: false, error: "unknown content type" });
                return;
        }

        if (result === null) {
            res.status(400).send("Invalid content");
            return;
        }
        
        if (result.success === false) {
            res.status(500).send(result.message);
            return;
        }

        // IF we got here, all is well
        const parser = new XMLParser();
        const builder = new XMLBuilder();
        
        var x2js = new X2JS();
        var xmlDom = x2js.xml2dom(content);
        var XMLObject = parser.parse(content, {
            ignoreAttributes: false,
            ignoreNameSpace: false,
        });
        var XMLContent = builder.build(XMLObject);

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
        const translatedStr = TranslateText(result.words, languageStr);        

        var returnObj = {
            "success": result.success,
            "input": {
                "mathml": content,
            },
            "output": {
                "text": {
                    "words": result.words,
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
                        alix: result.alix,
                        alixThresholdNoImage: alixThresholds.noImage
                    }),
                },
                "image": {
                    "path": altimgStr
                },
                "attributes": {
                    "language": languageStr,
                    "alix": result.alix,
                    "alixThresholdNoImage": alixThresholds.noImage,
                    "alixThresholdNoEquationText": alixThresholds.noEquationText,
                }
            },
        };

        res.json(returnObj);
    });

    // Start the server
    app.listen(PORT, () => {
        console.info(`${new Date().toISOString()}\t${Pack.name} running on ${HOST}:${PORT}`);
    });
})();