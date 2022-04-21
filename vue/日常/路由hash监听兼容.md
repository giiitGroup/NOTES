## 路由监听方式

- ### 监听hashchange事件
>  IE中2和3不兼容，需要结合使用
  ```javascript
    
    mounted(){
            if (isIE) {
                window.addEventListener('hashchange', this.hashChangeHandler);
            }
    },
    methods: {
        hashChangeHandler(){
            // todo
        }
    },
    destroyed() {
        if (isIE) {
            window.removeEventListener('hashchange', this.hashChangeHandler);
        }
    }
  ```

- beforeRouteUpdate

```javascript
    beforeRouteUpdate(to, from, next) {
        next();
        if (!isIE) {
            this.$nextTick(() => {
                // todo
            });
        }
    }

```

- watch $router

```javascript
watch(){
    $router(){},
    '$router.query': {
        deep: true,
        immediate: true,
        handler: todo
    },
}

```
