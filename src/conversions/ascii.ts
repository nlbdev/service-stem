/*jshint esversion: 8 */

import { mathjax } from 'mathjax-full/js/mathjax.js';
import { MathML } from 'mathjax-full/js/input/mathml.js';
import { AsciiMath } from 'mathjax-full/js/input/asciimath.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';

//
//  Create DOM adaptor and register it for HTML documents
//
const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

//
//  Create input and output jax and a document using them on the content from the HTML file
//
const mml = new MathML();
const asciimath = new AsciiMath({});
const html = mathjax.document('', {InputJax: mml, OutputJax: asciimath});

export class ascii_class {
    GenerateAsciiMath = async (mathml: string) => {
        console.log(mathml);
        const node = html.convert(mathml);

        return adaptor.outerHTML(node);
    }
}
