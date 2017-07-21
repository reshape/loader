const test = require('ava')
const webpack = require('webpack')
const path = require('path')
const fs = require('fs')
const node = require('when/node')
const customElements = require('reshape-custom-elements')
const exp = require('reshape-expressions')
const include = require('reshape-include')
const sugarml = require('sugarml')
const fixtures = path.join(__dirname, 'fixtures')

test('basic', (t) => {
  return webpackCompile('basic', { plugins: [customElements()] })
    .then(({outputPath, src}) => {
      t.truthy(src.match(/hello world<\/div>/))
      fs.unlinkSync(outputPath)
    })
})

test('locals option', (t) => {
  return webpackCompile('expression', { plugins: [exp()], locals: { planet: 'world' }, filename: 'test' })
    .then(({outputPath, src}) => {
      t.truthy(src.match(/module\.exports = "<p>hello world!<\/p>\\n"/))
      fs.unlinkSync(outputPath)
    })
})

test('config functions', (t) => {
  return webpackCompile('basic', { plugins: () => [customElements()] })
    .then(({outputPath, src}) => {
      t.truthy(src.match(/hello world<\/div>/))
      fs.unlinkSync(outputPath)
    })
})

test('custom parser', (t) => {
  return webpackCompile('custom_parser', {
    plugins: [customElements()],
    parser: sugarml
  }).then(({outputPath, src}) => {
    t.truthy(src.match(/hello world<\/div>/))
    fs.unlinkSync(outputPath)
  })
})

test('parser/generator function', (t) => {
  function parser () { return sugarml }
  parser.convert = true

  return webpackCompile('custom_parser', { parser })
    .then(({outputPath, src}) => {
      t.truthy(src.match(/hello world<\/custom>/))
      fs.unlinkSync(outputPath)
    })
})

test('invalid config', (t) => {
  return webpackCompile('custom_parser', 5)
    .then(() => t.fail('invalid config, no error'))
    .catch(({outputPath, err}) => {
      t.truthy(err.toString().match(/WebpackOptionsValidationError: Invalid configuration object./))
    })
})

test('function called with correct context', (t) => {
  return webpackCompile('locals', {
    plugins: [exp()],
    locals: (ctx) => { return { foo: ctx.resourcePath } }
  }).then(({outputPath, src}) => {
    t.truthy(src.match(/test\/fixtures\/locals\/index\.html/))
    fs.unlinkSync(outputPath)
  })
})

// hackiest test of all time!
test('context exported correctly', (t) => {
  const oldLog = console.log
  console.log = (x) => t.truthy(x === '<p>hello world!</p>\n')
  return webpackCompileNoSource('expression-log', {
    plugins: [exp()]
  }).then(({outputPath, src}) => {
    eval(src) // eslint-disable-line
    console.log = oldLog
    fs.unlinkSync(outputPath)
  })
})

test('dependencies reported correctly', (t) => {
  return webpackCompile('dependencies', {
    plugins: [include()]
  }).then(({outputPath, stats}) => {
    t.truthy(stats.compilation.fileDependencies.some((fd) => {
      return fd.match(/partial\.html/)
    }))
    fs.unlinkSync(outputPath)
  })
})

test('custom plugin hook works', (t) => {
  class CustomHookPlugin {
    apply (compiler) {
      compiler.plugin('before-loader-process', (ctx, opts) => {
        Object.assign(opts.locals, { planet: 'changed' })
      })
    }
  }

  return webpackCompile('expression', {
    locals: () => { return { planet: 'world' } },
    plugins: [exp()],
    webpackPlugins: [new CustomHookPlugin()]
  }).then(({outputPath, src}) => {
    t.truthy(src.match(/hello changed!<\/p>/))
    fs.unlinkSync(outputPath)
  })
})

test('multi output', (t) => {
  return webpackCompile('multi', {
    plugins: [exp()],
    multi: [
      { locals: { greeting: 'hello' }, name: 'en' },
      { locals: { greeting: 'hola' }, name: 'es' }
    ]
  }).then(({outputPath, src}) => {
    t.regex(src, /module\.exports = {"en":"<p>hello<\/p>\\n","es":"<p>hola<\/p>\\n"}/g)
    fs.unlinkSync(outputPath)
  })
})

test('multi output without name property errors', (t) => {
  return webpackCompile('multi', {
    plugins: [exp()],
    multi: [
      { locals: { greeting: 'hello' } },
      { locals: { greeting: 'hola' } }
    ]
  }).catch(({err, outputPath}) => {
    t.regex(err.toString(), /multi options must have a "name" property/)
    fs.unlinkSync(outputPath)
  })
})

// Utility: compile a fixture with webpack, return results
function webpackCompile (name, config = {}, qs = {}) {
  const testPath = path.join(fixtures, name)
  const outputPath = path.join(testPath, 'bundle.js')

  return node.call(webpack, {
    entry: { bundle: [path.join(testPath, 'app.js')] },
    output: { path: testPath },
    resolveLoader: { modules: [path.join(__dirname, '../lib'), path.join(__dirname, '../node_modules')] },
    plugins: config.webpackPlugins || [],
    module: {
      rules: [
        {
          test: /\.html$/,
          use: [{ loader: `source-loader` }, { loader: 'index', options: config }]
        }
      ]
    }
  }).then((stats) => {
    if (stats.compilation.errors.length) throw stats.compilation.errors
    const src = fs.readFileSync(outputPath, 'utf8')
    return {outputPath, src, stats}
  }).catch((err) => { throw {outputPath, err} }) // eslint-disable-line
}

// Utility: compile a fixture with webpack, return results
function webpackCompileNoSource (name, config) {
  const testPath = path.join(fixtures, name)
  const outputPath = path.join(testPath, 'bundle.js')

  return node.call(webpack, {
    entry: { bundle: [path.join(testPath, 'app.js')] },
    output: { path: testPath },
    resolveLoader: { modules: [path.join(__dirname, '../lib'), path.join(__dirname, '../node_modules')] },
    module: {
      rules: [{ test: /\.html$/, loader: `index`, options: config }]
    }
  }).then((stats) => {
    if (stats.compilation.errors.length) throw stats.compilation.errors
    const src = fs.readFileSync(outputPath, 'utf8')
    return {outputPath, src}
  }).catch((err) => { throw {outputPath, err} }) // eslint-disable-line
}
