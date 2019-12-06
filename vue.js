import { node2Fragment } from './compile/index.js'
import { Observer } from './observer/index.js' 

function Vue (options) {
    // vm数据属性改变, 视图做出响应
    new Observer(options.data, this); 

    // 从根节点开始编译HTML
    var id = options.el;
    var fragment = node2Fragment(document.getElementById(id), this);

    // 将编译完成后的虚拟dom挂载到app的根节点中
    document.getElementById(id).appendChild(fragment);
}

export { Vue }