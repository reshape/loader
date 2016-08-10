# Reshape Webpack Loader

[![npm](https://img.shields.io/npm/v/reshape-loader.svg?style=flat-square)](https://npmjs.com/package/reshape-loader)
[![tests](https://img.shields.io/travis/reshape/loader.svg?style=flat-square)](https://travis-ci.org/reshape/loader?branch=master)
[![dependencies](https://img.shields.io/david/reshape/loader.svg?style=flat-square)](https://david-dm.org/reshape/loader)
[![coverage](https://img.shields.io/coveralls/reshape/loader.svg?style=flat-square)](https://coveralls.io/r/reshape/loader?branch=master)
[![gitter](https://img.shields.io/gitter/room/reshape/loader.svg?style=flat-square)](https://gitter.im/reshape/loader?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge")

A reshape loader for webpack

## Installation

```sh
npm i html-loader reshape-loader --save
```

## Usage

The reshape loader must be used with at least one other loader in order to integrate with webpack correctly. For most use cases, the [html-loader](https://github.com/webpack/html-loader) is recommended. If you want to export the html string directly for use in javascript or webpack plugins, we recommend the [source-loader](https://github.com/static-dev/source-loader). Whichever loader you choose, it should be the first loader, followed by reshape, as you will see in the examples below.

Options can be passed through a `reshape` option directly on the webpack config object. It accepts an array, an object, or a function that returns an array or object. If it's an array, it should contain plugins. If it's an object, it can contain a `plugins` key, which is an array of plugins and an optional `parser` key which allows you to pass in a custom parser. Any other key will apply to the `pack` querystring parameter, documented below.

Basic configuration example:

```js
// webpack.config.js
module: {
  loaders: [{
    test: /\.html$/,
    loader: 'html!reshape'
  }]
},
reshape: [/* plugins here */]
```

### Plugin Packs

If you need to apply different sets of plugins to different groups of files, you can use a **plugin pack**. Just add `pack=[name]` as a querystring option, and return an object from the `reshape` config option with a key matching the pack name, and the value being an array of plugins.

```js
// webpack.config.js
module: {
  loaders: [{
    test: /\\.special\.html$/,
    loader: 'html!reshape?pack=special'
  }]
},
reshape: {
  plugins: [/* plugins that apply anything that's not using a pack */],
  special: [ /* plugins specific to the "special" pack */ ],
}
```

### Using a Function

You can also return a function from the `reshape` config value, if you need to for any reason. The function passes along the [loader context](https://webpack.github.io/docs/loaders.html#loader-context) as an argument, so you can get information about the file currently being processed from this and pass it to plugins if needed. For example:

```js
// webpack.config.js
module: {
  loaders: [{
    test: /\.html$/,
    loader: 'html!reshape'
  }]
},
reshape: (ctx) => {
  return [examplePlugin({ filename: ctx.resourcePath })]
}
```

### Custom Parser

If you want to use a custom parser, you can pass it in under the `parser` key. Below is an example with the [sugarml parser](https://github.com/reshape/sugarml):

```js
// webpack.config.js
const sugarml = require('sugarml')

module: {
  loaders: [{
    test: /\\.special\.html$/,
    loader: 'html!reshape?pack=special'
  }]
},
reshape: {
  plugins: [/* reshape plugins */],
  parser: sugarml
}
```

## License & Contributing

- Licensed under [MIT](LICENSE)
- See [contributing guidelines](CONTRIBUTING.md)
