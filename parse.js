#!/usr/bin/env node
/*jshint esversion: 8 */

module.exports = {
    Cleanup: (words) => {
        let text = words.join(" ");

        text = text.replace(" to the power of 2 ", " squared ");

        return text;
    }
};