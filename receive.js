#!/usr/bin/env node
/*jshint esversion: 8 */
const AppConfig = require("./configurations/appConfig");
const amqp = require("amqplib/callback_api");
const convert = require("./convert");

// Override console to enable papertrail
const console = require("./logger");

(() => {
  "use strict";

  var Health = require("./health");

  // Give the MQ 10 seconds to get started
  setTimeout(() => {
    amqp.connect(AppConfig.RABBITMQ_URL, { "credentials": amqp.credentials.plain(AppConfig.RABBITMQ_USER, AppConfig.RABBITMQ_PASS) }, (error0, connection) => {
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
          channel.prefetch(AppConfig.PARALLEL_REQUESTS);
          console.info(` [ SERVER ] Listening for updates to queue ${queue}`);

          channel.consume(
            queue,
            (msg) => {
              let payload = JSON.parse(msg.content), generatedText = "";

              if(payload.contentType == "math") {
                convert.GenerateMath(payload.content).then(res => {
                  // Return data
                  channel.sendToQueue(
                    msg.properties.replyTo,
                    Buffer.from(JSON.stringify({success: true, generated: res})),
                    {
                      expiration: 10000,
                      contentType: "application/json",
                      correlationId: msg.properties.correlationId
                    }
                  );
                })
                .catch(err => {
                  // Return data
                  channel.sendToQueue(
                    msg.properties.replyTo,
                    Buffer.from(JSON.stringify({success: false, error: err})),
                    {
                      expiration: 10000,
                      contentType: "application/json",
                      correlationId: msg.properties.correlationId
                    }
                  );
                });
              }
              else if(payload.contentType == "chemistry" || payload.contentType == "physics" || payload.contentType == "other") {
                // Return data
                channel.sendToQueue(
                  msg.properties.replyTo,
                  Buffer.from(JSON.stringify({success: false, error: "Not yet developed"})),
                  {
                    expiration: 10000,
                    contentType: "application/json",
                    correlationId: msg.properties.correlationId
                  }
                );
              }
            },
            {
              noAck: false
            }
          );
        }
        catch(ex) {
          throw ex;
        }
      });
    });
  }, 1000);
})();