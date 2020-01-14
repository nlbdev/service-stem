#!/usr/bin/env node
/*jshint esversion: 8 */

const X2JS = require("x2js");

module.exports = {
    GenerateMath: async (content) => {
        var words = [], x2js = new X2JS(), dom = x2js.xml2dom(content), root = {}, current = {};

        // Build words array
        root = dom.childNodes[0];
        if(root.localName == "math") {
            words.push("formula");

            console.log(root);

            words.push("formula end");
        }

        // Return words in an array which can be prosessed by the translation service and API
        return words;
    }
};