const loaderUtils = require('loader-utils')
const reshape = require('reshape')
const path = require('path')
const fs = require('fs')

module.exports = function (source) {
  if (this.cacheable) this.cacheable()

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
      // if the callWith option is specified, we return call the output function
      // and return static html
      if (config.callWith) { res.output = res.output(config.callWith) }
      // TODO export the shared runtime
      // res.runtime
      // export the output
      cb(null, res.output)
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
  if (config.callWith) { res.callWith = config.callWith }

  return res
}

module.exports.parseOptions = parseOptions
