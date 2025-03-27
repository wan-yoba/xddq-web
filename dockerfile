# 使用 Node.js 作为基础镜像
FROM node:bullseye-slim

# 设置工作目录
WORKDIR /app

# 将当前目录下的 src 目录复制到容器内的 /app/src
COPY ./src /app/src

# 安装 http-server
RUN npm install -g http-server

# 暴露 8083 端口
EXPOSE 8083

# 运行 http-server
CMD ["http-server", "src", "-p", "8083", "--cors", "-o", "login.html"]
