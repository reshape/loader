const reshape = require('reshape')

module.exports = function (source) {
  this.cacheable && this.cacheable()

  // configure options
  const cb = this.async()
  const options = parseOptions.call(this, this.query)

  // if the output function doesn't need to be called, we'll take it as a string
  // and save the time eval'ing it
  if (!options.locals) {
    if (!options.generatorOptions) { options.generatorOptions = {} }
    options.generatorOptions.returnString = true
  }

  // run reshape
  reshape(options)
    .process(source)
    .then((res) => {
      // If the locals option is specified, we call the output function and
      // return static html. Otherwise, we return the function & runtime to be
      // used client-side.
      if (options.locals) {
        cb(null, res.output(options.locals))
      } else {
        // TODO: more efficient shared runtime export
        cb(null, `var __runtime = ${serializeVerbatim(res.runtime)}; module.exports = ${res.output.substr(1)}`)
      }
    })
    .catch(cb)

  return undefined
}

// Allows any option to be passed as a function which gets webpack's context
// as its first argument, in case some info from the loader context is necessary
function parseOptions (opts) {
  return removeEmpty({
    plugins: convertFn.call(this, opts.plugins),
    locals: convertFn.call(this, opts.locals),
    filename: convertFn.call(this, opts.filename),
    parserOptions: convertFn.call(this, opts.parserOptions),
    generatorOptions: convertFn.call(this, opts.generatorOptions),
    runtime: convertFn.call(this, opts.runtime),
    parser: convertFnSpecial.call(this, opts.parser),
    generator: convertFnSpecial.call(this, opts.generator)
  })
}

function convertFn (opt) {
  return typeof opt === 'function' ? opt(this) : opt
}

function convertFnSpecial (opt) {
  return typeof opt === 'function' && opt.convert ? opt(this) : opt
}

function removeEmpty (obj) {
  Object.keys(obj).forEach((key) => (obj[key] == null) && delete obj[key])
  return obj
}

module.exports.parseOptions = parseOptions

// The runtime contains functions which must be converted into strings without
// any escaping at all. Yes, this method of doing so is insane. But it works!
function serializeVerbatim (obj) {
  let i = 0
  const fns = []
  let res = JSON.stringify(obj, (k, v) => {
    if (typeof v === 'function') {
      fns.push(v.toString())
      return `__REPLACE${i++}`
    } else {
      return v
    }
  })
  res = res.replace(/"__REPLACE(\d{1})"/g, (m, v) => {
    return fns[v]
  })
  return res
}
