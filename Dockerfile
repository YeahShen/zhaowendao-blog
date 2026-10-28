FROM nginx:stable-alpine3.24-slim AS runtime

LABEL org.opencontainers.image.title="amy-station blog" \
      org.opencontainers.image.description="Hexo blog served by nginx" \
      org.opencontainers.image.authors="ashen"

ENV TZ=Asia/Shanghai

# Serve the site with gzip, cache headers and a /healthz endpoint
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Ship only the generated static files
RUN rm -rf /usr/share/nginx/html/*
COPY ./public /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1

# The base image already sets:
#   CMD ["nginx", "-g", "daemon off;"]
#   STOPSIGNAL SIGQUIT
# so no override is needed here.