# INEN-data-provider-service

This project contains the source code of a service to receive sensor values delivered by a LoRa gateway. The values get cached for later requests and will time out by default after 300 seconds if no update comes in.

## Environment variables 

The following environment variables get used by the service.

| env variable         | mandatory |default | range  | description  |
| -------------------- | :-------: | :----: | ------ | ----------- |
| LOG_LEVEL            | no        | INFO   | "DEBUG", "INFO", "WARNING", "ERROR", "OFF" | Specifies how detailed the log output will be.|
| WEBSERVER_PORT       | no        | 8100   | positive integer | Specifies the port the webserver will use to accept incoming requests.|
| ACTIVATE_SWAGGER     | no        | false  | "true", "false"  | Specifies if the Swagger UI shall get started.|
| TIMEOUT_IN_SEC       | no        | 300    | positive integer | Specifies the duration in seconds after which a received value times out and gets removed.|

## Starting the service (using Docker)

The following command is an example how to start the service using Docker.

`docker run -it --rm --env ACTIVATE_SWAGGER=true -p 8080:80 tederer/inen-data-provider-service`
