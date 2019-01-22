const Module = require('module');
const path = require('path');

const { resolve, join, dirname } = path;

const originalLoader = Module._load; // eslint-disable-line no-underscore-dangle

let esmImport;

module.exports = function importer(imp) {
  esmImport = imp;
};


Module._load = function _load(request, parent) { // eslint-disable-line no-underscore-dangle
  if (!parent) {
    return originalLoader.apply(this, arguments); // eslint-disable-line prefer-rest-params
  }

  const resolvedPath = getFullPath(request, parent.filename);
  if (resolvedPath.substr(-4) === '.mjs') {
    const mod = load(resolvedPath);
    return mod;
  }

  return originalLoader.apply(this, arguments); // eslint-disable-line prefer-rest-params
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
    return Module._resolveFilename(localModuleName); // eslint-disable-line no-underscore-dangle
  } catch (e) {
    if (isModuleNotFoundError(e)) { return localModuleName; } throw e;
  }
}


function isModuleNotFoundError(e) {
  return e.code && e.code === 'MODULE_NOT_FOUND';
}

function isInNodePath(resolvedPath) {
  if (!resolvedPath) return false;

  return Module.globalPaths
    .map(nodePath => `${resolve(process.cwd(), nodePath)}/`)
    .some(fullNodePath => resolvedPath.indexOf(fullNodePath) === 0);
}
