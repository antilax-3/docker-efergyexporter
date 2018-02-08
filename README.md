# AntilaX-3/efergy-exporter
[![](https://images.microbadger.com/badges/version/antilax3/efergy-exporter:1.0.0.svg)](https://microbadger.com/images/antilax3/efergy-exporter:1.0.0 "Get your own version badge on microbadger.com") [![](https://images.microbadger.com/badges/image/antilax3/efergy-exporter:1.0.0.svg)](https://microbadger.com/images/antilax3/efergy-exporter:1.0.0 "Get your own image badge on microbadger.com") [![Docker Pulls](https://img.shields.io/docker/pulls/antilax3/efergy-exporter.svg)](https://hub.docker.com/r/antilax3/efergy-exporter/) [![Docker Stars](https://img.shields.io/docker/stars/antilax3/efergy-exporter.svg)](https://hub.docker.com/r/antilax3/efergy-exporter/)

[efergy-exporter](https://github.com/AntilaX-3/docker-efergyexporter) is a simple server that uses [rtl_433](https://github.com/merbanan/rtl_433) to receive Efergy Energy data formatted to export via HTTP for Prometheus consumption, written in Node.js.

The voltage attribute it supplies to Prometheus is configurable. 
## Usage
```
docker create --name=efergyexporter \
-v <path to config>:/config \
-p 9122:9122 \
--privileged=true \
antilax3/efergy-exporter
```
## Parameters
The parameters are split into two halves, separated by a colon, the left hand side representing the host and the right the container side. For example with a volume -v external:internal - what this shows is the volume mapping from internal to external of the container. So -v /mnt/app/config:/config would map /config from inside the container to be accessible from /mnt/app/config on the host's filesystem.

- `-v /config` - local path for smartexporter config file
- `-p 9122` - http port for webserver

It is based on alpine linux, utilising the official node docker repository with alpine tag, for shell access whilst the container is running do `docker exec -it efergyexporter /bin/sh`.

## Volumes

The container uses a single volume mounted at '/config'. This volume stores the configuration file 'efergyexporter.json'.

    config
    |-- efergyexporter.json

## Configuration

The efergyexporter.json is copied to the /config volume when first run. It has one mandatory parameter.

The mandatory parameter *voltage* should be set to either 110 or 240 this should be based on the voltage of your region. 
 
## Version
- **08/02/18:** 1.0.0 | Initial Release