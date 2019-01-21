const Module = require('module');
const resolve = require('path').resolve;
const join = require('path').join;
const dirname = require('path').dirname;
const vm = require('vm');
const fs = require('fs');

const originalLoader = Module._load;

let esmImport;

module.exports = function importer(imp) {
  esmImport = imp;
}


Module._load = function(request, parent) {
  if (!parent) return originalLoader.apply(this, arguments);

  const resolvedPath = getFullPath(request, parent.filename);
  if (resolvedPath.substr(-4) === '.mjs') {
      const mod = load(resolvedPath);
      return mod;
  }

  return originalLoader.apply(this, arguments);
};


async function load(path) {
  await esmImport(path);
}


function getFullPath(path, calledFrom) {
  let resolvedPath;
  try {
    resolvedPath = require.resolve(path);
  } catch (e) {
    // do nothing
  }

  const isLocalModule = /^\.{1,2}[/\\]?/.test(path);
  const isInPath = isInNodePath(resolvedPath);
  const isExternal = !isLocalModule && /[/\\]node_modules[/\\]/.test(resolvedPath);
  const isSystemModule = resolvedPath === path;

  if (isExternal || isSystemModule || isInPath) {
    return resolvedPath;
  }

  if (!isLocalModule) {
    return path;
  }

  const localModuleName = join(dirname(calledFrom), path);
  try {
    return Module._resolveFilename(localModuleName);
  } catch (e) {
    if (isModuleNotFoundError(e)) { return localModuleName; } else { throw e; }
  }
}


function isModuleNotFoundError(e) {
  return e.code && e.code === 'MODULE_NOT_FOUND';
}

function isInNodePath(resolvedPath) {
  if (!resolvedPath) return false;

  return Module.globalPaths
    .map((nodePath) => {
      return resolve(process.cwd(), nodePath) + '/';
    })
    .some((fullNodePath) => {
      return resolvedPath.indexOf(fullNodePath) === 0;
    });
}
