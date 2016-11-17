const test = require('ava')
const webpack = require('webpack')
const path = require('path')
const fs = require('fs')
const node = require('when/node')
const customElements = require('reshape-custom-elements')
const exp = require('reshape-expressions')
const sugarml = require('sugarml')
const fixtures = path.join(__dirname, 'fixtures')

test('basic', (t) => {
  return webpackCompile('basic', [customElements()])
    .then(({outputPath, src}) => {
      t.truthy(src.match(/hello world<\/div>/))
      fs.unlinkSync(outputPath)
    })
})

test('locals option', (t) => {
  return webpackCompile('expression', { plugins: exp(), locals: { planet: 'world' }, filename: 'test' })
    .then(({outputPath, src}) => {
      t.truthy(src.match(/module\.exports = "<p>hello world!<\/p>\\n"/))
      fs.unlinkSync(outputPath)
    })
})

test('config function', (t) => {
  return webpackCompile('basic', () => [customElements()])
    .then(({outputPath, src}) => {
      t.truthy(src.match(/hello world<\/div>/))
      fs.unlinkSync(outputPath)
    })
})

test('config object', (t) => {
  return webpackCompile('basic', { plugins: [customElements()] })
    .then(({outputPath, src}) => {
      t.truthy(src.match(/hello world<\/div>/))
      fs.unlinkSync(outputPath)
    })
})

test('plugin packs', (t) => {
  return webpackCompile('basic', { special: [customElements()] }, '?pack=special')
    .then(({outputPath, src}) => {
      t.truthy(src.match(/hello world<\/div>/))
      fs.unlinkSync(outputPath)
    })
})

test('locals packs', (t) => {
  return webpackCompile('expression', { plugins: [exp()], locals: { planet: 'world' } }, '?locals={"planet":"mars"}')
    .then(({outputPath, src}) => {
      t.truthy(src.match(/hello mars!<\/p>/))
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

test('invalid config', (t) => {
  return webpackCompile('custom_parser', 5)
    .then(() => t.fail('invalid config, no error'))
    .catch(({outputPath, err}) => {
      t.truthy(err.toString().match(/Error: Configuration must return an array or object/))
      fs.unlinkSync(outputPath)
    })
})

test('function called with correct context', (t) => {
  return webpackCompile('locals', (ctx) => {
    return { plugins: exp(), locals: { foo: ctx.resourcePath } }
  }).then(({outputPath, src}) => {
    t.truthy(src.match(/test\/fixtures\/locals\/index\.html/))
    fs.unlinkSync(outputPath)
  })
})

// hackiest test of all time!
test('context exported correctly', (t) => {
  const oldLog = console.log
  console.log = (x) => t.truthy(x === '<p>hello world!</p>\n')
  return webpackCompileNoSource('expression-log', (ctx) => {
    return [exp()]
  }).then(({outputPath, src}) => {
    eval(src) // eslint-disable-line
    console.log = oldLog
    fs.unlinkSync(outputPath)
  })
})

// Utility: compile a fixture with webpack, return results
function webpackCompile (name, config, qs = '') {
  const testPath = path.join(fixtures, name)
  const outputPath = path.join(testPath, 'bundle.js')

  return node.call(webpack, {
    entry: { output: [path.join(testPath, 'app.js')] },
    output: { path: testPath },
    resolveLoader: { root: path.join(__dirname, '../lib') },
    module: {
      loaders: [{ test: /\.html$/, loader: `source!index${qs}` }]
    },
    reshape: config
  }).then((stats) => {
    if (stats.compilation.errors.length) throw stats.compilation.errors
    const src = fs.readFileSync(outputPath, 'utf8')
    return {outputPath, src}
  }).catch((err) => { throw {outputPath, err} }) // eslint-disable-line
}

// Utility: compile a fixture with webpack, return results
function webpackCompileNoSource (name, config, qs = '') {
  const testPath = path.join(fixtures, name)
  const outputPath = path.join(testPath, 'bundle.js')

  return node.call(webpack, {
    entry: { output: [path.join(testPath, 'app.js')] },
    output: { path: testPath },
    resolveLoader: { root: path.join(__dirname, '../lib') },
    module: {
      loaders: [{ test: /\.html$/, loader: `index${qs}` }]
    },
    reshape: config
  }).then((stats) => {
    if (stats.compilation.errors.length) throw stats.compilation.errors
    const src = fs.readFileSync(outputPath, 'utf8')
    return {outputPath, src}
  }).catch((err) => { throw {outputPath, err} }) // eslint-disable-line
}
