```javascript
mix.webpackConfig({
    resolve: {
      extensions: ['.js', '.vue', '.json'],
      alias: {
        '@': __dirname + '/resources/assets/js'
      }
    }
  })
```
  
> from  https://dev.to/acro5piano/laravel-tips-set-resolve-alias-in-laravel-mix-6f5
