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
            // According to new guidelines, alttext should not be used as MathML support has improved
            // Instead, try to generate a basic fallback from the MathML content
            console.warn("Warning: Failed to convert MathML to AsciiMath. Generating basic fallback.");
            return "MathML content"; // Basic fallback instead of using deprecated alttext
        }
    }

    /**
     * Transforms MathML to Accessible HTML with ALIX
     * @param {{language: String;disp: String;txt: String;svg: String;alix: Number;alixThresholdNoImage: Number;}} opts options
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

        // Extract language from math attribute (supports both new and old namespace formats)
        const languageStr = xmlDom.documentElement.getAttribute("xml:lang") || 
                           xmlDom.documentElement.getAttribute("lang") || "en";
        // Extract display from math attribute - inline is the default according to new guidelines
        let displayStr = xmlDom.documentElement.getAttribute("display");
        
        // Validate display attribute according to new guidelines
        if (displayStr) {
            if (displayStr !== "block" && displayStr !== "inline") {
                console.warn(`Warning: Invalid display attribute value "${displayStr}". Must be "block" or "inline". Using default "inline".`);
                displayStr = "inline";
            }
        } else {
            // Default to inline according to new guidelines
            displayStr = "inline";
        }
        
        // Additional validation: Check for improper usage according to new guidelines
        // The new guidelines state that <math> elements should not be standalone block elements
        // and should always be within paragraph elements or equivalent
        if (displayStr === "block") {
            console.info("Info: Using display='block'. Ensure the <math> element is within a paragraph element or equivalent, not as a standalone block element.");
        }
        
        // Extract displaystyle attribute for large operators (mentioned in new guidelines)
        const displaystyleAttr = xmlDom.documentElement.getAttribute("displaystyle");
        if (displaystyleAttr && displaystyleAttr !== "true" && displaystyleAttr !== "false") {
            console.warn(`Warning: Invalid displaystyle attribute value "${displaystyleAttr}". Must be "true" or "false".`);
        }
        
        // Extract altimg from math attribute (deprecated but kept for backward compatibility)
        const altimgStr = xmlDom.documentElement.getAttribute("altimg") || "";
        // Extract alttext from math attribute (deprecated but kept for backward compatibility)
        const alttextStr = xmlDom.documentElement.getAttribute("alttext") || "";
        
        // Warn about deprecated attributes according to new guidelines
        if (altimgStr) {
            console.warn("Warning: 'altimg' attribute is deprecated according to Nordic MathML Guidelines. MathML support has improved and this attribute should not be used.");
        }
        if (alttextStr) {
            console.warn("Warning: 'alttext' attribute is deprecated according to Nordic MathML Guidelines. MathML support has improved and this attribute should not be used.");
        }

        // Process MathML content - remove deprecated elements and handle new namespace format
        let processedXMLContent = XMLContent;
        
        // Remove deprecated semantics and annotation elements if present
        // These should not be used according to new guidelines unless specifically requested
        processedXMLContent = processedXMLContent.replace(/<semantics[^>]*>.*?<\/semantics>/gs, (match) => {
            // Extract only the first child (the main MathML content) from semantics
            const innerMatch = match.replace(/<semantics[^>]*>(.*?)<\/semantics>/s, '$1');
            // Remove any annotation elements
            return innerMatch.replace(/<annotation[^>]*>.*?<\/annotation>/gs, '')
                           .replace(/<annotation-xml[^>]*>.*?<\/annotation-xml>/gs, '');
        });
        
        // Convert deprecated mfenced elements to mo elements for backward compatibility
        // This allows the service to handle old content while encouraging new content to use mo elements
        processedXMLContent = processedXMLContent.replace(/<mfenced([^>]*)>(.*?)<\/mfenced>/gs, (match, attributes, content) => {
            // Extract open and close attributes
            const openMatch = attributes.match(/open="([^"]*)"/);
            const closeMatch = attributes.match(/close="([^"]*)"/);
            const open = openMatch ? openMatch[1] : "(";
            const close = closeMatch ? closeMatch[1] : ")";
            
            // Convert to mo elements
            return `<mo>${open}</mo>${content}<mo>${close}</mo>`;
        });
        
        // Handle both old (m:) and new namespace formats
        const latexStr = MathML2Latex.convert(processedXMLContent.replace(/<m:/g, "<").replace(/<\/m:/g, "</"));
        const asciiStr = GenerateAsciiMath(processedXMLContent);
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
                        displaystyle: displaystyleAttr,
                        txt: translatedStr,
                        svg: null,
                        alix: result.alix,
                        alixThresholdNoImage: alixThresholds.noImage
                    }),
                },
                "image": {
                    "path": null
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