// collect.js
// collect AQ List.xml from 'http://www.un.org/sc/committees/1267/AQList.xml', convert to json
// get the two html files containing narrative names and file names/urls
// write narrative urls array file (a json array) to /data/narrative_lists/narrativeUrlsArray.json
// put data in arrays for d3, normalize
// each node in the main json data file (represented by the 'data' variable) contains data on a single individual or
// entity listed in the AQ List.xml sanctions data file collected from the U.N. site located at http://www.un.org/sc/committees/1267/.
//==========================

// do we want lots of console.log messages for debugging (if so, set consoleLog = true)
var consoleLog = false;
var debugWithFewerNodesCount = 10;
//var __filename = __filename || {};
var linenums = require('./linenums.js');
// var __line = __line || {};

var individualsHtmlUnicodeString;
var entitiesHtmlUnicodeString;

var missingNodes = require('./missing_nodes.js'),
  async = require('async'),
  trunc = require('./trunc.js'),
  re = require('request-enhanced'),
  logger = require('./libs/logger.js'),
  request = require('request'),
  fse = require('fs-extra'),
  util = require('util'),
  dateFormat = require('dateformat'),
  inspect = require('object-inspect');
var narrativeUrlsArray = narrativeUrlsArray || [];
// var utilities_aq_viz = require('./utilities_aq_viz');

var counter = 0;
var numObjectsToShow = 3;
var generatedFileDateString;
var Set = require('backpack-node').collections.Set;
var Bag = require('backpack-node').collections.Bag;
var Map = require('backpack-node').collections.Map;

var fsOptions = {
  flags: 'r+', encoding: 'utf-8', autoClose: true
};
var dateGenerated;
if (typeof define !== 'function') {
  var define = require('amdefine');
}
var requestSync = require('sync-request'),
  AQList_xml,
  parseString = require('xml2js')
    .parseString;

require('console-stamp')(console, '[HH:MM:ss.l]');

var now = new Date();

var select = require('soupselect').select,
  htmlparser = require('htmlparser'),
  http = require('http'),
  sys = require('sys'),
  utilities_aq_viz = require('./utilities_aq_viz'),
  MongoClient = require('mongodb').MongoClient,
  assert = require('assert');
var targetName = '';
var anchor,
  data = {},
  narrativeFileName,
  paragraph,
  rows,
  row,
  td,
  tds,
  underscore,
  url;
var functionCount = 0;
var indivLinks = [];
var entLinks = [];
// var narrativeUrlsArray = [];
var dataPath = __dirname + '/../data/output/data.json';
var writeJsonOutputDebuggingDirectory = __dirname + '/../data/output_debugging/';

var aqListUrl = 'http://www.un.org/sc/committees/1267/AQList.xml';
var individualsLocalOutputFileNameAndPath = __dirname + '/../data/narrative_lists/individuals_associated_with_Al-Qaida.json';
var entitiesLocalOutputFileNameAndPath = __dirname + '/../data/narrative_lists/entities_other_groups_undertakings_associated_with_Al-Qaida.json';
var narrativeUrlsArrayLocalFileNameAndPath = __dirname + '/../data/narrative_lists/narrativeUrlsArray.json';
var indivOrEntityString;
var individualsListUrl = 'http://www.un.org/sc/committees/1267/individuals_associated_with_Al-Qaida.shtml';
var entitiesListUrl = 'http://www.un.org/sc/committees/1267/entities_other_groups_undertakings_associated_with_Al-Qaida.shtml';
var host = 'www.un.org';
var logMessageStringHead = new String().concat(__filename, 'line', __line);
// var linksFromComments = [];
// var linkRegexMatch;
var config;
// var consolidatedList;

var collect = function () {
  var functionCount = 0;
  // var myResult;
  // collecting from: www.un.org/sc/committees/1267/individuals_associated_with_Al-Qaida.shtml

  async.series([

      function (callback) {
        fse.removeSync(writeJsonOutputDebuggingDirectory);
//        fse.removeSync('./data/narrative_lists/narrativeUrlsArray.json');
        fse.removeSync(__dirname + '/../data/narrative_summaries/');
        fse.removeSync(__dirname + '/../data/narrative_lists/');
        fse.removeSync(dataPath);
        // re-create narrative_summaries directory
        fse.mkdirs(writeJsonOutputDebuggingDirectory);
        fse.mkdirs(__dirname + '/../data/narrative_summaries/');
        fse.mkdirs(__dirname + '/../data/narrative_lists/');
        callback();
      },

      // test logger
      function (callback) {
        logger.log_message([__filename, 'line', __line, '; testing logger.log_message'].join(''));
        // logger.log_message(logMessageStringHead.concat('; testing logger.log_message'));
        callback();
      },

      // get the raw xml file from the UN site on the Internet
      function (callback) {
        try {
          var res = requestSync('GET', aqListUrl);
          AQList_xml = res.body.toString();
        } catch (err) {
          var backupRawXmlFileName = __dirname + '/../data/backup/AQList.xml';
          console.log('\n ', __filename, 'line', __line, '; Error: ', err, '; reading stored backup file:', backupRawXmlFileName);
          AQList_xml = fse.readFileSync(backupRawXmlFileName, fsOptions); //, function (err, data) {
        }
        if (consoleLog) {
          // console.log('res.substring(0, 300) = ', res.substring(0, 300));
          console.log(__filename, 'line', __line, 'AQList_xml res.body.toString() = ', AQList_xml.substring(0, 300), '\nAQList_xml Response body length: ', AQList_xml.length);
          logger.log_message([__filename, 'line', __line, 'AQList_xml res.body.toString() = ', AQList_xml.substring(0, 300), '\nAQList_xml Response body length: ', AQList_xml.length].join(''));
        }
        callback();
      },

      // write AQList.xml to local file and archive_historical directory
      function (callback) {
        var fileNameAndPathForProcessing = __dirname + '/../data/output/AQList.xml';
        syncWriteFileAQListXML(AQList_xml, fileNameAndPathForProcessing);
        var fileNameAndPathForArchive = __dirname + '/../data/archive/AQList.xml';
        syncWriteFileAQListXML(AQList_xml, fileNameAndPathForArchive);
        callback();
      },

      // current data file: AQList.xml
      // read local copy of XML file that was downloaded from UN web site
      function (callback) {
        var readRawXmlFileName = __dirname + '/../data/output/AQList.xml';
        if (consoleLog) {
          console.log('\n ', __filename, 'line', __line, '; function #', ++functionCount);
        }
        AQList_xml = fse.readFileSync(readRawXmlFileName, fsOptions);
        if (consoleLog) {
          console.log(__filename, 'line', __line, ' AQList_xml = ', AQList_xml.toString().substring(0, 400));
        }
        callback();
      },

      // current data file: AQList.xml
      // convert AQList.xml to json and store in var 'data'
      function (callback) {
        if (consoleLog) {
          console.log('\n ', __filename, 'line', __line, ' function #:', ++functionCount);
//        console.log('\n ', __filename, 'line', __line, ' typeof AQList_xml = ', (typeof AQList_xml));
//        console.log('\n ', __filename, 'line', __line, ' AQList_xml = ', AQList_xml.toString().substring(0, 400));
        }
        // var myResult;
        parseString(AQList_xml, {
          explicitArray: false,
          trim: true
        }, function (err, result) {
          if (err) {
            console.log(__filename, 'line', __line, ' error attempting parseString: ', err, '\n');
          }
          data = result;
          if (consoleLog) {
            console.log(__filename, 'line', __line, ' result = \n', JSON.stringify(data).substring(0, 400));
          }
        });
        callback();
      },
      // save var 'data' to data.json
      // current data file: AQList.xml  --> data.json
      // write the json data from AQList.xml to local file /data/output/data.json
      function (callback) {
        // write raw json
        if (consoleLog) {
          console.log(__filename, 'line', __line, 'function #:', ++functionCount);
          console.log(__filename, 'line', __line, '; JSON.stringify(data).substring(0,400) = ', JSON.stringify(data).substring(0, 400));
        }
        // var dataPath = __dirname + '/../data/output/data.json';
        try {
          utilities_aq_viz.stringifyAndWriteJsonDataFile(data, dataPath);
          // you need to stringify the data variable before writing it to a file; otherwise you get a file containing the string 'Object'
          if (consoleLog) {
            console.log(__filename, 'line', __line, '; data file written to: ', dataPath);
          }
        } catch (err) {
          console.log(__filename, 'line', __line, ' Error: ', err);
        }
        callback();
      },

      // current data file: data.json
      // read 'raw' unprocessed json data file created from raw XML file data feed
      function (callback) {
        // var dataPath = __dirname + '/../data/output/data.json';
        data = JSON.parse(fse.readFileSync(dataPath));
        if (consoleLog) {
          console.log('\n ', __filename, 'line', __line, '; function #:', ++functionCount, '; read data.json');
        }
        callback();
      },

      // write the intermediate file for debugging
      function (callback) {
        var writeJsonPathAndFileName = writeJsonOutputDebuggingDirectory + 'AQList-L' + __line + '-raw_data.json';
        utilities_aq_viz.stringifyAndWriteJsonDataFile(data, writeJsonPathAndFileName);
        utilities_aq_viz.stringifyAndWriteJsonDataFile(data, dataPath);
        callback();
      },

      // current data file: data.json
      // current data variable: data  --> data
      // misc normalization
      // put all the individual and entity nodes in a single array and add a property to identify node as indiv or ent
      // from local file, add no-longer-listed and otherwise missing ents and indivs to nodes
      // normalize indiv.indivDobString, indiv.indivPlaceOfBirthString, indiv.indivAliasString
      // archive a dated copy of AQList.xml for potential future time series analysis
      // normalize reference numbers, ids, name strings, nationality.
      function (callback) {
        if (consoleLog) {
          console.log('\n ', __filename, 'line', __line, '; function #:', ++functionCount, '; read data.json');
        }
        data.entities = data.CONSOLIDATED_LIST.ENTITIES.ENTITY;
        data.indivs = data.CONSOLIDATED_LIST.INDIVIDUALS.INDIVIDUAL;
        data.entities.forEach(function (entity) {
          entity.noLongerListed = 0;
        });
        data.indivs.forEach(function (indiv) {
          indiv.noLongerListed = 0;
        });
        var missingIndivs = missingNodes.getMissingIndivs();
        missingIndivs.forEach(function (missing_indiv) {
          missing_indiv.noLongerListed = 1;
        });
        var missingEnts = missingNodes.getMissingEnts();
        missingEnts.forEach(function (missing_ent) {
          missing_ent.noLongerListed = 1;
        });
        data.indivs = data.indivs.concat(missingIndivs);
        // data.indivs = data.indivs.concat(missingNodes.getMissingIndivs());
        data.indivs.forEach(function (indiv) {
          indiv.indiv0OrEnt1 = 0;
          indiv.indivDobString = createIndivDateOfBirthString(indiv);
          indiv.indivPlaceOfBirthString = processPlaceOfBirthArray(indiv);
          indiv.indivAliasString = processAliasArray(indiv);
          // console.log('indiv.indivDobString = ', indiv.indivDobString);
        });
        data.entities = data.entities.concat(missingEnts);
        // data.entities = data.entities.concat(missingNodes.getMissingEnts());
        // indiv0OrEnt1 1 = entity; 0 = individual
        data.entities.forEach(function (entity) {
          entity.indiv0OrEnt1 = 1;
        });
        data.nodes = data.indivs.concat(data.entities);
        data.dateGenerated = utilities_aq_viz.formatMyDate(data.CONSOLIDATED_LIST.$.dateGenerated);
        data.dateCollected = utilities_aq_viz.formatMyDate(new Date());
        data.nodes.forEach(function (node) {
          node.dateUpdatedString = processDateUpdatedArray(node);
          //node.narrativeFileName = utilities_aq_viz.generateNarrFileName(node);
          // node.narrativeFileName = '';
        });

        var generatedFileDateString = dateFormat(data.dateGenerated, 'yyyy-mm-dd');
        var archiveFileNameAndPath = __dirname + '/../data/archive_historical/AQList-' + generatedFileDateString + '.xml';
//       archiveRawSource(archiveFile);
        syncWriteFileAQListXML(data, archiveFileNameAndPath);
//        writeAQListXML(archiveFileNameAndPath);
        createDateGeneratedMessage();
        delete data.entities;
        delete data.indivs;
        //data.CONSOLIDATED_LIST = null;
        delete data.CONSOLIDATED_LIST;
        cleanUpRefNums(data.nodes);
        cleanUpIds(data.nodes);
        data.nodes.forEach(function (node) {
          //  node.narrativeFileName = utilities_aq_viz.generateNarrFileName(node);
        });
        var nodes = data.nodes;
        var node;
        for (var nodeCounter = 0; nodeCounter < nodes.length; nodeCounter++) {
          node = nodes[nodeCounter];
          node.nodeNumber = nodeCounter + 1;
        }

        // node.id = getCleanId(node.REFERENCE_NUMBER);
        concatNames(data.nodes);
        createNationality(data.nodes);
        if (consoleLog) {
//          console.log(__filename, 'line', __line, '; function #:', ++functionCount, '; put data into nodes array for d3');
          console.log(__filename, 'line', __line, '; JSON.stringify(data).substring(0, 800) = \n', JSON.stringify(data, null, ' ').substring(0, 800));
        }
        callback();
      },

      // current data file: data.json
      // current data variable: data
      // write normalized json data to local file for debugging
      function (callback) {
        // var myFile = __dirname + '/../data/output/' + fileName;
        var writeJsonPathAndFileName = writeJsonOutputDebuggingDirectory + 'AQList-L' + __line + '-writedata.json';
        utilities_aq_viz.stringifyAndWriteJsonDataFile(data, writeJsonPathAndFileName);
        utilities_aq_viz.stringifyAndWriteJsonDataFile(data, dataPath);
        if (consoleLog) {
          console.log('\n ', __filename, 'line', __line, '; wrote file to: writeJsonPathAndFileName = ', writeJsonPathAndFileName, ';  file contained (truncated): ', JSON.stringify(data, null, ' ').substring(0, 800), ' ... [CONSOLE LOG OUTPUT INTENTIONALLY TRUNCATED TO FIRST 800 CHARACTERS]\n\n');
        }
        callback();
      },

      // current data file: data.json
      // current data variable: data
      // write intermediate data to local file for debugging
      function (callback) {
        // var myFile = __dirname + '/../data/output/' + fileName;
        var writeJsonPathAndFileName = writeJsonOutputDebuggingDirectory + 'AQList-L' + __line + '-normData-01-flattened.json';
        utilities_aq_viz.stringifyAndWriteJsonDataFile(data, writeJsonPathAndFileName);
        utilities_aq_viz.stringifyAndWriteJsonDataFile(data, dataPath);
        if (consoleLog) {
          console.log('\n ', __filename, 'line', __line, '; wrote data file to: writeJsonPathAndFileName = ', writeJsonPathAndFileName, ';  file contained (truncated): ', JSON.stringify(data, null, ' ').substring(0, 800), ' ... [CONSOLE LOG OUTPUT INTENTIONALLY TRUNCATED TO FIRST 800 CHARACTERS]\n\n');
        }
        callback();
      },

      // put nodes and node ids into a set
      // Re SET: https://www.npmjs.org/package/backpack-node
      function (callback) {
        counter = 0;
        var setOfNodes = new Set();
        var setOfNodeIds = new Set();
        data.nodes.forEach(function (node) {
          counter++;
          setOfNodes.add(node);
          setOfNodeIds.add(node.id);
          if (counter !== setOfNodeIds.count) {
            console.log('\n ', __filename, 'line', __line, '; node.id = ', node.id, '; counter = ', counter, '; setOfNodeIds.count = ', setOfNodeIds.count, '; \n(counter === setOfNodeIds.count) = ', counter === setOfNodeIds.count, '; node.id ', node.id, ' is a duplicate.');
            counter = counter - 1;
          }
        });
        if (consoleLog) {
          console.log(__filename, 'line', __line, '; function #:', ++functionCount, '; put nodes into a set', '; typeof data = ', typeof data,
            '; started with ', data.nodes.length, ' nodes in data.nodes array', '; counter = ', counter, '; setOfNodes.count = ', setOfNodes.count, '; setOfNodeIds.count = ', setOfNodeIds.count);
        }
        callback();
      },
      // put nodes into nodeBag
      // https://www.npmjs.org/package/backpack-node
      function (callback) {
        var nodeBag = new Bag();
        counter = 0;
        data.nodes.forEach(function (node) {

          if (consoleLog & counter < 40) {
            console.log(__filename, 'line', __line, '; counter = ', counter, '; node.id = ', node.id);
          }
          node.id = getCleanId(node.REFERENCE_NUMBER);
          if (!(node.id)) {
            node.id = 'NODE' + counter;
          }
          nodeBag.add(node.id, node);
          // console.log('\n ', __filename, 'line', __line, 'counter = ', counter ,'; nodeBag.length = ', nodeBag.count);
          if (consoleLog && counter < 40) {
            console.log(__filename, 'line', __line, 'Bag counter = ', counter);
          }
          counter++;
        });

        callback();
      },

      // write intermediate data file for debugging
      function (callback) {
        var writeJsonPathAndFileName = writeJsonOutputDebuggingDirectory + 'AQList-L' + __line + '-bagData.json';
        utilities_aq_viz.stringifyAndWriteJsonDataFile(data, writeJsonPathAndFileName);
        utilities_aq_viz.stringifyAndWriteJsonDataFile(data, dataPath);
        callback();
      },

      // put nodes with normalized node.id into nodeBag2
      function (callback) {
        var nodeBag2 = new Bag();
        counter = 0;
        data.nodes.forEach(function (node) {
          node.id = getCleanId(node.REFERENCE_NUMBER);
          nodeBag2.add(node.id, node);
          counter++;
        });
        if (consoleLog) {
          console.log('\n ', __filename, 'line', __line, 'nodeBag2 counter = ', counter, '; nodeBag2._map.count = ', nodeBag2._map.count);
        }
        callback();
      },

      // write intermediate data file for debugging
      // no links here yet
      function (callback) {
        var writeJsonPathAndFileName = writeJsonOutputDebuggingDirectory + 'AQList-L' + __line + '-setupData1-nodeBagSet.json';
        utilities_aq_viz.stringifyAndWriteJsonDataFile(data, writeJsonPathAndFileName);
        utilities_aq_viz.stringifyAndWriteJsonDataFile(data, dataPath);
        callback();
      },

      // collect the two list files for sanctioned individuals and entities.
      // collect from the Internet (specifically, from www.un.org/sc/committees/1267/individuals_associated_with_Al-Qaida.shtml)
      // the raw html page that lists the names of html files containing narratives regarding sanctioned individuals
      // parse the list file, extract ids, file names etc. and put into narrativeUrlsArray json array
      // write as local file: individualsLocalOutputFileNameAndPath = __dirname + '/../data/narrative_lists/individuals_associated_with_Al-Qaida.json';
      function (callback) {
        consoleLog = true;
        indivOrEntityString = 'indiv';
        if (consoleLog) {
          console.log('\n ', __filename, __line, '; function 1#:', ++functionCount, '; collect the two list files for sanctioned individuals and entities');
        }
        // INDIVIDUALS LIST
        var individualsHtmlListLocalPathAndFileName = __dirname + '/../data/narrative_lists/individuals_associated_with_Al-Qaida.shtml';
        individualsHtmlUnicodeString = syncGetHtmlAsUnicodeString('http://www.un.org/sc/committees/1267/individuals_associated_with_Al-Qaida.shtml');
        try {
          syncWriteHtmlFile(individualsHtmlUnicodeString, individualsHtmlListLocalPathAndFileName);
        } catch (err) {
          console.log('\n ', __filename, 'line', __line, '; Error: ', err);
        }
        // entities list
        var entitiesHtmlListLocalPathAndFileName = __dirname + '/../data/narrative_lists/' + 'entities_other_groups_undertakings_associated_with_Al-Qaida.shtml';
        entitiesHtmlUnicodeString = syncGetHtmlAsUnicodeString('http://www.un.org/sc/committees/1267/entities_other_groups_undertakings_associated_with_Al-Qaida.shtml');
        try {
          syncWriteHtmlFile(entitiesHtmlUnicodeString, entitiesHtmlListLocalPathAndFileName);
        } catch (err) {
          console.log('\n ', __filename, 'line', __line, '; Error: ', err);
        }
        callback();
      },

      /*
       // Collect list of sanctioned entities
       // collect from the Internet
       // (specifically, from www.un.org/sc/committees/1267/entities_other_groups_undertakings_associated_with_Al-Qaida.shtml'.
       // the raw html page which lists the urls for online narratives regarding sanctioned entities
       // parse the html file, extract ids, file names etc. and put into narrativeUrlsArray json array and write as local file
       // write as local file: entitiesLocalOutputFileNameAndPath = __dirname +
       // '/../data/narrative_lists/entities_other_groups_undertakings_associated_with_Al-Qaida.json';
       // write local file: narrativeUrlsArrayLocalFileNameAndPath = __dirname + '/../data/narrative_lists/narrativeUrlsArray.json';
       // asyncronous version of following previously-used function
       function (callback) {
       indivOrEntityString = 'entity';
       if (consoleLog) {
       console.log('\n ', __filename, __line, '; function 1#:', ++functionCount);
       console.log('\n ', __filename, __line, '; entitiesListUrl =', entitiesListUrl, '; indivOrEntityString = ', indivOrEntityString);
       }
       // download the narrative file, trim it and save in a local file
       try {
       syncGetRawHtmlListPages(entitiesListUrl, __dirname + '/../data/narrative_lists/entities_other_groups_undertakings_associated_with_Al-Qaida.json', 'entity');
       //          syncGetRawHtmlListPages('entities_other_groups_undertakings_associated_with_Al-Qaida.json', entitiesLocalOutputFileNameAndPath, indivOrEntityString);
       } catch (err) {
       console.log('\n ', __filename, 'line', __line, '; Error: ', err);
       }
       console.log('\n ', __filename, __line, '; collected data from: ', entitiesListUrl, ' and wrote it to', __dirname, '/../data/narrative_lists/entities_other_groups_undertakings_associated_with_Al-Qaida.json', entitiesLocalOutputFileNameAndPath);
       callback();
       },
       */

      // ADD CONNECTION IDS ARRAY from comments to data
      function (callback) {
        if (consoleLog) {
          console.log('\n ', __filename, 'line', __line, '; function #:', ++functionCount, '; addConnectionIdsArrayFromComments(data.nodes)');
        }
        addConnectionIdsArrayFromComments(data.nodes);
        if (consoleLog) {
          console.log(data.nodes[1]);
        }
        callback();
      },

// parse the html list files to obtain narrative filenames
      function (callback) {
//        indivOrEntityString = '';
        if (consoleLog) {
          console.log('\n ', __filename, __line, '; function 1#:', ++functionCount, '; parse the html list files to obtain narrative filenames');
        }
        try {
          syncParseHtmlListPage(individualsHtmlUnicodeString, 'indiv');
        } catch (err) {
          console.log('\n ', __filename, 'line', __line, '; Error: ', err);
        }
        // indivOrEntityString = 'indiv';
        try {
          syncParseHtmlListPage(entitiesHtmlUnicodeString, 'entity');
        } catch (err) {
          console.log('\n ', __filename, 'line', __line, '; Error: ', err);
        }

//         console.log('\n ', __filename, __line, '; collected data from: ', entitiesListUrl, ' and wrote it to', __dirname, '/../data/narrative_lists/entities_other_groups_undertakings_associated_with_Al-Qaida.json', entitiesLocalOutputFileNameAndPath);
        callback();
      },

      /*
       // ADD CONNECTION IDS ARRAY from narratives
       function (callback) {
       if (consoleLog) {
       console.log('\n ', __filename, 'line', __line, '; function #:', ++functionCount, '; addConnectionIdsArrayFromComments(data.nodes)');
       }
       addConnectionIdsArrayFromLongNarratives(data.nodes);
       if (consoleLog) {
       console.log(data.nodes[1]);
       }
       callback();
       },
       */

      // write intermediate data file for debugging
      function (callback) {
        var writeJsonPathAndFileName = writeJsonOutputDebuggingDirectory + 'AQList-L' + __line + '-addConnectionIdsArrayFromComments.json';
        utilities_aq_viz.stringifyAndWriteJsonDataFile(data, writeJsonPathAndFileName);
        utilities_aq_viz.stringifyAndWriteJsonDataFile(data, dataPath);
        callback();
      },

      // ADD CONNECTION OBJECTS ARRAY to data
      function (callback) {
        addConnectionObjectsArrayFromComments(data.nodes);
        if (consoleLog) {
          console.log('\n ', __filename, 'line', __line, '; function #:', ++functionCount, '; addConnectionObjectsArrayFromComments');
          console.log(data.nodes[1]);
        }
        callback();
      },

      // write intermediate data file for debugging
      function (callback) {
        var writeJsonPathAndFileName = writeJsonOutputDebuggingDirectory + 'AQList-L' + __line + '-addConnectionObjectsArray.json';
        utilities_aq_viz.stringifyAndWriteJsonDataFile(data, writeJsonPathAndFileName);
        utilities_aq_viz.stringifyAndWriteJsonDataFile(data, dataPath);
        callback();
      },

      // CONSOLIDATE LINKS INTO an array of links in data
      function (callback) {
        consolidateLinksFromComments(data);
        if (consoleLog) {
          console.log('\n 283 function #:', ++functionCount, '; consolidate linksFromComments into linksFromComments array');
          console.log('\n ', __filename, 'line', __line, '; data.nodes[1] = ', data.nodes[1]);
          console.log('\n ', __filename, 'line', __line, '; data.linksFromComments.length = ', data.linksFromComments.length);
        }
        callback();
      },

      // write intermediate data file for debugging
      function (callback) {
        var writeJsonPathAndFileName = writeJsonOutputDebuggingDirectory + 'AQList-L' + __line + '-consolidatedLinksFromComments.json';
        utilities_aq_viz.stringifyAndWriteJsonDataFile(data, writeJsonPathAndFileName);
        utilities_aq_viz.stringifyAndWriteJsonDataFile(data, dataPath);
        callback();
      },

      // stringify and write json data for later processing
      function (callback) {
        if (consoleLog) {
          console.log(__filename, 'line', __line, '; function #:', ++functionCount, '; write clean json file');
        }
        // var writeJson = function () {
        try {
          // var myFile = __dirname + '/../data/output/data.json';
          var stringifiedData = JSON.stringify(data, null, ' ');
          fse.writeFileSync(dataPath, stringifiedData, fsOptions);
          if (consoleLog) {
            console.log(__filename, 'line', __line, ';  file written to: ', dataPath, ';  file contained: ', JSON.stringify(data, null, ' ').substring(0, 200));
          }
        } catch (err) {
          console.log(__filename, 'line', __line, ';  Error: ', err);
          callback();
        }
        callback();
      },

      // write intermediate data file for debugging
      function (callback) {
        var writeJsonPathAndFileName = writeJsonOutputDebuggingDirectory + 'AQList-L' + __line + '-readdata.json';
        utilities_aq_viz.stringifyAndWriteJsonDataFile(data, writeJsonPathAndFileName);
        utilities_aq_viz.stringifyAndWriteJsonDataFile(data, dataPath);
        callback();
      },

      // read the main json file containing nodes and links
      /*
       function (callback) {
       try {
       var buffer = fse.readFileSync(dataPath);
       data = JSON.parse(buffer);
       } catch (err) {
       console.log('\n ', __filename, 'line', __line, '; Error: ', err);
       }
       if (consoleLog) {
       console.log(__filename, 'line', __line, '; function #:', ++functionCount, '; data read from: \n', dataPath, '; data = ', JSON.stringify(data, null, ' ').substring(0, 200));
       }
       callback();
       },
       */
      // read json file containing config
      function (callback) {
        var configJsonFileName = __dirname + '/../data/input/config.json';
        var buffer = fse.readFileSync(configJsonFileName); //, fsOptions); //, function (err, data) {
        config = JSON.parse(buffer);
        if (consoleLog) {
          console.log('\n ', __filename, 'line', __line, '; function #:', ++functionCount);
          console.log('\n ', __filename, 'line', __line, '; config data read from: \n', configJsonFileName);
          console.log('\n ', __filename, 'line', __line, '; config.json = \n', JSON.stringify(config, null, ' ').substring(0, 300));
        }
        callback();
      },

      // Add the UN website's narrative file name as a property in each node of data
      // the general form of the file name is
      // var idSplit = (node.id).trim().split('.');
      // var narrFileName = 'NSQ' + idSplit[0].substring(1, 2) + idSplit[2] + idSplit[3] + '.shtml';
      function (callback) {
        var buffer;
        // var AQListCleanJsonPath = __dirname + '/../data/output/AQList-clean.json';
//        var data;
//        try {
//          buffer = fse.readFileSync(dataPath);
//          data = JSON.parse(buffer);
//        } catch (err) {
//          console.log('\n ', __filename, 'line', __line, '; Error: ', err);
//        }
        var node;
        // var linksId;
        // var narrCounter = 0;
        console.log('\n ', __filename, 'line', __line, '; function #:', ++functionCount, '; ');
        //      var readNarrativeFilePath;
        // var narrative;
//        var link_data_array_item;
        var narrativeUrlArrayElement;
        for (var narrUrlCounter = 0; narrUrlCounter < narrativeUrlsArray.length; narrUrlCounter++) {

//           console.log(__filename, 'line', __line, '; ldi = ', ldi);

          narrativeUrlArrayElement = narrativeUrlsArray[narrUrlCounter];
          /*
           readNarrativeFilePath = __dirname + '/../data/narrative_summaries/' + narrativeUrlObject.narrativeFileName;
           try {
           buffer = fse.readFileSync(readNarrativeFilePath);
           } catch (err) {
           console.log('\n ', __filename, 'line', __line, '; Error: ', err);
           }
           console.log('\n ', __filename, 'line', __line, '; buffer.length = ', buffer.length);
           var narrWebPageString = forceUnicodeEncoding(buffer.toString());
           narrative = trimNarrative(narrWebPageString);
           link_data_array_item.longNarrative = narrative;
           */
          var nodes = data.nodes;
          for (var nodeCounter = 0; nodeCounter < nodes.length; nodeCounter++) {

            node = nodes[nodeCounter];
            // console.log('\n ', __filename, 'line', __line, '; node.id = ', node.id);
            if (narrativeUrlArrayElement.id === node.id) {
              node.narrativeFileName = narrativeUrlArrayElement.narrativeFileName;
              node.narrativeFileNameSource = 'html list file';
              if (nodeCounter < 5) {
                console.log('\n ', __filename, 'line', __line, '; narrUrlCounter = ', narrUrlCounter, '; nodeCounter = ', nodeCounter, '; narrativeUrlArrayElement.id = ', narrativeUrlArrayElement.id, ' === node.id = ', node.id, ' = ', narrativeUrlArrayElement.id === node.id);
              }
              break;
            }

          }
//          narrCounter++;
          // Insert a single document
        }

        var narrativeUrlsArrayStringified = JSON.stringify(narrativeUrlsArray, null, ' ');
        writeMyFile(narrativeUrlsArrayLocalFileNameAndPath, JSON.stringify(narrativeUrlsArray, null, ' '), fsOptions);
        // console.log( __filename, __line, '; wrote file: ', narrativeUrlsArrayLocalFileNameAndPath);

//        var narrativeLinksDocsPath = __dirname + '/../data/narrative_lists/narrative_links_docs.json';
//        writeMyFile(narrativeLinksDocsPath, JSON.stringify(narrativeLinks, null, ' '), fsOptions);
//        var dataLocalFileNameAndPath = __dirname + '/../data/output/AQList-clean-docs.json';
//        writeMyFile(dataLocalFileNameAndPath, JSON.stringify(data, null, ' '), fsOptions);
        //        db.close();
        // });
        callback();
      },

      // write intermediate data file for debugging
      function (callback) {
        var writeJsonPathAndFileName = writeJsonOutputDebuggingDirectory + 'AQList-L' + __line + '-readdata.json';
        utilities_aq_viz.stringifyAndWriteJsonDataFile(data, writeJsonPathAndFileName);
        utilities_aq_viz.stringifyAndWriteJsonDataFile(data, dataPath);
        callback();
      },

      // if a node lacks a narrativeFileName, generate a narrativeFileName for the node based on the node.id
      // Note: the pattern does not always work; some narrative filenames have the letter 'E' added before the '.shtml' extension.
      function (callback) {
        var longNarrativeFileNameMissing;
        var node;
        var nodeNarrFileName;
        var generatedNarrFileNameCounter = 0;
        if (consoleLog) {
          console.log('\n ', __filename, ' line ', __line, '; function #:', ++functionCount, '; ');
        }
        var nodes = data.nodes;
        var a, b, c;
        for (var nodeCounter = 0; nodeCounter < nodes.length; nodeCounter++) {
          node = nodes[nodeCounter];
          //   a = (typeof node.narrativeFileName === 'null');
          //   b = (typeof node.narrativeFileName === 'undefined');
          //   c = (node.narrativeFileName === '');
          longNarrativeFileNameMissing = ((typeof node.narrativeFileName === 'null') || (typeof node.narrativeFileName === 'undefined') || (node.narrativeFileName === ''));
          if (longNarrativeFileNameMissing) {
            node.narrativeFileName = utilities_aq_viz.generateNarrFileName(node);
            node.narrativeFileNameSource = 'derived from id';
            generatedNarrFileNameCounter++;
            console.log('\n ', __filename, ' line ', __line, 'generatedNarrFileNameCounter = ', generatedNarrFileNameCounter, '; ldi = ', nodeCounter, '; longNarrativeFileNameMissing = ', longNarrativeFileNameMissing, '\n node.narrativeFileName = ', node.narrativeFileName, '; node = ', node, '\n\n');
          }
        }
        if (consoleLog) {
          console.log(__filename, ' line ', __line, '; Generated', generatedNarrFileNameCounter, 'narrative file names.');
        }
        callback();
      },

      // write intermediate data file for debugging
      function (callback) {
        var writeJsonPathAndFileName = writeJsonOutputDebuggingDirectory + 'AQList-L' + __line + '-generatedNarrFileNames.json';
        utilities_aq_viz.stringifyAndWriteJsonDataFile(data, writeJsonPathAndFileName);
        // var dataPath = __dirname + '/../data/output/data.json';
        utilities_aq_viz.stringifyAndWriteJsonDataFile(data, dataPath);
        callback();
      },

      // download each narrative file from the UN web site and save to local file
      function (callback) {
        var narrativeUrlObject;
//        var url;
        var node;
        if (consoleLog) {
          console.log(__filename, 'line', __line, '; function #:', ++functionCount, '; ');
          logger.log_message([__filename, 'line', __line, '; function #:', ++functionCount, '; '].join(''));
        }
        var narrativeAsString;
        // var readNarrativeFilePath;
        var trimmedNarrative;
        var link_data_array_item;
        var nodes = data.nodes;
        var readUnparsedLocalNarrativeFilePath;
        var writeLocalNarrativeFilePath;
        var buffer;
        for (var nodeCounter = 0; nodeCounter < nodes.length; nodeCounter++) {
          node = nodes[nodeCounter];
          readUnparsedLocalNarrativeFilePath = __dirname + '/../data/narrative_summaries_parsed/' + node.narrativeFileName;
          writeLocalNarrativeFilePath = __dirname + '/../data/narrative_summaries_parsed/' + node.narrativeFileName;
          try {
            buffer = fse.readFileSync(readUnparsedLocalNarrativeFilePath);
          } catch (err) {
            logger.log_message([__filename, 'line', __line, '; Error: ', err].join(''));
            console.log(__filename, 'line', __line, '; Error: ', err);
          }
          console.log(__filename, 'line', __line, '; buffer.length = ', buffer.length);
          var narrWebPageAsString = utilities_aq_viz.forceUnicodeEncoding(buffer.toString());
          trimmedNarrative = utilities_aq_viz.trimNarrative(narrWebPageAsString);
          syncWriteHtmlFile(trimmedNarrative, writeLocalNarrativeFilePath);
        }
        callback();
      },


      // download each narrative file from the UN web site and save to local file
      function (callback) {
        var narrativeUrlObject;
//        var url;
        var node;
        if (consoleLog) {
          console.log(__filename, 'line', __line, '; function #:', ++functionCount, '; ');
          logger.log_message([__filename, 'line', __line, '; function #:', ++functionCount, '; '].join(''));
        }
        var narrativeAsString;
        // var readNarrativeFilePath;
        var trimmedNarrative;
        var link_data_array_item;
        var nodes = data.nodes;
        var readUnparsedLocalNarrativeFilePath;
        var writeLocalNarrativeFilePath;
        var buffer;
        for (var nodeCounter = 0; nodeCounter < nodes.length; nodeCounter++) {
          node = nodes[nodeCounter];
          readUnparsedLocalNarrativeFilePath = __dirname + '/../data/narrative_summaries_parsed/' + node.narrativeFileName;
          writeLocalNarrativeFilePath = __dirname + '/../data/narrative_summaries_parsed/' + node.narrativeFileName;
          try {
            buffer = fse.readFileSync(readUnparsedLocalNarrativeFilePath);
          } catch (err) {
            logger.log_message([__filename, 'line', __line, '; Error: ', err].join(''));
            console.log(__filename, 'line', __line, '; Error: ', err);
          }
          console.log(__filename, 'line', __line, '; buffer.length = ', buffer.length);
          var narrWebPageAsString = utilities_aq_viz.forceUnicodeEncoding(buffer.toString());
          trimmedNarrative = utilities_aq_viz.trimNarrative(narrWebPageAsString);
          syncWriteHtmlFile(trimmedNarrative, writeLocalNarrativeFilePath);
        }
        callback();
      }


      /*
       // read the local copies of the narrative files
       function (callback) {
       var narrativeUrlObject;
       var buffer;
       //var data;
       try {
       buffer = fse.readFileSync(dataPath);
       data = JSON.parse(buffer);
       } catch (err) {
       console.log('\n ', __filename, 'line', __line, '; Error: ', err);
       logger.log_message([ __filename, 'line', __line, '; Error: ', err].join(''));
       }
       var node;
       var narrCounter = 0;
       console.log(__filename, 'line', __line, '; function #:', ++functionCount, '; ');
       logger.log_message([__filename, 'line', __line, '; function #:', ++functionCount, '; '].join(''));
       var readNarrativeFilePath;
       var trimmedNarrative;
       var link_data_array_item;
       for (var ldi = 0; ldi < narrativeUrlsArray.length; ldi++) {
       console.log(__filename, 'line', __line, '; narrCounter = ', narrCounter);
       narrativeUrlObject = narrativeUrlsArray[ldi];
       writeNarrativeFilePath = __dirname + '/../data/narrative_summaries/' + narrativeUrlObject.narrativeFileName;
       try {
       var syncGetRawHtmlNarrativePages = function (url, writeNarrativeFilePath);


       buffer = fse.readFileSync(readNarrativeFilePath);
       } catch (err) {
       logger.log_message([__filename, 'line', __line, '; Error: ', err].join(''));
       console.log(__filename, 'line', __line, '; Error: ', err);
       }
       console.log(__filename, 'line', __line, '; buffer.length = ', buffer.length);
       var narrWebPageAsString = utilities_aq_viz.forceUnicodeEncoding(buffer.toString());
       trimmedNarrative = utilities_aq_viz.trimNarrative(narrWebPageAsString);
       narrativeUrlObject.longNarrative = trimmedNarrative;
       for (var j = 0; j < data.nodes.length; j++) {
       //nodeCounter++;
       node = data.nodes[j];
       // console.log( __filename, 'line', __line, '; node.id = ', node.id);
       if (narrativeUrlObject.id === node.id) {
       if (j < 5) {
       console.log(__filename, 'line', __line, '; narrativeUrl.id = ', narrativeUrlObject.id, ' === node.id = ', node.id, ' = ', 'narrativeUrl.id === node.id = ', narrativeUrlObject.id === node.id);
       }
       node.narrativeFileName = narrativeUrlsArray.narrativeFileName;
       }
       }
       narrCounter++;
       // Insert a single document
       }
       var narrativeUrlsArrayPathAndFileName = __dirname + '/../data/narrative_lists/narrativeUrlsArray.json';
       writeMyFile(narrativeUrlsArrayPathAndFileName, JSON.stringify(narrativeUrlsArray, null, ' '), fsOptions);
       //        var dataLocalFileNameAndPath = __dirname + '/../data/output/data-docs.json';
       //        writeMyFile(dataLocalFileNameAndPath, JSON.stringify(data, null, ' '), fsOptions);
       //        db.close();
       // });
       callback();
       },
       */

      /*
       // write intermediate data file for debugging
       function (callback) {
       var writeJsonPathAndFileName = writeJsonOutputDebuggingDirectory + 'AQList-L' + __line + '-collectedEachNarrativeFile.json';
       utilities_aq_viz.stringifyAndWriteJsonDataFile(data, writeJsonPathAndFileName);
       // var dataPath = __dirname + '/../data/output/data.json';
       utilities_aq_viz.stringifyAndWriteJsonDataFile(data, dataPath);
       callback();
       }
       /*
       // using links from data file, parse the narratives
       function (callback) {
       var longNarrativeFileNameMissing;
       var narrative;
       var narrCounter = 0;
       var responseString;
       var readFilePath;
       var node;
       var nodeNarrFileName;
       console.log('\n ', __filename, 'line', __line, '; function #2:', ++functionCount, '; ');
       // read the data file
       try {
       data = JSON.parse(fse.readFileSync(__dirname + '/../data/output/data.json'));
       } catch (err) {
       console.log('\n ', __filename, 'line', __line, '; Error: ', err);
       }
       var nodes = data.nodes;
       for (var ldi = 0; ldi < nodes.length; ldi++) {
       // narrCounter++;
       node = nodes[ldi];
       longNarrativeFileNameMissing = (typeof(node.narrativeFileName) === 'null' || typeof(node.narrativeFileName) === 'undefined');
       if (longNarrativeFileNameMissing) {
       console.log('\n ', __filename, 'line', __line, '; ldi = ', ldi, '; longNarrativeMissing = ', longNarrativeFileNameMissing, '\n node.narrativeFileName = ', node.narrativeFileName, '; node = ', node, '\n\n');
       node.narrativeFileName = utilities_aq_viz.generateNarrFileName(node);
       }

       nodeNarrFileName = node.narrativeFileName;
       readFilePath = __dirname + '/../data/narrative_summaries/' + nodeNarrFileName;
       try {
       narrative = fse.readFileSync(readFilePath, fsOptions);
       console.log('\n ', __filename, 'line', __line, '; getting file ldi = ', ldi, '; readFilePath = ', readFilePath, '\n narrative.substring(0, 300) = ', narrative.substring(0, 300), ' [INTENTIONALLY TRUNCATED TO FIRST 300 CHARACTERS]');
       } catch (err) {
       console.log('\n ', __filename, 'line', __line, '; Error: ', err);
       }

       // do something with the long narrative file

       }
       callback();
       },

       // write intermediate data file for debugging
       function (callback) {
       var writeJsonPathAndFileName = writeJsonOutputDebuggingDirectory + 'AQList-L' + __line + '-parsedNarratives.json';
       utilities_aq_viz.stringifyAndWriteJsonDataFile(data, writeJsonPathAndFileName);
       // var dataPath = __dirname + '/../data/output/data.json';
       utilities_aq_viz.stringifyAndWriteJsonDataFile(data, dataPath);
       callback();
       },

       // COUNT LINKS
       function (callback) {
       countLinksFromComments(data);
       if (consoleLog) {
       console.log('\n ', __filename, 'line', __line, '; function #:', ++functionCount, '; countLinks2');
       console.log('\n ', __filename, 'line', __line, '; data.nodes[1] = ', data.nodes[1]);
       }
       callback();
       },

       // CHECK TARGETS EXIST
       function (callback) {
       var nodes = data.nodes;
       var linksFromComments = data.linksFromComments;
       checkTargetsExist(nodes, linksFromComments);
       callback();
       },

       // number the nodes starting with zero; COUNT NODES, PRINT NODE IDS
       function (callback) {
       numberTheNodes(data);
       var nodeCounter = 0;
       data.nodes.forEach(function (node) {
       nodeCounter++;
       if (consoleLog && (nodeCounter % 17) === 1) {
       console.log(__filename, 'line', __line, '; node #', nodeCounter, 'node.id = ', node.id);
       }
       });
       callback();
       }
       /*
       // write intermediate data file for debugging
       function (callback) {
       var writeJsonPathAndFileName = writeJsonOutputDebuggingDirectory + 'AQList-L' + __line + '-numberedDataNodes.json';
       utilities_aq_viz.stringifyAndWriteJsonDataFile(data, writeJsonPathAndFileName);
       utilities_aq_viz.stringifyAndWriteJsonDataFile(data, dataPath);
       callback();
       },

       // which node has the most links?
       function (callback) {
       if (consoleLog) {
       console.log('\n ', __filename, 'line', __line, '; function #:', ++functionCount);
       console.log('\n ', __filename, 'line', __line, '; data.nodes[155] = ', data.nodes[155]);
       }
       counter = 0;
       var maxLinkCount = 0;
       var maxLinkId = '';
       data.nodes.forEach(function (node) {
       counter++;
       if (node.linksFromCommentsCount > maxLinkCount) {
       maxLinkCount = node.linksFromCommentsCount;
       maxLinkId = node.id;
       }
       });
       data.maxLinksFromComments = {'count': maxLinkCount, 'id': maxLinkId};
       //        data.maxLinks = null;
       //        data.maxLinks.count = maxLinkCount;
       //        data.maxLinks.id = maxLinkId;
       console.log('\n ', __filename, 'line', __line, '; counter = ', counter, '; maxLinkId = ', maxLinkId, '; maxLinkCount = ', maxLinkCount);
       counter = 0;
       data.linksFromComments.forEach(function (linkFromComments) {
       counter++;
       if (counter <= numObjectsToShow) {
       if (consoleLog) {
       console.log('\n ', __filename, 'line', __line, '; counter = ', counter, '; linkFromComments/varlink = ', linkFromComments);
       }
       }
       });
       callback();
       },

       // write intermediate data file for debugging
       function (callback) {
       var writeJsonPathAndFileName = writeJsonOutputDebuggingDirectory + 'AQList-L' + __line + '-whichNodeHasMostLinks.json';
       utilities_aq_viz.stringifyAndWriteJsonDataFile(data, writeJsonPathAndFileName);
       utilities_aq_viz.stringifyAndWriteJsonDataFile(data, dataPath);
       callback();
       },
       /*
       // stringify and write json data to local file
       function (callback) {
       if (consoleLog) {
       console.log('\n ', __filename, 'line', __line, '; function #:', ++functionCount, '; write clean json file');
       }
       // var writeJson = function () {
       try {
       var myFileNameAndPath = __dirname + '/../data/output/data.json';
       var stringifiedData = JSON.stringify(data, null, ' ');
       fse.writeFileSync(myFileNameAndPath, stringifiedData, fsOptions);
       if (consoleLog) {
       console.log(__filename, 'line', __line, ';  file written to: ', myFileNameAndPath, ';  file contained data = ', truncateString(data));
       }
       } catch (err) {
       console.log('\n ', __filename, 'line', __line, ';  Error: ', err);
       callback();
       }
       callback();
       }
       */

      /*
       // The UN list files omit some of the nodes.  In some cases, this appears to be an oversight.  In others, the node
       // is no longer on the sanctions list.  There may be other reasons for the omission as well.
       // If no narrative file name for a node could be found in the UN list files, we generate the expected file name
       // based an observed relationship between a given nodes id and its narrative file name.
       function (callback) {
       console.log('\n ', __filename, 'line', __line, '; function #:', ++functionCount, '; ');
       // var narrCounter = 0;
       // var dataPath = __dirname + '/../data/output/data.json';
       data = JSON.parse(fse.readFileSync(dataPath));
       var nodes = data.nodes;
       countUndefinedNarrativeFileNames(nodes);
       var node = null;
       // check if the node.narrativeFileName is defined for each node
       for (var ldi = 0; ldi < nodes.length; ldi++) {
       node = nodes[ldi];
       var narrativeFileNameIsMissing = (typeof(node.narrativeFileName) === 'null' || typeof(node.narrativeFileName) === 'undefined');
       //          if (typeof(node.narrativeFileName) === 'null' || typeof(node.narrativeFileName) === 'undefined') {
       if (narrativeFileNameIsMissing) {
       node.narrativeFileName = utilities_aq_viz.generateNarrFileName(node);
       console.log('\n ', __filename, 'line', __line, '; Generated narrative file name for node.id = ', node.id, '; ldi = ', ldi, '; node.name = ', node.name, '; node.noLongerListed = ', node.noLongerListed);
       }
       }
       var writeJsonPathAndFileName = writeJsonOutputDebuggingDirectory + 'AQListL-' + __line + '-addedNarrativeFileNames.json';
       utilities_aq_viz.stringifyAndWriteJsonDataFile(data, writeJsonPathAndFileName);
       // writeJsonPathAndFileName = writeJsonOutputFilePath + 'data.json';
       utilities_aq_viz.stringifyAndWriteJsonDataFile(data, dataPath);
       callback();
       },
       /*
       // number the narrative links
       function (callback) {
       if (consoleLog) {
       console.log(__filename, __line, '; function #:', ++functionCount);
       }
       var counter = 0;
       narrativeUrlsArray.forEach(function (narrativeUrl) {
       narrativeUrl.narrativeNumber = counter;
       counter++;
       });
       callback();
       }


       /*
       // collect the narrative files form the UN web site
       // using file names from nodes array in the 'data' variable (loaded from local file AQList-clean ....json),
       // collect the extended narratives from the Internet and save as local files.
       // If no narrative file name listed in the list found on the U.N. site, generate the file name based the pattern that
       // infers that the narrative file name can be deduced from the node id.
       // using file names from nodes array in AQList-clean ....json, collect the extended narratives from the Internet and save as local files.
       function (callback) {
       console.log( __filename,'line', __line,'; function #4:', ++functionCount, '; ');
       narrCounter = 0;
       var narrativeFile = '';
       var mainContent = '';
       var nodes = data.nodes;
       var node;
       var collectNarrativeFileNameAndPath;
       var collectAndSaveLocallyNarrativePagesErrorsCount = 0;
       var writeNarrativeFileNameAndPath;
       //        for (var ldi = 0; ldi < nodes.length; ldi++) {
       for (var ldi = 0; ldi < Math.min(nodes.length, debugWithFewerNodesCount); ldi++) {
       // narrCounter++;
       node = nodes[ldi];
       collectNarrativeFileNameAndPath = 'http://www.un.org/sc/committees/1267/' + node.
       narrativeFileName;
       writeNarrativeFileNameAndPath = __dirname +
       '/../data/narrative_summaries/' + node.narrativeFileName;
       try {
       syncGetRawHtmlNarrativePages(collectNarrativeFileNameAndPath, writeNarrativeFileNameAndPath);
       } catch (err) {
       console.log(__filename, 'line', __line, '; Error: ', err, '; collectAndSaveLocallyNarrativePagesErrorsCount =  ',
       collectAndSaveLocallyNarrativePagesErrorsCount++, '; collectNarrativeFileNameAndPath  = ', collectNarrativeFileNameAndPath , '; saveFilePath = ', writeNarrativeFileNameAndPath);
       }
       if (ldi < 5) {
       //            console.log( __filename, 'line', __line, '; narrativeFile = ', narrativeFile);
       //            console.log('\n ', __filename, 'line', __line,
       //             '; mainContent = ',
       //            mainContent);
       }
       }
       //    console.log('\n ', __filename, 'line', __line, '; errors = ', errors,
       //      '; nodes.length = ', nodes.length, '; narrCounter = ',
       //      narrCounter);
       callback();
       },

       function (callback) {
       if (consoleLog) {
       console.log(__filename, __line, '; function 3#:', ++functionCount);
       }

       var narrativeUrlsArrayStringified = JSON.stringify(narrativeUrlsArray, null, ' ');
       writeMyFile(narrativeUrlsArrayLocalFileNameAndPath, JSON.stringify(narrativeUrlsArray, null, ' '), fsOptions);
       // console.log( __filename, __line, '; wrote file: ', narrativeUrlsArrayLocalFileNameAndPath);
       callback(null, JSON.stringify(narrativeUrlsArray, null, ' '));
       }
       */
    ],
    function (err) {
      // if (consoleLog) { console.log( __filename, 'line', __line, ' wroteJson = ', trunc.n400(myResult));
      if (err) {
        console.log(__filename, 'line', __line, ' Error: ' + err);
      }
    }
  )
  ;
};
/*
 var getXMLFile = function () {
 var fileNameToWriteTo = __dirname + '/../data/output/AQList.xml';
 re.get('http://www.un.org/sc/committees/1267/AQList.xml', fileNameToWriteTo, function (error, filename) {
 if (error) {
 console.log( __filename, 'line', __line, '; Error \n' + error);
 }
 if (consoleLog) {
 console.log( __filename, 'line', __line, '; wrote content to: \n', filename);
 }
 });
 };
 */

var syncWriteFileAQListXML = function (data, localFileNameAndPath) {
//  var myFile = __dirname + '/../data/output/AQList.xml';
  try {
//    fse.writeFileSync(localFileNameAndPath, AQList_xml, fsOptions);
    fse.writeFileSync(localFileNameAndPath, data, fsOptions);
    if (consoleLog) {
      console.log(__filename, 'line', __line, '; data written to: ', localFileNameAndPath);
      console.log(__filename, 'line', __line, '; file contained: ', data.toString().substring(0, 300)); ///, false, null).trunc(truncateToNumChars));
    }
  } catch (err) {
    console.log(__filename, 'line', __line, ' Error: ', err);
  }
  if (consoleLog) {
    console.log(__filename, 'line', __line, ' AQList_xml = \n', trunc.n400(AQList_xml.toString()));
  }
};

//var getListOfNarratives = function () {
//async.series([],
/*
 function (err, results) { //This function gets called after the foregoing tasks have called their 'task callbacks'
 if (err) {
 console.log( __filename, 'line: ', __line, ' Error: ', err);
 } else {
 console.log( __filename, 'line: ', __line, '; function:', ++functionCount, 'results.length = ', results.length, '; results.toString().substring(0,', narrListSubstringLength, ') = ', results.toString().substring(0, narrListSubstringLength), '[FILE LOG OUTPUT INTENTIONALLY TRUNCATED]');
 }
 });
 };
 */

var responseBody;
// parse the html narrative list files
// put html file names in narrativeUrlsArray
// write to json file: narrativeUrlsArrayLocalFileNameAndPath

var syncParseHtmlListPage = function (htmlString, indivOrEntityString) {

  if (utilities_aq_viz.errorPageReturned(htmlString)) {
    console.log(__filename, ' line ', __line, 'Error: PageNotFoundError; Server returned: Error: Page Not Found');
    throw {
      name: 'PageNotFoundError',
      message: '; Server returned: ' + responseBody.match('Error: Page Not Found')
    }
  }
  // re 'handler', see the following lines below:
  //   var parser = new htmlparser.Parser(handler);
  //   parser.parseComplete(responseBody);

  var handler = new htmlparser.DefaultHandler(function (err, dom) {
    if (err) {
      console.log(__filename, 'line', __line, 'Error: ' + err);
    } else {
      // soupselect happening here...
      // var titles = select(dom, 'a.title');
      rows = select(dom, 'table tr');
      var rowNum;
      // loop through each table row
      var narrLink;
      for (var i = 0; i < rows.length; i++) {
        // skip the header row
        if (i === 0) {
          continue;
        }
        rowNum = i;
        row = rows[i];
        // sys.puts('row[' + i + '] = ' + sys.inspect(JSON.stringify(row)));
        narrLink = {};
        tds = select(row, 'td');
        // loop through each td/column in the row
        for (var j = 0; j < tds.length; j++) {
          td = tds[j];
          // get the id from the first td
          if (j === 0) {
            paragraph = select(td, 'p');
            if (typeof paragraph !== 'undefined') {
              try {
                if (typeof paragraph[0] !== 'undefined') {
                  narrLink.id = getCleanId(paragraph[0].children[0].data);
                }
              } catch (err) {
                console.log(__filename, 'line', __line, ' Error parsing id: ', err);
              }
            }
          }
          // if we are in the second td in the row...
          else if (j === 1) {
            paragraph = select(td, 'p');
            anchor = select(td, 'a');

            if (typeof paragraph !== 'undefined' && typeof paragraph[0] !== 'undefined') {
              //console.log( __filename, 'line', __line, 'paragraph = ', JSON.stringify(paragraph));
              if (typeof paragraph[0].children[0].attribs !== 'undefined') {
                try {
                  narrativeFileName = paragraph[0].children[0].attribs.href;
                  narrativeFileName = normalizeNarrativeFileName(narrativeFileName); //.replace(/\/sc\/committees\/1267\/(NSQ.*\.shtml)/, '$1');
                  // narrativeFileName = narrativeFileName.replace(/http:\/\/dev.un.org\/sc\/committees\/1267\/(NSQ.*\.shtml)/, '$1');
                  // http://dev.un.org/sc/committees/1267/
                  narrLink.narrativeFileName = narrativeFileName;
                } catch (err) {
                  console.log(__filename, 'line', __line, '; paragraph[0].children[0] = ', paragraph[0].children[0]);
                  console.log(__filename, 'line', __line, '; Error: paragraph[0].children[0].attribs is undefined; tr = ', i, '; td = ', j, err);
                }
              } else if (typeof anchor[0].attribs.href !== 'undefined') {
                narrLink.narrativeFileName = normalizeNarrativeFileName(narrativeFileName);
                narrLink.targetName = JSON.stringify(anchor[0].children[0].data);
              } else {
                narrLink.narrativeFileName = 'PLACEHOLDER0';
                console.log(__filename, 'line', __line, '; Error: narrativeFileName for tr = ', i, '; td = ', j, 'is PLACEHOLDER0');
              }
              // if anchor inside of paragraph
              if (anchor[0].children[0].data !== 'u') {
                targetName = anchor[0].children[0].data;
              } else if (anchor[0].children[0].data === 'u') {
                underscore = select(td, 'u');
                targetName = JSON.stringify(underscore[0].children[0].data);
              } else {
                targetName = 'PLACEHOLDER1';
              }
              targetName = targetName.replace(/[\n\f\r\t]/gm, '');
              targetName = targetName.replace(/\s\s+/gm, ' ');
              targetName = targetName.trim();
              if (targetName === '') {
                narrLink.targetName = 'PLACEHOLDER2';
              } else {
                narrLink.targetName = targetName;
              }
              // end of if (typeof paragraph !== 'undefined' && typeof paragraph[0] !== 'undefined')
            } else if (typeof anchor[0].attribs.href !== 'undefined' && anchor[0].attribs.href !== '') {
              narrativeFileName = normalizeNarrativeFileName(anchor[0].attribs.href);
              narrLink.narrativeFileName = narrativeFileName;
              if (typeof anchor[0].children[0] !== 'undefined' && anchor[0].children[0].data !== '') {
                targetName = anchor[0].children[0].data;
                narrLink.targetName = targetName;
              }
            }
          }
        }
        narrLink.indivOrEntityString = indivOrEntityString;
        narrLink.rowNum = i;
        if (indivOrEntityString === 'indiv') {
          indivLinks.push(narrLink);
        }
        if (indivOrEntityString === 'entity') {
          entLinks.push(narrLink);
        }
        narrLink.urlNum = narrativeUrlsArray.length + 1;
        narrativeUrlsArray.push(narrLink);
      }
    }
  });

  var parser = new htmlparser.Parser(handler);
  parser.parseComplete(htmlString);
  if (indivOrEntityString === 'indiv') {
    writeMyFile(individualsLocalOutputFileNameAndPath, JSON.stringify(indivLinks, null, ' '), fsOptions);
  }
  if (indivOrEntityString === 'entity') {
    writeMyFile(entitiesLocalOutputFileNameAndPath, JSON.stringify(entLinks, null, ' '), fsOptions);
  }
  writeMyFile(narrativeUrlsArrayLocalFileNameAndPath, JSON.stringify(narrativeUrlsArray, null, ' '), fsOptions);
};

var syncGetRawHtmlListPages = function (listUrl, outputFileNameAndPath, indivOrEntityString) {
  // var host = 'www.un.org';
//  var urlPath = 'http://www.un.org/sc/committees/1267/';
//  var getUrl = urlPath + fileName;
  if (utilities_aq_viz.validateUrl(listUrl) !== true) {
    throw {
      name: 'InvalidUrlError',
      message: 'URL failed to pass validation'
    }; // new Error();
  }
  // var responseBody;
  try {
    var res = requestSync('GET', listUrl);
    responseBody = res.body.toString();
  } catch (err) {
    console.log('\n ', __filename, 'line', __line, '; Error: ', err);
    // AQList_xml = fse.readFileSync(backupRawXmlFileName, fsOptions); //, function (err, data) {
  }

  if (errorPageReturned(responseBody)) {
    throw {
      name: 'Page not found error',
      message: responseBody.match('Error: Page Not Found')
    }
  }
  // re 'handler', see the following lines below:
  //   var parser = new htmlparser.Parser(handler);
  //   parser.parseComplete(responseBody);

  var handler = new htmlparser.DefaultHandler(function (err, dom) {
    if (err) {
      console.log(__filename, 'line', __line, 'Error: ' + err);
    } else {
      // soupselect happening here...
      // var titles = select(dom, 'a.title');
      rows = select(dom, 'table tr');
      var rowNum;
      // loop through each table row
      var narrLink;
      for (var i = 0; i < rows.length; i++) {
        // skip the header row
        if (i === 0) {
          continue;
        }
        rowNum = i;
        row = rows[i];
        // sys.puts('row[' + i + '] = ' + sys.inspect(JSON.stringify(row)));
        narrLink = {};
        tds = select(row, 'td');
        // loop through each td/column in the row
        for (var j = 0; j < tds.length; j++) {
          td = tds[j];
          // get the id from the first td
          if (j === 0) {
            paragraph = select(td, 'p');
            if (typeof paragraph !== 'undefined') {
              try {
                if (typeof paragraph[0] !== 'undefined') {
                  narrLink.id = getCleanId(paragraph[0].children[0].data);
                }
              } catch (err) {
                console.log(__filename, 'line', __line, ' Error parsing id: ', err);
              }
            }
          }
          // if we are in the second td in the row...
          else if (j === 1) {
            paragraph = select(td, 'p');
            anchor = select(td, 'a');

            if (typeof paragraph !== 'undefined' && typeof paragraph[0] !== 'undefined') {
              //console.log( __filename, 'line', __line, 'paragraph = ', JSON.stringify(paragraph));
              if (typeof paragraph[0].children[0].attribs !== 'undefined') {
                try {
                  narrativeFileName = paragraph[0].children[0].attribs.href;
                  narrativeFileName = normalizeNarrativeFileName(narrativeFileName); //.replace(/\/sc\/committees\/1267\/(NSQ.*\.shtml)/, '$1');
                  // narrativeFileName = narrativeFileName.replace(/http:\/\/dev.un.org\/sc\/committees\/1267\/(NSQ.*\.shtml)/, '$1');
                  // http://dev.un.org/sc/committees/1267/
                  narrLink.narrativeFileName = narrativeFileName;
                } catch (err) {
                  console.log(__filename, 'line', __line, '; paragraph[0].children[0] = ', paragraph[0].children[0]);
                  console.log(__filename, 'line', __line, '; Error: paragraph[0].children[0].attribs is undefined; tr = ', i, '; td = ', j, err);
                }
              } else if (typeof anchor[0].attribs.href !== 'undefined') {
                narrLink.narrativeFileName = normalizeNarrativeFileName(narrativeFileName);
                narrLink.targetName = JSON.stringify(anchor[0].children[0].data);
              } else {
                narrLink.narrativeFileName = 'PLACEHOLDER0';
                console.log(__filename, 'line', __line, '; Error: narrativeFileName for tr = ', i, '; td = ', j, 'is PLACEHOLDER0');
              }
              // if anchor inside of paragraph
              if (anchor[0].children[0].data !== 'u') {
                targetName = anchor[0].children[0].data;
              } else if (anchor[0].children[0].data === 'u') {
                underscore = select(td, 'u');
                targetName = JSON.stringify(underscore[0].children[0].data);
              } else {
                targetName = 'PLACEHOLDER1';
              }
              targetName = targetName.replace(/[\n\f\r\t]/gm, '');
              targetName = targetName.replace(/\s\s+/gm, ' ');
              targetName = targetName.trim();
              if (targetName === '') {
                narrLink.targetName = 'PLACEHOLDER2';
              } else {
                narrLink.targetName = targetName;
              }
              // end of if (typeof paragraph !== 'undefined' && typeof paragraph[0] !== 'undefined')
            } else if (typeof anchor[0].attribs.href !== 'undefined' && anchor[0].attribs.href !== '') {
              narrativeFileName = normalizeNarrativeFileName(anchor[0].attribs.href);
              narrLink.narrativeFileName = narrativeFileName;
              if (typeof anchor[0].children[0] !== 'undefined' && anchor[0].children[0].data !== '') {
                targetName = anchor[0].children[0].data;
                narrLink.targetName = targetName;
              }
            }
          }
        }
        narrLink.indivOrEntityString = indivOrEntityString;
        narrLink.rowNum = i;
        if (indivOrEntityString === 'indiv') {
          indivLinks.push(narrLink);
        }
        if (indivOrEntityString === 'entity') {
          entLinks.push(narrLink);
        }
        narrLink.urlNum = narrativeUrlsArray.length + 1;
        narrativeUrlsArray.push(narrLink);
      }
    }
  });

  var parser = new htmlparser.Parser(handler);
  parser.parseComplete(responseBody);
  if (indivOrEntityString === 'indiv') {
    writeMyFile(individualsLocalOutputFileNameAndPath, JSON.stringify(indivLinks, null, ' '), fsOptions);
  }
  if (indivOrEntityString === 'entity') {
    writeMyFile(entitiesLocalOutputFileNameAndPath, JSON.stringify(entLinks, null, ' '), fsOptions);
  }
  writeMyFile(narrativeUrlsArrayLocalFileNameAndPath, JSON.stringify(narrativeUrlsArray, null, ' '), fsOptions);
};

var countUndefinedNarrativeFileNames = function (nodes) {
  var nullCount = 0;
  var undefinedCount = 0;
  var node;
  for (var ldi = 0; ldi < nodes.length; ldi++) {
    node = nodes[ldi];
    if (typeof(node.narrativeFileName) === 'null') {
      nullCount++;
      continue;
    }
    if (typeof(node.narrativeFileName) === 'undefined') {
      undefinedCount++;
    }
  }
  console.log('\n\n ', __filename, 'line: ', __line, '; nullCount = ', nullCount, '; undefinedCount = ', undefinedCount, '; nodes.length = ', nodes.length, '\n\n');

  logger.log_message([__filename, 'line: ', __line, '; nullCount = ', nullCount, '; undefinedCount = ', undefinedCount, '; nodes.length = ', nodes.length, '\n\n'].join(''));
};

function trimNarrative(narrWebPageString) {
  var narrative1 = narrWebPageString.replace(/([\r\n\t])/gm, ' ');
  var narrative2 = narrative1.replace(/(\s{2,})/gm, ' ');
  return narrative2.replace(/<!DOCTYPE HTML PUBLIC.*MAIN CONTENT BEGINS(.*?)TemplateEndEditable.*<\/html>/mi, '$1');

}

var normalizeNarrativeFileName = function (narrativeFileNameString) {
  // console.log( __filename, __line, '; narrativeFileNameString = ', narrativeFileNameString);
  var narrativeFileName1 = narrativeFileNameString.replace(/http:\/\/dev.un.org\/sc\/committees\/1267\/(NSQ.*\.shtml)/, '$1');
  // var narrativeFileName1 = narrativeFileNameString.replace(/http:\/\/dev.un.org(\/sc\/committees\/1267\/NSQ.*\.shtml)/, '$1');
  // console.log( __filename, __line, '; narrativeFileName1 = ', narrativeFileName1);
  var narrativeFileName2 = narrativeFileName1.replace(/\/sc\/committees\/1267\/(NSQ.*\.shtml)/, '$1');
  return narrativeFileName2;
};

var cleanUpIds = function (nodes) {
  counter = 0;
  nodes.forEach(function (node) {
    counter++;
    // var rawRefNum = node.REFERENCE_NUMBER;
    // remove period from end of all reference numbers that have them; not all do.
    var refNumRegexMatch;
    try {
      refNumRegexMatch = (node.REFERENCE_NUMBER).match(/(Q[IE]\.[A-Z]\.\d{1,3}\.\d{2})/);
    } catch (error) {
      if (consoleLog) {
        console.log(__filename, 'line', __line, '; Error: ', error, '; node =', node, '; counter = ', counter);
      }
    }
    //  clean up indiv id for consistency;  none should have trailing period.
    node.id = refNumRegexMatch[1].trim();
    if ((node.REFERENCE_NUMBER).match(/(Q[IE]\.[A-Z]\.\d{1,3}\.\d{2})/)[1].trim() !== node.id) {
      throw 'id error';
    }
    // for consistency, remove period from end of all reference numbers that have them; not all do.
    if (counter <= numObjectsToShow) {
      if (consoleLog) {
        console.log(__filename, 'line', __line, '; counter = ', counter, '; node.id = ', node.id);
//        console.log( __filename, 'line', __line, '; counter = ', counter, '; node with ids', node);
      }
    }
  });
};
var createIndivAliasString = function (singleAlias) {
  var aliasString, aliasName, aliasQuality; // = '';
  aliasName = singleAlias.ALIAS_NAME;
  aliasQuality = singleAlias.QUALITY;
  aliasString = aliasName + ' (' + aliasQuality + ')';
  return aliasString;
};

// some REFERENCE_NUMBERs in the source xml (including those in comments) have periods at the end; some don't; we remove all trailing periods for consistency.
var cleanUpRefNums = function (nodes) {
  counter = 0;
  nodes.forEach(function (node) {
    counter++;
    // var rawRefNum = node.REFERENCE_NUMBER.trim();
    // for consistency, remove period from end of all reference numbers that have them; not all do.
    var refNumRegexMatch;
    try {
      refNumRegexMatch = (node.REFERENCE_NUMBER).match(/(Q[IE]\.[A-Z]\.\d{1,3}\.\d{2})/);
    } catch (error) {
      console.log(__filename, 'line', __line, '; Error: ', error, '; node =', node, '; counter = ', counter);
    }
    try {
      node.REFERENCE_NUMBER = refNumRegexMatch[0].trim();
    } catch (err) {

    }
    if (counter <= numObjectsToShow) {
      if (consoleLog) {
        console.log(__filename, 'line', __line, '; counter = ', counter, '; node.REFERENCE_NUMBER = ', node.REFERENCE_NUMBER);
      }
    }
  });
};

// create an array of links within each entity/indiv containing ids of related parties
var addLinksArrayFromComments = function (nodes) {
  var comments;
  var linkRegexMatch;
  data.nodes.forEach(function (node) {
    node.linkedIds = [];
    comments = node.COMMENTS1;
    if ((typeof comments != 'undefined') && (typeof comments.match(/(Q[IE]\.[A-Z]\.\d{1,3}\.\d{2})/gi) != 'undefined')) {
      linkRegexMatch = comments.match(/(Q[IE]\.[A-Z]\.\d{1,3}\.\d{2})/gi);
      // if (consoleLog) { console.log('91 linkRegexMatch = ', linkRegexMatch);
      if ((typeof(linkRegexMatch) !== 'undefined') && (linkRegexMatch !== null)) {
        for (var n = 0; n < linkRegexMatch.length; n++) {
          if (node.id === linkRegexMatch[n].trim()) {
            // don't include a link from a node to itself
            if (consoleLog) {
              console.log('node id error' + node.id + ' ===  ' + linkRegexMatch[n].trim());
              throw 'node links to itself error';
            }
          } else {
            node.linkedIds.push(linkRegexMatch[n].trim());
          }
        }
      }
    }
  });
};

// legacy method
// create an array, connectedToId[], of linked-to ids in each node;
// create link objects for each link (source and target ids) and insert in each node
var addConnectionIdsArrayFromComments = function (nodes) {
  // throw commenterror;
  var loopStop;
  var comments;
  var linkRegexMatch;
  counter = 0;
  nodes.forEach(function (node) {
    node.connectionIdsFromCommentsSet = new Set();
    node.connectedToIdFromCommentsArray = [];
    node.linksFromComments = [];
    node.linksFromCommentsSet = new Set();
    comments = node.COMMENTS1;

    var weHaveCommentsToParse = ((typeof comments !== 'null') && (typeof comments !== 'undefined') &&
    (typeof comments.match(/(Q[IE]\.[A-Z]\.\d{1,3}\.\d{2})/gi) !== 'undefined'));

    // if ((typeof comments !== 'undefined') && (typeof comments.match(/(Q[IE]\.[A-Z]\.\d{1,3}\.\d{2})/gi) !== 'undefined')) {
    if (weHaveCommentsToParse === true) {
      linkRegexMatch = comments.match(/(Q[IE]\.[A-Z]\.\d{1,3}\.\d{2})/gi);
      if (linkRegexMatch !== null) {
        if (consoleLog & counter < 40) {
          console.log(__filename, 'line', __line, '; counter = ', counter, '; node.id = ', node.id,
            '; node.name = ', node.name, '; has ', linkRegexMatch.length, 'link regex matches');
        }
        // LOOP THROUGH EACH REGEX MATCH
        for (var linkFromCommentNumber = 0; linkFromCommentNumber < linkRegexMatch.length; linkFromCommentNumber++) {
          if (linkRegexMatch[linkFromCommentNumber] !== node.id) {
            loopStop = false;

            node.connectionIdsFromCommentsSet.add(linkRegexMatch[linkFromCommentNumber]);
          }
        }
        node.connectionIdsFromCommentsSet.forEach(function (uniqueConnectionIdFromComments) {

          node.connectedToIdFromCommentsArray.push(uniqueConnectionIdFromComments);
          node.linksFromComments.push(uniqueConnectionIdFromComments);
        });
      }
      if (consoleLog) {
        if (counter % 17 === 0) {
          console.log(__filename, 'line', __line, '; counter = ', counter, '; node.id = ', node.id, '; node.name = ', node.name, '; has node.connectionIdsFromCommentsSet set: ', node.connectionIdsFromCommentsSet);
        }
      }
      counter++;
    } else {
      console.log(__filename, 'line', __line, '; counter = ', counter, '; node.id = ', node.id, '; node.name = ', node.name, '; has no comments to parse; node.COMMENTS1 = ', node.COMMENTS1);
    }
  });
};

// within each NODE, create array of connection objects with source and target
var addConnectionObjectsArrayFromComments = function (nodes) {
// for each node
  var connectionFromComments;
  counter = 0;
  nodes.forEach(function (node) {
    // counter ++;
    node.connectionsFromComments = [];
    var weHaveNodeConnectedToIdFromCommentsToParse = ((typeof node.connectedToIdFromCommentsArray !== 'null') && (typeof node.connectedToIdFromCommentsArray !== 'undefined'));
    if (weHaveNodeConnectedToIdFromCommentsToParse === true) {
      node.connectedToIdFromCommentsArray.forEach(function (connId) {
        if (node.id !== connId) {
          connectionFromComments = {};
          connectionFromComments.source = node.id;
          connectionFromComments.target = connId;
          node.connectionsFromComments.push(connectionFromComments);
        }
        if (consoleLog) {
          if (counter < 10) {
            console.log(__filename, 'line', __line, '; counter++ = ', counter++, '; node.id = ', node.id, '; connectionFromComments = ', connectionFromComments);
          }
        }
      });
    }

  });
};

var concatNames = function (nodes) {
  counter = 0;
  nodes.forEach(function (node) {
    counter++;
    var name = '';
    var nameArray = [];
    var firstName = node.FIRST_NAME;
    var secondName = node.SECOND_NAME;
    var thirdName = node.THIRD_NAME;
    var fourthName = node.FOURTH_NAME;

    nameArray.push(node.FIRST_NAME);
    nameArray.push(node.SECOND_NAME);
    nameArray.push(node.THIRD_NAME);
    nameArray.push(node.FOURTH_NAME);
    var nameFromArray = nameArray.join(' ');

    if (firstName) {
      name = name.concat(firstName.trim());
    }
    if (secondName) {
      name = name.concat(' ', secondName.trim());
    }
    if (thirdName) {
      name = name.concat(' ', thirdName.trim());
    }
    if (fourthName) {
      name = name.concat(' ', fourthName.trim());
    }
    node.name = name.trim();
    if (counter <= 10) {
      if (consoleLog) {
        console.log(__filename, 'line', __line, '; node.name = ', node.name, 'nameFromArray = ', nameFromArray);
      }
    }
  });
};

var createNationality = function (nodes) {
  counter = 0;
  nodes.forEach(function (node) {
    counter++;
    if (typeof node.NATIONALITY !== 'undefined') {
      var nationality = node.NATIONALITY;
      if (typeof nationality.VALUE !== 'undefined') {
        node.natnlty = nationality.VALUE;
      }
    }
  });
};

// consolidate links; remove duplicates, BUT DOES IT REALLY?
// create a top-level array of links containing a source and target
var consolidateLinksFromComments = function (data) {
  // if (consoleLog) { console.log( __filename, 'line',__line, '; data = ', data);
  if (consoleLog) {
    console.log(__filename, 'line', __line, '; data.nodes[0] = ', data.nodes[0]);
    console.log(__filename, 'line', __line, '; data.nodes[1] = ', data.nodes[1]);
  }
  data.linksFromComments = [];
  var linksFromCommentsSet = new Set();
  // var linksMap = new Map();
  // var mapCounter = 1;
  var connectionsFromCommentsCount = 0;
  (data.nodes).forEach(function (node) {
    if ((typeof node.connectionsFromComments !== 'undefined') && (typeof node.connectionsFromComments.length !== 'undefined') && (node.connectionsFromComments.length > 0)) {
      connectionsFromCommentsCount = connectionsFromCommentsCount + node.connectionsFromComments.length;
      node.connectionsFromComments.forEach(function (conn) {
        if (linksFromCommentsSet.add(conn) === true) {
          data.linksFromComments.push(conn);
        }
      });
    }
  });
  if (consoleLog) {
    console.log(__filename, 'line', __line, '; connectionsFromCommentsCount = ', connectionsFromCommentsCount, '; linksFromCommentsSet.count = ', linksFromCommentsSet.count);
  }
  linksFromCommentsSet = null;
};

// count the unique links for each node
var countLinksFromComments = function (data) {
  data.nodes.forEach(function (node) {
    var linkFromCommentCounter = 0;
    var keySet = new Set();
    var keyAdded1, keyAdded2;
    var linkConcatKey1, linkConcatKey2;

    var weHaveDataLinksFromCommentsToParse = ((typeof data.linksFromComments !== 'null') && (typeof data.linksFromComments !== 'undefined'));

    if (weHaveDataLinksFromCommentsToParse === true) {
      data.linksFromComments.forEach(function (linkFromComment) {
        // delete a link if source and target are the same
        if (linkFromComment.source === linkFromComment.target) {
          delete linkFromComment;
          console.log(__filename, 'line', __line, 'deleted linkFromComment = ', linkFromComment, ' because linkFromComment.source === linkFromComment.target');
        } else {
          if (node.id === linkFromComment.source || node.id === linkFromComment.target) {
            linkConcatKey1 = linkFromComment.source + linkFromComment.target;
            linkConcatKey2 = linkFromComment.target + linkFromComment.source;
            keyAdded1 = keySet.add(linkConcatKey1);
            keyAdded2 = keySet.add(linkConcatKey2);
            if (keyAdded1 && keyAdded2) {
              linkFromCommentCounter++;
            }
          }
        }
      });
    }
    node.linkFromCommentCounter = linkFromCommentCounter;
  });
};
var checkTargetsExist = function (nodes, linksFromComments) {
  var nodeTargetIdsFromCommentsSet = new Set();
  nodes.forEach(function (node) {
    node.connectedToIdFromCommentsArray.forEach(function (connectionIdFromComments) {
      nodeTargetIdsFromCommentsSet.add(connectionIdFromComments);
    })
  });
  if (consoleLog) {
    console.log(__filename, 'line', __line, '; the number of unique target / link nodes is ', nodeTargetIdsFromCommentsSet.count);
  }
  linksFromComments.forEach(function (linkFromComment) {
    if (nodeTargetIdsFromCommentsSet.exists(linkFromComment.target)) {
      if (consoleLog) {
        console.log(__filename, 'line', __line, '; ', linkFromComment.target, ' exists.');
      }
    } else {
      // if (consoleLog) {
      console.log(__filename, 'line', __line, ', linkFromComment.target: ', linkFromComment.target, ' DOES NOT EXIST.');
      // }
      throw 'missing target error';
    }
  });
};
var createIndivDateOfBirthString = function (d) {
  var dateString = '',
    rawDateString;
  if (typeof d['INDIVIDUAL_DATE_OF_BIRTH']['DATE'] !== 'undefined' && d['INDIVIDUAL_DATE_OF_BIRTH']['DATE'] !== '') {
    rawDateString = formatDate(d['INDIVIDUAL_DATE_OF_BIRTH']['DATE']);
    dateString += vizFormatDateSetup(rawDateString);
  } else if (typeof d['INDIVIDUAL_DATE_OF_BIRTH']['YEAR'] !== 'undefined') {
    dateString += d['INDIVIDUAL_DATE_OF_BIRTH']['YEAR'];
  }
  if (typeof d['INDIVIDUAL_DATE_OF_BIRTH']['TYPE_OF_DATE'] !== 'undefined' && d['INDIVIDUAL_DATE_OF_BIRTH']['TYPE_OF_DATE'] !== '') {
    dateString += ' (' + d['INDIVIDUAL_DATE_OF_BIRTH']['TYPE_OF_DATE'] + ')';
  }
  return dateString;
};

/*
 var stringifyAndWriteJsonDataFile = function (data, fileName) {
 try {
 var myFile = __dirname + '/../data/output/' + fileName;
 var stringifiedData = JSON.stringify(data, null, ' ');
 fse.writeFileSync(myFile, stringifiedData, fsOptions);
 if (consoleLog) {
 console.log( __filename, 'line', __line, '; utilities_aq_viz.writeJsonFile() wrote file to: ', myFile, ';  file contained (truncated): ', stringifiedData.substring(0, 400), ' ... [CONSOLE LOG OUTPUT INTENTIONALLY TRUNCATED TO FIRST 400 CHARACTERS]\n\n');
 }
 } catch (err) {
 if (consoleLog) {
 console.log( __filename, 'line', __line, ';  Error: ', err);
 }
 }
 };
 */
var createDateGeneratedMessage = function () {
  var dateAqListGeneratedString = data.dateGenerated;
  var dateAqListGenerated = new Date(dateAqListGeneratedString);
  dateFormat.masks.shortDate = 'mm-dd-yyyy';
  dateFormat.masks.friendly_display = 'dddd, mmmm dS, yyyy';
  generatedFileDateString = vizFormatDateSetup(dateAqListGenerated);
  var message = 'Collected AQList.xml labeled as generated on: ' + dateAqListGeneratedString + ' [' + dateAqListGenerated + ']';
  data.message = message;
  logger.log_message([__filename, ' line ', __line + '; ', message].join(''));
};

var createIndivPlaceOfBirthString = function (singlePob) {
  var pobString = '';
  if (typeof singlePob !== 'undefined' && singlePob !== '') {
    var keys = getKeys(singlePob);
    keys.forEach(function (key) {
        if (typeof singlePob[key] !== 'undefined' && singlePob[key] !== '') {
          pobString += singlePob[key];
          pobString += ', ';
        }
      }
    );
  }
  return pobString;
};

// for DOB, etc.
var formatDate = function (intlDateString) {
  var dateResultString;
  var date = new Date(intlDateString);
  dateFormat.masks.shortDate = 'mm-dd-yyyy';
  try {
    dateResultString = dateFormat(date, 'shortDate');
  } catch (err) {
    console.log('769 Error: ', err, '; intlDateString = ', intlDateString);
  }
  // logger.log_message(__filename + ' line ' + __line + '; ' + dateResultString);
  return dateResultString;
};

//  clean up ids for consistency;  none should have trailing period.
var getCleanId = function (referenceNumber) {
  var refNumRegexMatch;
  try {
    refNumRegexMatch = referenceNumber.match(/(Q[IE]\.[A-Z]\.\d{1,3}\.\d{2})/);
  } catch (err) {
    console.log(__filename, 'line', __line, '; Error: ', err, '; referenceNumber =', referenceNumber, '; counter = ', counter);
  }
  return refNumRegexMatch[0].trim();
};

var getKeys = function (pob) {
  var keys = [];
  for (var key in pob) {
    keys.push(key);
//    console.log('pob[key] = ', pob[key]); //, '; pob[value]', pob.valueOf(key));
  }
  return keys;
};

// number the nodes starting with zero
var numberTheNodes = function (data) {
  counter = 0;
  data.nodes.forEach(function (node) {
    node.nodeNumber = counter;
    counter++;
  });
};

var processDateUpdatedArray = function (d) {
  var dateUpdatedArrayString = '';
  if (typeof d['LAST_DAY_UPDATED'] === 'undefined') {
    d.lastDateUpdatedCount = 0;
    //  return '';
  } else if (Object.prototype.toString.call(d['LAST_DAY_UPDATED']['VALUE']) === '[object Array]') {
    // console.log( __filename, 'line', __line, '; processDateUpdatedArray() found  Array!', d['LAST_DAY_UPDATED']);
    var lastDateUpdatedArray = d['LAST_DAY_UPDATED']['VALUE'];
    d.lastDateUpdatedCount = lastDateUpdatedArray.length;
    for (var i = 0; i < lastDateUpdatedArray.length; i++) {
      dateUpdatedArrayString += vizFormatDateSetup(lastDateUpdatedArray[i]);
      if (i < (lastDateUpdatedArray.length - 1)) {
        dateUpdatedArrayString += ', ';
      }
    }
  } else {
    d.lastDateUpdatedCount = 1;
    dateUpdatedArrayString += vizFormatDateSetup(d['LAST_DAY_UPDATED']['VALUE']);
  }
  return dateUpdatedArrayString;
};

var processAliasArray = function (d) {
  var aliasArrayString = '';
  if (!(d['INDIVIDUAL_ALIAS'])) {
    d.aliasCount = 0;
    return '';
  }
  if (Object.prototype.toString.call(d['INDIVIDUAL_ALIAS']) === '[object Array]') {
    // console.log( __filename, 'line', __line, '; processAliasArray() found  Array!', d['INDIVIDUAL_PLACE_OF_BIRTH']);
    var aliasArray = d['INDIVIDUAL_ALIAS'];
    d.aliasCount = aliasArray.length;
    for (var i = 0; i < aliasArray.length; i++) {
      aliasArrayString += createIndivAliasString(aliasArray[i]);
      aliasArrayString += '; ';
    }
  } else {
    d.aliasCount = 1;
    aliasArrayString += createIndivAliasString(d['INDIVIDUAL_ALIAS']);
  }
  return aliasArrayString;
};

var processPlaceOfBirthArray = function (d) {
  var pobArrayString = '';
  if (typeof d['INDIVIDUAL_PLACE_OF_BIRTH'] !== 'undefined') {
    if (Object.prototype.toString.call(d['INDIVIDUAL_PLACE_OF_BIRTH']) === '[object Array]') {
      // console.log( __filename, 'line', __line, ';  Array!', d['INDIVIDUAL_PLACE_OF_BIRTH']);
      var pobArray = d['INDIVIDUAL_PLACE_OF_BIRTH'];
      // var pobArrayString;
      for (var i = 0; i < pobArray.length; i++) {
        pobArrayString += createIndivPlaceOfBirthString(pobArray[i]);
        pobArrayString += '; ';
      }
    } else {
      pobArrayString += createIndivPlaceOfBirthString(d['INDIVIDUAL_PLACE_OF_BIRTH']);
    }
  }
  return pobArrayString;
};

var readAndParseJsonFile = function (dataPath) {
  var narrativeUrl;
  var buffer;
  try {
    buffer = fse.readFileSync(dataPath);
    data = JSON.parse(buffer);
  } catch (err) {
    console.log('\n ', __filename, 'line', __line, '; Error: ', err);
    logger.log_message([__filename, 'line', __line, '; Error: ', err].join(''));
  }
  return data;
};

var syncGetHtmlAsUnicodeString = function (url) {
  // try {
  var res;
  res = requestSync('GET', url);
  var responseBody = res.body.toString();
  var htmlString = utilities_aq_viz.forceUnicodeEncoding(responseBody);
//  utilities_aq_viz.syncWriteMyFile(saveFilePath, narrative, fsOptions);
  return htmlString.trim();
  // } catch (err) {
  // console.log('\n ', __filename, 'line', __line, '; Error: ', err);
  //}
};

// collect a named file from an Internet host and save it locally; specify indivOrEntityString equals a string either 'entity' or 'indiv'
// save to json file: narrativeLinksLocalFileNameAndPath
var syncGetRawHtmlNarrativePages = function (url, saveFilePath) {
  // try {
  var res;
  res = requestSync('GET', url);
  var responseBody = res.body.toString();
  var narrWebPageString = utilities_aq_viz.forceUnicodeEncoding(responseBody);
  var narrative = utilities_aq_viz.trimNarrative(narrWebPageString, url);
  utilities_aq_viz.syncWriteMyFile(saveFilePath, narrative, fsOptions);
  return narrative.trim();
  // } catch (err) {
  // console.log('\n ', __filename, 'line', __line, '; Error: ', err);
  //}
};

// collect a named file from an Internet host and save it locally; specify indivOrEntityString equals a string either 'entity' or 'indiv'
// save to json file: narrativeLinksLocalFileNameAndPath
var syncWriteHtmlFile = function (htmlString, saveFilePath) {
  var unicodeHtmlString = utilities_aq_viz.forceUnicodeEncoding(htmlString);
  utilities_aq_viz.syncWriteMyFile(saveFilePath, unicodeHtmlString, fsOptions);
  return true;
};

var truncateString = function (inString, numCharacters) {
  var outString = '[TRUNCATED]' + inString.substring(0, numCharacters) + '\n ... [CONSOLE LOG OUTPUT INTENTIONALLY TRUNCATED TO FIRST' + numCharacters + '400 CHARACTERS]';
  return outString + ' ;-)';
};

var vizFormatDateSetup = function (dateString) {
  var m_names = ['January', 'February', 'March',
    'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December'];

  var d = new Date(dateString);
  var curr_date = d.getDate();
  var curr_month = d.getMonth();
  var curr_year = d.getFullYear();

  var vizDateString = curr_date + ' ' + m_names[curr_month]
    + ' ' + curr_year;
  // console.log('viz.js 947 vizFormatDate() dateString = ', dateString);
  return vizDateString.trim();
};

var writeMyFile = function (localFileNameAndPath, data, fsOptions) {
  try {
    fse.writeFileSync(localFileNameAndPath, data, fsOptions);
  } catch (err) {
    console.log(__filename, 'line', __line, ' Error: ', err);
  }
};

module.exports = {
  collect: collect
//  getXMLFile: getXMLFile,
//  convertXMLToJson: convertXMLToJson,
//  writeAQListXML: writeAQListXML,
  //getListOfNarratives: getListOfNarratives
};