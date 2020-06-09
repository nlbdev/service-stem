/*jshint esversion: 8 */

import { mathjax } from 'mathjax-full/js/mathjax.js';
import { MathML } from 'mathjax-full/js/input/mathml.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
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
const svg = new SVG({fontCache: 'none'});
const html = mathjax.document('', {InputJax: mml, OutputJax: svg});

export class SvgClass {
    GenerateSvg = async (mathml:string) => {
        // Generate SVG
        const node = html.convert(mathml);
        node.kind = "div";
        node.attributes = { "class": "visual-math" };

        return adaptor.outerHTML(node);
    }
}
