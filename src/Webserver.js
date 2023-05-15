/* global process, common, __dirname, dataprovider, clearTimeout, setTimeout */
require('./common/logging/LoggingSystem.js');
require('./Configuration.js');

var express                         = require('express');
var bodyParser                      = require('body-parser');
var pathToSwaggerUi                 = require('swagger-ui-dist').absolutePath();
var fs                              = require('fs');

const DEFAULT_PORT                  = 80;
const DEFAULT_VALUE_TIMEOUT_IN_SEC  = 5 * 60;
const DEFAULT_LOG_LEVEL             = 'INFO';

const LOGGER                        = common.logging.LoggingSystem.createLogger('Webserver');
const SCRIPT_DIR                    = __dirname;

const HTTP_OK                       = 200;
const HTTP_NO_CONTENT               = 204;
const HTTP_BAD_REQUEST              = 400;

var swaggerClientInitScript         = 'swagger-initializer.js';
var openApiYamlFilename             = 'openapi.yaml';
   
var swaggerInitScriptPath           = SCRIPT_DIR + '/' + swaggerClientInitScript;
var swaggerInitScriptContent;

var webserverPort                   = process.env.WEBSERVER_PORT ?? DEFAULT_PORT;
var activateSwagger                 = process.env.ACTIVATE_SWAGGER === 'true';
var valueTimeoutInSeconds           = process.env.TIMEOUT_IN_SEC ?? DEFAULT_VALUE_TIMEOUT_IN_SEC;
var logLevel                        = common.logging.Level[process.env.LOG_LEVEL ?? DEFAULT_LOG_LEVEL];

var app                             = express();
var info                            = {start: (new Date()).toISOString()};
var configuration                   = new dataprovider.Configuration();

var latestValues                    = {};
var timeouts                        = {};

var setResponseHeader = function setResponseHeader(response) {
   var headers = {'Content-Type': 'application/json'};
   headers['Access-Control-Allow-Origin'] = '*';
   response.set(headers);
};

var initInfo = function initInfo() {
   var result;
   try {
      var fileContent = fs.readFileSync(__dirname + '/../package.json', 'utf8');
      var packageJson = JSON.parse(fileContent);
      info.version    = packageJson.version;
   } catch(e) {
      LOGGER.logError('failed to read version: ' + e);
   }
   return result;
};

var validSensorData = function validSensorData(data) {
   return ((typeof data             === 'object') &&
           (typeof data.sensorId    === 'string') &&
           (data.sensorId.length    >   0)        &&
           (typeof data.temperature === 'number'));
};

var onTimeout = function onTimeout(sensorId) {
   LOGGER.logInfo('value timed out (sensorId=' + sensorId + ')');
   timeouts[sensorId] = undefined;
   latestValues[sensorId] = undefined;
};

var restartTimeout = function restartTimeout(sensorId) {
   var timeoutId = timeouts[sensorId];
   if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
   }
   timeouts[sensorId] = setTimeout(onTimeout.bind(this, sensorId), valueTimeoutInSeconds * 1000);
};

common.logging.LoggingSystem.setMinLogLevel(logLevel);
initInfo();

try {
   swaggerInitScriptContent = fs.readFileSync(swaggerInitScriptPath, 'utf8').replace('${url}', '/' + openApiYamlFilename);
} catch(e) {
   LOGGER.logError('failed to read content of ' + swaggerInitScriptPath + ': ' + e);
}

LOGGER.logInfo('log level   = ' + logLevel.description);

app.use(bodyParser.json({ type: 'application/json' })); // makes JSON data (sent in HTTP header) available in request.body

app.get(new RegExp('\/sensordata\/[^\/]+'), (request, response) => {
   LOGGER.logInfo('GET request (path=' + request.path + ')');
   setResponseHeader(response);

   var sensorId = request.path.substring(request.path.lastIndexOf('/') + 1);

   if ((typeof sensorId !== 'string') || (sensorId.length === 0) || !configuration.containsSensor(sensorId)) {
      response.status(HTTP_BAD_REQUEST).send();
      return;
   }
   
   var value = latestValues[sensorId];

   if ((value === undefined)) {
      response.status(HTTP_NO_CONTENT).send();
      return;
   }

   response.status(HTTP_OK).json(value);
});

app.post('/sensordata', (request, response) => {
   var data = request.body;

   try {
      LOGGER.logInfo('POST request (message=' + JSON.stringify(data));
   } catch(e) {}

   setResponseHeader(response);

   if (!validSensorData(data) || !configuration.containsSensor(data.sensorId)) {
      response.status(HTTP_BAD_REQUEST).send();
      return;
   }
   
   var now = Date.now();
   var newLatestData = {
      sensorId: data.sensorId,
      timestamp: now,
      temperature: data.temperature,
      geolocation: configuration.getGeoLocationOfSensor(data.sensorId)
   };

   latestValues[data.sensorId] = newLatestData;
   restartTimeout(data.sensorId);

   response.status(HTTP_OK).send();
});

if (activateSwagger) {
   app.get('/' + openApiYamlFilename, (request, response) => {
      response.status(200).sendFile(SCRIPT_DIR + '/' + openApiYamlFilename);
   });

   app.get('/swagger/' + swaggerClientInitScript, (request, response) => {
      if (swaggerInitScriptContent) {
         response.status(200).type('application/javascript').send(swaggerInitScriptContent);
      } else {
         response.status(500);
      }
   });

   app.use('/swagger', express.static(pathToSwaggerUi));
   LOGGER.logInfo('swagger UI is available at /swagger');
}

app.get('/info', (request, response) => {
   response.status(200).json(info);
});

app.all('/*', (request, response) => {
   LOGGER.logInfo('unsupported request (method=' + request.method + ', path=' + request.path + ', requester=' +  request.ip + ')');
   response.status(400).end();
});

app.listen(webserverPort, () => {
   LOGGER.logInfo('web server listening on port ' + webserverPort);
});
