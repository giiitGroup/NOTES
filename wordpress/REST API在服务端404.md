# REST API在服务端404
## 前言
404分为服务端404和wordpress内404，

前者请求未到达wordpress，一般情况下是nginx伪静态规则未配置的原因，请求无法转发至Apache。

后者如果是使用rest api访问数据是代码的问题，如果是使用wordpress的固定链接则需要在设置中修改固定链接的格式为朴素，原因也是nginx的问题。
## 1. 服务端解决
配置nginx的Rewrite，修改conf文件
```
location / {
    try_files $uri $uri/ /index.php?$args;
}

# Add trailing slash to */wp-admin requests.
rewrite /wp-admin$ $scheme://$host$uri/ permanent;
```

## 2. 前端解决
修改接口地址为真实地址

例如原本接口地址为
> http://xxx.com/wp-json/wp/v2/posts

修改为

> http://xxx.com/index.php?rest_route=/wp/v2/posts