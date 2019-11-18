# CentOS7.2上node的配置
## node环境
在[**node官网**](http://nodejs.cn/download/)获取node下载链接或最新版本号，服务器为CentOS7.2，所以选择Linux64位版本。

## 1.shell中通过yum直接安装nodejs ##
```shell
更新nodejs版本，yum本身有版本的延迟，需要手动指定node版本
# curl -sL https://rpm.nodesource.com/setup_10.x | sudo bash -
# sudo yum install nodejs
```
## 2.shell中通过wget下载node ##
```shell
# yum install -y wget
# cd /usr/local
# mkdir node
# cd node
# wget https://cdn.npm.taobao.org/dist/node/v12.13.0/node-v12.13.0-linux-x64.tar.xz
```
### 2.1压缩包需要两步完全解压 ###
```shell
# xz -d node-v12.13.0-linux-x64.tar.xz
# tar -xvf node-v12.13.0-linux-x64.tar
```
### 2.2建立软连接,把node和npm配置为全局命令 ###
```shell
# ln -s node-v12.13.0-linux-x64/bin/node /usr/local/bin/node
# ln -s node-v12.13.0-linux-x64/bin/npm /usr/local/bin/npm
# node -v
> v12.13.0
# npm -v
> 6.12.0
```
## 创建node启动文件 ##
```shell
# cd ~
# mkdir projects
# cd projects
# touch test.js
```
### 将下面js代码拷贝到test.js ###
```javascript
var http = require("http");
http.createServer(function (req, res) {
    res.writeHead(200,{"Content-type":"text/html!
"});
    res.write("<h1 style=\"text-align: center\">Hello NodeJs!!<h1>");
    res.end();
}).listen(8080);
```
## 启动node服务，打开监听端口 ##
```shell
# node test.js &
```
## 在本地telnet测试端口 ##
```shell
# telnet xxx.xxx.xxx.xxx 8080
```
*注意在安全组中添加端口允许外界访问*
