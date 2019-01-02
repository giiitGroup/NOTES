# Laravel 中实现sass全局引用的配置

基于laravel-mix实现的配置

> 学习过程
> <br> node-sass sas-loader => sass-resources-loader => webpackConfig => laravel-mix => webpackConfig

项目基于laravel框架，是一个Laravel+Vue+MintUI实现的cordova套壳app，搭建框架时由于引入rem进行适配，所以通过_functions.scss对px转换rem定义了一个函数，进而产生全局引入该函数的需求，深踩一坑

配置很简单

* webpack.mix.js
 ``` javascript
 let mix = require('laravel-mix');
/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

mix.js('resources/assets/js/app.js', 'public/js')
  .sass('resources/assets/sass/app.scss', 'public/css/app.css')
  .options({
    extractVueStyles: true,
    globalVueStyles: 'resources/assets/sass/utils/_functions.scss'
  })// 实现的就是options配置项 共计4行 globalVueStyles全局的文件
 ```
 <br>

* laravel-mix内部目录

``` 
+ icons // 一个叫icons的文件夹
- setup
  webpack.config.js // package.json中运行指令所映射的文件
  webpack.mix.js
- src
  - builder
    ...
    webpack-rules.js // 各类文件解析规则 loader
    WebpackConfig.js // webpack配置的具体信息 以及对用户自定义配置mix.webpackConfig()的merge操作
  + plugins // 神秘文件夹 提供多种plugin 猜测是对webpack任务指令的支持的支持
  + tasks // 另一神秘文件夹 提供多个task 猜测是对webpack任务指令的支持
  ... // 多个神秘文件 应该就是对webpack各功能的支持
  Api.js //对webpack整体各类指令、规则、功能等api的定义
  config.js //各配置项默认值 末尾进行了merge
  index.js // 这是index.js 是个js文件
...
package.json
```
 <br>

* 关键代(zhu)码(shi)
``` javascript
    // If we want to import a global styles file in every component,
    // use sass resources loader
    if (Config.extractVueStyles && Config.globalVueStyles) {
        tap(rules[rules.length - 1].options.loaders, vueLoaders => {
            vueLoaders.scss.push({
                loader: 'sass-resources-loader',
                options: {
                  resources: Mix.paths.root(Config.globalVueStyles)
                }
            });
            vueLoaders.sass.push({
                loader: 'sass-resources-loader',
                options: {
                  resources: Mix.paths.root(Config.globalVueStyles)
                }
            });
        });
    }
```
所以Laravel在本身推荐vue做前端业务的同时，对前端可能需要的一些功能也做了预留接口
> 是不是很简单 最难的地方在于这段代码在国内翻译的一文不值，源码里在最后的旮旯里
<br>看到的一瞬间 感觉自己在php框架里也获得了升华

* 最后附上全部的api 不要只看国内翻译的文档 结合自己的需求 并认真看源码 尤其是最后一行 还有最后一行的注释
``` javascript
let mix = require('laravel-mix');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for your application, as well as bundling up your JS files.
 |
 */

mix.js('src/app.js', 'dist/')
   .sass('src/app.scss', 'dist/');

// Full API
// mix.js(src, output);
// mix.react(src, output); <-- Identical to mix.js(), but registers React Babel compilation.
// mix.ts(src, output); <-- Requires tsconfig.json to exist in the same folder as webpack.mix.js
// mix.extract(vendorLibs);
// mix.sass(src, output);
// mix.standaloneSass('src', output); <-- Faster, but isolated from Webpack.
// mix.fastSass('src', output); <-- Alias for mix.standaloneSass().
// mix.less(src, output);
// mix.stylus(src, output);
// mix.postCss(src, output, [require('postcss-some-plugin')()]);
// mix.browserSync('my-site.dev');
// mix.combine(files, destination);
// mix.babel(files, destination); <-- Identical to mix.combine(), but also includes Babel compilation.
// mix.copy(from, to);
// mix.copyDirectory(fromDir, toDir);
// mix.minify(file);
// mix.sourceMaps(); // Enable sourcemaps
// mix.version(); // Enable versioning.
// mix.disableNotifications();
// mix.setPublicPath('path/to/public');
// mix.setResourceRoot('prefix/for/resource/locators');
// mix.autoload({}); <-- Will be passed to Webpack's ProvidePlugin.
// mix.webpackConfig({}); <-- Override webpack.config.js, without editing the file directly.
// mix.then(function () {}) <-- Will be triggered each time Webpack finishes building.
// mix.options({
//   extractVueStyles: false, // Extract .vue component styling to file, rather than inline.
//   globalVueStyles: file, // Variables file to be imported in every component.
//   processCssUrls: true, // Process/optimize relative stylesheet url()'s. Set to false, if you don't want them touched.
//   purifyCss: false, // Remove unused CSS selectors.
//   uglify: {}, // Uglify-specific options. https://webpack.github.io/docs/list-of-plugins.html#uglifyjsplugin
//   postCss: [] // Post-CSS options: https://github.com/postcss/postcss/blob/master/docs/plugins.md
// });
```

另外 Laravel也提供了对打包、压缩、版本、文件合并、文件夹复制等多种实用功能，就很棒
