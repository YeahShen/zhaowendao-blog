/* Hexo 8 的脚本加载方式是把本文件内容包进
 * async function (exports, require, module, __filename, __dirname, hexo) { ... }
 * 中执行，module.exports 不会被自动调用，因此这里直接调用实现在 helpers/ 下的函数。
 * 注意：Hexo 只加载 scripts/ 顶层的文件，不递归子目录。 */
require('./helpers/icon')(hexo);
