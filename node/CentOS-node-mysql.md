# CentOS7.2上node连接mysql
## 1.安装mysql
### 通过官网下载CentOS7的rpm安装包进行安装
``` shell
安装
wget http://repo.mysql.com/mysql-community-release-el7-5.noarch.rpm
rpm -ivh mysql-community-release-el7-5.noarch.rpm
yum update
yum install mysql-server

权限设置
chown mysql:mysql -R /var/lib/mysql

初始化
mysqld --initialize
```
### 为了demo方便此处通过sql文件手动导入了数据

*websites.sql*
``` mysql
/*
 Navicat MySQL Data Transfer

 Source Server         : 127.0.0.1
 Source Server Version : 50621
 Source Host           : localhost
 Source Database       : RUNOOB

 Target Server Version : 50621
 File Encoding         : utf-8

 Date: 05/18/2016 11:44:07 AM
*/

SET NAMES utf8;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
--  Table structure for `websites`
-- ----------------------------
DROP TABLE IF EXISTS `websites`;
CREATE TABLE `websites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` char(20) NOT NULL DEFAULT '' COMMENT '站点名称',
  `url` varchar(255) NOT NULL DEFAULT '',
  `alexa` int(11) NOT NULL DEFAULT '0' COMMENT 'Alexa 排名',
  `country` char(10) NOT NULL DEFAULT '' COMMENT '国家',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Records of `websites`
-- ----------------------------
BEGIN;
INSERT INTO `websites` VALUES ('1', 'Google', 'https://www.google.cm/', '1', 'USA'), ('2', '淘宝', 'https://www.taobao.com/', '13', 'CN'), ('3', '菜鸟教程', 'http://www.runoob.com/', '4689', 'CN'), ('4', '微博', 'http://weibo.com/', '20', 'CN'), ('5', 'Facebook', 'https://www.facebook.com/', '3', 'USA');
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
```
### 导入数据库
```shell
mysql -uroot -p
mysql> use websites;
     > set names utf8;
     > source ~/websites.sql;
```
## 通过nginx配置PHPmyadmin进行管理
### 待完成

## 通过node连接
> node安装mysql依赖
```shell
npm install mysql --save
```
> node执行文件
```javascript
var http = require("http");
var mysql  = require('mysql');  
//  mysql的配置
var connection = mysql.createConnection({     
  host: '127.0.0.1',       
  user: 'root',
  password: '152452',
  port: '3306',                   
  database: 'information_schema' 
}); 
// 连接
connection.connect();
// 请求
http.createServer(function (req, res) {
    res.writeHead(200,{"Content-type":"text/html!"});
    // 查询
    connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
      if (error) throw error;
      console.log('The solution is: ', results[0].solution);
      res.write(JSON.stringify(results[0].solution));
      // 请求结束，此方法需要与write在作用域内同步执行
      res.end()
    });
}).listen(8084);
```
> 启动node服务

```shell
node node-server.js &
```
### 通过浏览器直接访问8084端口即可