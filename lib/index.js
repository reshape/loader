const reshape = require('reshape')

module.exports = function (source) {
  this.cacheable && this.cacheable()

  // configure options
  const cb = this.async()
  let options = parseOptions.call(this, this.query)

  // if we are producing a template (no locals or multi options), we are for
  // sure going to be returning a string, so we don't need to eval into a
  // function. we can set the returnString generator option to slice off some
  // overhead here
  if (!options.locals && !options.multi) {
    if (!options.generatorOptions) { options.generatorOptions = {} }
    options.generatorOptions.returnString = true
  }

  // set loader override options - filename and deps must be set by the loader
  options = Object.assign(options, {
    filename: this.resourcePath,
    dependencies: []
  })

  // custom plugin hook for options modification
  this._compiler.applyPlugins('before-loader-process', this, options)

  // if the multi option was specified, we have a slightly different compile
  // process. basically, we run through each of the multi options, merge it
  // with priority into the base options, and compile the base template once
  // for each multi option. The output is an object with the key being the
  // specified "name", and the value being a string with the compiled contents
  if (options.multi) {
    let depsAdded = false
    promiseReduce.call(this, options.multi, (m, opt) => {
      // no name is a no-go
      if (!opt.name) {
        throw new Error('multi options must have a "name" property')
      }

      // merge multi options back with default options
      const mergedOpts = Object.assign({}, options, opt)

      // run it
      return reshape(mergedOpts)
        .process(source)
        .then((res) => {
          // Only add dependencies once to prevent dupes
          if (!depsAdded && res.dependencies) {
            res.dependencies.map((dep) => this.addDependency(dep.file))
          }

          // Multi always produces a compiled template
          m[mergedOpts.name] = res.output(mergedOpts.locals)
          return m
        })
        // this needs to add module.exports and skip the source loader
    }, {}).then((res) => {
      // hack semi-specific to source-loader to ensure this is loaded
      // as a js object and not stringified
      this._module._jsSource = true
      this._module._outputMultiple = true
      cb(null, JSON.stringify(res))
    }).catch(cb)
  } else {
    // run reshape
    reshape(options)
      .process(source)
      .then((res) => {
        // If there are any dependencies reported, add them to webpack
        if (res.dependencies) {
          res.dependencies.map((dep) => this.addDependency(dep.file))
        }
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
  }
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
    multi: convertFn.call(this, opts.multi)
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

function promiseReduce (arr, fn, memo) {
  return Promise.all(arr.map(fn.bind(this, memo)))
    .then(_ => memo)
}
