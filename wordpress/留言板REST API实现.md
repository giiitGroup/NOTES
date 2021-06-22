# 评论实现支持REST API的留言板
## 准备
1. 创建留言板文章分类，并创建一篇文章作为载体，即作为留言板
2. 为该文章创建自定义字段，并制定规则仅适用于当前文章的评论
- 评论 等于 文章
- 文章 等于 载体的文章id
  ``` json
    [
        {
            "key": "comment",
            "title": "留言",
            "fields": [
                ...
            ],
            "location": [
            [
                    {
                        "param": "comment",
                        "operator": "==",
                        "value": "post"
                    }
                ],
                [
                    {
                        "param": "post",
                        "operator": "==",
                        "value": "42"
                    }
                ]
            ],
            ...
        }
    ]
  ```
1. 在该字段中设置具体需要传入的子字段
   > 因为ACF的配置中无法指定字段的key值，可以创建后导出为json文件，在文件中编辑key和name后重新导入并删掉原有设置。注意fields中的name和key需要对应，不然存后无法读取。示例如下
   ``` json
    [
        {
            "key": "comment",
            "title": "留言",
            "fields": [
                {
                    "key": "name",
                    "label": "姓名",
                    "name": "name",
                    "type": "text",
                    "instructions": "",
                    "required": 1,
                    "conditional_logic": 0,
                    "wrapper": {
                        "width": "",
                        "class": "",
                        "id": ""
                    },
                    "default_value": "",
                    "placeholder": "",
                    "prepend": "",
                    "append": "",
                    "maxlength": ""
                },
                ......others
            ],
            "location": [
            ...
            ],
            ...
        }
    ]
   ```
## 自定义字段ACF
1. 添加插件Advanced Custom Fields，支持自定义字段，并配置规则和字段内容、常用格式等，可视化操作。
2. 添加插件ACF to REST API，可以在调用的查询API中返回acf字段，包含配置的自定义字段信息。

## 游客身份操作
1. 在WordPress本身的页面中，可以通过设置-讨论-其他评论设置，取消勾选“用户必须注册并登陆才可以发表评论”。
2. 当前场景需要通过REST API的调用发布评论，通过匿名评论的方式实现，添加校验是否允许匿名的过滤器。
   ``` php
   function filter_rest_allow_anonymous_comments() {
        return true;
    }
    add_filter('rest_allow_anonymous_comments','filter_rest_allow_anonymous_comments');
   ```
3. 如果需要通过REST API发布文章、页面等操作，可以引入WP REST User插件并启用