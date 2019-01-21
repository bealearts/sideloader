
module.exports = function req(parent) {
  return path => {
    parent.exports.getRunner();

    const mod = require(path);

    if (mod.catch) {
      mod.catch(error => {
        throw new Error(error);
      });
    }

    return mod;
  };
}

module.exports[Symbol.for('esm\u200D:package')] = true;
