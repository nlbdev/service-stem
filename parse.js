#!/usr/bin/env node
/*jshint esversion: 8 */

const misc = require("./conversions/data/text-misc.json");

module.exports = {
    Cleanup: (text) => {
        text = text.replace(" to the power of 2 ", misc.strings.find( m => m.name == " to the power of 2 " ));

        return text;
    }
};