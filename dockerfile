FROM nginx:1.25.3-alpine

# 设置工作目录
WORKDIR /usr/share/nginx/html

# 复制 src 目录到 nginx 静态资源目录
COPY ./src /usr/share/nginx/html

COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
