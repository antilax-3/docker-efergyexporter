# ====================================
# ===== Build image for rtl_433  =====
# ====================================
FROM alpine AS builder-rtl433

RUN apk add --no-cache git rtl-sdr autoconf build-base cmake libtool librtlsdr-dev

RUN git clone https://github.com/merbanan/rtl_433.git && \
cd rtl_433 && \
mkdir build && \
cd build && \
cmake .. && \
make && \
make install

# ================================
# ===== efergyexporter image =====
# ================================
FROM node:alpine3.12

# set environment variables
ENV NODE_CONFIG_DIR /config

# set working directory
WORKDIR /app

# copy files
COPY root/ /
COPY --from=builder-rtl433 /usr/local/bin/rtl_433 /app/

# install packages
RUN \
 apk add --no-cache \
    rtl-sdr && \
 echo "**** build node application ****" && \
 cd /app && chmod +x rtl_433 && npm install && npm run build && mv build/main.js . && \
 echo "**** cleanup ****" && \
 rm -rf \
    package*.json \
    build \
    src

# ports and volumes
EXPOSE 9122
VOLUME /config

CMD ["node", "main.js"]