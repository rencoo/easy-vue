// 观察vm数据改变
class Observer {
  constructor(data) {
    this.walk(data);
  }

  walk(data) {
    var _this = this;
    Object.keys(data).forEach(function (key) {
      _this.convert(data, key, data[key]);
    });
  }

  convert(data, key, val) {
    // 将构造参数里的 data 选项数据, 代理到 vm 实例对象中
    Observer.defineReactive(data, key, val);
  }

  // 数据响应式原理
  // 定义响应式数据
  static defineReactive(obj, key, val) {
    // data () { obj: { a: { b: { c: 'hello' } } } }
    // 递归子属性
    if (typeof val === 'object') {
      new Observer(val);
    }
    var dep = new Dep();
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: false, // 不能再 define
      get() {
        if (Dep.target) {
          // dep.depend();
          Dep.target.addDep(dep); // 添加watcher到dep
          console.log(dep.id, ' 添加订阅');
        }
        return val;
      },
      set(newVal) {
        if (newVal === val) {
          return;
        }
        val = newVal;
        dep.notify();
      }
    });
  }
}

// 中介者
class Dep {
  constructor() {
    this.subs = [];
    this.id = Dep.uid++;
  }

  static target = null;
  static uid = 0;

  // depend () {
  // 	Dep.target.addDep(this);
  // }

  addSub(sub) {
    this.subs.push(sub);
    // console.log(this.id, this.subs);
  }

  deSub(sub) {
    var index = this.subs.indexOf(sub);
    if (index !== -1) {
      this.subs.splice(index, 1);
    }
  }

  notify() {
    this.subs.forEach(function (sub) {
      sub.update();
    });
  }
}

// 订阅者, 订阅vm数据(各个节点都是订阅者)
class Watcher {
  constructor(vm, expOrFn, cb) {
    this.vm = vm;

    // expOrFn 参数支持函数(ex.vm.$watch)
    if (typeof expOrFn === 'function') {
      // console.log('函数');
      this.getter = expOrFn;
    } else {
      this.getter = parseGetter(expOrFn);
    }
    this.cb = cb;
    // this.depIds = {};
    this.value = this.get(); // 生成watcher实例时, 触发依赖数据的 getter 从而添加订阅
  }

  addDep(dep) {
    // 每次数据更新触发update然后触发get, 都会向订阅者列表 dep 里边重复添加该 watcher
    // 判断是否已经订阅过该依赖了
    // 也可以在 dep.addSub 方法里判断, 依赖属性的订阅者列表里是否已经存在了该 watcher
    // if (!this.depIds.hasOwnProperty(dep.id)) {
    // 	dep.addSub(this);
    // 	this.depIds[dep.id] = dep;
    // }
    dep.addSub(this); // update 里不通过 get 取值, 就不会重复添加了...
  }

  // 触发数据属性的getter, 从而将watcher实例添加到dep中, 与observer建立联系
  get() {
    Dep.target = this; // 暴露watcher
    // var value = this.vm[this.name]; // 触发属性的getter(Observer类中), 从而添加订阅
    var value = this.getter.call(this.vm, this.vm);
    Dep.target = null;
    return value;
  }

  update() {
    // console.log('侦测到'+ this.name +'数据更新(setter)时, 调用相关watcher的update');
    // var value = this.get(); // 获取到依赖属性的值; 这样会通过 get方法重复添加订阅, 这是我们不希望的
    // var value = this.vm[this.name]; // 直接获取依赖属性的更新值; 这样不会添加订阅
    var value = this.getter.call(this.vm, this.vm);
    var oldValue = this.value;
    if (value !== oldValue) {
      this.value = value;

      // 更新视图
      this.cb.call(this.vm, value, oldValue);
    }
  }
}

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

export { Observer, Dep, Watcher };
