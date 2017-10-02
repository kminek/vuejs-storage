import assign from 'lodash.assignin'

var count = 0

/**
 * Storage
 * @class
 */
export class Storage {
	/**
	 * Storage constructor
	 * @constructor
	 * @param {Object=} option option object
	 * @param {Object=} option.data data, same as "data" in vue options
	 * @param {String=} option.namespace Storage namespace, if not provide will auto generate a name by vuejs-storage count(unstable)
	 * @param {Storage=} option.storage localStorage/sessionStorage or something has similar api, default is window.localStorage
	 * @param {Function=} option.parse json parsing function, default is JSON.parse
	 * @param {Function=} option.stringify json stringifying function, default is JSON.stringify
	 */
	constructor({
		parse = JSON.parse,
		stringify = JSON.stringify,
		storage = window.localStorage,
		namespace = `vuejs-storage-${count++}`,
		data = {}
	} = {}) {

		this.data = data
		this.parse = parse
		this.stringify = stringify
		this.storage = storage
		this.namespace = namespace

		let item
		if ((item = storage.getItem(this.namespace)) !== null) {
			this.data = this.parse(item)
		}
	}

	/**
	 * load data from localStorage
	 */
	load() {
		let item
		if ((item = this.storage.getItem(this.namespace)) !== null) {
			this.data = assign(this.data,this.parse(item))
		}
	}

	/**
	 * Set value to key
	 * @param {string} key 
	 * @param {any} value 
	 */
	set(key, value) {
		if (arguments.length === 1) {
			this.data = key
		}
		else {
			this.data[key] = value
		}
		this.storage.setItem(this.namespace, this.stringify(this.data))
	}

	/**
	 * Get value of key
	 * @param {string} key
	 */
	get(key) {
		if (!key) {
			return this.data
		}
		return this.data[key]
	}

	/**
	 * Get Vuex plugin from options
	 * @param {Vuex.Store} store 
	 */
	plugin() {
		return store => {
			this.data = store.state
			this.load()
			store.replaceState(this.get())
			store.subscribe((mutation, state) => {
				this.set(this.data)
			})
		}
	}
}

export function install(Vue, config) {
	Vue.mixin({
		beforeCreate() {
			if ('storage' in this.$options) {
				let storage = this.$options.storage
				if (typeof this.$options.storage === 'function') {//function syntax
					storage = this.$options.storage()
				}
				if (!(storage instanceof Storage)) {
					throw new Error('"Storage" must be a "Storage" object')
				}

				this.$options.data = assign(this.$options.data, storage.get()) //set data

				if (!('watch' in this.$options)) {
					this.$options.watch = {}
				}
				for (let key in storage.get()) {//create watchers
					let watcher = v => { }
					if (key in this.$options.watch) {//backup original watcher
						watcher = this.$options.watch[key]
					}
					this.$options.watch[key] = value => {
						storage.set(key, value)
						watcher(value)
					}
				}

				this.$storage = storage
			}
		}
	})
}