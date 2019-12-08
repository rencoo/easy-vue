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
		this.id = Dep.uid++;
	}

	static target = null;
	static uid = 0;
	
	// depend () {
	// 	Dep.target.addDep(this);
	// }
	addSub (sub) {
		this.subs.push(sub);
		// console.log(this.id, this.subs);
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
	constructor (vm, name, cb) {
		this.vm = vm;
		this.name = name;
		this.cb = cb;
		this.depIds = {};
		this.update(); // 更新视图
	}
	addDep (dep) {
		// 每次数据更新触发update然后触发get, 都会向订阅者列表 dep 里边重复添加该 watcher
		// 判断是否已经订阅过该主题对象了(依赖数据的代理)
		// 也可以在 dep.addSub 方法里判断, 主题对象的订阅者列表里是否已经存在了该 watcher
		if (!this.depIds.hasOwnProperty(dep.id)) {
			dep.addSub(this);
			this.depIds[dep.id] = dep;
		}
	}
	// 触发数据属性的getter, 从而将watcher实例添加到dep中, 与observer建立联系
	get () {
		Dep.target = this; // 暴露watcher
		var value = this.vm[this.name]; // 触发属性的getter(Observer类中), 从而添加订阅者
		Dep.target = null;
		return value;
	}
	update () {
		var value = this.get(); // 获取到依赖属性的值
		var oldValue = this.value;
		if (value !== oldValue) {
			this.value = value;
			
			// 更新视图
			this.cb.call(this.vm, value, oldValue);
		}
	}
}

export { Observer, Dep, Watcher }