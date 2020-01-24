#!/usr/bin/env node
/*jshint esversion: 8 */

const misc = require("./conversions/data/text-misc.json");

module.exports = {
    Cleanup: (text) => {
        text = text.replace(" to the power of 2 ", misc.strings.find( m => m.name == " to the power of 2 " ).value);
        text = text.replace(" left parenthesis matrix start ", misc.strings.find( m => m.name == " left parenthesis matrix start " ).value);
        text = text.replace(" matrix end right parenthesis ", misc.strings.find( m => m.name == " matrix end right parenthesis " ).value);

        return text;
    }
};