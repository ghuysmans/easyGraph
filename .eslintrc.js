module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint',
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: ['prettier', 'plugin:prettier/recommended'],
  plugins: ['prettier'],
}
