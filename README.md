# Reshape Webpack Loader

[![npm](https://img.shields.io/npm/v/reshape-loader.svg?style=flat-square)](https://npmjs.com/package/reshape-loader)
[![tests](https://img.shields.io/travis/reshape/loader.svg?style=flat-square)](https://travis-ci.org/reshape/loader?branch=master)
[![dependencies](https://img.shields.io/david/reshape/loader.svg?style=flat-square)](https://david-dm.org/reshape/loader)
[![coverage](https://img.shields.io/coveralls/reshape/loader.svg?style=flat-square)](https://coveralls.io/r/reshape/loader?branch=master)

A reshape loader for webpack

## Installation

```sh
npm i reshape-loader --save
```

## Compatibility

This loader is only compatible with webpack 2. If you want to use it for webpack 1, you can install version `0.4.2` and checkout the `webpack1` branch for the readme and docs.

## Usage

There are two distinct ways you can use this loader. By default, it will compile your templates and return a function which you can get by `require`-ing the original template path. It can also produce static html if used with the `locals` option.

Options are passed through the `options` parameter of the reshape loader rule. It's important to note that the value of `options` must be an object, so it cannot be a function as was used in previous webpack versions.

A basic configuration example:

```js
// webpack.config.js
module.exports = {
  module: {
    rules: [{
      test: /\.html$/,
      loader: 'reshape',
      options: { plugins: [/* plugins here */] }
    }]
  }
}
```

There are a couple differences between the configuration that can be passed through this loader, and to reshape directly. First, the `plugins` option *must be an array*. If you have a single plugin, it cannot be passed as the value of `plugins`, it needs to be contained within an array. Second, any of the options can instead be functions that return the value you want the option to be when called. The loader will execute the functions, passing in webpack's loader context as the first argument. For the `generator` and `parser` options, which are expected to be functions anyway, you must attach a `convert` property to the function if you intend to pass a function that returns your parser/generator rather than the parser/generator itself.

A more advanced example:

```js
// webpack.config.js
const somePlugin = require('./somePlugin')
const parser = require('reshape-parser')
const sugarml = require('sugarml')

function parserFn (loaderContext) {
  return loaderContext.resourcePath.match(/\.sgr$/) ? sugarml : parser
}
parserFn.convert = true

module.exports = {
  module: {
    rules: [{
      test: /\.html$/,
      loader: 'reshape',
      options: {
        plugins: (loaderContext) => {
          return [somePlugin({ file: loaderContext.resourcePath })]
        },
        parser: parserFn
      }
    }]
  }
}
```

Note that the above example is pseudo-code, it will not work if copy/pasted directly. It's just intended to give an idea of how some of the more advanced configuration options might be used.

### Producing Static HTML

Reshape produces a function as its output by default, however some use-cases call for returning the static html as the output. If this is necessary, you can use the `locals` argument along with any params you want to pass to the function (such a local variables) to have reshape-loader export a compiled html string. For example:

```html
<p>Hello {{ planet }}!</p>
```

```js
// webpack.config.js
const expressions = require('reshape-expressions')

module.exports = {
  module: {
    rules: [{
      test: /\.html$/,
      use: [
        { loader: 'html' },
        {
          loader: 'reshape',
          options: {
            plugins: [expressions()],
            locals: { planet: 'world' }
          }
        }
      ]
    }]
  }
}
```

```js
const html = require('./index.html')
console.log(html) // <p>Hello world!</p>
```

If you do this, you will want at least one other loader in order to integrate the returned source with webpack correctly. For most use cases, the [html-loader](https://github.com/webpack/html-loader) is recommended. If you want to export the html string directly for use in javascript or webpack plugins, we recommend the [source-loader](https://github.com/static-dev/source-loader). Whichever loader you choose, it should be the first loader, followed by reshape, as seen in the example above.

## Custom Plugin Hooks

Reshape loader adds a custom hook that webpack plugins can utilize called `beforeLoaderCompile` (sync). This hook exposes the options as they stand immediately before being passed to reshape for compilation, allowing them to be read and/or modified by plugins. For example, if you wanted to make a plugin that adds a `test` key to the locals, it might look like this.

```js
module.exports = class TestPlugin {
  apply (compiler) {
    compiler.plugin('beforeLoaderCompile', (options) => {
      Object.assign(options, { test: 'wow' })
    })
  }
}
```

## License & Contributing

- Licensed under [MIT](LICENSE.md)
- See [contributing guidelines](contributing.md)
