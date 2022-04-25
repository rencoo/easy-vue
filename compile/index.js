import { Watcher } from '../observer/index.js';

function Compile(node, vm) {
  if (!this.isElementNode(node)) alert('请传入正确的根节点');

  this.vm = vm;
  this.node = node;
  this.fragment = this.node2Fragment(node);
  this.init(); // 开始编译
  this.node.appendChild(this.fragment); // 将编译结果挂载到根节点
}

Compile.prototype = {
  node2Fragment(node) {
    var fragment = document.createDocumentFragment(),
      child;

    // 将根节点中的所有节点都劫持到 fragment 中
    while (node.firstChild) {
      child = node.firstChild;
      fragment.appendChild(child); // 调用appendChild方法, child会从原来的父节点中移除
    }

    return fragment;
  },

  init() {
    this.compile(this.fragment);
  },

  compile(node) {
    var childNodes = node.childNodes,
      _this = this;

    Array.from(childNodes).forEach(function (node) {
      if (_this.isElementNode(node)) {
        _this.compileElementNode(node);
      } else if (_this.isTextNode(node)) {
        var reg = /\{\{(.*?)\}\}/g; // 惰性匹配
        // if (reg.test(node.textContent)) { // node.nodeValue // 有多处插值表达式会有问题 {{a}}hello{{a}}{{b}}world
        //     console.log(RegExp.$1);
        //     var name = RegExp.$1.trim();
        //     _this.compileTextNode(node, name);
        // }
        var sMatchArr = node.textContent.match(reg);
        if (sMatchArr && sMatchArr.length) {
          var nameArr = [];
          sMatchArr.forEach((sMatch) => {
            // {{a}}hello{{a}}{{b}}world => [{{a}}, {{a}}, {{b}}]
            if (reg.test(sMatch)) {
              reg.lastIndex = 0;
              var name = RegExp.$1.trim();
              if (nameArr.indexOf(name) === -1) {
                nameArr.push(name);
              }
            }
          });

          nameArr.forEach((name) => {
            // [a, b]; 此节点需要观察a, b两个数据属性
            _this.compileTextNode(node, name);
          });
        }
      }

      if (node.childNodes && node.childNodes.length) {
        _this.compile(node);
      }
    });
  },

  compileElementNode(node) {
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
          compileUtil.eventHandler(node, _this.vm, dirName, dirExp);
        } else {
          // 普通指令
          compileUtil[dirName] && compileUtil[dirName](node, _this.vm, dirExp);
        }

        node.removeAttribute(attrName);
      }
    });
  },

  compileTextNode(node, name) {
    compileUtil.textNode(node, this.vm, name);
  },

  isElementNode(node) {
    return node.nodeType === 1;
  },

  isTextNode(node) {
    return node.nodeType === 3;
  },

  isDirective(attr) {
    return attr.indexOf('v-') === 0;
  },

  isEventDirective(dirName) {
    // v-on:click
    // on:click
    return dirName.indexOf('on') === 0;
  }
};

Compile.prototype.constructor = Compile;

var compileUtil = {
  // textNode's Mustache: {{ text }}
  textNode(node, vm, name) {
    var updaterFn = updater['textNodeUpdater'];

    // updaterFn && updaterFn(node, name, vm[name]);
    updaterFn && updaterFn(node, name, this._getVMVal(vm, name)); // {{ a.b.c }};

    new Watcher(vm, name, function (value, oldValue) {
      updaterFn && updaterFn(node, name, value, oldValue);
    });
  },

  // elementNode's directive : v-
  // TODO: v-text="'hello'" 与 v-html="'<h2>hello</h2>"
  // v-text
  text(node, vm, name) {
    this.bind(node, vm, name, 'text');
  },

  // v-html
  html(node, vm, name) {
    this.bind(node, vm, name, 'html');
  },

  // v-model
  model(node, vm, name) {
    this.bind(node, vm, name, 'model');

    node.addEventListener('input', function (e) {
      vm[name] = e.target.value;
    });
  },

  bind(node, vm, name, dir) {
    var updaterFn = updater[dir + 'Updater'];

    // 初次编译(第一次初始化视图)
    // updaterFn && updaterFn(node, vm[name]);
    updaterFn && updaterFn(node, this._getVMVal(vm, name)); // v-text="a.b.c";

    // 侦测数据变化, 并更新节点
    new Watcher(vm, name, function (value, oldValue) {
      updaterFn && updaterFn(node, value, oldValue);
    });
  },

  eventHandler(node, vm, dirName, dirExp) {
    // on:click
    var eventType = dirName.split(':')[1],
      fn = vm.$options.methods && vm.$options.methods[dirExp];

    if (eventType && fn) {
      node.addEventListener(eventType, fn.bind(vm), false);
    }
  },

  _getVMVal(vm, exp) {
    return parseGetter(exp).call(vm, vm);
  }
};

var updater = {
  // updater for textNode's Mustache: {{ value }}hello{{ text }}world{{ value }}
  textNodeUpdater(node, name, value) {
    // 保存一份编译前的信息, 用于每次更新找到对应的依赖
    if (!node._nodeValue) node._nodeValue = node.nodeValue;
    if (!node._dependData) node._dependData = {};
    node._dependData[name] = value; // 同步依赖数据的值: value、text... => {value: '...', text: '...'}

    var reg = /\{\{(.*?)\}\}/g; // 惰性匹配
    node.nodeValue = node._nodeValue.replace(reg, function (sMatch, $1) {
      var name = $1.trim();
      var depends = Object.keys(node._dependData);
      if (depends.indexOf(name) !== -1) {
        return node._dependData[name];
      } else {
        // 初始编译时, 先编译第一个依赖数据, 再编译第二个依赖数据... 一次仅编译一个数据
        // 当文本节点依赖的所有数据都初始编译过一遍之后(此时所有的依赖数据都已经收集到node._dependData中), 就不会再走这个分支了
        return sMatch;
      }
    });
  },

  // updater for elementNode's directive: v-
  textUpdater(node, value) {
    node.textContent = typeof value == 'undefined' ? '' : value; // node.nodeValue
  },

  htmlUpdater(node, value) {
    node.innerHTML = typeof value == 'undefined' ? '' : value;
  },

  modelUpdater(node, value) {
    node.value = typeof value == 'undefined' ? '' : value;
  }
};

/**
 * 解析简单的路径 ex 'a.b.c' => data.a.b.c
 * @param {String} exp
 */
function parseGetter(exp) {
  var reg = /[^\w.$]/; // 不匹配 单词字符(所有的字母、所有的数字和下划线), . 和 $
  if (reg.test(exp)) return;

  var exps = exp.split('.');
  return function (obj) {
    for (var i = 0, len = exps.length; i < len; i++) {
      if (!obj) return;
      obj = obj[exps[i]];
    }

    return obj;
  };
}

export { Compile };
