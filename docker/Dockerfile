FROM node
MAINTAINER Qiu WeiHao <120988989@qq.com>
RUN mkdir -p /opt/adsserver/logs/
ADD build /opt/adsserver/build
ADD node_modules /opt/adsserver/node_modules
ADD public /opt/adsserver/public
ADD package.json /opt/adsserver/package.json
ADD docker-entrypoint.sh /opt/
RUN chmod +x /opt/docker-entrypoint.sh
WORKDIR  /opt/adsserver/
EXPOSE 3000
ENTRYPOINT /opt/docker-entrypoint.sh
