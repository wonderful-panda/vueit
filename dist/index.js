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
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	__webpack_require__(1);
	var Vue = __webpack_require__(2);
	
	var AnnotatedOptions = function AnnotatedOptions() {
	    _classCallCheck(this, AnnotatedOptions);
	
	    this.props = {};
	    this.watch = {};
	    this.events = {};
	};
	
	var AnnotatedOptionsKey = "vueit:component-options";
	var DesignTypeKey = "design:type";
	var DesignParamTypesKey = "design:paramtypes";
	var internalHooks = ["data", "render", "beforeCreate", "created", "beforeMount", "mounted", "beforeUpdate", "updated", "activated", "deactivated", "beforeDestroy", "destroyed"];
	function warn(msg) {
	    console.warn("[vueit warn]: " + msg);
	}
	function error(msg) {
	    console.error("[vueit error]: " + msg);
	}
	function makeComponent(target, option) {
	    option = Object.assign({}, option);
	    option.name = option.name || target["name"];
	    if (option.compiledTemplate) {
	        option.render = option.compiledTemplate.render;
	        option.staticRenderFns = option.compiledTemplate.staticRenderFns;
	        if (option.template) {
	            warn("\"compiledtemplate\" and \"template\" are exclusive. \"template\" is ignored: " + target.name);
	            delete option.template;
	        }
	    }
	    ;
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
	function makefunctionalComponent(target) {
	    var obj = "render" in target ? target : target.prototype;
	    var render = obj.render;
	    if (render.length != 2) {
	        error("\"render\" function must have 2 parameters: " + target.name);
	        return;
	    }
	    var ao = Reflect.getOwnMetadata(AnnotatedOptionsKey, obj);
	    var props = ao ? ao.props : {};
	    var options = {
	        name: target.name,
	        functional: true,
	        props: props,
	        render: props ? function (h, context) {
	            return render.bind(context.props)(h, context);
	        } : render
	    };
	    return Vue.extend(options);
	}
	function getParamNames(source) {
	    var withoutComment = source.replace(/(\/\*.*?\*\/)|(\/\/.*$)/mg, "");
	    var matched = /\(\s*(.*?)\s*\)/.exec(withoutComment);
	    if (!matched) {
	        return [];
	    }
	    return matched[1].split(/\s*,\s*/g);
	}
	function getAnnotatedOptions(target) {
	    var ann = Reflect.getOwnMetadata(AnnotatedOptionsKey, target);
	    if (ann == null) {
	        ann = new AnnotatedOptions();
	        Reflect.defineMetadata(AnnotatedOptionsKey, ann, target);
	    }
	    return ann;
	}
	function trySetPropTypeValidation(target, propertyKey, opts, type) {
	    if ([String, Number, Boolean, Function, Array].indexOf(type) <= -1) {
	        return;
	    }
	    if (typeof opts.type !== "undefined") {
	        if ([String, Number, Boolean, Function, Array].indexOf(opts.type) >= 0 && opts.type !== type) {
	            warn("specified type validation does not match design type: " + target.constructor.name + "." + propertyKey);
	        }
	        return;
	    }
	    opts.type = type;
	}
	function defineProp(target, propertyKey, options) {
	    options = Object.assign({}, options);
	    var type = Reflect.getOwnMetadata(DesignTypeKey, target, propertyKey);
	    trySetPropTypeValidation(target, propertyKey, options, type);
	    getAnnotatedOptions(target).props[propertyKey] = options;
	}
	function defineWatch(target, propertyKey, option) {
	    var descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
	    if (typeof descriptor.value !== "function") {
	        warn("@watch() can decorate only function: " + target.constructor.name + "." + propertyKey);
	        return;
	    }
	    getAnnotatedOptions(target).watch[option.name] = {
	        handler: descriptor.value,
	        deep: option.deep,
	        immediate: option.immediate
	    };
	}
	var prop = function prop() {
	    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	        args[_key] = arguments[_key];
	    }
	
	    if (args.length <= 1) {
	        var _ret = function () {
	            // Used with argument list. Like `@prop()` or `@prop({ ... })`
	            var options = args[0] || {};
	            return {
	                v: function v(target, propertyKey) {
	                    return defineProp(target, propertyKey.toString(), options);
	                }
	            };
	        }();
	
	        if ((typeof _ret === "undefined" ? "undefined" : _typeof(_ret)) === "object") return _ret.v;
	    } else {
	        // Used without argument list. Like `@prop`
	        var target = args[0];
	        var propertyKey = args[1].toString();
	        defineProp(target, propertyKey, {});
	    }
	};
	prop.required = function () {
	    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	        args[_key2] = arguments[_key2];
	    }
	
	    if (args.length <= 1) {
	        // Used with argument list. Like `@prop.required()` or `@prop.required({ ... })`
	        return prop(Object.assign({ required: true }, args[0]));
	    } else {
	        // Used without argument list. Like `@prop.required`
	        return prop({ required: true }).apply(null, args);
	    }
	};
	prop.default = function (defaultValue, options) {
	    return prop(Object.assign({ default: defaultValue }, options));
	};
	var vueit = {
	    component: function component(option) {
	        return function (target) {
	            return makeComponent(target, option || {});
	        };
	    },
	
	    functionalComponent: makefunctionalComponent,
	    prop: prop,
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