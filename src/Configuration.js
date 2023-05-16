/* global dataprovider, assertNamespace */

require('./common/NamespaceUtils.js');
require('./common/logging/LoggingSystem.js');

assertNamespace('dataprovider');

dataprovider.Configuration = function Configuration() {
   const CONFIG_FILENAME    = 'sensors.json';
   const LOGGER             = common.logging.LoggingSystem.createLogger('Configuration');

   var fs                   = require('fs');
   var sensorConfigFilePath = __dirname + '/../' + CONFIG_FILENAME;
   var sensorConfig;

   var isValidConfigEntry = function isValidConfigEntry(config, key) {
      var sensorCfg = config[key];
      return   (typeof sensorCfg                       === 'object') &&
               (typeof sensorCfg.geolocation           === 'object') &&
               (typeof sensorCfg.geolocation.longitude === 'number') &&
               (typeof sensorCfg.geolocation.latitude  === 'number');
   };

   var isValidSensorConfig = function isValidSensorConfig(config) {
      return   (typeof config               === 'object') &&
               (typeof Object.keys(config)  === 'object') &&
               (Object.keys(config).reduce((accu, key) => {
                  return accu && isValidConfigEntry(config, key);
               }, true));
   };

   this.containsSensor = function containsSensor(sensorId) {
      return sensorConfig[sensorId] !== undefined;
   };

   this.getGeoLocationOfSensor = function getGeoLocationOfSensor(sensorId) {
      return sensorConfig[sensorId].geolocation;
   };

   try {
      var sensorConfigFileContent = fs.readFileSync(sensorConfigFilePath, 'utf8');
      sensorConfig                = JSON.parse(sensorConfigFileContent);
      if (!isValidSensorConfig(sensorConfig)) {
          throw 'invalid sensor configuration';
      }
      LOGGER.logInfo('configured sensor IDs: ' + Object.keys(sensorConfig));
      
   } catch(error) {
      LOGGER.logError('failed to read & parse configuration file (' + sensorConfigFilePath + '): ' + error);
      process.exit(1);
   }   
};
