// collect.js
// collect AQList.xml from internet, convert to json
// =========================

if (typeof define !== 'function') {
  var define = require('amdefine');
}

var async = require('async'),
  re = require('request-enhanced'),
  fse = require('fs-extra'),
  util = require('util'),
  dateFormat = require('dateformat'),
  inspect = require('object-inspect'),
  parseString = require('xml2js')
    .parseString;

var trunc = require('./trunc.js');
// var linenums = require('./linenums.js');
var consoleLog = false;

var request = require('sync-request');
// require('console-stamp')(console, '\n[HH:MM:ss.l]');

var fsOptions = {
  flags: 'r+',
  encoding: 'utf-8',
  autoClose: true
};

var truncateToNumChars = 400;

String.prototype.trunc = String.prototype.trunc ||
function (n) {
  return this.length > n ? this.substr(0, n - 1) + '&hellip,' : this;
};
require('console-stamp')(console, '[HH:MM:ss.l]');

var now = new Date();
dateFormat.masks.hammerTime = 'yyyy-mm-dd-HHMMss';
dateFormat.masks.friendly_detailed = "dddd, mmmm dS, yyyy, h:MM:ss TT";
dateFormat.masks.friendly_display = "dddd, mmmm dS, yyyy";
// Basic usage
var displayDateString = dateFormat(now, "friendly_display");
// Saturday, June 9th, 2007, 5:46:21 PM


// var fileDateString = dateFormat(now, "hammerTime");

xmlStandardFileName = __dirname + '/../data/xml/AQList.xml';

var convertXMLToJson = function () {
  var functionCount = 0;
  var savedXMLData = "";
  var myResult;
  var descr;
  async.series([
      function (callback) {
        // remove old AQList.xml and other old files
        //var newPath = (__dirname + "/../data/output/AQList.xml")
        //  .toString();
        var newPath = (__dirname + "/../data/output/*")
          .toString();
        if (consoleLog) {
          console.log("\n ", __filename, "line", "line", __line, "; newPath = ", newPath)
        }
        fse.unlink(newPath, function (err) {
          if (err) {
            console.log("\n ", __filename, "line", "line", __line, "; File to be deleted could not be found");
            callback();
          }
          //throw err;
          if (consoleLog) {
            console.log("\n ", __filename, "line", "line", __line, "; successfully deleted ", newPath)
          }
        });
        callback();
      },
      function (callback) {
        var res = request('GET', 'http://www.un.org/sc/committees/1267/AQList.xml');
        // if (consoleLog) { console.log(res);
        // if (consoleLog) { console.log(res.body.toString());
        if (consoleLog) {
          console.log("Reponse Body Length: ", res.getBody().length)
        }
        AQList_xml = res.body.toString();
        callback();
      },

      function (callback) {
        writeAQListXML();
//        if (consoleLog) { console.log("\n ", __filename, "line", __line, " function #:", ++functionCount);
        // var descr = "collect AQList.xml from public web site, save locally under original filename";
        // if (consoleLog) { console.log("\n ", __filename, "line", __line, " function 1#:", ++functionCount, descr);
//          var myFile = __dirname + "/../data/output/AQList.xml";
        //       var fileNameToSaveTo = __dirname + "/../data/output/AQList.xml";

        /*
         re.get("http://www.un.org/sc/committees/1267/AQList.xml", fileNameToSaveTo, function (error, filename) {
         if (error) {
         if (consoleLog) { console.log("\n ", __filename, "line", __line, "; Error \n" + error);
         }
         if (consoleLog) { console.log("\n ", __filename, "line", __line, "; Saved content to: \n", filename);
         });
         // if (consoleLog) { console.log("\n ", __filename, __line, " AQList_xml = ", trunc.truncn(AQList_xml.toString(),222));
         */
        callback();
      },
      function (callback) {
        // read xml file
        var rawXmlFileName = __dirname + "/../data/output/AQList.xml";
        var descr = "; reading raw XML file: " + rawXmlFileName;
        if (consoleLog) {
          console.log("\n ", __filename, "line", __line, "; function 1#:", ++functionCount, descr, fsOptions);
        }

        AQList_xml = fse.readFileSync(rawXmlFileName, fsOptions); //, function (err, data) {
        // if (consoleLog) { console.log("\n ", __filename, "line", __line, "; xmlFile = \n", trunc.truncn(xmlFile,200));
        if (consoleLog) {
          console.log("\n ", __filename, "line", __line, " AQList_xml = ", trunc.n400(AQList_xml.toString()));
        }
        callback();
      },
      /*
       function(callback) {
       //write XMLFile
       if (consoleLog) { console.log("\n ", __filename, "line", __line, " function #:", ++functionCount);
       writeAQListXML();
       // if (consoleLog) { console.log("\n ", __filename, "line", __line, " AQList_xml = ", AQList_xml.toString());

       callback();
       },*/

      function (callback) {
        // convert AQList.xml to json
        if (consoleLog) {
          console.log("\n ", __filename, "line", __line, " function #:", ++functionCount);
        }
        if (consoleLog) {
          console.log("\n ", __filename, "line", __line, " typeof AQList_xml = ", (typeof AQList_xml));
        }
        if (consoleLog) {
          console.log("\n ", __filename, "line", __line, " AQList_xml = ", trunc.n400(AQList_xml.toString()));
        }
        // var myResult;
        parseString(AQList_xml, {
          explicitArray: false,
          trim: true
        }, function (err, result) {
          if (err) {
            console.log("\n ", __filename, "line", __line, " error attempting parseString: " + err, '\n');
          }
          myJsonData = result;
          if (consoleLog) {
            console.log("\n ", __filename, "line", __line, " result = \n", util.inspect(myJsonData, false, null)
              .trunc(truncateToNumChars));
          }
        });

        callback();
      },

      function (callback) {
        // save raw json
        if (consoleLog) {
          console.log("\n ", __filename, "line", __line, "function 4#:", ++functionCount);
        }
        var myFile = __dirname + "/../data/output/AQList-raw.json";
        // var myJsonData = savedJson;
        if (consoleLog) {
          console.log("\n ", __filename, "line", __line, " myResult = trunc.n400(", myJsonData);
        }
        try {
          fse.writeFileSync(myFile, JSON.stringify(myJsonData, null, " "), fsOptions);
          if (consoleLog) {
            console.log("\n ", __filename, "line", __line, " file written to: ", myFile);
          }
          // if (consoleLog) { console.log("\n ", __filename, "line", __line, " file contained: ", trunc.n400(util.inspect(myResult, false, null))
          // .trunc(truncateToNumChars));
        } catch (e) {
          if (consoleLog) {
            console.log("\n ", __filename, "line", __line, " Error: ", e);
          }
        }
        //  if (consoleLog) { console.log("14 arg1 = ", arg1);
        callback();
      }
    ],

    function (err) {
      // if (consoleLog) { console.log("\n ", __filename, "line", __line, " savedJson = ", trunc.n400(myResult));

    }
  );
};

//var getOutputFileName = function() {
//  return __dirname + "/../data/output/AQList-" + fileDateString + '.xml';
// };
/*
var xmlToJson = function (data) {
  // var xml = "<root>Hello xml2js!</root>";
  parseString(data, {
    async: 'true',
    attrNameProcessors: 'nameToUpperCase'
  }, function (err, result) {
    console.dir("\n ", __filename, "line", __line, " xmlToJson = \n", JSON.stringify(result, null, " "));
  });

};
*/
var AQList_xml;
var myJsonData;
/*
 var getXMLFile = function() {
 descr = "collect AQList.xml from public web site, save locally under original filename";
 if (consoleLog) { console.log("\n ", __filename, "line", __line, " collect.js function 1#:", ++functionCount, descr);
 var req = httpsync.get({
 url: "http://www.un.org/sc/committees/1267/AQList.xml"
 });
 var res = req.end();
 AQList_xml = res.data;
 if (consoleLog) { console.log("\n ", __filename, "line", __line, " AQList_xml = \n", trunc.n400(AQList_xml.toString()));
 /*
 The response Object is what you get after req.end (), it has following fields:
 data A Buffer that stores data sent by server.
 headers Complete response headers, even contains those custom ones.
 ip IP address of the server.
 statusCode Status code that sent by server.

 return AQList_xml;
 };
 */

var getXMLFileSync = function () {
  var res = request('GET', 'http://www.un.org/sc/committees/1267/AQList.xml');
// if (consoleLog) { console.log(res);
  if (consoleLog) {
    console.log("\n ", __filename, "line", __line, "; res.body.toString() = ", res.body.toString());
  }
  if (consoleLog) {
    console.log("\n ", __filename, "line", __line, "; Reponse Body Length: ", res.getBody().length);
  }
  return res.body.toString();
};

var getXMLFile = function () {
  // var descr = "collect AQList.xml from public web site, save locally under original filename";
  // if (consoleLog) { console.log("\n ", __filename, "line", __line, " function 1#:", ++functionCount, descr);
//          var myFile = __dirname + "/../data/output/AQList.xml";
  var fileNameToSaveTo = __dirname + "/../data/output/AQList.xml";
  re.get("http://www.un.org/sc/committees/1267/AQList.xml", fileNameToSaveTo, function (error, filename) {
    if (error) {
      console.log("\n ", __filename, "line", __line, "; Error \n" + error);
    }
    if (consoleLog) {
      console.log("\n ", __filename, "line", __line, "; Saved content to: \n", filename);
    }
  });
};

var writeAQListXML = function () {

  var myFile = __dirname + "/../data/output/AQList.xml";
  try {
    fse.writeFileSync(myFile, AQList_xml, fsOptions);
    if (consoleLog) {
      console.log("\n ", __filename, "line", __line, " file written to: ", myFile);
    }
    if (consoleLog) {
      console.log("\n ", __filename, "line", __line, "  file contained: ", util.inspect(AQList_xml.toString(), false, null).trunc(truncateToNumChars));

    }
  } catch (e) {
    console.log('\n ', __filename, "line", __line, ' Error: ', e);
  }
  if (consoleLog) {
    console.log("\n ", __filename, "line", __line, " AQList_xml = \n", trunc.n400(AQList_xml.toString()));
  }
};

module.exports = {
  getXMLFile: getXMLFile,
  //  xmlToJson: xmlToJson,
  convertXMLToJson: convertXMLToJson
};