import { Compile } from './compile/index.js';
import { Observer, Watcher } from './observer/index.js';

function Vue(options) {
  this.$options = options; // 用于查找methods等非数据属性

  var data = options.data,
    vm = this;
  // 属性代理, 实现 vm.xxx -> options.data.xxx
  // 目的是触发响应式数据 options.data 中的 getter 与 setter
  Object.keys(data).forEach(function (key) {
    Object.defineProperty(vm, key, {
      configurable: false,
      enumerable: true,
      get() {
        return data[key];
      },
      set(newVal) {
        data[key] = newVal;
      }
    });
  });

  // vm数据属性改变, 视图做出响应
  new Observer(options.data);

  // 从根节点开始编译HTML
  new Compile(document.querySelector(options.el), this);
}

Vue.prototype.$watch = function (expOrFn, cb, options) {
  var vm = this;
  new Watcher(vm, expOrFn, cb, options);
};

export { Vue };
