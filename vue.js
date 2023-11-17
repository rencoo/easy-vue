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

  // 数据劫持
  new Observer(options.data);

  // 从根节点开始编译HTML
  // compile过程中，会实例化Watcher，然后watcher会订阅数据的变化（通过Dep中介），数据变化后会通过Dep发布变化，从而触发watcher的update方法，进而触发编译节点的内容更新
  new Compile(document.querySelector(options.el), this);
}

Vue.prototype.$watch = function (expOrFn, cb, options) {
  var vm = this;
  new Watcher(vm, expOrFn, cb, options);
};

export { Vue };
