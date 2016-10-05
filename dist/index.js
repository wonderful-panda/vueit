(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("reflect-metadata"), require("vue"));
	else if(typeof define === 'function' && define.amd)
		define(["reflect-metadata", "vue"], factory);
	else if(typeof exports === 'object')
		exports["vueit"] = factory(require("reflect-metadata"), require("vue"));
	else
		root["vueit"] = factory(root["reflect-metadata"], root["vue"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__, __WEBPACK_EXTERNAL_MODULE_2__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	__webpack_require__(1);
	var Vue = __webpack_require__(2);
	
	var AnnotatedOptions = function AnnotatedOptions() {
	    _classCallCheck(this, AnnotatedOptions);
	
	    this.props = {};
	    this.watch = {};
	    this.events = {};
	};
	
	var AnnotatedOptionsKey = "vue-component-decorator:options";
	var DesignTypeKey = "design:type";
	/*
	  data?: Object | ((this: V) => Object);
	  el?: Element | String;
	  render?(this: V, createElement: $createElement): VNode;
	  beforeCreate?(this: V): void;
	  created?(this: V): void;
	  beforeDestroy?(this: V): void;
	  destroyed?(this: V): void;
	  beforeMount?(this: V): void;
	  mounted?(this: V): void;
	  beforeUpdate?(this: V): void;
	  updated?(this: V): void;
	}
	
	
	 * */
	var internalHooks = ["data", "render", "beforeCreate", "created", "beforeMount", "mounted", "beforeUpdate", "updated", "activated", "deactivated", "beforeDestroy", "destroyed"];
	function assign(target, other) {
	    Object.keys(other).forEach(function (k) {
	        target[k] = other[k];
	    });
	    return target;
	}
	function makeComponent(target, option) {
	    option = assign({}, option);
	    option.name = option.name || target["name"];
	    var proto = target.prototype;
	    Object.getOwnPropertyNames(proto).filter(function (name) {
	        return name !== "constructor";
	    }).forEach(function (name) {
	        // hooks
	        if (internalHooks.indexOf(name) > -1) {
	            option[name] = proto[name];
	        }
	        var descriptor = Object.getOwnPropertyDescriptor(proto, name);
	        if (typeof descriptor.value === "function") {
	            // methods
	            (option.methods || (option.methods = {}))[name] = descriptor.value;
	        } else if (descriptor.get || descriptor.set) {
	            // computed
	            (option.computed || (option.computed = {}))[name] = {
	                get: descriptor.get,
	                set: descriptor.set
	            };
	        }
	    });
	    var ann = Reflect.getOwnMetadata(AnnotatedOptionsKey, proto);
	    if (ann != null) {
	        // props
	        option.props = option.props || ann.props;
	        // watch
	        option.watch = option.watch || ann.watch;
	    }
	    // find super
	    var superProto = Object.getPrototypeOf(proto);
	    var Super = superProto instanceof Vue ? superProto.constructor : Vue;
	    return Super.extend(option);
	}
	function getAnnotatedOptions(target) {
	    var ann = Reflect.getOwnMetadata(AnnotatedOptionsKey, target);
	    if (ann == null) {
	        ann = new AnnotatedOptions();
	        Reflect.defineMetadata(AnnotatedOptionsKey, ann, target);
	    }
	    return ann;
	}
	function defineProp(target, propertyKey, option) {
	    // detect design type and set prop validation
	    if ("type" in option) {} else {
	        var type = Reflect.getOwnMetadata(DesignTypeKey, target, propertyKey);
	        if ([String, Number, Boolean, Function, Array].indexOf(type) > -1) {
	            option = assign({ type: type }, option);
	        }
	    }
	    getAnnotatedOptions(target).props[propertyKey] = option;
	}
	function defineWatch(target, propertyKey, option) {
	    var descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
	    if (typeof descriptor.value !== "function") {
	        // TODO: show warning
	        return;
	    }
	    getAnnotatedOptions(target).watch[option.name] = {
	        handler: descriptor.value,
	        deep: option.deep,
	        immediate: option.immediate
	    };
	}
	var prop = function prop(option) {
	    return function (target, propertyKey) {
	        return defineProp(target, propertyKey.toString(), option || {});
	    };
	};
	var vueit = {
	    component: function component(option) {
	        return function (target) {
	            return makeComponent(target, option || {});
	        };
	    },
	    prop: prop,
	    p: prop(),
	    pr: prop({ required: true }),
	    pd: function pd(defaultValue) {
	        return prop({ default: defaultValue });
	    },
	    watch: function watch(option) {
	        return function (target, propertyKey) {
	            return defineWatch(target, propertyKey.toString(), typeof option === "string" ? { name: option } : option);
	        };
	    }
	};
	module.exports = vueit;

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_2__;

/***/ }
/******/ ])
});
;
//# sourceMappingURL=index.js.map