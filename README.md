# sideloader

Allow test frameworks to dynamically require (sideload) .mjs test files

## Usage

### ava
```js
// ava.config.js
export default {
  babel: false,
  compileEnhancements: false,
  extensions: ['mjs', 'js'],
  require: ['sideloader']
};
```

```shell
NODE_OPTIONS='--experimental-modules --loader sideloader' ava test/
```

### mocha

TODO

## install

```shell
npm i -D sideloader
```
