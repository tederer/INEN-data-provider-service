/* global dataprovider, assertNamespace */

require('./common/NamespaceUtils.js');

assertNamespace('dataprovider');

dataprovider.Configuration = function Configuration() {
   var config = {
      'arduino': {
         geolocation: {
            longitude: 16.822859899870274,
            latitude:  47.954155443258976
         }
      },
      'sensor1': {
         geolocation: {
            longitude: 16.82379644619579,
            latitude:  47.95404620544281
         }
      },
      'sensor2': {
         geolocation: {
            longitude: 16.82279896886495,
            latitude:  47.952296393788174
         }
      },
      'sensor3': {
         geolocation: {
            longitude: 16.821973644982076,
            latitude:  47.9522319616078
         }
      }
   };

   this.containsSensor = function containsSensor(sensorId) {
      return config[sensorId] !== undefined;
   };

   this.getGeoLocationOfSensor = function getGeoLocationOfSensor(sensorId) {
      return config[sensorId].geolocation;
   };
};
