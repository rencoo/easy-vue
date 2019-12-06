import { Watcher } from '../observer/index.js'

function Compile (node, vm) {
    if (!this.isElementNode(node)) alert("请传入正确的根节点");

    this.vm = vm;
    this.node = node;
    this.fragment = this.node2Fragment(node);
    this.init(); // 开始编译
    this.node.appendChild(this.fragment); // 将编译结果挂载到根节点
}

Compile.prototype = {
    node2Fragment (node) {
        var fragment = document.createDocumentFragment(),
            child;
    
        // 将根节点中的所有节点都劫持到 fragment 中
        while (node.firstChild) {
            child = node.firstChild;
            fragment.appendChild(child); // 调用appendChild方法, child会从原来的父节点中移除
        }
    
        return fragment;
    },

    init () {
        this.compile(this.fragment);
    },

    compile (node) {
        var childNodes = node.childNodes,
            _this = this;

        Array.from(childNodes).forEach(function (node) {
            if (_this.isElementNode(node)) {
                _this.compileElement(node);
            }
            else if (_this.isTextNode(node)) {
                var reg = /\{\{(.*)\}\}/;
                if (reg.test(node.textContent)) { // node.nodeValue
                    var name = RegExp.$1.trim();
                    _this.compileText(node, name);
                }
            }
            
            if (node.childNodes && node.childNodes.length) {
                _this.compile(node);
            }
        });

    },

    compileElement (node) {
        var nodeAttrs = node.attributes,
            _this = this;
        
        Array.from(nodeAttrs).forEach(function (attr) {
            var attrName = attr.name; // attr.nodeName
            if (_this.isDirective(attrName)) {
                // v-model="text", v-on:click="clickHandler"
                var dirName = attrName.substring(2); // 删除v-
                var dirExp = attr.value; // attr.nodeValue
                // 事件指令
                if (_this.isEventDirective(dirName)) {
                    compileUtil.eventHandler(node, _this.vm, dirName, dirExp)
                } else { // 普通指令
                    compileUtil[dirName] && compileUtil[dirName](node, _this.vm, dirExp);
                }

                node.removeAttribute(attrName);
            }
        })
    },

    compileText (node, name) {
        compileUtil.text(node, this.vm, name);
    },

    isElementNode (node) {
        return node.nodeType === 1;
    },

    isTextNode (node) {
        return node.nodeType === 3;
    },

    isDirective (attr) {
        return attr.indexOf('v-') === 0;
    },

    isEventDirective (dirName) {
        // v-on:click
        // on:click
        return dirName.indexOf('on') === 0;
    }
};

Compile.prototype.constructor = Compile;

var compileUtil = {
    // TODO: v-text="'hello'" 与 v-html="'<h2>hello</h2>"
    // {{ text }} 与 v-text
    text (node, vm, name) {
        new Watcher(vm, node, name, 'text');
    },

    html (node, vm, name) {
        new Watcher(vm, node, name, 'html');
    },

    model (node, vm, name) {
        node.addEventListener('input', function (e) {
            vm[name] = e.target.value;
        });
        new Watcher(vm, node, name, 'model');
    },
    // Watcher 的第四个参数用于指示, 具体对节点的什么属性进行操作
    // 比如
    // v-model对应的是 node.value(input)
    // v-text对应的是 node.innerText 或者 node.textContent
    // v-html对应的是 node.innerHtml

    eventHandler (node, vm, dirName, dirExp) {
        // on:click
        var eventType = dirName.split(':')[1],
            fn = vm.options.methods && vm.options.methods[dirExp];

        if (eventType && fn) {
            node.addEventListener(eventType, fn.bind(vm), false);
        }
    }
};

export { Compile }