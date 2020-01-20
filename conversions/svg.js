#! /usr/bin/env node
/*jshint esversion: 8 */

const mathjax = require('mathjax-full/js/mathjax.js').mathjax;
const MathML = require('mathjax-full/js/input/mathml.js').MathML;
const SVG = require('mathjax-full/js/output/svg.js').SVG;
const liteAdaptor = require('mathjax-full/js/adaptors/liteAdaptor.js').liteAdaptor;
const RegisterHTMLHandler = require('mathjax-full/js/handlers/html.js').RegisterHTMLHandler;

//
//  Create DOM adaptor and register it for HTML documents
//
const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

//
//  Create input and output jax and a document using them on the content from the HTML file
//
const mml = new MathML();
const svg = new SVG({fontCache: 'none'});
const html = mathjax.document('', {InputJax: mml, OutputJax: svg});

module.exports = {
    GenerateSvg: async (mathml) => {
        const node = html.convert(mathml);

        return adaptor.outerHTML(node);
    }
};

