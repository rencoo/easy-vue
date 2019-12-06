import { Watcher } from '../observer/index.js'

function node2Fragment (node, vm) {
    var fragment = document.createDocumentFragment(),
        child;

    // 将根节点中的所有节点都劫持并编译到 fragment 中
    while (node.firstChild) {
        child = node.firstChild;
        compile(child, vm);
        fragment.appendChild(child); // 调用appendChild方法, child会从原来的父节点中移除
    }

    return fragment;
}

// 将所有节点与vm实例进行关联; 收集依赖
function compile (node, vm) {
    if (node.nodeType === 3 && node.nodeValue.trim() === '') return; // 忽略回车等空白文本节点

    // 标签嵌套
    if (node.childNodes && node.childNodes.length) {
        for (var i=0, len=node.childNodes.length; i<len; i++) {
            compile(node.childNodes[i], vm);
        }
    }

    var re = /\{\{(.*)\}\}/;

    if (node.nodeType === 1) { // 元素节点
        var attr = node.attributes;

        // 解析节点属性
        for (var i=0; i<attr.length; i++) {
            if (attr[i].nodeName === 'v-model') {
                var name = attr[i].nodeValue; // 获取v-model绑定的属性名
                // node.value = vm[name];
                
                node.addEventListener('input', function (e) {
                    // 给相应的 vm 数据属性赋值, 从而触发该属性的 set 方法
                    vm[name] = e.target.value;
                });

                new Watcher(vm, node, name);

                node.removeAttribute('v-model');
            }
        }
    }
    else if (node.nodeType === 3) { // 文本节点
        node.nodeValue = node.nodeValue.trim();
        if (re.test(node.nodeValue)) {
            var name = RegExp.$1; // 获取匹配到的字符串, 即依赖的属性
            name = name.trim();
            // node.nodeValue = vm[name]; // 将data中的相应属性的值赋给该节点

	        new Watcher(vm, node, name); // 数据响应式
        }
    }
}

export { node2Fragment }