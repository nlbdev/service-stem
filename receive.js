#!/usr/bin/env node
/*jshint esversion: 8 */
const X2JS = require("x2js");
const amqp = require("amqplib/callback_api");

const { DOMParser } = require("xmldom");
const { RABBITMQ_PASS, RABBITMQ_USER, RABBITMQ_URL, PARALLEL_REQUESTS } = require("./configurations/appConfig");
const { GenerateMath } = require("./conversions/text");
const { GenerateSvg } = require("./conversions/svg");

(() => {
  "use strict";

  var Health = require("./health");

  // Give the MQ 10 seconds to get started
  setTimeout(() => {
    amqp.connect(RABBITMQ_URL, { "credentials": amqp.credentials.plain(RABBITMQ_USER, RABBITMQ_PASS) }, (error0, connection) => {
      if (error0) {
        throw error0;
      }
      connection.createChannel((error1, channel) => {
        if (error1) {
          throw error1;
        }

        try {
          var queue = "q.nlb.stem";

          channel.assertQueue(queue, {
            durable: true
          });
          channel.prefetch(PARALLEL_REQUESTS);
          console.info(` [ SERVER ] Listening for updates to queue ${queue}`);

          channel.consume(
            queue,
            (msg) => {
              let payload = JSON.parse(msg.content);

              if (payload.contentType == "math") {
                var p = [
                  GenerateMath(payload.content).then(res => res).catch(err => err)
                ];
                var doc = new DOMParser().parseFromString(payload.content);
                if(!doc.documentElement.getAttribute("altimg")) p.push(GenerateSvg(payload.content).then(svg => svg).catch(err => err));

                Promise.all(p)
                  .then(values => {
                    // Generate return object
                    var obj = {
                      success: values[0].success, 
                      generated : { 
                        text: values[0], 
                        ascii: values[0].ascii,
                        alix: values[0].alix
                      },
                      attributes: {
                        language: values[0].language,
                        display: values[0].display,
                        image: values[0].imagepath
                      }
                    };

                    if(values.length === 3) {
                      // Post-processing SVG
                      var x2js = new X2JS(), xmlDoc = x2js.xml2js( values[2] ), svgDoc = xmlDoc.div;

                      svgDoc.svg._class = "visual-math";
                      svgDoc.svg["_aria-hidden"] = true;

                      var domDoc = x2js.js2dom(svgDoc);

                      var titleEl = domDoc.createElement("title"), titleText = domDoc.createTextNode(values[0].ascii);
                      titleEl.appendChild(titleText);
                      domDoc.firstChild.insertBefore(titleEl);
                      var tmpDoc = x2js.dom2js(domDoc);
                      obj.generated.svg = x2js.js2xml(tmpDoc);
                    }

                    return obj;
                  })
                  .catch(err => {
                    return { success: false, error: err };
                  })
                  .then((result) => {
                    // Return data
                    channel.sendToQueue(
                      msg.properties.replyTo,
                      Buffer.from(JSON.stringify(result)),
                      {
                        expiration: 10000,
                        contentType: "application/json",
                        correlationId: msg.properties.correlationId
                      }
                    );
                    channel.ack(msg);
                  });
              }
              else if (payload.contentType == "chemistry" || payload.contentType == "physics" || payload.contentType == "other") {
                // Return data
                channel.sendToQueue(
                  msg.properties.replyTo,
                  Buffer.from(JSON.stringify({ success: false, error: "non-mathematical formula" })),
                  {
                    expiration: 10000,
                    contentType: "application/json",
                    correlationId: msg.properties.correlationId
                  }
                );
                channel.ack(msg);
              }
            },
            {
              noAck: false
            }
          );
        }
        catch (ex) {
          throw ex;
        }
      });
    });
  }, 1000);
})();