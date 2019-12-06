// 观察vm数据改变
class Observer {
	constructor (data, vm) {
		this.vm = vm;
		this.walk(data);
	}
	walk (data) {
		var _this = this;
		Object.keys(data).forEach(function (key) {
			_this.convert(key, data[key]);
		});
	}
	convert(key, val) {
		// 将构造参数里的 data 选项数据, 代理到 vm 实例对象中
		Observer.defineReactive(this.vm, key, val);
	}

	// 数据响应式原理
	// 定义响应式数据
	static defineReactive (obj, key, val) {
		var dep = new Dep();
		Object.defineProperty(obj, key, {
			enumerable: true,
			configurable: false, // 不能再 define
			get () {
				if (Dep.target) {
					// dep.depend();
					Dep.target.addDep(dep); // 添加watcher到dep
				}
				return val;
			},
			set (newVal) {
				if (newVal === val) {
					return;
				}
				val = newVal;
				dep.notify();
			}
		})
	}
}

// 中介者
class Dep {
	constructor () {
		this.subs = [];
	}

	static target = null;
	
	// depend () {
	// 	Dep.target.addDep(this);
	// }
	addSub (sub) {
		this.subs.push(sub);
	}
	deSub (sub) {
		var index = this.subs.indexOf(sub);
		if (index !== -1) {
			this.subs.splice(index, 1);
		}
	}
	notify () {
		this.subs.forEach(function (sub) {
			sub.update();
		});
	}
}

// 订阅者, 订阅vm数据(各个节点都是订阅者)
class Watcher {
	constructor (vm, node, name) {
		this.vm = vm;
		this.node = node;
		this.name = name;
		this.update(); // 更新视图
	}
	addDep (dep) {
		dep.addSub(this);
	}
	// 触发数据属性的getter, 从而将watcher实例添加到dep中, 与observer建立联系
	get () {
		Dep.target = this; // 暴露watcher
		var value = this.vm[this.name]; // 触发属性的getter(Observer类中), 从而添加订阅者
		Dep.target = null;
		return value;
	}
	update () {
		// debugger;
		var value = this.get(); // 获取到依赖属性的值
		var oldValue = this.value;
		if (value !== oldValue) {
			this.value = value;
			// 更新DOM节点信息
			// this.cb.call(this.vm, value, oldValue);

			if (this.node.nodeType === 1) { // 元素节点(nodeValue为null)
				console.log('更新元素节点');
				this.node.value = this.value; // 更新视图
			} 
			else if (this.node.nodeType === 3) // 文本节点
            {
				console.log('更新文本节点');
                this.node.nodeValue = this.value; // 更新视图
            }
		}
	}
}

export { Observer, Dep, Watcher }