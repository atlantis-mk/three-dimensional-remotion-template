// 使用工程自身的 content.ts 和 Zod，避免另维护一份会漂移的参数 schema。
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
try {
  const {transformSync} = require('esbuild');
  const source = path.resolve(__dirname, '../src/content.ts');
  const compiled = transformSync(fs.readFileSync(source, 'utf8'), {loader: 'ts', format: 'cjs', target: 'es2020'});
  const mod = {exports: {}};
  new Function('require', 'module', 'exports', compiled.code)(createRequire(source), mod, mod.exports);
  const {contentSchema, defaultContent} = mod.exports;
  const [action, filename] = process.argv.slice(2);
  if (!filename || !['export', 'validate'].includes(action)) throw new Error('用法：node scripts/content.cjs export|validate FILE');
  if (action === 'export') {
    // wx 防止重复初始化覆盖本期文案。
    fs.writeFileSync(filename, JSON.stringify(defaultContent, null, 2) + '\n', {flag: 'wx'});
  } else {
    const result = contentSchema.safeParse(JSON.parse(fs.readFileSync(filename, 'utf8')));
    if (!result.success) throw new Error(JSON.stringify(result.error.issues));
  }
  console.log(JSON.stringify({ok: true, action, file: filename}));
} catch (error) {
  console.log(JSON.stringify({ok: false, error: error.message}));
  process.exitCode = 5;
}
