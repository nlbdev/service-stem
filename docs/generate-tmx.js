#!/usr/bin/env node
/*jshint esversion: 8 */

const fs = require("fs");

const operators = require("./conversions/data/text-operators.json");
const identifiers = require("./conversions/data/text-identifiers.json");
const misc = require("./conversions/data/text-misc.json");

function GenerateTmx(lang) {
    let ejs = require('ejs'), arr = [], now = new Date();

    // Collate operators
    operators.strings.forEach( s => {
        arr.push(s.value);
    });
    operators.chars.forEach( c => {
        arr.push(c.value);
    });
    operators.unicode.forEach( u => {
        arr.push(u.value);
    });

    // Generate document
    let op_document = ejs.render('<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE tmx SYSTEM "tmx14.dtd"><tmx version="1.4"><header segtype="sentence" o-tmf="UTF-8" adminlang="en" srclang="en" datatype="PlainText" creationtool="NLB Generate TMX" creationtoolversion="1.0.0"/><body><% strings.forEach(function(str){ %><tu><tuv xml:lang="en"><seg><%= str %></seg></tuv><tuv xml:lang="<%= language %>"><seg></seg></tuv></tu><% }); %></body></tmx>', {strings: arr, language: lang});

    // Save file
    fs.writeFileSync(`./translations/${now.getFullYear()}${now.getMonth()}${now.getDate()}-${lang}-operators.tmx`, op_document);
    op_document = null;

    // Emtpy string array
    arr = [];

    // Collate identifiers
    identifiers.strings.forEach( s => {
        arr.push(s.value);
    });
    identifiers.chars.forEach( c => {
        arr.push(c.value);
    });
    identifiers.unicode.forEach( u => {
        arr.push(u.value);
    });

    // Generate document
    let id_document = ejs.render('<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE tmx SYSTEM "tmx14.dtd"><tmx version="1.4"><header segtype="sentence" o-tmf="UTF-8" adminlang="en" srclang="en" datatype="PlainText" creationtool="NLB Generate TMX" creationtoolversion="1.0.0"/><body><% strings.forEach(function(str){ %><tu><tuv xml:lang="en"><seg><%= str %></seg></tuv><tuv xml:lang="<%= language %>"><seg></seg></tuv></tu><% }); %></body></tmx>', {strings: arr, language: lang});

    // Save file
    fs.writeFileSync(`./translations/${now.getFullYear()}${now.getMonth()}${now.getDate()}-${lang}-identifiers.tmx`, id_document);
    id_document = null;

    // Emtpy string array
    arr = [];

    // Collate misc
    misc.strings.forEach( s => {
        arr.push(s.value);
    });
    misc.chars.forEach( c => {
        arr.push(c.value);
    });
    misc.unicode.forEach( u => {
        arr.push(u.value);
    });

    // Generate document
    let mi_document = ejs.render('<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE tmx SYSTEM "tmx14.dtd"><tmx version="1.4"><header segtype="sentence" o-tmf="UTF-8" adminlang="en" srclang="en" datatype="PlainText" creationtool="NLB Generate TMX" creationtoolversion="1.0.0"/><body><% strings.forEach(function(str){ %><tu><tuv xml:lang="en"><seg><%= str %></seg></tuv><tuv xml:lang="<%= language %>"><seg></seg></tuv></tu><% }); %></body></tmx>', {strings: arr, language: lang});

    // Save file
    fs.writeFileSync(`./translations/${now.getFullYear()}${now.getMonth()}${now.getDate()}-${lang}-misc.tmx`, mi_document);
    mi_document = null;

    // Emtpy string array
    arr = [];
}

GenerateTmx('no');