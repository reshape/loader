# Reshape Webpack Loader

[![Greenkeeper badge](https://badges.greenkeeper.io/reshape/loader.svg)](https://greenkeeper.io/)

[![npm](https://img.shields.io/npm/v/reshape-loader.svg?style=flat-square)](https://npmjs.com/package/reshape-loader)
[![tests](https://img.shields.io/travis/reshape/loader.svg?style=flat-square)](https://travis-ci.org/reshape/loader?branch=master)
[![dependencies](https://img.shields.io/david/reshape/loader.svg?style=flat-square)](https://david-dm.org/reshape/loader)
[![coverage](https://img.shields.io/coveralls/reshape/loader.svg?style=flat-square)](https://coveralls.io/r/reshape/loader?branch=master)

A reshape loader for webpack

## Installation

```sh
npm i html-loader reshape-loader --save
```

## Usage

There are two distinct ways you can use this loader. By default, it will compile your templates and return a function which you can get by `require`-ing the original template path. It can also produce static html if used with the `locals` option.

Options can be passed through a `reshape` option directly on the webpack config object. It accepts an array, an object, or a function that returns an array or object. If it's an array, it should contain plugins. If it's an object, it can contain a `plugins` key, which is an array of plugins and an optional `parser` key which allows you to pass in a custom parser. Any other key will apply to the `pack` querystring parameter, documented below.

Basic configuration example:

```js
// webpack.config.js
module: {
  loaders: [{
    test: /\.html$/,
    loader: 'reshape'
  }]
},
reshape: [/* plugins here */]
```

### Producing Static HTML

Reshape produces a function as its output by default, however some use-cases call for returning the static html as the output. If this is necessary, you can use the `locals` argument along with any params you want to pass to the function (such a local variables) to have reshape-loader export a compiled html string. For example:

```html
<p>Hello {{ planet }}!</p>
```

```js
// webpack.config.js
const expressions = require('reshape-expressions')

module: {
  loaders: [{
    test: /\.html$/,
    loader: 'html!reshape'
  }]
},
reshape: {
  plugins: [expressions()]
  locals: { planet: 'world' }
}
```

```js
const html = require('./index.html')
console.log(html) // <p>Hello world!</p>
```

If you do this, you will want at least one other loader in order to integrate the returned source with webpack correctly. For most use cases, the [html-loader](https://github.com/webpack/html-loader) is recommended. If you want to export the html string directly for use in javascript or webpack plugins, we recommend the [source-loader](https://github.com/static-dev/source-loader). Whichever loader you choose, it should be the first loader, followed by reshape, as seen in the example above.

### Plugin Packs

If you need to apply different sets of plugins to different groups of files, you can use a **plugin pack**. Just add `pack=[name]` as a querystring option, and return an object from the `reshape` config option with a key matching the pack name, and the value being an array of plugins.

```js
// webpack.config.js
module: {
  loaders: [{
    test: /\\.special\.html$/,
    loader: 'reshape?pack=special'
  }]
},
reshape: {
  plugins: [/* plugins that apply anything that's not using a pack */],
  special: [ /* plugins specific to the "special" pack */ ],
}
```

### Local Packs?

Listen, headlines are hard ok? The point is, if you need to change the locals you are passing through based on a specific loader configuration, you can also do this, much like the plugin packs. This also implicitly allows you to change the compile mode from outputting a template to outputting static html. For example, passing `reshape?locals=false` will set a specific loader configuration to produce a javascript template.

Note that any value passed to the `locals` querystring must be valid JSON. If not, it will throw an error!

```js
// webpack.config.js
module: {
  loaders: [{
    test: /\\.special\.html$/,
    loader: 'reshape?locals={"foo": "not bar"}'
  }]
},
reshape: {
  locals: { foo: 'bar' }
}
```

### Using a Function

You can also return a function from the `reshape` config value, if you need to for any reason. The function passes along the [loader context](https://webpack.github.io/docs/loaders.html#loader-context) as an argument, so you can get information about the file currently being processed from this and pass it to plugins if needed. For example:

```js
// webpack.config.js
module: {
  loaders: [{
    test: /\.html$/,
    loader: 'reshape'
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
    test: /\.html$/,
    loader: 'reshape'
  }]
},
reshape: {
  plugins: [/* reshape plugins */],
  parser: sugarml
}
```

## License & Contributing

- Licensed under [MIT](LICENSE.md)
- See [contributing guidelines](contributing.md)
