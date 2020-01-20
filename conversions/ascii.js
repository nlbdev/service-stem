#! /usr/bin/env node
/*jshint esversion: 8 */

const mathjax = require('mathjax-full/js/mathjax.js').mathjax;
const MathML = require('mathjax-full/js/input/mathml.js').MathML;
const AsciiMath = require('mathjax-full/js/input/asciimath.js').AsciiMath;
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
const asciimath = new AsciiMath();
const html = mathjax.document('', {InputJax: mml, OutputJax: asciimath});

module.exports = {
    GenerateAsciiMath: async (mathml) => {
        console.log(mathml);
        const node = html.convert(mathml);

        return adaptor.outerHTML(node);
    }
};

