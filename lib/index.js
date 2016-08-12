const loaderUtils = require('loader-utils')
const reshape = require('reshape')

module.exports = function (source) {
  this.cacheable && this.cacheable()

  // configure options
  const qs = loaderUtils.parseQuery(this.query)
  const cb = this.async()
  let config
  try {
    config = parseOptions.call(this, this.options.reshape, qs)
  } catch (err) {
    return cb(err)
  }

  // configure the arguments
  const args = { plugins: config.plugins }

  // if there's a parser provided by the user, add it
  if (config.parser) { args.parser = config.parser }

  // run reshape
  reshape(args)
    .process(source)
    .done((res) => {
      // if the locals option is specified, we return call the output function
      // and return static html
      if (config.locals) { res.output = res.output(config.locals) }
      // TODO: more efficient shared runtime export
      const runtimeStr = serializeVerbatim(res.runtime)
      // export the output
      if (config.locals) {
        cb(null, res.output)
      } else {
        // if we are exporting a function, it also needs the runtime
        cb(null, `var __runtime = ${runtimeStr}; module.exports = (${res.output})`)
      }
    }, cb)

  return undefined
}

function parseOptions (config = [], qs = {}) {
  const res = {}

  // if we have a function, run it
  if (typeof config === 'function') { config = config.call(this, this) }

  // if it's not an object at this point, error
  if (typeof config !== 'object') {
    throw new Error('Configuration must return an array or object')
  }

  // if we now have an array, that represents the plugins directly
  if (Array.isArray(config)) {
    res.plugins = config
  // if not, it's an object. if a plugin pack is being used, use it.
  // otherwise, use default plugins
  } else {
    res.plugins = qs.pack ? config[qs.pack] : config.plugins
  }

  // load in other options if present
  if (config.parser) { res.parser = config.parser }
  if (config.filename) { res.filename = config.filename }
  if (config.locals) { res.locals = config.locals }

  return res
}

// Yes, this is insane. But it works!
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

module.exports.parseOptions = parseOptions
