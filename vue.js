import { Compile } from './compile/index.js'
import { Observer, Watcher } from './observer/index.js' 

function Vue (options) {
    this.$options = options; // 用于查找methods等非数据属性

    // vm数据属性改变, 视图做出响应
    new Observer(options.data, this); 

    // 从根节点开始编译HTML
    new Compile(document.querySelector(options.el), this);
}

Vue.prototype.$watch = function (expOrFn, cb, options) {
    var vm = this;
    new Watcher(vm, expOrFn, cb, options);
};

export { Vue }