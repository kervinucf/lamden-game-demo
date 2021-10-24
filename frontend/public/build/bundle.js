
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind$1(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.37.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function generateUUID$1() { // Public Domain/MIT
        let u = Date.now().toString(16) + Math.random().toString(16) + '0'.repeat(16);
        return [u.substr(0,8), u.substr(8,4), '4000-8' + u.substr(13,3), u.substr(16,12)].join('-');
    }

    class Symbol$1 {
        constructor(name = Symbol$1.random()) {
            this.name = name;

            
            this.img = new Image();
            this.img.src = `https://s3.wasabisys.com/lamden-telegram-casino/test/${name}.png`;
            this.img.className = 'slot-tile tile-img';
            this.img.id = `${name + '-' + generateUUID$1()}`; 
        }

        static preload() {
            Symbol$1.symbols.forEach((symbol) => new Symbol$1(symbol));
        }

        static get symbols() {

            let prod = [
                "bitcoin",
                "rswp",
                "ethereum",
                "tau",
                "diamond",
                "star",
                "seven",
                "cherry",
                "grape",
                ];

            return prod
        }

        static random() {

            return this.symbols[Math.floor(Math.pow(10,14)*Math.random()*Math.random())%(this.symbols.length-1)];
        }
        static choose(index) {
            return this.symbols[index];
        }
        }

    class Reel$1 {
      constructor(reelContainer, idx, initialSymbols) {
          this.reelContainer = reelContainer;
          this.idx = idx;
          this.symbolContainer = document.createElement("div");
          this.symbolContainer.classList.add("icons");
          this.reelContainer.appendChild(this.symbolContainer);
          

          this.animation = this.symbolContainer.animate(
          [
            { transform: "none", filter: "blur(0)" },
            { filter: "blur(2px)", offset: 0.5 },
            { 
            transform: `translateY(-${
          ((Math.floor(this.factor) * 10) /
          (3 + Math.floor(this.factor) * 10)) *
          100
        }%)`,
            filter: "blur(0)",
            },
          ],
          {
            duration: this.factor * 1000,
            easing: "ease-in-out",
          }
          );
          this.animation.cancel();

          initialSymbols.forEach((symbol) => {
            this.symbolContainer.appendChild(new Symbol$1(symbol).img);
          }
            
          );
        }

        get factor() {
          return 1 + Math.pow(this.idx / 2, 2);
        }

        renderSymbols(nextSymbols) {
          const fragment = document.createDocumentFragment();

          for (let i = 3; i < 3 + Math.floor(this.factor) * 10; i++) {
          const icon = new Symbol$1(
            i >= 10 * Math.floor(this.factor) - 2
            ? nextSymbols[i - Math.floor(this.factor) * 10]
            : undefined
          );
          fragment.appendChild(icon.img);
          }

          this.symbolContainer.appendChild(fragment);
        }

        spin = async () => {
          const animationPromise = new Promise(
            (resolve) => (this.animation.onfinish = resolve)
          );
          const timeoutPromise = new Promise((resolve) =>
            setTimeout(resolve, this.factor * 3000)
          );

          this.animation.play();

          return Promise.race([animationPromise, timeoutPromise]).then(() => {

          if (this.animation.playState !== "finished") this.animation.finish();

          const max = this.symbolContainer.children.length - 3;
          for (let i = 0; i < max; i++) {
            this.symbolContainer.firstChild.remove();
          }
          let clip = new Audio('/assests/sounds/spin_end.mp3');
          var un_mute = document.getElementById('un-mute');

          if (un_mute) {
            clip.play();
          }
          });
        }
      }

    var bind = function bind(fn, thisArg) {
      return function wrap() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        return fn.apply(thisArg, args);
      };
    };

    /*global toString:true*/

    // utils is a library of generic helper functions non-specific to axios

    var toString = Object.prototype.toString;

    /**
     * Determine if a value is an Array
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Array, otherwise false
     */
    function isArray(val) {
      return toString.call(val) === '[object Array]';
    }

    /**
     * Determine if a value is undefined
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if the value is undefined, otherwise false
     */
    function isUndefined(val) {
      return typeof val === 'undefined';
    }

    /**
     * Determine if a value is a Buffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Buffer, otherwise false
     */
    function isBuffer(val) {
      return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
        && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
    }

    /**
     * Determine if a value is an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an ArrayBuffer, otherwise false
     */
    function isArrayBuffer(val) {
      return toString.call(val) === '[object ArrayBuffer]';
    }

    /**
     * Determine if a value is a FormData
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an FormData, otherwise false
     */
    function isFormData(val) {
      return (typeof FormData !== 'undefined') && (val instanceof FormData);
    }

    /**
     * Determine if a value is a view on an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
     */
    function isArrayBufferView(val) {
      var result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
      }
      return result;
    }

    /**
     * Determine if a value is a String
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a String, otherwise false
     */
    function isString(val) {
      return typeof val === 'string';
    }

    /**
     * Determine if a value is a Number
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Number, otherwise false
     */
    function isNumber(val) {
      return typeof val === 'number';
    }

    /**
     * Determine if a value is an Object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Object, otherwise false
     */
    function isObject(val) {
      return val !== null && typeof val === 'object';
    }

    /**
     * Determine if a value is a plain Object
     *
     * @param {Object} val The value to test
     * @return {boolean} True if value is a plain Object, otherwise false
     */
    function isPlainObject(val) {
      if (toString.call(val) !== '[object Object]') {
        return false;
      }

      var prototype = Object.getPrototypeOf(val);
      return prototype === null || prototype === Object.prototype;
    }

    /**
     * Determine if a value is a Date
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Date, otherwise false
     */
    function isDate(val) {
      return toString.call(val) === '[object Date]';
    }

    /**
     * Determine if a value is a File
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a File, otherwise false
     */
    function isFile(val) {
      return toString.call(val) === '[object File]';
    }

    /**
     * Determine if a value is a Blob
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Blob, otherwise false
     */
    function isBlob(val) {
      return toString.call(val) === '[object Blob]';
    }

    /**
     * Determine if a value is a Function
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Function, otherwise false
     */
    function isFunction(val) {
      return toString.call(val) === '[object Function]';
    }

    /**
     * Determine if a value is a Stream
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Stream, otherwise false
     */
    function isStream(val) {
      return isObject(val) && isFunction(val.pipe);
    }

    /**
     * Determine if a value is a URLSearchParams object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a URLSearchParams object, otherwise false
     */
    function isURLSearchParams(val) {
      return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
    }

    /**
     * Trim excess whitespace off the beginning and end of a string
     *
     * @param {String} str The String to trim
     * @returns {String} The String freed of excess whitespace
     */
    function trim(str) {
      return str.replace(/^\s*/, '').replace(/\s*$/, '');
    }

    /**
     * Determine if we're running in a standard browser environment
     *
     * This allows axios to run in a web worker, and react-native.
     * Both environments support XMLHttpRequest, but not fully standard globals.
     *
     * web workers:
     *  typeof window -> undefined
     *  typeof document -> undefined
     *
     * react-native:
     *  navigator.product -> 'ReactNative'
     * nativescript
     *  navigator.product -> 'NativeScript' or 'NS'
     */
    function isStandardBrowserEnv() {
      if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                               navigator.product === 'NativeScript' ||
                                               navigator.product === 'NS')) {
        return false;
      }
      return (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined'
      );
    }

    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     */
    function forEach(obj, fn) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }

      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }

      if (isArray(obj)) {
        // Iterate over array values
        for (var i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Iterate over object keys
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            fn.call(null, obj[key], key, obj);
          }
        }
      }
    }

    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    function merge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (isPlainObject(result[key]) && isPlainObject(val)) {
          result[key] = merge(result[key], val);
        } else if (isPlainObject(val)) {
          result[key] = merge({}, val);
        } else if (isArray(val)) {
          result[key] = val.slice();
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Extends object a by mutably adding to it the properties of object b.
     *
     * @param {Object} a The object to be extended
     * @param {Object} b The object to copy properties from
     * @param {Object} thisArg The object to bind function to
     * @return {Object} The resulting value of object a
     */
    function extend(a, b, thisArg) {
      forEach(b, function assignValue(val, key) {
        if (thisArg && typeof val === 'function') {
          a[key] = bind(val, thisArg);
        } else {
          a[key] = val;
        }
      });
      return a;
    }

    /**
     * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
     *
     * @param {string} content with BOM
     * @return {string} content value without BOM
     */
    function stripBOM(content) {
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return content;
    }

    var utils = {
      isArray: isArray,
      isArrayBuffer: isArrayBuffer,
      isBuffer: isBuffer,
      isFormData: isFormData,
      isArrayBufferView: isArrayBufferView,
      isString: isString,
      isNumber: isNumber,
      isObject: isObject,
      isPlainObject: isPlainObject,
      isUndefined: isUndefined,
      isDate: isDate,
      isFile: isFile,
      isBlob: isBlob,
      isFunction: isFunction,
      isStream: isStream,
      isURLSearchParams: isURLSearchParams,
      isStandardBrowserEnv: isStandardBrowserEnv,
      forEach: forEach,
      merge: merge,
      extend: extend,
      trim: trim,
      stripBOM: stripBOM
    };

    function encode$2(val) {
      return encodeURIComponent(val).
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, '+').
        replace(/%5B/gi, '[').
        replace(/%5D/gi, ']');
    }

    /**
     * Build a URL by appending params to the end
     *
     * @param {string} url The base of the url (e.g., http://www.google.com)
     * @param {object} [params] The params to be appended
     * @returns {string} The formatted url
     */
    var buildURL = function buildURL(url, params, paramsSerializer) {
      /*eslint no-param-reassign:0*/
      if (!params) {
        return url;
      }

      var serializedParams;
      if (paramsSerializer) {
        serializedParams = paramsSerializer(params);
      } else if (utils.isURLSearchParams(params)) {
        serializedParams = params.toString();
      } else {
        var parts = [];

        utils.forEach(params, function serialize(val, key) {
          if (val === null || typeof val === 'undefined') {
            return;
          }

          if (utils.isArray(val)) {
            key = key + '[]';
          } else {
            val = [val];
          }

          utils.forEach(val, function parseValue(v) {
            if (utils.isDate(v)) {
              v = v.toISOString();
            } else if (utils.isObject(v)) {
              v = JSON.stringify(v);
            }
            parts.push(encode$2(key) + '=' + encode$2(v));
          });
        });

        serializedParams = parts.join('&');
      }

      if (serializedParams) {
        var hashmarkIndex = url.indexOf('#');
        if (hashmarkIndex !== -1) {
          url = url.slice(0, hashmarkIndex);
        }

        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
      }

      return url;
    };

    function InterceptorManager() {
      this.handlers = [];
    }

    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    InterceptorManager.prototype.use = function use(fulfilled, rejected) {
      this.handlers.push({
        fulfilled: fulfilled,
        rejected: rejected
      });
      return this.handlers.length - 1;
    };

    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     */
    InterceptorManager.prototype.eject = function eject(id) {
      if (this.handlers[id]) {
        this.handlers[id] = null;
      }
    };

    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     */
    InterceptorManager.prototype.forEach = function forEach(fn) {
      utils.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    };

    var InterceptorManager_1 = InterceptorManager;

    /**
     * Transform the data for a request or a response
     *
     * @param {Object|String} data The data to be transformed
     * @param {Array} headers The headers for the request or response
     * @param {Array|Function} fns A single function or Array of functions
     * @returns {*} The resulting transformed data
     */
    var transformData = function transformData(data, headers, fns) {
      /*eslint no-param-reassign:0*/
      utils.forEach(fns, function transform(fn) {
        data = fn(data, headers);
      });

      return data;
    };

    var isCancel = function isCancel(value) {
      return !!(value && value.__CANCEL__);
    };

    var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
      utils.forEach(headers, function processHeader(value, name) {
        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
          headers[normalizedName] = value;
          delete headers[name];
        }
      });
    };

    /**
     * Update an Error with the specified config, error code, and response.
     *
     * @param {Error} error The error to update.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The error.
     */
    var enhanceError = function enhanceError(error, config, code, request, response) {
      error.config = config;
      if (code) {
        error.code = code;
      }

      error.request = request;
      error.response = response;
      error.isAxiosError = true;

      error.toJSON = function toJSON() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: this.config,
          code: this.code
        };
      };
      return error;
    };

    /**
     * Create an Error with the specified message, config, error code, request and response.
     *
     * @param {string} message The error message.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The created error.
     */
    var createError = function createError(message, config, code, request, response) {
      var error = new Error(message);
      return enhanceError(error, config, code, request, response);
    };

    /**
     * Resolve or reject a Promise based on response status.
     *
     * @param {Function} resolve A function that resolves the promise.
     * @param {Function} reject A function that rejects the promise.
     * @param {object} response The response.
     */
    var settle = function settle(resolve, reject, response) {
      var validateStatus = response.config.validateStatus;
      if (!response.status || !validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(createError(
          'Request failed with status code ' + response.status,
          response.config,
          null,
          response.request,
          response
        ));
      }
    };

    var cookies = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs support document.cookie
        (function standardBrowserEnv() {
          return {
            write: function write(name, value, expires, path, domain, secure) {
              var cookie = [];
              cookie.push(name + '=' + encodeURIComponent(value));

              if (utils.isNumber(expires)) {
                cookie.push('expires=' + new Date(expires).toGMTString());
              }

              if (utils.isString(path)) {
                cookie.push('path=' + path);
              }

              if (utils.isString(domain)) {
                cookie.push('domain=' + domain);
              }

              if (secure === true) {
                cookie.push('secure');
              }

              document.cookie = cookie.join('; ');
            },

            read: function read(name) {
              var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
              return (match ? decodeURIComponent(match[3]) : null);
            },

            remove: function remove(name) {
              this.write(name, '', Date.now() - 86400000);
            }
          };
        })() :

      // Non standard browser env (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return {
            write: function write() {},
            read: function read() { return null; },
            remove: function remove() {}
          };
        })()
    );

    /**
     * Determines whether the specified URL is absolute
     *
     * @param {string} url The URL to test
     * @returns {boolean} True if the specified URL is absolute, otherwise false
     */
    var isAbsoluteURL = function isAbsoluteURL(url) {
      // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
      // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
      // by any combination of letters, digits, plus, period, or hyphen.
      return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
    };

    /**
     * Creates a new URL by combining the specified URLs
     *
     * @param {string} baseURL The base URL
     * @param {string} relativeURL The relative URL
     * @returns {string} The combined URL
     */
    var combineURLs = function combineURLs(baseURL, relativeURL) {
      return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
    };

    /**
     * Creates a new URL by combining the baseURL with the requestedURL,
     * only when the requestedURL is not already an absolute URL.
     * If the requestURL is absolute, this function returns the requestedURL untouched.
     *
     * @param {string} baseURL The base URL
     * @param {string} requestedURL Absolute or relative URL to combine
     * @returns {string} The combined full path
     */
    var buildFullPath = function buildFullPath(baseURL, requestedURL) {
      if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
      }
      return requestedURL;
    };

    // Headers whose duplicates are ignored by node
    // c.f. https://nodejs.org/api/http.html#http_message_headers
    var ignoreDuplicateOf = [
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent'
    ];

    /**
     * Parse headers into an object
     *
     * ```
     * Date: Wed, 27 Aug 2014 08:58:49 GMT
     * Content-Type: application/json
     * Connection: keep-alive
     * Transfer-Encoding: chunked
     * ```
     *
     * @param {String} headers Headers needing to be parsed
     * @returns {Object} Headers parsed into an object
     */
    var parseHeaders = function parseHeaders(headers) {
      var parsed = {};
      var key;
      var val;
      var i;

      if (!headers) { return parsed; }

      utils.forEach(headers.split('\n'), function parser(line) {
        i = line.indexOf(':');
        key = utils.trim(line.substr(0, i)).toLowerCase();
        val = utils.trim(line.substr(i + 1));

        if (key) {
          if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
            return;
          }
          if (key === 'set-cookie') {
            parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
          } else {
            parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
          }
        }
      });

      return parsed;
    };

    var isURLSameOrigin = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs have full support of the APIs needed to test
      // whether the request URL is of the same origin as current location.
        (function standardBrowserEnv() {
          var msie = /(msie|trident)/i.test(navigator.userAgent);
          var urlParsingNode = document.createElement('a');
          var originURL;

          /**
        * Parse a URL to discover it's components
        *
        * @param {String} url The URL to be parsed
        * @returns {Object}
        */
          function resolveURL(url) {
            var href = url;

            if (msie) {
            // IE needs attribute set twice to normalize properties
              urlParsingNode.setAttribute('href', href);
              href = urlParsingNode.href;
            }

            urlParsingNode.setAttribute('href', href);

            // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
            return {
              href: urlParsingNode.href,
              protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
              host: urlParsingNode.host,
              search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
              hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
              hostname: urlParsingNode.hostname,
              port: urlParsingNode.port,
              pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
                urlParsingNode.pathname :
                '/' + urlParsingNode.pathname
            };
          }

          originURL = resolveURL(window.location.href);

          /**
        * Determine if a URL shares the same origin as the current location
        *
        * @param {String} requestURL The URL to test
        * @returns {boolean} True if URL shares the same origin, otherwise false
        */
          return function isURLSameOrigin(requestURL) {
            var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
            return (parsed.protocol === originURL.protocol &&
                parsed.host === originURL.host);
          };
        })() :

      // Non standard browser envs (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return function isURLSameOrigin() {
            return true;
          };
        })()
    );

    var xhr = function xhrAdapter(config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        var requestData = config.data;
        var requestHeaders = config.headers;

        if (utils.isFormData(requestData)) {
          delete requestHeaders['Content-Type']; // Let the browser set it
        }

        var request = new XMLHttpRequest();

        // HTTP basic authentication
        if (config.auth) {
          var username = config.auth.username || '';
          var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
          requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
        }

        var fullPath = buildFullPath(config.baseURL, config.url);
        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

        // Set the request timeout in MS
        request.timeout = config.timeout;

        // Listen for ready state
        request.onreadystatechange = function handleLoad() {
          if (!request || request.readyState !== 4) {
            return;
          }

          // The request errored out and we didn't get a response, this will be
          // handled by onerror instead
          // With one exception: request that using file: protocol, most browsers
          // will return status as 0 even though it's a successful request
          if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
            return;
          }

          // Prepare the response
          var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
          var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
          var response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config: config,
            request: request
          };

          settle(resolve, reject, response);

          // Clean up request
          request = null;
        };

        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }

          reject(createError('Request aborted', config, 'ECONNABORTED', request));

          // Clean up request
          request = null;
        };

        // Handle low level network errors
        request.onerror = function handleError() {
          // Real errors are hidden from us by the browser
          // onerror should only fire if it's a network error
          reject(createError('Network Error', config, null, request));

          // Clean up request
          request = null;
        };

        // Handle timeout
        request.ontimeout = function handleTimeout() {
          var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
          if (config.timeoutErrorMessage) {
            timeoutErrorMessage = config.timeoutErrorMessage;
          }
          reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
            request));

          // Clean up request
          request = null;
        };

        // Add xsrf header
        // This is only done if running in a standard browser environment.
        // Specifically not if we're in a web worker, or react-native.
        if (utils.isStandardBrowserEnv()) {
          // Add xsrf header
          var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
            cookies.read(config.xsrfCookieName) :
            undefined;

          if (xsrfValue) {
            requestHeaders[config.xsrfHeaderName] = xsrfValue;
          }
        }

        // Add headers to the request
        if ('setRequestHeader' in request) {
          utils.forEach(requestHeaders, function setRequestHeader(val, key) {
            if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
              // Remove Content-Type if data is undefined
              delete requestHeaders[key];
            } else {
              // Otherwise add header to the request
              request.setRequestHeader(key, val);
            }
          });
        }

        // Add withCredentials to request if needed
        if (!utils.isUndefined(config.withCredentials)) {
          request.withCredentials = !!config.withCredentials;
        }

        // Add responseType to request if needed
        if (config.responseType) {
          try {
            request.responseType = config.responseType;
          } catch (e) {
            // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
            // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
            if (config.responseType !== 'json') {
              throw e;
            }
          }
        }

        // Handle progress if needed
        if (typeof config.onDownloadProgress === 'function') {
          request.addEventListener('progress', config.onDownloadProgress);
        }

        // Not all browsers support upload events
        if (typeof config.onUploadProgress === 'function' && request.upload) {
          request.upload.addEventListener('progress', config.onUploadProgress);
        }

        if (config.cancelToken) {
          // Handle cancellation
          config.cancelToken.promise.then(function onCanceled(cancel) {
            if (!request) {
              return;
            }

            request.abort();
            reject(cancel);
            // Clean up request
            request = null;
          });
        }

        if (!requestData) {
          requestData = null;
        }

        // Send the request
        request.send(requestData);
      });
    };

    var DEFAULT_CONTENT_TYPE = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    function setContentTypeIfUnset(headers, value) {
      if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
        headers['Content-Type'] = value;
      }
    }

    function getDefaultAdapter() {
      var adapter;
      if (typeof XMLHttpRequest !== 'undefined') {
        // For browsers use XHR adapter
        adapter = xhr;
      } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
        // For node use HTTP adapter
        adapter = xhr;
      }
      return adapter;
    }

    var defaults = {
      adapter: getDefaultAdapter(),

      transformRequest: [function transformRequest(data, headers) {
        normalizeHeaderName(headers, 'Accept');
        normalizeHeaderName(headers, 'Content-Type');
        if (utils.isFormData(data) ||
          utils.isArrayBuffer(data) ||
          utils.isBuffer(data) ||
          utils.isStream(data) ||
          utils.isFile(data) ||
          utils.isBlob(data)
        ) {
          return data;
        }
        if (utils.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils.isURLSearchParams(data)) {
          setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
          return data.toString();
        }
        if (utils.isObject(data)) {
          setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
          return JSON.stringify(data);
        }
        return data;
      }],

      transformResponse: [function transformResponse(data) {
        /*eslint no-param-reassign:0*/
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) { /* Ignore */ }
        }
        return data;
      }],

      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,

      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',

      maxContentLength: -1,
      maxBodyLength: -1,

      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      }
    };

    defaults.headers = {
      common: {
        'Accept': 'application/json, text/plain, */*'
      }
    };

    utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
      defaults.headers[method] = {};
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
    });

    var defaults_1 = defaults;

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }
    }

    /**
     * Dispatch a request to the server using the configured adapter.
     *
     * @param {object} config The config that is to be used for the request
     * @returns {Promise} The Promise to be fulfilled
     */
    var dispatchRequest = function dispatchRequest(config) {
      throwIfCancellationRequested(config);

      // Ensure headers exist
      config.headers = config.headers || {};

      // Transform request data
      config.data = transformData(
        config.data,
        config.headers,
        config.transformRequest
      );

      // Flatten headers
      config.headers = utils.merge(
        config.headers.common || {},
        config.headers[config.method] || {},
        config.headers
      );

      utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig(method) {
          delete config.headers[method];
        }
      );

      var adapter = config.adapter || defaults_1.adapter;

      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData(
          response.data,
          response.headers,
          config.transformResponse
        );

        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);

          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData(
              reason.response.data,
              reason.response.headers,
              config.transformResponse
            );
          }
        }

        return Promise.reject(reason);
      });
    };

    /**
     * Config-specific merge-function which creates a new config-object
     * by merging two configuration objects together.
     *
     * @param {Object} config1
     * @param {Object} config2
     * @returns {Object} New object resulting from merging config2 to config1
     */
    var mergeConfig = function mergeConfig(config1, config2) {
      // eslint-disable-next-line no-param-reassign
      config2 = config2 || {};
      var config = {};

      var valueFromConfig2Keys = ['url', 'method', 'data'];
      var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy', 'params'];
      var defaultToConfig2Keys = [
        'baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer',
        'timeout', 'timeoutMessage', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
        'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'decompress',
        'maxContentLength', 'maxBodyLength', 'maxRedirects', 'transport', 'httpAgent',
        'httpsAgent', 'cancelToken', 'socketPath', 'responseEncoding'
      ];
      var directMergeKeys = ['validateStatus'];

      function getMergedValue(target, source) {
        if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
          return utils.merge(target, source);
        } else if (utils.isPlainObject(source)) {
          return utils.merge({}, source);
        } else if (utils.isArray(source)) {
          return source.slice();
        }
        return source;
      }

      function mergeDeepProperties(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      }

      utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        }
      });

      utils.forEach(mergeDeepPropertiesKeys, mergeDeepProperties);

      utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      utils.forEach(directMergeKeys, function merge(prop) {
        if (prop in config2) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (prop in config1) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      var axiosKeys = valueFromConfig2Keys
        .concat(mergeDeepPropertiesKeys)
        .concat(defaultToConfig2Keys)
        .concat(directMergeKeys);

      var otherKeys = Object
        .keys(config1)
        .concat(Object.keys(config2))
        .filter(function filterAxiosKeys(key) {
          return axiosKeys.indexOf(key) === -1;
        });

      utils.forEach(otherKeys, mergeDeepProperties);

      return config;
    };

    /**
     * Create a new instance of Axios
     *
     * @param {Object} instanceConfig The default config for the instance
     */
    function Axios(instanceConfig) {
      this.defaults = instanceConfig;
      this.interceptors = {
        request: new InterceptorManager_1(),
        response: new InterceptorManager_1()
      };
    }

    /**
     * Dispatch a request
     *
     * @param {Object} config The config specific for this request (merged with this.defaults)
     */
    Axios.prototype.request = function request(config) {
      /*eslint no-param-reassign:0*/
      // Allow for axios('example/url'[, config]) a la fetch API
      if (typeof config === 'string') {
        config = arguments[1] || {};
        config.url = arguments[0];
      } else {
        config = config || {};
      }

      config = mergeConfig(this.defaults, config);

      // Set config.method
      if (config.method) {
        config.method = config.method.toLowerCase();
      } else if (this.defaults.method) {
        config.method = this.defaults.method.toLowerCase();
      } else {
        config.method = 'get';
      }

      // Hook up interceptors middleware
      var chain = [dispatchRequest, undefined];
      var promise = Promise.resolve(config);

      this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      });

      this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        chain.push(interceptor.fulfilled, interceptor.rejected);
      });

      while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift());
      }

      return promise;
    };

    Axios.prototype.getUri = function getUri(config) {
      config = mergeConfig(this.defaults, config);
      return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
    };

    // Provide aliases for supported request methods
    utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: (config || {}).data
        }));
      };
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, data, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: data
        }));
      };
    });

    var Axios_1 = Axios;

    /**
     * A `Cancel` is an object that is thrown when an operation is canceled.
     *
     * @class
     * @param {string=} message The message.
     */
    function Cancel(message) {
      this.message = message;
    }

    Cancel.prototype.toString = function toString() {
      return 'Cancel' + (this.message ? ': ' + this.message : '');
    };

    Cancel.prototype.__CANCEL__ = true;

    var Cancel_1 = Cancel;

    /**
     * A `CancelToken` is an object that can be used to request cancellation of an operation.
     *
     * @class
     * @param {Function} executor The executor function.
     */
    function CancelToken(executor) {
      if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
      }

      var resolvePromise;
      this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
      });

      var token = this;
      executor(function cancel(message) {
        if (token.reason) {
          // Cancellation has already been requested
          return;
        }

        token.reason = new Cancel_1(message);
        resolvePromise(token.reason);
      });
    }

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    CancelToken.prototype.throwIfRequested = function throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    };

    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    CancelToken.source = function source() {
      var cancel;
      var token = new CancelToken(function executor(c) {
        cancel = c;
      });
      return {
        token: token,
        cancel: cancel
      };
    };

    var CancelToken_1 = CancelToken;

    /**
     * Syntactic sugar for invoking a function and expanding an array for arguments.
     *
     * Common use case would be to use `Function.prototype.apply`.
     *
     *  ```js
     *  function f(x, y, z) {}
     *  var args = [1, 2, 3];
     *  f.apply(null, args);
     *  ```
     *
     * With `spread` this example can be re-written.
     *
     *  ```js
     *  spread(function(x, y, z) {})([1, 2, 3]);
     *  ```
     *
     * @param {Function} callback
     * @returns {Function}
     */
    var spread = function spread(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    };

    /**
     * Determines whether the payload is an error thrown by Axios
     *
     * @param {*} payload The value to test
     * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
     */
    var isAxiosError = function isAxiosError(payload) {
      return (typeof payload === 'object') && (payload.isAxiosError === true);
    };

    /**
     * Create an instance of Axios
     *
     * @param {Object} defaultConfig The default config for the instance
     * @return {Axios} A new instance of Axios
     */
    function createInstance(defaultConfig) {
      var context = new Axios_1(defaultConfig);
      var instance = bind(Axios_1.prototype.request, context);

      // Copy axios.prototype to instance
      utils.extend(instance, Axios_1.prototype, context);

      // Copy context to instance
      utils.extend(instance, context);

      return instance;
    }

    // Create the default instance to be exported
    var axios$1 = createInstance(defaults_1);

    // Expose Axios class to allow class inheritance
    axios$1.Axios = Axios_1;

    // Factory for creating new instances
    axios$1.create = function create(instanceConfig) {
      return createInstance(mergeConfig(axios$1.defaults, instanceConfig));
    };

    // Expose Cancel & CancelToken
    axios$1.Cancel = Cancel_1;
    axios$1.CancelToken = CancelToken_1;
    axios$1.isCancel = isCancel;

    // Expose all/spread
    axios$1.all = function all(promises) {
      return Promise.all(promises);
    };
    axios$1.spread = spread;

    // Expose isAxiosError
    axios$1.isAxiosError = isAxiosError;

    var axios_1 = axios$1;

    // Allow use of default import syntax in TypeScript
    var _default = axios$1;
    axios_1.default = _default;

    var axios = axios_1;

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function getAugmentedNamespace(n) {
    	if (n.__esModule) return n;
    	var a = Object.defineProperty({}, '__esModule', {value: true});
    	Object.keys(n).forEach(function (k) {
    		var d = Object.getOwnPropertyDescriptor(n, k);
    		Object.defineProperty(a, k, d.get ? d : {
    			enumerable: true,
    			get: function () {
    				return n[k];
    			}
    		});
    	});
    	return a;
    }

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    function commonjsRequire (target) {
    	throw new Error('Could not dynamically require "' + target + '". Please configure the dynamicRequireTargets option of @rollup/plugin-commonjs appropriately for this require call to behave properly.');
    }

    /*
    CryptoJS v3.1.2
    code.google.com/p/crypto-js
    (c) 2009-2013 by Jeff Mott. All rights reserved.
    code.google.com/p/crypto-js/wiki/License
    */
    /**
     * CryptoJS core components.
     */
    var CryptoJS$7 = CryptoJS$7 || (function (Math, undefined$1) {
        /**
         * CryptoJS namespace.
         */
        var C = {};

        /**
         * Library namespace.
         */
        var C_lib = C.lib = {};

        /**
         * Base object for prototypal inheritance.
         */
        var Base = C_lib.Base = (function () {
            function F() {}

            return {
                /**
                 * Creates a new object that inherits from this object.
                 *
                 * @param {Object} overrides Properties to copy into the new object.
                 *
                 * @return {Object} The new object.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var MyType = CryptoJS.lib.Base.extend({
                 *         field: 'value',
                 *
                 *         method: function () {
                 *         }
                 *     });
                 */
                extend: function (overrides) {
                    // Spawn
                    F.prototype = this;
                    var subtype = new F();

                    // Augment
                    if (overrides) {
                        subtype.mixIn(overrides);
                    }

                    // Create default initializer
                    if (!subtype.hasOwnProperty('init')) {
                        subtype.init = function () {
                            subtype.$super.init.apply(this, arguments);
                        };
                    }

                    // Initializer's prototype is the subtype object
                    subtype.init.prototype = subtype;

                    // Reference supertype
                    subtype.$super = this;

                    return subtype;
                },

                /**
                 * Extends this object and runs the init method.
                 * Arguments to create() will be passed to init().
                 *
                 * @return {Object} The new object.
                 *
                 * @static
                 *
                 * @example
                 *
                 *     var instance = MyType.create();
                 */
                create: function () {
                    var instance = this.extend();
                    instance.init.apply(instance, arguments);

                    return instance;
                },

                /**
                 * Initializes a newly created object.
                 * Override this method to add some logic when your objects are created.
                 *
                 * @example
                 *
                 *     var MyType = CryptoJS.lib.Base.extend({
                 *         init: function () {
                 *             // ...
                 *         }
                 *     });
                 */
                init: function () {
                },

                /**
                 * Copies properties into this object.
                 *
                 * @param {Object} properties The properties to mix in.
                 *
                 * @example
                 *
                 *     MyType.mixIn({
                 *         field: 'value'
                 *     });
                 */
                mixIn: function (properties) {
                    for (var propertyName in properties) {
                        if (properties.hasOwnProperty(propertyName)) {
                            this[propertyName] = properties[propertyName];
                        }
                    }

                    // IE won't copy toString using the loop above
                    if (properties.hasOwnProperty('toString')) {
                        this.toString = properties.toString;
                    }
                },

                /**
                 * Creates a copy of this object.
                 *
                 * @return {Object} The clone.
                 *
                 * @example
                 *
                 *     var clone = instance.clone();
                 */
                clone: function () {
                    return this.init.prototype.extend(this);
                }
            };
        }());

        /**
         * An array of 32-bit words.
         *
         * @property {Array} words The array of 32-bit words.
         * @property {number} sigBytes The number of significant bytes in this word array.
         */
        var WordArray = C_lib.WordArray = Base.extend({
            /**
             * Initializes a newly created word array.
             *
             * @param {Array} words (Optional) An array of 32-bit words.
             * @param {number} sigBytes (Optional) The number of significant bytes in the words.
             *
             * @example
             *
             *     var wordArray = CryptoJS.lib.WordArray.create();
             *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
             *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
             */
            init: function (words, sigBytes) {
                words = this.words = words || [];

                if (sigBytes != undefined$1) {
                    this.sigBytes = sigBytes;
                } else {
                    this.sigBytes = words.length * 4;
                }
            },

            /**
             * Converts this word array to a string.
             *
             * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
             *
             * @return {string} The stringified word array.
             *
             * @example
             *
             *     var string = wordArray + '';
             *     var string = wordArray.toString();
             *     var string = wordArray.toString(CryptoJS.enc.Utf8);
             */
            toString: function (encoder) {
                return (encoder || Hex).stringify(this);
            },

            /**
             * Concatenates a word array to this word array.
             *
             * @param {WordArray} wordArray The word array to append.
             *
             * @return {WordArray} This word array.
             *
             * @example
             *
             *     wordArray1.concat(wordArray2);
             */
            concat: function (wordArray) {
                // Shortcuts
                var thisWords = this.words;
                var thatWords = wordArray.words;
                var thisSigBytes = this.sigBytes;
                var thatSigBytes = wordArray.sigBytes;

                // Clamp excess bits
                this.clamp();

                // Concat
                if (thisSigBytes % 4) {
                    // Copy one byte at a time
                    for (var i = 0; i < thatSigBytes; i++) {
                        var thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                        thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
                    }
                } else if (thatWords.length > 0xffff) {
                    // Copy one word at a time
                    for (var i = 0; i < thatSigBytes; i += 4) {
                        thisWords[(thisSigBytes + i) >>> 2] = thatWords[i >>> 2];
                    }
                } else {
                    // Copy all words at once
                    thisWords.push.apply(thisWords, thatWords);
                }
                this.sigBytes += thatSigBytes;

                // Chainable
                return this;
            },

            /**
             * Removes insignificant bits.
             *
             * @example
             *
             *     wordArray.clamp();
             */
            clamp: function () {
                // Shortcuts
                var words = this.words;
                var sigBytes = this.sigBytes;

                // Clamp
                words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
                words.length = Math.ceil(sigBytes / 4);
            },

            /**
             * Creates a copy of this word array.
             *
             * @return {WordArray} The clone.
             *
             * @example
             *
             *     var clone = wordArray.clone();
             */
            clone: function () {
                var clone = Base.clone.call(this);
                clone.words = this.words.slice(0);

                return clone;
            },

            /**
             * Creates a word array filled with random bytes.
             *
             * @param {number} nBytes The number of random bytes to generate.
             *
             * @return {WordArray} The random word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.lib.WordArray.random(16);
             */
            random: function (nBytes) {
                var words = [];
                for (var i = 0; i < nBytes; i += 4) {
                    words.push((Math.random() * 0x100000000) | 0);
                }

                return new WordArray.init(words, nBytes);
            }
        });

        /**
         * Encoder namespace.
         */
        var C_enc = C.enc = {};

        /**
         * Hex encoding strategy.
         */
        var Hex = C_enc.Hex = {
            /**
             * Converts a word array to a hex string.
             *
             * @param {WordArray} wordArray The word array.
             *
             * @return {string} The hex string.
             *
             * @static
             *
             * @example
             *
             *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
             */
            stringify: function (wordArray) {
                // Shortcuts
                var words = wordArray.words;
                var sigBytes = wordArray.sigBytes;

                // Convert
                var hexChars = [];
                for (var i = 0; i < sigBytes; i++) {
                    var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                    hexChars.push((bite >>> 4).toString(16));
                    hexChars.push((bite & 0x0f).toString(16));
                }

                return hexChars.join('');
            },

            /**
             * Converts a hex string to a word array.
             *
             * @param {string} hexStr The hex string.
             *
             * @return {WordArray} The word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
             */
            parse: function (hexStr) {
                // Shortcut
                var hexStrLength = hexStr.length;

                // Convert
                var words = [];
                for (var i = 0; i < hexStrLength; i += 2) {
                    words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
                }

                return new WordArray.init(words, hexStrLength / 2);
            }
        };

        /**
         * Latin1 encoding strategy.
         */
        var Latin1 = C_enc.Latin1 = {
            /**
             * Converts a word array to a Latin1 string.
             *
             * @param {WordArray} wordArray The word array.
             *
             * @return {string} The Latin1 string.
             *
             * @static
             *
             * @example
             *
             *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
             */
            stringify: function (wordArray) {
                // Shortcuts
                var words = wordArray.words;
                var sigBytes = wordArray.sigBytes;

                // Convert
                var latin1Chars = [];
                for (var i = 0; i < sigBytes; i++) {
                    var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                    latin1Chars.push(String.fromCharCode(bite));
                }

                return latin1Chars.join('');
            },

            /**
             * Converts a Latin1 string to a word array.
             *
             * @param {string} latin1Str The Latin1 string.
             *
             * @return {WordArray} The word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
             */
            parse: function (latin1Str) {
                // Shortcut
                var latin1StrLength = latin1Str.length;

                // Convert
                var words = [];
                for (var i = 0; i < latin1StrLength; i++) {
                    words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
                }

                return new WordArray.init(words, latin1StrLength);
            }
        };

        /**
         * UTF-8 encoding strategy.
         */
        var Utf8 = C_enc.Utf8 = {
            /**
             * Converts a word array to a UTF-8 string.
             *
             * @param {WordArray} wordArray The word array.
             *
             * @return {string} The UTF-8 string.
             *
             * @static
             *
             * @example
             *
             *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
             */
            stringify: function (wordArray) {
                try {
                    return decodeURIComponent(escape(Latin1.stringify(wordArray)));
                } catch (e) {
                    throw new Error('Malformed UTF-8 data');
                }
            },

            /**
             * Converts a UTF-8 string to a word array.
             *
             * @param {string} utf8Str The UTF-8 string.
             *
             * @return {WordArray} The word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
             */
            parse: function (utf8Str) {
                return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
            }
        };

        /**
         * Abstract buffered block algorithm template.
         *
         * The property blockSize must be implemented in a concrete subtype.
         *
         * @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
         */
        var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
            /**
             * Resets this block algorithm's data buffer to its initial state.
             *
             * @example
             *
             *     bufferedBlockAlgorithm.reset();
             */
            reset: function () {
                // Initial values
                this._data = new WordArray.init();
                this._nDataBytes = 0;
            },

            /**
             * Adds new data to this block algorithm's buffer.
             *
             * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
             *
             * @example
             *
             *     bufferedBlockAlgorithm._append('data');
             *     bufferedBlockAlgorithm._append(wordArray);
             */
            _append: function (data) {
                // Convert string to WordArray, else assume WordArray already
                if (typeof data == 'string') {
                    data = Utf8.parse(data);
                }

                // Append
                this._data.concat(data);
                this._nDataBytes += data.sigBytes;
            },

            /**
             * Processes available data blocks.
             *
             * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
             *
             * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
             *
             * @return {WordArray} The processed data.
             *
             * @example
             *
             *     var processedData = bufferedBlockAlgorithm._process();
             *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
             */
            _process: function (doFlush) {
                // Shortcuts
                var data = this._data;
                var dataWords = data.words;
                var dataSigBytes = data.sigBytes;
                var blockSize = this.blockSize;
                var blockSizeBytes = blockSize * 4;

                // Count blocks ready
                var nBlocksReady = dataSigBytes / blockSizeBytes;
                if (doFlush) {
                    // Round up to include partial blocks
                    nBlocksReady = Math.ceil(nBlocksReady);
                } else {
                    // Round down to include only full blocks,
                    // less the number of blocks that must remain in the buffer
                    nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
                }

                // Count words ready
                var nWordsReady = nBlocksReady * blockSize;

                // Count bytes ready
                var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

                // Process blocks
                if (nWordsReady) {
                    for (var offset = 0; offset < nWordsReady; offset += blockSize) {
                        // Perform concrete-algorithm logic
                        this._doProcessBlock(dataWords, offset);
                    }

                    // Remove processed words
                    var processedWords = dataWords.splice(0, nWordsReady);
                    data.sigBytes -= nBytesReady;
                }

                // Return processed words
                return new WordArray.init(processedWords, nBytesReady);
            },

            /**
             * Creates a copy of this object.
             *
             * @return {Object} The clone.
             *
             * @example
             *
             *     var clone = bufferedBlockAlgorithm.clone();
             */
            clone: function () {
                var clone = Base.clone.call(this);
                clone._data = this._data.clone();

                return clone;
            },

            _minBufferSize: 0
        });

        /**
         * Abstract hasher template.
         *
         * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
         */
        C_lib.Hasher = BufferedBlockAlgorithm.extend({
            /**
             * Configuration options.
             */
            cfg: Base.extend(),

            /**
             * Initializes a newly created hasher.
             *
             * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
             *
             * @example
             *
             *     var hasher = CryptoJS.algo.SHA256.create();
             */
            init: function (cfg) {
                // Apply config defaults
                this.cfg = this.cfg.extend(cfg);

                // Set initial values
                this.reset();
            },

            /**
             * Resets this hasher to its initial state.
             *
             * @example
             *
             *     hasher.reset();
             */
            reset: function () {
                // Reset data buffer
                BufferedBlockAlgorithm.reset.call(this);

                // Perform concrete-hasher logic
                this._doReset();
            },

            /**
             * Updates this hasher with a message.
             *
             * @param {WordArray|string} messageUpdate The message to append.
             *
             * @return {Hasher} This hasher.
             *
             * @example
             *
             *     hasher.update('message');
             *     hasher.update(wordArray);
             */
            update: function (messageUpdate) {
                // Append
                this._append(messageUpdate);

                // Update the hash
                this._process();

                // Chainable
                return this;
            },

            /**
             * Finalizes the hash computation.
             * Note that the finalize operation is effectively a destructive, read-once operation.
             *
             * @param {WordArray|string} messageUpdate (Optional) A final message update.
             *
             * @return {WordArray} The hash.
             *
             * @example
             *
             *     var hash = hasher.finalize();
             *     var hash = hasher.finalize('message');
             *     var hash = hasher.finalize(wordArray);
             */
            finalize: function (messageUpdate) {
                // Final message update
                if (messageUpdate) {
                    this._append(messageUpdate);
                }

                // Perform concrete-hasher logic
                var hash = this._doFinalize();

                return hash;
            },

            blockSize: 512/32,

            /**
             * Creates a shortcut function to a hasher's object interface.
             *
             * @param {Hasher} hasher The hasher to create a helper for.
             *
             * @return {Function} The shortcut function.
             *
             * @static
             *
             * @example
             *
             *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
             */
            _createHelper: function (hasher) {
                return function (message, cfg) {
                    return new hasher.init(cfg).finalize(message);
                };
            },

            /**
             * Creates a shortcut function to the HMAC's object interface.
             *
             * @param {Hasher} hasher The hasher to use in this HMAC helper.
             *
             * @return {Function} The shortcut function.
             *
             * @static
             *
             * @example
             *
             *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
             */
            _createHmacHelper: function (hasher) {
                return function (message, key) {
                    return new C_algo.HMAC.init(hasher, key).finalize(message);
                };
            }
        });

        /**
         * Algorithm namespace.
         */
        var C_algo = C.algo = {};

        return C;
    }(Math));

    var CryptoJS_1$1 = CryptoJS$7;

    var core = {
    	CryptoJS: CryptoJS_1$1
    };

    var CryptoJS$6 = core.CryptoJS;

    /*
    CryptoJS v3.1.2
    code.google.com/p/crypto-js
    (c) 2009-2013 by Jeff Mott. All rights reserved.
    code.google.com/p/crypto-js/wiki/License
    */
    (function () {
        // Shortcuts
        var C = CryptoJS$6;
        var C_lib = C.lib;
        var WordArray = C_lib.WordArray;
        var C_enc = C.enc;

        /**
         * Base64 encoding strategy.
         */
        C_enc.Base64 = {
            /**
             * Converts a word array to a Base64 string.
             *
             * @param {WordArray} wordArray The word array.
             *
             * @return {string} The Base64 string.
             *
             * @static
             *
             * @example
             *
             *     var base64String = CryptoJS.enc.Base64.stringify(wordArray);
             */
            stringify: function (wordArray) {
                // Shortcuts
                var words = wordArray.words;
                var sigBytes = wordArray.sigBytes;
                var map = this._map;

                // Clamp excess bits
                wordArray.clamp();

                // Convert
                var base64Chars = [];
                for (var i = 0; i < sigBytes; i += 3) {
                    var byte1 = (words[i >>> 2]       >>> (24 - (i % 4) * 8))       & 0xff;
                    var byte2 = (words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff;
                    var byte3 = (words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff;

                    var triplet = (byte1 << 16) | (byte2 << 8) | byte3;

                    for (var j = 0; (j < 4) && (i + j * 0.75 < sigBytes); j++) {
                        base64Chars.push(map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
                    }
                }

                // Add padding
                var paddingChar = map.charAt(64);
                if (paddingChar) {
                    while (base64Chars.length % 4) {
                        base64Chars.push(paddingChar);
                    }
                }

                return base64Chars.join('');
            },

            /**
             * Converts a Base64 string to a word array.
             *
             * @param {string} base64Str The Base64 string.
             *
             * @return {WordArray} The word array.
             *
             * @static
             *
             * @example
             *
             *     var wordArray = CryptoJS.enc.Base64.parse(base64String);
             */
            parse: function (base64Str) {
                // Shortcuts
                var base64StrLength = base64Str.length;
                var map = this._map;

                // Ignore padding
                var paddingChar = map.charAt(64);
                if (paddingChar) {
                    var paddingIndex = base64Str.indexOf(paddingChar);
                    if (paddingIndex != -1) {
                        base64StrLength = paddingIndex;
                    }
                }

                // Convert
                var words = [];
                var nBytes = 0;
                for (var i = 0; i < base64StrLength; i++) {
                    if (i % 4) {
                        var bits1 = map.indexOf(base64Str.charAt(i - 1)) << ((i % 4) * 2);
                        var bits2 = map.indexOf(base64Str.charAt(i)) >>> (6 - (i % 4) * 2);
                        words[nBytes >>> 2] |= (bits1 | bits2) << (24 - (nBytes % 4) * 8);
                        nBytes++;
                    }
                }

                return WordArray.create(words, nBytes);
            },

            _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
        };
    }());

    var CryptoJS$5 = core.CryptoJS;

    /*
    CryptoJS v3.1.2
    code.google.com/p/crypto-js
    (c) 2009-2013 by Jeff Mott. All rights reserved.
    code.google.com/p/crypto-js/wiki/License
    */
    (function (Math) {
        // Shortcuts
        var C = CryptoJS$5;
        var C_lib = C.lib;
        var WordArray = C_lib.WordArray;
        var Hasher = C_lib.Hasher;
        var C_algo = C.algo;

        // Constants table
        var T = [];

        // Compute constants
        (function () {
            for (var i = 0; i < 64; i++) {
                T[i] = (Math.abs(Math.sin(i + 1)) * 0x100000000) | 0;
            }
        }());

        /**
         * MD5 hash algorithm.
         */
        var MD5 = C_algo.MD5 = Hasher.extend({
            _doReset: function () {
                this._hash = new WordArray.init([
                    0x67452301, 0xefcdab89,
                    0x98badcfe, 0x10325476
                ]);
            },

            _doProcessBlock: function (M, offset) {
                // Swap endian
                for (var i = 0; i < 16; i++) {
                    // Shortcuts
                    var offset_i = offset + i;
                    var M_offset_i = M[offset_i];

                    M[offset_i] = (
                        (((M_offset_i << 8)  | (M_offset_i >>> 24)) & 0x00ff00ff) |
                        (((M_offset_i << 24) | (M_offset_i >>> 8))  & 0xff00ff00)
                    );
                }

                // Shortcuts
                var H = this._hash.words;

                var M_offset_0  = M[offset + 0];
                var M_offset_1  = M[offset + 1];
                var M_offset_2  = M[offset + 2];
                var M_offset_3  = M[offset + 3];
                var M_offset_4  = M[offset + 4];
                var M_offset_5  = M[offset + 5];
                var M_offset_6  = M[offset + 6];
                var M_offset_7  = M[offset + 7];
                var M_offset_8  = M[offset + 8];
                var M_offset_9  = M[offset + 9];
                var M_offset_10 = M[offset + 10];
                var M_offset_11 = M[offset + 11];
                var M_offset_12 = M[offset + 12];
                var M_offset_13 = M[offset + 13];
                var M_offset_14 = M[offset + 14];
                var M_offset_15 = M[offset + 15];

                // Working varialbes
                var a = H[0];
                var b = H[1];
                var c = H[2];
                var d = H[3];

                // Computation
                a = FF(a, b, c, d, M_offset_0,  7,  T[0]);
                d = FF(d, a, b, c, M_offset_1,  12, T[1]);
                c = FF(c, d, a, b, M_offset_2,  17, T[2]);
                b = FF(b, c, d, a, M_offset_3,  22, T[3]);
                a = FF(a, b, c, d, M_offset_4,  7,  T[4]);
                d = FF(d, a, b, c, M_offset_5,  12, T[5]);
                c = FF(c, d, a, b, M_offset_6,  17, T[6]);
                b = FF(b, c, d, a, M_offset_7,  22, T[7]);
                a = FF(a, b, c, d, M_offset_8,  7,  T[8]);
                d = FF(d, a, b, c, M_offset_9,  12, T[9]);
                c = FF(c, d, a, b, M_offset_10, 17, T[10]);
                b = FF(b, c, d, a, M_offset_11, 22, T[11]);
                a = FF(a, b, c, d, M_offset_12, 7,  T[12]);
                d = FF(d, a, b, c, M_offset_13, 12, T[13]);
                c = FF(c, d, a, b, M_offset_14, 17, T[14]);
                b = FF(b, c, d, a, M_offset_15, 22, T[15]);

                a = GG(a, b, c, d, M_offset_1,  5,  T[16]);
                d = GG(d, a, b, c, M_offset_6,  9,  T[17]);
                c = GG(c, d, a, b, M_offset_11, 14, T[18]);
                b = GG(b, c, d, a, M_offset_0,  20, T[19]);
                a = GG(a, b, c, d, M_offset_5,  5,  T[20]);
                d = GG(d, a, b, c, M_offset_10, 9,  T[21]);
                c = GG(c, d, a, b, M_offset_15, 14, T[22]);
                b = GG(b, c, d, a, M_offset_4,  20, T[23]);
                a = GG(a, b, c, d, M_offset_9,  5,  T[24]);
                d = GG(d, a, b, c, M_offset_14, 9,  T[25]);
                c = GG(c, d, a, b, M_offset_3,  14, T[26]);
                b = GG(b, c, d, a, M_offset_8,  20, T[27]);
                a = GG(a, b, c, d, M_offset_13, 5,  T[28]);
                d = GG(d, a, b, c, M_offset_2,  9,  T[29]);
                c = GG(c, d, a, b, M_offset_7,  14, T[30]);
                b = GG(b, c, d, a, M_offset_12, 20, T[31]);

                a = HH(a, b, c, d, M_offset_5,  4,  T[32]);
                d = HH(d, a, b, c, M_offset_8,  11, T[33]);
                c = HH(c, d, a, b, M_offset_11, 16, T[34]);
                b = HH(b, c, d, a, M_offset_14, 23, T[35]);
                a = HH(a, b, c, d, M_offset_1,  4,  T[36]);
                d = HH(d, a, b, c, M_offset_4,  11, T[37]);
                c = HH(c, d, a, b, M_offset_7,  16, T[38]);
                b = HH(b, c, d, a, M_offset_10, 23, T[39]);
                a = HH(a, b, c, d, M_offset_13, 4,  T[40]);
                d = HH(d, a, b, c, M_offset_0,  11, T[41]);
                c = HH(c, d, a, b, M_offset_3,  16, T[42]);
                b = HH(b, c, d, a, M_offset_6,  23, T[43]);
                a = HH(a, b, c, d, M_offset_9,  4,  T[44]);
                d = HH(d, a, b, c, M_offset_12, 11, T[45]);
                c = HH(c, d, a, b, M_offset_15, 16, T[46]);
                b = HH(b, c, d, a, M_offset_2,  23, T[47]);

                a = II(a, b, c, d, M_offset_0,  6,  T[48]);
                d = II(d, a, b, c, M_offset_7,  10, T[49]);
                c = II(c, d, a, b, M_offset_14, 15, T[50]);
                b = II(b, c, d, a, M_offset_5,  21, T[51]);
                a = II(a, b, c, d, M_offset_12, 6,  T[52]);
                d = II(d, a, b, c, M_offset_3,  10, T[53]);
                c = II(c, d, a, b, M_offset_10, 15, T[54]);
                b = II(b, c, d, a, M_offset_1,  21, T[55]);
                a = II(a, b, c, d, M_offset_8,  6,  T[56]);
                d = II(d, a, b, c, M_offset_15, 10, T[57]);
                c = II(c, d, a, b, M_offset_6,  15, T[58]);
                b = II(b, c, d, a, M_offset_13, 21, T[59]);
                a = II(a, b, c, d, M_offset_4,  6,  T[60]);
                d = II(d, a, b, c, M_offset_11, 10, T[61]);
                c = II(c, d, a, b, M_offset_2,  15, T[62]);
                b = II(b, c, d, a, M_offset_9,  21, T[63]);

                // Intermediate hash value
                H[0] = (H[0] + a) | 0;
                H[1] = (H[1] + b) | 0;
                H[2] = (H[2] + c) | 0;
                H[3] = (H[3] + d) | 0;
            },

            _doFinalize: function () {
                // Shortcuts
                var data = this._data;
                var dataWords = data.words;

                var nBitsTotal = this._nDataBytes * 8;
                var nBitsLeft = data.sigBytes * 8;

                // Add padding
                dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);

                var nBitsTotalH = Math.floor(nBitsTotal / 0x100000000);
                var nBitsTotalL = nBitsTotal;
                dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = (
                    (((nBitsTotalH << 8)  | (nBitsTotalH >>> 24)) & 0x00ff00ff) |
                    (((nBitsTotalH << 24) | (nBitsTotalH >>> 8))  & 0xff00ff00)
                );
                dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
                    (((nBitsTotalL << 8)  | (nBitsTotalL >>> 24)) & 0x00ff00ff) |
                    (((nBitsTotalL << 24) | (nBitsTotalL >>> 8))  & 0xff00ff00)
                );

                data.sigBytes = (dataWords.length + 1) * 4;

                // Hash final blocks
                this._process();

                // Shortcuts
                var hash = this._hash;
                var H = hash.words;

                // Swap endian
                for (var i = 0; i < 4; i++) {
                    // Shortcut
                    var H_i = H[i];

                    H[i] = (((H_i << 8)  | (H_i >>> 24)) & 0x00ff00ff) |
                           (((H_i << 24) | (H_i >>> 8))  & 0xff00ff00);
                }

                // Return final computed hash
                return hash;
            },

            clone: function () {
                var clone = Hasher.clone.call(this);
                clone._hash = this._hash.clone();

                return clone;
            }
        });

        function FF(a, b, c, d, x, s, t) {
            var n = a + ((b & c) | (~b & d)) + x + t;
            return ((n << s) | (n >>> (32 - s))) + b;
        }

        function GG(a, b, c, d, x, s, t) {
            var n = a + ((b & d) | (c & ~d)) + x + t;
            return ((n << s) | (n >>> (32 - s))) + b;
        }

        function HH(a, b, c, d, x, s, t) {
            var n = a + (b ^ c ^ d) + x + t;
            return ((n << s) | (n >>> (32 - s))) + b;
        }

        function II(a, b, c, d, x, s, t) {
            var n = a + (c ^ (b | ~d)) + x + t;
            return ((n << s) | (n >>> (32 - s))) + b;
        }

        /**
         * Shortcut function to the hasher's object interface.
         *
         * @param {WordArray|string} message The message to hash.
         *
         * @return {WordArray} The hash.
         *
         * @static
         *
         * @example
         *
         *     var hash = CryptoJS.MD5('message');
         *     var hash = CryptoJS.MD5(wordArray);
         */
        C.MD5 = Hasher._createHelper(MD5);

        /**
         * Shortcut function to the HMAC's object interface.
         *
         * @param {WordArray|string} message The message to hash.
         * @param {WordArray|string} key The secret key.
         *
         * @return {WordArray} The HMAC.
         *
         * @static
         *
         * @example
         *
         *     var hmac = CryptoJS.HmacMD5(message, key);
         */
        C.HmacMD5 = Hasher._createHmacHelper(MD5);
    }(Math));

    var CryptoJS$4 = core.CryptoJS;

    /*
    CryptoJS v3.1.2
    code.google.com/p/crypto-js
    (c) 2009-2013 by Jeff Mott. All rights reserved.
    code.google.com/p/crypto-js/wiki/License
    */
    (function () {
        // Shortcuts
        var C = CryptoJS$4;
        var C_lib = C.lib;
        var Base = C_lib.Base;
        var WordArray = C_lib.WordArray;
        var C_algo = C.algo;
        var MD5 = C_algo.MD5;

        /**
         * This key derivation function is meant to conform with EVP_BytesToKey.
         * www.openssl.org/docs/crypto/EVP_BytesToKey.html
         */
        var EvpKDF = C_algo.EvpKDF = Base.extend({
            /**
             * Configuration options.
             *
             * @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
             * @property {Hasher} hasher The hash algorithm to use. Default: MD5
             * @property {number} iterations The number of iterations to perform. Default: 1
             */
            cfg: Base.extend({
                keySize: 128/32,
                hasher: MD5,
                iterations: 1
            }),

            /**
             * Initializes a newly created key derivation function.
             *
             * @param {Object} cfg (Optional) The configuration options to use for the derivation.
             *
             * @example
             *
             *     var kdf = CryptoJS.algo.EvpKDF.create();
             *     var kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8 });
             *     var kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8, iterations: 1000 });
             */
            init: function (cfg) {
                this.cfg = this.cfg.extend(cfg);
            },

            /**
             * Derives a key from a password.
             *
             * @param {WordArray|string} password The password.
             * @param {WordArray|string} salt A salt.
             *
             * @return {WordArray} The derived key.
             *
             * @example
             *
             *     var key = kdf.compute(password, salt);
             */
            compute: function (password, salt) {
                // Shortcut
                var cfg = this.cfg;

                // Init hasher
                var hasher = cfg.hasher.create();

                // Initial values
                var derivedKey = WordArray.create();

                // Shortcuts
                var derivedKeyWords = derivedKey.words;
                var keySize = cfg.keySize;
                var iterations = cfg.iterations;

                // Generate key
                while (derivedKeyWords.length < keySize) {
                    if (block) {
                        hasher.update(block);
                    }
                    var block = hasher.update(password).finalize(salt);
                    hasher.reset();

                    // Iterations
                    for (var i = 1; i < iterations; i++) {
                        block = hasher.finalize(block);
                        hasher.reset();
                    }

                    derivedKey.concat(block);
                }
                derivedKey.sigBytes = keySize * 4;

                return derivedKey;
            }
        });

        /**
         * Derives a key from a password.
         *
         * @param {WordArray|string} password The password.
         * @param {WordArray|string} salt A salt.
         * @param {Object} cfg (Optional) The configuration options to use for this computation.
         *
         * @return {WordArray} The derived key.
         *
         * @static
         *
         * @example
         *
         *     var key = CryptoJS.EvpKDF(password, salt);
         *     var key = CryptoJS.EvpKDF(password, salt, { keySize: 8 });
         *     var key = CryptoJS.EvpKDF(password, salt, { keySize: 8, iterations: 1000 });
         */
        C.EvpKDF = function (password, salt, cfg) {
            return EvpKDF.create(cfg).compute(password, salt);
        };
    }());

    var CryptoJS$3 = core.CryptoJS;

    /*
    CryptoJS v3.1.2
    code.google.com/p/crypto-js
    (c) 2009-2013 by Jeff Mott. All rights reserved.
    code.google.com/p/crypto-js/wiki/License
    */
    /**
     * Cipher core components.
     */
    CryptoJS$3.lib.Cipher || (function (undefined$1) {
        // Shortcuts
        var C = CryptoJS$3;
        var C_lib = C.lib;
        var Base = C_lib.Base;
        var WordArray = C_lib.WordArray;
        var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm;
        var C_enc = C.enc;
        C_enc.Utf8;
        var Base64 = C_enc.Base64;
        var C_algo = C.algo;
        var EvpKDF = C_algo.EvpKDF;

        /**
         * Abstract base cipher template.
         *
         * @property {number} keySize This cipher's key size. Default: 4 (128 bits)
         * @property {number} ivSize This cipher's IV size. Default: 4 (128 bits)
         * @property {number} _ENC_XFORM_MODE A constant representing encryption mode.
         * @property {number} _DEC_XFORM_MODE A constant representing decryption mode.
         */
        var Cipher = C_lib.Cipher = BufferedBlockAlgorithm.extend({
            /**
             * Configuration options.
             *
             * @property {WordArray} iv The IV to use for this operation.
             */
            cfg: Base.extend(),

            /**
             * Creates this cipher in encryption mode.
             *
             * @param {WordArray} key The key.
             * @param {Object} cfg (Optional) The configuration options to use for this operation.
             *
             * @return {Cipher} A cipher instance.
             *
             * @static
             *
             * @example
             *
             *     var cipher = CryptoJS.algo.AES.createEncryptor(keyWordArray, { iv: ivWordArray });
             */
            createEncryptor: function (key, cfg) {
                return this.create(this._ENC_XFORM_MODE, key, cfg);
            },

            /**
             * Creates this cipher in decryption mode.
             *
             * @param {WordArray} key The key.
             * @param {Object} cfg (Optional) The configuration options to use for this operation.
             *
             * @return {Cipher} A cipher instance.
             *
             * @static
             *
             * @example
             *
             *     var cipher = CryptoJS.algo.AES.createDecryptor(keyWordArray, { iv: ivWordArray });
             */
            createDecryptor: function (key, cfg) {
                return this.create(this._DEC_XFORM_MODE, key, cfg);
            },

            /**
             * Initializes a newly created cipher.
             *
             * @param {number} xformMode Either the encryption or decryption transormation mode constant.
             * @param {WordArray} key The key.
             * @param {Object} cfg (Optional) The configuration options to use for this operation.
             *
             * @example
             *
             *     var cipher = CryptoJS.algo.AES.create(CryptoJS.algo.AES._ENC_XFORM_MODE, keyWordArray, { iv: ivWordArray });
             */
            init: function (xformMode, key, cfg) {
                // Apply config defaults
                this.cfg = this.cfg.extend(cfg);

                // Store transform mode and key
                this._xformMode = xformMode;
                this._key = key;

                // Set initial values
                this.reset();
            },

            /**
             * Resets this cipher to its initial state.
             *
             * @example
             *
             *     cipher.reset();
             */
            reset: function () {
                // Reset data buffer
                BufferedBlockAlgorithm.reset.call(this);

                // Perform concrete-cipher logic
                this._doReset();
            },

            /**
             * Adds data to be encrypted or decrypted.
             *
             * @param {WordArray|string} dataUpdate The data to encrypt or decrypt.
             *
             * @return {WordArray} The data after processing.
             *
             * @example
             *
             *     var encrypted = cipher.process('data');
             *     var encrypted = cipher.process(wordArray);
             */
            process: function (dataUpdate) {
                // Append
                this._append(dataUpdate);

                // Process available blocks
                return this._process();
            },

            /**
             * Finalizes the encryption or decryption process.
             * Note that the finalize operation is effectively a destructive, read-once operation.
             *
             * @param {WordArray|string} dataUpdate The final data to encrypt or decrypt.
             *
             * @return {WordArray} The data after final processing.
             *
             * @example
             *
             *     var encrypted = cipher.finalize();
             *     var encrypted = cipher.finalize('data');
             *     var encrypted = cipher.finalize(wordArray);
             */
            finalize: function (dataUpdate) {
                // Final data update
                if (dataUpdate) {
                    this._append(dataUpdate);
                }

                // Perform concrete-cipher logic
                var finalProcessedData = this._doFinalize();

                return finalProcessedData;
            },

            keySize: 128/32,

            ivSize: 128/32,

            _ENC_XFORM_MODE: 1,

            _DEC_XFORM_MODE: 2,

            /**
             * Creates shortcut functions to a cipher's object interface.
             *
             * @param {Cipher} cipher The cipher to create a helper for.
             *
             * @return {Object} An object with encrypt and decrypt shortcut functions.
             *
             * @static
             *
             * @example
             *
             *     var AES = CryptoJS.lib.Cipher._createHelper(CryptoJS.algo.AES);
             */
            _createHelper: (function () {
                function selectCipherStrategy(key) {
                    if (typeof key == 'string') {
                        return PasswordBasedCipher;
                    } else {
                        return SerializableCipher;
                    }
                }

                return function (cipher) {
                    return {
                        encrypt: function (message, key, cfg) {
                            return selectCipherStrategy(key).encrypt(cipher, message, key, cfg);
                        },

                        decrypt: function (ciphertext, key, cfg) {
                            return selectCipherStrategy(key).decrypt(cipher, ciphertext, key, cfg);
                        }
                    };
                };
            }())
        });

        /**
         * Abstract base stream cipher template.
         *
         * @property {number} blockSize The number of 32-bit words this cipher operates on. Default: 1 (32 bits)
         */
        C_lib.StreamCipher = Cipher.extend({
            _doFinalize: function () {
                // Process partial blocks
                var finalProcessedBlocks = this._process(!!'flush');

                return finalProcessedBlocks;
            },

            blockSize: 1
        });

        /**
         * Mode namespace.
         */
        var C_mode = C.mode = {};

        /**
         * Abstract base block cipher mode template.
         */
        var BlockCipherMode = C_lib.BlockCipherMode = Base.extend({
            /**
             * Creates this mode for encryption.
             *
             * @param {Cipher} cipher A block cipher instance.
             * @param {Array} iv The IV words.
             *
             * @static
             *
             * @example
             *
             *     var mode = CryptoJS.mode.CBC.createEncryptor(cipher, iv.words);
             */
            createEncryptor: function (cipher, iv) {
                return this.Encryptor.create(cipher, iv);
            },

            /**
             * Creates this mode for decryption.
             *
             * @param {Cipher} cipher A block cipher instance.
             * @param {Array} iv The IV words.
             *
             * @static
             *
             * @example
             *
             *     var mode = CryptoJS.mode.CBC.createDecryptor(cipher, iv.words);
             */
            createDecryptor: function (cipher, iv) {
                return this.Decryptor.create(cipher, iv);
            },

            /**
             * Initializes a newly created mode.
             *
             * @param {Cipher} cipher A block cipher instance.
             * @param {Array} iv The IV words.
             *
             * @example
             *
             *     var mode = CryptoJS.mode.CBC.Encryptor.create(cipher, iv.words);
             */
            init: function (cipher, iv) {
                this._cipher = cipher;
                this._iv = iv;
            }
        });

        /**
         * Cipher Block Chaining mode.
         */
        var CBC = C_mode.CBC = (function () {
            /**
             * Abstract base CBC mode.
             */
            var CBC = BlockCipherMode.extend();

            /**
             * CBC encryptor.
             */
            CBC.Encryptor = CBC.extend({
                /**
                 * Processes the data block at offset.
                 *
                 * @param {Array} words The data words to operate on.
                 * @param {number} offset The offset where the block starts.
                 *
                 * @example
                 *
                 *     mode.processBlock(data.words, offset);
                 */
                processBlock: function (words, offset) {
                    // Shortcuts
                    var cipher = this._cipher;
                    var blockSize = cipher.blockSize;

                    // XOR and encrypt
                    xorBlock.call(this, words, offset, blockSize);
                    cipher.encryptBlock(words, offset);

                    // Remember this block to use with next block
                    this._prevBlock = words.slice(offset, offset + blockSize);
                }
            });

            /**
             * CBC decryptor.
             */
            CBC.Decryptor = CBC.extend({
                /**
                 * Processes the data block at offset.
                 *
                 * @param {Array} words The data words to operate on.
                 * @param {number} offset The offset where the block starts.
                 *
                 * @example
                 *
                 *     mode.processBlock(data.words, offset);
                 */
                processBlock: function (words, offset) {
                    // Shortcuts
                    var cipher = this._cipher;
                    var blockSize = cipher.blockSize;

                    // Remember this block to use with next block
                    var thisBlock = words.slice(offset, offset + blockSize);

                    // Decrypt and XOR
                    cipher.decryptBlock(words, offset);
                    xorBlock.call(this, words, offset, blockSize);

                    // This block becomes the previous block
                    this._prevBlock = thisBlock;
                }
            });

            function xorBlock(words, offset, blockSize) {
                // Shortcut
                var iv = this._iv;

                // Choose mixing block
                if (iv) {
                    var block = iv;

                    // Remove IV for subsequent blocks
                    this._iv = undefined$1;
                } else {
                    var block = this._prevBlock;
                }

                // XOR blocks
                for (var i = 0; i < blockSize; i++) {
                    words[offset + i] ^= block[i];
                }
            }

            return CBC;
        }());

        /**
         * Padding namespace.
         */
        var C_pad = C.pad = {};

        /**
         * PKCS #5/7 padding strategy.
         */
        var Pkcs7 = C_pad.Pkcs7 = {
            /**
             * Pads data using the algorithm defined in PKCS #5/7.
             *
             * @param {WordArray} data The data to pad.
             * @param {number} blockSize The multiple that the data should be padded to.
             *
             * @static
             *
             * @example
             *
             *     CryptoJS.pad.Pkcs7.pad(wordArray, 4);
             */
            pad: function (data, blockSize) {
                // Shortcut
                var blockSizeBytes = blockSize * 4;

                // Count padding bytes
                var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;

                // Create padding word
                var paddingWord = (nPaddingBytes << 24) | (nPaddingBytes << 16) | (nPaddingBytes << 8) | nPaddingBytes;

                // Create padding
                var paddingWords = [];
                for (var i = 0; i < nPaddingBytes; i += 4) {
                    paddingWords.push(paddingWord);
                }
                var padding = WordArray.create(paddingWords, nPaddingBytes);

                // Add padding
                data.concat(padding);
            },

            /**
             * Unpads data that had been padded using the algorithm defined in PKCS #5/7.
             *
             * @param {WordArray} data The data to unpad.
             *
             * @static
             *
             * @example
             *
             *     CryptoJS.pad.Pkcs7.unpad(wordArray);
             */
            unpad: function (data) {
                // Get number of padding bytes from last byte
                var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;

                // Remove padding
                data.sigBytes -= nPaddingBytes;
            }
        };

        /**
         * Abstract base block cipher template.
         *
         * @property {number} blockSize The number of 32-bit words this cipher operates on. Default: 4 (128 bits)
         */
        C_lib.BlockCipher = Cipher.extend({
            /**
             * Configuration options.
             *
             * @property {Mode} mode The block mode to use. Default: CBC
             * @property {Padding} padding The padding strategy to use. Default: Pkcs7
             */
            cfg: Cipher.cfg.extend({
                mode: CBC,
                padding: Pkcs7
            }),

            reset: function () {
                // Reset cipher
                Cipher.reset.call(this);

                // Shortcuts
                var cfg = this.cfg;
                var iv = cfg.iv;
                var mode = cfg.mode;

                // Reset block mode
                if (this._xformMode == this._ENC_XFORM_MODE) {
                    var modeCreator = mode.createEncryptor;
                } else /* if (this._xformMode == this._DEC_XFORM_MODE) */ {
                    var modeCreator = mode.createDecryptor;

                    // Keep at least one block in the buffer for unpadding
                    this._minBufferSize = 1;
                }
                this._mode = modeCreator.call(mode, this, iv && iv.words);
            },

            _doProcessBlock: function (words, offset) {
                this._mode.processBlock(words, offset);
            },

            _doFinalize: function () {
                // Shortcut
                var padding = this.cfg.padding;

                // Finalize
                if (this._xformMode == this._ENC_XFORM_MODE) {
                    // Pad data
                    padding.pad(this._data, this.blockSize);

                    // Process final blocks
                    var finalProcessedBlocks = this._process(!!'flush');
                } else /* if (this._xformMode == this._DEC_XFORM_MODE) */ {
                    // Process final blocks
                    var finalProcessedBlocks = this._process(!!'flush');

                    // Unpad data
                    padding.unpad(finalProcessedBlocks);
                }

                return finalProcessedBlocks;
            },

            blockSize: 128/32
        });

        /**
         * A collection of cipher parameters.
         *
         * @property {WordArray} ciphertext The raw ciphertext.
         * @property {WordArray} key The key to this ciphertext.
         * @property {WordArray} iv The IV used in the ciphering operation.
         * @property {WordArray} salt The salt used with a key derivation function.
         * @property {Cipher} algorithm The cipher algorithm.
         * @property {Mode} mode The block mode used in the ciphering operation.
         * @property {Padding} padding The padding scheme used in the ciphering operation.
         * @property {number} blockSize The block size of the cipher.
         * @property {Format} formatter The default formatting strategy to convert this cipher params object to a string.
         */
        var CipherParams = C_lib.CipherParams = Base.extend({
            /**
             * Initializes a newly created cipher params object.
             *
             * @param {Object} cipherParams An object with any of the possible cipher parameters.
             *
             * @example
             *
             *     var cipherParams = CryptoJS.lib.CipherParams.create({
             *         ciphertext: ciphertextWordArray,
             *         key: keyWordArray,
             *         iv: ivWordArray,
             *         salt: saltWordArray,
             *         algorithm: CryptoJS.algo.AES,
             *         mode: CryptoJS.mode.CBC,
             *         padding: CryptoJS.pad.PKCS7,
             *         blockSize: 4,
             *         formatter: CryptoJS.format.OpenSSL
             *     });
             */
            init: function (cipherParams) {
                this.mixIn(cipherParams);
            },

            /**
             * Converts this cipher params object to a string.
             *
             * @param {Format} formatter (Optional) The formatting strategy to use.
             *
             * @return {string} The stringified cipher params.
             *
             * @throws Error If neither the formatter nor the default formatter is set.
             *
             * @example
             *
             *     var string = cipherParams + '';
             *     var string = cipherParams.toString();
             *     var string = cipherParams.toString(CryptoJS.format.OpenSSL);
             */
            toString: function (formatter) {
                return (formatter || this.formatter).stringify(this);
            }
        });

        /**
         * Format namespace.
         */
        var C_format = C.format = {};

        /**
         * OpenSSL formatting strategy.
         */
        var OpenSSLFormatter = C_format.OpenSSL = {
            /**
             * Converts a cipher params object to an OpenSSL-compatible string.
             *
             * @param {CipherParams} cipherParams The cipher params object.
             *
             * @return {string} The OpenSSL-compatible string.
             *
             * @static
             *
             * @example
             *
             *     var openSSLString = CryptoJS.format.OpenSSL.stringify(cipherParams);
             */
            stringify: function (cipherParams) {
                // Shortcuts
                var ciphertext = cipherParams.ciphertext;
                var salt = cipherParams.salt;

                // Format
                if (salt) {
                    var wordArray = WordArray.create([0x53616c74, 0x65645f5f]).concat(salt).concat(ciphertext);
                } else {
                    var wordArray = ciphertext;
                }

                return wordArray.toString(Base64);
            },

            /**
             * Converts an OpenSSL-compatible string to a cipher params object.
             *
             * @param {string} openSSLStr The OpenSSL-compatible string.
             *
             * @return {CipherParams} The cipher params object.
             *
             * @static
             *
             * @example
             *
             *     var cipherParams = CryptoJS.format.OpenSSL.parse(openSSLString);
             */
            parse: function (openSSLStr) {
                // Parse base64
                var ciphertext = Base64.parse(openSSLStr);

                // Shortcut
                var ciphertextWords = ciphertext.words;

                // Test for salt
                if (ciphertextWords[0] == 0x53616c74 && ciphertextWords[1] == 0x65645f5f) {
                    // Extract salt
                    var salt = WordArray.create(ciphertextWords.slice(2, 4));

                    // Remove salt from ciphertext
                    ciphertextWords.splice(0, 4);
                    ciphertext.sigBytes -= 16;
                }

                return CipherParams.create({ ciphertext: ciphertext, salt: salt });
            }
        };

        /**
         * A cipher wrapper that returns ciphertext as a serializable cipher params object.
         */
        var SerializableCipher = C_lib.SerializableCipher = Base.extend({
            /**
             * Configuration options.
             *
             * @property {Formatter} format The formatting strategy to convert cipher param objects to and from a string. Default: OpenSSL
             */
            cfg: Base.extend({
                format: OpenSSLFormatter
            }),

            /**
             * Encrypts a message.
             *
             * @param {Cipher} cipher The cipher algorithm to use.
             * @param {WordArray|string} message The message to encrypt.
             * @param {WordArray} key The key.
             * @param {Object} cfg (Optional) The configuration options to use for this operation.
             *
             * @return {CipherParams} A cipher params object.
             *
             * @static
             *
             * @example
             *
             *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key);
             *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv });
             *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv, format: CryptoJS.format.OpenSSL });
             */
            encrypt: function (cipher, message, key, cfg) {
                // Apply config defaults
                cfg = this.cfg.extend(cfg);

                // Encrypt
                var encryptor = cipher.createEncryptor(key, cfg);
                var ciphertext = encryptor.finalize(message);

                // Shortcut
                var cipherCfg = encryptor.cfg;

                // Create and return serializable cipher params
                return CipherParams.create({
                    ciphertext: ciphertext,
                    key: key,
                    iv: cipherCfg.iv,
                    algorithm: cipher,
                    mode: cipherCfg.mode,
                    padding: cipherCfg.padding,
                    blockSize: cipher.blockSize,
                    formatter: cfg.format
                });
            },

            /**
             * Decrypts serialized ciphertext.
             *
             * @param {Cipher} cipher The cipher algorithm to use.
             * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
             * @param {WordArray} key The key.
             * @param {Object} cfg (Optional) The configuration options to use for this operation.
             *
             * @return {WordArray} The plaintext.
             *
             * @static
             *
             * @example
             *
             *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, key, { iv: iv, format: CryptoJS.format.OpenSSL });
             *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, key, { iv: iv, format: CryptoJS.format.OpenSSL });
             */
            decrypt: function (cipher, ciphertext, key, cfg) {
                // Apply config defaults
                cfg = this.cfg.extend(cfg);

                // Convert string to CipherParams
                ciphertext = this._parse(ciphertext, cfg.format);

                // Decrypt
                var plaintext = cipher.createDecryptor(key, cfg).finalize(ciphertext.ciphertext);

                return plaintext;
            },

            /**
             * Converts serialized ciphertext to CipherParams,
             * else assumed CipherParams already and returns ciphertext unchanged.
             *
             * @param {CipherParams|string} ciphertext The ciphertext.
             * @param {Formatter} format The formatting strategy to use to parse serialized ciphertext.
             *
             * @return {CipherParams} The unserialized ciphertext.
             *
             * @static
             *
             * @example
             *
             *     var ciphertextParams = CryptoJS.lib.SerializableCipher._parse(ciphertextStringOrParams, format);
             */
            _parse: function (ciphertext, format) {
                if (typeof ciphertext == 'string') {
                    return format.parse(ciphertext, this);
                } else {
                    return ciphertext;
                }
            }
        });

        /**
         * Key derivation function namespace.
         */
        var C_kdf = C.kdf = {};

        /**
         * OpenSSL key derivation function.
         */
        var OpenSSLKdf = C_kdf.OpenSSL = {
            /**
             * Derives a key and IV from a password.
             *
             * @param {string} password The password to derive from.
             * @param {number} keySize The size in words of the key to generate.
             * @param {number} ivSize The size in words of the IV to generate.
             * @param {WordArray|string} salt (Optional) A 64-bit salt to use. If omitted, a salt will be generated randomly.
             *
             * @return {CipherParams} A cipher params object with the key, IV, and salt.
             *
             * @static
             *
             * @example
             *
             *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32);
             *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32, 'saltsalt');
             */
            execute: function (password, keySize, ivSize, salt) {
                // Generate random salt
                if (!salt) {
                    salt = WordArray.random(64/8);
                }

                // Derive key and IV
                var key = EvpKDF.create({ keySize: keySize + ivSize }).compute(password, salt);

                // Separate key and IV
                var iv = WordArray.create(key.words.slice(keySize), ivSize * 4);
                key.sigBytes = keySize * 4;

                // Return params
                return CipherParams.create({ key: key, iv: iv, salt: salt });
            }
        };

        /**
         * A serializable cipher wrapper that derives the key from a password,
         * and returns ciphertext as a serializable cipher params object.
         */
        var PasswordBasedCipher = C_lib.PasswordBasedCipher = SerializableCipher.extend({
            /**
             * Configuration options.
             *
             * @property {KDF} kdf The key derivation function to use to generate a key and IV from a password. Default: OpenSSL
             */
            cfg: SerializableCipher.cfg.extend({
                kdf: OpenSSLKdf
            }),

            /**
             * Encrypts a message using a password.
             *
             * @param {Cipher} cipher The cipher algorithm to use.
             * @param {WordArray|string} message The message to encrypt.
             * @param {string} password The password.
             * @param {Object} cfg (Optional) The configuration options to use for this operation.
             *
             * @return {CipherParams} A cipher params object.
             *
             * @static
             *
             * @example
             *
             *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password');
             *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password', { format: CryptoJS.format.OpenSSL });
             */
            encrypt: function (cipher, message, password, cfg) {
                // Apply config defaults
                cfg = this.cfg.extend(cfg);

                // Derive key and other params
                var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize);

                // Add IV to config
                cfg.iv = derivedParams.iv;

                // Encrypt
                var ciphertext = SerializableCipher.encrypt.call(this, cipher, message, derivedParams.key, cfg);

                // Mix in derived params
                ciphertext.mixIn(derivedParams);

                return ciphertext;
            },

            /**
             * Decrypts serialized ciphertext using a password.
             *
             * @param {Cipher} cipher The cipher algorithm to use.
             * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
             * @param {string} password The password.
             * @param {Object} cfg (Optional) The configuration options to use for this operation.
             *
             * @return {WordArray} The plaintext.
             *
             * @static
             *
             * @example
             *
             *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, 'password', { format: CryptoJS.format.OpenSSL });
             *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, 'password', { format: CryptoJS.format.OpenSSL });
             */
            decrypt: function (cipher, ciphertext, password, cfg) {
                // Apply config defaults
                cfg = this.cfg.extend(cfg);

                // Convert string to CipherParams
                ciphertext = this._parse(ciphertext, cfg.format);

                // Derive key and other params
                var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize, ciphertext.salt);

                // Add IV to config
                cfg.iv = derivedParams.iv;

                // Decrypt
                var plaintext = SerializableCipher.decrypt.call(this, cipher, ciphertext, derivedParams.key, cfg);

                return plaintext;
            }
        });
    }());

    var CryptoJS$2 = core.CryptoJS;

    /*
    CryptoJS v3.1.2
    code.google.com/p/crypto-js
    (c) 2009-2013 by Jeff Mott. All rights reserved.
    code.google.com/p/crypto-js/wiki/License
    */
    (function () {
        // Shortcuts
        var C = CryptoJS$2;
        var C_lib = C.lib;
        var BlockCipher = C_lib.BlockCipher;
        var C_algo = C.algo;

        // Lookup tables
        var SBOX = [];
        var INV_SBOX = [];
        var SUB_MIX_0 = [];
        var SUB_MIX_1 = [];
        var SUB_MIX_2 = [];
        var SUB_MIX_3 = [];
        var INV_SUB_MIX_0 = [];
        var INV_SUB_MIX_1 = [];
        var INV_SUB_MIX_2 = [];
        var INV_SUB_MIX_3 = [];

        // Compute lookup tables
        (function () {
            // Compute double table
            var d = [];
            for (var i = 0; i < 256; i++) {
                if (i < 128) {
                    d[i] = i << 1;
                } else {
                    d[i] = (i << 1) ^ 0x11b;
                }
            }

            // Walk GF(2^8)
            var x = 0;
            var xi = 0;
            for (var i = 0; i < 256; i++) {
                // Compute sbox
                var sx = xi ^ (xi << 1) ^ (xi << 2) ^ (xi << 3) ^ (xi << 4);
                sx = (sx >>> 8) ^ (sx & 0xff) ^ 0x63;
                SBOX[x] = sx;
                INV_SBOX[sx] = x;

                // Compute multiplication
                var x2 = d[x];
                var x4 = d[x2];
                var x8 = d[x4];

                // Compute sub bytes, mix columns tables
                var t = (d[sx] * 0x101) ^ (sx * 0x1010100);
                SUB_MIX_0[x] = (t << 24) | (t >>> 8);
                SUB_MIX_1[x] = (t << 16) | (t >>> 16);
                SUB_MIX_2[x] = (t << 8)  | (t >>> 24);
                SUB_MIX_3[x] = t;

                // Compute inv sub bytes, inv mix columns tables
                var t = (x8 * 0x1010101) ^ (x4 * 0x10001) ^ (x2 * 0x101) ^ (x * 0x1010100);
                INV_SUB_MIX_0[sx] = (t << 24) | (t >>> 8);
                INV_SUB_MIX_1[sx] = (t << 16) | (t >>> 16);
                INV_SUB_MIX_2[sx] = (t << 8)  | (t >>> 24);
                INV_SUB_MIX_3[sx] = t;

                // Compute next counter
                if (!x) {
                    x = xi = 1;
                } else {
                    x = x2 ^ d[d[d[x8 ^ x2]]];
                    xi ^= d[d[xi]];
                }
            }
        }());

        // Precomputed Rcon lookup
        var RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

        /**
         * AES block cipher algorithm.
         */
        var AES = C_algo.AES = BlockCipher.extend({
            _doReset: function () {
                // Shortcuts
                var key = this._key;
                var keyWords = key.words;
                var keySize = key.sigBytes / 4;

                // Compute number of rounds
                var nRounds = this._nRounds = keySize + 6;

                // Compute number of key schedule rows
                var ksRows = (nRounds + 1) * 4;

                // Compute key schedule
                var keySchedule = this._keySchedule = [];
                for (var ksRow = 0; ksRow < ksRows; ksRow++) {
                    if (ksRow < keySize) {
                        keySchedule[ksRow] = keyWords[ksRow];
                    } else {
                        var t = keySchedule[ksRow - 1];

                        if (!(ksRow % keySize)) {
                            // Rot word
                            t = (t << 8) | (t >>> 24);

                            // Sub word
                            t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];

                            // Mix Rcon
                            t ^= RCON[(ksRow / keySize) | 0] << 24;
                        } else if (keySize > 6 && ksRow % keySize == 4) {
                            // Sub word
                            t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];
                        }

                        keySchedule[ksRow] = keySchedule[ksRow - keySize] ^ t;
                    }
                }

                // Compute inv key schedule
                var invKeySchedule = this._invKeySchedule = [];
                for (var invKsRow = 0; invKsRow < ksRows; invKsRow++) {
                    var ksRow = ksRows - invKsRow;

                    if (invKsRow % 4) {
                        var t = keySchedule[ksRow];
                    } else {
                        var t = keySchedule[ksRow - 4];
                    }

                    if (invKsRow < 4 || ksRow <= 4) {
                        invKeySchedule[invKsRow] = t;
                    } else {
                        invKeySchedule[invKsRow] = INV_SUB_MIX_0[SBOX[t >>> 24]] ^ INV_SUB_MIX_1[SBOX[(t >>> 16) & 0xff]] ^
                                                   INV_SUB_MIX_2[SBOX[(t >>> 8) & 0xff]] ^ INV_SUB_MIX_3[SBOX[t & 0xff]];
                    }
                }
            },

            encryptBlock: function (M, offset) {
                this._doCryptBlock(M, offset, this._keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX);
            },

            decryptBlock: function (M, offset) {
                // Swap 2nd and 4th rows
                var t = M[offset + 1];
                M[offset + 1] = M[offset + 3];
                M[offset + 3] = t;

                this._doCryptBlock(M, offset, this._invKeySchedule, INV_SUB_MIX_0, INV_SUB_MIX_1, INV_SUB_MIX_2, INV_SUB_MIX_3, INV_SBOX);

                // Inv swap 2nd and 4th rows
                var t = M[offset + 1];
                M[offset + 1] = M[offset + 3];
                M[offset + 3] = t;
            },

            _doCryptBlock: function (M, offset, keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX) {
                // Shortcut
                var nRounds = this._nRounds;

                // Get input, add round key
                var s0 = M[offset]     ^ keySchedule[0];
                var s1 = M[offset + 1] ^ keySchedule[1];
                var s2 = M[offset + 2] ^ keySchedule[2];
                var s3 = M[offset + 3] ^ keySchedule[3];

                // Key schedule row counter
                var ksRow = 4;

                // Rounds
                for (var round = 1; round < nRounds; round++) {
                    // Shift rows, sub bytes, mix columns, add round key
                    var t0 = SUB_MIX_0[s0 >>> 24] ^ SUB_MIX_1[(s1 >>> 16) & 0xff] ^ SUB_MIX_2[(s2 >>> 8) & 0xff] ^ SUB_MIX_3[s3 & 0xff] ^ keySchedule[ksRow++];
                    var t1 = SUB_MIX_0[s1 >>> 24] ^ SUB_MIX_1[(s2 >>> 16) & 0xff] ^ SUB_MIX_2[(s3 >>> 8) & 0xff] ^ SUB_MIX_3[s0 & 0xff] ^ keySchedule[ksRow++];
                    var t2 = SUB_MIX_0[s2 >>> 24] ^ SUB_MIX_1[(s3 >>> 16) & 0xff] ^ SUB_MIX_2[(s0 >>> 8) & 0xff] ^ SUB_MIX_3[s1 & 0xff] ^ keySchedule[ksRow++];
                    var t3 = SUB_MIX_0[s3 >>> 24] ^ SUB_MIX_1[(s0 >>> 16) & 0xff] ^ SUB_MIX_2[(s1 >>> 8) & 0xff] ^ SUB_MIX_3[s2 & 0xff] ^ keySchedule[ksRow++];

                    // Update state
                    s0 = t0;
                    s1 = t1;
                    s2 = t2;
                    s3 = t3;
                }

                // Shift rows, sub bytes, add round key
                var t0 = ((SBOX[s0 >>> 24] << 24) | (SBOX[(s1 >>> 16) & 0xff] << 16) | (SBOX[(s2 >>> 8) & 0xff] << 8) | SBOX[s3 & 0xff]) ^ keySchedule[ksRow++];
                var t1 = ((SBOX[s1 >>> 24] << 24) | (SBOX[(s2 >>> 16) & 0xff] << 16) | (SBOX[(s3 >>> 8) & 0xff] << 8) | SBOX[s0 & 0xff]) ^ keySchedule[ksRow++];
                var t2 = ((SBOX[s2 >>> 24] << 24) | (SBOX[(s3 >>> 16) & 0xff] << 16) | (SBOX[(s0 >>> 8) & 0xff] << 8) | SBOX[s1 & 0xff]) ^ keySchedule[ksRow++];
                var t3 = ((SBOX[s3 >>> 24] << 24) | (SBOX[(s0 >>> 16) & 0xff] << 16) | (SBOX[(s1 >>> 8) & 0xff] << 8) | SBOX[s2 & 0xff]) ^ keySchedule[ksRow++];

                // Set output
                M[offset]     = t0;
                M[offset + 1] = t1;
                M[offset + 2] = t2;
                M[offset + 3] = t3;
            },

            keySize: 256/32
        });

        /**
         * Shortcut functions to the cipher's object interface.
         *
         * @example
         *
         *     var ciphertext = CryptoJS.AES.encrypt(message, key, cfg);
         *     var plaintext  = CryptoJS.AES.decrypt(ciphertext, key, cfg);
         */
        C.AES = BlockCipher._createHelper(AES);
    }());

    var CryptoJS$1 = core.CryptoJS;

    // create custom json serialization format
    var JsonFormatter$1 = {
    	stringify: function (cipherParams) {
    		// create json object with ciphertext
    		var jsonObj = {
    			ct: cipherParams.ciphertext.toString(CryptoJS$1.enc.Base64)
    		};
    		
    		// optionally add iv and salt
    		if (cipherParams.iv) {
    			jsonObj.iv = cipherParams.iv.toString();
    		}
    		
    		if (cipherParams.salt) {
    			jsonObj.s = cipherParams.salt.toString();
    		}

    		// stringify json object
    		return JSON.stringify(jsonObj)
    	},

    	parse: function (jsonStr) {
    		// parse json string
    		var jsonObj = JSON.parse(jsonStr);
    		
    		// extract ciphertext from json object, and create cipher params object
    		var cipherParams = CryptoJS$1.lib.CipherParams.create({
    			ciphertext: CryptoJS$1.enc.Base64.parse(jsonObj.ct)
    		});
    		
    		// optionally extract iv and salt
    		if (jsonObj.iv) {
    			cipherParams.iv = CryptoJS$1.enc.Hex.parse(jsonObj.iv);
    		}
                
    		if (jsonObj.s) {
    			cipherParams.salt = CryptoJS$1.enc.Hex.parse(jsonObj.s);
    		}
    		
    		return cipherParams;
    	}
    };

    var JsonFormatter_1$1 = JsonFormatter$1;

    var jsonformatter = {
    	JsonFormatter: JsonFormatter_1$1
    };

    var CryptoJS = core.CryptoJS;





    var JsonFormatter = jsonformatter.JsonFormatter;

    var CryptoJS_1 = CryptoJS;
    var JsonFormatter_1 = JsonFormatter;

    var cryptojs = {
    	CryptoJS: CryptoJS_1,
    	JsonFormatter: JsonFormatter_1
    };

    var dist$1 = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
        factory(exports) ;
    }(commonjsGlobal, (function (exports) {
        class ValidateTypes {
          constructor() {}

          getType(value) {
            return Object.prototype.toString.call(value);
          }

          getClassName(value) {
            try {
              return value.constructor.name;
            } catch (e) {}

            return this.getType(value);
          } //Validation functions


          isObject(value) {
            if (this.getType(value) === "[object Object]") return true;
            return false;
          }

          isFunction(value) {
            if (this.getType(value) === "[object Function]") return true;
            return false;
          }

          isString(value) {
            if (this.getType(value) === "[object String]") return true;
            return false;
          }

          isBoolean(value) {
            if (this.getType(value) === "[object Boolean]") return true;
            return false;
          }

          isArray(value) {
            if (this.getType(value) === "[object Array]") return true;
            return false;
          }

          isNumber(value) {
            if (this.getType(value) === "[object Number]") return true;
            return false;
          }

          isInteger(value) {
            if (this.getType(value) === "[object Number]" && Number.isInteger(value)) return true;
            return false;
          }

          isRegEx(value) {
            if (this.getType(value) === "[object RegExp]") return true;
            return false;
          }

          isStringHex(value) {
            if (!this.isStringWithValue(value)) return false;
            let hexRegEx = /([0-9]|[a-f])/gim;
            return (value.match(hexRegEx) || []).length === value.length;
          }

          hasKeys(value, keys) {
            if (keys.map(key => key in value).includes(false)) return false;
            return true;
          }

          isStringWithValue(value) {
            if (this.isString(value) && value !== '') return true;
            return false;
          }

          isObjectWithKeys(value) {
            if (this.isObject(value) && Object.keys(value).length > 0) return true;
            return false;
          }

          isArrayWithValues(value) {
            if (this.isArray(value) && value.length > 0) return true;
            return false;
          }

          isSpecificClass(value, className) {
            if (!this.isObject(value)) return false;
            if (this.getClassName(value) !== className) return false;
            return true;
          }

        }

        class AssertTypes {
          constructor() {
            this.validate = new ValidateTypes();
          } //Validation functions


          isObject(value) {
            if (!this.validate.isObject(value)) {
              throw new TypeError(`Expected type [object Object] but got ${this.validate.getType(value)}`);
            }

            return true;
          }

          isFunction(value) {
            if (!this.validate.isFunction(value)) {
              throw new TypeError(`Expected type [object Function] but got ${this.validate.getType(value)}`);
            }

            return true;
          }

          isString(value) {
            if (!this.validate.isString(value)) {
              throw new TypeError(`Expected type [object String] but got ${this.validate.getType(value)}`);
            }

            return true;
          }

          isBoolean(value) {
            if (!this.validate.isBoolean(value)) {
              throw new TypeError(`Expected type [object Boolean] but got ${this.validate.getType(value)}`);
            }

            return true;
          }

          isArray(value) {
            if (!this.validate.isArray(value)) {
              throw new TypeError(`Expected type [object Array] but got ${this.validate.getType(value)}`);
            }

            return true;
          }

          isNumber(value) {
            if (!this.validate.isNumber(value)) {
              throw new TypeError(`Expected type [object Number] but got ${this.validate.getType(value)}`);
            }

            return true;
          }

          isInteger(value) {
            if (!this.validate.isInteger(value)) {
              throw new TypeError(`Expected "${value}" to be an integer but got non-integer value`);
            }

            return true;
          }

          isRegEx(value) {
            if (!this.validate.isRegEx(value)) {
              throw new TypeError(`Expected type [object RegExp] but got ${this.validate.getType(value)}`);
            }

            return true;
          }

          isStringHex(value) {
            if (!this.validate.isStringHex(value)) {
              throw new TypeError(`Expected "${value}" to be hex but got non-hex value`);
            }

            return true;
          }

          hasKeys(value, keys) {
            if (!this.validate.hasKeys(value, keys)) {
              throw new TypeError(`Provided object does not contain all keys ${JSON.stringify(keys)}`);
            }

            return true;
          }

          isStringWithValue(value) {
            if (!this.validate.isStringWithValue(value)) {
              throw new TypeError(`Expected "${value}" to be [object String] and not empty`);
            }

            return true;
          }

          isObjectWithKeys(value) {
            if (!this.validate.isObjectWithKeys(value)) {
              throw new TypeError(`Expected "${value}" to be [object Object] and have keys`);
            }

            return true;
          }

          isArrayWithValues(value) {
            if (!this.validate.isArrayWithValues(value)) {
              throw new TypeError(`Expected "${value}" to be [object Array] and not empty`);
            }

            return true;
          }

          isSpecificClass(value, className) {
            if (!this.validate.isSpecificClass(value, className)) {
              throw new TypeError(`Expected Object Class to be "${className}" but got ${this.validate.getClassName(value)}`);
            }

            return true;
          }

        }

        const validateTypes = new ValidateTypes();
        const assertTypes = new AssertTypes();

        exports.assertTypes = assertTypes;
        exports.validateTypes = validateTypes;

        Object.defineProperty(exports, '__esModule', { value: true });

    })));
    });

    var _nodeResolve_empty = {};

    var _nodeResolve_empty$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': _nodeResolve_empty
    });

    var require$$0 = /*@__PURE__*/getAugmentedNamespace(_nodeResolve_empty$1);

    var naclFast = createCommonjsModule(function (module) {
    (function(nacl) {

    // Ported in 2014 by Dmitry Chestnykh and Devi Mandiri.
    // Public domain.
    //
    // Implementation derived from TweetNaCl version 20140427.
    // See for details: http://tweetnacl.cr.yp.to/

    var gf = function(init) {
      var i, r = new Float64Array(16);
      if (init) for (i = 0; i < init.length; i++) r[i] = init[i];
      return r;
    };

    //  Pluggable, initialized in high-level API below.
    var randombytes = function(/* x, n */) { throw new Error('no PRNG'); };

    var _0 = new Uint8Array(16);
    var _9 = new Uint8Array(32); _9[0] = 9;

    var gf0 = gf(),
        gf1 = gf([1]),
        _121665 = gf([0xdb41, 1]),
        D = gf([0x78a3, 0x1359, 0x4dca, 0x75eb, 0xd8ab, 0x4141, 0x0a4d, 0x0070, 0xe898, 0x7779, 0x4079, 0x8cc7, 0xfe73, 0x2b6f, 0x6cee, 0x5203]),
        D2 = gf([0xf159, 0x26b2, 0x9b94, 0xebd6, 0xb156, 0x8283, 0x149a, 0x00e0, 0xd130, 0xeef3, 0x80f2, 0x198e, 0xfce7, 0x56df, 0xd9dc, 0x2406]),
        X = gf([0xd51a, 0x8f25, 0x2d60, 0xc956, 0xa7b2, 0x9525, 0xc760, 0x692c, 0xdc5c, 0xfdd6, 0xe231, 0xc0a4, 0x53fe, 0xcd6e, 0x36d3, 0x2169]),
        Y = gf([0x6658, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666]),
        I = gf([0xa0b0, 0x4a0e, 0x1b27, 0xc4ee, 0xe478, 0xad2f, 0x1806, 0x2f43, 0xd7a7, 0x3dfb, 0x0099, 0x2b4d, 0xdf0b, 0x4fc1, 0x2480, 0x2b83]);

    function ts64(x, i, h, l) {
      x[i]   = (h >> 24) & 0xff;
      x[i+1] = (h >> 16) & 0xff;
      x[i+2] = (h >>  8) & 0xff;
      x[i+3] = h & 0xff;
      x[i+4] = (l >> 24)  & 0xff;
      x[i+5] = (l >> 16)  & 0xff;
      x[i+6] = (l >>  8)  & 0xff;
      x[i+7] = l & 0xff;
    }

    function vn(x, xi, y, yi, n) {
      var i,d = 0;
      for (i = 0; i < n; i++) d |= x[xi+i]^y[yi+i];
      return (1 & ((d - 1) >>> 8)) - 1;
    }

    function crypto_verify_16(x, xi, y, yi) {
      return vn(x,xi,y,yi,16);
    }

    function crypto_verify_32(x, xi, y, yi) {
      return vn(x,xi,y,yi,32);
    }

    function core_salsa20(o, p, k, c) {
      var j0  = c[ 0] & 0xff | (c[ 1] & 0xff)<<8 | (c[ 2] & 0xff)<<16 | (c[ 3] & 0xff)<<24,
          j1  = k[ 0] & 0xff | (k[ 1] & 0xff)<<8 | (k[ 2] & 0xff)<<16 | (k[ 3] & 0xff)<<24,
          j2  = k[ 4] & 0xff | (k[ 5] & 0xff)<<8 | (k[ 6] & 0xff)<<16 | (k[ 7] & 0xff)<<24,
          j3  = k[ 8] & 0xff | (k[ 9] & 0xff)<<8 | (k[10] & 0xff)<<16 | (k[11] & 0xff)<<24,
          j4  = k[12] & 0xff | (k[13] & 0xff)<<8 | (k[14] & 0xff)<<16 | (k[15] & 0xff)<<24,
          j5  = c[ 4] & 0xff | (c[ 5] & 0xff)<<8 | (c[ 6] & 0xff)<<16 | (c[ 7] & 0xff)<<24,
          j6  = p[ 0] & 0xff | (p[ 1] & 0xff)<<8 | (p[ 2] & 0xff)<<16 | (p[ 3] & 0xff)<<24,
          j7  = p[ 4] & 0xff | (p[ 5] & 0xff)<<8 | (p[ 6] & 0xff)<<16 | (p[ 7] & 0xff)<<24,
          j8  = p[ 8] & 0xff | (p[ 9] & 0xff)<<8 | (p[10] & 0xff)<<16 | (p[11] & 0xff)<<24,
          j9  = p[12] & 0xff | (p[13] & 0xff)<<8 | (p[14] & 0xff)<<16 | (p[15] & 0xff)<<24,
          j10 = c[ 8] & 0xff | (c[ 9] & 0xff)<<8 | (c[10] & 0xff)<<16 | (c[11] & 0xff)<<24,
          j11 = k[16] & 0xff | (k[17] & 0xff)<<8 | (k[18] & 0xff)<<16 | (k[19] & 0xff)<<24,
          j12 = k[20] & 0xff | (k[21] & 0xff)<<8 | (k[22] & 0xff)<<16 | (k[23] & 0xff)<<24,
          j13 = k[24] & 0xff | (k[25] & 0xff)<<8 | (k[26] & 0xff)<<16 | (k[27] & 0xff)<<24,
          j14 = k[28] & 0xff | (k[29] & 0xff)<<8 | (k[30] & 0xff)<<16 | (k[31] & 0xff)<<24,
          j15 = c[12] & 0xff | (c[13] & 0xff)<<8 | (c[14] & 0xff)<<16 | (c[15] & 0xff)<<24;

      var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7,
          x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14,
          x15 = j15, u;

      for (var i = 0; i < 20; i += 2) {
        u = x0 + x12 | 0;
        x4 ^= u<<7 | u>>>(32-7);
        u = x4 + x0 | 0;
        x8 ^= u<<9 | u>>>(32-9);
        u = x8 + x4 | 0;
        x12 ^= u<<13 | u>>>(32-13);
        u = x12 + x8 | 0;
        x0 ^= u<<18 | u>>>(32-18);

        u = x5 + x1 | 0;
        x9 ^= u<<7 | u>>>(32-7);
        u = x9 + x5 | 0;
        x13 ^= u<<9 | u>>>(32-9);
        u = x13 + x9 | 0;
        x1 ^= u<<13 | u>>>(32-13);
        u = x1 + x13 | 0;
        x5 ^= u<<18 | u>>>(32-18);

        u = x10 + x6 | 0;
        x14 ^= u<<7 | u>>>(32-7);
        u = x14 + x10 | 0;
        x2 ^= u<<9 | u>>>(32-9);
        u = x2 + x14 | 0;
        x6 ^= u<<13 | u>>>(32-13);
        u = x6 + x2 | 0;
        x10 ^= u<<18 | u>>>(32-18);

        u = x15 + x11 | 0;
        x3 ^= u<<7 | u>>>(32-7);
        u = x3 + x15 | 0;
        x7 ^= u<<9 | u>>>(32-9);
        u = x7 + x3 | 0;
        x11 ^= u<<13 | u>>>(32-13);
        u = x11 + x7 | 0;
        x15 ^= u<<18 | u>>>(32-18);

        u = x0 + x3 | 0;
        x1 ^= u<<7 | u>>>(32-7);
        u = x1 + x0 | 0;
        x2 ^= u<<9 | u>>>(32-9);
        u = x2 + x1 | 0;
        x3 ^= u<<13 | u>>>(32-13);
        u = x3 + x2 | 0;
        x0 ^= u<<18 | u>>>(32-18);

        u = x5 + x4 | 0;
        x6 ^= u<<7 | u>>>(32-7);
        u = x6 + x5 | 0;
        x7 ^= u<<9 | u>>>(32-9);
        u = x7 + x6 | 0;
        x4 ^= u<<13 | u>>>(32-13);
        u = x4 + x7 | 0;
        x5 ^= u<<18 | u>>>(32-18);

        u = x10 + x9 | 0;
        x11 ^= u<<7 | u>>>(32-7);
        u = x11 + x10 | 0;
        x8 ^= u<<9 | u>>>(32-9);
        u = x8 + x11 | 0;
        x9 ^= u<<13 | u>>>(32-13);
        u = x9 + x8 | 0;
        x10 ^= u<<18 | u>>>(32-18);

        u = x15 + x14 | 0;
        x12 ^= u<<7 | u>>>(32-7);
        u = x12 + x15 | 0;
        x13 ^= u<<9 | u>>>(32-9);
        u = x13 + x12 | 0;
        x14 ^= u<<13 | u>>>(32-13);
        u = x14 + x13 | 0;
        x15 ^= u<<18 | u>>>(32-18);
      }
       x0 =  x0 +  j0 | 0;
       x1 =  x1 +  j1 | 0;
       x2 =  x2 +  j2 | 0;
       x3 =  x3 +  j3 | 0;
       x4 =  x4 +  j4 | 0;
       x5 =  x5 +  j5 | 0;
       x6 =  x6 +  j6 | 0;
       x7 =  x7 +  j7 | 0;
       x8 =  x8 +  j8 | 0;
       x9 =  x9 +  j9 | 0;
      x10 = x10 + j10 | 0;
      x11 = x11 + j11 | 0;
      x12 = x12 + j12 | 0;
      x13 = x13 + j13 | 0;
      x14 = x14 + j14 | 0;
      x15 = x15 + j15 | 0;

      o[ 0] = x0 >>>  0 & 0xff;
      o[ 1] = x0 >>>  8 & 0xff;
      o[ 2] = x0 >>> 16 & 0xff;
      o[ 3] = x0 >>> 24 & 0xff;

      o[ 4] = x1 >>>  0 & 0xff;
      o[ 5] = x1 >>>  8 & 0xff;
      o[ 6] = x1 >>> 16 & 0xff;
      o[ 7] = x1 >>> 24 & 0xff;

      o[ 8] = x2 >>>  0 & 0xff;
      o[ 9] = x2 >>>  8 & 0xff;
      o[10] = x2 >>> 16 & 0xff;
      o[11] = x2 >>> 24 & 0xff;

      o[12] = x3 >>>  0 & 0xff;
      o[13] = x3 >>>  8 & 0xff;
      o[14] = x3 >>> 16 & 0xff;
      o[15] = x3 >>> 24 & 0xff;

      o[16] = x4 >>>  0 & 0xff;
      o[17] = x4 >>>  8 & 0xff;
      o[18] = x4 >>> 16 & 0xff;
      o[19] = x4 >>> 24 & 0xff;

      o[20] = x5 >>>  0 & 0xff;
      o[21] = x5 >>>  8 & 0xff;
      o[22] = x5 >>> 16 & 0xff;
      o[23] = x5 >>> 24 & 0xff;

      o[24] = x6 >>>  0 & 0xff;
      o[25] = x6 >>>  8 & 0xff;
      o[26] = x6 >>> 16 & 0xff;
      o[27] = x6 >>> 24 & 0xff;

      o[28] = x7 >>>  0 & 0xff;
      o[29] = x7 >>>  8 & 0xff;
      o[30] = x7 >>> 16 & 0xff;
      o[31] = x7 >>> 24 & 0xff;

      o[32] = x8 >>>  0 & 0xff;
      o[33] = x8 >>>  8 & 0xff;
      o[34] = x8 >>> 16 & 0xff;
      o[35] = x8 >>> 24 & 0xff;

      o[36] = x9 >>>  0 & 0xff;
      o[37] = x9 >>>  8 & 0xff;
      o[38] = x9 >>> 16 & 0xff;
      o[39] = x9 >>> 24 & 0xff;

      o[40] = x10 >>>  0 & 0xff;
      o[41] = x10 >>>  8 & 0xff;
      o[42] = x10 >>> 16 & 0xff;
      o[43] = x10 >>> 24 & 0xff;

      o[44] = x11 >>>  0 & 0xff;
      o[45] = x11 >>>  8 & 0xff;
      o[46] = x11 >>> 16 & 0xff;
      o[47] = x11 >>> 24 & 0xff;

      o[48] = x12 >>>  0 & 0xff;
      o[49] = x12 >>>  8 & 0xff;
      o[50] = x12 >>> 16 & 0xff;
      o[51] = x12 >>> 24 & 0xff;

      o[52] = x13 >>>  0 & 0xff;
      o[53] = x13 >>>  8 & 0xff;
      o[54] = x13 >>> 16 & 0xff;
      o[55] = x13 >>> 24 & 0xff;

      o[56] = x14 >>>  0 & 0xff;
      o[57] = x14 >>>  8 & 0xff;
      o[58] = x14 >>> 16 & 0xff;
      o[59] = x14 >>> 24 & 0xff;

      o[60] = x15 >>>  0 & 0xff;
      o[61] = x15 >>>  8 & 0xff;
      o[62] = x15 >>> 16 & 0xff;
      o[63] = x15 >>> 24 & 0xff;
    }

    function core_hsalsa20(o,p,k,c) {
      var j0  = c[ 0] & 0xff | (c[ 1] & 0xff)<<8 | (c[ 2] & 0xff)<<16 | (c[ 3] & 0xff)<<24,
          j1  = k[ 0] & 0xff | (k[ 1] & 0xff)<<8 | (k[ 2] & 0xff)<<16 | (k[ 3] & 0xff)<<24,
          j2  = k[ 4] & 0xff | (k[ 5] & 0xff)<<8 | (k[ 6] & 0xff)<<16 | (k[ 7] & 0xff)<<24,
          j3  = k[ 8] & 0xff | (k[ 9] & 0xff)<<8 | (k[10] & 0xff)<<16 | (k[11] & 0xff)<<24,
          j4  = k[12] & 0xff | (k[13] & 0xff)<<8 | (k[14] & 0xff)<<16 | (k[15] & 0xff)<<24,
          j5  = c[ 4] & 0xff | (c[ 5] & 0xff)<<8 | (c[ 6] & 0xff)<<16 | (c[ 7] & 0xff)<<24,
          j6  = p[ 0] & 0xff | (p[ 1] & 0xff)<<8 | (p[ 2] & 0xff)<<16 | (p[ 3] & 0xff)<<24,
          j7  = p[ 4] & 0xff | (p[ 5] & 0xff)<<8 | (p[ 6] & 0xff)<<16 | (p[ 7] & 0xff)<<24,
          j8  = p[ 8] & 0xff | (p[ 9] & 0xff)<<8 | (p[10] & 0xff)<<16 | (p[11] & 0xff)<<24,
          j9  = p[12] & 0xff | (p[13] & 0xff)<<8 | (p[14] & 0xff)<<16 | (p[15] & 0xff)<<24,
          j10 = c[ 8] & 0xff | (c[ 9] & 0xff)<<8 | (c[10] & 0xff)<<16 | (c[11] & 0xff)<<24,
          j11 = k[16] & 0xff | (k[17] & 0xff)<<8 | (k[18] & 0xff)<<16 | (k[19] & 0xff)<<24,
          j12 = k[20] & 0xff | (k[21] & 0xff)<<8 | (k[22] & 0xff)<<16 | (k[23] & 0xff)<<24,
          j13 = k[24] & 0xff | (k[25] & 0xff)<<8 | (k[26] & 0xff)<<16 | (k[27] & 0xff)<<24,
          j14 = k[28] & 0xff | (k[29] & 0xff)<<8 | (k[30] & 0xff)<<16 | (k[31] & 0xff)<<24,
          j15 = c[12] & 0xff | (c[13] & 0xff)<<8 | (c[14] & 0xff)<<16 | (c[15] & 0xff)<<24;

      var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7,
          x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14,
          x15 = j15, u;

      for (var i = 0; i < 20; i += 2) {
        u = x0 + x12 | 0;
        x4 ^= u<<7 | u>>>(32-7);
        u = x4 + x0 | 0;
        x8 ^= u<<9 | u>>>(32-9);
        u = x8 + x4 | 0;
        x12 ^= u<<13 | u>>>(32-13);
        u = x12 + x8 | 0;
        x0 ^= u<<18 | u>>>(32-18);

        u = x5 + x1 | 0;
        x9 ^= u<<7 | u>>>(32-7);
        u = x9 + x5 | 0;
        x13 ^= u<<9 | u>>>(32-9);
        u = x13 + x9 | 0;
        x1 ^= u<<13 | u>>>(32-13);
        u = x1 + x13 | 0;
        x5 ^= u<<18 | u>>>(32-18);

        u = x10 + x6 | 0;
        x14 ^= u<<7 | u>>>(32-7);
        u = x14 + x10 | 0;
        x2 ^= u<<9 | u>>>(32-9);
        u = x2 + x14 | 0;
        x6 ^= u<<13 | u>>>(32-13);
        u = x6 + x2 | 0;
        x10 ^= u<<18 | u>>>(32-18);

        u = x15 + x11 | 0;
        x3 ^= u<<7 | u>>>(32-7);
        u = x3 + x15 | 0;
        x7 ^= u<<9 | u>>>(32-9);
        u = x7 + x3 | 0;
        x11 ^= u<<13 | u>>>(32-13);
        u = x11 + x7 | 0;
        x15 ^= u<<18 | u>>>(32-18);

        u = x0 + x3 | 0;
        x1 ^= u<<7 | u>>>(32-7);
        u = x1 + x0 | 0;
        x2 ^= u<<9 | u>>>(32-9);
        u = x2 + x1 | 0;
        x3 ^= u<<13 | u>>>(32-13);
        u = x3 + x2 | 0;
        x0 ^= u<<18 | u>>>(32-18);

        u = x5 + x4 | 0;
        x6 ^= u<<7 | u>>>(32-7);
        u = x6 + x5 | 0;
        x7 ^= u<<9 | u>>>(32-9);
        u = x7 + x6 | 0;
        x4 ^= u<<13 | u>>>(32-13);
        u = x4 + x7 | 0;
        x5 ^= u<<18 | u>>>(32-18);

        u = x10 + x9 | 0;
        x11 ^= u<<7 | u>>>(32-7);
        u = x11 + x10 | 0;
        x8 ^= u<<9 | u>>>(32-9);
        u = x8 + x11 | 0;
        x9 ^= u<<13 | u>>>(32-13);
        u = x9 + x8 | 0;
        x10 ^= u<<18 | u>>>(32-18);

        u = x15 + x14 | 0;
        x12 ^= u<<7 | u>>>(32-7);
        u = x12 + x15 | 0;
        x13 ^= u<<9 | u>>>(32-9);
        u = x13 + x12 | 0;
        x14 ^= u<<13 | u>>>(32-13);
        u = x14 + x13 | 0;
        x15 ^= u<<18 | u>>>(32-18);
      }

      o[ 0] = x0 >>>  0 & 0xff;
      o[ 1] = x0 >>>  8 & 0xff;
      o[ 2] = x0 >>> 16 & 0xff;
      o[ 3] = x0 >>> 24 & 0xff;

      o[ 4] = x5 >>>  0 & 0xff;
      o[ 5] = x5 >>>  8 & 0xff;
      o[ 6] = x5 >>> 16 & 0xff;
      o[ 7] = x5 >>> 24 & 0xff;

      o[ 8] = x10 >>>  0 & 0xff;
      o[ 9] = x10 >>>  8 & 0xff;
      o[10] = x10 >>> 16 & 0xff;
      o[11] = x10 >>> 24 & 0xff;

      o[12] = x15 >>>  0 & 0xff;
      o[13] = x15 >>>  8 & 0xff;
      o[14] = x15 >>> 16 & 0xff;
      o[15] = x15 >>> 24 & 0xff;

      o[16] = x6 >>>  0 & 0xff;
      o[17] = x6 >>>  8 & 0xff;
      o[18] = x6 >>> 16 & 0xff;
      o[19] = x6 >>> 24 & 0xff;

      o[20] = x7 >>>  0 & 0xff;
      o[21] = x7 >>>  8 & 0xff;
      o[22] = x7 >>> 16 & 0xff;
      o[23] = x7 >>> 24 & 0xff;

      o[24] = x8 >>>  0 & 0xff;
      o[25] = x8 >>>  8 & 0xff;
      o[26] = x8 >>> 16 & 0xff;
      o[27] = x8 >>> 24 & 0xff;

      o[28] = x9 >>>  0 & 0xff;
      o[29] = x9 >>>  8 & 0xff;
      o[30] = x9 >>> 16 & 0xff;
      o[31] = x9 >>> 24 & 0xff;
    }

    function crypto_core_salsa20(out,inp,k,c) {
      core_salsa20(out,inp,k,c);
    }

    function crypto_core_hsalsa20(out,inp,k,c) {
      core_hsalsa20(out,inp,k,c);
    }

    var sigma = new Uint8Array([101, 120, 112, 97, 110, 100, 32, 51, 50, 45, 98, 121, 116, 101, 32, 107]);
                // "expand 32-byte k"

    function crypto_stream_salsa20_xor(c,cpos,m,mpos,b,n,k) {
      var z = new Uint8Array(16), x = new Uint8Array(64);
      var u, i;
      for (i = 0; i < 16; i++) z[i] = 0;
      for (i = 0; i < 8; i++) z[i] = n[i];
      while (b >= 64) {
        crypto_core_salsa20(x,z,k,sigma);
        for (i = 0; i < 64; i++) c[cpos+i] = m[mpos+i] ^ x[i];
        u = 1;
        for (i = 8; i < 16; i++) {
          u = u + (z[i] & 0xff) | 0;
          z[i] = u & 0xff;
          u >>>= 8;
        }
        b -= 64;
        cpos += 64;
        mpos += 64;
      }
      if (b > 0) {
        crypto_core_salsa20(x,z,k,sigma);
        for (i = 0; i < b; i++) c[cpos+i] = m[mpos+i] ^ x[i];
      }
      return 0;
    }

    function crypto_stream_salsa20(c,cpos,b,n,k) {
      var z = new Uint8Array(16), x = new Uint8Array(64);
      var u, i;
      for (i = 0; i < 16; i++) z[i] = 0;
      for (i = 0; i < 8; i++) z[i] = n[i];
      while (b >= 64) {
        crypto_core_salsa20(x,z,k,sigma);
        for (i = 0; i < 64; i++) c[cpos+i] = x[i];
        u = 1;
        for (i = 8; i < 16; i++) {
          u = u + (z[i] & 0xff) | 0;
          z[i] = u & 0xff;
          u >>>= 8;
        }
        b -= 64;
        cpos += 64;
      }
      if (b > 0) {
        crypto_core_salsa20(x,z,k,sigma);
        for (i = 0; i < b; i++) c[cpos+i] = x[i];
      }
      return 0;
    }

    function crypto_stream(c,cpos,d,n,k) {
      var s = new Uint8Array(32);
      crypto_core_hsalsa20(s,n,k,sigma);
      var sn = new Uint8Array(8);
      for (var i = 0; i < 8; i++) sn[i] = n[i+16];
      return crypto_stream_salsa20(c,cpos,d,sn,s);
    }

    function crypto_stream_xor(c,cpos,m,mpos,d,n,k) {
      var s = new Uint8Array(32);
      crypto_core_hsalsa20(s,n,k,sigma);
      var sn = new Uint8Array(8);
      for (var i = 0; i < 8; i++) sn[i] = n[i+16];
      return crypto_stream_salsa20_xor(c,cpos,m,mpos,d,sn,s);
    }

    /*
    * Port of Andrew Moon's Poly1305-donna-16. Public domain.
    * https://github.com/floodyberry/poly1305-donna
    */

    var poly1305 = function(key) {
      this.buffer = new Uint8Array(16);
      this.r = new Uint16Array(10);
      this.h = new Uint16Array(10);
      this.pad = new Uint16Array(8);
      this.leftover = 0;
      this.fin = 0;

      var t0, t1, t2, t3, t4, t5, t6, t7;

      t0 = key[ 0] & 0xff | (key[ 1] & 0xff) << 8; this.r[0] = ( t0                     ) & 0x1fff;
      t1 = key[ 2] & 0xff | (key[ 3] & 0xff) << 8; this.r[1] = ((t0 >>> 13) | (t1 <<  3)) & 0x1fff;
      t2 = key[ 4] & 0xff | (key[ 5] & 0xff) << 8; this.r[2] = ((t1 >>> 10) | (t2 <<  6)) & 0x1f03;
      t3 = key[ 6] & 0xff | (key[ 7] & 0xff) << 8; this.r[3] = ((t2 >>>  7) | (t3 <<  9)) & 0x1fff;
      t4 = key[ 8] & 0xff | (key[ 9] & 0xff) << 8; this.r[4] = ((t3 >>>  4) | (t4 << 12)) & 0x00ff;
      this.r[5] = ((t4 >>>  1)) & 0x1ffe;
      t5 = key[10] & 0xff | (key[11] & 0xff) << 8; this.r[6] = ((t4 >>> 14) | (t5 <<  2)) & 0x1fff;
      t6 = key[12] & 0xff | (key[13] & 0xff) << 8; this.r[7] = ((t5 >>> 11) | (t6 <<  5)) & 0x1f81;
      t7 = key[14] & 0xff | (key[15] & 0xff) << 8; this.r[8] = ((t6 >>>  8) | (t7 <<  8)) & 0x1fff;
      this.r[9] = ((t7 >>>  5)) & 0x007f;

      this.pad[0] = key[16] & 0xff | (key[17] & 0xff) << 8;
      this.pad[1] = key[18] & 0xff | (key[19] & 0xff) << 8;
      this.pad[2] = key[20] & 0xff | (key[21] & 0xff) << 8;
      this.pad[3] = key[22] & 0xff | (key[23] & 0xff) << 8;
      this.pad[4] = key[24] & 0xff | (key[25] & 0xff) << 8;
      this.pad[5] = key[26] & 0xff | (key[27] & 0xff) << 8;
      this.pad[6] = key[28] & 0xff | (key[29] & 0xff) << 8;
      this.pad[7] = key[30] & 0xff | (key[31] & 0xff) << 8;
    };

    poly1305.prototype.blocks = function(m, mpos, bytes) {
      var hibit = this.fin ? 0 : (1 << 11);
      var t0, t1, t2, t3, t4, t5, t6, t7, c;
      var d0, d1, d2, d3, d4, d5, d6, d7, d8, d9;

      var h0 = this.h[0],
          h1 = this.h[1],
          h2 = this.h[2],
          h3 = this.h[3],
          h4 = this.h[4],
          h5 = this.h[5],
          h6 = this.h[6],
          h7 = this.h[7],
          h8 = this.h[8],
          h9 = this.h[9];

      var r0 = this.r[0],
          r1 = this.r[1],
          r2 = this.r[2],
          r3 = this.r[3],
          r4 = this.r[4],
          r5 = this.r[5],
          r6 = this.r[6],
          r7 = this.r[7],
          r8 = this.r[8],
          r9 = this.r[9];

      while (bytes >= 16) {
        t0 = m[mpos+ 0] & 0xff | (m[mpos+ 1] & 0xff) << 8; h0 += ( t0                     ) & 0x1fff;
        t1 = m[mpos+ 2] & 0xff | (m[mpos+ 3] & 0xff) << 8; h1 += ((t0 >>> 13) | (t1 <<  3)) & 0x1fff;
        t2 = m[mpos+ 4] & 0xff | (m[mpos+ 5] & 0xff) << 8; h2 += ((t1 >>> 10) | (t2 <<  6)) & 0x1fff;
        t3 = m[mpos+ 6] & 0xff | (m[mpos+ 7] & 0xff) << 8; h3 += ((t2 >>>  7) | (t3 <<  9)) & 0x1fff;
        t4 = m[mpos+ 8] & 0xff | (m[mpos+ 9] & 0xff) << 8; h4 += ((t3 >>>  4) | (t4 << 12)) & 0x1fff;
        h5 += ((t4 >>>  1)) & 0x1fff;
        t5 = m[mpos+10] & 0xff | (m[mpos+11] & 0xff) << 8; h6 += ((t4 >>> 14) | (t5 <<  2)) & 0x1fff;
        t6 = m[mpos+12] & 0xff | (m[mpos+13] & 0xff) << 8; h7 += ((t5 >>> 11) | (t6 <<  5)) & 0x1fff;
        t7 = m[mpos+14] & 0xff | (m[mpos+15] & 0xff) << 8; h8 += ((t6 >>>  8) | (t7 <<  8)) & 0x1fff;
        h9 += ((t7 >>> 5)) | hibit;

        c = 0;

        d0 = c;
        d0 += h0 * r0;
        d0 += h1 * (5 * r9);
        d0 += h2 * (5 * r8);
        d0 += h3 * (5 * r7);
        d0 += h4 * (5 * r6);
        c = (d0 >>> 13); d0 &= 0x1fff;
        d0 += h5 * (5 * r5);
        d0 += h6 * (5 * r4);
        d0 += h7 * (5 * r3);
        d0 += h8 * (5 * r2);
        d0 += h9 * (5 * r1);
        c += (d0 >>> 13); d0 &= 0x1fff;

        d1 = c;
        d1 += h0 * r1;
        d1 += h1 * r0;
        d1 += h2 * (5 * r9);
        d1 += h3 * (5 * r8);
        d1 += h4 * (5 * r7);
        c = (d1 >>> 13); d1 &= 0x1fff;
        d1 += h5 * (5 * r6);
        d1 += h6 * (5 * r5);
        d1 += h7 * (5 * r4);
        d1 += h8 * (5 * r3);
        d1 += h9 * (5 * r2);
        c += (d1 >>> 13); d1 &= 0x1fff;

        d2 = c;
        d2 += h0 * r2;
        d2 += h1 * r1;
        d2 += h2 * r0;
        d2 += h3 * (5 * r9);
        d2 += h4 * (5 * r8);
        c = (d2 >>> 13); d2 &= 0x1fff;
        d2 += h5 * (5 * r7);
        d2 += h6 * (5 * r6);
        d2 += h7 * (5 * r5);
        d2 += h8 * (5 * r4);
        d2 += h9 * (5 * r3);
        c += (d2 >>> 13); d2 &= 0x1fff;

        d3 = c;
        d3 += h0 * r3;
        d3 += h1 * r2;
        d3 += h2 * r1;
        d3 += h3 * r0;
        d3 += h4 * (5 * r9);
        c = (d3 >>> 13); d3 &= 0x1fff;
        d3 += h5 * (5 * r8);
        d3 += h6 * (5 * r7);
        d3 += h7 * (5 * r6);
        d3 += h8 * (5 * r5);
        d3 += h9 * (5 * r4);
        c += (d3 >>> 13); d3 &= 0x1fff;

        d4 = c;
        d4 += h0 * r4;
        d4 += h1 * r3;
        d4 += h2 * r2;
        d4 += h3 * r1;
        d4 += h4 * r0;
        c = (d4 >>> 13); d4 &= 0x1fff;
        d4 += h5 * (5 * r9);
        d4 += h6 * (5 * r8);
        d4 += h7 * (5 * r7);
        d4 += h8 * (5 * r6);
        d4 += h9 * (5 * r5);
        c += (d4 >>> 13); d4 &= 0x1fff;

        d5 = c;
        d5 += h0 * r5;
        d5 += h1 * r4;
        d5 += h2 * r3;
        d5 += h3 * r2;
        d5 += h4 * r1;
        c = (d5 >>> 13); d5 &= 0x1fff;
        d5 += h5 * r0;
        d5 += h6 * (5 * r9);
        d5 += h7 * (5 * r8);
        d5 += h8 * (5 * r7);
        d5 += h9 * (5 * r6);
        c += (d5 >>> 13); d5 &= 0x1fff;

        d6 = c;
        d6 += h0 * r6;
        d6 += h1 * r5;
        d6 += h2 * r4;
        d6 += h3 * r3;
        d6 += h4 * r2;
        c = (d6 >>> 13); d6 &= 0x1fff;
        d6 += h5 * r1;
        d6 += h6 * r0;
        d6 += h7 * (5 * r9);
        d6 += h8 * (5 * r8);
        d6 += h9 * (5 * r7);
        c += (d6 >>> 13); d6 &= 0x1fff;

        d7 = c;
        d7 += h0 * r7;
        d7 += h1 * r6;
        d7 += h2 * r5;
        d7 += h3 * r4;
        d7 += h4 * r3;
        c = (d7 >>> 13); d7 &= 0x1fff;
        d7 += h5 * r2;
        d7 += h6 * r1;
        d7 += h7 * r0;
        d7 += h8 * (5 * r9);
        d7 += h9 * (5 * r8);
        c += (d7 >>> 13); d7 &= 0x1fff;

        d8 = c;
        d8 += h0 * r8;
        d8 += h1 * r7;
        d8 += h2 * r6;
        d8 += h3 * r5;
        d8 += h4 * r4;
        c = (d8 >>> 13); d8 &= 0x1fff;
        d8 += h5 * r3;
        d8 += h6 * r2;
        d8 += h7 * r1;
        d8 += h8 * r0;
        d8 += h9 * (5 * r9);
        c += (d8 >>> 13); d8 &= 0x1fff;

        d9 = c;
        d9 += h0 * r9;
        d9 += h1 * r8;
        d9 += h2 * r7;
        d9 += h3 * r6;
        d9 += h4 * r5;
        c = (d9 >>> 13); d9 &= 0x1fff;
        d9 += h5 * r4;
        d9 += h6 * r3;
        d9 += h7 * r2;
        d9 += h8 * r1;
        d9 += h9 * r0;
        c += (d9 >>> 13); d9 &= 0x1fff;

        c = (((c << 2) + c)) | 0;
        c = (c + d0) | 0;
        d0 = c & 0x1fff;
        c = (c >>> 13);
        d1 += c;

        h0 = d0;
        h1 = d1;
        h2 = d2;
        h3 = d3;
        h4 = d4;
        h5 = d5;
        h6 = d6;
        h7 = d7;
        h8 = d8;
        h9 = d9;

        mpos += 16;
        bytes -= 16;
      }
      this.h[0] = h0;
      this.h[1] = h1;
      this.h[2] = h2;
      this.h[3] = h3;
      this.h[4] = h4;
      this.h[5] = h5;
      this.h[6] = h6;
      this.h[7] = h7;
      this.h[8] = h8;
      this.h[9] = h9;
    };

    poly1305.prototype.finish = function(mac, macpos) {
      var g = new Uint16Array(10);
      var c, mask, f, i;

      if (this.leftover) {
        i = this.leftover;
        this.buffer[i++] = 1;
        for (; i < 16; i++) this.buffer[i] = 0;
        this.fin = 1;
        this.blocks(this.buffer, 0, 16);
      }

      c = this.h[1] >>> 13;
      this.h[1] &= 0x1fff;
      for (i = 2; i < 10; i++) {
        this.h[i] += c;
        c = this.h[i] >>> 13;
        this.h[i] &= 0x1fff;
      }
      this.h[0] += (c * 5);
      c = this.h[0] >>> 13;
      this.h[0] &= 0x1fff;
      this.h[1] += c;
      c = this.h[1] >>> 13;
      this.h[1] &= 0x1fff;
      this.h[2] += c;

      g[0] = this.h[0] + 5;
      c = g[0] >>> 13;
      g[0] &= 0x1fff;
      for (i = 1; i < 10; i++) {
        g[i] = this.h[i] + c;
        c = g[i] >>> 13;
        g[i] &= 0x1fff;
      }
      g[9] -= (1 << 13);

      mask = (c ^ 1) - 1;
      for (i = 0; i < 10; i++) g[i] &= mask;
      mask = ~mask;
      for (i = 0; i < 10; i++) this.h[i] = (this.h[i] & mask) | g[i];

      this.h[0] = ((this.h[0]       ) | (this.h[1] << 13)                    ) & 0xffff;
      this.h[1] = ((this.h[1] >>>  3) | (this.h[2] << 10)                    ) & 0xffff;
      this.h[2] = ((this.h[2] >>>  6) | (this.h[3] <<  7)                    ) & 0xffff;
      this.h[3] = ((this.h[3] >>>  9) | (this.h[4] <<  4)                    ) & 0xffff;
      this.h[4] = ((this.h[4] >>> 12) | (this.h[5] <<  1) | (this.h[6] << 14)) & 0xffff;
      this.h[5] = ((this.h[6] >>>  2) | (this.h[7] << 11)                    ) & 0xffff;
      this.h[6] = ((this.h[7] >>>  5) | (this.h[8] <<  8)                    ) & 0xffff;
      this.h[7] = ((this.h[8] >>>  8) | (this.h[9] <<  5)                    ) & 0xffff;

      f = this.h[0] + this.pad[0];
      this.h[0] = f & 0xffff;
      for (i = 1; i < 8; i++) {
        f = (((this.h[i] + this.pad[i]) | 0) + (f >>> 16)) | 0;
        this.h[i] = f & 0xffff;
      }

      mac[macpos+ 0] = (this.h[0] >>> 0) & 0xff;
      mac[macpos+ 1] = (this.h[0] >>> 8) & 0xff;
      mac[macpos+ 2] = (this.h[1] >>> 0) & 0xff;
      mac[macpos+ 3] = (this.h[1] >>> 8) & 0xff;
      mac[macpos+ 4] = (this.h[2] >>> 0) & 0xff;
      mac[macpos+ 5] = (this.h[2] >>> 8) & 0xff;
      mac[macpos+ 6] = (this.h[3] >>> 0) & 0xff;
      mac[macpos+ 7] = (this.h[3] >>> 8) & 0xff;
      mac[macpos+ 8] = (this.h[4] >>> 0) & 0xff;
      mac[macpos+ 9] = (this.h[4] >>> 8) & 0xff;
      mac[macpos+10] = (this.h[5] >>> 0) & 0xff;
      mac[macpos+11] = (this.h[5] >>> 8) & 0xff;
      mac[macpos+12] = (this.h[6] >>> 0) & 0xff;
      mac[macpos+13] = (this.h[6] >>> 8) & 0xff;
      mac[macpos+14] = (this.h[7] >>> 0) & 0xff;
      mac[macpos+15] = (this.h[7] >>> 8) & 0xff;
    };

    poly1305.prototype.update = function(m, mpos, bytes) {
      var i, want;

      if (this.leftover) {
        want = (16 - this.leftover);
        if (want > bytes)
          want = bytes;
        for (i = 0; i < want; i++)
          this.buffer[this.leftover + i] = m[mpos+i];
        bytes -= want;
        mpos += want;
        this.leftover += want;
        if (this.leftover < 16)
          return;
        this.blocks(this.buffer, 0, 16);
        this.leftover = 0;
      }

      if (bytes >= 16) {
        want = bytes - (bytes % 16);
        this.blocks(m, mpos, want);
        mpos += want;
        bytes -= want;
      }

      if (bytes) {
        for (i = 0; i < bytes; i++)
          this.buffer[this.leftover + i] = m[mpos+i];
        this.leftover += bytes;
      }
    };

    function crypto_onetimeauth(out, outpos, m, mpos, n, k) {
      var s = new poly1305(k);
      s.update(m, mpos, n);
      s.finish(out, outpos);
      return 0;
    }

    function crypto_onetimeauth_verify(h, hpos, m, mpos, n, k) {
      var x = new Uint8Array(16);
      crypto_onetimeauth(x,0,m,mpos,n,k);
      return crypto_verify_16(h,hpos,x,0);
    }

    function crypto_secretbox(c,m,d,n,k) {
      var i;
      if (d < 32) return -1;
      crypto_stream_xor(c,0,m,0,d,n,k);
      crypto_onetimeauth(c, 16, c, 32, d - 32, c);
      for (i = 0; i < 16; i++) c[i] = 0;
      return 0;
    }

    function crypto_secretbox_open(m,c,d,n,k) {
      var i;
      var x = new Uint8Array(32);
      if (d < 32) return -1;
      crypto_stream(x,0,32,n,k);
      if (crypto_onetimeauth_verify(c, 16,c, 32,d - 32,x) !== 0) return -1;
      crypto_stream_xor(m,0,c,0,d,n,k);
      for (i = 0; i < 32; i++) m[i] = 0;
      return 0;
    }

    function set25519(r, a) {
      var i;
      for (i = 0; i < 16; i++) r[i] = a[i]|0;
    }

    function car25519(o) {
      var i, v, c = 1;
      for (i = 0; i < 16; i++) {
        v = o[i] + c + 65535;
        c = Math.floor(v / 65536);
        o[i] = v - c * 65536;
      }
      o[0] += c-1 + 37 * (c-1);
    }

    function sel25519(p, q, b) {
      var t, c = ~(b-1);
      for (var i = 0; i < 16; i++) {
        t = c & (p[i] ^ q[i]);
        p[i] ^= t;
        q[i] ^= t;
      }
    }

    function pack25519(o, n) {
      var i, j, b;
      var m = gf(), t = gf();
      for (i = 0; i < 16; i++) t[i] = n[i];
      car25519(t);
      car25519(t);
      car25519(t);
      for (j = 0; j < 2; j++) {
        m[0] = t[0] - 0xffed;
        for (i = 1; i < 15; i++) {
          m[i] = t[i] - 0xffff - ((m[i-1]>>16) & 1);
          m[i-1] &= 0xffff;
        }
        m[15] = t[15] - 0x7fff - ((m[14]>>16) & 1);
        b = (m[15]>>16) & 1;
        m[14] &= 0xffff;
        sel25519(t, m, 1-b);
      }
      for (i = 0; i < 16; i++) {
        o[2*i] = t[i] & 0xff;
        o[2*i+1] = t[i]>>8;
      }
    }

    function neq25519(a, b) {
      var c = new Uint8Array(32), d = new Uint8Array(32);
      pack25519(c, a);
      pack25519(d, b);
      return crypto_verify_32(c, 0, d, 0);
    }

    function par25519(a) {
      var d = new Uint8Array(32);
      pack25519(d, a);
      return d[0] & 1;
    }

    function unpack25519(o, n) {
      var i;
      for (i = 0; i < 16; i++) o[i] = n[2*i] + (n[2*i+1] << 8);
      o[15] &= 0x7fff;
    }

    function A(o, a, b) {
      for (var i = 0; i < 16; i++) o[i] = a[i] + b[i];
    }

    function Z(o, a, b) {
      for (var i = 0; i < 16; i++) o[i] = a[i] - b[i];
    }

    function M(o, a, b) {
      var v, c,
         t0 = 0,  t1 = 0,  t2 = 0,  t3 = 0,  t4 = 0,  t5 = 0,  t6 = 0,  t7 = 0,
         t8 = 0,  t9 = 0, t10 = 0, t11 = 0, t12 = 0, t13 = 0, t14 = 0, t15 = 0,
        t16 = 0, t17 = 0, t18 = 0, t19 = 0, t20 = 0, t21 = 0, t22 = 0, t23 = 0,
        t24 = 0, t25 = 0, t26 = 0, t27 = 0, t28 = 0, t29 = 0, t30 = 0,
        b0 = b[0],
        b1 = b[1],
        b2 = b[2],
        b3 = b[3],
        b4 = b[4],
        b5 = b[5],
        b6 = b[6],
        b7 = b[7],
        b8 = b[8],
        b9 = b[9],
        b10 = b[10],
        b11 = b[11],
        b12 = b[12],
        b13 = b[13],
        b14 = b[14],
        b15 = b[15];

      v = a[0];
      t0 += v * b0;
      t1 += v * b1;
      t2 += v * b2;
      t3 += v * b3;
      t4 += v * b4;
      t5 += v * b5;
      t6 += v * b6;
      t7 += v * b7;
      t8 += v * b8;
      t9 += v * b9;
      t10 += v * b10;
      t11 += v * b11;
      t12 += v * b12;
      t13 += v * b13;
      t14 += v * b14;
      t15 += v * b15;
      v = a[1];
      t1 += v * b0;
      t2 += v * b1;
      t3 += v * b2;
      t4 += v * b3;
      t5 += v * b4;
      t6 += v * b5;
      t7 += v * b6;
      t8 += v * b7;
      t9 += v * b8;
      t10 += v * b9;
      t11 += v * b10;
      t12 += v * b11;
      t13 += v * b12;
      t14 += v * b13;
      t15 += v * b14;
      t16 += v * b15;
      v = a[2];
      t2 += v * b0;
      t3 += v * b1;
      t4 += v * b2;
      t5 += v * b3;
      t6 += v * b4;
      t7 += v * b5;
      t8 += v * b6;
      t9 += v * b7;
      t10 += v * b8;
      t11 += v * b9;
      t12 += v * b10;
      t13 += v * b11;
      t14 += v * b12;
      t15 += v * b13;
      t16 += v * b14;
      t17 += v * b15;
      v = a[3];
      t3 += v * b0;
      t4 += v * b1;
      t5 += v * b2;
      t6 += v * b3;
      t7 += v * b4;
      t8 += v * b5;
      t9 += v * b6;
      t10 += v * b7;
      t11 += v * b8;
      t12 += v * b9;
      t13 += v * b10;
      t14 += v * b11;
      t15 += v * b12;
      t16 += v * b13;
      t17 += v * b14;
      t18 += v * b15;
      v = a[4];
      t4 += v * b0;
      t5 += v * b1;
      t6 += v * b2;
      t7 += v * b3;
      t8 += v * b4;
      t9 += v * b5;
      t10 += v * b6;
      t11 += v * b7;
      t12 += v * b8;
      t13 += v * b9;
      t14 += v * b10;
      t15 += v * b11;
      t16 += v * b12;
      t17 += v * b13;
      t18 += v * b14;
      t19 += v * b15;
      v = a[5];
      t5 += v * b0;
      t6 += v * b1;
      t7 += v * b2;
      t8 += v * b3;
      t9 += v * b4;
      t10 += v * b5;
      t11 += v * b6;
      t12 += v * b7;
      t13 += v * b8;
      t14 += v * b9;
      t15 += v * b10;
      t16 += v * b11;
      t17 += v * b12;
      t18 += v * b13;
      t19 += v * b14;
      t20 += v * b15;
      v = a[6];
      t6 += v * b0;
      t7 += v * b1;
      t8 += v * b2;
      t9 += v * b3;
      t10 += v * b4;
      t11 += v * b5;
      t12 += v * b6;
      t13 += v * b7;
      t14 += v * b8;
      t15 += v * b9;
      t16 += v * b10;
      t17 += v * b11;
      t18 += v * b12;
      t19 += v * b13;
      t20 += v * b14;
      t21 += v * b15;
      v = a[7];
      t7 += v * b0;
      t8 += v * b1;
      t9 += v * b2;
      t10 += v * b3;
      t11 += v * b4;
      t12 += v * b5;
      t13 += v * b6;
      t14 += v * b7;
      t15 += v * b8;
      t16 += v * b9;
      t17 += v * b10;
      t18 += v * b11;
      t19 += v * b12;
      t20 += v * b13;
      t21 += v * b14;
      t22 += v * b15;
      v = a[8];
      t8 += v * b0;
      t9 += v * b1;
      t10 += v * b2;
      t11 += v * b3;
      t12 += v * b4;
      t13 += v * b5;
      t14 += v * b6;
      t15 += v * b7;
      t16 += v * b8;
      t17 += v * b9;
      t18 += v * b10;
      t19 += v * b11;
      t20 += v * b12;
      t21 += v * b13;
      t22 += v * b14;
      t23 += v * b15;
      v = a[9];
      t9 += v * b0;
      t10 += v * b1;
      t11 += v * b2;
      t12 += v * b3;
      t13 += v * b4;
      t14 += v * b5;
      t15 += v * b6;
      t16 += v * b7;
      t17 += v * b8;
      t18 += v * b9;
      t19 += v * b10;
      t20 += v * b11;
      t21 += v * b12;
      t22 += v * b13;
      t23 += v * b14;
      t24 += v * b15;
      v = a[10];
      t10 += v * b0;
      t11 += v * b1;
      t12 += v * b2;
      t13 += v * b3;
      t14 += v * b4;
      t15 += v * b5;
      t16 += v * b6;
      t17 += v * b7;
      t18 += v * b8;
      t19 += v * b9;
      t20 += v * b10;
      t21 += v * b11;
      t22 += v * b12;
      t23 += v * b13;
      t24 += v * b14;
      t25 += v * b15;
      v = a[11];
      t11 += v * b0;
      t12 += v * b1;
      t13 += v * b2;
      t14 += v * b3;
      t15 += v * b4;
      t16 += v * b5;
      t17 += v * b6;
      t18 += v * b7;
      t19 += v * b8;
      t20 += v * b9;
      t21 += v * b10;
      t22 += v * b11;
      t23 += v * b12;
      t24 += v * b13;
      t25 += v * b14;
      t26 += v * b15;
      v = a[12];
      t12 += v * b0;
      t13 += v * b1;
      t14 += v * b2;
      t15 += v * b3;
      t16 += v * b4;
      t17 += v * b5;
      t18 += v * b6;
      t19 += v * b7;
      t20 += v * b8;
      t21 += v * b9;
      t22 += v * b10;
      t23 += v * b11;
      t24 += v * b12;
      t25 += v * b13;
      t26 += v * b14;
      t27 += v * b15;
      v = a[13];
      t13 += v * b0;
      t14 += v * b1;
      t15 += v * b2;
      t16 += v * b3;
      t17 += v * b4;
      t18 += v * b5;
      t19 += v * b6;
      t20 += v * b7;
      t21 += v * b8;
      t22 += v * b9;
      t23 += v * b10;
      t24 += v * b11;
      t25 += v * b12;
      t26 += v * b13;
      t27 += v * b14;
      t28 += v * b15;
      v = a[14];
      t14 += v * b0;
      t15 += v * b1;
      t16 += v * b2;
      t17 += v * b3;
      t18 += v * b4;
      t19 += v * b5;
      t20 += v * b6;
      t21 += v * b7;
      t22 += v * b8;
      t23 += v * b9;
      t24 += v * b10;
      t25 += v * b11;
      t26 += v * b12;
      t27 += v * b13;
      t28 += v * b14;
      t29 += v * b15;
      v = a[15];
      t15 += v * b0;
      t16 += v * b1;
      t17 += v * b2;
      t18 += v * b3;
      t19 += v * b4;
      t20 += v * b5;
      t21 += v * b6;
      t22 += v * b7;
      t23 += v * b8;
      t24 += v * b9;
      t25 += v * b10;
      t26 += v * b11;
      t27 += v * b12;
      t28 += v * b13;
      t29 += v * b14;
      t30 += v * b15;

      t0  += 38 * t16;
      t1  += 38 * t17;
      t2  += 38 * t18;
      t3  += 38 * t19;
      t4  += 38 * t20;
      t5  += 38 * t21;
      t6  += 38 * t22;
      t7  += 38 * t23;
      t8  += 38 * t24;
      t9  += 38 * t25;
      t10 += 38 * t26;
      t11 += 38 * t27;
      t12 += 38 * t28;
      t13 += 38 * t29;
      t14 += 38 * t30;
      // t15 left as is

      // first car
      c = 1;
      v =  t0 + c + 65535; c = Math.floor(v / 65536);  t0 = v - c * 65536;
      v =  t1 + c + 65535; c = Math.floor(v / 65536);  t1 = v - c * 65536;
      v =  t2 + c + 65535; c = Math.floor(v / 65536);  t2 = v - c * 65536;
      v =  t3 + c + 65535; c = Math.floor(v / 65536);  t3 = v - c * 65536;
      v =  t4 + c + 65535; c = Math.floor(v / 65536);  t4 = v - c * 65536;
      v =  t5 + c + 65535; c = Math.floor(v / 65536);  t5 = v - c * 65536;
      v =  t6 + c + 65535; c = Math.floor(v / 65536);  t6 = v - c * 65536;
      v =  t7 + c + 65535; c = Math.floor(v / 65536);  t7 = v - c * 65536;
      v =  t8 + c + 65535; c = Math.floor(v / 65536);  t8 = v - c * 65536;
      v =  t9 + c + 65535; c = Math.floor(v / 65536);  t9 = v - c * 65536;
      v = t10 + c + 65535; c = Math.floor(v / 65536); t10 = v - c * 65536;
      v = t11 + c + 65535; c = Math.floor(v / 65536); t11 = v - c * 65536;
      v = t12 + c + 65535; c = Math.floor(v / 65536); t12 = v - c * 65536;
      v = t13 + c + 65535; c = Math.floor(v / 65536); t13 = v - c * 65536;
      v = t14 + c + 65535; c = Math.floor(v / 65536); t14 = v - c * 65536;
      v = t15 + c + 65535; c = Math.floor(v / 65536); t15 = v - c * 65536;
      t0 += c-1 + 37 * (c-1);

      // second car
      c = 1;
      v =  t0 + c + 65535; c = Math.floor(v / 65536);  t0 = v - c * 65536;
      v =  t1 + c + 65535; c = Math.floor(v / 65536);  t1 = v - c * 65536;
      v =  t2 + c + 65535; c = Math.floor(v / 65536);  t2 = v - c * 65536;
      v =  t3 + c + 65535; c = Math.floor(v / 65536);  t3 = v - c * 65536;
      v =  t4 + c + 65535; c = Math.floor(v / 65536);  t4 = v - c * 65536;
      v =  t5 + c + 65535; c = Math.floor(v / 65536);  t5 = v - c * 65536;
      v =  t6 + c + 65535; c = Math.floor(v / 65536);  t6 = v - c * 65536;
      v =  t7 + c + 65535; c = Math.floor(v / 65536);  t7 = v - c * 65536;
      v =  t8 + c + 65535; c = Math.floor(v / 65536);  t8 = v - c * 65536;
      v =  t9 + c + 65535; c = Math.floor(v / 65536);  t9 = v - c * 65536;
      v = t10 + c + 65535; c = Math.floor(v / 65536); t10 = v - c * 65536;
      v = t11 + c + 65535; c = Math.floor(v / 65536); t11 = v - c * 65536;
      v = t12 + c + 65535; c = Math.floor(v / 65536); t12 = v - c * 65536;
      v = t13 + c + 65535; c = Math.floor(v / 65536); t13 = v - c * 65536;
      v = t14 + c + 65535; c = Math.floor(v / 65536); t14 = v - c * 65536;
      v = t15 + c + 65535; c = Math.floor(v / 65536); t15 = v - c * 65536;
      t0 += c-1 + 37 * (c-1);

      o[ 0] = t0;
      o[ 1] = t1;
      o[ 2] = t2;
      o[ 3] = t3;
      o[ 4] = t4;
      o[ 5] = t5;
      o[ 6] = t6;
      o[ 7] = t7;
      o[ 8] = t8;
      o[ 9] = t9;
      o[10] = t10;
      o[11] = t11;
      o[12] = t12;
      o[13] = t13;
      o[14] = t14;
      o[15] = t15;
    }

    function S(o, a) {
      M(o, a, a);
    }

    function inv25519(o, i) {
      var c = gf();
      var a;
      for (a = 0; a < 16; a++) c[a] = i[a];
      for (a = 253; a >= 0; a--) {
        S(c, c);
        if(a !== 2 && a !== 4) M(c, c, i);
      }
      for (a = 0; a < 16; a++) o[a] = c[a];
    }

    function pow2523(o, i) {
      var c = gf();
      var a;
      for (a = 0; a < 16; a++) c[a] = i[a];
      for (a = 250; a >= 0; a--) {
          S(c, c);
          if(a !== 1) M(c, c, i);
      }
      for (a = 0; a < 16; a++) o[a] = c[a];
    }

    function crypto_scalarmult(q, n, p) {
      var z = new Uint8Array(32);
      var x = new Float64Array(80), r, i;
      var a = gf(), b = gf(), c = gf(),
          d = gf(), e = gf(), f = gf();
      for (i = 0; i < 31; i++) z[i] = n[i];
      z[31]=(n[31]&127)|64;
      z[0]&=248;
      unpack25519(x,p);
      for (i = 0; i < 16; i++) {
        b[i]=x[i];
        d[i]=a[i]=c[i]=0;
      }
      a[0]=d[0]=1;
      for (i=254; i>=0; --i) {
        r=(z[i>>>3]>>>(i&7))&1;
        sel25519(a,b,r);
        sel25519(c,d,r);
        A(e,a,c);
        Z(a,a,c);
        A(c,b,d);
        Z(b,b,d);
        S(d,e);
        S(f,a);
        M(a,c,a);
        M(c,b,e);
        A(e,a,c);
        Z(a,a,c);
        S(b,a);
        Z(c,d,f);
        M(a,c,_121665);
        A(a,a,d);
        M(c,c,a);
        M(a,d,f);
        M(d,b,x);
        S(b,e);
        sel25519(a,b,r);
        sel25519(c,d,r);
      }
      for (i = 0; i < 16; i++) {
        x[i+16]=a[i];
        x[i+32]=c[i];
        x[i+48]=b[i];
        x[i+64]=d[i];
      }
      var x32 = x.subarray(32);
      var x16 = x.subarray(16);
      inv25519(x32,x32);
      M(x16,x16,x32);
      pack25519(q,x16);
      return 0;
    }

    function crypto_scalarmult_base(q, n) {
      return crypto_scalarmult(q, n, _9);
    }

    function crypto_box_keypair(y, x) {
      randombytes(x, 32);
      return crypto_scalarmult_base(y, x);
    }

    function crypto_box_beforenm(k, y, x) {
      var s = new Uint8Array(32);
      crypto_scalarmult(s, x, y);
      return crypto_core_hsalsa20(k, _0, s, sigma);
    }

    var crypto_box_afternm = crypto_secretbox;
    var crypto_box_open_afternm = crypto_secretbox_open;

    function crypto_box(c, m, d, n, y, x) {
      var k = new Uint8Array(32);
      crypto_box_beforenm(k, y, x);
      return crypto_box_afternm(c, m, d, n, k);
    }

    function crypto_box_open(m, c, d, n, y, x) {
      var k = new Uint8Array(32);
      crypto_box_beforenm(k, y, x);
      return crypto_box_open_afternm(m, c, d, n, k);
    }

    var K = [
      0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd,
      0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
      0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019,
      0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
      0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe,
      0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
      0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1,
      0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
      0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3,
      0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
      0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483,
      0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
      0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210,
      0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
      0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725,
      0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
      0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926,
      0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
      0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8,
      0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
      0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001,
      0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
      0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910,
      0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
      0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53,
      0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
      0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb,
      0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
      0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60,
      0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
      0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9,
      0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
      0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207,
      0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
      0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6,
      0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
      0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493,
      0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
      0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a,
      0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817
    ];

    function crypto_hashblocks_hl(hh, hl, m, n) {
      var wh = new Int32Array(16), wl = new Int32Array(16),
          bh0, bh1, bh2, bh3, bh4, bh5, bh6, bh7,
          bl0, bl1, bl2, bl3, bl4, bl5, bl6, bl7,
          th, tl, i, j, h, l, a, b, c, d;

      var ah0 = hh[0],
          ah1 = hh[1],
          ah2 = hh[2],
          ah3 = hh[3],
          ah4 = hh[4],
          ah5 = hh[5],
          ah6 = hh[6],
          ah7 = hh[7],

          al0 = hl[0],
          al1 = hl[1],
          al2 = hl[2],
          al3 = hl[3],
          al4 = hl[4],
          al5 = hl[5],
          al6 = hl[6],
          al7 = hl[7];

      var pos = 0;
      while (n >= 128) {
        for (i = 0; i < 16; i++) {
          j = 8 * i + pos;
          wh[i] = (m[j+0] << 24) | (m[j+1] << 16) | (m[j+2] << 8) | m[j+3];
          wl[i] = (m[j+4] << 24) | (m[j+5] << 16) | (m[j+6] << 8) | m[j+7];
        }
        for (i = 0; i < 80; i++) {
          bh0 = ah0;
          bh1 = ah1;
          bh2 = ah2;
          bh3 = ah3;
          bh4 = ah4;
          bh5 = ah5;
          bh6 = ah6;
          bh7 = ah7;

          bl0 = al0;
          bl1 = al1;
          bl2 = al2;
          bl3 = al3;
          bl4 = al4;
          bl5 = al5;
          bl6 = al6;
          bl7 = al7;

          // add
          h = ah7;
          l = al7;

          a = l & 0xffff; b = l >>> 16;
          c = h & 0xffff; d = h >>> 16;

          // Sigma1
          h = ((ah4 >>> 14) | (al4 << (32-14))) ^ ((ah4 >>> 18) | (al4 << (32-18))) ^ ((al4 >>> (41-32)) | (ah4 << (32-(41-32))));
          l = ((al4 >>> 14) | (ah4 << (32-14))) ^ ((al4 >>> 18) | (ah4 << (32-18))) ^ ((ah4 >>> (41-32)) | (al4 << (32-(41-32))));

          a += l & 0xffff; b += l >>> 16;
          c += h & 0xffff; d += h >>> 16;

          // Ch
          h = (ah4 & ah5) ^ (~ah4 & ah6);
          l = (al4 & al5) ^ (~al4 & al6);

          a += l & 0xffff; b += l >>> 16;
          c += h & 0xffff; d += h >>> 16;

          // K
          h = K[i*2];
          l = K[i*2+1];

          a += l & 0xffff; b += l >>> 16;
          c += h & 0xffff; d += h >>> 16;

          // w
          h = wh[i%16];
          l = wl[i%16];

          a += l & 0xffff; b += l >>> 16;
          c += h & 0xffff; d += h >>> 16;

          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;

          th = c & 0xffff | d << 16;
          tl = a & 0xffff | b << 16;

          // add
          h = th;
          l = tl;

          a = l & 0xffff; b = l >>> 16;
          c = h & 0xffff; d = h >>> 16;

          // Sigma0
          h = ((ah0 >>> 28) | (al0 << (32-28))) ^ ((al0 >>> (34-32)) | (ah0 << (32-(34-32)))) ^ ((al0 >>> (39-32)) | (ah0 << (32-(39-32))));
          l = ((al0 >>> 28) | (ah0 << (32-28))) ^ ((ah0 >>> (34-32)) | (al0 << (32-(34-32)))) ^ ((ah0 >>> (39-32)) | (al0 << (32-(39-32))));

          a += l & 0xffff; b += l >>> 16;
          c += h & 0xffff; d += h >>> 16;

          // Maj
          h = (ah0 & ah1) ^ (ah0 & ah2) ^ (ah1 & ah2);
          l = (al0 & al1) ^ (al0 & al2) ^ (al1 & al2);

          a += l & 0xffff; b += l >>> 16;
          c += h & 0xffff; d += h >>> 16;

          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;

          bh7 = (c & 0xffff) | (d << 16);
          bl7 = (a & 0xffff) | (b << 16);

          // add
          h = bh3;
          l = bl3;

          a = l & 0xffff; b = l >>> 16;
          c = h & 0xffff; d = h >>> 16;

          h = th;
          l = tl;

          a += l & 0xffff; b += l >>> 16;
          c += h & 0xffff; d += h >>> 16;

          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;

          bh3 = (c & 0xffff) | (d << 16);
          bl3 = (a & 0xffff) | (b << 16);

          ah1 = bh0;
          ah2 = bh1;
          ah3 = bh2;
          ah4 = bh3;
          ah5 = bh4;
          ah6 = bh5;
          ah7 = bh6;
          ah0 = bh7;

          al1 = bl0;
          al2 = bl1;
          al3 = bl2;
          al4 = bl3;
          al5 = bl4;
          al6 = bl5;
          al7 = bl6;
          al0 = bl7;

          if (i%16 === 15) {
            for (j = 0; j < 16; j++) {
              // add
              h = wh[j];
              l = wl[j];

              a = l & 0xffff; b = l >>> 16;
              c = h & 0xffff; d = h >>> 16;

              h = wh[(j+9)%16];
              l = wl[(j+9)%16];

              a += l & 0xffff; b += l >>> 16;
              c += h & 0xffff; d += h >>> 16;

              // sigma0
              th = wh[(j+1)%16];
              tl = wl[(j+1)%16];
              h = ((th >>> 1) | (tl << (32-1))) ^ ((th >>> 8) | (tl << (32-8))) ^ (th >>> 7);
              l = ((tl >>> 1) | (th << (32-1))) ^ ((tl >>> 8) | (th << (32-8))) ^ ((tl >>> 7) | (th << (32-7)));

              a += l & 0xffff; b += l >>> 16;
              c += h & 0xffff; d += h >>> 16;

              // sigma1
              th = wh[(j+14)%16];
              tl = wl[(j+14)%16];
              h = ((th >>> 19) | (tl << (32-19))) ^ ((tl >>> (61-32)) | (th << (32-(61-32)))) ^ (th >>> 6);
              l = ((tl >>> 19) | (th << (32-19))) ^ ((th >>> (61-32)) | (tl << (32-(61-32)))) ^ ((tl >>> 6) | (th << (32-6)));

              a += l & 0xffff; b += l >>> 16;
              c += h & 0xffff; d += h >>> 16;

              b += a >>> 16;
              c += b >>> 16;
              d += c >>> 16;

              wh[j] = (c & 0xffff) | (d << 16);
              wl[j] = (a & 0xffff) | (b << 16);
            }
          }
        }

        // add
        h = ah0;
        l = al0;

        a = l & 0xffff; b = l >>> 16;
        c = h & 0xffff; d = h >>> 16;

        h = hh[0];
        l = hl[0];

        a += l & 0xffff; b += l >>> 16;
        c += h & 0xffff; d += h >>> 16;

        b += a >>> 16;
        c += b >>> 16;
        d += c >>> 16;

        hh[0] = ah0 = (c & 0xffff) | (d << 16);
        hl[0] = al0 = (a & 0xffff) | (b << 16);

        h = ah1;
        l = al1;

        a = l & 0xffff; b = l >>> 16;
        c = h & 0xffff; d = h >>> 16;

        h = hh[1];
        l = hl[1];

        a += l & 0xffff; b += l >>> 16;
        c += h & 0xffff; d += h >>> 16;

        b += a >>> 16;
        c += b >>> 16;
        d += c >>> 16;

        hh[1] = ah1 = (c & 0xffff) | (d << 16);
        hl[1] = al1 = (a & 0xffff) | (b << 16);

        h = ah2;
        l = al2;

        a = l & 0xffff; b = l >>> 16;
        c = h & 0xffff; d = h >>> 16;

        h = hh[2];
        l = hl[2];

        a += l & 0xffff; b += l >>> 16;
        c += h & 0xffff; d += h >>> 16;

        b += a >>> 16;
        c += b >>> 16;
        d += c >>> 16;

        hh[2] = ah2 = (c & 0xffff) | (d << 16);
        hl[2] = al2 = (a & 0xffff) | (b << 16);

        h = ah3;
        l = al3;

        a = l & 0xffff; b = l >>> 16;
        c = h & 0xffff; d = h >>> 16;

        h = hh[3];
        l = hl[3];

        a += l & 0xffff; b += l >>> 16;
        c += h & 0xffff; d += h >>> 16;

        b += a >>> 16;
        c += b >>> 16;
        d += c >>> 16;

        hh[3] = ah3 = (c & 0xffff) | (d << 16);
        hl[3] = al3 = (a & 0xffff) | (b << 16);

        h = ah4;
        l = al4;

        a = l & 0xffff; b = l >>> 16;
        c = h & 0xffff; d = h >>> 16;

        h = hh[4];
        l = hl[4];

        a += l & 0xffff; b += l >>> 16;
        c += h & 0xffff; d += h >>> 16;

        b += a >>> 16;
        c += b >>> 16;
        d += c >>> 16;

        hh[4] = ah4 = (c & 0xffff) | (d << 16);
        hl[4] = al4 = (a & 0xffff) | (b << 16);

        h = ah5;
        l = al5;

        a = l & 0xffff; b = l >>> 16;
        c = h & 0xffff; d = h >>> 16;

        h = hh[5];
        l = hl[5];

        a += l & 0xffff; b += l >>> 16;
        c += h & 0xffff; d += h >>> 16;

        b += a >>> 16;
        c += b >>> 16;
        d += c >>> 16;

        hh[5] = ah5 = (c & 0xffff) | (d << 16);
        hl[5] = al5 = (a & 0xffff) | (b << 16);

        h = ah6;
        l = al6;

        a = l & 0xffff; b = l >>> 16;
        c = h & 0xffff; d = h >>> 16;

        h = hh[6];
        l = hl[6];

        a += l & 0xffff; b += l >>> 16;
        c += h & 0xffff; d += h >>> 16;

        b += a >>> 16;
        c += b >>> 16;
        d += c >>> 16;

        hh[6] = ah6 = (c & 0xffff) | (d << 16);
        hl[6] = al6 = (a & 0xffff) | (b << 16);

        h = ah7;
        l = al7;

        a = l & 0xffff; b = l >>> 16;
        c = h & 0xffff; d = h >>> 16;

        h = hh[7];
        l = hl[7];

        a += l & 0xffff; b += l >>> 16;
        c += h & 0xffff; d += h >>> 16;

        b += a >>> 16;
        c += b >>> 16;
        d += c >>> 16;

        hh[7] = ah7 = (c & 0xffff) | (d << 16);
        hl[7] = al7 = (a & 0xffff) | (b << 16);

        pos += 128;
        n -= 128;
      }

      return n;
    }

    function crypto_hash(out, m, n) {
      var hh = new Int32Array(8),
          hl = new Int32Array(8),
          x = new Uint8Array(256),
          i, b = n;

      hh[0] = 0x6a09e667;
      hh[1] = 0xbb67ae85;
      hh[2] = 0x3c6ef372;
      hh[3] = 0xa54ff53a;
      hh[4] = 0x510e527f;
      hh[5] = 0x9b05688c;
      hh[6] = 0x1f83d9ab;
      hh[7] = 0x5be0cd19;

      hl[0] = 0xf3bcc908;
      hl[1] = 0x84caa73b;
      hl[2] = 0xfe94f82b;
      hl[3] = 0x5f1d36f1;
      hl[4] = 0xade682d1;
      hl[5] = 0x2b3e6c1f;
      hl[6] = 0xfb41bd6b;
      hl[7] = 0x137e2179;

      crypto_hashblocks_hl(hh, hl, m, n);
      n %= 128;

      for (i = 0; i < n; i++) x[i] = m[b-n+i];
      x[n] = 128;

      n = 256-128*(n<112?1:0);
      x[n-9] = 0;
      ts64(x, n-8,  (b / 0x20000000) | 0, b << 3);
      crypto_hashblocks_hl(hh, hl, x, n);

      for (i = 0; i < 8; i++) ts64(out, 8*i, hh[i], hl[i]);

      return 0;
    }

    function add(p, q) {
      var a = gf(), b = gf(), c = gf(),
          d = gf(), e = gf(), f = gf(),
          g = gf(), h = gf(), t = gf();

      Z(a, p[1], p[0]);
      Z(t, q[1], q[0]);
      M(a, a, t);
      A(b, p[0], p[1]);
      A(t, q[0], q[1]);
      M(b, b, t);
      M(c, p[3], q[3]);
      M(c, c, D2);
      M(d, p[2], q[2]);
      A(d, d, d);
      Z(e, b, a);
      Z(f, d, c);
      A(g, d, c);
      A(h, b, a);

      M(p[0], e, f);
      M(p[1], h, g);
      M(p[2], g, f);
      M(p[3], e, h);
    }

    function cswap(p, q, b) {
      var i;
      for (i = 0; i < 4; i++) {
        sel25519(p[i], q[i], b);
      }
    }

    function pack(r, p) {
      var tx = gf(), ty = gf(), zi = gf();
      inv25519(zi, p[2]);
      M(tx, p[0], zi);
      M(ty, p[1], zi);
      pack25519(r, ty);
      r[31] ^= par25519(tx) << 7;
    }

    function scalarmult(p, q, s) {
      var b, i;
      set25519(p[0], gf0);
      set25519(p[1], gf1);
      set25519(p[2], gf1);
      set25519(p[3], gf0);
      for (i = 255; i >= 0; --i) {
        b = (s[(i/8)|0] >> (i&7)) & 1;
        cswap(p, q, b);
        add(q, p);
        add(p, p);
        cswap(p, q, b);
      }
    }

    function scalarbase(p, s) {
      var q = [gf(), gf(), gf(), gf()];
      set25519(q[0], X);
      set25519(q[1], Y);
      set25519(q[2], gf1);
      M(q[3], X, Y);
      scalarmult(p, q, s);
    }

    function crypto_sign_keypair(pk, sk, seeded) {
      var d = new Uint8Array(64);
      var p = [gf(), gf(), gf(), gf()];
      var i;

      if (!seeded) randombytes(sk, 32);
      crypto_hash(d, sk, 32);
      d[0] &= 248;
      d[31] &= 127;
      d[31] |= 64;

      scalarbase(p, d);
      pack(pk, p);

      for (i = 0; i < 32; i++) sk[i+32] = pk[i];
      return 0;
    }

    var L = new Float64Array([0xed, 0xd3, 0xf5, 0x5c, 0x1a, 0x63, 0x12, 0x58, 0xd6, 0x9c, 0xf7, 0xa2, 0xde, 0xf9, 0xde, 0x14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x10]);

    function modL(r, x) {
      var carry, i, j, k;
      for (i = 63; i >= 32; --i) {
        carry = 0;
        for (j = i - 32, k = i - 12; j < k; ++j) {
          x[j] += carry - 16 * x[i] * L[j - (i - 32)];
          carry = (x[j] + 128) >> 8;
          x[j] -= carry * 256;
        }
        x[j] += carry;
        x[i] = 0;
      }
      carry = 0;
      for (j = 0; j < 32; j++) {
        x[j] += carry - (x[31] >> 4) * L[j];
        carry = x[j] >> 8;
        x[j] &= 255;
      }
      for (j = 0; j < 32; j++) x[j] -= carry * L[j];
      for (i = 0; i < 32; i++) {
        x[i+1] += x[i] >> 8;
        r[i] = x[i] & 255;
      }
    }

    function reduce(r) {
      var x = new Float64Array(64), i;
      for (i = 0; i < 64; i++) x[i] = r[i];
      for (i = 0; i < 64; i++) r[i] = 0;
      modL(r, x);
    }

    // Note: difference from C - smlen returned, not passed as argument.
    function crypto_sign(sm, m, n, sk) {
      var d = new Uint8Array(64), h = new Uint8Array(64), r = new Uint8Array(64);
      var i, j, x = new Float64Array(64);
      var p = [gf(), gf(), gf(), gf()];

      crypto_hash(d, sk, 32);
      d[0] &= 248;
      d[31] &= 127;
      d[31] |= 64;

      var smlen = n + 64;
      for (i = 0; i < n; i++) sm[64 + i] = m[i];
      for (i = 0; i < 32; i++) sm[32 + i] = d[32 + i];

      crypto_hash(r, sm.subarray(32), n+32);
      reduce(r);
      scalarbase(p, r);
      pack(sm, p);

      for (i = 32; i < 64; i++) sm[i] = sk[i];
      crypto_hash(h, sm, n + 64);
      reduce(h);

      for (i = 0; i < 64; i++) x[i] = 0;
      for (i = 0; i < 32; i++) x[i] = r[i];
      for (i = 0; i < 32; i++) {
        for (j = 0; j < 32; j++) {
          x[i+j] += h[i] * d[j];
        }
      }

      modL(sm.subarray(32), x);
      return smlen;
    }

    function unpackneg(r, p) {
      var t = gf(), chk = gf(), num = gf(),
          den = gf(), den2 = gf(), den4 = gf(),
          den6 = gf();

      set25519(r[2], gf1);
      unpack25519(r[1], p);
      S(num, r[1]);
      M(den, num, D);
      Z(num, num, r[2]);
      A(den, r[2], den);

      S(den2, den);
      S(den4, den2);
      M(den6, den4, den2);
      M(t, den6, num);
      M(t, t, den);

      pow2523(t, t);
      M(t, t, num);
      M(t, t, den);
      M(t, t, den);
      M(r[0], t, den);

      S(chk, r[0]);
      M(chk, chk, den);
      if (neq25519(chk, num)) M(r[0], r[0], I);

      S(chk, r[0]);
      M(chk, chk, den);
      if (neq25519(chk, num)) return -1;

      if (par25519(r[0]) === (p[31]>>7)) Z(r[0], gf0, r[0]);

      M(r[3], r[0], r[1]);
      return 0;
    }

    function crypto_sign_open(m, sm, n, pk) {
      var i, mlen;
      var t = new Uint8Array(32), h = new Uint8Array(64);
      var p = [gf(), gf(), gf(), gf()],
          q = [gf(), gf(), gf(), gf()];

      mlen = -1;
      if (n < 64) return -1;

      if (unpackneg(q, pk)) return -1;

      for (i = 0; i < n; i++) m[i] = sm[i];
      for (i = 0; i < 32; i++) m[i+32] = pk[i];
      crypto_hash(h, m, n);
      reduce(h);
      scalarmult(p, q, h);

      scalarbase(q, sm.subarray(32));
      add(p, q);
      pack(t, p);

      n -= 64;
      if (crypto_verify_32(sm, 0, t, 0)) {
        for (i = 0; i < n; i++) m[i] = 0;
        return -1;
      }

      for (i = 0; i < n; i++) m[i] = sm[i + 64];
      mlen = n;
      return mlen;
    }

    var crypto_secretbox_KEYBYTES = 32,
        crypto_secretbox_NONCEBYTES = 24,
        crypto_secretbox_ZEROBYTES = 32,
        crypto_secretbox_BOXZEROBYTES = 16,
        crypto_scalarmult_BYTES = 32,
        crypto_scalarmult_SCALARBYTES = 32,
        crypto_box_PUBLICKEYBYTES = 32,
        crypto_box_SECRETKEYBYTES = 32,
        crypto_box_BEFORENMBYTES = 32,
        crypto_box_NONCEBYTES = crypto_secretbox_NONCEBYTES,
        crypto_box_ZEROBYTES = crypto_secretbox_ZEROBYTES,
        crypto_box_BOXZEROBYTES = crypto_secretbox_BOXZEROBYTES,
        crypto_sign_BYTES = 64,
        crypto_sign_PUBLICKEYBYTES = 32,
        crypto_sign_SECRETKEYBYTES = 64,
        crypto_sign_SEEDBYTES = 32,
        crypto_hash_BYTES = 64;

    nacl.lowlevel = {
      crypto_core_hsalsa20: crypto_core_hsalsa20,
      crypto_stream_xor: crypto_stream_xor,
      crypto_stream: crypto_stream,
      crypto_stream_salsa20_xor: crypto_stream_salsa20_xor,
      crypto_stream_salsa20: crypto_stream_salsa20,
      crypto_onetimeauth: crypto_onetimeauth,
      crypto_onetimeauth_verify: crypto_onetimeauth_verify,
      crypto_verify_16: crypto_verify_16,
      crypto_verify_32: crypto_verify_32,
      crypto_secretbox: crypto_secretbox,
      crypto_secretbox_open: crypto_secretbox_open,
      crypto_scalarmult: crypto_scalarmult,
      crypto_scalarmult_base: crypto_scalarmult_base,
      crypto_box_beforenm: crypto_box_beforenm,
      crypto_box_afternm: crypto_box_afternm,
      crypto_box: crypto_box,
      crypto_box_open: crypto_box_open,
      crypto_box_keypair: crypto_box_keypair,
      crypto_hash: crypto_hash,
      crypto_sign: crypto_sign,
      crypto_sign_keypair: crypto_sign_keypair,
      crypto_sign_open: crypto_sign_open,

      crypto_secretbox_KEYBYTES: crypto_secretbox_KEYBYTES,
      crypto_secretbox_NONCEBYTES: crypto_secretbox_NONCEBYTES,
      crypto_secretbox_ZEROBYTES: crypto_secretbox_ZEROBYTES,
      crypto_secretbox_BOXZEROBYTES: crypto_secretbox_BOXZEROBYTES,
      crypto_scalarmult_BYTES: crypto_scalarmult_BYTES,
      crypto_scalarmult_SCALARBYTES: crypto_scalarmult_SCALARBYTES,
      crypto_box_PUBLICKEYBYTES: crypto_box_PUBLICKEYBYTES,
      crypto_box_SECRETKEYBYTES: crypto_box_SECRETKEYBYTES,
      crypto_box_BEFORENMBYTES: crypto_box_BEFORENMBYTES,
      crypto_box_NONCEBYTES: crypto_box_NONCEBYTES,
      crypto_box_ZEROBYTES: crypto_box_ZEROBYTES,
      crypto_box_BOXZEROBYTES: crypto_box_BOXZEROBYTES,
      crypto_sign_BYTES: crypto_sign_BYTES,
      crypto_sign_PUBLICKEYBYTES: crypto_sign_PUBLICKEYBYTES,
      crypto_sign_SECRETKEYBYTES: crypto_sign_SECRETKEYBYTES,
      crypto_sign_SEEDBYTES: crypto_sign_SEEDBYTES,
      crypto_hash_BYTES: crypto_hash_BYTES
    };

    /* High-level API */

    function checkLengths(k, n) {
      if (k.length !== crypto_secretbox_KEYBYTES) throw new Error('bad key size');
      if (n.length !== crypto_secretbox_NONCEBYTES) throw new Error('bad nonce size');
    }

    function checkBoxLengths(pk, sk) {
      if (pk.length !== crypto_box_PUBLICKEYBYTES) throw new Error('bad public key size');
      if (sk.length !== crypto_box_SECRETKEYBYTES) throw new Error('bad secret key size');
    }

    function checkArrayTypes() {
      for (var i = 0; i < arguments.length; i++) {
        if (!(arguments[i] instanceof Uint8Array))
          throw new TypeError('unexpected type, use Uint8Array');
      }
    }

    function cleanup(arr) {
      for (var i = 0; i < arr.length; i++) arr[i] = 0;
    }

    nacl.randomBytes = function(n) {
      var b = new Uint8Array(n);
      randombytes(b, n);
      return b;
    };

    nacl.secretbox = function(msg, nonce, key) {
      checkArrayTypes(msg, nonce, key);
      checkLengths(key, nonce);
      var m = new Uint8Array(crypto_secretbox_ZEROBYTES + msg.length);
      var c = new Uint8Array(m.length);
      for (var i = 0; i < msg.length; i++) m[i+crypto_secretbox_ZEROBYTES] = msg[i];
      crypto_secretbox(c, m, m.length, nonce, key);
      return c.subarray(crypto_secretbox_BOXZEROBYTES);
    };

    nacl.secretbox.open = function(box, nonce, key) {
      checkArrayTypes(box, nonce, key);
      checkLengths(key, nonce);
      var c = new Uint8Array(crypto_secretbox_BOXZEROBYTES + box.length);
      var m = new Uint8Array(c.length);
      for (var i = 0; i < box.length; i++) c[i+crypto_secretbox_BOXZEROBYTES] = box[i];
      if (c.length < 32) return null;
      if (crypto_secretbox_open(m, c, c.length, nonce, key) !== 0) return null;
      return m.subarray(crypto_secretbox_ZEROBYTES);
    };

    nacl.secretbox.keyLength = crypto_secretbox_KEYBYTES;
    nacl.secretbox.nonceLength = crypto_secretbox_NONCEBYTES;
    nacl.secretbox.overheadLength = crypto_secretbox_BOXZEROBYTES;

    nacl.scalarMult = function(n, p) {
      checkArrayTypes(n, p);
      if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error('bad n size');
      if (p.length !== crypto_scalarmult_BYTES) throw new Error('bad p size');
      var q = new Uint8Array(crypto_scalarmult_BYTES);
      crypto_scalarmult(q, n, p);
      return q;
    };

    nacl.scalarMult.base = function(n) {
      checkArrayTypes(n);
      if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error('bad n size');
      var q = new Uint8Array(crypto_scalarmult_BYTES);
      crypto_scalarmult_base(q, n);
      return q;
    };

    nacl.scalarMult.scalarLength = crypto_scalarmult_SCALARBYTES;
    nacl.scalarMult.groupElementLength = crypto_scalarmult_BYTES;

    nacl.box = function(msg, nonce, publicKey, secretKey) {
      var k = nacl.box.before(publicKey, secretKey);
      return nacl.secretbox(msg, nonce, k);
    };

    nacl.box.before = function(publicKey, secretKey) {
      checkArrayTypes(publicKey, secretKey);
      checkBoxLengths(publicKey, secretKey);
      var k = new Uint8Array(crypto_box_BEFORENMBYTES);
      crypto_box_beforenm(k, publicKey, secretKey);
      return k;
    };

    nacl.box.after = nacl.secretbox;

    nacl.box.open = function(msg, nonce, publicKey, secretKey) {
      var k = nacl.box.before(publicKey, secretKey);
      return nacl.secretbox.open(msg, nonce, k);
    };

    nacl.box.open.after = nacl.secretbox.open;

    nacl.box.keyPair = function() {
      var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
      var sk = new Uint8Array(crypto_box_SECRETKEYBYTES);
      crypto_box_keypair(pk, sk);
      return {publicKey: pk, secretKey: sk};
    };

    nacl.box.keyPair.fromSecretKey = function(secretKey) {
      checkArrayTypes(secretKey);
      if (secretKey.length !== crypto_box_SECRETKEYBYTES)
        throw new Error('bad secret key size');
      var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
      crypto_scalarmult_base(pk, secretKey);
      return {publicKey: pk, secretKey: new Uint8Array(secretKey)};
    };

    nacl.box.publicKeyLength = crypto_box_PUBLICKEYBYTES;
    nacl.box.secretKeyLength = crypto_box_SECRETKEYBYTES;
    nacl.box.sharedKeyLength = crypto_box_BEFORENMBYTES;
    nacl.box.nonceLength = crypto_box_NONCEBYTES;
    nacl.box.overheadLength = nacl.secretbox.overheadLength;

    nacl.sign = function(msg, secretKey) {
      checkArrayTypes(msg, secretKey);
      if (secretKey.length !== crypto_sign_SECRETKEYBYTES)
        throw new Error('bad secret key size');
      var signedMsg = new Uint8Array(crypto_sign_BYTES+msg.length);
      crypto_sign(signedMsg, msg, msg.length, secretKey);
      return signedMsg;
    };

    nacl.sign.open = function(signedMsg, publicKey) {
      checkArrayTypes(signedMsg, publicKey);
      if (publicKey.length !== crypto_sign_PUBLICKEYBYTES)
        throw new Error('bad public key size');
      var tmp = new Uint8Array(signedMsg.length);
      var mlen = crypto_sign_open(tmp, signedMsg, signedMsg.length, publicKey);
      if (mlen < 0) return null;
      var m = new Uint8Array(mlen);
      for (var i = 0; i < m.length; i++) m[i] = tmp[i];
      return m;
    };

    nacl.sign.detached = function(msg, secretKey) {
      var signedMsg = nacl.sign(msg, secretKey);
      var sig = new Uint8Array(crypto_sign_BYTES);
      for (var i = 0; i < sig.length; i++) sig[i] = signedMsg[i];
      return sig;
    };

    nacl.sign.detached.verify = function(msg, sig, publicKey) {
      checkArrayTypes(msg, sig, publicKey);
      if (sig.length !== crypto_sign_BYTES)
        throw new Error('bad signature size');
      if (publicKey.length !== crypto_sign_PUBLICKEYBYTES)
        throw new Error('bad public key size');
      var sm = new Uint8Array(crypto_sign_BYTES + msg.length);
      var m = new Uint8Array(crypto_sign_BYTES + msg.length);
      var i;
      for (i = 0; i < crypto_sign_BYTES; i++) sm[i] = sig[i];
      for (i = 0; i < msg.length; i++) sm[i+crypto_sign_BYTES] = msg[i];
      return (crypto_sign_open(m, sm, sm.length, publicKey) >= 0);
    };

    nacl.sign.keyPair = function() {
      var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
      var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
      crypto_sign_keypair(pk, sk);
      return {publicKey: pk, secretKey: sk};
    };

    nacl.sign.keyPair.fromSecretKey = function(secretKey) {
      checkArrayTypes(secretKey);
      if (secretKey.length !== crypto_sign_SECRETKEYBYTES)
        throw new Error('bad secret key size');
      var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
      for (var i = 0; i < pk.length; i++) pk[i] = secretKey[32+i];
      return {publicKey: pk, secretKey: new Uint8Array(secretKey)};
    };

    nacl.sign.keyPair.fromSeed = function(seed) {
      checkArrayTypes(seed);
      if (seed.length !== crypto_sign_SEEDBYTES)
        throw new Error('bad seed size');
      var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
      var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
      for (var i = 0; i < 32; i++) sk[i] = seed[i];
      crypto_sign_keypair(pk, sk, true);
      return {publicKey: pk, secretKey: sk};
    };

    nacl.sign.publicKeyLength = crypto_sign_PUBLICKEYBYTES;
    nacl.sign.secretKeyLength = crypto_sign_SECRETKEYBYTES;
    nacl.sign.seedLength = crypto_sign_SEEDBYTES;
    nacl.sign.signatureLength = crypto_sign_BYTES;

    nacl.hash = function(msg) {
      checkArrayTypes(msg);
      var h = new Uint8Array(crypto_hash_BYTES);
      crypto_hash(h, msg, msg.length);
      return h;
    };

    nacl.hash.hashLength = crypto_hash_BYTES;

    nacl.verify = function(x, y) {
      checkArrayTypes(x, y);
      // Zero length arguments are considered not equal.
      if (x.length === 0 || y.length === 0) return false;
      if (x.length !== y.length) return false;
      return (vn(x, 0, y, 0, x.length) === 0) ? true : false;
    };

    nacl.setPRNG = function(fn) {
      randombytes = fn;
    };

    (function() {
      // Initialize PRNG if environment provides CSPRNG.
      // If not, methods calling randombytes will throw.
      var crypto = typeof self !== 'undefined' ? (self.crypto || self.msCrypto) : null;
      if (crypto && crypto.getRandomValues) {
        // Browsers.
        var QUOTA = 65536;
        nacl.setPRNG(function(x, n) {
          var i, v = new Uint8Array(n);
          for (i = 0; i < n; i += QUOTA) {
            crypto.getRandomValues(v.subarray(i, i + Math.min(n - i, QUOTA)));
          }
          for (i = 0; i < n; i++) x[i] = v[i];
          cleanup(v);
        });
      } else if (typeof commonjsRequire !== 'undefined') {
        // Node.js.
        crypto = require$$0;
        if (crypto && crypto.randomBytes) {
          nacl.setPRNG(function(x, n) {
            var i, v = crypto.randomBytes(n);
            for (i = 0; i < n; i++) x[i] = v[i];
            cleanup(v);
          });
        }
      }
    })();

    })(module.exports ? module.exports : (self.nacl = self.nacl || {}));
    });

    var browser$1 = createCommonjsModule(function (module, exports) {

    // ref: https://github.com/tc39/proposal-global
    var getGlobal = function () {
    	// the only reliable means to get the global object is
    	// `Function('return this')()`
    	// However, this causes CSP violations in Chrome apps.
    	if (typeof self !== 'undefined') { return self; }
    	if (typeof window !== 'undefined') { return window; }
    	if (typeof global !== 'undefined') { return global; }
    	throw new Error('unable to locate global object');
    };

    var global = getGlobal();

    module.exports = exports = global.fetch;

    // Needed for TypeScript and Webpack.
    if (global.fetch) {
    	exports.default = global.fetch.bind(global);
    }

    exports.Headers = global.Headers;
    exports.Request = global.Request;
    exports.Response = global.Response;
    });

    var lamden = createCommonjsModule(function (module) {

    var global$1 = (typeof commonjsGlobal !== "undefined" ? commonjsGlobal :
                typeof self !== "undefined" ? self :
                typeof window !== "undefined" ? window : {});

    var lookup = [];
    var revLookup = [];
    var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
    var inited = false;
    function init () {
      inited = true;
      var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      for (var i = 0, len = code.length; i < len; ++i) {
        lookup[i] = code[i];
        revLookup[code.charCodeAt(i)] = i;
      }

      revLookup['-'.charCodeAt(0)] = 62;
      revLookup['_'.charCodeAt(0)] = 63;
    }

    function toByteArray (b64) {
      if (!inited) {
        init();
      }
      var i, j, l, tmp, placeHolders, arr;
      var len = b64.length;

      if (len % 4 > 0) {
        throw new Error('Invalid string. Length must be a multiple of 4')
      }

      // the number of equal signs (place holders)
      // if there are two placeholders, than the two characters before it
      // represent one byte
      // if there is only one, then the three characters before it represent 2 bytes
      // this is just a cheap hack to not do indexOf twice
      placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0;

      // base64 is 4/3 + up to two characters of the original data
      arr = new Arr(len * 3 / 4 - placeHolders);

      // if there are placeholders, only get up to the last complete 4 chars
      l = placeHolders > 0 ? len - 4 : len;

      var L = 0;

      for (i = 0, j = 0; i < l; i += 4, j += 3) {
        tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)];
        arr[L++] = (tmp >> 16) & 0xFF;
        arr[L++] = (tmp >> 8) & 0xFF;
        arr[L++] = tmp & 0xFF;
      }

      if (placeHolders === 2) {
        tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
        arr[L++] = tmp & 0xFF;
      } else if (placeHolders === 1) {
        tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2);
        arr[L++] = (tmp >> 8) & 0xFF;
        arr[L++] = tmp & 0xFF;
      }

      return arr
    }

    function tripletToBase64 (num) {
      return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
    }

    function encodeChunk (uint8, start, end) {
      var tmp;
      var output = [];
      for (var i = start; i < end; i += 3) {
        tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
        output.push(tripletToBase64(tmp));
      }
      return output.join('')
    }

    function fromByteArray (uint8) {
      if (!inited) {
        init();
      }
      var tmp;
      var len = uint8.length;
      var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
      var output = '';
      var parts = [];
      var maxChunkLength = 16383; // must be multiple of 3

      // go through the array every three bytes, we'll deal with trailing stuff later
      for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
        parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
      }

      // pad the end with zeros, but make sure to not forget the extra bytes
      if (extraBytes === 1) {
        tmp = uint8[len - 1];
        output += lookup[tmp >> 2];
        output += lookup[(tmp << 4) & 0x3F];
        output += '==';
      } else if (extraBytes === 2) {
        tmp = (uint8[len - 2] << 8) + (uint8[len - 1]);
        output += lookup[tmp >> 10];
        output += lookup[(tmp >> 4) & 0x3F];
        output += lookup[(tmp << 2) & 0x3F];
        output += '=';
      }

      parts.push(output);

      return parts.join('')
    }

    function read (buffer, offset, isLE, mLen, nBytes) {
      var e, m;
      var eLen = nBytes * 8 - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var nBits = -7;
      var i = isLE ? (nBytes - 1) : 0;
      var d = isLE ? -1 : 1;
      var s = buffer[offset + i];

      i += d;

      e = s & ((1 << (-nBits)) - 1);
      s >>= (-nBits);
      nBits += eLen;
      for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

      m = e & ((1 << (-nBits)) - 1);
      e >>= (-nBits);
      nBits += mLen;
      for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

      if (e === 0) {
        e = 1 - eBias;
      } else if (e === eMax) {
        return m ? NaN : ((s ? -1 : 1) * Infinity)
      } else {
        m = m + Math.pow(2, mLen);
        e = e - eBias;
      }
      return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
    }

    function write (buffer, value, offset, isLE, mLen, nBytes) {
      var e, m, c;
      var eLen = nBytes * 8 - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
      var i = isLE ? 0 : (nBytes - 1);
      var d = isLE ? 1 : -1;
      var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

      value = Math.abs(value);

      if (isNaN(value) || value === Infinity) {
        m = isNaN(value) ? 1 : 0;
        e = eMax;
      } else {
        e = Math.floor(Math.log(value) / Math.LN2);
        if (value * (c = Math.pow(2, -e)) < 1) {
          e--;
          c *= 2;
        }
        if (e + eBias >= 1) {
          value += rt / c;
        } else {
          value += rt * Math.pow(2, 1 - eBias);
        }
        if (value * c >= 2) {
          e++;
          c /= 2;
        }

        if (e + eBias >= eMax) {
          m = 0;
          e = eMax;
        } else if (e + eBias >= 1) {
          m = (value * c - 1) * Math.pow(2, mLen);
          e = e + eBias;
        } else {
          m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
          e = 0;
        }
      }

      for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

      e = (e << mLen) | m;
      eLen += mLen;
      for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

      buffer[offset + i - d] |= s * 128;
    }

    var toString = {}.toString;

    var isArray = Array.isArray || function (arr) {
      return toString.call(arr) == '[object Array]';
    };

    var INSPECT_MAX_BYTES = 50;

    /**
     * If `Buffer.TYPED_ARRAY_SUPPORT`:
     *   === true    Use Uint8Array implementation (fastest)
     *   === false   Use Object implementation (most compatible, even IE6)
     *
     * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
     * Opera 11.6+, iOS 4.2+.
     *
     * Due to various browser bugs, sometimes the Object implementation will be used even
     * when the browser supports typed arrays.
     *
     * Note:
     *
     *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
     *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
     *
     *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
     *
     *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
     *     incorrect length in some situations.

     * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
     * get the Object implementation, which is slower but behaves correctly.
     */
    Buffer.TYPED_ARRAY_SUPPORT = global$1.TYPED_ARRAY_SUPPORT !== undefined
      ? global$1.TYPED_ARRAY_SUPPORT
      : true;

    function kMaxLength () {
      return Buffer.TYPED_ARRAY_SUPPORT
        ? 0x7fffffff
        : 0x3fffffff
    }

    function createBuffer (that, length) {
      if (kMaxLength() < length) {
        throw new RangeError('Invalid typed array length')
      }
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        // Return an augmented `Uint8Array` instance, for best performance
        that = new Uint8Array(length);
        that.__proto__ = Buffer.prototype;
      } else {
        // Fallback: Return an object instance of the Buffer class
        if (that === null) {
          that = new Buffer(length);
        }
        that.length = length;
      }

      return that
    }

    /**
     * The Buffer constructor returns instances of `Uint8Array` that have their
     * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
     * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
     * and the `Uint8Array` methods. Square bracket notation works as expected -- it
     * returns a single octet.
     *
     * The `Uint8Array` prototype remains unmodified.
     */

    function Buffer (arg, encodingOrOffset, length) {
      if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
        return new Buffer(arg, encodingOrOffset, length)
      }

      // Common case.
      if (typeof arg === 'number') {
        if (typeof encodingOrOffset === 'string') {
          throw new Error(
            'If encoding is specified then the first argument must be a string'
          )
        }
        return allocUnsafe(this, arg)
      }
      return from(this, arg, encodingOrOffset, length)
    }

    Buffer.poolSize = 8192; // not used by this implementation

    // TODO: Legacy, not needed anymore. Remove in next major version.
    Buffer._augment = function (arr) {
      arr.__proto__ = Buffer.prototype;
      return arr
    };

    function from (that, value, encodingOrOffset, length) {
      if (typeof value === 'number') {
        throw new TypeError('"value" argument must not be a number')
      }

      if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
        return fromArrayBuffer(that, value, encodingOrOffset, length)
      }

      if (typeof value === 'string') {
        return fromString(that, value, encodingOrOffset)
      }

      return fromObject(that, value)
    }

    /**
     * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
     * if value is a number.
     * Buffer.from(str[, encoding])
     * Buffer.from(array)
     * Buffer.from(buffer)
     * Buffer.from(arrayBuffer[, byteOffset[, length]])
     **/
    Buffer.from = function (value, encodingOrOffset, length) {
      return from(null, value, encodingOrOffset, length)
    };

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      Buffer.prototype.__proto__ = Uint8Array.prototype;
      Buffer.__proto__ = Uint8Array;
    }

    function assertSize (size) {
      if (typeof size !== 'number') {
        throw new TypeError('"size" argument must be a number')
      } else if (size < 0) {
        throw new RangeError('"size" argument must not be negative')
      }
    }

    function alloc (that, size, fill, encoding) {
      assertSize(size);
      if (size <= 0) {
        return createBuffer(that, size)
      }
      if (fill !== undefined) {
        // Only pay attention to encoding if it's a string. This
        // prevents accidentally sending in a number that would
        // be interpretted as a start offset.
        return typeof encoding === 'string'
          ? createBuffer(that, size).fill(fill, encoding)
          : createBuffer(that, size).fill(fill)
      }
      return createBuffer(that, size)
    }

    /**
     * Creates a new filled Buffer instance.
     * alloc(size[, fill[, encoding]])
     **/
    Buffer.alloc = function (size, fill, encoding) {
      return alloc(null, size, fill, encoding)
    };

    function allocUnsafe (that, size) {
      assertSize(size);
      that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
      if (!Buffer.TYPED_ARRAY_SUPPORT) {
        for (var i = 0; i < size; ++i) {
          that[i] = 0;
        }
      }
      return that
    }

    /**
     * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
     * */
    Buffer.allocUnsafe = function (size) {
      return allocUnsafe(null, size)
    };
    /**
     * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
     */
    Buffer.allocUnsafeSlow = function (size) {
      return allocUnsafe(null, size)
    };

    function fromString (that, string, encoding) {
      if (typeof encoding !== 'string' || encoding === '') {
        encoding = 'utf8';
      }

      if (!Buffer.isEncoding(encoding)) {
        throw new TypeError('"encoding" must be a valid string encoding')
      }

      var length = byteLength(string, encoding) | 0;
      that = createBuffer(that, length);

      var actual = that.write(string, encoding);

      if (actual !== length) {
        // Writing a hex string, for example, that contains invalid characters will
        // cause everything after the first invalid character to be ignored. (e.g.
        // 'abxxcd' will be treated as 'ab')
        that = that.slice(0, actual);
      }

      return that
    }

    function fromArrayLike (that, array) {
      var length = array.length < 0 ? 0 : checked(array.length) | 0;
      that = createBuffer(that, length);
      for (var i = 0; i < length; i += 1) {
        that[i] = array[i] & 255;
      }
      return that
    }

    function fromArrayBuffer (that, array, byteOffset, length) {
      array.byteLength; // this throws if `array` is not a valid ArrayBuffer

      if (byteOffset < 0 || array.byteLength < byteOffset) {
        throw new RangeError('\'offset\' is out of bounds')
      }

      if (array.byteLength < byteOffset + (length || 0)) {
        throw new RangeError('\'length\' is out of bounds')
      }

      if (byteOffset === undefined && length === undefined) {
        array = new Uint8Array(array);
      } else if (length === undefined) {
        array = new Uint8Array(array, byteOffset);
      } else {
        array = new Uint8Array(array, byteOffset, length);
      }

      if (Buffer.TYPED_ARRAY_SUPPORT) {
        // Return an augmented `Uint8Array` instance, for best performance
        that = array;
        that.__proto__ = Buffer.prototype;
      } else {
        // Fallback: Return an object instance of the Buffer class
        that = fromArrayLike(that, array);
      }
      return that
    }

    function fromObject (that, obj) {
      if (internalIsBuffer(obj)) {
        var len = checked(obj.length) | 0;
        that = createBuffer(that, len);

        if (that.length === 0) {
          return that
        }

        obj.copy(that, 0, 0, len);
        return that
      }

      if (obj) {
        if ((typeof ArrayBuffer !== 'undefined' &&
            obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
          if (typeof obj.length !== 'number' || isnan(obj.length)) {
            return createBuffer(that, 0)
          }
          return fromArrayLike(that, obj)
        }

        if (obj.type === 'Buffer' && isArray(obj.data)) {
          return fromArrayLike(that, obj.data)
        }
      }

      throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
    }

    function checked (length) {
      // Note: cannot use `length < kMaxLength()` here because that fails when
      // length is NaN (which is otherwise coerced to zero.)
      if (length >= kMaxLength()) {
        throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                             'size: 0x' + kMaxLength().toString(16) + ' bytes')
      }
      return length | 0
    }
    Buffer.isBuffer = isBuffer;
    function internalIsBuffer (b) {
      return !!(b != null && b._isBuffer)
    }

    Buffer.compare = function compare (a, b) {
      if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
        throw new TypeError('Arguments must be Buffers')
      }

      if (a === b) return 0

      var x = a.length;
      var y = b.length;

      for (var i = 0, len = Math.min(x, y); i < len; ++i) {
        if (a[i] !== b[i]) {
          x = a[i];
          y = b[i];
          break
        }
      }

      if (x < y) return -1
      if (y < x) return 1
      return 0
    };

    Buffer.isEncoding = function isEncoding (encoding) {
      switch (String(encoding).toLowerCase()) {
        case 'hex':
        case 'utf8':
        case 'utf-8':
        case 'ascii':
        case 'latin1':
        case 'binary':
        case 'base64':
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return true
        default:
          return false
      }
    };

    Buffer.concat = function concat (list, length) {
      if (!isArray(list)) {
        throw new TypeError('"list" argument must be an Array of Buffers')
      }

      if (list.length === 0) {
        return Buffer.alloc(0)
      }

      var i;
      if (length === undefined) {
        length = 0;
        for (i = 0; i < list.length; ++i) {
          length += list[i].length;
        }
      }

      var buffer = Buffer.allocUnsafe(length);
      var pos = 0;
      for (i = 0; i < list.length; ++i) {
        var buf = list[i];
        if (!internalIsBuffer(buf)) {
          throw new TypeError('"list" argument must be an Array of Buffers')
        }
        buf.copy(buffer, pos);
        pos += buf.length;
      }
      return buffer
    };

    function byteLength (string, encoding) {
      if (internalIsBuffer(string)) {
        return string.length
      }
      if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
          (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
        return string.byteLength
      }
      if (typeof string !== 'string') {
        string = '' + string;
      }

      var len = string.length;
      if (len === 0) return 0

      // Use a for loop to avoid recursion
      var loweredCase = false;
      for (;;) {
        switch (encoding) {
          case 'ascii':
          case 'latin1':
          case 'binary':
            return len
          case 'utf8':
          case 'utf-8':
          case undefined:
            return utf8ToBytes(string).length
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return len * 2
          case 'hex':
            return len >>> 1
          case 'base64':
            return base64ToBytes(string).length
          default:
            if (loweredCase) return utf8ToBytes(string).length // assume utf8
            encoding = ('' + encoding).toLowerCase();
            loweredCase = true;
        }
      }
    }
    Buffer.byteLength = byteLength;

    function slowToString (encoding, start, end) {
      var loweredCase = false;

      // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
      // property of a typed array.

      // This behaves neither like String nor Uint8Array in that we set start/end
      // to their upper/lower bounds if the value passed is out of range.
      // undefined is handled specially as per ECMA-262 6th Edition,
      // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
      if (start === undefined || start < 0) {
        start = 0;
      }
      // Return early if start > this.length. Done here to prevent potential uint32
      // coercion fail below.
      if (start > this.length) {
        return ''
      }

      if (end === undefined || end > this.length) {
        end = this.length;
      }

      if (end <= 0) {
        return ''
      }

      // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
      end >>>= 0;
      start >>>= 0;

      if (end <= start) {
        return ''
      }

      if (!encoding) encoding = 'utf8';

      while (true) {
        switch (encoding) {
          case 'hex':
            return hexSlice(this, start, end)

          case 'utf8':
          case 'utf-8':
            return utf8Slice(this, start, end)

          case 'ascii':
            return asciiSlice(this, start, end)

          case 'latin1':
          case 'binary':
            return latin1Slice(this, start, end)

          case 'base64':
            return base64Slice(this, start, end)

          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return utf16leSlice(this, start, end)

          default:
            if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
            encoding = (encoding + '').toLowerCase();
            loweredCase = true;
        }
      }
    }

    // The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
    // Buffer instances.
    Buffer.prototype._isBuffer = true;

    function swap (b, n, m) {
      var i = b[n];
      b[n] = b[m];
      b[m] = i;
    }

    Buffer.prototype.swap16 = function swap16 () {
      var len = this.length;
      if (len % 2 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 16-bits')
      }
      for (var i = 0; i < len; i += 2) {
        swap(this, i, i + 1);
      }
      return this
    };

    Buffer.prototype.swap32 = function swap32 () {
      var len = this.length;
      if (len % 4 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 32-bits')
      }
      for (var i = 0; i < len; i += 4) {
        swap(this, i, i + 3);
        swap(this, i + 1, i + 2);
      }
      return this
    };

    Buffer.prototype.swap64 = function swap64 () {
      var len = this.length;
      if (len % 8 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 64-bits')
      }
      for (var i = 0; i < len; i += 8) {
        swap(this, i, i + 7);
        swap(this, i + 1, i + 6);
        swap(this, i + 2, i + 5);
        swap(this, i + 3, i + 4);
      }
      return this
    };

    Buffer.prototype.toString = function toString () {
      var length = this.length | 0;
      if (length === 0) return ''
      if (arguments.length === 0) return utf8Slice(this, 0, length)
      return slowToString.apply(this, arguments)
    };

    Buffer.prototype.equals = function equals (b) {
      if (!internalIsBuffer(b)) throw new TypeError('Argument must be a Buffer')
      if (this === b) return true
      return Buffer.compare(this, b) === 0
    };

    Buffer.prototype.inspect = function inspect () {
      var str = '';
      var max = INSPECT_MAX_BYTES;
      if (this.length > 0) {
        str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
        if (this.length > max) str += ' ... ';
      }
      return '<Buffer ' + str + '>'
    };

    Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
      if (!internalIsBuffer(target)) {
        throw new TypeError('Argument must be a Buffer')
      }

      if (start === undefined) {
        start = 0;
      }
      if (end === undefined) {
        end = target ? target.length : 0;
      }
      if (thisStart === undefined) {
        thisStart = 0;
      }
      if (thisEnd === undefined) {
        thisEnd = this.length;
      }

      if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
        throw new RangeError('out of range index')
      }

      if (thisStart >= thisEnd && start >= end) {
        return 0
      }
      if (thisStart >= thisEnd) {
        return -1
      }
      if (start >= end) {
        return 1
      }

      start >>>= 0;
      end >>>= 0;
      thisStart >>>= 0;
      thisEnd >>>= 0;

      if (this === target) return 0

      var x = thisEnd - thisStart;
      var y = end - start;
      var len = Math.min(x, y);

      var thisCopy = this.slice(thisStart, thisEnd);
      var targetCopy = target.slice(start, end);

      for (var i = 0; i < len; ++i) {
        if (thisCopy[i] !== targetCopy[i]) {
          x = thisCopy[i];
          y = targetCopy[i];
          break
        }
      }

      if (x < y) return -1
      if (y < x) return 1
      return 0
    };

    // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
    // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
    //
    // Arguments:
    // - buffer - a Buffer to search
    // - val - a string, Buffer, or number
    // - byteOffset - an index into `buffer`; will be clamped to an int32
    // - encoding - an optional encoding, relevant is val is a string
    // - dir - true for indexOf, false for lastIndexOf
    function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
      // Empty buffer means no match
      if (buffer.length === 0) return -1

      // Normalize byteOffset
      if (typeof byteOffset === 'string') {
        encoding = byteOffset;
        byteOffset = 0;
      } else if (byteOffset > 0x7fffffff) {
        byteOffset = 0x7fffffff;
      } else if (byteOffset < -0x80000000) {
        byteOffset = -0x80000000;
      }
      byteOffset = +byteOffset;  // Coerce to Number.
      if (isNaN(byteOffset)) {
        // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
        byteOffset = dir ? 0 : (buffer.length - 1);
      }

      // Normalize byteOffset: negative offsets start from the end of the buffer
      if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
      if (byteOffset >= buffer.length) {
        if (dir) return -1
        else byteOffset = buffer.length - 1;
      } else if (byteOffset < 0) {
        if (dir) byteOffset = 0;
        else return -1
      }

      // Normalize val
      if (typeof val === 'string') {
        val = Buffer.from(val, encoding);
      }

      // Finally, search either indexOf (if dir is true) or lastIndexOf
      if (internalIsBuffer(val)) {
        // Special case: looking for empty string/buffer always fails
        if (val.length === 0) {
          return -1
        }
        return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
      } else if (typeof val === 'number') {
        val = val & 0xFF; // Search for a byte value [0-255]
        if (Buffer.TYPED_ARRAY_SUPPORT &&
            typeof Uint8Array.prototype.indexOf === 'function') {
          if (dir) {
            return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
          } else {
            return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
          }
        }
        return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
      }

      throw new TypeError('val must be string, number or Buffer')
    }

    function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
      var indexSize = 1;
      var arrLength = arr.length;
      var valLength = val.length;

      if (encoding !== undefined) {
        encoding = String(encoding).toLowerCase();
        if (encoding === 'ucs2' || encoding === 'ucs-2' ||
            encoding === 'utf16le' || encoding === 'utf-16le') {
          if (arr.length < 2 || val.length < 2) {
            return -1
          }
          indexSize = 2;
          arrLength /= 2;
          valLength /= 2;
          byteOffset /= 2;
        }
      }

      function read (buf, i) {
        if (indexSize === 1) {
          return buf[i]
        } else {
          return buf.readUInt16BE(i * indexSize)
        }
      }

      var i;
      if (dir) {
        var foundIndex = -1;
        for (i = byteOffset; i < arrLength; i++) {
          if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
            if (foundIndex === -1) foundIndex = i;
            if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
          } else {
            if (foundIndex !== -1) i -= i - foundIndex;
            foundIndex = -1;
          }
        }
      } else {
        if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
        for (i = byteOffset; i >= 0; i--) {
          var found = true;
          for (var j = 0; j < valLength; j++) {
            if (read(arr, i + j) !== read(val, j)) {
              found = false;
              break
            }
          }
          if (found) return i
        }
      }

      return -1
    }

    Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
      return this.indexOf(val, byteOffset, encoding) !== -1
    };

    Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
    };

    Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
    };

    function hexWrite (buf, string, offset, length) {
      offset = Number(offset) || 0;
      var remaining = buf.length - offset;
      if (!length) {
        length = remaining;
      } else {
        length = Number(length);
        if (length > remaining) {
          length = remaining;
        }
      }

      // must be an even number of digits
      var strLen = string.length;
      if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

      if (length > strLen / 2) {
        length = strLen / 2;
      }
      for (var i = 0; i < length; ++i) {
        var parsed = parseInt(string.substr(i * 2, 2), 16);
        if (isNaN(parsed)) return i
        buf[offset + i] = parsed;
      }
      return i
    }

    function utf8Write (buf, string, offset, length) {
      return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
    }

    function asciiWrite (buf, string, offset, length) {
      return blitBuffer(asciiToBytes(string), buf, offset, length)
    }

    function latin1Write (buf, string, offset, length) {
      return asciiWrite(buf, string, offset, length)
    }

    function base64Write (buf, string, offset, length) {
      return blitBuffer(base64ToBytes(string), buf, offset, length)
    }

    function ucs2Write (buf, string, offset, length) {
      return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
    }

    Buffer.prototype.write = function write (string, offset, length, encoding) {
      // Buffer#write(string)
      if (offset === undefined) {
        encoding = 'utf8';
        length = this.length;
        offset = 0;
      // Buffer#write(string, encoding)
      } else if (length === undefined && typeof offset === 'string') {
        encoding = offset;
        length = this.length;
        offset = 0;
      // Buffer#write(string, offset[, length][, encoding])
      } else if (isFinite(offset)) {
        offset = offset | 0;
        if (isFinite(length)) {
          length = length | 0;
          if (encoding === undefined) encoding = 'utf8';
        } else {
          encoding = length;
          length = undefined;
        }
      // legacy write(string, encoding, offset, length) - remove in v0.13
      } else {
        throw new Error(
          'Buffer.write(string, encoding, offset[, length]) is no longer supported'
        )
      }

      var remaining = this.length - offset;
      if (length === undefined || length > remaining) length = remaining;

      if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
        throw new RangeError('Attempt to write outside buffer bounds')
      }

      if (!encoding) encoding = 'utf8';

      var loweredCase = false;
      for (;;) {
        switch (encoding) {
          case 'hex':
            return hexWrite(this, string, offset, length)

          case 'utf8':
          case 'utf-8':
            return utf8Write(this, string, offset, length)

          case 'ascii':
            return asciiWrite(this, string, offset, length)

          case 'latin1':
          case 'binary':
            return latin1Write(this, string, offset, length)

          case 'base64':
            // Warning: maxLength not taken into account in base64Write
            return base64Write(this, string, offset, length)

          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return ucs2Write(this, string, offset, length)

          default:
            if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
            encoding = ('' + encoding).toLowerCase();
            loweredCase = true;
        }
      }
    };

    Buffer.prototype.toJSON = function toJSON () {
      return {
        type: 'Buffer',
        data: Array.prototype.slice.call(this._arr || this, 0)
      }
    };

    function base64Slice (buf, start, end) {
      if (start === 0 && end === buf.length) {
        return fromByteArray(buf)
      } else {
        return fromByteArray(buf.slice(start, end))
      }
    }

    function utf8Slice (buf, start, end) {
      end = Math.min(buf.length, end);
      var res = [];

      var i = start;
      while (i < end) {
        var firstByte = buf[i];
        var codePoint = null;
        var bytesPerSequence = (firstByte > 0xEF) ? 4
          : (firstByte > 0xDF) ? 3
          : (firstByte > 0xBF) ? 2
          : 1;

        if (i + bytesPerSequence <= end) {
          var secondByte, thirdByte, fourthByte, tempCodePoint;

          switch (bytesPerSequence) {
            case 1:
              if (firstByte < 0x80) {
                codePoint = firstByte;
              }
              break
            case 2:
              secondByte = buf[i + 1];
              if ((secondByte & 0xC0) === 0x80) {
                tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
                if (tempCodePoint > 0x7F) {
                  codePoint = tempCodePoint;
                }
              }
              break
            case 3:
              secondByte = buf[i + 1];
              thirdByte = buf[i + 2];
              if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
                if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                  codePoint = tempCodePoint;
                }
              }
              break
            case 4:
              secondByte = buf[i + 1];
              thirdByte = buf[i + 2];
              fourthByte = buf[i + 3];
              if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
                if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                  codePoint = tempCodePoint;
                }
              }
          }
        }

        if (codePoint === null) {
          // we did not generate a valid codePoint so insert a
          // replacement char (U+FFFD) and advance only 1 byte
          codePoint = 0xFFFD;
          bytesPerSequence = 1;
        } else if (codePoint > 0xFFFF) {
          // encode to utf16 (surrogate pair dance)
          codePoint -= 0x10000;
          res.push(codePoint >>> 10 & 0x3FF | 0xD800);
          codePoint = 0xDC00 | codePoint & 0x3FF;
        }

        res.push(codePoint);
        i += bytesPerSequence;
      }

      return decodeCodePointsArray(res)
    }

    // Based on http://stackoverflow.com/a/22747272/680742, the browser with
    // the lowest limit is Chrome, with 0x10000 args.
    // We go 1 magnitude less, for safety
    var MAX_ARGUMENTS_LENGTH = 0x1000;

    function decodeCodePointsArray (codePoints) {
      var len = codePoints.length;
      if (len <= MAX_ARGUMENTS_LENGTH) {
        return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
      }

      // Decode in chunks to avoid "call stack size exceeded".
      var res = '';
      var i = 0;
      while (i < len) {
        res += String.fromCharCode.apply(
          String,
          codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
        );
      }
      return res
    }

    function asciiSlice (buf, start, end) {
      var ret = '';
      end = Math.min(buf.length, end);

      for (var i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i] & 0x7F);
      }
      return ret
    }

    function latin1Slice (buf, start, end) {
      var ret = '';
      end = Math.min(buf.length, end);

      for (var i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i]);
      }
      return ret
    }

    function hexSlice (buf, start, end) {
      var len = buf.length;

      if (!start || start < 0) start = 0;
      if (!end || end < 0 || end > len) end = len;

      var out = '';
      for (var i = start; i < end; ++i) {
        out += toHex(buf[i]);
      }
      return out
    }

    function utf16leSlice (buf, start, end) {
      var bytes = buf.slice(start, end);
      var res = '';
      for (var i = 0; i < bytes.length; i += 2) {
        res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
      }
      return res
    }

    Buffer.prototype.slice = function slice (start, end) {
      var len = this.length;
      start = ~~start;
      end = end === undefined ? len : ~~end;

      if (start < 0) {
        start += len;
        if (start < 0) start = 0;
      } else if (start > len) {
        start = len;
      }

      if (end < 0) {
        end += len;
        if (end < 0) end = 0;
      } else if (end > len) {
        end = len;
      }

      if (end < start) end = start;

      var newBuf;
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        newBuf = this.subarray(start, end);
        newBuf.__proto__ = Buffer.prototype;
      } else {
        var sliceLen = end - start;
        newBuf = new Buffer(sliceLen, undefined);
        for (var i = 0; i < sliceLen; ++i) {
          newBuf[i] = this[i + start];
        }
      }

      return newBuf
    };

    /*
     * Need to make sure that buffer isn't trying to write out of bounds.
     */
    function checkOffset (offset, ext, length) {
      if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
      if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
    }

    Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
      offset = offset | 0;
      byteLength = byteLength | 0;
      if (!noAssert) checkOffset(offset, byteLength, this.length);

      var val = this[offset];
      var mul = 1;
      var i = 0;
      while (++i < byteLength && (mul *= 0x100)) {
        val += this[offset + i] * mul;
      }

      return val
    };

    Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
      offset = offset | 0;
      byteLength = byteLength | 0;
      if (!noAssert) {
        checkOffset(offset, byteLength, this.length);
      }

      var val = this[offset + --byteLength];
      var mul = 1;
      while (byteLength > 0 && (mul *= 0x100)) {
        val += this[offset + --byteLength] * mul;
      }

      return val
    };

    Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 1, this.length);
      return this[offset]
    };

    Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 2, this.length);
      return this[offset] | (this[offset + 1] << 8)
    };

    Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 2, this.length);
      return (this[offset] << 8) | this[offset + 1]
    };

    Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 4, this.length);

      return ((this[offset]) |
          (this[offset + 1] << 8) |
          (this[offset + 2] << 16)) +
          (this[offset + 3] * 0x1000000)
    };

    Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 4, this.length);

      return (this[offset] * 0x1000000) +
        ((this[offset + 1] << 16) |
        (this[offset + 2] << 8) |
        this[offset + 3])
    };

    Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
      offset = offset | 0;
      byteLength = byteLength | 0;
      if (!noAssert) checkOffset(offset, byteLength, this.length);

      var val = this[offset];
      var mul = 1;
      var i = 0;
      while (++i < byteLength && (mul *= 0x100)) {
        val += this[offset + i] * mul;
      }
      mul *= 0x80;

      if (val >= mul) val -= Math.pow(2, 8 * byteLength);

      return val
    };

    Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
      offset = offset | 0;
      byteLength = byteLength | 0;
      if (!noAssert) checkOffset(offset, byteLength, this.length);

      var i = byteLength;
      var mul = 1;
      var val = this[offset + --i];
      while (i > 0 && (mul *= 0x100)) {
        val += this[offset + --i] * mul;
      }
      mul *= 0x80;

      if (val >= mul) val -= Math.pow(2, 8 * byteLength);

      return val
    };

    Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 1, this.length);
      if (!(this[offset] & 0x80)) return (this[offset])
      return ((0xff - this[offset] + 1) * -1)
    };

    Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 2, this.length);
      var val = this[offset] | (this[offset + 1] << 8);
      return (val & 0x8000) ? val | 0xFFFF0000 : val
    };

    Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 2, this.length);
      var val = this[offset + 1] | (this[offset] << 8);
      return (val & 0x8000) ? val | 0xFFFF0000 : val
    };

    Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 4, this.length);

      return (this[offset]) |
        (this[offset + 1] << 8) |
        (this[offset + 2] << 16) |
        (this[offset + 3] << 24)
    };

    Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 4, this.length);

      return (this[offset] << 24) |
        (this[offset + 1] << 16) |
        (this[offset + 2] << 8) |
        (this[offset + 3])
    };

    Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 4, this.length);
      return read(this, offset, true, 23, 4)
    };

    Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 4, this.length);
      return read(this, offset, false, 23, 4)
    };

    Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 8, this.length);
      return read(this, offset, true, 52, 8)
    };

    Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 8, this.length);
      return read(this, offset, false, 52, 8)
    };

    function checkInt (buf, value, offset, ext, max, min) {
      if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
      if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
      if (offset + ext > buf.length) throw new RangeError('Index out of range')
    }

    Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
      value = +value;
      offset = offset | 0;
      byteLength = byteLength | 0;
      if (!noAssert) {
        var maxBytes = Math.pow(2, 8 * byteLength) - 1;
        checkInt(this, value, offset, byteLength, maxBytes, 0);
      }

      var mul = 1;
      var i = 0;
      this[offset] = value & 0xFF;
      while (++i < byteLength && (mul *= 0x100)) {
        this[offset + i] = (value / mul) & 0xFF;
      }

      return offset + byteLength
    };

    Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
      value = +value;
      offset = offset | 0;
      byteLength = byteLength | 0;
      if (!noAssert) {
        var maxBytes = Math.pow(2, 8 * byteLength) - 1;
        checkInt(this, value, offset, byteLength, maxBytes, 0);
      }

      var i = byteLength - 1;
      var mul = 1;
      this[offset + i] = value & 0xFF;
      while (--i >= 0 && (mul *= 0x100)) {
        this[offset + i] = (value / mul) & 0xFF;
      }

      return offset + byteLength
    };

    Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
      if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
      this[offset] = (value & 0xff);
      return offset + 1
    };

    function objectWriteUInt16 (buf, value, offset, littleEndian) {
      if (value < 0) value = 0xffff + value + 1;
      for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
        buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
          (littleEndian ? i : 1 - i) * 8;
      }
    }

    Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value & 0xff);
        this[offset + 1] = (value >>> 8);
      } else {
        objectWriteUInt16(this, value, offset, true);
      }
      return offset + 2
    };

    Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value >>> 8);
        this[offset + 1] = (value & 0xff);
      } else {
        objectWriteUInt16(this, value, offset, false);
      }
      return offset + 2
    };

    function objectWriteUInt32 (buf, value, offset, littleEndian) {
      if (value < 0) value = 0xffffffff + value + 1;
      for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
        buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff;
      }
    }

    Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset + 3] = (value >>> 24);
        this[offset + 2] = (value >>> 16);
        this[offset + 1] = (value >>> 8);
        this[offset] = (value & 0xff);
      } else {
        objectWriteUInt32(this, value, offset, true);
      }
      return offset + 4
    };

    Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value >>> 24);
        this[offset + 1] = (value >>> 16);
        this[offset + 2] = (value >>> 8);
        this[offset + 3] = (value & 0xff);
      } else {
        objectWriteUInt32(this, value, offset, false);
      }
      return offset + 4
    };

    Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) {
        var limit = Math.pow(2, 8 * byteLength - 1);

        checkInt(this, value, offset, byteLength, limit - 1, -limit);
      }

      var i = 0;
      var mul = 1;
      var sub = 0;
      this[offset] = value & 0xFF;
      while (++i < byteLength && (mul *= 0x100)) {
        if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
          sub = 1;
        }
        this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
      }

      return offset + byteLength
    };

    Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) {
        var limit = Math.pow(2, 8 * byteLength - 1);

        checkInt(this, value, offset, byteLength, limit - 1, -limit);
      }

      var i = byteLength - 1;
      var mul = 1;
      var sub = 0;
      this[offset + i] = value & 0xFF;
      while (--i >= 0 && (mul *= 0x100)) {
        if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
          sub = 1;
        }
        this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
      }

      return offset + byteLength
    };

    Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
      if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
      if (value < 0) value = 0xff + value + 1;
      this[offset] = (value & 0xff);
      return offset + 1
    };

    Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value & 0xff);
        this[offset + 1] = (value >>> 8);
      } else {
        objectWriteUInt16(this, value, offset, true);
      }
      return offset + 2
    };

    Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value >>> 8);
        this[offset + 1] = (value & 0xff);
      } else {
        objectWriteUInt16(this, value, offset, false);
      }
      return offset + 2
    };

    Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value & 0xff);
        this[offset + 1] = (value >>> 8);
        this[offset + 2] = (value >>> 16);
        this[offset + 3] = (value >>> 24);
      } else {
        objectWriteUInt32(this, value, offset, true);
      }
      return offset + 4
    };

    Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
      if (value < 0) value = 0xffffffff + value + 1;
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value >>> 24);
        this[offset + 1] = (value >>> 16);
        this[offset + 2] = (value >>> 8);
        this[offset + 3] = (value & 0xff);
      } else {
        objectWriteUInt32(this, value, offset, false);
      }
      return offset + 4
    };

    function checkIEEE754 (buf, value, offset, ext, max, min) {
      if (offset + ext > buf.length) throw new RangeError('Index out of range')
      if (offset < 0) throw new RangeError('Index out of range')
    }

    function writeFloat (buf, value, offset, littleEndian, noAssert) {
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 4);
      }
      write(buf, value, offset, littleEndian, 23, 4);
      return offset + 4
    }

    Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
      return writeFloat(this, value, offset, true, noAssert)
    };

    Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
      return writeFloat(this, value, offset, false, noAssert)
    };

    function writeDouble (buf, value, offset, littleEndian, noAssert) {
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 8);
      }
      write(buf, value, offset, littleEndian, 52, 8);
      return offset + 8
    }

    Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
      return writeDouble(this, value, offset, true, noAssert)
    };

    Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
      return writeDouble(this, value, offset, false, noAssert)
    };

    // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
    Buffer.prototype.copy = function copy (target, targetStart, start, end) {
      if (!start) start = 0;
      if (!end && end !== 0) end = this.length;
      if (targetStart >= target.length) targetStart = target.length;
      if (!targetStart) targetStart = 0;
      if (end > 0 && end < start) end = start;

      // Copy 0 bytes; we're done
      if (end === start) return 0
      if (target.length === 0 || this.length === 0) return 0

      // Fatal error conditions
      if (targetStart < 0) {
        throw new RangeError('targetStart out of bounds')
      }
      if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
      if (end < 0) throw new RangeError('sourceEnd out of bounds')

      // Are we oob?
      if (end > this.length) end = this.length;
      if (target.length - targetStart < end - start) {
        end = target.length - targetStart + start;
      }

      var len = end - start;
      var i;

      if (this === target && start < targetStart && targetStart < end) {
        // descending copy from end
        for (i = len - 1; i >= 0; --i) {
          target[i + targetStart] = this[i + start];
        }
      } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
        // ascending copy from start
        for (i = 0; i < len; ++i) {
          target[i + targetStart] = this[i + start];
        }
      } else {
        Uint8Array.prototype.set.call(
          target,
          this.subarray(start, start + len),
          targetStart
        );
      }

      return len
    };

    // Usage:
    //    buffer.fill(number[, offset[, end]])
    //    buffer.fill(buffer[, offset[, end]])
    //    buffer.fill(string[, offset[, end]][, encoding])
    Buffer.prototype.fill = function fill (val, start, end, encoding) {
      // Handle string cases:
      if (typeof val === 'string') {
        if (typeof start === 'string') {
          encoding = start;
          start = 0;
          end = this.length;
        } else if (typeof end === 'string') {
          encoding = end;
          end = this.length;
        }
        if (val.length === 1) {
          var code = val.charCodeAt(0);
          if (code < 256) {
            val = code;
          }
        }
        if (encoding !== undefined && typeof encoding !== 'string') {
          throw new TypeError('encoding must be a string')
        }
        if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
          throw new TypeError('Unknown encoding: ' + encoding)
        }
      } else if (typeof val === 'number') {
        val = val & 255;
      }

      // Invalid ranges are not set to a default, so can range check early.
      if (start < 0 || this.length < start || this.length < end) {
        throw new RangeError('Out of range index')
      }

      if (end <= start) {
        return this
      }

      start = start >>> 0;
      end = end === undefined ? this.length : end >>> 0;

      if (!val) val = 0;

      var i;
      if (typeof val === 'number') {
        for (i = start; i < end; ++i) {
          this[i] = val;
        }
      } else {
        var bytes = internalIsBuffer(val)
          ? val
          : utf8ToBytes(new Buffer(val, encoding).toString());
        var len = bytes.length;
        for (i = 0; i < end - start; ++i) {
          this[i + start] = bytes[i % len];
        }
      }

      return this
    };

    // HELPER FUNCTIONS
    // ================

    var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

    function base64clean (str) {
      // Node strips out invalid characters like \n and \t from the string, base64-js does not
      str = stringtrim(str).replace(INVALID_BASE64_RE, '');
      // Node converts strings with length < 2 to ''
      if (str.length < 2) return ''
      // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
      while (str.length % 4 !== 0) {
        str = str + '=';
      }
      return str
    }

    function stringtrim (str) {
      if (str.trim) return str.trim()
      return str.replace(/^\s+|\s+$/g, '')
    }

    function toHex (n) {
      if (n < 16) return '0' + n.toString(16)
      return n.toString(16)
    }

    function utf8ToBytes (string, units) {
      units = units || Infinity;
      var codePoint;
      var length = string.length;
      var leadSurrogate = null;
      var bytes = [];

      for (var i = 0; i < length; ++i) {
        codePoint = string.charCodeAt(i);

        // is surrogate component
        if (codePoint > 0xD7FF && codePoint < 0xE000) {
          // last char was a lead
          if (!leadSurrogate) {
            // no lead yet
            if (codePoint > 0xDBFF) {
              // unexpected trail
              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
              continue
            } else if (i + 1 === length) {
              // unpaired lead
              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
              continue
            }

            // valid lead
            leadSurrogate = codePoint;

            continue
          }

          // 2 leads in a row
          if (codePoint < 0xDC00) {
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            leadSurrogate = codePoint;
            continue
          }

          // valid surrogate pair
          codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
        } else if (leadSurrogate) {
          // valid bmp char, but last char was a lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
        }

        leadSurrogate = null;

        // encode utf8
        if (codePoint < 0x80) {
          if ((units -= 1) < 0) break
          bytes.push(codePoint);
        } else if (codePoint < 0x800) {
          if ((units -= 2) < 0) break
          bytes.push(
            codePoint >> 0x6 | 0xC0,
            codePoint & 0x3F | 0x80
          );
        } else if (codePoint < 0x10000) {
          if ((units -= 3) < 0) break
          bytes.push(
            codePoint >> 0xC | 0xE0,
            codePoint >> 0x6 & 0x3F | 0x80,
            codePoint & 0x3F | 0x80
          );
        } else if (codePoint < 0x110000) {
          if ((units -= 4) < 0) break
          bytes.push(
            codePoint >> 0x12 | 0xF0,
            codePoint >> 0xC & 0x3F | 0x80,
            codePoint >> 0x6 & 0x3F | 0x80,
            codePoint & 0x3F | 0x80
          );
        } else {
          throw new Error('Invalid code point')
        }
      }

      return bytes
    }

    function asciiToBytes (str) {
      var byteArray = [];
      for (var i = 0; i < str.length; ++i) {
        // Node's code seems to be doing this and not & 0x7F..
        byteArray.push(str.charCodeAt(i) & 0xFF);
      }
      return byteArray
    }

    function utf16leToBytes (str, units) {
      var c, hi, lo;
      var byteArray = [];
      for (var i = 0; i < str.length; ++i) {
        if ((units -= 2) < 0) break

        c = str.charCodeAt(i);
        hi = c >> 8;
        lo = c % 256;
        byteArray.push(lo);
        byteArray.push(hi);
      }

      return byteArray
    }


    function base64ToBytes (str) {
      return toByteArray(base64clean(str))
    }

    function blitBuffer (src, dst, offset, length) {
      for (var i = 0; i < length; ++i) {
        if ((i + offset >= dst.length) || (i >= src.length)) break
        dst[i + offset] = src[i];
      }
      return i
    }

    function isnan (val) {
      return val !== val // eslint-disable-line no-self-compare
    }


    // the following is from is-buffer, also by Feross Aboukhadijeh and with same lisence
    // The _isBuffer check is for Safari 5-7 support, because it's missing
    // Object.prototype.constructor. Remove this eventually
    function isBuffer(obj) {
      return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj))
    }

    function isFastBuffer (obj) {
      return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
    }

    // For Node v0.10 support. Remove this eventually.
    function isSlowBuffer (obj) {
      return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isFastBuffer(obj.slice(0, 0))
    }

    var commonjsGlobal$1 = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof commonjsGlobal !== 'undefined' ? commonjsGlobal : typeof self !== 'undefined' ? self : {};

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    function getCjsExportFromNamespace (n) {
    	return n && n['default'] || n;
    }

    var dist = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
         factory(exports) ;
    }(commonjsGlobal$1, (function (exports) {
        class ValidateTypes {
          constructor() {}

          getType(value) {
            return Object.prototype.toString.call(value);
          }

          getClassName(value) {
            try {
              return value.constructor.name;
            } catch (e) {}

            return this.getType(value);
          } //Validation functions


          isObject(value) {
            if (this.getType(value) === "[object Object]") return true;
            return false;
          }

          isFunction(value) {
            if (this.getType(value) === "[object Function]") return true;
            return false;
          }

          isString(value) {
            if (this.getType(value) === "[object String]") return true;
            return false;
          }

          isBoolean(value) {
            if (this.getType(value) === "[object Boolean]") return true;
            return false;
          }

          isArray(value) {
            if (this.getType(value) === "[object Array]") return true;
            return false;
          }

          isNumber(value) {
            if (this.getType(value) === "[object Number]") return true;
            return false;
          }

          isInteger(value) {
            if (this.getType(value) === "[object Number]" && Number.isInteger(value)) return true;
            return false;
          }

          isRegEx(value) {
            if (this.getType(value) === "[object RegExp]") return true;
            return false;
          }

          isStringHex(value) {
            if (!this.isStringWithValue(value)) return false;
            let hexRegEx = /([0-9]|[a-f])/gim;
            return (value.match(hexRegEx) || []).length === value.length;
          }

          hasKeys(value, keys) {
            if (keys.map(key => key in value).includes(false)) return false;
            return true;
          }

          isStringWithValue(value) {
            if (this.isString(value) && value !== '') return true;
            return false;
          }

          isObjectWithKeys(value) {
            if (this.isObject(value) && Object.keys(value).length > 0) return true;
            return false;
          }

          isArrayWithValues(value) {
            if (this.isArray(value) && value.length > 0) return true;
            return false;
          }

          isSpecificClass(value, className) {
            if (!this.isObject(value)) return false;
            if (this.getClassName(value) !== className) return false;
            return true;
          }

        }

        class AssertTypes {
          constructor() {
            this.validate = new ValidateTypes();
          } //Validation functions


          isObject(value) {
            if (!this.validate.isObject(value)) {
              throw new TypeError(`Expected type [object Object] but got ${this.validate.getType(value)}`);
            }

            return true;
          }

          isFunction(value) {
            if (!this.validate.isFunction(value)) {
              throw new TypeError(`Expected type [object Function] but got ${this.validate.getType(value)}`);
            }

            return true;
          }

          isString(value) {
            if (!this.validate.isString(value)) {
              throw new TypeError(`Expected type [object String] but got ${this.validate.getType(value)}`);
            }

            return true;
          }

          isBoolean(value) {
            if (!this.validate.isBoolean(value)) {
              throw new TypeError(`Expected type [object Boolean] but got ${this.validate.getType(value)}`);
            }

            return true;
          }

          isArray(value) {
            if (!this.validate.isArray(value)) {
              throw new TypeError(`Expected type [object Array] but got ${this.validate.getType(value)}`);
            }

            return true;
          }

          isNumber(value) {
            if (!this.validate.isNumber(value)) {
              throw new TypeError(`Expected type [object Number] but got ${this.validate.getType(value)}`);
            }

            return true;
          }

          isInteger(value) {
            if (!this.validate.isInteger(value)) {
              throw new TypeError(`Expected "${value}" to be an integer but got non-integer value`);
            }

            return true;
          }

          isRegEx(value) {
            if (!this.validate.isRegEx(value)) {
              throw new TypeError(`Expected type [object RegExp] but got ${this.validate.getType(value)}`);
            }

            return true;
          }

          isStringHex(value) {
            if (!this.validate.isStringHex(value)) {
              throw new TypeError(`Expected "${value}" to be hex but got non-hex value`);
            }

            return true;
          }

          hasKeys(value, keys) {
            if (!this.validate.hasKeys(value, keys)) {
              throw new TypeError(`Provided object does not contain all keys ${JSON.stringify(keys)}`);
            }

            return true;
          }

          isStringWithValue(value) {
            if (!this.validate.isStringWithValue(value)) {
              throw new TypeError(`Expected "${value}" to be [object String] and not empty`);
            }

            return true;
          }

          isObjectWithKeys(value) {
            if (!this.validate.isObjectWithKeys(value)) {
              throw new TypeError(`Expected "${value}" to be [object Object] and have keys`);
            }

            return true;
          }

          isArrayWithValues(value) {
            if (!this.validate.isArrayWithValues(value)) {
              throw new TypeError(`Expected "${value}" to be [object Array] and not empty`);
            }

            return true;
          }

          isSpecificClass(value, className) {
            if (!this.validate.isSpecificClass(value, className)) {
              throw new TypeError(`Expected Object Class to be "${className}" but got ${this.validate.getClassName(value)}`);
            }

            return true;
          }

        }

        const validateTypes = new ValidateTypes();
        const assertTypes = new AssertTypes();

        exports.assertTypes = assertTypes;
        exports.validateTypes = validateTypes;

        Object.defineProperty(exports, '__esModule', { value: true });

    })));
    });

    var validators = unwrapExports(dist);


    const { CryptoJS, JsonFormatter } = cryptojs;

    const { validateTypes, assertTypes } = dist$1;

    /**
        * Encrypt a Javascript object with a string password
        * The object passed must pass JSON.stringify or the method will fail.
        * 
        * @param {string} password  A password to encrypt the object with
        * @param {Object} obj A javascript object (must be JSON compatible)
        * @return {string} Encrypted string
     */
    function encryptObject ( password, obj ){
        assertTypes.isStringWithValue(password);
        assertTypes.isObject(obj);

        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(obj), password, { format: JsonFormatter }).toString();
        return encrypted;
    }
    /**
        *  Decrypt an Object using a password string 
        * 
        *  @param {string} password  A password to encrypt the object with
        *  @param {string} objString A javascript object as JSON string
        *  @return {string} Encrypted string
    */
    function decryptObject ( password, objString ) {
        assertTypes.isStringWithValue(password);
        assertTypes.isStringWithValue(objString);

        try{
            const decrypt = CryptoJS.AES.decrypt(objString, password, { format: JsonFormatter });
            return JSON.parse(CryptoJS.enc.Utf8.stringify(decrypt));
        } catch (e){
            return false;
        }
    }
    /**
        * Encrypt a string using a password string 
        *
        * @param {string} password  A password to encrypt the object with
        * @param {string} string A string to be password encrypted
        * @return {string} Encrypted string
    */
    function encryptStrHash( password, string ){
        assertTypes.isStringWithValue(password);
        assertTypes.isString(string);

        const encrypt = CryptoJS.AES.encrypt(string, password).toString();
        return encrypt;
    }
    /**
        * Decrypt a string using a password string
        *
        * @param {string} password  A password to encrypt the object with
        * @param {string} encryptedString A string to decrypt
        * @return {string} Decrypted string
    */
    function decryptStrHash ( password, encryptedString ){
        assertTypes.isStringWithValue(password);
        assertTypes.isStringWithValue(encryptedString);
        
        try{
            const decrypted = CryptoJS.AES.decrypt(encryptedString, password);
            return CryptoJS.enc.Utf8.stringify(decrypted) === '' ? false : CryptoJS.enc.Utf8.stringify(decrypted);
        } catch (e) {
            return false;
        }
    }
    function buf2hex(buffer) {
        return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
    }
    function hex2buf(hexString) {
        var bytes = new Uint8Array(Math.ceil(hexString.length / 2));
        for (var i = 0; i < bytes.length; i++)
            bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
        return bytes;
    }
    function str2buf(string) {
        var buf = new Buffer.from(string);
        return new Uint8Array(buf);
    }
    function concatUint8Arrays(array1, array2) {
        var arr = new Uint8Array(array1.length + array2.length);
        arr.set(array1);
        arr.set(array2, array1.length);
        return arr;
    }
    function ab2str(buf) {
        return String.fromCharCode.apply(null, new Uint8Array(buf));
    }
    function str2ab(str) {
        var buf = new ArrayBuffer(str.length);
        var bufView = new Uint8Array(buf);
        for (var i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }
    function str2hex(str) {
        var hex = '';
        for (var i = 0; i < str.length; i++) {
            hex += '' + str.charCodeAt(i).toString(16);
        }
        return hex;
    }
    function hex2str(hexx) {
        var hex = hexx.toString(); //force conversion
        var str = '';
        for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        return str;
    }
    function randomString(length) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    function isStringHex(string = '') {
        let hexRegEx = /([0-9]|[a-f])/gim;
        return typeof string === 'string' &&
            (string.match(hexRegEx) || []).length === string.length;
    }

    function isLamdenKey( string ){
        if (validateTypes.isStringHex(string) && string.length === 64) return true;
        return false;
    }

    var utils = /*#__PURE__*/Object.freeze({
                __proto__: null,
                encryptObject: encryptObject,
                decryptObject: decryptObject,
                encryptStrHash: encryptStrHash,
                decryptStrHash: decryptStrHash,
                buf2hex: buf2hex,
                hex2buf: hex2buf,
                str2buf: str2buf,
                concatUint8Arrays: concatUint8Arrays,
                ab2str: ab2str,
                str2ab: str2ab,
                str2hex: str2hex,
                hex2str: hex2str,
                randomString: randomString,
                isStringHex: isStringHex,
                isLamdenKey: isLamdenKey
    });



    /**
        * Create a wallet object for signing and verifying messages
        * 
        * @param {Object} [args={}] Args Object
        * @param {string} [args.sk=undefined] A 32 character long hex representation of a signing key (private key) to create wallet from
        * @param {Uint8Array(length: 32)} [args.seed=null] A Uint8Array with a length of 32 to seed the keyPair with. This is advanced behavior and should be avoided by everyday users
        * @param {boolean} [args.keepPrivate=false] No direct access to the sk. Will still allow the wallet to sign messages
        * @return {Object} Wallet Object with sign and verify methods
     */
    let create_wallet = (args = {}) => {
        let { sk = undefined, keepPrivate = false, seed = null } = args;

        let vk;

        if (sk) {
            vk = get_vk(sk);
        }else {
            let keyPair = new_wallet(seed);
            vk = keyPair.vk;
            sk = keyPair.sk;
        }

        const wallet = () => {
            return {
                sign: (msg) => sign(sk, msg),
                verify: (msg, sig) => verify(vk, msg, sig),
                vk,
                sk: !keepPrivate ? sk : undefined
            }
        };

        return wallet()
    };

    /**
     * @param Uint8Array(length: 32) seed
     *      seed:   A Uint8Array with a length of 32 to seed the keyPair with. This is advanced behavior and should be
     *              avoided by everyday users
     *
     * @return {Uint8Array(length: 32), Uint8Array(length: 32)} { vk, sk }
     *      sk:     Signing Key (SK) represents 32 byte signing key
     *      vk:     Verify Key (VK) represents a 32 byte verify key
     */
    function generate_keys(seed = null) {
        var kp = null;
        if (seed == null) {
            kp = naclFast.sign.keyPair();
        }
        else {
            kp = naclFast.sign.keyPair.fromSeed(seed);
        }
        // In the JS implementation of the NaCL library the sk is the first 32 bytes of the secretKey
        // and the vk is the last 32 bytes of the secretKey as well as the publicKey
        // {
        //   'publicKey': <vk>,
        //   'secretKey': <sk><vk>
        // }
        return {
            sk: new Uint8Array(kp['secretKey'].slice(0, 32)),
            vk: new Uint8Array(kp['secretKey'].slice(32, 64))
        };
    }
    /**
     * @param String sk
     *      sk:     A 64 character long hex representation of a signing key (private key)
     *
     * @return String vk
     *      vk:     A 64 character long hex representation of a verify key (public key)
     */
    function get_vk(sk) {
        var kp = format_to_keys(sk);
        var kpf = keys_to_format(kp);
        return kpf.vk;
    }
    /**
     * @param String sk
     *      sk:     A 64 character long hex representation of a signing key (private key)
     *
     * @return {Uint8Array(length: 32), Uint8Array(length: 32)} { vk, sk }
     *      sk:     Signing Key (SK) represents 32 byte signing key
     *      vk:     Verify Key (VK) represents a 32 byte verify key
     */
    function format_to_keys(sk) {
        var skf = hex2buf(sk);
        var kp = generate_keys(skf);
        return kp;
    }
    /**
     * @param Object kp
     *      kp:     Object containing the properties sk and vk
     *          sk:     Signing Key (SK) represents 32 byte signing key
     *          vk:     Verify Key (VK) represents a 32 byte verify key
     *
     * @return {string, string} { sk, vk }
     *      sk:     Signing Key (SK) represented as a 64 character hex string
     *      vk:     Verify Key (VK) represented as a 64 character hex string
     */
    function keys_to_format(kp) {
        return {
            vk: buf2hex(kp.vk),
            sk: buf2hex(kp.sk)
        };
    }
    /**
     * @param Uint8Array(length: 32) seed
     *      seed:   A Uint8Array with a length of 32 to seed the keyPair with. This is advanced behavior and should be
     *              avoided by everyday users
     *
     * @return {string, string} { sk, vk }
     *      sk:     Signing Key (SK) represented as a 64 character hex string
     *      vk:     Verify Key (VK) represented as a 64 character hex string
     */
    function new_wallet(seed = null) {
        const keys = generate_keys(seed);
        return keys_to_format(keys);
    }
    /**
     * @param String sk
     * @param Uint8Array msg
     *      sk:     A 64 character long hex representation of a signing key (private key)
     *      msg:    A Uint8Array of bytes representing the message you would like to sign
     *
     * @return String sig
     *      sig:    A 128 character long hex string representing the message's signature
     */
    function sign(sk, msg) {
        var kp = format_to_keys(sk);
        // This is required due to the secretKey required to sign a transaction
        // in the js implementation of NaCL being the combination of the sk and
        // vk for some stupid reason. That being said, we still want the sk and
        // vk objects to exist in 32-byte string format (same as cilantro's
        // python implementation) when presented to the user.
        var jsnacl_sk = concatUint8Arrays(kp.sk, kp.vk);
        return buf2hex(naclFast.sign.detached(msg, jsnacl_sk));
    }
    /**
     * @param String vk
     * @param Uint8Array msg
     * @param String sig
     *      vk:     A 64 character long hex representation of a verify key (public key)
     *      msg:    A Uint8Array (bytes) representation of a message that has been signed
     *      sig:    A 128 character long hex representation of a nacl signature
     *
     * @return Bool result
     *      result: true if verify checked out, false if not
     */
    function verify(vk, msg, sig) {
        var vkb = hex2buf(vk);
        var sigb = hex2buf(sig);
        try {
            return naclFast.sign.detached.verify(msg, sigb, vkb);
        }
        catch (_a) {
            return false;
        }
    }

    var wallet = /*#__PURE__*/Object.freeze({
                __proto__: null,
                create_wallet: create_wallet,
                generate_keys: generate_keys,
                get_vk: get_vk,
                format_to_keys: format_to_keys,
                keys_to_format: keys_to_format,
                new_wallet: new_wallet,
                sign: sign,
                verify: verify
    });

    class EventEmitter {
        constructor() {
          this._events = {};
        }
      
        on(name, listener) {
            if (!this._events[name]) {
                this._events[name] = [];
            }

            this._events[name].push(listener);
        }
      
        removeListener(name, listenerToRemove) {
            if (!this._events[name]) {
                throw new Error(`Can't remove a listener. Event "${name}" doesn't exits.`);
            }

            const filterListeners = (listener) => listener !== listenerToRemove;
            this._events[name] = this._events[name].filter(filterListeners);
        }
      
        emit(name, data) {
            if (!this._events[name]) return
      
                const fireCallbacks = (callback) => {
                    callback(data);
                };
            
                this._events[name].forEach(fireCallbacks);
            }
        }

    /*
     *      bignumber.js v9.0.0
     *      A JavaScript library for arbitrary-precision arithmetic.
     *      https://github.com/MikeMcl/bignumber.js
     *      Copyright (c) 2019 Michael Mclaughlin <M8ch88l@gmail.com>
     *      MIT Licensed.
     *
     *      BigNumber.prototype methods     |  BigNumber methods
     *                                      |
     *      absoluteValue            abs    |  clone
     *      comparedTo                      |  config               set
     *      decimalPlaces            dp     |      DECIMAL_PLACES
     *      dividedBy                div    |      ROUNDING_MODE
     *      dividedToIntegerBy       idiv   |      EXPONENTIAL_AT
     *      exponentiatedBy          pow    |      RANGE
     *      integerValue                    |      CRYPTO
     *      isEqualTo                eq     |      MODULO_MODE
     *      isFinite                        |      POW_PRECISION
     *      isGreaterThan            gt     |      FORMAT
     *      isGreaterThanOrEqualTo   gte    |      ALPHABET
     *      isInteger                       |  isBigNumber
     *      isLessThan               lt     |  maximum              max
     *      isLessThanOrEqualTo      lte    |  minimum              min
     *      isNaN                           |  random
     *      isNegative                      |  sum
     *      isPositive                      |
     *      isZero                          |
     *      minus                           |
     *      modulo                   mod    |
     *      multipliedBy             times  |
     *      negated                         |
     *      plus                            |
     *      precision                sd     |
     *      shiftedBy                       |
     *      squareRoot               sqrt   |
     *      toExponential                   |
     *      toFixed                         |
     *      toFormat                        |
     *      toFraction                      |
     *      toJSON                          |
     *      toNumber                        |
     *      toPrecision                     |
     *      toString                        |
     *      valueOf                         |
     *
     */


    var
      isNumeric = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i,

      mathceil = Math.ceil,
      mathfloor = Math.floor,

      bignumberError = '[BigNumber Error] ',
      tooManyDigits = bignumberError + 'Number primitive has more than 15 significant digits: ',

      BASE = 1e14,
      LOG_BASE = 14,
      MAX_SAFE_INTEGER = 0x1fffffffffffff,         // 2^53 - 1
      // MAX_INT32 = 0x7fffffff,                   // 2^31 - 1
      POWS_TEN = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13],
      SQRT_BASE = 1e7,

      // EDITABLE
      // The limit on the value of DECIMAL_PLACES, TO_EXP_NEG, TO_EXP_POS, MIN_EXP, MAX_EXP, and
      // the arguments to toExponential, toFixed, toFormat, and toPrecision.
      MAX = 1E9;                                   // 0 to MAX_INT32


    /*
     * Create and return a BigNumber constructor.
     */
    function clone(configObject) {
      var div, convertBase, parseNumeric,
        P = BigNumber.prototype = { constructor: BigNumber, toString: null, valueOf: null },
        ONE = new BigNumber(1),


        //----------------------------- EDITABLE CONFIG DEFAULTS -------------------------------


        // The default values below must be integers within the inclusive ranges stated.
        // The values can also be changed at run-time using BigNumber.set.

        // The maximum number of decimal places for operations involving division.
        DECIMAL_PLACES = 20,                     // 0 to MAX

        // The rounding mode used when rounding to the above decimal places, and when using
        // toExponential, toFixed, toFormat and toPrecision, and round (default value).
        // UP         0 Away from zero.
        // DOWN       1 Towards zero.
        // CEIL       2 Towards +Infinity.
        // FLOOR      3 Towards -Infinity.
        // HALF_UP    4 Towards nearest neighbour. If equidistant, up.
        // HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
        // HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
        // HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
        // HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
        ROUNDING_MODE = 4,                       // 0 to 8

        // EXPONENTIAL_AT : [TO_EXP_NEG , TO_EXP_POS]

        // The exponent value at and beneath which toString returns exponential notation.
        // Number type: -7
        TO_EXP_NEG = -7,                         // 0 to -MAX

        // The exponent value at and above which toString returns exponential notation.
        // Number type: 21
        TO_EXP_POS = 21,                         // 0 to MAX

        // RANGE : [MIN_EXP, MAX_EXP]

        // The minimum exponent value, beneath which underflow to zero occurs.
        // Number type: -324  (5e-324)
        MIN_EXP = -1e7,                          // -1 to -MAX

        // The maximum exponent value, above which overflow to Infinity occurs.
        // Number type:  308  (1.7976931348623157e+308)
        // For MAX_EXP > 1e7, e.g. new BigNumber('1e100000000').plus(1) may be slow.
        MAX_EXP = 1e7,                           // 1 to MAX

        // Whether to use cryptographically-secure random number generation, if available.
        CRYPTO = false,                          // true or false

        // The modulo mode used when calculating the modulus: a mod n.
        // The quotient (q = a / n) is calculated according to the corresponding rounding mode.
        // The remainder (r) is calculated as: r = a - n * q.
        //
        // UP        0 The remainder is positive if the dividend is negative, else is negative.
        // DOWN      1 The remainder has the same sign as the dividend.
        //             This modulo mode is commonly known as 'truncated division' and is
        //             equivalent to (a % n) in JavaScript.
        // FLOOR     3 The remainder has the same sign as the divisor (Python %).
        // HALF_EVEN 6 This modulo mode implements the IEEE 754 remainder function.
        // EUCLID    9 Euclidian division. q = sign(n) * floor(a / abs(n)).
        //             The remainder is always positive.
        //
        // The truncated division, floored division, Euclidian division and IEEE 754 remainder
        // modes are commonly used for the modulus operation.
        // Although the other rounding modes can also be used, they may not give useful results.
        MODULO_MODE = 1,                         // 0 to 9

        // The maximum number of significant digits of the result of the exponentiatedBy operation.
        // If POW_PRECISION is 0, there will be unlimited significant digits.
        POW_PRECISION = 0,                    // 0 to MAX

        // The format specification used by the BigNumber.prototype.toFormat method.
        FORMAT = {
          prefix: '',
          groupSize: 3,
          secondaryGroupSize: 0,
          groupSeparator: ',',
          decimalSeparator: '.',
          fractionGroupSize: 0,
          fractionGroupSeparator: '\xA0',      // non-breaking space
          suffix: ''
        },

        // The alphabet used for base conversion. It must be at least 2 characters long, with no '+',
        // '-', '.', whitespace, or repeated character.
        // '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_'
        ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';


      //------------------------------------------------------------------------------------------


      // CONSTRUCTOR


      /*
       * The BigNumber constructor and exported function.
       * Create and return a new instance of a BigNumber object.
       *
       * v {number|string|BigNumber} A numeric value.
       * [b] {number} The base of v. Integer, 2 to ALPHABET.length inclusive.
       */
      function BigNumber(v, b) {
        var alphabet, c, caseChanged, e, i, isNum, len, str,
          x = this;

        // Enable constructor call without `new`.
        if (!(x instanceof BigNumber)) return new BigNumber(v, b);

        if (b == null) {

          if (v && v._isBigNumber === true) {
            x.s = v.s;

            if (!v.c || v.e > MAX_EXP) {
              x.c = x.e = null;
            } else if (v.e < MIN_EXP) {
              x.c = [x.e = 0];
            } else {
              x.e = v.e;
              x.c = v.c.slice();
            }

            return;
          }

          if ((isNum = typeof v == 'number') && v * 0 == 0) {

            // Use `1 / n` to handle minus zero also.
            x.s = 1 / v < 0 ? (v = -v, -1) : 1;

            // Fast path for integers, where n < 2147483648 (2**31).
            if (v === ~~v) {
              for (e = 0, i = v; i >= 10; i /= 10, e++);

              if (e > MAX_EXP) {
                x.c = x.e = null;
              } else {
                x.e = e;
                x.c = [v];
              }

              return;
            }

            str = String(v);
          } else {

            if (!isNumeric.test(str = String(v))) return parseNumeric(x, str, isNum);

            x.s = str.charCodeAt(0) == 45 ? (str = str.slice(1), -1) : 1;
          }

          // Decimal point?
          if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');

          // Exponential form?
          if ((i = str.search(/e/i)) > 0) {

            // Determine exponent.
            if (e < 0) e = i;
            e += +str.slice(i + 1);
            str = str.substring(0, i);
          } else if (e < 0) {

            // Integer.
            e = str.length;
          }

        } else {

          // '[BigNumber Error] Base {not a primitive number|not an integer|out of range}: {b}'
          intCheck(b, 2, ALPHABET.length, 'Base');

          // Allow exponential notation to be used with base 10 argument, while
          // also rounding to DECIMAL_PLACES as with other bases.
          if (b == 10) {
            x = new BigNumber(v);
            return round(x, DECIMAL_PLACES + x.e + 1, ROUNDING_MODE);
          }

          str = String(v);

          if (isNum = typeof v == 'number') {

            // Avoid potential interpretation of Infinity and NaN as base 44+ values.
            if (v * 0 != 0) return parseNumeric(x, str, isNum, b);

            x.s = 1 / v < 0 ? (str = str.slice(1), -1) : 1;

            // '[BigNumber Error] Number primitive has more than 15 significant digits: {n}'
            if (BigNumber.DEBUG && str.replace(/^0\.0*|\./, '').length > 15) {
              throw Error
               (tooManyDigits + v);
            }
          } else {
            x.s = str.charCodeAt(0) === 45 ? (str = str.slice(1), -1) : 1;
          }

          alphabet = ALPHABET.slice(0, b);
          e = i = 0;

          // Check that str is a valid base b number.
          // Don't use RegExp, so alphabet can contain special characters.
          for (len = str.length; i < len; i++) {
            if (alphabet.indexOf(c = str.charAt(i)) < 0) {
              if (c == '.') {

                // If '.' is not the first character and it has not be found before.
                if (i > e) {
                  e = len;
                  continue;
                }
              } else if (!caseChanged) {

                // Allow e.g. hexadecimal 'FF' as well as 'ff'.
                if (str == str.toUpperCase() && (str = str.toLowerCase()) ||
                    str == str.toLowerCase() && (str = str.toUpperCase())) {
                  caseChanged = true;
                  i = -1;
                  e = 0;
                  continue;
                }
              }

              return parseNumeric(x, String(v), isNum, b);
            }
          }

          // Prevent later check for length on converted number.
          isNum = false;
          str = convertBase(str, b, 10, x.s);

          // Decimal point?
          if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');
          else e = str.length;
        }

        // Determine leading zeros.
        for (i = 0; str.charCodeAt(i) === 48; i++);

        // Determine trailing zeros.
        for (len = str.length; str.charCodeAt(--len) === 48;);

        if (str = str.slice(i, ++len)) {
          len -= i;

          // '[BigNumber Error] Number primitive has more than 15 significant digits: {n}'
          if (isNum && BigNumber.DEBUG &&
            len > 15 && (v > MAX_SAFE_INTEGER || v !== mathfloor(v))) {
              throw Error
               (tooManyDigits + (x.s * v));
          }

           // Overflow?
          if ((e = e - i - 1) > MAX_EXP) {

            // Infinity.
            x.c = x.e = null;

          // Underflow?
          } else if (e < MIN_EXP) {

            // Zero.
            x.c = [x.e = 0];
          } else {
            x.e = e;
            x.c = [];

            // Transform base

            // e is the base 10 exponent.
            // i is where to slice str to get the first element of the coefficient array.
            i = (e + 1) % LOG_BASE;
            if (e < 0) i += LOG_BASE;  // i < 1

            if (i < len) {
              if (i) x.c.push(+str.slice(0, i));

              for (len -= LOG_BASE; i < len;) {
                x.c.push(+str.slice(i, i += LOG_BASE));
              }

              i = LOG_BASE - (str = str.slice(i)).length;
            } else {
              i -= len;
            }

            for (; i--; str += '0');
            x.c.push(+str);
          }
        } else {

          // Zero.
          x.c = [x.e = 0];
        }
      }


      // CONSTRUCTOR PROPERTIES


      BigNumber.clone = clone;

      BigNumber.ROUND_UP = 0;
      BigNumber.ROUND_DOWN = 1;
      BigNumber.ROUND_CEIL = 2;
      BigNumber.ROUND_FLOOR = 3;
      BigNumber.ROUND_HALF_UP = 4;
      BigNumber.ROUND_HALF_DOWN = 5;
      BigNumber.ROUND_HALF_EVEN = 6;
      BigNumber.ROUND_HALF_CEIL = 7;
      BigNumber.ROUND_HALF_FLOOR = 8;
      BigNumber.EUCLID = 9;


      /*
       * Configure infrequently-changing library-wide settings.
       *
       * Accept an object with the following optional properties (if the value of a property is
       * a number, it must be an integer within the inclusive range stated):
       *
       *   DECIMAL_PLACES   {number}           0 to MAX
       *   ROUNDING_MODE    {number}           0 to 8
       *   EXPONENTIAL_AT   {number|number[]}  -MAX to MAX  or  [-MAX to 0, 0 to MAX]
       *   RANGE            {number|number[]}  -MAX to MAX (not zero)  or  [-MAX to -1, 1 to MAX]
       *   CRYPTO           {boolean}          true or false
       *   MODULO_MODE      {number}           0 to 9
       *   POW_PRECISION       {number}           0 to MAX
       *   ALPHABET         {string}           A string of two or more unique characters which does
       *                                     not contain '.'.
       *   FORMAT           {object}           An object with some of the following properties:
       *     prefix                 {string}
       *     groupSize              {number}
       *     secondaryGroupSize     {number}
       *     groupSeparator         {string}
       *     decimalSeparator       {string}
       *     fractionGroupSize      {number}
       *     fractionGroupSeparator {string}
       *     suffix                 {string}
       *
       * (The values assigned to the above FORMAT object properties are not checked for validity.)
       *
       * E.g.
       * BigNumber.config({ DECIMAL_PLACES : 20, ROUNDING_MODE : 4 })
       *
       * Ignore properties/parameters set to null or undefined, except for ALPHABET.
       *
       * Return an object with the properties current values.
       */
      BigNumber.config = BigNumber.set = function (obj) {
        var p, v;

        if (obj != null) {

          if (typeof obj == 'object') {

            // DECIMAL_PLACES {number} Integer, 0 to MAX inclusive.
            // '[BigNumber Error] DECIMAL_PLACES {not a primitive number|not an integer|out of range}: {v}'
            if (obj.hasOwnProperty(p = 'DECIMAL_PLACES')) {
              v = obj[p];
              intCheck(v, 0, MAX, p);
              DECIMAL_PLACES = v;
            }

            // ROUNDING_MODE {number} Integer, 0 to 8 inclusive.
            // '[BigNumber Error] ROUNDING_MODE {not a primitive number|not an integer|out of range}: {v}'
            if (obj.hasOwnProperty(p = 'ROUNDING_MODE')) {
              v = obj[p];
              intCheck(v, 0, 8, p);
              ROUNDING_MODE = v;
            }

            // EXPONENTIAL_AT {number|number[]}
            // Integer, -MAX to MAX inclusive or
            // [integer -MAX to 0 inclusive, 0 to MAX inclusive].
            // '[BigNumber Error] EXPONENTIAL_AT {not a primitive number|not an integer|out of range}: {v}'
            if (obj.hasOwnProperty(p = 'EXPONENTIAL_AT')) {
              v = obj[p];
              if (v && v.pop) {
                intCheck(v[0], -MAX, 0, p);
                intCheck(v[1], 0, MAX, p);
                TO_EXP_NEG = v[0];
                TO_EXP_POS = v[1];
              } else {
                intCheck(v, -MAX, MAX, p);
                TO_EXP_NEG = -(TO_EXP_POS = v < 0 ? -v : v);
              }
            }

            // RANGE {number|number[]} Non-zero integer, -MAX to MAX inclusive or
            // [integer -MAX to -1 inclusive, integer 1 to MAX inclusive].
            // '[BigNumber Error] RANGE {not a primitive number|not an integer|out of range|cannot be zero}: {v}'
            if (obj.hasOwnProperty(p = 'RANGE')) {
              v = obj[p];
              if (v && v.pop) {
                intCheck(v[0], -MAX, -1, p);
                intCheck(v[1], 1, MAX, p);
                MIN_EXP = v[0];
                MAX_EXP = v[1];
              } else {
                intCheck(v, -MAX, MAX, p);
                if (v) {
                  MIN_EXP = -(MAX_EXP = v < 0 ? -v : v);
                } else {
                  throw Error
                   (bignumberError + p + ' cannot be zero: ' + v);
                }
              }
            }

            // CRYPTO {boolean} true or false.
            // '[BigNumber Error] CRYPTO not true or false: {v}'
            // '[BigNumber Error] crypto unavailable'
            if (obj.hasOwnProperty(p = 'CRYPTO')) {
              v = obj[p];
              if (v === !!v) {
                if (v) {
                  if (typeof crypto != 'undefined' && crypto &&
                   (crypto.getRandomValues || crypto.randomBytes)) {
                    CRYPTO = v;
                  } else {
                    CRYPTO = !v;
                    throw Error
                     (bignumberError + 'crypto unavailable');
                  }
                } else {
                  CRYPTO = v;
                }
              } else {
                throw Error
                 (bignumberError + p + ' not true or false: ' + v);
              }
            }

            // MODULO_MODE {number} Integer, 0 to 9 inclusive.
            // '[BigNumber Error] MODULO_MODE {not a primitive number|not an integer|out of range}: {v}'
            if (obj.hasOwnProperty(p = 'MODULO_MODE')) {
              v = obj[p];
              intCheck(v, 0, 9, p);
              MODULO_MODE = v;
            }

            // POW_PRECISION {number} Integer, 0 to MAX inclusive.
            // '[BigNumber Error] POW_PRECISION {not a primitive number|not an integer|out of range}: {v}'
            if (obj.hasOwnProperty(p = 'POW_PRECISION')) {
              v = obj[p];
              intCheck(v, 0, MAX, p);
              POW_PRECISION = v;
            }

            // FORMAT {object}
            // '[BigNumber Error] FORMAT not an object: {v}'
            if (obj.hasOwnProperty(p = 'FORMAT')) {
              v = obj[p];
              if (typeof v == 'object') FORMAT = v;
              else throw Error
               (bignumberError + p + ' not an object: ' + v);
            }

            // ALPHABET {string}
            // '[BigNumber Error] ALPHABET invalid: {v}'
            if (obj.hasOwnProperty(p = 'ALPHABET')) {
              v = obj[p];

              // Disallow if only one character,
              // or if it contains '+', '-', '.', whitespace, or a repeated character.
              if (typeof v == 'string' && !/^.$|[+-.\s]|(.).*\1/.test(v)) {
                ALPHABET = v;
              } else {
                throw Error
                 (bignumberError + p + ' invalid: ' + v);
              }
            }

          } else {

            // '[BigNumber Error] Object expected: {v}'
            throw Error
             (bignumberError + 'Object expected: ' + obj);
          }
        }

        return {
          DECIMAL_PLACES: DECIMAL_PLACES,
          ROUNDING_MODE: ROUNDING_MODE,
          EXPONENTIAL_AT: [TO_EXP_NEG, TO_EXP_POS],
          RANGE: [MIN_EXP, MAX_EXP],
          CRYPTO: CRYPTO,
          MODULO_MODE: MODULO_MODE,
          POW_PRECISION: POW_PRECISION,
          FORMAT: FORMAT,
          ALPHABET: ALPHABET
        };
      };


      /*
       * Return true if v is a BigNumber instance, otherwise return false.
       *
       * If BigNumber.DEBUG is true, throw if a BigNumber instance is not well-formed.
       *
       * v {any}
       *
       * '[BigNumber Error] Invalid BigNumber: {v}'
       */
      BigNumber.isBigNumber = function (v) {
        if (!v || v._isBigNumber !== true) return false;
        if (!BigNumber.DEBUG) return true;

        var i, n,
          c = v.c,
          e = v.e,
          s = v.s;

        out: if ({}.toString.call(c) == '[object Array]') {

          if ((s === 1 || s === -1) && e >= -MAX && e <= MAX && e === mathfloor(e)) {

            // If the first element is zero, the BigNumber value must be zero.
            if (c[0] === 0) {
              if (e === 0 && c.length === 1) return true;
              break out;
            }

            // Calculate number of digits that c[0] should have, based on the exponent.
            i = (e + 1) % LOG_BASE;
            if (i < 1) i += LOG_BASE;

            // Calculate number of digits of c[0].
            //if (Math.ceil(Math.log(c[0] + 1) / Math.LN10) == i) {
            if (String(c[0]).length == i) {

              for (i = 0; i < c.length; i++) {
                n = c[i];
                if (n < 0 || n >= BASE || n !== mathfloor(n)) break out;
              }

              // Last element cannot be zero, unless it is the only element.
              if (n !== 0) return true;
            }
          }

        // Infinity/NaN
        } else if (c === null && e === null && (s === null || s === 1 || s === -1)) {
          return true;
        }

        throw Error
          (bignumberError + 'Invalid BigNumber: ' + v);
      };


      /*
       * Return a new BigNumber whose value is the maximum of the arguments.
       *
       * arguments {number|string|BigNumber}
       */
      BigNumber.maximum = BigNumber.max = function () {
        return maxOrMin(arguments, P.lt);
      };


      /*
       * Return a new BigNumber whose value is the minimum of the arguments.
       *
       * arguments {number|string|BigNumber}
       */
      BigNumber.minimum = BigNumber.min = function () {
        return maxOrMin(arguments, P.gt);
      };


      /*
       * Return a new BigNumber with a random value equal to or greater than 0 and less than 1,
       * and with dp, or DECIMAL_PLACES if dp is omitted, decimal places (or less if trailing
       * zeros are produced).
       *
       * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
       *
       * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp}'
       * '[BigNumber Error] crypto unavailable'
       */
      BigNumber.random = (function () {
        var pow2_53 = 0x20000000000000;

        // Return a 53 bit integer n, where 0 <= n < 9007199254740992.
        // Check if Math.random() produces more than 32 bits of randomness.
        // If it does, assume at least 53 bits are produced, otherwise assume at least 30 bits.
        // 0x40000000 is 2^30, 0x800000 is 2^23, 0x1fffff is 2^21 - 1.
        var random53bitInt = (Math.random() * pow2_53) & 0x1fffff
         ? function () { return mathfloor(Math.random() * pow2_53); }
         : function () { return ((Math.random() * 0x40000000 | 0) * 0x800000) +
           (Math.random() * 0x800000 | 0); };

        return function (dp) {
          var a, b, e, k, v,
            i = 0,
            c = [],
            rand = new BigNumber(ONE);

          if (dp == null) dp = DECIMAL_PLACES;
          else intCheck(dp, 0, MAX);

          k = mathceil(dp / LOG_BASE);

          if (CRYPTO) {

            // Browsers supporting crypto.getRandomValues.
            if (crypto.getRandomValues) {

              a = crypto.getRandomValues(new Uint32Array(k *= 2));

              for (; i < k;) {

                // 53 bits:
                // ((Math.pow(2, 32) - 1) * Math.pow(2, 21)).toString(2)
                // 11111 11111111 11111111 11111111 11100000 00000000 00000000
                // ((Math.pow(2, 32) - 1) >>> 11).toString(2)
                //                                     11111 11111111 11111111
                // 0x20000 is 2^21.
                v = a[i] * 0x20000 + (a[i + 1] >>> 11);

                // Rejection sampling:
                // 0 <= v < 9007199254740992
                // Probability that v >= 9e15, is
                // 7199254740992 / 9007199254740992 ~= 0.0008, i.e. 1 in 1251
                if (v >= 9e15) {
                  b = crypto.getRandomValues(new Uint32Array(2));
                  a[i] = b[0];
                  a[i + 1] = b[1];
                } else {

                  // 0 <= v <= 8999999999999999
                  // 0 <= (v % 1e14) <= 99999999999999
                  c.push(v % 1e14);
                  i += 2;
                }
              }
              i = k / 2;

            // Node.js supporting crypto.randomBytes.
            } else if (crypto.randomBytes) {

              // buffer
              a = crypto.randomBytes(k *= 7);

              for (; i < k;) {

                // 0x1000000000000 is 2^48, 0x10000000000 is 2^40
                // 0x100000000 is 2^32, 0x1000000 is 2^24
                // 11111 11111111 11111111 11111111 11111111 11111111 11111111
                // 0 <= v < 9007199254740992
                v = ((a[i] & 31) * 0x1000000000000) + (a[i + 1] * 0x10000000000) +
                   (a[i + 2] * 0x100000000) + (a[i + 3] * 0x1000000) +
                   (a[i + 4] << 16) + (a[i + 5] << 8) + a[i + 6];

                if (v >= 9e15) {
                  crypto.randomBytes(7).copy(a, i);
                } else {

                  // 0 <= (v % 1e14) <= 99999999999999
                  c.push(v % 1e14);
                  i += 7;
                }
              }
              i = k / 7;
            } else {
              CRYPTO = false;
              throw Error
               (bignumberError + 'crypto unavailable');
            }
          }

          // Use Math.random.
          if (!CRYPTO) {

            for (; i < k;) {
              v = random53bitInt();
              if (v < 9e15) c[i++] = v % 1e14;
            }
          }

          k = c[--i];
          dp %= LOG_BASE;

          // Convert trailing digits to zeros according to dp.
          if (k && dp) {
            v = POWS_TEN[LOG_BASE - dp];
            c[i] = mathfloor(k / v) * v;
          }

          // Remove trailing elements which are zero.
          for (; c[i] === 0; c.pop(), i--);

          // Zero?
          if (i < 0) {
            c = [e = 0];
          } else {

            // Remove leading elements which are zero and adjust exponent accordingly.
            for (e = -1 ; c[0] === 0; c.splice(0, 1), e -= LOG_BASE);

            // Count the digits of the first element of c to determine leading zeros, and...
            for (i = 1, v = c[0]; v >= 10; v /= 10, i++);

            // adjust the exponent accordingly.
            if (i < LOG_BASE) e -= LOG_BASE - i;
          }

          rand.e = e;
          rand.c = c;
          return rand;
        };
      })();


       /*
       * Return a BigNumber whose value is the sum of the arguments.
       *
       * arguments {number|string|BigNumber}
       */
      BigNumber.sum = function () {
        var i = 1,
          args = arguments,
          sum = new BigNumber(args[0]);
        for (; i < args.length;) sum = sum.plus(args[i++]);
        return sum;
      };


      // PRIVATE FUNCTIONS


      // Called by BigNumber and BigNumber.prototype.toString.
      convertBase = (function () {
        var decimal = '0123456789';

        /*
         * Convert string of baseIn to an array of numbers of baseOut.
         * Eg. toBaseOut('255', 10, 16) returns [15, 15].
         * Eg. toBaseOut('ff', 16, 10) returns [2, 5, 5].
         */
        function toBaseOut(str, baseIn, baseOut, alphabet) {
          var j,
            arr = [0],
            arrL,
            i = 0,
            len = str.length;

          for (; i < len;) {
            for (arrL = arr.length; arrL--; arr[arrL] *= baseIn);

            arr[0] += alphabet.indexOf(str.charAt(i++));

            for (j = 0; j < arr.length; j++) {

              if (arr[j] > baseOut - 1) {
                if (arr[j + 1] == null) arr[j + 1] = 0;
                arr[j + 1] += arr[j] / baseOut | 0;
                arr[j] %= baseOut;
              }
            }
          }

          return arr.reverse();
        }

        // Convert a numeric string of baseIn to a numeric string of baseOut.
        // If the caller is toString, we are converting from base 10 to baseOut.
        // If the caller is BigNumber, we are converting from baseIn to base 10.
        return function (str, baseIn, baseOut, sign, callerIsToString) {
          var alphabet, d, e, k, r, x, xc, y,
            i = str.indexOf('.'),
            dp = DECIMAL_PLACES,
            rm = ROUNDING_MODE;

          // Non-integer.
          if (i >= 0) {
            k = POW_PRECISION;

            // Unlimited precision.
            POW_PRECISION = 0;
            str = str.replace('.', '');
            y = new BigNumber(baseIn);
            x = y.pow(str.length - i);
            POW_PRECISION = k;

            // Convert str as if an integer, then restore the fraction part by dividing the
            // result by its base raised to a power.

            y.c = toBaseOut(toFixedPoint(coeffToString(x.c), x.e, '0'),
             10, baseOut, decimal);
            y.e = y.c.length;
          }

          // Convert the number as integer.

          xc = toBaseOut(str, baseIn, baseOut, callerIsToString
           ? (alphabet = ALPHABET, decimal)
           : (alphabet = decimal, ALPHABET));

          // xc now represents str as an integer and converted to baseOut. e is the exponent.
          e = k = xc.length;

          // Remove trailing zeros.
          for (; xc[--k] == 0; xc.pop());

          // Zero?
          if (!xc[0]) return alphabet.charAt(0);

          // Does str represent an integer? If so, no need for the division.
          if (i < 0) {
            --e;
          } else {
            x.c = xc;
            x.e = e;

            // The sign is needed for correct rounding.
            x.s = sign;
            x = div(x, y, dp, rm, baseOut);
            xc = x.c;
            r = x.r;
            e = x.e;
          }

          // xc now represents str converted to baseOut.

          // THe index of the rounding digit.
          d = e + dp + 1;

          // The rounding digit: the digit to the right of the digit that may be rounded up.
          i = xc[d];

          // Look at the rounding digits and mode to determine whether to round up.

          k = baseOut / 2;
          r = r || d < 0 || xc[d + 1] != null;

          r = rm < 4 ? (i != null || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
                : i > k || i == k &&(rm == 4 || r || rm == 6 && xc[d - 1] & 1 ||
                 rm == (x.s < 0 ? 8 : 7));

          // If the index of the rounding digit is not greater than zero, or xc represents
          // zero, then the result of the base conversion is zero or, if rounding up, a value
          // such as 0.00001.
          if (d < 1 || !xc[0]) {

            // 1^-dp or 0
            str = r ? toFixedPoint(alphabet.charAt(1), -dp, alphabet.charAt(0)) : alphabet.charAt(0);
          } else {

            // Truncate xc to the required number of decimal places.
            xc.length = d;

            // Round up?
            if (r) {

              // Rounding up may mean the previous digit has to be rounded up and so on.
              for (--baseOut; ++xc[--d] > baseOut;) {
                xc[d] = 0;

                if (!d) {
                  ++e;
                  xc = [1].concat(xc);
                }
              }
            }

            // Determine trailing zeros.
            for (k = xc.length; !xc[--k];);

            // E.g. [4, 11, 15] becomes 4bf.
            for (i = 0, str = ''; i <= k; str += alphabet.charAt(xc[i++]));

            // Add leading zeros, decimal point and trailing zeros as required.
            str = toFixedPoint(str, e, alphabet.charAt(0));
          }

          // The caller will add the sign.
          return str;
        };
      })();


      // Perform division in the specified base. Called by div and convertBase.
      div = (function () {

        // Assume non-zero x and k.
        function multiply(x, k, base) {
          var m, temp, xlo, xhi,
            carry = 0,
            i = x.length,
            klo = k % SQRT_BASE,
            khi = k / SQRT_BASE | 0;

          for (x = x.slice(); i--;) {
            xlo = x[i] % SQRT_BASE;
            xhi = x[i] / SQRT_BASE | 0;
            m = khi * xlo + xhi * klo;
            temp = klo * xlo + ((m % SQRT_BASE) * SQRT_BASE) + carry;
            carry = (temp / base | 0) + (m / SQRT_BASE | 0) + khi * xhi;
            x[i] = temp % base;
          }

          if (carry) x = [carry].concat(x);

          return x;
        }

        function compare(a, b, aL, bL) {
          var i, cmp;

          if (aL != bL) {
            cmp = aL > bL ? 1 : -1;
          } else {

            for (i = cmp = 0; i < aL; i++) {

              if (a[i] != b[i]) {
                cmp = a[i] > b[i] ? 1 : -1;
                break;
              }
            }
          }

          return cmp;
        }

        function subtract(a, b, aL, base) {
          var i = 0;

          // Subtract b from a.
          for (; aL--;) {
            a[aL] -= i;
            i = a[aL] < b[aL] ? 1 : 0;
            a[aL] = i * base + a[aL] - b[aL];
          }

          // Remove leading zeros.
          for (; !a[0] && a.length > 1; a.splice(0, 1));
        }

        // x: dividend, y: divisor.
        return function (x, y, dp, rm, base) {
          var cmp, e, i, more, n, prod, prodL, q, qc, rem, remL, rem0, xi, xL, yc0,
            yL, yz,
            s = x.s == y.s ? 1 : -1,
            xc = x.c,
            yc = y.c;

          // Either NaN, Infinity or 0?
          if (!xc || !xc[0] || !yc || !yc[0]) {

            return new BigNumber(

             // Return NaN if either NaN, or both Infinity or 0.
             !x.s || !y.s || (xc ? yc && xc[0] == yc[0] : !yc) ? NaN :

              // Return ±0 if x is ±0 or y is ±Infinity, or return ±Infinity as y is ±0.
              xc && xc[0] == 0 || !yc ? s * 0 : s / 0
           );
          }

          q = new BigNumber(s);
          qc = q.c = [];
          e = x.e - y.e;
          s = dp + e + 1;

          if (!base) {
            base = BASE;
            e = bitFloor(x.e / LOG_BASE) - bitFloor(y.e / LOG_BASE);
            s = s / LOG_BASE | 0;
          }

          // Result exponent may be one less then the current value of e.
          // The coefficients of the BigNumbers from convertBase may have trailing zeros.
          for (i = 0; yc[i] == (xc[i] || 0); i++);

          if (yc[i] > (xc[i] || 0)) e--;

          if (s < 0) {
            qc.push(1);
            more = true;
          } else {
            xL = xc.length;
            yL = yc.length;
            i = 0;
            s += 2;

            // Normalise xc and yc so highest order digit of yc is >= base / 2.

            n = mathfloor(base / (yc[0] + 1));

            // Not necessary, but to handle odd bases where yc[0] == (base / 2) - 1.
            // if (n > 1 || n++ == 1 && yc[0] < base / 2) {
            if (n > 1) {
              yc = multiply(yc, n, base);
              xc = multiply(xc, n, base);
              yL = yc.length;
              xL = xc.length;
            }

            xi = yL;
            rem = xc.slice(0, yL);
            remL = rem.length;

            // Add zeros to make remainder as long as divisor.
            for (; remL < yL; rem[remL++] = 0);
            yz = yc.slice();
            yz = [0].concat(yz);
            yc0 = yc[0];
            if (yc[1] >= base / 2) yc0++;
            // Not necessary, but to prevent trial digit n > base, when using base 3.
            // else if (base == 3 && yc0 == 1) yc0 = 1 + 1e-15;

            do {
              n = 0;

              // Compare divisor and remainder.
              cmp = compare(yc, rem, yL, remL);

              // If divisor < remainder.
              if (cmp < 0) {

                // Calculate trial digit, n.

                rem0 = rem[0];
                if (yL != remL) rem0 = rem0 * base + (rem[1] || 0);

                // n is how many times the divisor goes into the current remainder.
                n = mathfloor(rem0 / yc0);

                //  Algorithm:
                //  product = divisor multiplied by trial digit (n).
                //  Compare product and remainder.
                //  If product is greater than remainder:
                //    Subtract divisor from product, decrement trial digit.
                //  Subtract product from remainder.
                //  If product was less than remainder at the last compare:
                //    Compare new remainder and divisor.
                //    If remainder is greater than divisor:
                //      Subtract divisor from remainder, increment trial digit.

                if (n > 1) {

                  // n may be > base only when base is 3.
                  if (n >= base) n = base - 1;

                  // product = divisor * trial digit.
                  prod = multiply(yc, n, base);
                  prodL = prod.length;
                  remL = rem.length;

                  // Compare product and remainder.
                  // If product > remainder then trial digit n too high.
                  // n is 1 too high about 5% of the time, and is not known to have
                  // ever been more than 1 too high.
                  while (compare(prod, rem, prodL, remL) == 1) {
                    n--;

                    // Subtract divisor from product.
                    subtract(prod, yL < prodL ? yz : yc, prodL, base);
                    prodL = prod.length;
                    cmp = 1;
                  }
                } else {

                  // n is 0 or 1, cmp is -1.
                  // If n is 0, there is no need to compare yc and rem again below,
                  // so change cmp to 1 to avoid it.
                  // If n is 1, leave cmp as -1, so yc and rem are compared again.
                  if (n == 0) {

                    // divisor < remainder, so n must be at least 1.
                    cmp = n = 1;
                  }

                  // product = divisor
                  prod = yc.slice();
                  prodL = prod.length;
                }

                if (prodL < remL) prod = [0].concat(prod);

                // Subtract product from remainder.
                subtract(rem, prod, remL, base);
                remL = rem.length;

                 // If product was < remainder.
                if (cmp == -1) {

                  // Compare divisor and new remainder.
                  // If divisor < new remainder, subtract divisor from remainder.
                  // Trial digit n too low.
                  // n is 1 too low about 5% of the time, and very rarely 2 too low.
                  while (compare(yc, rem, yL, remL) < 1) {
                    n++;

                    // Subtract divisor from remainder.
                    subtract(rem, yL < remL ? yz : yc, remL, base);
                    remL = rem.length;
                  }
                }
              } else if (cmp === 0) {
                n++;
                rem = [0];
              } // else cmp === 1 and n will be 0

              // Add the next digit, n, to the result array.
              qc[i++] = n;

              // Update the remainder.
              if (rem[0]) {
                rem[remL++] = xc[xi] || 0;
              } else {
                rem = [xc[xi]];
                remL = 1;
              }
            } while ((xi++ < xL || rem[0] != null) && s--);

            more = rem[0] != null;

            // Leading zero?
            if (!qc[0]) qc.splice(0, 1);
          }

          if (base == BASE) {

            // To calculate q.e, first get the number of digits of qc[0].
            for (i = 1, s = qc[0]; s >= 10; s /= 10, i++);

            round(q, dp + (q.e = i + e * LOG_BASE - 1) + 1, rm, more);

          // Caller is convertBase.
          } else {
            q.e = e;
            q.r = +more;
          }

          return q;
        };
      })();


      /*
       * Return a string representing the value of BigNumber n in fixed-point or exponential
       * notation rounded to the specified decimal places or significant digits.
       *
       * n: a BigNumber.
       * i: the index of the last digit required (i.e. the digit that may be rounded up).
       * rm: the rounding mode.
       * id: 1 (toExponential) or 2 (toPrecision).
       */
      function format(n, i, rm, id) {
        var c0, e, ne, len, str;

        if (rm == null) rm = ROUNDING_MODE;
        else intCheck(rm, 0, 8);

        if (!n.c) return n.toString();

        c0 = n.c[0];
        ne = n.e;

        if (i == null) {
          str = coeffToString(n.c);
          str = id == 1 || id == 2 && (ne <= TO_EXP_NEG || ne >= TO_EXP_POS)
           ? toExponential(str, ne)
           : toFixedPoint(str, ne, '0');
        } else {
          n = round(new BigNumber(n), i, rm);

          // n.e may have changed if the value was rounded up.
          e = n.e;

          str = coeffToString(n.c);
          len = str.length;

          // toPrecision returns exponential notation if the number of significant digits
          // specified is less than the number of digits necessary to represent the integer
          // part of the value in fixed-point notation.

          // Exponential notation.
          if (id == 1 || id == 2 && (i <= e || e <= TO_EXP_NEG)) {

            // Append zeros?
            for (; len < i; str += '0', len++);
            str = toExponential(str, e);

          // Fixed-point notation.
          } else {
            i -= ne;
            str = toFixedPoint(str, e, '0');

            // Append zeros?
            if (e + 1 > len) {
              if (--i > 0) for (str += '.'; i--; str += '0');
            } else {
              i += e - len;
              if (i > 0) {
                if (e + 1 == len) str += '.';
                for (; i--; str += '0');
              }
            }
          }
        }

        return n.s < 0 && c0 ? '-' + str : str;
      }


      // Handle BigNumber.max and BigNumber.min.
      function maxOrMin(args, method) {
        var n,
          i = 1,
          m = new BigNumber(args[0]);

        for (; i < args.length; i++) {
          n = new BigNumber(args[i]);

          // If any number is NaN, return NaN.
          if (!n.s) {
            m = n;
            break;
          } else if (method.call(m, n)) {
            m = n;
          }
        }

        return m;
      }


      /*
       * Strip trailing zeros, calculate base 10 exponent and check against MIN_EXP and MAX_EXP.
       * Called by minus, plus and times.
       */
      function normalise(n, c, e) {
        var i = 1,
          j = c.length;

         // Remove trailing zeros.
        for (; !c[--j]; c.pop());

        // Calculate the base 10 exponent. First get the number of digits of c[0].
        for (j = c[0]; j >= 10; j /= 10, i++);

        // Overflow?
        if ((e = i + e * LOG_BASE - 1) > MAX_EXP) {

          // Infinity.
          n.c = n.e = null;

        // Underflow?
        } else if (e < MIN_EXP) {

          // Zero.
          n.c = [n.e = 0];
        } else {
          n.e = e;
          n.c = c;
        }

        return n;
      }


      // Handle values that fail the validity test in BigNumber.
      parseNumeric = (function () {
        var basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i,
          dotAfter = /^([^.]+)\.$/,
          dotBefore = /^\.([^.]+)$/,
          isInfinityOrNaN = /^-?(Infinity|NaN)$/,
          whitespaceOrPlus = /^\s*\+(?=[\w.])|^\s+|\s+$/g;

        return function (x, str, isNum, b) {
          var base,
            s = isNum ? str : str.replace(whitespaceOrPlus, '');

          // No exception on ±Infinity or NaN.
          if (isInfinityOrNaN.test(s)) {
            x.s = isNaN(s) ? null : s < 0 ? -1 : 1;
          } else {
            if (!isNum) {

              // basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i
              s = s.replace(basePrefix, function (m, p1, p2) {
                base = (p2 = p2.toLowerCase()) == 'x' ? 16 : p2 == 'b' ? 2 : 8;
                return !b || b == base ? p1 : m;
              });

              if (b) {
                base = b;

                // E.g. '1.' to '1', '.1' to '0.1'
                s = s.replace(dotAfter, '$1').replace(dotBefore, '0.$1');
              }

              if (str != s) return new BigNumber(s, base);
            }

            // '[BigNumber Error] Not a number: {n}'
            // '[BigNumber Error] Not a base {b} number: {n}'
            if (BigNumber.DEBUG) {
              throw Error
                (bignumberError + 'Not a' + (b ? ' base ' + b : '') + ' number: ' + str);
            }

            // NaN
            x.s = null;
          }

          x.c = x.e = null;
        }
      })();


      /*
       * Round x to sd significant digits using rounding mode rm. Check for over/under-flow.
       * If r is truthy, it is known that there are more digits after the rounding digit.
       */
      function round(x, sd, rm, r) {
        var d, i, j, k, n, ni, rd,
          xc = x.c,
          pows10 = POWS_TEN;

        // if x is not Infinity or NaN...
        if (xc) {

          // rd is the rounding digit, i.e. the digit after the digit that may be rounded up.
          // n is a base 1e14 number, the value of the element of array x.c containing rd.
          // ni is the index of n within x.c.
          // d is the number of digits of n.
          // i is the index of rd within n including leading zeros.
          // j is the actual index of rd within n (if < 0, rd is a leading zero).
          out: {

            // Get the number of digits of the first element of xc.
            for (d = 1, k = xc[0]; k >= 10; k /= 10, d++);
            i = sd - d;

            // If the rounding digit is in the first element of xc...
            if (i < 0) {
              i += LOG_BASE;
              j = sd;
              n = xc[ni = 0];

              // Get the rounding digit at index j of n.
              rd = n / pows10[d - j - 1] % 10 | 0;
            } else {
              ni = mathceil((i + 1) / LOG_BASE);

              if (ni >= xc.length) {

                if (r) {

                  // Needed by sqrt.
                  for (; xc.length <= ni; xc.push(0));
                  n = rd = 0;
                  d = 1;
                  i %= LOG_BASE;
                  j = i - LOG_BASE + 1;
                } else {
                  break out;
                }
              } else {
                n = k = xc[ni];

                // Get the number of digits of n.
                for (d = 1; k >= 10; k /= 10, d++);

                // Get the index of rd within n.
                i %= LOG_BASE;

                // Get the index of rd within n, adjusted for leading zeros.
                // The number of leading zeros of n is given by LOG_BASE - d.
                j = i - LOG_BASE + d;

                // Get the rounding digit at index j of n.
                rd = j < 0 ? 0 : n / pows10[d - j - 1] % 10 | 0;
              }
            }

            r = r || sd < 0 ||

            // Are there any non-zero digits after the rounding digit?
            // The expression  n % pows10[d - j - 1]  returns all digits of n to the right
            // of the digit at j, e.g. if n is 908714 and j is 2, the expression gives 714.
             xc[ni + 1] != null || (j < 0 ? n : n % pows10[d - j - 1]);

            r = rm < 4
             ? (rd || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
             : rd > 5 || rd == 5 && (rm == 4 || r || rm == 6 &&

              // Check whether the digit to the left of the rounding digit is odd.
              ((i > 0 ? j > 0 ? n / pows10[d - j] : 0 : xc[ni - 1]) % 10) & 1 ||
               rm == (x.s < 0 ? 8 : 7));

            if (sd < 1 || !xc[0]) {
              xc.length = 0;

              if (r) {

                // Convert sd to decimal places.
                sd -= x.e + 1;

                // 1, 0.1, 0.01, 0.001, 0.0001 etc.
                xc[0] = pows10[(LOG_BASE - sd % LOG_BASE) % LOG_BASE];
                x.e = -sd || 0;
              } else {

                // Zero.
                xc[0] = x.e = 0;
              }

              return x;
            }

            // Remove excess digits.
            if (i == 0) {
              xc.length = ni;
              k = 1;
              ni--;
            } else {
              xc.length = ni + 1;
              k = pows10[LOG_BASE - i];

              // E.g. 56700 becomes 56000 if 7 is the rounding digit.
              // j > 0 means i > number of leading zeros of n.
              xc[ni] = j > 0 ? mathfloor(n / pows10[d - j] % pows10[j]) * k : 0;
            }

            // Round up?
            if (r) {

              for (; ;) {

                // If the digit to be rounded up is in the first element of xc...
                if (ni == 0) {

                  // i will be the length of xc[0] before k is added.
                  for (i = 1, j = xc[0]; j >= 10; j /= 10, i++);
                  j = xc[0] += k;
                  for (k = 1; j >= 10; j /= 10, k++);

                  // if i != k the length has increased.
                  if (i != k) {
                    x.e++;
                    if (xc[0] == BASE) xc[0] = 1;
                  }

                  break;
                } else {
                  xc[ni] += k;
                  if (xc[ni] != BASE) break;
                  xc[ni--] = 0;
                  k = 1;
                }
              }
            }

            // Remove trailing zeros.
            for (i = xc.length; xc[--i] === 0; xc.pop());
          }

          // Overflow? Infinity.
          if (x.e > MAX_EXP) {
            x.c = x.e = null;

          // Underflow? Zero.
          } else if (x.e < MIN_EXP) {
            x.c = [x.e = 0];
          }
        }

        return x;
      }


      function valueOf(n) {
        var str,
          e = n.e;

        if (e === null) return n.toString();

        str = coeffToString(n.c);

        str = e <= TO_EXP_NEG || e >= TO_EXP_POS
          ? toExponential(str, e)
          : toFixedPoint(str, e, '0');

        return n.s < 0 ? '-' + str : str;
      }


      // PROTOTYPE/INSTANCE METHODS


      /*
       * Return a new BigNumber whose value is the absolute value of this BigNumber.
       */
      P.absoluteValue = P.abs = function () {
        var x = new BigNumber(this);
        if (x.s < 0) x.s = 1;
        return x;
      };


      /*
       * Return
       *   1 if the value of this BigNumber is greater than the value of BigNumber(y, b),
       *   -1 if the value of this BigNumber is less than the value of BigNumber(y, b),
       *   0 if they have the same value,
       *   or null if the value of either is NaN.
       */
      P.comparedTo = function (y, b) {
        return compare(this, new BigNumber(y, b));
      };


      /*
       * If dp is undefined or null or true or false, return the number of decimal places of the
       * value of this BigNumber, or null if the value of this BigNumber is ±Infinity or NaN.
       *
       * Otherwise, if dp is a number, return a new BigNumber whose value is the value of this
       * BigNumber rounded to a maximum of dp decimal places using rounding mode rm, or
       * ROUNDING_MODE if rm is omitted.
       *
       * [dp] {number} Decimal places: integer, 0 to MAX inclusive.
       * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
       *
       * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
       */
      P.decimalPlaces = P.dp = function (dp, rm) {
        var c, n, v,
          x = this;

        if (dp != null) {
          intCheck(dp, 0, MAX);
          if (rm == null) rm = ROUNDING_MODE;
          else intCheck(rm, 0, 8);

          return round(new BigNumber(x), dp + x.e + 1, rm);
        }

        if (!(c = x.c)) return null;
        n = ((v = c.length - 1) - bitFloor(this.e / LOG_BASE)) * LOG_BASE;

        // Subtract the number of trailing zeros of the last number.
        if (v = c[v]) for (; v % 10 == 0; v /= 10, n--);
        if (n < 0) n = 0;

        return n;
      };


      /*
       *  n / 0 = I
       *  n / N = N
       *  n / I = 0
       *  0 / n = 0
       *  0 / 0 = N
       *  0 / N = N
       *  0 / I = 0
       *  N / n = N
       *  N / 0 = N
       *  N / N = N
       *  N / I = N
       *  I / n = I
       *  I / 0 = I
       *  I / N = N
       *  I / I = N
       *
       * Return a new BigNumber whose value is the value of this BigNumber divided by the value of
       * BigNumber(y, b), rounded according to DECIMAL_PLACES and ROUNDING_MODE.
       */
      P.dividedBy = P.div = function (y, b) {
        return div(this, new BigNumber(y, b), DECIMAL_PLACES, ROUNDING_MODE);
      };


      /*
       * Return a new BigNumber whose value is the integer part of dividing the value of this
       * BigNumber by the value of BigNumber(y, b).
       */
      P.dividedToIntegerBy = P.idiv = function (y, b) {
        return div(this, new BigNumber(y, b), 0, 1);
      };


      /*
       * Return a BigNumber whose value is the value of this BigNumber exponentiated by n.
       *
       * If m is present, return the result modulo m.
       * If n is negative round according to DECIMAL_PLACES and ROUNDING_MODE.
       * If POW_PRECISION is non-zero and m is not present, round to POW_PRECISION using ROUNDING_MODE.
       *
       * The modular power operation works efficiently when x, n, and m are integers, otherwise it
       * is equivalent to calculating x.exponentiatedBy(n).modulo(m) with a POW_PRECISION of 0.
       *
       * n {number|string|BigNumber} The exponent. An integer.
       * [m] {number|string|BigNumber} The modulus.
       *
       * '[BigNumber Error] Exponent not an integer: {n}'
       */
      P.exponentiatedBy = P.pow = function (n, m) {
        var half, isModExp, i, k, more, nIsBig, nIsNeg, nIsOdd, y,
          x = this;

        n = new BigNumber(n);

        // Allow NaN and ±Infinity, but not other non-integers.
        if (n.c && !n.isInteger()) {
          throw Error
            (bignumberError + 'Exponent not an integer: ' + valueOf(n));
        }

        if (m != null) m = new BigNumber(m);

        // Exponent of MAX_SAFE_INTEGER is 15.
        nIsBig = n.e > 14;

        // If x is NaN, ±Infinity, ±0 or ±1, or n is ±Infinity, NaN or ±0.
        if (!x.c || !x.c[0] || x.c[0] == 1 && !x.e && x.c.length == 1 || !n.c || !n.c[0]) {

          // The sign of the result of pow when x is negative depends on the evenness of n.
          // If +n overflows to ±Infinity, the evenness of n would be not be known.
          y = new BigNumber(Math.pow(+valueOf(x), nIsBig ? 2 - isOdd(n) : +valueOf(n)));
          return m ? y.mod(m) : y;
        }

        nIsNeg = n.s < 0;

        if (m) {

          // x % m returns NaN if abs(m) is zero, or m is NaN.
          if (m.c ? !m.c[0] : !m.s) return new BigNumber(NaN);

          isModExp = !nIsNeg && x.isInteger() && m.isInteger();

          if (isModExp) x = x.mod(m);

        // Overflow to ±Infinity: >=2**1e10 or >=1.0000024**1e15.
        // Underflow to ±0: <=0.79**1e10 or <=0.9999975**1e15.
        } else if (n.e > 9 && (x.e > 0 || x.e < -1 || (x.e == 0
          // [1, 240000000]
          ? x.c[0] > 1 || nIsBig && x.c[1] >= 24e7
          // [80000000000000]  [99999750000000]
          : x.c[0] < 8e13 || nIsBig && x.c[0] <= 9999975e7))) {

          // If x is negative and n is odd, k = -0, else k = 0.
          k = x.s < 0 && isOdd(n) ? -0 : 0;

          // If x >= 1, k = ±Infinity.
          if (x.e > -1) k = 1 / k;

          // If n is negative return ±0, else return ±Infinity.
          return new BigNumber(nIsNeg ? 1 / k : k);

        } else if (POW_PRECISION) {

          // Truncating each coefficient array to a length of k after each multiplication
          // equates to truncating significant digits to POW_PRECISION + [28, 41],
          // i.e. there will be a minimum of 28 guard digits retained.
          k = mathceil(POW_PRECISION / LOG_BASE + 2);
        }

        if (nIsBig) {
          half = new BigNumber(0.5);
          if (nIsNeg) n.s = 1;
          nIsOdd = isOdd(n);
        } else {
          i = Math.abs(+valueOf(n));
          nIsOdd = i % 2;
        }

        y = new BigNumber(ONE);

        // Performs 54 loop iterations for n of 9007199254740991.
        for (; ;) {

          if (nIsOdd) {
            y = y.times(x);
            if (!y.c) break;

            if (k) {
              if (y.c.length > k) y.c.length = k;
            } else if (isModExp) {
              y = y.mod(m);    //y = y.minus(div(y, m, 0, MODULO_MODE).times(m));
            }
          }

          if (i) {
            i = mathfloor(i / 2);
            if (i === 0) break;
            nIsOdd = i % 2;
          } else {
            n = n.times(half);
            round(n, n.e + 1, 1);

            if (n.e > 14) {
              nIsOdd = isOdd(n);
            } else {
              i = +valueOf(n);
              if (i === 0) break;
              nIsOdd = i % 2;
            }
          }

          x = x.times(x);

          if (k) {
            if (x.c && x.c.length > k) x.c.length = k;
          } else if (isModExp) {
            x = x.mod(m);    //x = x.minus(div(x, m, 0, MODULO_MODE).times(m));
          }
        }

        if (isModExp) return y;
        if (nIsNeg) y = ONE.div(y);

        return m ? y.mod(m) : k ? round(y, POW_PRECISION, ROUNDING_MODE, more) : y;
      };


      /*
       * Return a new BigNumber whose value is the value of this BigNumber rounded to an integer
       * using rounding mode rm, or ROUNDING_MODE if rm is omitted.
       *
       * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
       *
       * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {rm}'
       */
      P.integerValue = function (rm) {
        var n = new BigNumber(this);
        if (rm == null) rm = ROUNDING_MODE;
        else intCheck(rm, 0, 8);
        return round(n, n.e + 1, rm);
      };


      /*
       * Return true if the value of this BigNumber is equal to the value of BigNumber(y, b),
       * otherwise return false.
       */
      P.isEqualTo = P.eq = function (y, b) {
        return compare(this, new BigNumber(y, b)) === 0;
      };


      /*
       * Return true if the value of this BigNumber is a finite number, otherwise return false.
       */
      P.isFinite = function () {
        return !!this.c;
      };


      /*
       * Return true if the value of this BigNumber is greater than the value of BigNumber(y, b),
       * otherwise return false.
       */
      P.isGreaterThan = P.gt = function (y, b) {
        return compare(this, new BigNumber(y, b)) > 0;
      };


      /*
       * Return true if the value of this BigNumber is greater than or equal to the value of
       * BigNumber(y, b), otherwise return false.
       */
      P.isGreaterThanOrEqualTo = P.gte = function (y, b) {
        return (b = compare(this, new BigNumber(y, b))) === 1 || b === 0;

      };


      /*
       * Return true if the value of this BigNumber is an integer, otherwise return false.
       */
      P.isInteger = function () {
        return !!this.c && bitFloor(this.e / LOG_BASE) > this.c.length - 2;
      };


      /*
       * Return true if the value of this BigNumber is less than the value of BigNumber(y, b),
       * otherwise return false.
       */
      P.isLessThan = P.lt = function (y, b) {
        return compare(this, new BigNumber(y, b)) < 0;
      };


      /*
       * Return true if the value of this BigNumber is less than or equal to the value of
       * BigNumber(y, b), otherwise return false.
       */
      P.isLessThanOrEqualTo = P.lte = function (y, b) {
        return (b = compare(this, new BigNumber(y, b))) === -1 || b === 0;
      };


      /*
       * Return true if the value of this BigNumber is NaN, otherwise return false.
       */
      P.isNaN = function () {
        return !this.s;
      };


      /*
       * Return true if the value of this BigNumber is negative, otherwise return false.
       */
      P.isNegative = function () {
        return this.s < 0;
      };


      /*
       * Return true if the value of this BigNumber is positive, otherwise return false.
       */
      P.isPositive = function () {
        return this.s > 0;
      };


      /*
       * Return true if the value of this BigNumber is 0 or -0, otherwise return false.
       */
      P.isZero = function () {
        return !!this.c && this.c[0] == 0;
      };


      /*
       *  n - 0 = n
       *  n - N = N
       *  n - I = -I
       *  0 - n = -n
       *  0 - 0 = 0
       *  0 - N = N
       *  0 - I = -I
       *  N - n = N
       *  N - 0 = N
       *  N - N = N
       *  N - I = N
       *  I - n = I
       *  I - 0 = I
       *  I - N = N
       *  I - I = N
       *
       * Return a new BigNumber whose value is the value of this BigNumber minus the value of
       * BigNumber(y, b).
       */
      P.minus = function (y, b) {
        var i, j, t, xLTy,
          x = this,
          a = x.s;

        y = new BigNumber(y, b);
        b = y.s;

        // Either NaN?
        if (!a || !b) return new BigNumber(NaN);

        // Signs differ?
        if (a != b) {
          y.s = -b;
          return x.plus(y);
        }

        var xe = x.e / LOG_BASE,
          ye = y.e / LOG_BASE,
          xc = x.c,
          yc = y.c;

        if (!xe || !ye) {

          // Either Infinity?
          if (!xc || !yc) return xc ? (y.s = -b, y) : new BigNumber(yc ? x : NaN);

          // Either zero?
          if (!xc[0] || !yc[0]) {

            // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
            return yc[0] ? (y.s = -b, y) : new BigNumber(xc[0] ? x :

             // IEEE 754 (2008) 6.3: n - n = -0 when rounding to -Infinity
             ROUNDING_MODE == 3 ? -0 : 0);
          }
        }

        xe = bitFloor(xe);
        ye = bitFloor(ye);
        xc = xc.slice();

        // Determine which is the bigger number.
        if (a = xe - ye) {

          if (xLTy = a < 0) {
            a = -a;
            t = xc;
          } else {
            ye = xe;
            t = yc;
          }

          t.reverse();

          // Prepend zeros to equalise exponents.
          for (b = a; b--; t.push(0));
          t.reverse();
        } else {

          // Exponents equal. Check digit by digit.
          j = (xLTy = (a = xc.length) < (b = yc.length)) ? a : b;

          for (a = b = 0; b < j; b++) {

            if (xc[b] != yc[b]) {
              xLTy = xc[b] < yc[b];
              break;
            }
          }
        }

        // x < y? Point xc to the array of the bigger number.
        if (xLTy) t = xc, xc = yc, yc = t, y.s = -y.s;

        b = (j = yc.length) - (i = xc.length);

        // Append zeros to xc if shorter.
        // No need to add zeros to yc if shorter as subtract only needs to start at yc.length.
        if (b > 0) for (; b--; xc[i++] = 0);
        b = BASE - 1;

        // Subtract yc from xc.
        for (; j > a;) {

          if (xc[--j] < yc[j]) {
            for (i = j; i && !xc[--i]; xc[i] = b);
            --xc[i];
            xc[j] += BASE;
          }

          xc[j] -= yc[j];
        }

        // Remove leading zeros and adjust exponent accordingly.
        for (; xc[0] == 0; xc.splice(0, 1), --ye);

        // Zero?
        if (!xc[0]) {

          // Following IEEE 754 (2008) 6.3,
          // n - n = +0  but  n - n = -0  when rounding towards -Infinity.
          y.s = ROUNDING_MODE == 3 ? -1 : 1;
          y.c = [y.e = 0];
          return y;
        }

        // No need to check for Infinity as +x - +y != Infinity && -x - -y != Infinity
        // for finite x and y.
        return normalise(y, xc, ye);
      };


      /*
       *   n % 0 =  N
       *   n % N =  N
       *   n % I =  n
       *   0 % n =  0
       *  -0 % n = -0
       *   0 % 0 =  N
       *   0 % N =  N
       *   0 % I =  0
       *   N % n =  N
       *   N % 0 =  N
       *   N % N =  N
       *   N % I =  N
       *   I % n =  N
       *   I % 0 =  N
       *   I % N =  N
       *   I % I =  N
       *
       * Return a new BigNumber whose value is the value of this BigNumber modulo the value of
       * BigNumber(y, b). The result depends on the value of MODULO_MODE.
       */
      P.modulo = P.mod = function (y, b) {
        var q, s,
          x = this;

        y = new BigNumber(y, b);

        // Return NaN if x is Infinity or NaN, or y is NaN or zero.
        if (!x.c || !y.s || y.c && !y.c[0]) {
          return new BigNumber(NaN);

        // Return x if y is Infinity or x is zero.
        } else if (!y.c || x.c && !x.c[0]) {
          return new BigNumber(x);
        }

        if (MODULO_MODE == 9) {

          // Euclidian division: q = sign(y) * floor(x / abs(y))
          // r = x - qy    where  0 <= r < abs(y)
          s = y.s;
          y.s = 1;
          q = div(x, y, 0, 3);
          y.s = s;
          q.s *= s;
        } else {
          q = div(x, y, 0, MODULO_MODE);
        }

        y = x.minus(q.times(y));

        // To match JavaScript %, ensure sign of zero is sign of dividend.
        if (!y.c[0] && MODULO_MODE == 1) y.s = x.s;

        return y;
      };


      /*
       *  n * 0 = 0
       *  n * N = N
       *  n * I = I
       *  0 * n = 0
       *  0 * 0 = 0
       *  0 * N = N
       *  0 * I = N
       *  N * n = N
       *  N * 0 = N
       *  N * N = N
       *  N * I = N
       *  I * n = I
       *  I * 0 = N
       *  I * N = N
       *  I * I = I
       *
       * Return a new BigNumber whose value is the value of this BigNumber multiplied by the value
       * of BigNumber(y, b).
       */
      P.multipliedBy = P.times = function (y, b) {
        var c, e, i, j, k, m, xcL, xlo, xhi, ycL, ylo, yhi, zc,
          base, sqrtBase,
          x = this,
          xc = x.c,
          yc = (y = new BigNumber(y, b)).c;

        // Either NaN, ±Infinity or ±0?
        if (!xc || !yc || !xc[0] || !yc[0]) {

          // Return NaN if either is NaN, or one is 0 and the other is Infinity.
          if (!x.s || !y.s || xc && !xc[0] && !yc || yc && !yc[0] && !xc) {
            y.c = y.e = y.s = null;
          } else {
            y.s *= x.s;

            // Return ±Infinity if either is ±Infinity.
            if (!xc || !yc) {
              y.c = y.e = null;

            // Return ±0 if either is ±0.
            } else {
              y.c = [0];
              y.e = 0;
            }
          }

          return y;
        }

        e = bitFloor(x.e / LOG_BASE) + bitFloor(y.e / LOG_BASE);
        y.s *= x.s;
        xcL = xc.length;
        ycL = yc.length;

        // Ensure xc points to longer array and xcL to its length.
        if (xcL < ycL) zc = xc, xc = yc, yc = zc, i = xcL, xcL = ycL, ycL = i;

        // Initialise the result array with zeros.
        for (i = xcL + ycL, zc = []; i--; zc.push(0));

        base = BASE;
        sqrtBase = SQRT_BASE;

        for (i = ycL; --i >= 0;) {
          c = 0;
          ylo = yc[i] % sqrtBase;
          yhi = yc[i] / sqrtBase | 0;

          for (k = xcL, j = i + k; j > i;) {
            xlo = xc[--k] % sqrtBase;
            xhi = xc[k] / sqrtBase | 0;
            m = yhi * xlo + xhi * ylo;
            xlo = ylo * xlo + ((m % sqrtBase) * sqrtBase) + zc[j] + c;
            c = (xlo / base | 0) + (m / sqrtBase | 0) + yhi * xhi;
            zc[j--] = xlo % base;
          }

          zc[j] = c;
        }

        if (c) {
          ++e;
        } else {
          zc.splice(0, 1);
        }

        return normalise(y, zc, e);
      };


      /*
       * Return a new BigNumber whose value is the value of this BigNumber negated,
       * i.e. multiplied by -1.
       */
      P.negated = function () {
        var x = new BigNumber(this);
        x.s = -x.s || null;
        return x;
      };


      /*
       *  n + 0 = n
       *  n + N = N
       *  n + I = I
       *  0 + n = n
       *  0 + 0 = 0
       *  0 + N = N
       *  0 + I = I
       *  N + n = N
       *  N + 0 = N
       *  N + N = N
       *  N + I = N
       *  I + n = I
       *  I + 0 = I
       *  I + N = N
       *  I + I = I
       *
       * Return a new BigNumber whose value is the value of this BigNumber plus the value of
       * BigNumber(y, b).
       */
      P.plus = function (y, b) {
        var t,
          x = this,
          a = x.s;

        y = new BigNumber(y, b);
        b = y.s;

        // Either NaN?
        if (!a || !b) return new BigNumber(NaN);

        // Signs differ?
         if (a != b) {
          y.s = -b;
          return x.minus(y);
        }

        var xe = x.e / LOG_BASE,
          ye = y.e / LOG_BASE,
          xc = x.c,
          yc = y.c;

        if (!xe || !ye) {

          // Return ±Infinity if either ±Infinity.
          if (!xc || !yc) return new BigNumber(a / 0);

          // Either zero?
          // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
          if (!xc[0] || !yc[0]) return yc[0] ? y : new BigNumber(xc[0] ? x : a * 0);
        }

        xe = bitFloor(xe);
        ye = bitFloor(ye);
        xc = xc.slice();

        // Prepend zeros to equalise exponents. Faster to use reverse then do unshifts.
        if (a = xe - ye) {
          if (a > 0) {
            ye = xe;
            t = yc;
          } else {
            a = -a;
            t = xc;
          }

          t.reverse();
          for (; a--; t.push(0));
          t.reverse();
        }

        a = xc.length;
        b = yc.length;

        // Point xc to the longer array, and b to the shorter length.
        if (a - b < 0) t = yc, yc = xc, xc = t, b = a;

        // Only start adding at yc.length - 1 as the further digits of xc can be ignored.
        for (a = 0; b;) {
          a = (xc[--b] = xc[b] + yc[b] + a) / BASE | 0;
          xc[b] = BASE === xc[b] ? 0 : xc[b] % BASE;
        }

        if (a) {
          xc = [a].concat(xc);
          ++ye;
        }

        // No need to check for zero, as +x + +y != 0 && -x + -y != 0
        // ye = MAX_EXP + 1 possible
        return normalise(y, xc, ye);
      };


      /*
       * If sd is undefined or null or true or false, return the number of significant digits of
       * the value of this BigNumber, or null if the value of this BigNumber is ±Infinity or NaN.
       * If sd is true include integer-part trailing zeros in the count.
       *
       * Otherwise, if sd is a number, return a new BigNumber whose value is the value of this
       * BigNumber rounded to a maximum of sd significant digits using rounding mode rm, or
       * ROUNDING_MODE if rm is omitted.
       *
       * sd {number|boolean} number: significant digits: integer, 1 to MAX inclusive.
       *                     boolean: whether to count integer-part trailing zeros: true or false.
       * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
       *
       * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {sd|rm}'
       */
      P.precision = P.sd = function (sd, rm) {
        var c, n, v,
          x = this;

        if (sd != null && sd !== !!sd) {
          intCheck(sd, 1, MAX);
          if (rm == null) rm = ROUNDING_MODE;
          else intCheck(rm, 0, 8);

          return round(new BigNumber(x), sd, rm);
        }

        if (!(c = x.c)) return null;
        v = c.length - 1;
        n = v * LOG_BASE + 1;

        if (v = c[v]) {

          // Subtract the number of trailing zeros of the last element.
          for (; v % 10 == 0; v /= 10, n--);

          // Add the number of digits of the first element.
          for (v = c[0]; v >= 10; v /= 10, n++);
        }

        if (sd && x.e + 1 > n) n = x.e + 1;

        return n;
      };


      /*
       * Return a new BigNumber whose value is the value of this BigNumber shifted by k places
       * (powers of 10). Shift to the right if n > 0, and to the left if n < 0.
       *
       * k {number} Integer, -MAX_SAFE_INTEGER to MAX_SAFE_INTEGER inclusive.
       *
       * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {k}'
       */
      P.shiftedBy = function (k) {
        intCheck(k, -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER);
        return this.times('1e' + k);
      };


      /*
       *  sqrt(-n) =  N
       *  sqrt(N) =  N
       *  sqrt(-I) =  N
       *  sqrt(I) =  I
       *  sqrt(0) =  0
       *  sqrt(-0) = -0
       *
       * Return a new BigNumber whose value is the square root of the value of this BigNumber,
       * rounded according to DECIMAL_PLACES and ROUNDING_MODE.
       */
      P.squareRoot = P.sqrt = function () {
        var m, n, r, rep, t,
          x = this,
          c = x.c,
          s = x.s,
          e = x.e,
          dp = DECIMAL_PLACES + 4,
          half = new BigNumber('0.5');

        // Negative/NaN/Infinity/zero?
        if (s !== 1 || !c || !c[0]) {
          return new BigNumber(!s || s < 0 && (!c || c[0]) ? NaN : c ? x : 1 / 0);
        }

        // Initial estimate.
        s = Math.sqrt(+valueOf(x));

        // Math.sqrt underflow/overflow?
        // Pass x to Math.sqrt as integer, then adjust the exponent of the result.
        if (s == 0 || s == 1 / 0) {
          n = coeffToString(c);
          if ((n.length + e) % 2 == 0) n += '0';
          s = Math.sqrt(+n);
          e = bitFloor((e + 1) / 2) - (e < 0 || e % 2);

          if (s == 1 / 0) {
            n = '1e' + e;
          } else {
            n = s.toExponential();
            n = n.slice(0, n.indexOf('e') + 1) + e;
          }

          r = new BigNumber(n);
        } else {
          r = new BigNumber(s + '');
        }

        // Check for zero.
        // r could be zero if MIN_EXP is changed after the this value was created.
        // This would cause a division by zero (x/t) and hence Infinity below, which would cause
        // coeffToString to throw.
        if (r.c[0]) {
          e = r.e;
          s = e + dp;
          if (s < 3) s = 0;

          // Newton-Raphson iteration.
          for (; ;) {
            t = r;
            r = half.times(t.plus(div(x, t, dp, 1)));

            if (coeffToString(t.c).slice(0, s) === (n = coeffToString(r.c)).slice(0, s)) {

              // The exponent of r may here be one less than the final result exponent,
              // e.g 0.0009999 (e-4) --> 0.001 (e-3), so adjust s so the rounding digits
              // are indexed correctly.
              if (r.e < e) --s;
              n = n.slice(s - 3, s + 1);

              // The 4th rounding digit may be in error by -1 so if the 4 rounding digits
              // are 9999 or 4999 (i.e. approaching a rounding boundary) continue the
              // iteration.
              if (n == '9999' || !rep && n == '4999') {

                // On the first iteration only, check to see if rounding up gives the
                // exact result as the nines may infinitely repeat.
                if (!rep) {
                  round(t, t.e + DECIMAL_PLACES + 2, 0);

                  if (t.times(t).eq(x)) {
                    r = t;
                    break;
                  }
                }

                dp += 4;
                s += 4;
                rep = 1;
              } else {

                // If rounding digits are null, 0{0,4} or 50{0,3}, check for exact
                // result. If not, then there are further digits and m will be truthy.
                if (!+n || !+n.slice(1) && n.charAt(0) == '5') {

                  // Truncate to the first rounding digit.
                  round(r, r.e + DECIMAL_PLACES + 2, 1);
                  m = !r.times(r).eq(x);
                }

                break;
              }
            }
          }
        }

        return round(r, r.e + DECIMAL_PLACES + 1, ROUNDING_MODE, m);
      };


      /*
       * Return a string representing the value of this BigNumber in exponential notation and
       * rounded using ROUNDING_MODE to dp fixed decimal places.
       *
       * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
       * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
       *
       * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
       */
      P.toExponential = function (dp, rm) {
        if (dp != null) {
          intCheck(dp, 0, MAX);
          dp++;
        }
        return format(this, dp, rm, 1);
      };


      /*
       * Return a string representing the value of this BigNumber in fixed-point notation rounding
       * to dp fixed decimal places using rounding mode rm, or ROUNDING_MODE if rm is omitted.
       *
       * Note: as with JavaScript's number type, (-0).toFixed(0) is '0',
       * but e.g. (-0.00001).toFixed(0) is '-0'.
       *
       * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
       * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
       *
       * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
       */
      P.toFixed = function (dp, rm) {
        if (dp != null) {
          intCheck(dp, 0, MAX);
          dp = dp + this.e + 1;
        }
        return format(this, dp, rm);
      };


      /*
       * Return a string representing the value of this BigNumber in fixed-point notation rounded
       * using rm or ROUNDING_MODE to dp decimal places, and formatted according to the properties
       * of the format or FORMAT object (see BigNumber.set).
       *
       * The formatting object may contain some or all of the properties shown below.
       *
       * FORMAT = {
       *   prefix: '',
       *   groupSize: 3,
       *   secondaryGroupSize: 0,
       *   groupSeparator: ',',
       *   decimalSeparator: '.',
       *   fractionGroupSize: 0,
       *   fractionGroupSeparator: '\xA0',      // non-breaking space
       *   suffix: ''
       * };
       *
       * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
       * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
       * [format] {object} Formatting options. See FORMAT pbject above.
       *
       * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
       * '[BigNumber Error] Argument not an object: {format}'
       */
      P.toFormat = function (dp, rm, format) {
        var str,
          x = this;

        if (format == null) {
          if (dp != null && rm && typeof rm == 'object') {
            format = rm;
            rm = null;
          } else if (dp && typeof dp == 'object') {
            format = dp;
            dp = rm = null;
          } else {
            format = FORMAT;
          }
        } else if (typeof format != 'object') {
          throw Error
            (bignumberError + 'Argument not an object: ' + format);
        }

        str = x.toFixed(dp, rm);

        if (x.c) {
          var i,
            arr = str.split('.'),
            g1 = +format.groupSize,
            g2 = +format.secondaryGroupSize,
            groupSeparator = format.groupSeparator || '',
            intPart = arr[0],
            fractionPart = arr[1],
            isNeg = x.s < 0,
            intDigits = isNeg ? intPart.slice(1) : intPart,
            len = intDigits.length;

          if (g2) i = g1, g1 = g2, g2 = i, len -= i;

          if (g1 > 0 && len > 0) {
            i = len % g1 || g1;
            intPart = intDigits.substr(0, i);
            for (; i < len; i += g1) intPart += groupSeparator + intDigits.substr(i, g1);
            if (g2 > 0) intPart += groupSeparator + intDigits.slice(i);
            if (isNeg) intPart = '-' + intPart;
          }

          str = fractionPart
           ? intPart + (format.decimalSeparator || '') + ((g2 = +format.fractionGroupSize)
            ? fractionPart.replace(new RegExp('\\d{' + g2 + '}\\B', 'g'),
             '$&' + (format.fractionGroupSeparator || ''))
            : fractionPart)
           : intPart;
        }

        return (format.prefix || '') + str + (format.suffix || '');
      };


      /*
       * Return an array of two BigNumbers representing the value of this BigNumber as a simple
       * fraction with an integer numerator and an integer denominator.
       * The denominator will be a positive non-zero value less than or equal to the specified
       * maximum denominator. If a maximum denominator is not specified, the denominator will be
       * the lowest value necessary to represent the number exactly.
       *
       * [md] {number|string|BigNumber} Integer >= 1, or Infinity. The maximum denominator.
       *
       * '[BigNumber Error] Argument {not an integer|out of range} : {md}'
       */
      P.toFraction = function (md) {
        var d, d0, d1, d2, e, exp, n, n0, n1, q, r, s,
          x = this,
          xc = x.c;

        if (md != null) {
          n = new BigNumber(md);

          // Throw if md is less than one or is not an integer, unless it is Infinity.
          if (!n.isInteger() && (n.c || n.s !== 1) || n.lt(ONE)) {
            throw Error
              (bignumberError + 'Argument ' +
                (n.isInteger() ? 'out of range: ' : 'not an integer: ') + valueOf(n));
          }
        }

        if (!xc) return new BigNumber(x);

        d = new BigNumber(ONE);
        n1 = d0 = new BigNumber(ONE);
        d1 = n0 = new BigNumber(ONE);
        s = coeffToString(xc);

        // Determine initial denominator.
        // d is a power of 10 and the minimum max denominator that specifies the value exactly.
        e = d.e = s.length - x.e - 1;
        d.c[0] = POWS_TEN[(exp = e % LOG_BASE) < 0 ? LOG_BASE + exp : exp];
        md = !md || n.comparedTo(d) > 0 ? (e > 0 ? d : n1) : n;

        exp = MAX_EXP;
        MAX_EXP = 1 / 0;
        n = new BigNumber(s);

        // n0 = d1 = 0
        n0.c[0] = 0;

        for (; ;)  {
          q = div(n, d, 0, 1);
          d2 = d0.plus(q.times(d1));
          if (d2.comparedTo(md) == 1) break;
          d0 = d1;
          d1 = d2;
          n1 = n0.plus(q.times(d2 = n1));
          n0 = d2;
          d = n.minus(q.times(d2 = d));
          n = d2;
        }

        d2 = div(md.minus(d0), d1, 0, 1);
        n0 = n0.plus(d2.times(n1));
        d0 = d0.plus(d2.times(d1));
        n0.s = n1.s = x.s;
        e = e * 2;

        // Determine which fraction is closer to x, n0/d0 or n1/d1
        r = div(n1, d1, e, ROUNDING_MODE).minus(x).abs().comparedTo(
            div(n0, d0, e, ROUNDING_MODE).minus(x).abs()) < 1 ? [n1, d1] : [n0, d0];

        MAX_EXP = exp;

        return r;
      };


      /*
       * Return the value of this BigNumber converted to a number primitive.
       */
      P.toNumber = function () {
        return +valueOf(this);
      };


      /*
       * Return a string representing the value of this BigNumber rounded to sd significant digits
       * using rounding mode rm or ROUNDING_MODE. If sd is less than the number of digits
       * necessary to represent the integer part of the value in fixed-point notation, then use
       * exponential notation.
       *
       * [sd] {number} Significant digits. Integer, 1 to MAX inclusive.
       * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
       *
       * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {sd|rm}'
       */
      P.toPrecision = function (sd, rm) {
        if (sd != null) intCheck(sd, 1, MAX);
        return format(this, sd, rm, 2);
      };


      /*
       * Return a string representing the value of this BigNumber in base b, or base 10 if b is
       * omitted. If a base is specified, including base 10, round according to DECIMAL_PLACES and
       * ROUNDING_MODE. If a base is not specified, and this BigNumber has a positive exponent
       * that is equal to or greater than TO_EXP_POS, or a negative exponent equal to or less than
       * TO_EXP_NEG, return exponential notation.
       *
       * [b] {number} Integer, 2 to ALPHABET.length inclusive.
       *
       * '[BigNumber Error] Base {not a primitive number|not an integer|out of range}: {b}'
       */
      P.toString = function (b) {
        var str,
          n = this,
          s = n.s,
          e = n.e;

        // Infinity or NaN?
        if (e === null) {
          if (s) {
            str = 'Infinity';
            if (s < 0) str = '-' + str;
          } else {
            str = 'NaN';
          }
        } else {
          if (b == null) {
            str = e <= TO_EXP_NEG || e >= TO_EXP_POS
             ? toExponential(coeffToString(n.c), e)
             : toFixedPoint(coeffToString(n.c), e, '0');
          } else if (b === 10) {
            n = round(new BigNumber(n), DECIMAL_PLACES + e + 1, ROUNDING_MODE);
            str = toFixedPoint(coeffToString(n.c), n.e, '0');
          } else {
            intCheck(b, 2, ALPHABET.length, 'Base');
            str = convertBase(toFixedPoint(coeffToString(n.c), e, '0'), 10, b, s, true);
          }

          if (s < 0 && n.c[0]) str = '-' + str;
        }

        return str;
      };


      /*
       * Return as toString, but do not accept a base argument, and include the minus sign for
       * negative zero.
       */
      P.valueOf = P.toJSON = function () {
        return valueOf(this);
      };


      P._isBigNumber = true;

      P[Symbol.toStringTag] = 'BigNumber';

      // Node.js v10.12.0+
      P[Symbol.for('nodejs.util.inspect.custom')] = P.valueOf;

      if (configObject != null) BigNumber.set(configObject);

      return BigNumber;
    }


    // PRIVATE HELPER FUNCTIONS

    // These functions don't need access to variables,
    // e.g. DECIMAL_PLACES, in the scope of the `clone` function above.


    function bitFloor(n) {
      var i = n | 0;
      return n > 0 || n === i ? i : i - 1;
    }


    // Return a coefficient array as a string of base 10 digits.
    function coeffToString(a) {
      var s, z,
        i = 1,
        j = a.length,
        r = a[0] + '';

      for (; i < j;) {
        s = a[i++] + '';
        z = LOG_BASE - s.length;
        for (; z--; s = '0' + s);
        r += s;
      }

      // Determine trailing zeros.
      for (j = r.length; r.charCodeAt(--j) === 48;);

      return r.slice(0, j + 1 || 1);
    }


    // Compare the value of BigNumbers x and y.
    function compare(x, y) {
      var a, b,
        xc = x.c,
        yc = y.c,
        i = x.s,
        j = y.s,
        k = x.e,
        l = y.e;

      // Either NaN?
      if (!i || !j) return null;

      a = xc && !xc[0];
      b = yc && !yc[0];

      // Either zero?
      if (a || b) return a ? b ? 0 : -j : i;

      // Signs differ?
      if (i != j) return i;

      a = i < 0;
      b = k == l;

      // Either Infinity?
      if (!xc || !yc) return b ? 0 : !xc ^ a ? 1 : -1;

      // Compare exponents.
      if (!b) return k > l ^ a ? 1 : -1;

      j = (k = xc.length) < (l = yc.length) ? k : l;

      // Compare digit by digit.
      for (i = 0; i < j; i++) if (xc[i] != yc[i]) return xc[i] > yc[i] ^ a ? 1 : -1;

      // Compare lengths.
      return k == l ? 0 : k > l ^ a ? 1 : -1;
    }


    /*
     * Check that n is a primitive number, an integer, and in range, otherwise throw.
     */
    function intCheck(n, min, max, name) {
      if (n < min || n > max || n !== mathfloor(n)) {
        throw Error
         (bignumberError + (name || 'Argument') + (typeof n == 'number'
           ? n < min || n > max ? ' out of range: ' : ' not an integer: '
           : ' not a primitive number: ') + String(n));
      }
    }


    // Assumes finite n.
    function isOdd(n) {
      var k = n.c.length - 1;
      return bitFloor(n.e / LOG_BASE) == k && n.c[k] % 2 != 0;
    }


    function toExponential(str, e) {
      return (str.length > 1 ? str.charAt(0) + '.' + str.slice(1) : str) +
       (e < 0 ? 'e' : 'e+') + e;
    }


    function toFixedPoint(str, e, z) {
      var len, zs;

      // Negative exponent?
      if (e < 0) {

        // Prepend zeros.
        for (zs = z + '.'; ++e; zs += z);
        str = zs + str;

      // Positive exponent
      } else {
        len = str.length;

        // Append zeros.
        if (++e > len) {
          for (zs = z, e -= len; --e; zs += z);
          str += zs;
        } else if (e < len) {
          str = str.slice(0, e) + '.' + str.slice(e);
        }
      }

      return str;
    }


    // EXPORT


    var BigNumber = clone();

    var bignumber = /*#__PURE__*/Object.freeze({
                __proto__: null,
                BigNumber: BigNumber,
                'default': BigNumber
    });

    var BigNumber$1 = getCjsExportFromNamespace(bignumber);

    BigNumber$1.config({ RANGE: [-30, 30], EXPONENTIAL_AT: 1e+9 });
    BigNumber$1.set({ DECIMAL_PLACES: 30, ROUNDING_MODE: BigNumber$1.ROUND_DOWN });    // equivalent

    function Encoder (type, value) {
        const throwError = (val) => {
            throw new Error(`Error encoding ${val} to ${type}`)
        };
        const countDecimals = (n) => {
            if(Math.floor(n) === n) return 0;
            try{
                return n.toString().split(".")[1].length
            }catch (e){
                return 0
            } 
        };
        const isString = (val) => typeof val === 'string' || val instanceof String;
        const isArray = (val) => val && typeof val === 'object' && val.constructor === Array;
        const isObject = (val) => val && typeof val === 'object' && val.constructor === Object;
        const isDate = (val) => val instanceof Date;
        const isBoolean = (val) => typeof val === 'boolean';

        const isNumber = (val) => {
            if (isArray(val)) return false
            return !isNaN(encodeBigNumber(val).toNumber())
        };

        const isInteger = (val) => {
            if (!isNumber(val)) return false
            if (countDecimals(val) === 0) return true
            return false
        };
        const encodeInt = (val) => {
            if (!isNumber(val)) throwError(val);
            else return parseInt(val)
        };
        const isFloat = (val) => {
            if (!isNumber(val)) return false
            if (countDecimals(val) === 0) return false
            return true
        };
        const encodeFloat = (val) => {
            if(!isNumber(val)) throwError(val);
            if (!BigNumber$1.isBigNumber(val)) val = new BigNumber$1(val);

            return {"__fixed__": val.toFixed(30).replace(/^0+(\d)|(\d)0+$/gm, '$1$2')}
        };
        const encodeNumber = (val) => {
            if(!isNumber(val)) throwError(val);
            if (isFloat(val)) {
                if (!BigNumber$1.isBigNumber(val)) val = new BigNumber$1(val);
                return {"__fixed__": val.toFixed(30).replace(/^0+(\d)|(\d)0+$/gm, '$1$2')}
            }
            if (isInteger(val)) return parseInt(val)   
        };
        const encodeBigNumber = (val) => {
            if (!BigNumber$1.isBigNumber(val)) val = new BigNumber$1(val);
            return val
        };

        const encodeBool = (val) => {
            if (isBoolean(val)) return val
            if (val === 'true' || val === 1) return true
            if (val === 'false' || val === 0) return false
            throwError(val);
        };
        const encodeStr = (val) => {
            if (isString(val)) return val
            if (isDate(val)) return val.toISOString()
            return JSON.stringify(val)
        };
        const encodeDateTime = (val) => {
            val = !isDate(val) ? new Date(val) : val;
            if (!isDate(val)) throwError(val);
            return {'__time__': [
                val.getUTCFullYear(), 
                val.getUTCMonth(), 
                val.getUTCDate(), 
                val.getUTCHours(), 
                val.getUTCMinutes(), 
                val.getUTCSeconds(), 
                val.getUTCMilliseconds()
            ]}
        };
        const encodeTimeDelta = (val) => {
            const time = isDate(val) ? val.getTime() : new Date(val).getTime();
            const days = parseInt(time  / 1000 / 60 / 60 / 24);
            const seconds = (time - (days * 24 * 60 * 60 * 1000)) / 1000;
            return {'__delta__':[days, seconds]}
        };

        const encodeList = (val) => {
            if (isArray(val)) return parseObject(val)
            try{
                val = JSON.parse(val);
            }catch(e){
                throwError(val);
            }
            if (isArray(val)) return parseObject(val)
            throwError(val);
        };

        const encodeDict = (val) => {
            if (isObject(val)) return parseObject(val)
            try{
                val = JSON.parse(val);
            }catch(e){
                throwError(val);
            }
            if (isObject(val)) return parseObject(val)
            throwError(val);
        };

        const encodeObject = (val) => {
            try {
                return encodeList(val)
            }catch(e){
                return encodeDict(val)
            }
        };

        function parseObject (obj) {
            const encode = (k, v) => {
                if (k === "datetime" || k === "datetime.datetime" ) return Encoder("datetime.datetime", v)
                if (k === "timedelta" || k === "datetime.timedelta") return Encoder("datetime.timedelta", v)
                if (k !== "__fixed__" && isFloat(v)) return encodeFloat(v)
                return v
            };
        
            const fixDatetime = (k, v) => {
                const isDatetimeObject = (val) => {
                    let datetimeTypes = ['datetime.datetime', 'datetime', 'datetime.timedelta', 'timedelta'];
                    return Object.keys(val).length === 1 && datetimeTypes.filter(f => f === Object.keys(val)[0]).length > 0

                };

                if (v.constructor === Array) {
                    v.map(val => {
                        if (Object.keys(val).length === 1 && isDatetimeObject(v)) return val[Object.keys(val)[0]]
                        //if (isFloat(val)) return encodeFloat(val)
                        return val
                    });
                }
                if (v.constructor === Object) {
                    if (Object.keys(v).length === 1 && isDatetimeObject(v)) return v[Object.keys(v)[0]]
                }

                //if (isFloat(v)) return encodeFloat(v)

                return v
            };
        
            let encodeValues = JSON.stringify(obj, encode);
            return JSON.parse(encodeValues, fixDatetime)
        }

        const encoder = {
            str: encodeStr,
            string: encodeStr,
            float: encodeFloat,
            int: encodeInt,
            bool: encodeBool,
            boolean: encodeBool,
            dict: encodeDict,
            list: encodeList,
            Any: () => value,
            "datetime.timedelta": encodeTimeDelta, 
            "datetime.datetime": encodeDateTime,
            timedelta: encodeTimeDelta, 
            datetime: encodeDateTime,
            number: encodeNumber,
            object: encodeObject,
            bigNumber: encodeBigNumber,
        };
        
        if (Object.keys(encoder).includes(type)) return encoder[type](value)
        else throw new Error(`Error: ${type} is not a valid encoder type.`)
    }

    Encoder.BigNumber = BigNumber$1;

    var encoder = {
        Encoder
    };
    var encoder_1 = encoder.Encoder;

    const { validateTypes: validateTypes$1 } = validators;
    const fetch = browser$1.default;

    class LamdenMasterNode_API{
        constructor(networkInfoObj){
            if (!validateTypes$1.isObjectWithKeys(networkInfoObj)) throw new Error(`Expected Object and got Type: ${typeof networkInfoObj}`)
            if (!validateTypes$1.isArrayWithValues(networkInfoObj.hosts)) throw new Error(`HOSTS Required (Type: Array)`)

            this.hosts = this.validateHosts(networkInfoObj.hosts);        
        }
        //This will throw an error if the protocol wasn't included in the host string
        vaidateProtocol(host){
            let protocols = ['https://', 'http://'];
            if (protocols.map(protocol => host.includes(protocol)).includes(true)) return host
            throw new Error('Host String must include http:// or https://')
        }
        validateHosts(hosts){
            return hosts.map(host => this.vaidateProtocol(host.toLowerCase()))
        }

        get host() {return this.hosts[Math.floor(Math.random() * this.hosts.length)]}
        get url() {return this.host}

        send(method, path, data, overrideURL, callback){
            let parms = '';
            if (Object.keys(data).includes('parms')) {
                parms = this.createParms(data.parms);
            }

            let options = {};
            if (method === 'POST'){
                let headers = {'Content-Type': 'application/json'};
                options.method = method;
                options.headers = headers;
                options.body = data;
            }

            return fetch(`${overrideURL ? overrideURL : this.url}${path}${parms}`, options)
                .then(async (res) => {
                    if (res.status === 200){
                        let json = await res.json();
    					callback(json, undefined);
    					return json
                    }else {
    					let error = validateTypes$1.isStringWithValue(res.statusText) ? res.statusText : false;
    					callback(undefined, error);
    					return error
                    }
                })
                .catch(err => {
                    return callback(undefined, err.toString())
                })
        }

        createParms(parms){
            if (Object.keys(parms).length === 0) return ''
            let parmString = '?';
            Object.keys(parms).forEach(key => {
                parmString = `${parmString}${key}=${parms[key]}&`;
            });
            return parmString.slice(0, -1);
        }

        async getContractInfo(contractName){
            const returnInfo = (res) => {
                try{
                    if (res.name) return res
                } catch (e){}
                return null;
            };
            let path = `/contracts/${contractName}`;
            return this.send('GET', path, {}, undefined, (res, err) => returnInfo(res))
                    .then(res => returnInfo(res))
        }

        async getVariable(contract, variable, key = ''){
            let parms = {};
            if (validateTypes$1.isStringWithValue(key)) parms.key = key;

            let path = `/contracts/${contract}/${variable}/`;

            const returnValue = (res) => {
                try{
                    if (res.value) return res.value
                } catch (e){}
                return null;
            };
            return this.send('GET', path, {parms}, undefined, (res, err) => returnValue(res))
                        .then(res => returnValue(res))
        }

        async getContractMethods(contract){
            const getMethods = (res) => {
                try{
                    if (res.methods) return res.methods
                } catch (e){}
                return [];
            };
            let path = `/contracts/${contract}/methods`;
            return this.send('GET', path, {}, undefined, (res, err) => getMethods(res))
                .then(res => getMethods(res))
        }

        async getContractVariables(contract){
            const getVariables = (res) => {
                try{
                    if (res.variables) return res
                } catch (e){}
                return {};
            };
            let path = `/contracts/${contract}/variables`;
            return this.send('GET', path, {}, undefined, (res, err) => getVariables(res))
            .then(res => getVariables(res))
        }

        async pingServer(){
            const getStatus = (res) => {
                try { 
                    if (res.status) return true;
                } catch (e) {}
                return false
            };
            let response = await this.send('GET', '/ping', {}, undefined, (res, err) => getStatus(res));
            return getStatus(response)

        }

        async getCurrencyBalance(vk){
            let balanceRes = await this.getVariable('currency', 'balances', vk);
            if (!balanceRes) return encoder_1('bigNumber', 0);
            if (balanceRes.__fixed__) return encoder_1('bigNumber', balanceRes.__fixed__)
            return encoder_1('bigNumber', balanceRes.toString());
        }

        async contractExists(contractName){
            const exists = (res) => {
                try { 
                    if (res.name) return true;
                } catch (e) {}
                return false
            };
            let path = `/contracts/${contractName}`;
            return this.send('GET', path, {}, undefined, (res, err) => exists(res))
            .then(res => exists(res))
        }

        async sendTransaction(data, url = undefined, callback){
            return this.send('POST', '/', JSON.stringify(data), url, (res, err) => {
                if (err){
                    if (callback) {
                        callback(undefined, err);
                        return;
                    } 
                    else return err
                }
                if (callback) {
                    callback(res, undefined);
                    return
                }
                return res;
            })   
        }

        async getNonce(sender, callback){
            if (!validateTypes$1.isStringHex(sender)) return `${sender} is not a hex string.`
            let path = `/nonce/${sender}`; 
            let url = this.host;
            return this.send('GET', path, {}, url, (res, err) => {
                if (err){
                    if (callback) {
                        callback(undefined, `Unable to get nonce for ${sender} on network ${url}`);
                        return
                    } 
                    return `Unable to get nonce for ${sender} on network ${url}`
                }
                res.masternode = url;
                if (callback) {
                    callback(res, undefined);
                    return
                }
                else return res;
            })
        }

        async checkTransaction(hash, callback){
            const parms = {hash};
            return this.send('GET', '/tx', {parms}, undefined, (res, err) => {
                if (err){
                    if (callback) {
                        callback(undefined, err);
                        return;
                    }
                    else return err
                }
                if (callback) {
                    callback(res, undefined);
                    return
                }
                return res;
            })  
        }
    }

    const { validateTypes: validateTypes$2 } = validators;

    class Network {
        // Constructor needs an Object with the following information to build Class.
        //
        // networkInfo: {
        //      hosts: <array> list of masternode hostname/ip urls,
        //      type: <string> "testnet", "mainnet" or "custom"
        //  },
        constructor(networkInfoObj){
            //Reject undefined or missing info
            if (!validateTypes$2.isObjectWithKeys(networkInfoObj)) throw new Error(`Expected Network Info Object and got Type: ${typeof networkInfoObj}`)
            if (!validateTypes$2.isArrayWithValues(networkInfoObj.hosts)) throw new Error(`HOSTS Required (Type: Array)`)

            this.type = validateTypes$2.isStringWithValue(networkInfoObj.type) ? networkInfoObj.type.toLowerCase() : "custom";
            this.events = new EventEmitter();
            this.hosts = this.validateHosts(networkInfoObj.hosts);
            this.currencySymbol = validateTypes$2.isStringWithValue(networkInfoObj.currencySymbol) ? networkInfoObj.currencySymbol : 'TAU';
            this.name = validateTypes$2.isStringWithValue(networkInfoObj.name) ? networkInfoObj.name : 'lamden network';
            this.lamden = validateTypes$2.isBoolean(networkInfoObj.lamden) ? networkInfoObj.lamden : false;
            this.blockExplorer = validateTypes$2.isStringWithValue(networkInfoObj.blockExplorer) ? networkInfoObj.blockExplorer : undefined;
        
            this.online = false;
            try{
                this.API = new LamdenMasterNode_API(networkInfoObj);
            } catch (e) {
                throw new Error(e)
            }
        }
        //This will throw an error if the protocol wasn't included in the host string
        vaidateProtocol(host){
            let protocols = ['https://', 'http://'];
            if (protocols.map(protocol => host.includes(protocol)).includes(true)) return host
            throw new Error('Host String must include http:// or https://')
        }
        validateHosts(hosts){
            return hosts.map(host => this.vaidateProtocol(host.toLowerCase()))
        }
        //Check if the network is online
        //Emits boolean as 'online' event
        //Also returns status as well as passes status to a callback
        async ping(callback = undefined){
            this.online = await this.API.pingServer();
            this.events.emit('online', this.online);
            if (validateTypes$2.isFunction(callback)) callback(this.online);
            return this.online
        }
        get host() {return this.hosts[Math.floor(Math.random() * this.hosts.length)]}
        get url() {return this.host}
        getNetworkInfo(){
            return {
                name: this.name,
                lamden: this.lamden,
                type: this.type,
                hosts: this.hosts,
                url: this.url,
                online: this.online,
            }
        }
    }

    const { validateTypes: validateTypes$3 } = validators;

    class TransactionBuilder extends Network {
        // Constructor needs an Object with the following information to build Class.
        //  
        // arg[0] (networkInfo): {  //Can also accpet a Lamden "Network Class"
        //      host: <string> masternode webserver hostname/ip,
        //      type: <string> "testnet", "mainnet" or "mockchain"
        //  }
        //  arg[1] (txInfo): {
        //      uid: [Optional] <string> unique ID for tracking purposes, 
        //      senderVk: <hex string> public key of the transaction sender,
        //      contractName: <string> name of lamden smart contract,
        //      methodName: <string> name of method to call in contractName,
        //      kwargs: <object> key/values of args to pass to methodName
        //              example: kwargs.to = "270add00fc708791c97aeb5255107c770434bd2ab71c2e103fbee75e202aa15e"
        //                       kwargs.amount = 1000
        //      stampLimit: <integer> the max amount of stamps the tx should use.  tx could use less. if tx needs more the tx will fail.
        //      nonce: [Optional] <integer> send() will attempt to retrieve this info automatically
        //      processor [Optional] <string> send() will attempt to retrieve this info automatically
        //  }
        //  arg[2] (txData): [Optional] state hydrating data
        constructor(networkInfo, txInfo, txData) {
            if (validateTypes$3.isSpecificClass(networkInfo, 'Network'))
                super(networkInfo.getNetworkInfo());
            else super(networkInfo);

            //Validate arguments
            if(!validateTypes$3.isObjectWithKeys(txInfo)) throw new Error(`txInfo object not found`)
            if(!validateTypes$3.isStringHex(txInfo.senderVk)) throw new Error(`Sender Public Key Required (Type: Hex String)`)
            if(!validateTypes$3.isStringWithValue(txInfo.contractName)) throw new Error(`Contract Name Required (Type: String)`)
            if(!validateTypes$3.isStringWithValue(txInfo.methodName)) throw new Error(`Method Required (Type: String)`)
            if(!validateTypes$3.isInteger(txInfo.stampLimit)) throw new Error(`Stamps Limit Required (Type: Integer)`)        

            //Store variables in self for reference
            this.uid = validateTypes$3.isStringWithValue(txInfo.uid) ? txInfo.uid : undefined;
            this.sender = txInfo.senderVk;
            this.contract = txInfo.contractName;
            this.method = txInfo.methodName;
            this.kwargs = {};
            if(validateTypes$3.isObject(txInfo.kwargs)) this.kwargs = txInfo.kwargs;
            this.stampLimit = txInfo.stampLimit;

            //validate and set nonce and processor if user provided them
            if (typeof txInfo.nonce !== 'undefined'){
                if(!validateTypes$3.isInteger(txInfo.nonce)) throw new Error(`arg[6] Nonce is required to be an Integer, type ${typeof txInfo.none} was given`)
                this.nonce = txInfo.nonce;
            }
            if (typeof txInfo.processor !== 'undefined'){
                if(!validateTypes$3.isStringWithValue(txInfo.processor)) throw new Error(`arg[7] Processor is required to be a String, type ${typeof txInfo.processor} was given`)
                this.processor = txInfo.processor;
            }
            
            this.signature;
            this.transactionSigned = false;

            //Transaction result information
            this.nonceResult = {};
            this.txSendResult = {errors:[]};
            this.txBlockResult = {};
            this.txHash;
            this.txCheckResult = {};
            this.txCheckAttempts = 0;
            this.txCheckLimit = 10;
            
            //Hydrate other items if passed
            if (txData){
                if (txData.uid) this.uid = txData.uid;
                if (validateTypes$3.isObjectWithKeys(txData.txSendResult)) this.txSendResult = txData.txSendResult;
                if (validateTypes$3.isObjectWithKeys(txData.nonceResult)){
                    this.nonceResult = txData.nonceResult;
                    if (validateTypes$3.isInteger(this.nonceResult.nonce)) this.nonce = this.nonceResult.nonce;
                    if (validateTypes$3.isStringWithValue(this.nonceResult.processor)) this.processor = this.nonceResult.processor;
                }
                if (validateTypes$3.isObjectWithKeys(txData.txSendResult)){
                    this.txSendResult = txData.txSendResult;
                    if (this.txSendResult.hash) this.txHash = this.txSendResult.hash;
                } 
                if (validateTypes$3.isObjectWithKeys(txData.txBlockResult)) this.txBlockResult = txData.txBlockResult;
                if (validateTypes$3.isObjectWithKeys(txData.resultInfo)) this.resultInfo = txData.resultInfo;
            }
            //Create Capnp messages and transactionMessages
            this.makePayload();
        }
        makePayload(){
            this.payload = {
                contract: this.contract,
                function: this.method,
                kwargs: this.kwargs,
                nonce: this.nonce,
                processor: this.processor,
                sender: this.sender,
                stamps_supplied: this.stampLimit
            };
            this.sortedPayload = this.sortObject(this.payload);
        }
        makeTransaction(){
            this.tx = {
                metadata: {
                    signature: this.signature,
                    timestamp: parseInt(+new Date / 1000),
                },
                payload: this.sortedPayload.orderedObj
            };
        }
        verifySignature(){
            //Verify the signature is correct
            if (!this.transactionSigned) throw new Error('Transaction has not be been signed. Use the sign(<private key>) method first.')
            const stringBuffer = Buffer.from(this.sortedPayload.json);
            const stringArray = new Uint8Array(stringBuffer);
            return verify(this.sender, stringArray, this.signature)
        }
        sign(sk = undefined, userWallet = undefined){
            const stringBuffer = Buffer.from(this.sortedPayload.json);
            const stringArray = new Uint8Array(stringBuffer);
            if (userWallet) this.signature = userWallet.sign(stringArray);
            else this.signature = sign(sk, stringArray);
            this.transactionSigned = true;
        }
        sortObject(object){
            const processObj = (obj) => {
                const getType = (value) => {
                 return Object.prototype.toString.call(value)
                };
                const isArray = (value) => {
                 if(getType(value) === "[object Array]") return true;
                 return false;  
                };
                const isObject = (value) => {
                 if(getType(value) === "[object Object]") return true;
                 return false;  
                };
            
                const sortObjKeys = (unsorted) => {
                    const sorted = {};
                    Object.keys(unsorted).sort().forEach(key => sorted[key] = unsorted[key]);
                    return sorted
                };
            
                const formatKeys = (unformatted) => {
                    Object.keys(unformatted).forEach(key => {
                            if (isArray(unformatted[key])) unformatted[key] = unformatted[key].map(item => {
                            if (isObject(item)) return formatKeys(item)
                            return item
                        });
                        if (isObject(unformatted[key])) unformatted[key] = formatKeys(unformatted[key]);
                    });
                    return sortObjKeys(unformatted)
                };
            
                if (!isObject(obj)) throw new TypeError('Not a valid Object')
                    try{
                        obj = JSON.parse(JSON.stringify(obj));
                    } catch (e) {
                        throw new TypeError('Not a valid JSON Object')
                    }
                return formatKeys(obj)
            };
            const orderedObj = processObj(object);
            return { 
                orderedObj, 
                json: JSON.stringify(orderedObj)
            }
        }
        async getNonce(callback = undefined) {
            let timestamp =  new Date().toUTCString();
            this.nonceResult = await this.API.getNonce(this.sender);
            if (typeof this.nonceResult.nonce === 'undefined'){
                throw new Error(this.nonceResult)
            }
            this.nonceResult.timestamp = timestamp;
            this.nonce = this.nonceResult.nonce;
            this.processor = this.nonceResult.processor;
            this.nonceMasternode = this.nonceResult.masternode;
            //Create payload object
            this.makePayload();

            if (!callback) return this.nonceResult;
            return callback(this.nonceResult)
        }
        async send(sk = undefined, masternode = undefined, callback = undefined) {
            //Error if transaction is not signed and no sk provided to the send method to sign it before sending
            if (!validateTypes$3.isStringWithValue(sk) && !this.transactionSigned){
                throw new Error(`Transation Not Signed: Private key needed or call sign(<private key>) first`);
            }

            let timestamp =  new Date().toUTCString();

            try{
                //If the nonce isn't set attempt to get it
                if (isNaN(this.nonce) || !validateTypes$3.isStringWithValue(this.processor)) await this.getNonce();
                //if the sk is provided then sign the transaction
                if (validateTypes$3.isStringWithValue(sk)) this.sign(sk);
                //Serialize transaction
                this.makeTransaction();
                //Send transaction to the masternode
                let masternodeURL = masternode;
                if (!masternodeURL && this.nonceMasternode) masternodeURL = this.nonceMasternode;
                let response = await this.API.sendTransaction(this.tx, masternodeURL);
                //Set error if txSendResult doesn't exist
                if (!response || validateTypes$3.isStringWithValue(response)){
                    this.txSendResult.errors = [response || "Unknown Transaction Error"];
                }else {
                    if (response.error) this.txSendResult.errors = [response.error];
                    else this.txSendResult = response;
                }
            } catch (e){
                this.txSendResult.errors = [e.message];
            }
            this.txSendResult.timestamp = timestamp;
            return this.handleMasterNodeResponse(this.txSendResult, callback)
        }
        checkForTransactionResult(callback = undefined){
            return new Promise((resolve) => {
                let timerId = setTimeout(async function checkTx() {
                    this.txCheckAttempts = this.txCheckAttempts + 1;
                    let res = await this.API.checkTransaction(this.txHash);
                    let checkAgain = false;
                    let timestamp =  new Date().toUTCString();
                    if (typeof res === 'string' || !res) {
                        if (this.txCheckAttempts < this.txCheckLimit){
                            checkAgain = true;
                        }else {
                            this.txCheckResult.errors = [
                                `Retry Attmpts ${this.txCheckAttempts} hit while checking for Tx Result.`,
                                res
                            ];
                        }
                    }else {
                        if (res.error){
                            if (res.error === 'Transaction not found.'){
                                if (this.txCheckAttempts < this.txCheckLimit){
                                    checkAgain = true;
                                }else {
                                    this.txCheckResult.errors = [res.error, `Retry Attmpts ${this.txCheckAttempts} hit while checking for Tx Result.`];
                                }
                            }else {
                                this.txCheckResult.errors = [res.error];
                            }
                        }else {
                            this.txCheckResult = res;
                        }
                    }
                    if (checkAgain) timerId = setTimeout(checkTx.bind(this), 1000);
                    else {
                        if (validateTypes$3.isNumber(this.txCheckResult.status)){
                            if (this.txCheckResult.status > 0){
                                if (!validateTypes$3.isArray(this.txCheckResult.errors)) this.txCheckResult.errors = [];
                                this.txCheckResult.errors.push('This transaction returned a non-zero status code');
                            }
                        }
                        this.txCheckResult.timestamp = timestamp;
                        clearTimeout(timerId);
                        resolve(this.handleMasterNodeResponse(this.txCheckResult, callback));
                    }
                }.bind(this), 1000);
            })
        }
        handleMasterNodeResponse(result, callback = undefined){
            //Check to see if this is a successful transacation submission
            if (validateTypes$3.isStringWithValue(result.hash) && validateTypes$3.isStringWithValue(result.success)){
                this.txHash = result.hash;
                this.setPendingBlockInfo();
            }else {
                this.setBlockResultInfo(result);
                this.txBlockResult = result;
            }
            this.events.emit('response', result, this.resultInfo.subtitle);
            if (validateTypes$3.isFunction(callback)) callback(result);
            return result
        }
        setPendingBlockInfo(){
            this.resultInfo =  {
                title: 'Transaction Pending',
                subtitle: 'Your transaction was submitted and is being processed',
                message: `Tx Hash: ${this.txHash}`,
                type: 'success',
            };
            return this.resultInfo;
        }
        setBlockResultInfo(result){
            let erroredTx = false;
            let errorText = `returned an error and `;
            let statusCode = validateTypes$3.isNumber(result.status) ? result.status : undefined;
            let stamps = (result.stampsUsed || result.stamps_used) || 0;
            let message = '';
            if(validateTypes$3.isArrayWithValues(result.errors)){
                erroredTx = true;
                message = `This transaction returned ${result.errors.length} errors.`;
                if (result.result){
                    if (result.result.includes('AssertionError')) result.errors.push(result.result);
                }
            }
            if (statusCode && erroredTx) errorText = `returned status code ${statusCode} and `;
              
            this.resultInfo = {
                title: `Transaction ${erroredTx ? 'Failed' : 'Successful'}`,
                subtitle: `Your transaction ${erroredTx ? `${errorText} ` : ''}used ${stamps} stamps`,
                message,
                type: `${erroredTx ? 'error' : 'success'}`,
                errorInfo: erroredTx ? result.errors : undefined,
                returnResult: result.result || "",
                stampsUsed: stamps,
                statusCode
            };
            return this.resultInfo;
        }
        getResultInfo(){
            return this.resultInfo;
        }
        getTxInfo(){
            return {
                senderVk: this.sender,
                contractName: this.contract,
                methodName: this.method,
                kwargs: this.kwargs,
                stampLimit: this.stampLimit
            }
        }
        getAllInfo(){
            return {
                uid: this.uid,
                txHash: this.txHash,
                signed: this.transactionSigned,
                tx: this.tx,
                signature: this.signature,
                networkInfo: this.getNetworkInfo(),
                txInfo: this.getTxInfo(),
                txSendResult: this.txSendResult,
                txBlockResult: this.txBlockResult,
                resultInfo: this.getResultInfo(),
                nonceResult: this.nonceResult
            }
        }
    }

    const { validateTypes: validateTypes$4 } = validators;

    class TransactionBatcher extends Network {
        constructor(networkInfo) {
            if (validateTypes$4.isSpecificClass(networkInfo, 'Network'))
                super(networkInfo.getNetworkInfo());
            else super(networkInfo);

            this.txBatches = {};
            this.overflow = [];
            this.nonceResults = {};
            this.running = false;
        }
        addTransaction(txInfo){
            if (this.running) {
                this.overflow.push(txInfo);
                return
            }
            this.validateTransactionInfo(txInfo);
            if (!this.txBatches[txInfo.senderVk]) this.txBatches[txInfo.senderVk] = [];
            this.txBatches[txInfo.senderVk].push(txInfo);
        }
        addTransactionList(txList){
            txList.forEach(txInfo => this.addTransaction(txInfo));
        }
        processOverflow(){
            const overflow = this.overflow;
            this.overflow = [];
            overflow.forEach(txInfo => this.addTransaction(txInfo));
        }
        hasTransactions(){
            let test = Object.keys(this.txBatches).map(senderVk => this.txBatches[senderVk].length);
            test.filter(f => f === 0);
            if (test.length > 0 ) return true
            return false
        }
        validateTransactionInfo(txInfo){
            try{
                new TransactionBuilder(txInfo);
            }catch(e){
                return false
            }
            return true
        }
        async getStartingNonce(senderVk, callback = undefined){
            let timestamp =  new Date().toUTCString();
            let response = await this.API.getNonce(senderVk);
            if (typeof response.nonce === 'undefined'){
                throw new Error(response)
            }
            response.timestamp = timestamp;
            this.nonceResults[senderVk] = response;

            if (callback) callback(response);
            return response;
        }
        async sendAllBatches(keyDict){
            if (this.running) return
            let sentTransactions = [];
            this.running = true;
            
            await Promise.all(Object.keys(this.txBatches).map((senderVk) => {
                const senderBatch = this.txBatches[senderVk].splice(0,15);
                if (senderBatch.length <= 15) delete this.txBatches[senderVk];
                
                return new Promise(async (resolver) => {
                    if (senderBatch.length === 0 ) resolver();

                    if (!keyDict[senderVk]) throw new Error(`Cannot sign batch for ${senderVk}. No signing key provided.`)
                    let nonceResponse = await this.getStartingNonce(senderVk);
                    let txBatch = this.setBatchNonces(nonceResponse, senderBatch);
                    this.signBatch(txBatch, keyDict[senderVk]);
                    this.sendBatch(txBatch).then(sentList => {
                        sentTransactions = [...sentTransactions, ...sentList];
                        resolver();
                    });                
                })
            }));

            try{
                return Promise.all(sentTransactions)
            }catch (e){}
            finally{
                this.running = false;
                this.processOverflow();
            }
        }
        setBatchNonces(nonceResult, txList){
            return txList.map((txInfo, index) => {
                txInfo.nonce = nonceResult.nonce + index;
                txInfo.processor = nonceResult.processor;
                return new TransactionBuilder({hosts: [nonceResult.masternode]}, txInfo)
            }).sort((a, b) => a.nonce - b.nonce)
        }
        signBatch(txBatch, key){
            txBatch.forEach(txBuilder => txBuilder.sign(key));
        }
        sendBatch(txBatch){
            let resolvedTransactions = [];
            return new Promise(resolver => {
                const resolve = (index) => {
                    if ((index + 1) === txBatch.length) resolver(resolvedTransactions);
                };
                txBatch.forEach((txBuilder, index) => {
                    const delayedSend = () => {
                        resolvedTransactions[index] = txBuilder.send().then(() => {return txBuilder});
                        resolve(index);
                    };
                    setTimeout(delayedSend, 1200 * index);
                });
            })
        }
    }

    const { validateTypes: validateTypes$5, assertTypes: assertTypes$1 } = validators;

    class Keystore {
        /**
         * Lamden Keystores
         *
         * This Class will create a lamden keystore instance
         *
         * @param {Object|undefined} arg constructor argument
         * @param {String|undefined} arg.key Create an instance and load it with one private key
         * @param {String|undefined} arg.keyList Create an instance and load it with an array of private keys
         * @param {String|undefined} arg.keystoreData Create an instance from an existing keystore file data
         * @return {Keystore}
         */
        constructor(arg = undefined) {
            this.KEYSTORE_VERSION = "1.0";
            this.password = null;
            this.encryptedData = null;

            this.keyList = (() => {
                let keyList = [];
                let outerClass = this;
                let wallets = [];

                const addKey = (key) => {
                    keyList.push(key);
                    createWallets();
                };
                const deleteKey = (position) => {
                    keyList.splice(position, 1);
                    createWallets();
                };
                const clearKeys = () => {
                    keyList = [];
                    createWallets();
                };
                const numOfKeys = () => keyList.length;
                const createWallets = () => {
                    wallets = [];
                    keyList.forEach(keyInfo => {
                        let newWallet = create_wallet({sk: keyInfo.sk, keepPrivate: true});
                        newWallet = {...newWallet, ...keyInfo};
                        delete newWallet.sk;
                        wallets.push(newWallet);
                    });
                };
                const createKeystore = (password, hint = undefined) => {
                    return JSON.stringify({
                        data: encryptObject(password, {version: outerClass.KEYSTORE_VERSION, keyList}),
                        w: !hint ? "" : encryptStrHash('n1ahcKc0lb', hint),
                    });
                };
                const decryptKeystore = (password, data) => {
                    let decrypted = decryptObject(password, data);
                    if (decrypted) {
                        assertTypes$1.isArray(decrypted.keyList);
                        decrypted.keyList.forEach(keyInfo => assertTypes$1.isStringWithValue(keyInfo.sk));
                        decrypted.keyList.forEach(keyInfo => addKey(keyInfo));
                        outerClass.version = decrypted.version;
                    } else {
                        throw new Error("Incorrect Keystore Password.")
                    }
                };

                return {
                    getWallets: () => wallets,
                    getWallet: (vk) => wallets.find(wallet => wallet.vk === vk),
                    addKey, 
                    clearKeys, 
                    numOfKeys,
                    deleteKey,
                    createKeystore,
                    decryptKeystore
                }
            })();

            if (arg){
                if (arg.key) this.addKey(arg.key);
                if (arg.keyList) this.addKeys(arg.keyList);
                if (arg.keystoreData) this.addKeystoreData(arg.keystoreData);
            }
        }
        /**
         * Add a list of keys to add to the keystore
         * @param {Array.<String>} keyList An array of 32 character long Lamden private keys
         */
        addKeys(keyList){
            assertTypes$1.isArray(keyList);
            keyList.forEach(key => this.addKey(key));
        }
        /**
         * Add a key to the keystore
         * @param {string} key A 32 character long Lamden private key
         */
        addKey(keyInfo){
            assertTypes$1.isObjectWithKeys(keyInfo);
            assertTypes$1.isStringWithValue(keyInfo.sk);
            if (validateTypes$5.isStringWithValue(keyInfo.vk)) delete keyInfo.vk;
            this.keyList.addKey(keyInfo);
        }
        /**
         * Load the keystore with the data from an existing keystore
         * @param {string} keystoreData The contents of an existing encrypted keystore file
         */
        addKeystoreData(keystoreData){
            if (validateTypes$5.isString(keystoreData)) keystoreData = JSON.parse(keystoreData);
            if(this.validateKeyStore(keystoreData)){
                this.encryptedData = keystoreData;
            }
        }
        /**
         * Returns the password hint in a keystore file
         * @param {String|undefined} keystoreData The contents of an existing encrypted keystore file if one wasn't supplied to the constructor
         */
        getPasswordHint(keystoreData = undefined){
            if (!this.encryptedData && !keystoreData) throw new Error("No keystore data found.")

            if (keystoreData)  {
                if (validateTypes$5.isString(keystoreData))  keystoreData = JSON.parse(keystoreData);
            }
            else keystoreData = this.encryptedData;

            if (keystoreData.w) return decryptStrHash('n1ahcKc0lb', keystoreData.w);
            else return ""
        }
        /**
         * Removes a specific key from the keyList
         * @param {Number} keyIndex The index of the key you want to remove
         */
        deleteKey(keyIndex){
            assertTypes$1.isInteger(keyIndex);
            if (this.keyList.numOfKeys() === 0) return
            if (keyIndex < 0 || keyIndex >= this.keyList.numOfKeys()) throw new Error("Key index out of range.")
            this.keyList.deleteKey(keyIndex);
        }
        /**
         * Clears all keys from the keystore
         */
        clearKeys(){
            this.keyList.clearKeys();
        }
        /**
         * Clears all keys from the keystore
         * @return {Array.<Object>} An array of wallet objects
         */
        get wallets() {
            return this.keyList.getWallets()
        }
        /**
         * Load the keystore with the data from an existing keystore
         * @param {String} vk A 32 character long Lamden public key
         * @return {Object} A wallet object
         */
        getWallet(vk) {
            return this.keyList.getWallet(vk)
        }
        /**
         * Used to validate that a keystore is the proper Lamden Format (does not decrypt data)
         * @param {String} keystoreData The contents of an existing encrypted keystore file
         * @return {Boolean} valid
         * @throws {Error} This is not a valid keystore file.
         */
        validateKeyStore(keystoreData){
            assertTypes$1.isObjectWithKeys(keystoreData);
            try{
                let encryptedData = JSON.parse(keystoreData.data);
                 if (!encryptedData.ct || !encryptedData.iv || !encryptedData.s){
                    throw new Error("This is not a valid keystore file.")
                }
            } catch (e) {
                throw new Error("This is not a valid keystore file.")
            }
            return true;
        }
        /**
         * Create a Keystore text string from the keys contained in the Keystore instance
         * @param {String} password A password to encrypt the data
         * @param {String|undefined} hint An optional password hint. Not stored in clear text (obsured) but not encrypted with the password.
         * @return {String} A JSON stringified object containing the encrypted data
         * @throws {Error} Any errors from the encyption process
         */
        createKeystore(password, hint = undefined) {
            assertTypes$1.isStringWithValue(password);
            if (hint){
                assertTypes$1.isStringWithValue(hint);
            }
            return this.keyList.createKeystore(password, hint)
        }
        /**
         * Decrypt a keystore into a useable array of wallets.  Any decrypted keys will be added to existing keys in the keystore.
         * @param {String} password A password to encrypt the data
         * @param {String|undefined} keystoreData The encrypted contents from a keystore file if not passed into the constructor.
         * @throws {Error} Any errors from the encyption process
         */
        decryptKeystore(password, keystoreData = undefined){
            if (keystoreData) this.addKeystoreData(keystoreData);
            if (!this.encryptedData) throw new Error ("No keystoreData to decrypt.")
            try{
                this.keyList.decryptKeystore(password, this.encryptedData.data);
            }catch (e){
                throw new Error("Incorrect Keystore Password.")
            }
        }
    }

    var index = {
        TransactionBuilder,
        TransactionBatcher,
        Masternode_API: LamdenMasterNode_API,
        Network,
        wallet,
        Keystore,
        Encoder: encoder_1,
        utils
    };

    module.exports = index;
    });

    let currentNetwork;
    function setNetwork$1() {
        let network;
        {
          network = {
            "name": 'Lamden Public Mainnet',
            "type": "mainnet",
            "url": "https://masternode-01.lamden.io:443"
          };
          return network
        }
      }
    currentNetwork = setNetwork$1();
    let lamdenNetwork = new lamden.Network({
        name: currentNetwork.name,
        type: currentNetwork.type,
        hosts: [currentNetwork.url]
      });

    function setScore$1(score, grid, txn, houseBalance) {
        localStorage.setItem('score', score);
        let wallet = localStorage.getItem('wallet');
        if (score > 0) {
            axios({
                method: 'post',
                url: host + {"env":{"isProd":"true","PROD3_URL":"https://futuregames.io","PROD_URL2":"http://161.35.179.72:3232","PROD_URL":"http://localhost:3232","HOUSE_VK":"e326c852bcf436b8f65842339de78039be435c5607f341176aefb4436f153a28","API_WIN":"/api/sendWinnings","API_REFUND":"/api/refund","API_SPIN":"/api/spin","API_PRICE":"/api/getPrice"}}.env.API_WIN,
                data: {
                  score: score,
                  wallet: wallet,
                  grid: grid,
                  txn: txn,
                  hb: houseBalance
                }
              });
        }
        else {
            let loserClips = ['loser', 'loser1', 'loser3'];

            const loserClipFound = loserClips[Math.floor(Math.random() * loserClips.length)];
            let loserClip = new Audio('/assests/sounds/' + loserClipFound + '.mp3');
            var un_mute = document.getElementById('un-mute');

            if (un_mute) {
                loserClip.play();
            }
        }
    }



    function generateIndexGroups$1(num) {
        let ind = 0;
        let matrixBox = [];
        const fourSumSet = new Set([0, 1, 2, 3, 4, 5]);
        const fiveSumSet = new Set([0, 1, 2]);


        /**  Grid
         * [0] [3] [6] [9] [12]
         * [1] [4] [7] [10] [13]
         * [2] [5] [8] [11] [14]
         * ** */

        while (true) {
            if (ind < 13 && num == 1) {
                /** top --> bottom **/
                matrixBox.push([ind, ind + (num), ind + (2*num)]);
                
                ind = ind + 3;
                
            } 
            else if (num > 1) {
                if (num == 2) {
                    if (ind < 10) {
                        /** diagonal bottom --> right **/
                        if (ind < 2) {
                            ind = 2;
                        }
                        matrixBox.push([ind, ind + (num), ind + (2*num)]);
                        ind = ind + 3;
                    }
                    else {
                        break
                    }

                }
                   
                if (num == 3) {
                    if (ind < 9) {
                        /** left ---> right **/
                        matrixBox.push([ind, ind + (num), ind + (2*num)]);
                        if (fourSumSet.has(ind)) {
                            matrixBox.push([ind, ind + (num), ind + (2*num), ind + (3*num)]);
                        }
                        if (fiveSumSet.has(ind)) {
                            matrixBox.push([ind, ind + (num), ind + (2*num), ind + (3*num), ind + (4*num)]);
                        }
                        ind = ind + 1;
                    }
                    else {
                        break
                    }
                }
                
                if (num == 4) {
                    if (ind < 7) {
                        /** diagonal top --> right **/
                        matrixBox.push([ind, ind + (num), ind + (2*num)]);
                        ind = ind + 3;
                    }
                    else {
                        break
                    }
                }
                
            }
            else {
                break
            }
            
        }
        return matrixBox

    }

    function indexOfAll$1(arr, val) {
        arr = arr.reduce((acc, el, i) => (el === val ? [...acc, i] : acc), []);
        if (arr.length < 3) {
            return null
        }
        else {
            return arr
        }
    }


    function isArrayInArray$1(arr, item){
        var item_as_string = JSON.stringify(item);
      
        var contains = arr.some(function(ele){
          return JSON.stringify(ele) === item_as_string;
        });
        return contains;
      }
    function validateMatch$1(array) {
        let lastNum = array[0];
        let bin;
        let arrayCopy = [...array];
        arrayCopy.shift();
        let valid;
        let diff;
        for (let a in arrayCopy) {
            diff = Math.abs(arrayCopy[a] - lastNum);
            if (typeof bin == 'undefined') {
                bin = diff;
            }
            if (diff != bin || diff > 5) {
                valid = false;
            }
            else {
                valid = true;
            }
            lastNum = arrayCopy[a];
        }
        if (valid) {
            return true
        }
    }
    function cleanMatches$1(matches, intersection) {
        let matchOverlap = false;
        if (intersection.length < 5) {
            for (let m in matches) {
                let checkDiff = matches[m].filter(n => !intersection.includes(n));
                if (checkDiff.length < 3) {
                    matchOverlap = true;
                }
            }
        }
        return matchOverlap
    }
    function checkWinners$1(direction, zones, results, scoreboard) {
        
        let res = results;
        let matches = [];
        if (direction == 'l2r') {
            zones.sort(function (a, b) { return b.length - a.length; });
            
        }
        let matchExists;
        for (let z in zones) {
            let zone = zones[z];
            let intersection = res.filter(value => zone.includes(value));
            if (direction == 'l2r') {
                 matchExists = cleanMatches$1(matches, intersection);
            }
            if (intersection.length > 2) {
                if (!isArrayInArray$1(matches, intersection) && validateMatch$1(intersection) && !matchExists) {
                    if (intersection.length == 4) { 
                        let one = intersection[0];
                        let two = intersection[1];
                        let three = intersection[2];
                        intersection[3];
        
                        let middleCheck = three - two;
                        let firstCheck = two - one;
        
                        if (middleCheck == firstCheck) {
                            matches.push(intersection);
                        }
        
                    }
                    else {
                        matches.push(intersection);
                    }
                }
            }
            
        }
        if (matches.length > 0) {
            scoreboard[direction] = matches;
        }
        
    }

    function sleep$1(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }

    function findIndexGroups$1(matrix) {
        

        var eligible = {};
        var symbols = ["bitcoin", "rswp", "ethereum", "tau", "diamond", "star", "seven", "cherry", "grape"];

        for (let s in symbols) {
            eligible[symbols[s]] = indexOfAll$1(matrix, symbols[s]);
        }
        var filtered = Object.fromEntries(Object.entries(eligible).filter(([k,v]) => v != null));
        let keys = Object.keys(filtered);
        var topToBottom = generateIndexGroups$1(1);
        var diagonalTopToBottom = generateIndexGroups$1(2);
        var leftToRight = generateIndexGroups$1(3);

        var diagonalBottomToTop = generateIndexGroups$1(4);
        let scoreboard = {};

        if (keys.length > 0) {
            for (let k in keys) {
                let scoreDict = {}; 
                let index = filtered[keys[k]];
                checkWinners$1('l2r', leftToRight, index, scoreDict);
                checkWinners$1('t2b', topToBottom, index, scoreDict);
                checkWinners$1('dt2b', diagonalTopToBottom, index, scoreDict);
                checkWinners$1('db2t', diagonalBottomToTop, index, scoreDict);
                if (Object.keys(scoreDict).length > 0) {
                    scoreboard[keys[k]] = scoreDict;
                }
            }
            
            
        }  

        else {
            return 'user lost'
        }
        return scoreboard
        
    }

    function findMatches$1(slot) {
        [...Array(15).keys()];
        let matrix = [];
        for (let s in slot) {
            matrix.push(...slot[s]);
        }
        return findIndexGroups$1(matrix)

    }
    let enabled$1 = true;
    let slotLoaded = false;
    let slotLoadStart = false;

    class Slot$1 {
        constructor(domElement, config = {}) {
            Symbol$1.preload();

            this.currentSymbols = [
            ["tau", "tau", "tau"],
            ["tau", "tau", "tau"],
            ["tau", "tau", "tau"],
            ["tau", "tau", "tau"],
            ["tau", "tau", "tau"],
            ];

            this.nextSymbols = [
            ["tau", "tau", "tau"],
            ["tau", "tau", "tau"],
            ["tau", "tau", "tau"],
            ["tau", "tau", "tau"],
            ["tau", "tau", "tau"],
            ];

            this.container = domElement;

            this.reels = Array.from(this.container.getElementsByClassName("reel")).map(
            (reelContainer, idx) =>
                new Reel$1(reelContainer, idx, this.currentSymbols[idx])
            );

            this.resetSlotButton = document.getElementById("reset-slot");
            this.resetSlotButton.addEventListener('click', () => {
                let oldElements = document.getElementsByClassName('tile-img');
                for (let m in oldElements) {
                    if (oldElements[m] != 15) {
                        this.img = oldElements[m];
                        this.img.className = 'slot-tile tile-img';
                        this.img.src = `https://s3.wasabisys.com/lamden-telegram-casino/test/tau.png`;
                    }
                }
                
            });
            this.setSlotLoadingButton = document.getElementById("load-slot");
            this.setSlotLoadingButton.addEventListener('click', async () => {
                slotLoadStart = false;
                slotLoaded = false;
                let currentElements = document.getElementsByClassName('slot-tile');
                let cE = [
                    currentElements[0], currentElements[3], currentElements[6], currentElements[9], currentElements[12],
                    currentElements[1], currentElements[4], currentElements[7], currentElements[10], currentElements[13],
                    currentElements[2], currentElements[5], currentElements[8], currentElements[11], currentElements[14], 
                ];
                if (!slotLoadStart) {
                    slotLoadStart = true;
                    while(!slotLoaded) {
                        for (let m in cE) {
                            if (cE[m] != 15) {
                                let img = cE[m];
                                img.className = 'slot-tile tile-img';
                                img.src = `/assests/symbols/tau-practice.png`; 
                                await sleep$1(200);
                                img.src = `/assests/symbols/tau.png`; 
                            }
                            
                        }
                     }
                }
                
                 
                            
            });


            

            this.spinButton = document.getElementById("spin");
            this.spinButton.addEventListener('click',  async () => {

                let slotLive = document.getElementById("slot-live");
                if (enabled$1 && slotLive) {
                    enabled$1 = false;
                    let websocket_id = localStorage.getItem('websocket_id');
                    let wallet = localStorage.getItem('wallet');
                    this.setSlotLoadingButton = document.getElementById("load-slot");
                    this.setSlotLoadingButton.click();
                    let gameInfo = await (    axios({
                        method: 'post',
                        url: host + {"env":{"isProd":"true","PROD3_URL":"https://futuregames.io","PROD_URL2":"http://161.35.179.72:3232","PROD_URL":"http://localhost:3232","HOUSE_VK":"e326c852bcf436b8f65842339de78039be435c5607f341176aefb4436f153a28","API_WIN":"/api/sendWinnings","API_REFUND":"/api/refund","API_SPIN":"/api/spin","API_PRICE":"/api/getPrice"}}.env.API_SPIN,
                        data: {
                        wallet: wallet,
                        id: websocket_id
                        }
                    }).then((result) => {
                        return result
                    }));
                    if (typeof gameInfo != 'undefined' && gameInfo.data && gameInfo.data.grid) {
                        slotLoaded = true;            
                        let clip = new Audio('/assests/sounds/countdown.mp3');
                        var un_mute = document.getElementById('un-mute');
                        if (un_mute) {
                            clip.play();
                        }    
                        await sleep$1(3000);
                        if (un_mute) {
                            clip.pause();
                        }  

                        slotLoadStart = false;
                        this.spin(gameInfo);
                    }
                    else {
                        await (    axios({
                            method: 'post',
                            url: host + {"env":{"isProd":"true","PROD3_URL":"https://futuregames.io","PROD_URL2":"http://161.35.179.72:3232","PROD_URL":"http://localhost:3232","HOUSE_VK":"e326c852bcf436b8f65842339de78039be435c5607f341176aefb4436f153a28","API_WIN":"/api/sendWinnings","API_REFUND":"/api/refund","API_SPIN":"/api/spin","API_PRICE":"/api/getPrice"}}.env.API_REFUND,
                            data: {
                            wallet: wallet
                            }
                        }).then((result) => {
                            return result
                        }));
                        document.getElementById('failedTxn').click();
                        slotLoaded = true;            
                        enabled$1 = true;
                        slotLoadStart = false;
                
                        this.slotSpun = document.getElementById("spin");
                        this.slotSpun.innerHTML = "Reset";
                    }
                    
                }
                else {
                    let clip = new Audio('/assests/sounds/invalid_button.mp3');
                    var un_mute = document.getElementById('un-mute');

                    if (un_mute) {
                        clip.play();
                    }
                }
            });


            if (config.inverted) {
            this.container.classList.add("inverted");
            }
        }

         spin = async (gameInfo) => {
            
            let spinClips = ['slot_spin', 'slot_spin1'];
     
            this.onSpinStart();

            this.currentSymbols = this.nextSymbols;
            
            /* *  axios --> backend  * */
            
            const spinClipFound = spinClips[Math.floor(Math.random() * spinClips.length)];
            let spinClip = new Audio('/assests/sounds/' + spinClipFound + '.mp3');
            var un_mute = document.getElementById('un-mute');

            if (un_mute) {
                spinClip.play();
            }   
            let grid = JSON.parse(gameInfo.data.grid);
            let txn = gameInfo.data.txn;
            localStorage.setItem('result-txn', txn);
            let playerWon;
            let score = 0;
            this.nextSymbols = [
                [Symbol$1.choose(grid[0]), Symbol$1.choose(grid[1]), Symbol$1.choose(grid[2])],
                [Symbol$1.choose(grid[3]), Symbol$1.choose(grid[4]), Symbol$1.choose(grid[5])],
                [Symbol$1.choose(grid[6]), Symbol$1.choose(grid[7]), Symbol$1.choose(grid[8])],
                [Symbol$1.choose(grid[9]), Symbol$1.choose(grid[10]), Symbol$1.choose(grid[11])],
                [Symbol$1.choose(grid[12]), Symbol$1.choose(grid[13]), Symbol$1.choose(grid[14])],
            ];
            return Promise.all(
                
                this.reels.map((reel) => {
                    reel.renderSymbols(this.nextSymbols[reel.idx]);
                    
                    return reel.spin();
                })).then(
                    async () => {
                    let matches = findMatches$1(this.nextSymbols);
                    if (matches != 'user lost') {

                        let winningSymbols = Object.keys(matches);
                        let winningMatches = Object.keys(matches).map(function(key){
                            let innerMatches = matches[key];
                            let values = Object.keys(innerMatches).map(function(key){
                                return innerMatches[key];
                            });
                            for (let v in values) {
                                let indexArray = values;
                                for (let v2 in indexArray) {
                                    return indexArray
                                }
                            }
                        });

                        let indexSet = new Set();
                        for (let m in matches) {
                            let indexes = matches[m];
                            var values = Object.keys(indexes).map(function(key){
                                return indexes[key];
                            });
                            let sets = new Set();
                            for (let v in values) {
                                var merged = [].concat.apply([], values[v]);
                                let set = new Set(merged);
                                sets = new Set([...set, ...sets]);
                            }
                            indexSet = new Set([...indexSet, ...sets]);
                        }
                        /** Used to finding matching elements **/
                        let slotTiles = document.getElementsByClassName('slot-tile');
                        let matchingElements = [];
                        for (let s in slotTiles) {
                            if (indexSet.has(parseInt(s))) {
                                matchingElements.push(slotTiles[s]);
                            }
                        }
                        
                        var un_mute = document.getElementById('un-mute');

                        if (un_mute) {
                            spinClip.pause();
                        }
                        await sleep$1(800);
                        for (let m in matchingElements) {
                            this.img = matchingElements[m];
                            let imgName = this.img.id.split('-')[0];
                            this.img.className = 'matched tile-img';
                            this.img.src = `https://s3.wasabisys.com/lamden-telegram-casino/test/${imgName}-match.png`;
                            let clip = new Audio('/assests/sounds/screen_light.mp3');
                            var un_mute = document.getElementById('un-mute');

                            if (un_mute) {
                                clip.play();
                            }
                            await sleep$1(1000);

                        }
                        let houseBalance;

                        async function tallyPoints(sym, matches) {
                            let points;
                            let houseVk = {"env":{"isProd":"true","PROD3_URL":"https://futuregames.io","PROD_URL2":"http://161.35.179.72:3232","PROD_URL":"http://localhost:3232","HOUSE_VK":"e326c852bcf436b8f65842339de78039be435c5607f341176aefb4436f153a28","API_WIN":"/api/sendWinnings","API_REFUND":"/api/refund","API_SPIN":"/api/spin","API_PRICE":"/api/getPrice"}}.env.HOUSE_VK;

                            async function getBalance(wallet) {
                                let balance;
                                await lamdenNetwork.API.getCurrencyBalance(wallet).then(function(result) {
                                    balance = result.c[0];
                                });
                                return balance
                            }
                        
                            await getBalance(houseVk).then(async function(result) {
                                houseBalance = await result;
                            });
                

                            

                            if (sym == 'ethereum') {
                                points = parseInt((.02 * houseBalance)); 
                            }
                            if (sym == 'cherry') {
                                points = parseInt(.03 * houseBalance);
                            }
                            if (sym == 'grape') {
                                points = parseInt(.04 * houseBalance);
                            }
                            if (sym == 'seven') {
                                points = parseInt(.05 * houseBalance);
                            }
                            if (sym == 'star') {
                                points = parseInt(.06 * houseBalance);
                            }
                            if (sym == 'diamond') {
                                points = parseInt(.07 * houseBalance);
                            }
                            if (sym == 'rswp') {
                                points = parseInt(.08 * houseBalance);
                            }
                            if (sym == 'bitcoin') {
                                points = parseInt(.09 * houseBalance);
                            }
                            if (sym == 'tau') {
                                points = parseInt(.1 * houseBalance);
                            }

                            points = parseInt(points / 3);

                            for (let m in matches) {
                                for (let m2 in matches[m]) {
                                    /**
                                     *  let multiplier = 1;
                                        console.log(points, score,matches[m][m2])
                                        if (matches[m][m2].length == 4) {
                                            multiplier = 2
                                        }

                                        if (matches[m][m2].length == 5) {
                                            multiplier = 4
                                        }
                                     * **/

                                    score = (matches[m][m2].length * points + score); 

                                }
                            }
                        }

                        for (let w in winningSymbols) {
                            await tallyPoints(winningSymbols[w], winningMatches[w]);
                        }

                        setScore$1(score, this.nextSymbols, txn, houseBalance);
                        playerWon = true;
                        document.getElementById("tester").click();


                        /* *  take score and send to winnings and to frontend  * */

                    }
                    
                /** Used to calculate total points [symbol. occurences] **/
                

            }
        ).then( async () => {     
            this.onSpinEnd();
            let victoryClip;
            if (playerWon) {
                let foundMatches = new Audio('/assests/sounds/slot_winner.mp3');
                var un_mute = document.getElementById('un-mute');


                document.getElementById("jackpot-balance").click();
                document.getElementById("player-balance").click();
                if (score > 0) {
                    if (score > 150) {
                        if (un_mute) {
                            foundMatches.play();
                        }
                        await sleep$1(1500);
                        victoryClip = new Audio('/assests/sounds/bigWinner.mp3');
        
                        if (un_mute) {
                            victoryClip.play();
                        }                
                        await sleep$1(700);
                    }
                    else {
                        if (un_mute) {
                            foundMatches.play();
                        }
                        await sleep$1(1500);
                        victoryClip = new Audio('/assests/sounds/smallWinner.mp3');
        
                        if (un_mute) {
                            victoryClip.play();
                        }
                        await sleep$1(300);
                    }
                }
                
            }
            document.getElementById("player-balance").click();
        })
        
        }

        onSpinStart() {
            this.spinButton.disabled = true;

            
            /**
             * console.log("SPIN START");
            console.log("SPIN DISABLED");
             * **/
            let spinEnabled = document.getElementById("spin-enabled");
            spinEnabled.setAttribute("id", "spin-disabled");
            
            
        }

        onSpinEnd() {
            this.spinButton.disabled = false;
            /**
             * console.log("SPIN END");
            console.log("SPIN ENABLED");
             * **/
            
            enabled$1 = true;
            slotLoaded = false;

            let spinDisabled = document.getElementById("spin-disabled");
            spinDisabled.setAttribute("id", "spin-enabled");

    		this.slotSpun = document.getElementById("spin");
            this.slotSpun.innerHTML = "Reset";
        }
        }

    function generateUUID() { // Public Domain/MIT
        let u = Date.now().toString(16) + Math.random().toString(16) + '0'.repeat(16);
        return [u.substr(0,8), u.substr(8,4), '4000-8' + u.substr(13,3), u.substr(16,12)].join('-');
    }

    class PracticeSymbol {
        constructor(name = PracticeSymbol.random()) {
            this.name = name;

            
            this.img = new Image();
            this.img.src = `https://s3.wasabisys.com/lamden-telegram-casino/test/${name}-practice.png`;
            this.img.className = 'practice-tile practice-tile-img';
            this.img.id = `${name + '-' + generateUUID()}`; 
        }

        static preload() {
            PracticeSymbol.symbols.forEach((symbol) => new PracticeSymbol(symbol));
        }

        static get symbols() {

            let prod = [
                "bitcoin",
                "rswp",
                "ethereum",
                "tau",
                "diamond",
                "star",
                "seven",
                "cherry",
                "grape",
                ];

            return prod
        }

        static random() {

            return this.symbols[Math.floor(Math.pow(10,14)*Math.random()*Math.random())%(this.symbols.length-1)];
        }
        static choose(index) {
            return this.symbols[index];
        }
        }

    class Reel {
      constructor(reelContainer, idx, initialSymbols) {
          this.reelContainer = reelContainer;
          this.idx = idx;
          this.symbolContainer = document.createElement("div");
          this.symbolContainer.classList.add("icons");
          this.reelContainer.appendChild(this.symbolContainer);
          

          this.animation = this.symbolContainer.animate(
          [
            { transform: "none", filter: "blur(0)" },
            { filter: "blur(2px)", offset: 0.5 },
            { 
            transform: `translateY(-${
          ((Math.floor(this.factor) * 10) /
          (3 + Math.floor(this.factor) * 10)) *
          100
        }%)`,
            filter: "blur(0)",
            },
          ],
          {
            duration: this.factor * 1000,
            easing: "ease-in-out",
          }
          );
          this.animation.cancel();

          initialSymbols.forEach((symbol) => {
            this.symbolContainer.appendChild(new PracticeSymbol(symbol).img);
          }
            
          );
        }

        get factor() {
          return 1 + Math.pow(this.idx / 2, 2);
        }

        renderSymbols(nextSymbols) {
          const fragment = document.createDocumentFragment();

          for (let i = 3; i < 3 + Math.floor(this.factor) * 10; i++) {
          const icon = new PracticeSymbol(
            i >= 10 * Math.floor(this.factor) - 2
            ? nextSymbols[i - Math.floor(this.factor) * 10]
            : undefined
          );
          fragment.appendChild(icon.img);
          }

          this.symbolContainer.appendChild(fragment);
        }

        spin = async () => {
          const animationPromise = new Promise(
            (resolve) => (this.animation.onfinish = resolve)
          );
          const timeoutPromise = new Promise((resolve) =>
            setTimeout(resolve, this.factor * 3000)
          );
          this.animation.play();

          return Promise.race([animationPromise, timeoutPromise]).then(() => {

          if (this.animation.playState !== "finished") this.animation.finish();

          const max = this.symbolContainer.children.length - 3;
          for (let i = 0; i < max; i++) {
            this.symbolContainer.firstChild.remove();
          }
          let clip = new Audio('/assests/sounds/spin_end.mp3');
          var un_mute = document.getElementById('un-mute');

          if (un_mute) {
            clip.play();
          }
        });
        }
      }

    function generateIndexGroups(num) {
        let ind = 0;
        let matrixBox = [];
        const fourSumSet = new Set([0, 1, 2, 3, 4, 5]);
        const fiveSumSet = new Set([0, 1, 2]);


        /**  Grid
         * [0] [3] [6] [9] [12]
         * [1] [4] [7] [10] [13]
         * [2] [5] [8] [11] [14]
         * ** */

        while (true) {
            if (ind < 13 && num == 1) {
                /** top --> bottom **/
                matrixBox.push([ind, ind + (num), ind + (2*num)]);
                
                ind = ind + 3;
                
            } 
            else if (num > 1) {
                if (num == 2) {
                    if (ind < 10) {
                        /** diagonal bottom --> right **/
                        if (ind < 2) {
                            ind = 2;
                        }
                        matrixBox.push([ind, ind + (num), ind + (2*num)]);
                        ind = ind + 3;
                    }
                    else {
                        break
                    }

                }
                   
                if (num == 3) {
                    if (ind < 9) {
                        /** left ---> right **/
                        matrixBox.push([ind, ind + (num), ind + (2*num)]);
                        if (fourSumSet.has(ind)) {
                            matrixBox.push([ind, ind + (num), ind + (2*num), ind + (3*num)]);
                        }
                        if (fiveSumSet.has(ind)) {
                            matrixBox.push([ind, ind + (num), ind + (2*num), ind + (3*num), ind + (4*num)]);
                        }
                        ind = ind + 1;
                    }
                    else {
                        break
                    }
                }
                
                if (num == 4) {
                    if (ind < 7) {
                        /** diagonal top --> right **/
                        matrixBox.push([ind, ind + (num), ind + (2*num)]);
                        ind = ind + 3;
                    }
                    else {
                        break
                    }
                }
                
            }
            else {
                break
            }
            
        }
        return matrixBox

    }

    function indexOfAll(arr, val) {
        arr = arr.reduce((acc, el, i) => (el === val ? [...acc, i] : acc), []);
        if (arr.length < 3) {
            return null
        }
        else {
            return arr
        }
    }


    function isArrayInArray(arr, item){
        var item_as_string = JSON.stringify(item);
      
        var contains = arr.some(function(ele){
          return JSON.stringify(ele) === item_as_string;
        });
        return contains;
      }
    function validateMatch(array) {
        let lastNum = array[0];
        let bin;
        let arrayCopy = [...array];
        arrayCopy.shift();
        let valid;
        let diff;
        for (let a in arrayCopy) {
            diff = Math.abs(arrayCopy[a] - lastNum);
            if (typeof bin == 'undefined') {
                bin = diff;
            }
            if (diff != bin || diff > 5) {
                valid = false;
            }
            else {
                valid = true;
            }
            lastNum = arrayCopy[a];
        }
        if (valid) {
            return true
        }
    }
    function cleanMatches(matches, intersection) {
        let matchOverlap = false;
        if (intersection.length < 5) {
            for (let m in matches) {
                let checkDiff = matches[m].filter(n => !intersection.includes(n));
                if (checkDiff.length < 3) {
                    matchOverlap = true;
                }
            }
        }
        return matchOverlap
    }
    function checkWinners(direction, zones, results, scoreboard) {
        
        let res = results;
        let matches = [];
        if (direction == 'l2r') {
            zones.sort(function (a, b) { return b.length - a.length; });
            
        }
        let matchExists;
        for (let z in zones) {
            let zone = zones[z];
            let intersection = res.filter(value => zone.includes(value));
            if (direction == 'l2r') {
                 matchExists = cleanMatches(matches, intersection);
            }
            if (intersection.length > 2) {
                
                if (!isArrayInArray(matches, intersection) && validateMatch(intersection) && !matchExists) {
                    if (intersection.length == 4) { 
                        let one = intersection[0];
                        let two = intersection[1];
                        let three = intersection[2];
                        intersection[3];
        
                        let middleCheck = three - two;
                        let firstCheck = two - one;
        
                        if (middleCheck == firstCheck) {
                            matches.push(intersection);
                        }
        
                    }
                    else {
                        matches.push(intersection);
                    }
                }
            }
            
        }
        if (matches.length > 0) {
            scoreboard[direction] = matches;
        }
        
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }

    function findIndexGroups(matrix) {
        

        var eligible = {};
        var symbols = ["bitcoin", "rswp", "ethereum", "tau", "diamond", "star", "seven", "cherry", "grape"];

        for (let s in symbols) {
            eligible[symbols[s]] = indexOfAll(matrix, symbols[s]);
        }
        var filtered = Object.fromEntries(Object.entries(eligible).filter(([k,v]) => v != null));
        let keys = Object.keys(filtered);
        var topToBottom = generateIndexGroups(1);
        var diagonalTopToBottom = generateIndexGroups(2);
        var leftToRight = generateIndexGroups(3);

        var diagonalBottomToTop = generateIndexGroups(4);
        let scoreboard = {};

        if (keys.length > 0) {
            for (let k in keys) {
                let scoreDict = {}; 
                let index = filtered[keys[k]];
                checkWinners('l2r', leftToRight, index, scoreDict);
                checkWinners('t2b', topToBottom, index, scoreDict);
                checkWinners('dt2b', diagonalTopToBottom, index, scoreDict);
                checkWinners('db2t', diagonalBottomToTop, index, scoreDict);
                if (Object.keys(scoreDict).length > 0) {
                    scoreboard[keys[k]] = scoreDict;
                }
            }
            
            
        }  

        else {
            return 'user lost'
        }


        return scoreboard
        
    }

    function findMatches(slot) {
        [...Array(15).keys()];
        let matrix = [];
        for (let s in slot) {
            matrix.push(...slot[s]);
        }

        return findIndexGroups(matrix)

    }
    let enabled = true;


    class Slot {
        constructor(domElement, config = {}) {
            PracticeSymbol.preload();

            this.currentSymbols = [
            ["tau", "tau", "tau"],
            ["tau", "tau", "tau"],
            ["tau", "tau", "tau"],
            ["tau", "tau", "tau"],
            ["tau", "tau", "tau"],
            ];

            this.nextSymbols = [
            ["tau", "tau", "tau"],
            ["tau", "tau", "tau"],
            ["tau", "tau", "tau"],
            ["tau", "tau", "tau"],
            ["tau", "tau", "tau"],
            ];

            this.container = domElement;

            this.reels = Array.from(this.container.getElementsByClassName("practice-reel")).map(
            (reelContainer, idx) =>
                new Reel(reelContainer, idx, this.currentSymbols[idx])
            );

            this.resetSlotButton = document.getElementById("reset-practice-slot");
            this.resetSlotButton.addEventListener('click', () => {
                
                if (enabled) {
                    let oldElements = document.getElementsByClassName('practice-tile-img');
                    for (let m in oldElements) {
                        if (oldElements[m] != 15) {
                            this.img = oldElements[m];
                            this.img.className = 'practice-tile practice-tile-img';
                            this.img.src = `https://s3.wasabisys.com/lamden-telegram-casino/test/tau-practice.png`;
                        }
                    }
                }            
            });

            this.spinButton = document.getElementById("practice-spin");
            let resetClicked = 0;
            this.spinButton.addEventListener("click", () => {
                
                if (enabled) {
                    this.spin();
                }    
                else {
                    if (resetClicked == 1) {
                        let clip = new Audio('/assests/sounds/invalid_button.mp3');
                        var un_mute = document.getElementById('un-mute');

                        if (un_mute) {
                          clip.play();
                        }                }
                    else {
                        resetClicked = resetClicked + 1; 
                    }
                    
                }    
            });


            if (config.inverted) {
            this.container.classList.add("inverted");
            }
        }

        spin = async () => {
            let practiceSlotLive = document.getElementById("practice-slot-live");
            if (practiceSlotLive) {

                this.onSpinStart();

            this.currentSymbols = this.nextSymbols;
            
            /** 
             * 0 "bitcoin",
             * 1 "rswp", 
             * 2 "ethereum", 
             * 3 "tau", 
             * 4 "diamond", 
             * 5 "star",
            6 "seven",
            7 "cherry",
            8 "grape"
            **/

            this.nextSymbols = [
                [PracticeSymbol.random(), PracticeSymbol.random(), PracticeSymbol.random()],
                [PracticeSymbol.random(), PracticeSymbol.random(), PracticeSymbol.random()],
                [PracticeSymbol.random(), PracticeSymbol.random(), PracticeSymbol.random()],
                [PracticeSymbol.random(), PracticeSymbol.random(), PracticeSymbol.random()],
                [PracticeSymbol.random(), PracticeSymbol.random(), PracticeSymbol.random()],
            ];
            return Promise.all(

                this.reels.map((reel) => {
                    reel.renderSymbols(this.nextSymbols[reel.idx]);
                    
                    return reel.spin();
                })).then(
                    async () => {
                    let matches = findMatches(this.nextSymbols);
                    Object.keys(matches).map(function(key){
                        let innerMatches = matches[key];
                        let values = Object.keys(innerMatches).map(function(key){
                            return innerMatches[key];
                        });
                        for (let v in values) {
                            let indexArray = values;
                            for (let v2 in indexArray) {
                                return indexArray
                            }
                        }
                    });
                /** Used to calculate total points [Practicesymbol. occurences] **/
                let indexSet = new Set();
                for (let m in matches) {
                    let indexes = matches[m];
                    var values = Object.keys(indexes).map(function(key){
                        return indexes[key];
                    });
                    let sets = new Set();
                    for (let v in values) {
                        var merged = [].concat.apply([], values[v]);
                        let set = new Set(merged);
                        sets = new Set([...set, ...sets]);
                    }
                    indexSet = new Set([...indexSet, ...sets]);
                }
                /** Used to finding matching elements **/
                let slotTiles = document.getElementsByClassName('practice-tile');
                let matchingElements = [];
                for (let s in slotTiles) {
                    if (indexSet.has(parseInt(s))) {
                        matchingElements.push(slotTiles[s]);
                    }
                }

                await sleep(800);
                for (let m in matchingElements) {
                    this.img = matchingElements[m];
                    let imgName = this.img.id.split('-')[0];
                    this.img.className = 'matched';
                    this.img.src = `https://s3.wasabisys.com/lamden-telegram-casino/test/${imgName}-match.png`;
                    let clip = new Audio('/assests/sounds/screen_light.mp3');
                    var un_mute = document.getElementById('un-mute');

                    if (un_mute) {
                      clip.play();
                    }
                    await sleep(1000);

                }


            }
            ).then( async () => {     

                this.onSpinEnd();
                
                
            })

            }

            

        }

        onSpinStart() {
            this.spinButton.disabled = true;

            

            /**
             * console.log("SPIN START");
            console.log("SPIN DISABLED");
             * **/
            enabled = false;

            
            
        }

        onSpinEnd() {
            this.spinButton.disabled = false;

            
            /**
             * console.log("SPIN END");
            console.log("SPIN ENABLED");
             * **/
            enabled = true;
        }
        }

    const config = {
      inverted: false, // true: reels spin from top to bottom; false: reels spin from bottom to top
    };

    function slot() {
      return new Slot$1(document.getElementById("slot"), config);
    }

    function practiceSlot() {
      return new Slot(document.getElementById("practice-slot"), config);
    }
    const prod_URL = 'https://futuregames.io';

    function setHost() {
        return prod_URL;
    }

    const host = setHost();

    const bitcoin = '<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 198.5H198.5V1.5H1.5V198.5Z" fill="#160B5B" stroke="black" stroke-width="3"/><path d="M87.818 149.429L148.04 82.5458L163.118 96.1221L102.896 163.005L87.818 149.429Z" fill="white"/><path d="M102.883 163.085L36 102.863L49.3826 88L116.266 148.222L102.883 163.085Z" fill="white"/><path d="M111.3 49.6558L51.0779 116.539L36 102.963L96.2218 36.0796L111.3 49.6558Z" fill="white"/><path d="M96.2346 36L163.118 96.2218L149.735 111.085L82.852 50.8629L96.2346 36Z" fill="white"/><path d="M105.724 54.1579L62.9977 101.611L49.495 89.4528L92.2217 42L105.724 54.1579Z" fill="white"/><path d="M158.209 100.186L111.704 151.683L99 138.5L144.641 87.7719L158.209 100.186Z" fill="white"/><path d="M73.9042 111.418L61.831 124.827L48.6734 112.98L60.7465 99.5711L73.9042 111.418Z" fill="white"/></svg>';

    /* src/components/Prize.svelte generated by Svelte v3.37.0 */
    const file$e = "src/components/Prize.svelte";

    function create_fragment$e(ctx) {
    	let div2;
    	let div1;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let img1;
    	let img1_src_value;
    	let t1;
    	let img2;
    	let img2_src_value;
    	let t2;
    	let div0;
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			img0 = element("img");
    			t0 = space();
    			img1 = element("img");
    			t1 = space();
    			img2 = element("img");
    			t2 = space();
    			div0 = element("div");
    			t3 = text(/*winnings*/ ctx[1]);
    			t4 = text(" TAU");
    			attr_dev(img0, "alt", "");
    			if (img0.src !== (img0_src_value = "/assests/symbols/" + /*symbol*/ ctx[0] + ".png")) attr_dev(img0, "src", img0_src_value);
    			set_style(img0, "width", "11px");
    			set_style(img0, "margin-left", ".25rem");
    			add_location(img0, file$e, 11, 4, 264);
    			attr_dev(img1, "alt", "");
    			if (img1.src !== (img1_src_value = "/assests/symbols/" + /*symbol*/ ctx[0] + ".png")) attr_dev(img1, "src", img1_src_value);
    			set_style(img1, "width", "11px");
    			set_style(img1, "margin-left", ".25rem");
    			add_location(img1, file$e, 12, 4, 365);
    			attr_dev(img2, "alt", "");
    			if (img2.src !== (img2_src_value = "/assests/symbols/" + /*symbol*/ ctx[0] + ".png")) attr_dev(img2, "src", img2_src_value);
    			set_style(img2, "width", "11px");
    			set_style(img2, "margin-left", ".25rem");
    			add_location(img2, file$e, 13, 4, 466);
    			set_style(div0, "float", "right");
    			set_style(div0, "margin-top", "auto");
    			set_style(div0, "margin-bottom", "auto");
    			set_style(div0, "font-weight", "600");
    			set_style(div0, "margin-right", ".5rem");
    			set_style(div0, "font-size", "small");
    			add_location(div0, file$e, 15, 4, 568);
    			set_style(div1, "padding", ".2rem");
    			add_location(div1, file$e, 10, 2, 231);
    			attr_dev(div2, "class", "prizes svelte-1603w0d");
    			set_style(div2, "cursor", "pointer");
    			set_style(div2, "margin-left", "auto");
    			set_style(div2, "margin-right", "auto");
    			set_style(div2, "margin-top", "1rem");
    			set_style(div2, "text-align", "center");
    			add_location(div2, file$e, 9, 0, 113);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, img0);
    			append_dev(div1, t0);
    			append_dev(div1, img1);
    			append_dev(div1, t1);
    			append_dev(div1, img2);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, t3);
    			append_dev(div0, t4);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*symbol*/ 1 && img0.src !== (img0_src_value = "/assests/symbols/" + /*symbol*/ ctx[0] + ".png")) {
    				attr_dev(img0, "src", img0_src_value);
    			}

    			if (dirty & /*symbol*/ 1 && img1.src !== (img1_src_value = "/assests/symbols/" + /*symbol*/ ctx[0] + ".png")) {
    				attr_dev(img1, "src", img1_src_value);
    			}

    			if (dirty & /*symbol*/ 1 && img2.src !== (img2_src_value = "/assests/symbols/" + /*symbol*/ ctx[0] + ".png")) {
    				attr_dev(img2, "src", img2_src_value);
    			}

    			if (dirty & /*winnings*/ 2) set_data_dev(t3, /*winnings*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Prize", slots, []);
    	let { symbol } = $$props;
    	let { winnings } = $$props;
    	const writable_props = ["symbol", "winnings"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Prize> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("symbol" in $$props) $$invalidate(0, symbol = $$props.symbol);
    		if ("winnings" in $$props) $$invalidate(1, winnings = $$props.winnings);
    	};

    	$$self.$capture_state = () => ({ symbol, winnings, bitcoin });

    	$$self.$inject_state = $$props => {
    		if ("symbol" in $$props) $$invalidate(0, symbol = $$props.symbol);
    		if ("winnings" in $$props) $$invalidate(1, winnings = $$props.winnings);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [symbol, winnings];
    }

    class Prize extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { symbol: 0, winnings: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Prize",
    			options,
    			id: create_fragment$e.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*symbol*/ ctx[0] === undefined && !("symbol" in props)) {
    			console.warn("<Prize> was created without expected prop 'symbol'");
    		}

    		if (/*winnings*/ ctx[1] === undefined && !("winnings" in props)) {
    			console.warn("<Prize> was created without expected prop 'winnings'");
    		}
    	}

    	get symbol() {
    		throw new Error("<Prize>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set symbol(value) {
    		throw new Error("<Prize>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get winnings() {
    		throw new Error("<Prize>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set winnings(value) {
    		throw new Error("<Prize>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/GrandPrize.svelte generated by Svelte v3.37.0 */

    const file$d = "src/components/GrandPrize.svelte";

    function create_fragment$d(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1;
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(/*num*/ ctx[0]);
    			t1 = text(" in a row = ");
    			t2 = text(/*multiplier*/ ctx[1]);
    			t3 = text("X Multiplier");
    			set_style(div0, "padding", ".2rem");
    			set_style(div0, "font-weight", "bold");
    			set_style(div0, "font-size", "x-small");
    			add_location(div0, file$d, 6, 6, 165);
    			attr_dev(div1, "class", "prizes svelte-duefe2");
    			set_style(div1, "margin-left", "auto");
    			set_style(div1, "margin-right", "auto");
    			set_style(div1, "margin-top", "1rem");
    			set_style(div1, "text-align", "center");
    			add_location(div1, file$d, 5, 0, 61);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, t3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*num*/ 1) set_data_dev(t0, /*num*/ ctx[0]);
    			if (dirty & /*multiplier*/ 2) set_data_dev(t2, /*multiplier*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("GrandPrize", slots, []);
    	let { num } = $$props;
    	let { multiplier } = $$props;
    	const writable_props = ["num", "multiplier"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GrandPrize> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("num" in $$props) $$invalidate(0, num = $$props.num);
    		if ("multiplier" in $$props) $$invalidate(1, multiplier = $$props.multiplier);
    	};

    	$$self.$capture_state = () => ({ num, multiplier });

    	$$self.$inject_state = $$props => {
    		if ("num" in $$props) $$invalidate(0, num = $$props.num);
    		if ("multiplier" in $$props) $$invalidate(1, multiplier = $$props.multiplier);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [num, multiplier];
    }

    class GrandPrize extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { num: 0, multiplier: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GrandPrize",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*num*/ ctx[0] === undefined && !("num" in props)) {
    			console.warn("<GrandPrize> was created without expected prop 'num'");
    		}

    		if (/*multiplier*/ ctx[1] === undefined && !("multiplier" in props)) {
    			console.warn("<GrandPrize> was created without expected prop 'multiplier'");
    		}
    	}

    	get num() {
    		throw new Error("<GrandPrize>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set num(value) {
    		throw new Error("<GrandPrize>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get multiplier() {
    		throw new Error("<GrandPrize>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set multiplier(value) {
    		throw new Error("<GrandPrize>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/PrizeBoard.svelte generated by Svelte v3.37.0 */
    const file$c = "src/components/PrizeBoard.svelte";

    // (46:4) {:else}
    function create_else_block$5(ctx) {
    	let grandprize0;
    	let t0;
    	let grandprize1;
    	let t1;
    	let grandprize2;
    	let t2;
    	let grandprize3;
    	let t3;
    	let grandprize4;
    	let t4;
    	let grandprize5;
    	let t5;
    	let div1;
    	let div0;
    	let span;
    	let img;
    	let img_src_value;
    	let t6;
    	let current;
    	let mounted;
    	let dispose;

    	grandprize0 = new GrandPrize({
    			props: { num: 4, multiplier: 5 },
    			$$inline: true
    		});

    	grandprize1 = new GrandPrize({
    			props: { num: 4, multiplier: 5 },
    			$$inline: true
    		});

    	grandprize2 = new GrandPrize({
    			props: { num: 4, multiplier: 5 },
    			$$inline: true
    		});

    	grandprize3 = new GrandPrize({
    			props: { num: 5, multiplier: 10 },
    			$$inline: true
    		});

    	grandprize4 = new GrandPrize({
    			props: { num: 5, multiplier: 10 },
    			$$inline: true
    		});

    	grandprize5 = new GrandPrize({
    			props: { num: 5, multiplier: 10 },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(grandprize0.$$.fragment);
    			t0 = space();
    			create_component(grandprize1.$$.fragment);
    			t1 = space();
    			create_component(grandprize2.$$.fragment);
    			t2 = space();
    			create_component(grandprize3.$$.fragment);
    			t3 = space();
    			create_component(grandprize4.$$.fragment);
    			t4 = space();
    			create_component(grandprize5.$$.fragment);
    			t5 = space();
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			img = element("img");
    			t6 = text("\n            Prizes");
    			attr_dev(img, "alt", "");
    			if (img.src !== (img_src_value = "/assests/left-arrow.png")) attr_dev(img, "src", img_src_value);
    			set_style(img, "width", "10px");
    			set_style(img, "float", "left");
    			set_style(img, "margin-left", ".75rem");
    			set_style(img, "padding-top", ".1rem");
    			add_location(img, file$c, 55, 12, 2074);
    			add_location(span, file$c, 54, 10, 2055);
    			set_style(div0, "padding", ".2rem");
    			set_style(div0, "font-weight", "bold");
    			set_style(div0, "font-size", "x-small");
    			add_location(div0, file$c, 53, 8, 1982);
    			attr_dev(div1, "class", "prizes svelte-19lhp8k");
    			set_style(div1, "margin-left", "auto");
    			set_style(div1, "margin-right", "auto");
    			set_style(div1, "margin-top", "2rem");
    			set_style(div1, "text-align", "center");
    			set_style(div1, "cursor", "pointer");
    			add_location(div1, file$c, 52, 6, 1825);
    		},
    		m: function mount(target, anchor) {
    			mount_component(grandprize0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(grandprize1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(grandprize2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(grandprize3, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(grandprize4, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(grandprize5, target, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    			append_dev(span, img);
    			append_dev(span, t6);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", /*click_handler*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(grandprize0.$$.fragment, local);
    			transition_in(grandprize1.$$.fragment, local);
    			transition_in(grandprize2.$$.fragment, local);
    			transition_in(grandprize3.$$.fragment, local);
    			transition_in(grandprize4.$$.fragment, local);
    			transition_in(grandprize5.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(grandprize0.$$.fragment, local);
    			transition_out(grandprize1.$$.fragment, local);
    			transition_out(grandprize2.$$.fragment, local);
    			transition_out(grandprize3.$$.fragment, local);
    			transition_out(grandprize4.$$.fragment, local);
    			transition_out(grandprize5.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(grandprize0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(grandprize1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(grandprize2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(grandprize3, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(grandprize4, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(grandprize5, detaching);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$5.name,
    		type: "else",
    		source: "(46:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (28:4) {#if (prizes == 'prize')}
    function create_if_block$6(ctx) {
    	let prize0;
    	let t0;
    	let prize1;
    	let t1;
    	let prize2;
    	let t2;
    	let prize3;
    	let t3;
    	let prize4;
    	let t4;
    	let prize5;
    	let t5;
    	let prize6;
    	let t6;
    	let prize7;
    	let t7;
    	let prize8;
    	let t8;
    	let div1;
    	let div0;
    	let span1;
    	let t9;
    	let span0;
    	let t10_value = generateWinnings(0.85, /*houseBalance*/ ctx[0]) + "";
    	let t10;
    	let t11;
    	let current;

    	prize0 = new Prize({
    			props: {
    				winnings: generateWinnings(0.02, /*houseBalance*/ ctx[0]),
    				symbol: "ethereum"
    			},
    			$$inline: true
    		});

    	prize1 = new Prize({
    			props: {
    				winnings: generateWinnings(0.03, /*houseBalance*/ ctx[0]),
    				symbol: "cherry"
    			},
    			$$inline: true
    		});

    	prize2 = new Prize({
    			props: {
    				winnings: generateWinnings(0.04, /*houseBalance*/ ctx[0]),
    				symbol: "grape"
    			},
    			$$inline: true
    		});

    	prize3 = new Prize({
    			props: {
    				winnings: generateWinnings(0.05, /*houseBalance*/ ctx[0]),
    				symbol: "seven"
    			},
    			$$inline: true
    		});

    	prize4 = new Prize({
    			props: {
    				winnings: generateWinnings(0.06, /*houseBalance*/ ctx[0]),
    				symbol: "star"
    			},
    			$$inline: true
    		});

    	prize5 = new Prize({
    			props: {
    				winnings: generateWinnings(0.07, /*houseBalance*/ ctx[0]),
    				symbol: "diamond"
    			},
    			$$inline: true
    		});

    	prize6 = new Prize({
    			props: {
    				winnings: generateWinnings(0.08, /*houseBalance*/ ctx[0]),
    				symbol: "rswp"
    			},
    			$$inline: true
    		});

    	prize7 = new Prize({
    			props: {
    				winnings: generateWinnings(0.09, /*houseBalance*/ ctx[0]),
    				symbol: "bitcoin"
    			},
    			$$inline: true
    		});

    	prize8 = new Prize({
    			props: {
    				winnings: generateWinnings(0.1, /*houseBalance*/ ctx[0]),
    				symbol: "tau"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(prize0.$$.fragment);
    			t0 = space();
    			create_component(prize1.$$.fragment);
    			t1 = space();
    			create_component(prize2.$$.fragment);
    			t2 = space();
    			create_component(prize3.$$.fragment);
    			t3 = space();
    			create_component(prize4.$$.fragment);
    			t4 = space();
    			create_component(prize5.$$.fragment);
    			t5 = space();
    			create_component(prize6.$$.fragment);
    			t6 = space();
    			create_component(prize7.$$.fragment);
    			t7 = space();
    			create_component(prize8.$$.fragment);
    			t8 = space();
    			div1 = element("div");
    			div0 = element("div");
    			span1 = element("span");
    			t9 = text("All matches -> ");
    			span0 = element("span");
    			t10 = text(t10_value);
    			t11 = text(" Tau");
    			set_style(span0, "color", "rgb(238, 234, 28)");
    			add_location(span0, file$c, 41, 25, 1407);
    			add_location(span1, file$c, 40, 10, 1375);
    			set_style(div0, "padding", ".2rem");
    			set_style(div0, "font-weight", "bold");
    			set_style(div0, "font-size", "x-small");
    			add_location(div0, file$c, 39, 8, 1302);
    			attr_dev(div1, "class", "prizes svelte-19lhp8k");
    			set_style(div1, "margin-left", "auto");
    			set_style(div1, "margin-right", "auto");
    			set_style(div1, "margin-top", "1rem");
    			set_style(div1, "text-align", "center");
    			set_style(div1, "cursor", "pointer");
    			add_location(div1, file$c, 38, 6, 1181);
    		},
    		m: function mount(target, anchor) {
    			mount_component(prize0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(prize1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(prize2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(prize3, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(prize4, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(prize5, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(prize6, target, anchor);
    			insert_dev(target, t6, anchor);
    			mount_component(prize7, target, anchor);
    			insert_dev(target, t7, anchor);
    			mount_component(prize8, target, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, span1);
    			append_dev(span1, t9);
    			append_dev(span1, span0);
    			append_dev(span0, t10);
    			append_dev(span1, t11);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const prize0_changes = {};
    			if (dirty & /*houseBalance*/ 1) prize0_changes.winnings = generateWinnings(0.02, /*houseBalance*/ ctx[0]);
    			prize0.$set(prize0_changes);
    			const prize1_changes = {};
    			if (dirty & /*houseBalance*/ 1) prize1_changes.winnings = generateWinnings(0.03, /*houseBalance*/ ctx[0]);
    			prize1.$set(prize1_changes);
    			const prize2_changes = {};
    			if (dirty & /*houseBalance*/ 1) prize2_changes.winnings = generateWinnings(0.04, /*houseBalance*/ ctx[0]);
    			prize2.$set(prize2_changes);
    			const prize3_changes = {};
    			if (dirty & /*houseBalance*/ 1) prize3_changes.winnings = generateWinnings(0.05, /*houseBalance*/ ctx[0]);
    			prize3.$set(prize3_changes);
    			const prize4_changes = {};
    			if (dirty & /*houseBalance*/ 1) prize4_changes.winnings = generateWinnings(0.06, /*houseBalance*/ ctx[0]);
    			prize4.$set(prize4_changes);
    			const prize5_changes = {};
    			if (dirty & /*houseBalance*/ 1) prize5_changes.winnings = generateWinnings(0.07, /*houseBalance*/ ctx[0]);
    			prize5.$set(prize5_changes);
    			const prize6_changes = {};
    			if (dirty & /*houseBalance*/ 1) prize6_changes.winnings = generateWinnings(0.08, /*houseBalance*/ ctx[0]);
    			prize6.$set(prize6_changes);
    			const prize7_changes = {};
    			if (dirty & /*houseBalance*/ 1) prize7_changes.winnings = generateWinnings(0.09, /*houseBalance*/ ctx[0]);
    			prize7.$set(prize7_changes);
    			const prize8_changes = {};
    			if (dirty & /*houseBalance*/ 1) prize8_changes.winnings = generateWinnings(0.1, /*houseBalance*/ ctx[0]);
    			prize8.$set(prize8_changes);
    			if ((!current || dirty & /*houseBalance*/ 1) && t10_value !== (t10_value = generateWinnings(0.85, /*houseBalance*/ ctx[0]) + "")) set_data_dev(t10, t10_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(prize0.$$.fragment, local);
    			transition_in(prize1.$$.fragment, local);
    			transition_in(prize2.$$.fragment, local);
    			transition_in(prize3.$$.fragment, local);
    			transition_in(prize4.$$.fragment, local);
    			transition_in(prize5.$$.fragment, local);
    			transition_in(prize6.$$.fragment, local);
    			transition_in(prize7.$$.fragment, local);
    			transition_in(prize8.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(prize0.$$.fragment, local);
    			transition_out(prize1.$$.fragment, local);
    			transition_out(prize2.$$.fragment, local);
    			transition_out(prize3.$$.fragment, local);
    			transition_out(prize4.$$.fragment, local);
    			transition_out(prize5.$$.fragment, local);
    			transition_out(prize6.$$.fragment, local);
    			transition_out(prize7.$$.fragment, local);
    			transition_out(prize8.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(prize0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(prize1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(prize2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(prize3, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(prize4, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(prize5, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(prize6, detaching);
    			if (detaching) detach_dev(t6);
    			destroy_component(prize7, detaching);
    			if (detaching) detach_dev(t7);
    			destroy_component(prize8, detaching);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(28:4) {#if (prizes == 'prize')}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div1;
    	let div0;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$6, create_else_block$5];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*prizes*/ ctx[1] == "prize") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if_block.c();
    			attr_dev(div0, "class", "prizes-inner-bg svelte-19lhp8k");
    			add_location(div0, file$c, 26, 2, 394);
    			attr_dev(div1, "class", "prizes-outer-bg svelte-19lhp8k");
    			add_location(div1, file$c, 24, 0, 361);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			if_blocks[current_block_type_index].m(div0, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div0, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function generateWinnings(per, hb) {
    	if (hb) {
    		return parseInt(hb * per);
    	}
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PrizeBoard", slots, []);
    	let { houseBalance } = $$props;
    	let prizes = "prize";

    	function setPrizes(prize) {
    		$$invalidate(1, prizes = prize);
    	}

    	const writable_props = ["houseBalance"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PrizeBoard> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => setPrizes("prize");

    	$$self.$$set = $$props => {
    		if ("houseBalance" in $$props) $$invalidate(0, houseBalance = $$props.houseBalance);
    	};

    	$$self.$capture_state = () => ({
    		Prize,
    		GrandPrize,
    		houseBalance,
    		prizes,
    		setPrizes,
    		generateWinnings
    	});

    	$$self.$inject_state = $$props => {
    		if ("houseBalance" in $$props) $$invalidate(0, houseBalance = $$props.houseBalance);
    		if ("prizes" in $$props) $$invalidate(1, prizes = $$props.prizes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [houseBalance, prizes, setPrizes, click_handler];
    }

    class PrizeBoard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { houseBalance: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PrizeBoard",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*houseBalance*/ ctx[0] === undefined && !("houseBalance" in props)) {
    			console.warn("<PrizeBoard> was created without expected prop 'houseBalance'");
    		}
    	}

    	get houseBalance() {
    		throw new Error("<PrizeBoard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set houseBalance(value) {
    		throw new Error("<PrizeBoard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * Parses an URI
     *
     * @author Steven Levithan <stevenlevithan.com> (MIT license)
     * @api private
     */
    var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

    var parts = [
        'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
    ];

    var parseuri = function parseuri(str) {
        var src = str,
            b = str.indexOf('['),
            e = str.indexOf(']');

        if (b != -1 && e != -1) {
            str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
        }

        var m = re.exec(str || ''),
            uri = {},
            i = 14;

        while (i--) {
            uri[parts[i]] = m[i] || '';
        }

        if (b != -1 && e != -1) {
            uri.source = src;
            uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
            uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
            uri.ipv6uri = true;
        }

        uri.pathNames = pathNames(uri, uri['path']);
        uri.queryKey = queryKey(uri, uri['query']);

        return uri;
    };

    function pathNames(obj, path) {
        var regx = /\/{2,9}/g,
            names = path.replace(regx, "/").split("/");

        if (path.substr(0, 1) == '/' || path.length === 0) {
            names.splice(0, 1);
        }
        if (path.substr(path.length - 1, 1) == '/') {
            names.splice(names.length - 1, 1);
        }

        return names;
    }

    function queryKey(uri, query) {
        var data = {};

        query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function ($0, $1, $2) {
            if ($1) {
                data[$1] = $2;
            }
        });

        return data;
    }

    /**
     * Helpers.
     */
    var s = 1000;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;

    /**
     * Parse or format the given `val`.
     *
     * Options:
     *
     *  - `long` verbose formatting [false]
     *
     * @param {String|Number} val
     * @param {Object} [options]
     * @throws {Error} throw an error if val is not a non-empty string or a number
     * @return {String|Number}
     * @api public
     */

    var ms = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === 'string' && val.length > 0) {
        return parse(val);
      } else if (type === 'number' && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        'val is not a non-empty string or a valid number. val=' +
          JSON.stringify(val)
      );
    };

    /**
     * Parse the given `str` and return milliseconds.
     *
     * @param {String} str
     * @return {Number}
     * @api private
     */

    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || 'ms').toLowerCase();
      switch (type) {
        case 'years':
        case 'year':
        case 'yrs':
        case 'yr':
        case 'y':
          return n * y;
        case 'weeks':
        case 'week':
        case 'w':
          return n * w;
        case 'days':
        case 'day':
        case 'd':
          return n * d;
        case 'hours':
        case 'hour':
        case 'hrs':
        case 'hr':
        case 'h':
          return n * h;
        case 'minutes':
        case 'minute':
        case 'mins':
        case 'min':
        case 'm':
          return n * m;
        case 'seconds':
        case 'second':
        case 'secs':
        case 'sec':
        case 's':
          return n * s;
        case 'milliseconds':
        case 'millisecond':
        case 'msecs':
        case 'msec':
        case 'ms':
          return n;
        default:
          return undefined;
      }
    }

    /**
     * Short format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */

    function fmtShort(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return Math.round(ms / d) + 'd';
      }
      if (msAbs >= h) {
        return Math.round(ms / h) + 'h';
      }
      if (msAbs >= m) {
        return Math.round(ms / m) + 'm';
      }
      if (msAbs >= s) {
        return Math.round(ms / s) + 's';
      }
      return ms + 'ms';
    }

    /**
     * Long format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */

    function fmtLong(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return plural(ms, msAbs, d, 'day');
      }
      if (msAbs >= h) {
        return plural(ms, msAbs, h, 'hour');
      }
      if (msAbs >= m) {
        return plural(ms, msAbs, m, 'minute');
      }
      if (msAbs >= s) {
        return plural(ms, msAbs, s, 'second');
      }
      return ms + ' ms';
    }

    /**
     * Pluralization helper.
     */

    function plural(ms, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
    }

    /**
     * This is the common logic for both the Node.js and web browser
     * implementations of `debug()`.
     */

    function setup(env) {
    	createDebug.debug = createDebug;
    	createDebug.default = createDebug;
    	createDebug.coerce = coerce;
    	createDebug.disable = disable;
    	createDebug.enable = enable;
    	createDebug.enabled = enabled;
    	createDebug.humanize = ms;
    	createDebug.destroy = destroy;

    	Object.keys(env).forEach(key => {
    		createDebug[key] = env[key];
    	});

    	/**
    	* The currently active debug mode names, and names to skip.
    	*/

    	createDebug.names = [];
    	createDebug.skips = [];

    	/**
    	* Map of special "%n" handling functions, for the debug "format" argument.
    	*
    	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
    	*/
    	createDebug.formatters = {};

    	/**
    	* Selects a color for a debug namespace
    	* @param {String} namespace The namespace string for the for the debug instance to be colored
    	* @return {Number|String} An ANSI color code for the given namespace
    	* @api private
    	*/
    	function selectColor(namespace) {
    		let hash = 0;

    		for (let i = 0; i < namespace.length; i++) {
    			hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
    			hash |= 0; // Convert to 32bit integer
    		}

    		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
    	}
    	createDebug.selectColor = selectColor;

    	/**
    	* Create a debugger with the given `namespace`.
    	*
    	* @param {String} namespace
    	* @return {Function}
    	* @api public
    	*/
    	function createDebug(namespace) {
    		let prevTime;
    		let enableOverride = null;

    		function debug(...args) {
    			// Disabled?
    			if (!debug.enabled) {
    				return;
    			}

    			const self = debug;

    			// Set `diff` timestamp
    			const curr = Number(new Date());
    			const ms = curr - (prevTime || curr);
    			self.diff = ms;
    			self.prev = prevTime;
    			self.curr = curr;
    			prevTime = curr;

    			args[0] = createDebug.coerce(args[0]);

    			if (typeof args[0] !== 'string') {
    				// Anything else let's inspect with %O
    				args.unshift('%O');
    			}

    			// Apply any `formatters` transformations
    			let index = 0;
    			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
    				// If we encounter an escaped % then don't increase the array index
    				if (match === '%%') {
    					return '%';
    				}
    				index++;
    				const formatter = createDebug.formatters[format];
    				if (typeof formatter === 'function') {
    					const val = args[index];
    					match = formatter.call(self, val);

    					// Now we need to remove `args[index]` since it's inlined in the `format`
    					args.splice(index, 1);
    					index--;
    				}
    				return match;
    			});

    			// Apply env-specific formatting (colors, etc.)
    			createDebug.formatArgs.call(self, args);

    			const logFn = self.log || createDebug.log;
    			logFn.apply(self, args);
    		}

    		debug.namespace = namespace;
    		debug.useColors = createDebug.useColors();
    		debug.color = createDebug.selectColor(namespace);
    		debug.extend = extend;
    		debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

    		Object.defineProperty(debug, 'enabled', {
    			enumerable: true,
    			configurable: false,
    			get: () => enableOverride === null ? createDebug.enabled(namespace) : enableOverride,
    			set: v => {
    				enableOverride = v;
    			}
    		});

    		// Env-specific initialization logic for debug instances
    		if (typeof createDebug.init === 'function') {
    			createDebug.init(debug);
    		}

    		return debug;
    	}

    	function extend(namespace, delimiter) {
    		const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
    		newDebug.log = this.log;
    		return newDebug;
    	}

    	/**
    	* Enables a debug mode by namespaces. This can include modes
    	* separated by a colon and wildcards.
    	*
    	* @param {String} namespaces
    	* @api public
    	*/
    	function enable(namespaces) {
    		createDebug.save(namespaces);

    		createDebug.names = [];
    		createDebug.skips = [];

    		let i;
    		const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
    		const len = split.length;

    		for (i = 0; i < len; i++) {
    			if (!split[i]) {
    				// ignore empty strings
    				continue;
    			}

    			namespaces = split[i].replace(/\*/g, '.*?');

    			if (namespaces[0] === '-') {
    				createDebug.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    			} else {
    				createDebug.names.push(new RegExp('^' + namespaces + '$'));
    			}
    		}
    	}

    	/**
    	* Disable debug output.
    	*
    	* @return {String} namespaces
    	* @api public
    	*/
    	function disable() {
    		const namespaces = [
    			...createDebug.names.map(toNamespace),
    			...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)
    		].join(',');
    		createDebug.enable('');
    		return namespaces;
    	}

    	/**
    	* Returns true if the given mode name is enabled, false otherwise.
    	*
    	* @param {String} name
    	* @return {Boolean}
    	* @api public
    	*/
    	function enabled(name) {
    		if (name[name.length - 1] === '*') {
    			return true;
    		}

    		let i;
    		let len;

    		for (i = 0, len = createDebug.skips.length; i < len; i++) {
    			if (createDebug.skips[i].test(name)) {
    				return false;
    			}
    		}

    		for (i = 0, len = createDebug.names.length; i < len; i++) {
    			if (createDebug.names[i].test(name)) {
    				return true;
    			}
    		}

    		return false;
    	}

    	/**
    	* Convert regexp to namespace
    	*
    	* @param {RegExp} regxep
    	* @return {String} namespace
    	* @api private
    	*/
    	function toNamespace(regexp) {
    		return regexp.toString()
    			.substring(2, regexp.toString().length - 2)
    			.replace(/\.\*\?$/, '*');
    	}

    	/**
    	* Coerce `val`.
    	*
    	* @param {Mixed} val
    	* @return {Mixed}
    	* @api private
    	*/
    	function coerce(val) {
    		if (val instanceof Error) {
    			return val.stack || val.message;
    		}
    		return val;
    	}

    	/**
    	* XXX DO NOT USE. This is a temporary stub function.
    	* XXX It WILL be removed in the next major release.
    	*/
    	function destroy() {
    		console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
    	}

    	createDebug.enable(createDebug.load());

    	return createDebug;
    }

    var common = setup;

    /* eslint-env browser */

    var browser = createCommonjsModule(function (module, exports) {
    /**
     * This is the web browser implementation of `debug()`.
     */

    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = localstorage();
    exports.destroy = (() => {
    	let warned = false;

    	return () => {
    		if (!warned) {
    			warned = true;
    			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
    		}
    	};
    })();

    /**
     * Colors.
     */

    exports.colors = [
    	'#0000CC',
    	'#0000FF',
    	'#0033CC',
    	'#0033FF',
    	'#0066CC',
    	'#0066FF',
    	'#0099CC',
    	'#0099FF',
    	'#00CC00',
    	'#00CC33',
    	'#00CC66',
    	'#00CC99',
    	'#00CCCC',
    	'#00CCFF',
    	'#3300CC',
    	'#3300FF',
    	'#3333CC',
    	'#3333FF',
    	'#3366CC',
    	'#3366FF',
    	'#3399CC',
    	'#3399FF',
    	'#33CC00',
    	'#33CC33',
    	'#33CC66',
    	'#33CC99',
    	'#33CCCC',
    	'#33CCFF',
    	'#6600CC',
    	'#6600FF',
    	'#6633CC',
    	'#6633FF',
    	'#66CC00',
    	'#66CC33',
    	'#9900CC',
    	'#9900FF',
    	'#9933CC',
    	'#9933FF',
    	'#99CC00',
    	'#99CC33',
    	'#CC0000',
    	'#CC0033',
    	'#CC0066',
    	'#CC0099',
    	'#CC00CC',
    	'#CC00FF',
    	'#CC3300',
    	'#CC3333',
    	'#CC3366',
    	'#CC3399',
    	'#CC33CC',
    	'#CC33FF',
    	'#CC6600',
    	'#CC6633',
    	'#CC9900',
    	'#CC9933',
    	'#CCCC00',
    	'#CCCC33',
    	'#FF0000',
    	'#FF0033',
    	'#FF0066',
    	'#FF0099',
    	'#FF00CC',
    	'#FF00FF',
    	'#FF3300',
    	'#FF3333',
    	'#FF3366',
    	'#FF3399',
    	'#FF33CC',
    	'#FF33FF',
    	'#FF6600',
    	'#FF6633',
    	'#FF9900',
    	'#FF9933',
    	'#FFCC00',
    	'#FFCC33'
    ];

    /**
     * Currently only WebKit-based Web Inspectors, Firefox >= v31,
     * and the Firebug extension (any Firefox version) are known
     * to support "%c" CSS customizations.
     *
     * TODO: add a `localStorage` variable to explicitly enable/disable colors
     */

    // eslint-disable-next-line complexity
    function useColors() {
    	// NB: In an Electron preload script, document will be defined but not fully
    	// initialized. Since we know we're in Chrome, we'll just detect this case
    	// explicitly
    	if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
    		return true;
    	}

    	// Internet Explorer and Edge do not support colors.
    	if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
    		return false;
    	}

    	// Is webkit? http://stackoverflow.com/a/16459606/376773
    	// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
    	return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
    		// Is firebug? http://stackoverflow.com/a/398120/376773
    		(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
    		// Is firefox >= v31?
    		// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    		// Double check webkit in userAgent just in case we are in a worker
    		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
    }

    /**
     * Colorize log arguments if enabled.
     *
     * @api public
     */

    function formatArgs(args) {
    	args[0] = (this.useColors ? '%c' : '') +
    		this.namespace +
    		(this.useColors ? ' %c' : ' ') +
    		args[0] +
    		(this.useColors ? '%c ' : ' ') +
    		'+' + module.exports.humanize(this.diff);

    	if (!this.useColors) {
    		return;
    	}

    	const c = 'color: ' + this.color;
    	args.splice(1, 0, c, 'color: inherit');

    	// The final "%c" is somewhat tricky, because there could be other
    	// arguments passed either before or after the %c, so we need to
    	// figure out the correct index to insert the CSS into
    	let index = 0;
    	let lastC = 0;
    	args[0].replace(/%[a-zA-Z%]/g, match => {
    		if (match === '%%') {
    			return;
    		}
    		index++;
    		if (match === '%c') {
    			// We only are interested in the *last* %c
    			// (the user may have provided their own)
    			lastC = index;
    		}
    	});

    	args.splice(lastC, 0, c);
    }

    /**
     * Invokes `console.debug()` when available.
     * No-op when `console.debug` is not a "function".
     * If `console.debug` is not available, falls back
     * to `console.log`.
     *
     * @api public
     */
    exports.log = console.debug || console.log || (() => {});

    /**
     * Save `namespaces`.
     *
     * @param {String} namespaces
     * @api private
     */
    function save(namespaces) {
    	try {
    		if (namespaces) {
    			exports.storage.setItem('debug', namespaces);
    		} else {
    			exports.storage.removeItem('debug');
    		}
    	} catch (error) {
    		// Swallow
    		// XXX (@Qix-) should we be logging these?
    	}
    }

    /**
     * Load `namespaces`.
     *
     * @return {String} returns the previously persisted debug modes
     * @api private
     */
    function load() {
    	let r;
    	try {
    		r = exports.storage.getItem('debug');
    	} catch (error) {
    		// Swallow
    		// XXX (@Qix-) should we be logging these?
    	}

    	// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
    	if (!r && typeof process !== 'undefined' && 'env' in process) {
    		r = process.env.DEBUG;
    	}

    	return r;
    }

    /**
     * Localstorage attempts to return the localstorage.
     *
     * This is necessary because safari throws
     * when a user disables cookies/localstorage
     * and you attempt to access it.
     *
     * @return {LocalStorage}
     * @api private
     */

    function localstorage() {
    	try {
    		// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
    		// The Browser also has localStorage in the global context.
    		return localStorage;
    	} catch (error) {
    		// Swallow
    		// XXX (@Qix-) should we be logging these?
    	}
    }

    module.exports = common(exports);

    const {formatters} = module.exports;

    /**
     * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
     */

    formatters.j = function (v) {
    	try {
    		return JSON.stringify(v);
    	} catch (error) {
    		return '[UnexpectedJSONParseError]: ' + error.message;
    	}
    };
    });

    var url_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.url = void 0;

    const debug = browser("socket.io-client:url");
    /**
     * URL parser.
     *
     * @param uri - url
     * @param path - the request path of the connection
     * @param loc - An object meant to mimic window.location.
     *        Defaults to window.location.
     * @public
     */
    function url(uri, path = "", loc) {
        let obj = uri;
        // default to window.location
        loc = loc || (typeof location !== "undefined" && location);
        if (null == uri)
            uri = loc.protocol + "//" + loc.host;
        // relative path support
        if (typeof uri === "string") {
            if ("/" === uri.charAt(0)) {
                if ("/" === uri.charAt(1)) {
                    uri = loc.protocol + uri;
                }
                else {
                    uri = loc.host + uri;
                }
            }
            if (!/^(https?|wss?):\/\//.test(uri)) {
                debug("protocol-less url %s", uri);
                if ("undefined" !== typeof loc) {
                    uri = loc.protocol + "//" + uri;
                }
                else {
                    uri = "https://" + uri;
                }
            }
            // parse
            debug("parse %s", uri);
            obj = parseuri(uri);
        }
        // make sure we treat `localhost:80` and `localhost` equally
        if (!obj.port) {
            if (/^(http|ws)$/.test(obj.protocol)) {
                obj.port = "80";
            }
            else if (/^(http|ws)s$/.test(obj.protocol)) {
                obj.port = "443";
            }
        }
        obj.path = obj.path || "/";
        const ipv6 = obj.host.indexOf(":") !== -1;
        const host = ipv6 ? "[" + obj.host + "]" : obj.host;
        // define unique id
        obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
        // define href
        obj.href =
            obj.protocol +
                "://" +
                host +
                (loc && loc.port === obj.port ? "" : ":" + obj.port);
        return obj;
    }
    exports.url = url;
    });

    var hasCors = createCommonjsModule(function (module) {
    /**
     * Module exports.
     *
     * Logic borrowed from Modernizr:
     *
     *   - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
     */

    try {
      module.exports = typeof XMLHttpRequest !== 'undefined' &&
        'withCredentials' in new XMLHttpRequest();
    } catch (err) {
      // if XMLHttp support is disabled in IE then it will throw
      // when trying to create
      module.exports = false;
    }
    });

    var globalThis_browser = (() => {
      if (typeof self !== "undefined") {
        return self;
      } else if (typeof window !== "undefined") {
        return window;
      } else {
        return Function("return this")();
      }
    })();

    // browser shim for xmlhttprequest module




    var xmlhttprequest = function(opts) {
      const xdomain = opts.xdomain;

      // scheme must be same when usign XDomainRequest
      // http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
      const xscheme = opts.xscheme;

      // XDomainRequest has a flow of not sending cookie, therefore it should be disabled as a default.
      // https://github.com/Automattic/engine.io-client/pull/217
      const enablesXDR = opts.enablesXDR;

      // XMLHttpRequest can be disabled on IE
      try {
        if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCors)) {
          return new XMLHttpRequest();
        }
      } catch (e) {}

      // Use XDomainRequest for IE8 if enablesXDR is true
      // because loading bar keeps flashing when using jsonp-polling
      // https://github.com/yujiosaka/socke.io-ie8-loading-example
      try {
        if ("undefined" !== typeof XDomainRequest && !xscheme && enablesXDR) {
          return new XDomainRequest();
        }
      } catch (e) {}

      if (!xdomain) {
        try {
          return new globalThis_browser[["Active"].concat("Object").join("X")](
            "Microsoft.XMLHTTP"
          );
        } catch (e) {}
      }
    };

    const PACKET_TYPES$1 = Object.create(null); // no Map = no polyfill
    PACKET_TYPES$1["open"] = "0";
    PACKET_TYPES$1["close"] = "1";
    PACKET_TYPES$1["ping"] = "2";
    PACKET_TYPES$1["pong"] = "3";
    PACKET_TYPES$1["message"] = "4";
    PACKET_TYPES$1["upgrade"] = "5";
    PACKET_TYPES$1["noop"] = "6";

    const PACKET_TYPES_REVERSE$1 = Object.create(null);
    Object.keys(PACKET_TYPES$1).forEach(key => {
      PACKET_TYPES_REVERSE$1[PACKET_TYPES$1[key]] = key;
    });

    const ERROR_PACKET$1 = { type: "error", data: "parser error" };

    var commons = {
      PACKET_TYPES: PACKET_TYPES$1,
      PACKET_TYPES_REVERSE: PACKET_TYPES_REVERSE$1,
      ERROR_PACKET: ERROR_PACKET$1
    };

    const { PACKET_TYPES } = commons;

    const withNativeBlob =
      typeof Blob === "function" ||
      (typeof Blob !== "undefined" &&
        Object.prototype.toString.call(Blob) === "[object BlobConstructor]");
    const withNativeArrayBuffer$1 = typeof ArrayBuffer === "function";

    // ArrayBuffer.isView method is not defined in IE10
    const isView = obj => {
      return typeof ArrayBuffer.isView === "function"
        ? ArrayBuffer.isView(obj)
        : obj && obj.buffer instanceof ArrayBuffer;
    };

    const encodePacket = ({ type, data }, supportsBinary, callback) => {
      if (withNativeBlob && data instanceof Blob) {
        if (supportsBinary) {
          return callback(data);
        } else {
          return encodeBlobAsBase64(data, callback);
        }
      } else if (
        withNativeArrayBuffer$1 &&
        (data instanceof ArrayBuffer || isView(data))
      ) {
        if (supportsBinary) {
          return callback(data instanceof ArrayBuffer ? data : data.buffer);
        } else {
          return encodeBlobAsBase64(new Blob([data]), callback);
        }
      }
      // plain string
      return callback(PACKET_TYPES[type] + (data || ""));
    };

    const encodeBlobAsBase64 = (data, callback) => {
      const fileReader = new FileReader();
      fileReader.onload = function() {
        const content = fileReader.result.split(",")[1];
        callback("b" + content);
      };
      return fileReader.readAsDataURL(data);
    };

    var encodePacket_browser = encodePacket;

    /*
     * base64-arraybuffer
     * https://github.com/niklasvh/base64-arraybuffer
     *
     * Copyright (c) 2012 Niklas von Hertzen
     * Licensed under the MIT license.
     */

    var base64Arraybuffer = createCommonjsModule(function (module, exports) {
    (function(chars){

      exports.encode = function(arraybuffer) {
        var bytes = new Uint8Array(arraybuffer),
        i, len = bytes.length, base64 = "";

        for (i = 0; i < len; i+=3) {
          base64 += chars[bytes[i] >> 2];
          base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
          base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
          base64 += chars[bytes[i + 2] & 63];
        }

        if ((len % 3) === 2) {
          base64 = base64.substring(0, base64.length - 1) + "=";
        } else if (len % 3 === 1) {
          base64 = base64.substring(0, base64.length - 2) + "==";
        }

        return base64;
      };

      exports.decode =  function(base64) {
        var bufferLength = base64.length * 0.75,
        len = base64.length, i, p = 0,
        encoded1, encoded2, encoded3, encoded4;

        if (base64[base64.length - 1] === "=") {
          bufferLength--;
          if (base64[base64.length - 2] === "=") {
            bufferLength--;
          }
        }

        var arraybuffer = new ArrayBuffer(bufferLength),
        bytes = new Uint8Array(arraybuffer);

        for (i = 0; i < len; i+=4) {
          encoded1 = chars.indexOf(base64[i]);
          encoded2 = chars.indexOf(base64[i+1]);
          encoded3 = chars.indexOf(base64[i+2]);
          encoded4 = chars.indexOf(base64[i+3]);

          bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
          bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
          bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
        }

        return arraybuffer;
      };
    })("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");
    });

    const { PACKET_TYPES_REVERSE, ERROR_PACKET } = commons;

    const withNativeArrayBuffer = typeof ArrayBuffer === "function";

    let base64decoder;
    if (withNativeArrayBuffer) {
      base64decoder = base64Arraybuffer;
    }

    const decodePacket = (encodedPacket, binaryType) => {
      if (typeof encodedPacket !== "string") {
        return {
          type: "message",
          data: mapBinary(encodedPacket, binaryType)
        };
      }
      const type = encodedPacket.charAt(0);
      if (type === "b") {
        return {
          type: "message",
          data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
        };
      }
      const packetType = PACKET_TYPES_REVERSE[type];
      if (!packetType) {
        return ERROR_PACKET;
      }
      return encodedPacket.length > 1
        ? {
            type: PACKET_TYPES_REVERSE[type],
            data: encodedPacket.substring(1)
          }
        : {
            type: PACKET_TYPES_REVERSE[type]
          };
    };

    const decodeBase64Packet = (data, binaryType) => {
      if (base64decoder) {
        const decoded = base64decoder.decode(data);
        return mapBinary(decoded, binaryType);
      } else {
        return { base64: true, data }; // fallback for old browsers
      }
    };

    const mapBinary = (data, binaryType) => {
      switch (binaryType) {
        case "blob":
          return data instanceof ArrayBuffer ? new Blob([data]) : data;
        case "arraybuffer":
        default:
          return data; // assuming the data is already an ArrayBuffer
      }
    };

    var decodePacket_browser = decodePacket;

    const SEPARATOR = String.fromCharCode(30); // see https://en.wikipedia.org/wiki/Delimiter#ASCII_delimited_text

    const encodePayload = (packets, callback) => {
      // some packets may be added to the array while encoding, so the initial length must be saved
      const length = packets.length;
      const encodedPackets = new Array(length);
      let count = 0;

      packets.forEach((packet, i) => {
        // force base64 encoding for binary packets
        encodePacket_browser(packet, false, encodedPacket => {
          encodedPackets[i] = encodedPacket;
          if (++count === length) {
            callback(encodedPackets.join(SEPARATOR));
          }
        });
      });
    };

    const decodePayload = (encodedPayload, binaryType) => {
      const encodedPackets = encodedPayload.split(SEPARATOR);
      const packets = [];
      for (let i = 0; i < encodedPackets.length; i++) {
        const decodedPacket = decodePacket_browser(encodedPackets[i], binaryType);
        packets.push(decodedPacket);
        if (decodedPacket.type === "error") {
          break;
        }
      }
      return packets;
    };

    var lib$1 = {
      protocol: 4,
      encodePacket: encodePacket_browser,
      encodePayload,
      decodePacket: decodePacket_browser,
      decodePayload
    };

    var componentEmitter = createCommonjsModule(function (module) {
    /**
     * Expose `Emitter`.
     */

    {
      module.exports = Emitter;
    }

    /**
     * Initialize a new `Emitter`.
     *
     * @api public
     */

    function Emitter(obj) {
      if (obj) return mixin(obj);
    }
    /**
     * Mixin the emitter properties.
     *
     * @param {Object} obj
     * @return {Object}
     * @api private
     */

    function mixin(obj) {
      for (var key in Emitter.prototype) {
        obj[key] = Emitter.prototype[key];
      }
      return obj;
    }

    /**
     * Listen on the given `event` with `fn`.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.on =
    Emitter.prototype.addEventListener = function(event, fn){
      this._callbacks = this._callbacks || {};
      (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
        .push(fn);
      return this;
    };

    /**
     * Adds an `event` listener that will be invoked a single
     * time then automatically removed.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.once = function(event, fn){
      function on() {
        this.off(event, on);
        fn.apply(this, arguments);
      }

      on.fn = fn;
      this.on(event, on);
      return this;
    };

    /**
     * Remove the given callback for `event` or all
     * registered callbacks.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.off =
    Emitter.prototype.removeListener =
    Emitter.prototype.removeAllListeners =
    Emitter.prototype.removeEventListener = function(event, fn){
      this._callbacks = this._callbacks || {};

      // all
      if (0 == arguments.length) {
        this._callbacks = {};
        return this;
      }

      // specific event
      var callbacks = this._callbacks['$' + event];
      if (!callbacks) return this;

      // remove all handlers
      if (1 == arguments.length) {
        delete this._callbacks['$' + event];
        return this;
      }

      // remove specific handler
      var cb;
      for (var i = 0; i < callbacks.length; i++) {
        cb = callbacks[i];
        if (cb === fn || cb.fn === fn) {
          callbacks.splice(i, 1);
          break;
        }
      }

      // Remove event specific arrays for event types that no
      // one is subscribed for to avoid memory leak.
      if (callbacks.length === 0) {
        delete this._callbacks['$' + event];
      }

      return this;
    };

    /**
     * Emit `event` with the given args.
     *
     * @param {String} event
     * @param {Mixed} ...
     * @return {Emitter}
     */

    Emitter.prototype.emit = function(event){
      this._callbacks = this._callbacks || {};

      var args = new Array(arguments.length - 1)
        , callbacks = this._callbacks['$' + event];

      for (var i = 1; i < arguments.length; i++) {
        args[i - 1] = arguments[i];
      }

      if (callbacks) {
        callbacks = callbacks.slice(0);
        for (var i = 0, len = callbacks.length; i < len; ++i) {
          callbacks[i].apply(this, args);
        }
      }

      return this;
    };

    /**
     * Return array of callbacks for `event`.
     *
     * @param {String} event
     * @return {Array}
     * @api public
     */

    Emitter.prototype.listeners = function(event){
      this._callbacks = this._callbacks || {};
      return this._callbacks['$' + event] || [];
    };

    /**
     * Check if this emitter has `event` handlers.
     *
     * @param {String} event
     * @return {Boolean}
     * @api public
     */

    Emitter.prototype.hasListeners = function(event){
      return !! this.listeners(event).length;
    };
    });

    const debug$4 = browser("engine.io-client:transport");

    class Transport$1 extends componentEmitter {
      /**
       * Transport abstract constructor.
       *
       * @param {Object} options.
       * @api private
       */
      constructor(opts) {
        super();

        this.opts = opts;
        this.query = opts.query;
        this.readyState = "";
        this.socket = opts.socket;
      }

      /**
       * Emits an error.
       *
       * @param {String} str
       * @return {Transport} for chaining
       * @api public
       */
      onError(msg, desc) {
        const err = new Error(msg);
        err.type = "TransportError";
        err.description = desc;
        this.emit("error", err);
        return this;
      }

      /**
       * Opens the transport.
       *
       * @api public
       */
      open() {
        if ("closed" === this.readyState || "" === this.readyState) {
          this.readyState = "opening";
          this.doOpen();
        }

        return this;
      }

      /**
       * Closes the transport.
       *
       * @api private
       */
      close() {
        if ("opening" === this.readyState || "open" === this.readyState) {
          this.doClose();
          this.onClose();
        }

        return this;
      }

      /**
       * Sends multiple packets.
       *
       * @param {Array} packets
       * @api private
       */
      send(packets) {
        if ("open" === this.readyState) {
          this.write(packets);
        } else {
          // this might happen if the transport was silently closed in the beforeunload event handler
          debug$4("transport is not open, discarding packets");
        }
      }

      /**
       * Called upon open
       *
       * @api private
       */
      onOpen() {
        this.readyState = "open";
        this.writable = true;
        this.emit("open");
      }

      /**
       * Called with data.
       *
       * @param {String} data
       * @api private
       */
      onData(data) {
        const packet = lib$1.decodePacket(data, this.socket.binaryType);
        this.onPacket(packet);
      }

      /**
       * Called with a decoded packet.
       */
      onPacket(packet) {
        this.emit("packet", packet);
      }

      /**
       * Called upon close.
       *
       * @api private
       */
      onClose() {
        this.readyState = "closed";
        this.emit("close");
      }
    }

    var transport = Transport$1;

    /**
     * Compiles a querystring
     * Returns string representation of the object
     *
     * @param {Object}
     * @api private
     */
    var encode$1 = function (obj) {
      var str = '';

      for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          if (str.length) str += '&';
          str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
        }
      }

      return str;
    };

    /**
     * Parses a simple querystring into an object
     *
     * @param {String} qs
     * @api private
     */

    var decode$1 = function(qs){
      var qry = {};
      var pairs = qs.split('&');
      for (var i = 0, l = pairs.length; i < l; i++) {
        var pair = pairs[i].split('=');
        qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
      }
      return qry;
    };

    var parseqs = {
    	encode: encode$1,
    	decode: decode$1
    };

    var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split('')
      , length = 64
      , map = {}
      , seed = 0
      , i = 0
      , prev;

    /**
     * Return a string representing the specified number.
     *
     * @param {Number} num The number to convert.
     * @returns {String} The string representation of the number.
     * @api public
     */
    function encode(num) {
      var encoded = '';

      do {
        encoded = alphabet[num % length] + encoded;
        num = Math.floor(num / length);
      } while (num > 0);

      return encoded;
    }

    /**
     * Return the integer value specified by the given string.
     *
     * @param {String} str The string to convert.
     * @returns {Number} The integer value represented by the string.
     * @api public
     */
    function decode(str) {
      var decoded = 0;

      for (i = 0; i < str.length; i++) {
        decoded = decoded * length + map[str.charAt(i)];
      }

      return decoded;
    }

    /**
     * Yeast: A tiny growing id generator.
     *
     * @returns {String} A unique id.
     * @api public
     */
    function yeast() {
      var now = encode(+new Date());

      if (now !== prev) return seed = 0, prev = now;
      return now +'.'+ encode(seed++);
    }

    //
    // Map each character to its index.
    //
    for (; i < length; i++) map[alphabet[i]] = i;

    //
    // Expose the `yeast`, `encode` and `decode` functions.
    //
    yeast.encode = encode;
    yeast.decode = decode;
    var yeast_1 = yeast;

    const debug$3 = browser("engine.io-client:polling");

    class Polling extends transport {
      /**
       * Transport name.
       */
      get name() {
        return "polling";
      }

      /**
       * Opens the socket (triggers polling). We write a PING message to determine
       * when the transport is open.
       *
       * @api private
       */
      doOpen() {
        this.poll();
      }

      /**
       * Pauses polling.
       *
       * @param {Function} callback upon buffers are flushed and transport is paused
       * @api private
       */
      pause(onPause) {
        const self = this;

        this.readyState = "pausing";

        function pause() {
          debug$3("paused");
          self.readyState = "paused";
          onPause();
        }

        if (this.polling || !this.writable) {
          let total = 0;

          if (this.polling) {
            debug$3("we are currently polling - waiting to pause");
            total++;
            this.once("pollComplete", function() {
              debug$3("pre-pause polling complete");
              --total || pause();
            });
          }

          if (!this.writable) {
            debug$3("we are currently writing - waiting to pause");
            total++;
            this.once("drain", function() {
              debug$3("pre-pause writing complete");
              --total || pause();
            });
          }
        } else {
          pause();
        }
      }

      /**
       * Starts polling cycle.
       *
       * @api public
       */
      poll() {
        debug$3("polling");
        this.polling = true;
        this.doPoll();
        this.emit("poll");
      }

      /**
       * Overloads onData to detect payloads.
       *
       * @api private
       */
      onData(data) {
        const self = this;
        debug$3("polling got data %s", data);
        const callback = function(packet, index, total) {
          // if its the first message we consider the transport open
          if ("opening" === self.readyState && packet.type === "open") {
            self.onOpen();
          }

          // if its a close packet, we close the ongoing requests
          if ("close" === packet.type) {
            self.onClose();
            return false;
          }

          // otherwise bypass onData and handle the message
          self.onPacket(packet);
        };

        // decode payload
        lib$1.decodePayload(data, this.socket.binaryType).forEach(callback);

        // if an event did not trigger closing
        if ("closed" !== this.readyState) {
          // if we got data we're not polling
          this.polling = false;
          this.emit("pollComplete");

          if ("open" === this.readyState) {
            this.poll();
          } else {
            debug$3('ignoring poll - transport state "%s"', this.readyState);
          }
        }
      }

      /**
       * For polling, send a close packet.
       *
       * @api private
       */
      doClose() {
        const self = this;

        function close() {
          debug$3("writing close packet");
          self.write([{ type: "close" }]);
        }

        if ("open" === this.readyState) {
          debug$3("transport open - closing");
          close();
        } else {
          // in case we're trying to close while
          // handshaking is in progress (GH-164)
          debug$3("transport not open - deferring close");
          this.once("open", close);
        }
      }

      /**
       * Writes a packets payload.
       *
       * @param {Array} data packets
       * @param {Function} drain callback
       * @api private
       */
      write(packets) {
        this.writable = false;

        lib$1.encodePayload(packets, data => {
          this.doWrite(data, () => {
            this.writable = true;
            this.emit("drain");
          });
        });
      }

      /**
       * Generates uri for connection.
       *
       * @api private
       */
      uri() {
        let query = this.query || {};
        const schema = this.opts.secure ? "https" : "http";
        let port = "";

        // cache busting is forced
        if (false !== this.opts.timestampRequests) {
          query[this.opts.timestampParam] = yeast_1();
        }

        if (!this.supportsBinary && !query.sid) {
          query.b64 = 1;
        }

        query = parseqs.encode(query);

        // avoid port if default for schema
        if (
          this.opts.port &&
          (("https" === schema && Number(this.opts.port) !== 443) ||
            ("http" === schema && Number(this.opts.port) !== 80))
        ) {
          port = ":" + this.opts.port;
        }

        // prepend ? to query
        if (query.length) {
          query = "?" + query;
        }

        const ipv6 = this.opts.hostname.indexOf(":") !== -1;
        return (
          schema +
          "://" +
          (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) +
          port +
          this.opts.path +
          query
        );
      }
    }

    var polling$1 = Polling;

    var pick$2 = (obj, ...attr) => {
      return attr.reduce((acc, k) => {
        if (obj.hasOwnProperty(k)) {
          acc[k] = obj[k];
        }
        return acc;
      }, {});
    };

    var util = {
    	pick: pick$2
    };

    /* global attachEvent */

    const { pick: pick$1 } = util;


    const debug$2 = browser("engine.io-client:polling-xhr");

    /**
     * Empty function
     */

    function empty() {}

    const hasXHR2 = (function() {
      const xhr = new xmlhttprequest({ xdomain: false });
      return null != xhr.responseType;
    })();

    class XHR extends polling$1 {
      /**
       * XHR Polling constructor.
       *
       * @param {Object} opts
       * @api public
       */
      constructor(opts) {
        super(opts);

        if (typeof location !== "undefined") {
          const isSSL = "https:" === location.protocol;
          let port = location.port;

          // some user agents have empty `location.port`
          if (!port) {
            port = isSSL ? 443 : 80;
          }

          this.xd =
            (typeof location !== "undefined" &&
              opts.hostname !== location.hostname) ||
            port !== opts.port;
          this.xs = opts.secure !== isSSL;
        }
        /**
         * XHR supports binary
         */
        const forceBase64 = opts && opts.forceBase64;
        this.supportsBinary = hasXHR2 && !forceBase64;
      }

      /**
       * Creates a request.
       *
       * @param {String} method
       * @api private
       */
      request(opts = {}) {
        Object.assign(opts, { xd: this.xd, xs: this.xs }, this.opts);
        return new Request(this.uri(), opts);
      }

      /**
       * Sends data.
       *
       * @param {String} data to send.
       * @param {Function} called upon flush.
       * @api private
       */
      doWrite(data, fn) {
        const req = this.request({
          method: "POST",
          data: data
        });
        const self = this;
        req.on("success", fn);
        req.on("error", function(err) {
          self.onError("xhr post error", err);
        });
      }

      /**
       * Starts a poll cycle.
       *
       * @api private
       */
      doPoll() {
        debug$2("xhr poll");
        const req = this.request();
        const self = this;
        req.on("data", function(data) {
          self.onData(data);
        });
        req.on("error", function(err) {
          self.onError("xhr poll error", err);
        });
        this.pollXhr = req;
      }
    }

    class Request extends componentEmitter {
      /**
       * Request constructor
       *
       * @param {Object} options
       * @api public
       */
      constructor(uri, opts) {
        super();
        this.opts = opts;

        this.method = opts.method || "GET";
        this.uri = uri;
        this.async = false !== opts.async;
        this.data = undefined !== opts.data ? opts.data : null;

        this.create();
      }

      /**
       * Creates the XHR object and sends the request.
       *
       * @api private
       */
      create() {
        const opts = pick$1(
          this.opts,
          "agent",
          "enablesXDR",
          "pfx",
          "key",
          "passphrase",
          "cert",
          "ca",
          "ciphers",
          "rejectUnauthorized",
          "autoUnref"
        );
        opts.xdomain = !!this.opts.xd;
        opts.xscheme = !!this.opts.xs;

        const xhr = (this.xhr = new xmlhttprequest(opts));
        const self = this;

        try {
          debug$2("xhr open %s: %s", this.method, this.uri);
          xhr.open(this.method, this.uri, this.async);
          try {
            if (this.opts.extraHeaders) {
              xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
              for (let i in this.opts.extraHeaders) {
                if (this.opts.extraHeaders.hasOwnProperty(i)) {
                  xhr.setRequestHeader(i, this.opts.extraHeaders[i]);
                }
              }
            }
          } catch (e) {}

          if ("POST" === this.method) {
            try {
              xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
            } catch (e) {}
          }

          try {
            xhr.setRequestHeader("Accept", "*/*");
          } catch (e) {}

          // ie6 check
          if ("withCredentials" in xhr) {
            xhr.withCredentials = this.opts.withCredentials;
          }

          if (this.opts.requestTimeout) {
            xhr.timeout = this.opts.requestTimeout;
          }

          if (this.hasXDR()) {
            xhr.onload = function() {
              self.onLoad();
            };
            xhr.onerror = function() {
              self.onError(xhr.responseText);
            };
          } else {
            xhr.onreadystatechange = function() {
              if (4 !== xhr.readyState) return;
              if (200 === xhr.status || 1223 === xhr.status) {
                self.onLoad();
              } else {
                // make sure the `error` event handler that's user-set
                // does not throw in the same tick and gets caught here
                setTimeout(function() {
                  self.onError(typeof xhr.status === "number" ? xhr.status : 0);
                }, 0);
              }
            };
          }

          debug$2("xhr data %s", this.data);
          xhr.send(this.data);
        } catch (e) {
          // Need to defer since .create() is called directly from the constructor
          // and thus the 'error' event can only be only bound *after* this exception
          // occurs.  Therefore, also, we cannot throw here at all.
          setTimeout(function() {
            self.onError(e);
          }, 0);
          return;
        }

        if (typeof document !== "undefined") {
          this.index = Request.requestsCount++;
          Request.requests[this.index] = this;
        }
      }

      /**
       * Called upon successful response.
       *
       * @api private
       */
      onSuccess() {
        this.emit("success");
        this.cleanup();
      }

      /**
       * Called if we have data.
       *
       * @api private
       */
      onData(data) {
        this.emit("data", data);
        this.onSuccess();
      }

      /**
       * Called upon error.
       *
       * @api private
       */
      onError(err) {
        this.emit("error", err);
        this.cleanup(true);
      }

      /**
       * Cleans up house.
       *
       * @api private
       */
      cleanup(fromError) {
        if ("undefined" === typeof this.xhr || null === this.xhr) {
          return;
        }
        // xmlhttprequest
        if (this.hasXDR()) {
          this.xhr.onload = this.xhr.onerror = empty;
        } else {
          this.xhr.onreadystatechange = empty;
        }

        if (fromError) {
          try {
            this.xhr.abort();
          } catch (e) {}
        }

        if (typeof document !== "undefined") {
          delete Request.requests[this.index];
        }

        this.xhr = null;
      }

      /**
       * Called upon load.
       *
       * @api private
       */
      onLoad() {
        const data = this.xhr.responseText;
        if (data !== null) {
          this.onData(data);
        }
      }

      /**
       * Check if it has XDomainRequest.
       *
       * @api private
       */
      hasXDR() {
        return typeof XDomainRequest !== "undefined" && !this.xs && this.enablesXDR;
      }

      /**
       * Aborts the request.
       *
       * @api public
       */
      abort() {
        this.cleanup();
      }
    }

    /**
     * Aborts pending requests when unloading the window. This is needed to prevent
     * memory leaks (e.g. when using IE) and to ensure that no spurious error is
     * emitted.
     */

    Request.requestsCount = 0;
    Request.requests = {};

    if (typeof document !== "undefined") {
      if (typeof attachEvent === "function") {
        attachEvent("onunload", unloadHandler);
      } else if (typeof addEventListener === "function") {
        const terminationEvent = "onpagehide" in globalThis_browser ? "pagehide" : "unload";
        addEventListener(terminationEvent, unloadHandler, false);
      }
    }

    function unloadHandler() {
      for (let i in Request.requests) {
        if (Request.requests.hasOwnProperty(i)) {
          Request.requests[i].abort();
        }
      }
    }

    var pollingXhr = XHR;
    var Request_1 = Request;
    pollingXhr.Request = Request_1;

    const rNewline = /\n/g;
    const rEscapedNewline = /\\n/g;

    /**
     * Global JSONP callbacks.
     */

    let callbacks;

    class JSONPPolling extends polling$1 {
      /**
       * JSONP Polling constructor.
       *
       * @param {Object} opts.
       * @api public
       */
      constructor(opts) {
        super(opts);

        this.query = this.query || {};

        // define global callbacks array if not present
        // we do this here (lazily) to avoid unneeded global pollution
        if (!callbacks) {
          // we need to consider multiple engines in the same page
          callbacks = globalThis_browser.___eio = globalThis_browser.___eio || [];
        }

        // callback identifier
        this.index = callbacks.length;

        // add callback to jsonp global
        const self = this;
        callbacks.push(function(msg) {
          self.onData(msg);
        });

        // append to query string
        this.query.j = this.index;
      }

      /**
       * JSONP only supports binary as base64 encoded strings
       */
      get supportsBinary() {
        return false;
      }

      /**
       * Closes the socket.
       *
       * @api private
       */
      doClose() {
        if (this.script) {
          // prevent spurious errors from being emitted when the window is unloaded
          this.script.onerror = () => {};
          this.script.parentNode.removeChild(this.script);
          this.script = null;
        }

        if (this.form) {
          this.form.parentNode.removeChild(this.form);
          this.form = null;
          this.iframe = null;
        }

        super.doClose();
      }

      /**
       * Starts a poll cycle.
       *
       * @api private
       */
      doPoll() {
        const self = this;
        const script = document.createElement("script");

        if (this.script) {
          this.script.parentNode.removeChild(this.script);
          this.script = null;
        }

        script.async = true;
        script.src = this.uri();
        script.onerror = function(e) {
          self.onError("jsonp poll error", e);
        };

        const insertAt = document.getElementsByTagName("script")[0];
        if (insertAt) {
          insertAt.parentNode.insertBefore(script, insertAt);
        } else {
          (document.head || document.body).appendChild(script);
        }
        this.script = script;

        const isUAgecko =
          "undefined" !== typeof navigator && /gecko/i.test(navigator.userAgent);

        if (isUAgecko) {
          setTimeout(function() {
            const iframe = document.createElement("iframe");
            document.body.appendChild(iframe);
            document.body.removeChild(iframe);
          }, 100);
        }
      }

      /**
       * Writes with a hidden iframe.
       *
       * @param {String} data to send
       * @param {Function} called upon flush.
       * @api private
       */
      doWrite(data, fn) {
        const self = this;
        let iframe;

        if (!this.form) {
          const form = document.createElement("form");
          const area = document.createElement("textarea");
          const id = (this.iframeId = "eio_iframe_" + this.index);

          form.className = "socketio";
          form.style.position = "absolute";
          form.style.top = "-1000px";
          form.style.left = "-1000px";
          form.target = id;
          form.method = "POST";
          form.setAttribute("accept-charset", "utf-8");
          area.name = "d";
          form.appendChild(area);
          document.body.appendChild(form);

          this.form = form;
          this.area = area;
        }

        this.form.action = this.uri();

        function complete() {
          initIframe();
          fn();
        }

        function initIframe() {
          if (self.iframe) {
            try {
              self.form.removeChild(self.iframe);
            } catch (e) {
              self.onError("jsonp polling iframe removal error", e);
            }
          }

          try {
            // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
            const html = '<iframe src="javascript:0" name="' + self.iframeId + '">';
            iframe = document.createElement(html);
          } catch (e) {
            iframe = document.createElement("iframe");
            iframe.name = self.iframeId;
            iframe.src = "javascript:0";
          }

          iframe.id = self.iframeId;

          self.form.appendChild(iframe);
          self.iframe = iframe;
        }

        initIframe();

        // escape \n to prevent it from being converted into \r\n by some UAs
        // double escaping is required for escaped new lines because unescaping of new lines can be done safely on server-side
        data = data.replace(rEscapedNewline, "\\\n");
        this.area.value = data.replace(rNewline, "\\n");

        try {
          this.form.submit();
        } catch (e) {}

        if (this.iframe.attachEvent) {
          this.iframe.onreadystatechange = function() {
            if (self.iframe.readyState === "complete") {
              complete();
            }
          };
        } else {
          this.iframe.onload = complete;
        }
      }
    }

    var pollingJsonp = JSONPPolling;

    var websocketConstructor_browser = {
      WebSocket: globalThis_browser.WebSocket || globalThis_browser.MozWebSocket,
      usingBrowserWebSocket: true,
      defaultBinaryType: "arraybuffer"
    };

    const { pick } = util;
    const {
      WebSocket,
      usingBrowserWebSocket,
      defaultBinaryType
    } = websocketConstructor_browser;

    const debug$1 = browser("engine.io-client:websocket");

    // detect ReactNative environment
    const isReactNative =
      typeof navigator !== "undefined" &&
      typeof navigator.product === "string" &&
      navigator.product.toLowerCase() === "reactnative";

    class WS extends transport {
      /**
       * WebSocket transport constructor.
       *
       * @api {Object} connection options
       * @api public
       */
      constructor(opts) {
        super(opts);

        this.supportsBinary = !opts.forceBase64;
      }

      /**
       * Transport name.
       *
       * @api public
       */
      get name() {
        return "websocket";
      }

      /**
       * Opens socket.
       *
       * @api private
       */
      doOpen() {
        if (!this.check()) {
          // let probe timeout
          return;
        }

        const uri = this.uri();
        const protocols = this.opts.protocols;

        // React Native only supports the 'headers' option, and will print a warning if anything else is passed
        const opts = isReactNative
          ? {}
          : pick(
              this.opts,
              "agent",
              "perMessageDeflate",
              "pfx",
              "key",
              "passphrase",
              "cert",
              "ca",
              "ciphers",
              "rejectUnauthorized",
              "localAddress",
              "protocolVersion",
              "origin",
              "maxPayload",
              "family",
              "checkServerIdentity"
            );

        if (this.opts.extraHeaders) {
          opts.headers = this.opts.extraHeaders;
        }

        try {
          this.ws =
            usingBrowserWebSocket && !isReactNative
              ? protocols
                ? new WebSocket(uri, protocols)
                : new WebSocket(uri)
              : new WebSocket(uri, protocols, opts);
        } catch (err) {
          return this.emit("error", err);
        }

        this.ws.binaryType = this.socket.binaryType || defaultBinaryType;

        this.addEventListeners();
      }

      /**
       * Adds event listeners to the socket
       *
       * @api private
       */
      addEventListeners() {
        this.ws.onopen = () => {
          if (this.opts.autoUnref) {
            this.ws._socket.unref();
          }
          this.onOpen();
        };
        this.ws.onclose = this.onClose.bind(this);
        this.ws.onmessage = ev => this.onData(ev.data);
        this.ws.onerror = e => this.onError("websocket error", e);
      }

      /**
       * Writes data to socket.
       *
       * @param {Array} array of packets.
       * @api private
       */
      write(packets) {
        const self = this;
        this.writable = false;

        // encodePacket efficient as it uses WS framing
        // no need for encodePayload
        let total = packets.length;
        let i = 0;
        const l = total;
        for (; i < l; i++) {
          (function(packet) {
            lib$1.encodePacket(packet, self.supportsBinary, function(data) {
              // always create a new object (GH-437)
              const opts = {};
              if (!usingBrowserWebSocket) {
                if (packet.options) {
                  opts.compress = packet.options.compress;
                }

                if (self.opts.perMessageDeflate) {
                  const len =
                    "string" === typeof data
                      ? Buffer.byteLength(data)
                      : data.length;
                  if (len < self.opts.perMessageDeflate.threshold) {
                    opts.compress = false;
                  }
                }
              }

              // Sometimes the websocket has already been closed but the browser didn't
              // have a chance of informing us about it yet, in that case send will
              // throw an error
              try {
                if (usingBrowserWebSocket) {
                  // TypeError is thrown when passing the second argument on Safari
                  self.ws.send(data);
                } else {
                  self.ws.send(data, opts);
                }
              } catch (e) {
                debug$1("websocket closed before onclose event");
              }

              --total || done();
            });
          })(packets[i]);
        }

        function done() {
          self.emit("flush");

          // fake drain
          // defer to next tick to allow Socket to clear writeBuffer
          setTimeout(function() {
            self.writable = true;
            self.emit("drain");
          }, 0);
        }
      }

      /**
       * Called upon close
       *
       * @api private
       */
      onClose() {
        transport.prototype.onClose.call(this);
      }

      /**
       * Closes socket.
       *
       * @api private
       */
      doClose() {
        if (typeof this.ws !== "undefined") {
          this.ws.close();
          this.ws = null;
        }
      }

      /**
       * Generates uri for connection.
       *
       * @api private
       */
      uri() {
        let query = this.query || {};
        const schema = this.opts.secure ? "wss" : "ws";
        let port = "";

        // avoid port if default for schema
        if (
          this.opts.port &&
          (("wss" === schema && Number(this.opts.port) !== 443) ||
            ("ws" === schema && Number(this.opts.port) !== 80))
        ) {
          port = ":" + this.opts.port;
        }

        // append timestamp to URI
        if (this.opts.timestampRequests) {
          query[this.opts.timestampParam] = yeast_1();
        }

        // communicate binary support capabilities
        if (!this.supportsBinary) {
          query.b64 = 1;
        }

        query = parseqs.encode(query);

        // prepend ? to query
        if (query.length) {
          query = "?" + query;
        }

        const ipv6 = this.opts.hostname.indexOf(":") !== -1;
        return (
          schema +
          "://" +
          (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) +
          port +
          this.opts.path +
          query
        );
      }

      /**
       * Feature detection for WebSocket.
       *
       * @return {Boolean} whether this transport is available.
       * @api public
       */
      check() {
        return (
          !!WebSocket &&
          !("__initialize" in WebSocket && this.name === WS.prototype.name)
        );
      }
    }

    var websocket = WS;

    var polling_1 = polling;
    var websocket_1 = websocket;

    /**
     * Polling transport polymorphic constructor.
     * Decides on xhr vs jsonp based on feature detection.
     *
     * @api private
     */

    function polling(opts) {
      let xhr;
      let xd = false;
      let xs = false;
      const jsonp = false !== opts.jsonp;

      if (typeof location !== "undefined") {
        const isSSL = "https:" === location.protocol;
        let port = location.port;

        // some user agents have empty `location.port`
        if (!port) {
          port = isSSL ? 443 : 80;
        }

        xd = opts.hostname !== location.hostname || port !== opts.port;
        xs = opts.secure !== isSSL;
      }

      opts.xdomain = xd;
      opts.xscheme = xs;
      xhr = new xmlhttprequest(opts);

      if ("open" in xhr && !opts.forceJSONP) {
        return new pollingXhr(opts);
      } else {
        if (!jsonp) throw new Error("JSONP disabled");
        return new pollingJsonp(opts);
      }
    }

    var transports$1 = {
    	polling: polling_1,
    	websocket: websocket_1
    };

    const debug = browser("engine.io-client:socket");




    class Socket extends componentEmitter {
      /**
       * Socket constructor.
       *
       * @param {String|Object} uri or options
       * @param {Object} options
       * @api public
       */
      constructor(uri, opts = {}) {
        super();

        if (uri && "object" === typeof uri) {
          opts = uri;
          uri = null;
        }

        if (uri) {
          uri = parseuri(uri);
          opts.hostname = uri.host;
          opts.secure = uri.protocol === "https" || uri.protocol === "wss";
          opts.port = uri.port;
          if (uri.query) opts.query = uri.query;
        } else if (opts.host) {
          opts.hostname = parseuri(opts.host).host;
        }

        this.secure =
          null != opts.secure
            ? opts.secure
            : typeof location !== "undefined" && "https:" === location.protocol;

        if (opts.hostname && !opts.port) {
          // if no port is specified manually, use the protocol default
          opts.port = this.secure ? "443" : "80";
        }

        this.hostname =
          opts.hostname ||
          (typeof location !== "undefined" ? location.hostname : "localhost");
        this.port =
          opts.port ||
          (typeof location !== "undefined" && location.port
            ? location.port
            : this.secure
            ? 443
            : 80);

        this.transports = opts.transports || ["polling", "websocket"];
        this.readyState = "";
        this.writeBuffer = [];
        this.prevBufferLen = 0;

        this.opts = Object.assign(
          {
            path: "/engine.io",
            agent: false,
            withCredentials: false,
            upgrade: true,
            jsonp: true,
            timestampParam: "t",
            rememberUpgrade: false,
            rejectUnauthorized: true,
            perMessageDeflate: {
              threshold: 1024
            },
            transportOptions: {}
          },
          opts
        );

        this.opts.path = this.opts.path.replace(/\/$/, "") + "/";

        if (typeof this.opts.query === "string") {
          this.opts.query = parseqs.decode(this.opts.query);
        }

        // set on handshake
        this.id = null;
        this.upgrades = null;
        this.pingInterval = null;
        this.pingTimeout = null;

        // set on heartbeat
        this.pingTimeoutTimer = null;

        if (typeof addEventListener === "function") {
          addEventListener(
            "beforeunload",
            () => {
              if (this.transport) {
                // silently close the transport
                this.transport.removeAllListeners();
                this.transport.close();
              }
            },
            false
          );
          if (this.hostname !== "localhost") {
            this.offlineEventListener = () => {
              this.onClose("transport close");
            };
            addEventListener("offline", this.offlineEventListener, false);
          }
        }

        this.open();
      }

      /**
       * Creates transport of the given type.
       *
       * @param {String} transport name
       * @return {Transport}
       * @api private
       */
      createTransport(name) {
        debug('creating transport "%s"', name);
        const query = clone(this.opts.query);

        // append engine.io protocol identifier
        query.EIO = lib$1.protocol;

        // transport name
        query.transport = name;

        // session id if we already have one
        if (this.id) query.sid = this.id;

        const opts = Object.assign(
          {},
          this.opts.transportOptions[name],
          this.opts,
          {
            query,
            socket: this,
            hostname: this.hostname,
            secure: this.secure,
            port: this.port
          }
        );

        debug("options: %j", opts);

        return new transports$1[name](opts);
      }

      /**
       * Initializes transport to use and starts probe.
       *
       * @api private
       */
      open() {
        let transport;
        if (
          this.opts.rememberUpgrade &&
          Socket.priorWebsocketSuccess &&
          this.transports.indexOf("websocket") !== -1
        ) {
          transport = "websocket";
        } else if (0 === this.transports.length) {
          // Emit error on next tick so it can be listened to
          const self = this;
          setTimeout(function() {
            self.emit("error", "No transports available");
          }, 0);
          return;
        } else {
          transport = this.transports[0];
        }
        this.readyState = "opening";

        // Retry with the next transport if the transport is disabled (jsonp: false)
        try {
          transport = this.createTransport(transport);
        } catch (e) {
          debug("error while creating transport: %s", e);
          this.transports.shift();
          this.open();
          return;
        }

        transport.open();
        this.setTransport(transport);
      }

      /**
       * Sets the current transport. Disables the existing one (if any).
       *
       * @api private
       */
      setTransport(transport) {
        debug("setting transport %s", transport.name);
        const self = this;

        if (this.transport) {
          debug("clearing existing transport %s", this.transport.name);
          this.transport.removeAllListeners();
        }

        // set up transport
        this.transport = transport;

        // set up transport listeners
        transport
          .on("drain", function() {
            self.onDrain();
          })
          .on("packet", function(packet) {
            self.onPacket(packet);
          })
          .on("error", function(e) {
            self.onError(e);
          })
          .on("close", function() {
            self.onClose("transport close");
          });
      }

      /**
       * Probes a transport.
       *
       * @param {String} transport name
       * @api private
       */
      probe(name) {
        debug('probing transport "%s"', name);
        let transport = this.createTransport(name, { probe: 1 });
        let failed = false;
        const self = this;

        Socket.priorWebsocketSuccess = false;

        function onTransportOpen() {
          if (self.onlyBinaryUpgrades) {
            const upgradeLosesBinary =
              !this.supportsBinary && self.transport.supportsBinary;
            failed = failed || upgradeLosesBinary;
          }
          if (failed) return;

          debug('probe transport "%s" opened', name);
          transport.send([{ type: "ping", data: "probe" }]);
          transport.once("packet", function(msg) {
            if (failed) return;
            if ("pong" === msg.type && "probe" === msg.data) {
              debug('probe transport "%s" pong', name);
              self.upgrading = true;
              self.emit("upgrading", transport);
              if (!transport) return;
              Socket.priorWebsocketSuccess = "websocket" === transport.name;

              debug('pausing current transport "%s"', self.transport.name);
              self.transport.pause(function() {
                if (failed) return;
                if ("closed" === self.readyState) return;
                debug("changing transport and sending upgrade packet");

                cleanup();

                self.setTransport(transport);
                transport.send([{ type: "upgrade" }]);
                self.emit("upgrade", transport);
                transport = null;
                self.upgrading = false;
                self.flush();
              });
            } else {
              debug('probe transport "%s" failed', name);
              const err = new Error("probe error");
              err.transport = transport.name;
              self.emit("upgradeError", err);
            }
          });
        }

        function freezeTransport() {
          if (failed) return;

          // Any callback called by transport should be ignored since now
          failed = true;

          cleanup();

          transport.close();
          transport = null;
        }

        // Handle any error that happens while probing
        function onerror(err) {
          const error = new Error("probe error: " + err);
          error.transport = transport.name;

          freezeTransport();

          debug('probe transport "%s" failed because of error: %s', name, err);

          self.emit("upgradeError", error);
        }

        function onTransportClose() {
          onerror("transport closed");
        }

        // When the socket is closed while we're probing
        function onclose() {
          onerror("socket closed");
        }

        // When the socket is upgraded while we're probing
        function onupgrade(to) {
          if (transport && to.name !== transport.name) {
            debug('"%s" works - aborting "%s"', to.name, transport.name);
            freezeTransport();
          }
        }

        // Remove all listeners on the transport and on self
        function cleanup() {
          transport.removeListener("open", onTransportOpen);
          transport.removeListener("error", onerror);
          transport.removeListener("close", onTransportClose);
          self.removeListener("close", onclose);
          self.removeListener("upgrading", onupgrade);
        }

        transport.once("open", onTransportOpen);
        transport.once("error", onerror);
        transport.once("close", onTransportClose);

        this.once("close", onclose);
        this.once("upgrading", onupgrade);

        transport.open();
      }

      /**
       * Called when connection is deemed open.
       *
       * @api public
       */
      onOpen() {
        debug("socket open");
        this.readyState = "open";
        Socket.priorWebsocketSuccess = "websocket" === this.transport.name;
        this.emit("open");
        this.flush();

        // we check for `readyState` in case an `open`
        // listener already closed the socket
        if (
          "open" === this.readyState &&
          this.opts.upgrade &&
          this.transport.pause
        ) {
          debug("starting upgrade probes");
          let i = 0;
          const l = this.upgrades.length;
          for (; i < l; i++) {
            this.probe(this.upgrades[i]);
          }
        }
      }

      /**
       * Handles a packet.
       *
       * @api private
       */
      onPacket(packet) {
        if (
          "opening" === this.readyState ||
          "open" === this.readyState ||
          "closing" === this.readyState
        ) {
          debug('socket receive: type "%s", data "%s"', packet.type, packet.data);

          this.emit("packet", packet);

          // Socket is live - any packet counts
          this.emit("heartbeat");

          switch (packet.type) {
            case "open":
              this.onHandshake(JSON.parse(packet.data));
              break;

            case "ping":
              this.resetPingTimeout();
              this.sendPacket("pong");
              this.emit("pong");
              break;

            case "error":
              const err = new Error("server error");
              err.code = packet.data;
              this.onError(err);
              break;

            case "message":
              this.emit("data", packet.data);
              this.emit("message", packet.data);
              break;
          }
        } else {
          debug('packet received with socket readyState "%s"', this.readyState);
        }
      }

      /**
       * Called upon handshake completion.
       *
       * @param {Object} handshake obj
       * @api private
       */
      onHandshake(data) {
        this.emit("handshake", data);
        this.id = data.sid;
        this.transport.query.sid = data.sid;
        this.upgrades = this.filterUpgrades(data.upgrades);
        this.pingInterval = data.pingInterval;
        this.pingTimeout = data.pingTimeout;
        this.onOpen();
        // In case open handler closes socket
        if ("closed" === this.readyState) return;
        this.resetPingTimeout();
      }

      /**
       * Sets and resets ping timeout timer based on server pings.
       *
       * @api private
       */
      resetPingTimeout() {
        clearTimeout(this.pingTimeoutTimer);
        this.pingTimeoutTimer = setTimeout(() => {
          this.onClose("ping timeout");
        }, this.pingInterval + this.pingTimeout);
        if (this.opts.autoUnref) {
          this.pingTimeoutTimer.unref();
        }
      }

      /**
       * Called on `drain` event
       *
       * @api private
       */
      onDrain() {
        this.writeBuffer.splice(0, this.prevBufferLen);

        // setting prevBufferLen = 0 is very important
        // for example, when upgrading, upgrade packet is sent over,
        // and a nonzero prevBufferLen could cause problems on `drain`
        this.prevBufferLen = 0;

        if (0 === this.writeBuffer.length) {
          this.emit("drain");
        } else {
          this.flush();
        }
      }

      /**
       * Flush write buffers.
       *
       * @api private
       */
      flush() {
        if (
          "closed" !== this.readyState &&
          this.transport.writable &&
          !this.upgrading &&
          this.writeBuffer.length
        ) {
          debug("flushing %d packets in socket", this.writeBuffer.length);
          this.transport.send(this.writeBuffer);
          // keep track of current length of writeBuffer
          // splice writeBuffer and callbackBuffer on `drain`
          this.prevBufferLen = this.writeBuffer.length;
          this.emit("flush");
        }
      }

      /**
       * Sends a message.
       *
       * @param {String} message.
       * @param {Function} callback function.
       * @param {Object} options.
       * @return {Socket} for chaining.
       * @api public
       */
      write(msg, options, fn) {
        this.sendPacket("message", msg, options, fn);
        return this;
      }

      send(msg, options, fn) {
        this.sendPacket("message", msg, options, fn);
        return this;
      }

      /**
       * Sends a packet.
       *
       * @param {String} packet type.
       * @param {String} data.
       * @param {Object} options.
       * @param {Function} callback function.
       * @api private
       */
      sendPacket(type, data, options, fn) {
        if ("function" === typeof data) {
          fn = data;
          data = undefined;
        }

        if ("function" === typeof options) {
          fn = options;
          options = null;
        }

        if ("closing" === this.readyState || "closed" === this.readyState) {
          return;
        }

        options = options || {};
        options.compress = false !== options.compress;

        const packet = {
          type: type,
          data: data,
          options: options
        };
        this.emit("packetCreate", packet);
        this.writeBuffer.push(packet);
        if (fn) this.once("flush", fn);
        this.flush();
      }

      /**
       * Closes the connection.
       *
       * @api private
       */
      close() {
        const self = this;

        if ("opening" === this.readyState || "open" === this.readyState) {
          this.readyState = "closing";

          if (this.writeBuffer.length) {
            this.once("drain", function() {
              if (this.upgrading) {
                waitForUpgrade();
              } else {
                close();
              }
            });
          } else if (this.upgrading) {
            waitForUpgrade();
          } else {
            close();
          }
        }

        function close() {
          self.onClose("forced close");
          debug("socket closing - telling transport to close");
          self.transport.close();
        }

        function cleanupAndClose() {
          self.removeListener("upgrade", cleanupAndClose);
          self.removeListener("upgradeError", cleanupAndClose);
          close();
        }

        function waitForUpgrade() {
          // wait for upgrade to finish since we can't send packets while pausing a transport
          self.once("upgrade", cleanupAndClose);
          self.once("upgradeError", cleanupAndClose);
        }

        return this;
      }

      /**
       * Called upon transport error
       *
       * @api private
       */
      onError(err) {
        debug("socket error %j", err);
        Socket.priorWebsocketSuccess = false;
        this.emit("error", err);
        this.onClose("transport error", err);
      }

      /**
       * Called upon transport close.
       *
       * @api private
       */
      onClose(reason, desc) {
        if (
          "opening" === this.readyState ||
          "open" === this.readyState ||
          "closing" === this.readyState
        ) {
          debug('socket close with reason: "%s"', reason);
          const self = this;

          // clear timers
          clearTimeout(this.pingIntervalTimer);
          clearTimeout(this.pingTimeoutTimer);

          // stop event from firing again for transport
          this.transport.removeAllListeners("close");

          // ensure transport won't stay open
          this.transport.close();

          // ignore further transport communication
          this.transport.removeAllListeners();

          if (typeof removeEventListener === "function") {
            removeEventListener("offline", this.offlineEventListener, false);
          }

          // set ready state
          this.readyState = "closed";

          // clear session id
          this.id = null;

          // emit close event
          this.emit("close", reason, desc);

          // clean buffers after, so users can still
          // grab the buffers on `close` event
          self.writeBuffer = [];
          self.prevBufferLen = 0;
        }
      }

      /**
       * Filters upgrades, returning only those matching client transports.
       *
       * @param {Array} server upgrades
       * @api private
       *
       */
      filterUpgrades(upgrades) {
        const filteredUpgrades = [];
        let i = 0;
        const j = upgrades.length;
        for (; i < j; i++) {
          if (~this.transports.indexOf(upgrades[i]))
            filteredUpgrades.push(upgrades[i]);
        }
        return filteredUpgrades;
      }
    }

    Socket.priorWebsocketSuccess = false;

    /**
     * Protocol version.
     *
     * @api public
     */

    Socket.protocol = lib$1.protocol; // this is an int

    function clone(obj) {
      const o = {};
      for (let i in obj) {
        if (obj.hasOwnProperty(i)) {
          o[i] = obj[i];
        }
      }
      return o;
    }

    var socket$1 = Socket;

    var lib = (uri, opts) => new socket$1(uri, opts);

    /**
     * Expose deps for legacy compatibility
     * and standalone browser access.
     */

    var Socket_1 = socket$1;
    var protocol = socket$1.protocol; // this is an int
    var Transport = transport;
    var transports = transports$1;
    var parser = lib$1;
    lib.Socket = Socket_1;
    lib.protocol = protocol;
    lib.Transport = Transport;
    lib.transports = transports;
    lib.parser = parser;

    var isBinary_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.hasBinary = exports.isBinary = void 0;
    const withNativeArrayBuffer = typeof ArrayBuffer === "function";
    const isView = (obj) => {
        return typeof ArrayBuffer.isView === "function"
            ? ArrayBuffer.isView(obj)
            : obj.buffer instanceof ArrayBuffer;
    };
    const toString = Object.prototype.toString;
    const withNativeBlob = typeof Blob === "function" ||
        (typeof Blob !== "undefined" &&
            toString.call(Blob) === "[object BlobConstructor]");
    const withNativeFile = typeof File === "function" ||
        (typeof File !== "undefined" &&
            toString.call(File) === "[object FileConstructor]");
    /**
     * Returns true if obj is a Buffer, an ArrayBuffer, a Blob or a File.
     *
     * @private
     */
    function isBinary(obj) {
        return ((withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj))) ||
            (withNativeBlob && obj instanceof Blob) ||
            (withNativeFile && obj instanceof File));
    }
    exports.isBinary = isBinary;
    function hasBinary(obj, toJSON) {
        if (!obj || typeof obj !== "object") {
            return false;
        }
        if (Array.isArray(obj)) {
            for (let i = 0, l = obj.length; i < l; i++) {
                if (hasBinary(obj[i])) {
                    return true;
                }
            }
            return false;
        }
        if (isBinary(obj)) {
            return true;
        }
        if (obj.toJSON &&
            typeof obj.toJSON === "function" &&
            arguments.length === 1) {
            return hasBinary(obj.toJSON(), true);
        }
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
                return true;
            }
        }
        return false;
    }
    exports.hasBinary = hasBinary;
    });

    var binary = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.reconstructPacket = exports.deconstructPacket = void 0;

    /**
     * Replaces every Buffer | ArrayBuffer | Blob | File in packet with a numbered placeholder.
     *
     * @param {Object} packet - socket.io event packet
     * @return {Object} with deconstructed packet and list of buffers
     * @public
     */
    function deconstructPacket(packet) {
        const buffers = [];
        const packetData = packet.data;
        const pack = packet;
        pack.data = _deconstructPacket(packetData, buffers);
        pack.attachments = buffers.length; // number of binary 'attachments'
        return { packet: pack, buffers: buffers };
    }
    exports.deconstructPacket = deconstructPacket;
    function _deconstructPacket(data, buffers) {
        if (!data)
            return data;
        if (isBinary_1.isBinary(data)) {
            const placeholder = { _placeholder: true, num: buffers.length };
            buffers.push(data);
            return placeholder;
        }
        else if (Array.isArray(data)) {
            const newData = new Array(data.length);
            for (let i = 0; i < data.length; i++) {
                newData[i] = _deconstructPacket(data[i], buffers);
            }
            return newData;
        }
        else if (typeof data === "object" && !(data instanceof Date)) {
            const newData = {};
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    newData[key] = _deconstructPacket(data[key], buffers);
                }
            }
            return newData;
        }
        return data;
    }
    /**
     * Reconstructs a binary packet from its placeholder packet and buffers
     *
     * @param {Object} packet - event packet with placeholders
     * @param {Array} buffers - binary buffers to put in placeholder positions
     * @return {Object} reconstructed packet
     * @public
     */
    function reconstructPacket(packet, buffers) {
        packet.data = _reconstructPacket(packet.data, buffers);
        packet.attachments = undefined; // no longer useful
        return packet;
    }
    exports.reconstructPacket = reconstructPacket;
    function _reconstructPacket(data, buffers) {
        if (!data)
            return data;
        if (data && data._placeholder) {
            return buffers[data.num]; // appropriate buffer (should be natural order anyway)
        }
        else if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                data[i] = _reconstructPacket(data[i], buffers);
            }
        }
        else if (typeof data === "object") {
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    data[key] = _reconstructPacket(data[key], buffers);
                }
            }
        }
        return data;
    }
    });

    var dist = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Decoder = exports.Encoder = exports.PacketType = exports.protocol = void 0;



    const debug = browser("socket.io-parser");
    /**
     * Protocol version.
     *
     * @public
     */
    exports.protocol = 5;
    var PacketType;
    (function (PacketType) {
        PacketType[PacketType["CONNECT"] = 0] = "CONNECT";
        PacketType[PacketType["DISCONNECT"] = 1] = "DISCONNECT";
        PacketType[PacketType["EVENT"] = 2] = "EVENT";
        PacketType[PacketType["ACK"] = 3] = "ACK";
        PacketType[PacketType["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
        PacketType[PacketType["BINARY_EVENT"] = 5] = "BINARY_EVENT";
        PacketType[PacketType["BINARY_ACK"] = 6] = "BINARY_ACK";
    })(PacketType = exports.PacketType || (exports.PacketType = {}));
    /**
     * A socket.io Encoder instance
     */
    class Encoder {
        /**
         * Encode a packet as a single string if non-binary, or as a
         * buffer sequence, depending on packet type.
         *
         * @param {Object} obj - packet object
         */
        encode(obj) {
            debug("encoding packet %j", obj);
            if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
                if (isBinary_1.hasBinary(obj)) {
                    obj.type =
                        obj.type === PacketType.EVENT
                            ? PacketType.BINARY_EVENT
                            : PacketType.BINARY_ACK;
                    return this.encodeAsBinary(obj);
                }
            }
            return [this.encodeAsString(obj)];
        }
        /**
         * Encode packet as string.
         */
        encodeAsString(obj) {
            // first is type
            let str = "" + obj.type;
            // attachments if we have them
            if (obj.type === PacketType.BINARY_EVENT ||
                obj.type === PacketType.BINARY_ACK) {
                str += obj.attachments + "-";
            }
            // if we have a namespace other than `/`
            // we append it followed by a comma `,`
            if (obj.nsp && "/" !== obj.nsp) {
                str += obj.nsp + ",";
            }
            // immediately followed by the id
            if (null != obj.id) {
                str += obj.id;
            }
            // json data
            if (null != obj.data) {
                str += JSON.stringify(obj.data);
            }
            debug("encoded %j as %s", obj, str);
            return str;
        }
        /**
         * Encode packet as 'buffer sequence' by removing blobs, and
         * deconstructing packet into object with placeholders and
         * a list of buffers.
         */
        encodeAsBinary(obj) {
            const deconstruction = binary.deconstructPacket(obj);
            const pack = this.encodeAsString(deconstruction.packet);
            const buffers = deconstruction.buffers;
            buffers.unshift(pack); // add packet info to beginning of data list
            return buffers; // write all the buffers
        }
    }
    exports.Encoder = Encoder;
    /**
     * A socket.io Decoder instance
     *
     * @return {Object} decoder
     */
    class Decoder extends componentEmitter {
        constructor() {
            super();
        }
        /**
         * Decodes an encoded packet string into packet JSON.
         *
         * @param {String} obj - encoded packet
         */
        add(obj) {
            let packet;
            if (typeof obj === "string") {
                packet = this.decodeString(obj);
                if (packet.type === PacketType.BINARY_EVENT ||
                    packet.type === PacketType.BINARY_ACK) {
                    // binary packet's json
                    this.reconstructor = new BinaryReconstructor(packet);
                    // no attachments, labeled binary but no binary data to follow
                    if (packet.attachments === 0) {
                        super.emit("decoded", packet);
                    }
                }
                else {
                    // non-binary full packet
                    super.emit("decoded", packet);
                }
            }
            else if (isBinary_1.isBinary(obj) || obj.base64) {
                // raw binary data
                if (!this.reconstructor) {
                    throw new Error("got binary data when not reconstructing a packet");
                }
                else {
                    packet = this.reconstructor.takeBinaryData(obj);
                    if (packet) {
                        // received final buffer
                        this.reconstructor = null;
                        super.emit("decoded", packet);
                    }
                }
            }
            else {
                throw new Error("Unknown type: " + obj);
            }
        }
        /**
         * Decode a packet String (JSON data)
         *
         * @param {String} str
         * @return {Object} packet
         */
        decodeString(str) {
            let i = 0;
            // look up type
            const p = {
                type: Number(str.charAt(0)),
            };
            if (PacketType[p.type] === undefined) {
                throw new Error("unknown packet type " + p.type);
            }
            // look up attachments if type binary
            if (p.type === PacketType.BINARY_EVENT ||
                p.type === PacketType.BINARY_ACK) {
                const start = i + 1;
                while (str.charAt(++i) !== "-" && i != str.length) { }
                const buf = str.substring(start, i);
                if (buf != Number(buf) || str.charAt(i) !== "-") {
                    throw new Error("Illegal attachments");
                }
                p.attachments = Number(buf);
            }
            // look up namespace (if any)
            if ("/" === str.charAt(i + 1)) {
                const start = i + 1;
                while (++i) {
                    const c = str.charAt(i);
                    if ("," === c)
                        break;
                    if (i === str.length)
                        break;
                }
                p.nsp = str.substring(start, i);
            }
            else {
                p.nsp = "/";
            }
            // look up id
            const next = str.charAt(i + 1);
            if ("" !== next && Number(next) == next) {
                const start = i + 1;
                while (++i) {
                    const c = str.charAt(i);
                    if (null == c || Number(c) != c) {
                        --i;
                        break;
                    }
                    if (i === str.length)
                        break;
                }
                p.id = Number(str.substring(start, i + 1));
            }
            // look up json data
            if (str.charAt(++i)) {
                const payload = tryParse(str.substr(i));
                if (Decoder.isPayloadValid(p.type, payload)) {
                    p.data = payload;
                }
                else {
                    throw new Error("invalid payload");
                }
            }
            debug("decoded %s as %j", str, p);
            return p;
        }
        static isPayloadValid(type, payload) {
            switch (type) {
                case PacketType.CONNECT:
                    return typeof payload === "object";
                case PacketType.DISCONNECT:
                    return payload === undefined;
                case PacketType.CONNECT_ERROR:
                    return typeof payload === "string" || typeof payload === "object";
                case PacketType.EVENT:
                case PacketType.BINARY_EVENT:
                    return Array.isArray(payload) && payload.length > 0;
                case PacketType.ACK:
                case PacketType.BINARY_ACK:
                    return Array.isArray(payload);
            }
        }
        /**
         * Deallocates a parser's resources
         */
        destroy() {
            if (this.reconstructor) {
                this.reconstructor.finishedReconstruction();
            }
        }
    }
    exports.Decoder = Decoder;
    function tryParse(str) {
        try {
            return JSON.parse(str);
        }
        catch (e) {
            return false;
        }
    }
    /**
     * A manager of a binary event's 'buffer sequence'. Should
     * be constructed whenever a packet of type BINARY_EVENT is
     * decoded.
     *
     * @param {Object} packet
     * @return {BinaryReconstructor} initialized reconstructor
     */
    class BinaryReconstructor {
        constructor(packet) {
            this.packet = packet;
            this.buffers = [];
            this.reconPack = packet;
        }
        /**
         * Method to be called when binary data received from connection
         * after a BINARY_EVENT packet.
         *
         * @param {Buffer | ArrayBuffer} binData - the raw binary data received
         * @return {null | Object} returns null if more binary data is expected or
         *   a reconstructed packet object if all buffers have been received.
         */
        takeBinaryData(binData) {
            this.buffers.push(binData);
            if (this.buffers.length === this.reconPack.attachments) {
                // done with buffer list
                const packet = binary.reconstructPacket(this.reconPack, this.buffers);
                this.finishedReconstruction();
                return packet;
            }
            return null;
        }
        /**
         * Cleans up binary packet reconstruction variables.
         */
        finishedReconstruction() {
            this.reconPack = null;
            this.buffers = [];
        }
    }
    });

    var on_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.on = void 0;
    function on(obj, ev, fn) {
        obj.on(ev, fn);
        return function subDestroy() {
            obj.off(ev, fn);
        };
    }
    exports.on = on;
    });

    var typedEvents = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StrictEventEmitter = void 0;

    /**
     * Strictly typed version of an `EventEmitter`. A `TypedEventEmitter` takes type
     * parameters for mappings of event names to event data types, and strictly
     * types method calls to the `EventEmitter` according to these event maps.
     *
     * @typeParam ListenEvents - `EventsMap` of user-defined events that can be
     * listened to with `on` or `once`
     * @typeParam EmitEvents - `EventsMap` of user-defined events that can be
     * emitted with `emit`
     * @typeParam ReservedEvents - `EventsMap` of reserved events, that can be
     * emitted by socket.io with `emitReserved`, and can be listened to with
     * `listen`.
     */
    class StrictEventEmitter extends componentEmitter {
        /**
         * Adds the `listener` function as an event listener for `ev`.
         *
         * @param ev Name of the event
         * @param listener Callback function
         */
        on(ev, listener) {
            super.on(ev, listener);
            return this;
        }
        /**
         * Adds a one-time `listener` function as an event listener for `ev`.
         *
         * @param ev Name of the event
         * @param listener Callback function
         */
        once(ev, listener) {
            super.once(ev, listener);
            return this;
        }
        /**
         * Emits an event.
         *
         * @param ev Name of the event
         * @param args Values to send to listeners of this event
         */
        emit(ev, ...args) {
            super.emit(ev, ...args);
            return this;
        }
        /**
         * Emits a reserved event.
         *
         * This method is `protected`, so that only a class extending
         * `StrictEventEmitter` can emit its own reserved events.
         *
         * @param ev Reserved event name
         * @param args Arguments to emit along with the event
         */
        emitReserved(ev, ...args) {
            super.emit(ev, ...args);
            return this;
        }
        /**
         * Returns the listeners listening to an event.
         *
         * @param event Event name
         * @returns Array of listeners subscribed to `event`
         */
        listeners(event) {
            return super.listeners(event);
        }
    }
    exports.StrictEventEmitter = StrictEventEmitter;
    });

    var socket = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Socket = void 0;



    const debug = browser("socket.io-client:socket");
    /**
     * Internal events.
     * These events can't be emitted by the user.
     */
    const RESERVED_EVENTS = Object.freeze({
        connect: 1,
        connect_error: 1,
        disconnect: 1,
        disconnecting: 1,
        // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
        newListener: 1,
        removeListener: 1,
    });
    class Socket extends typedEvents.StrictEventEmitter {
        /**
         * `Socket` constructor.
         *
         * @public
         */
        constructor(io, nsp, opts) {
            super();
            this.receiveBuffer = [];
            this.sendBuffer = [];
            this.ids = 0;
            this.acks = {};
            this.flags = {};
            this.io = io;
            this.nsp = nsp;
            this.ids = 0;
            this.acks = {};
            this.receiveBuffer = [];
            this.sendBuffer = [];
            this.connected = false;
            this.disconnected = true;
            this.flags = {};
            if (opts && opts.auth) {
                this.auth = opts.auth;
            }
            if (this.io._autoConnect)
                this.open();
        }
        /**
         * Subscribe to open, close and packet events
         *
         * @private
         */
        subEvents() {
            if (this.subs)
                return;
            const io = this.io;
            this.subs = [
                on_1.on(io, "open", this.onopen.bind(this)),
                on_1.on(io, "packet", this.onpacket.bind(this)),
                on_1.on(io, "error", this.onerror.bind(this)),
                on_1.on(io, "close", this.onclose.bind(this)),
            ];
        }
        /**
         * Whether the Socket will try to reconnect when its Manager connects or reconnects
         */
        get active() {
            return !!this.subs;
        }
        /**
         * "Opens" the socket.
         *
         * @public
         */
        connect() {
            if (this.connected)
                return this;
            this.subEvents();
            if (!this.io["_reconnecting"])
                this.io.open(); // ensure open
            if ("open" === this.io._readyState)
                this.onopen();
            return this;
        }
        /**
         * Alias for connect()
         */
        open() {
            return this.connect();
        }
        /**
         * Sends a `message` event.
         *
         * @return self
         * @public
         */
        send(...args) {
            args.unshift("message");
            this.emit.apply(this, args);
            return this;
        }
        /**
         * Override `emit`.
         * If the event is in `events`, it's emitted normally.
         *
         * @return self
         * @public
         */
        emit(ev, ...args) {
            if (RESERVED_EVENTS.hasOwnProperty(ev)) {
                throw new Error('"' + ev + '" is a reserved event name');
            }
            args.unshift(ev);
            const packet = {
                type: dist.PacketType.EVENT,
                data: args,
            };
            packet.options = {};
            packet.options.compress = this.flags.compress !== false;
            // event ack callback
            if ("function" === typeof args[args.length - 1]) {
                debug("emitting packet with ack id %d", this.ids);
                this.acks[this.ids] = args.pop();
                packet.id = this.ids++;
            }
            const isTransportWritable = this.io.engine &&
                this.io.engine.transport &&
                this.io.engine.transport.writable;
            const discardPacket = this.flags.volatile && (!isTransportWritable || !this.connected);
            if (discardPacket) {
                debug("discard packet as the transport is not currently writable");
            }
            else if (this.connected) {
                this.packet(packet);
            }
            else {
                this.sendBuffer.push(packet);
            }
            this.flags = {};
            return this;
        }
        /**
         * Sends a packet.
         *
         * @param packet
         * @private
         */
        packet(packet) {
            packet.nsp = this.nsp;
            this.io._packet(packet);
        }
        /**
         * Called upon engine `open`.
         *
         * @private
         */
        onopen() {
            debug("transport is open - connecting");
            if (typeof this.auth == "function") {
                this.auth((data) => {
                    this.packet({ type: dist.PacketType.CONNECT, data });
                });
            }
            else {
                this.packet({ type: dist.PacketType.CONNECT, data: this.auth });
            }
        }
        /**
         * Called upon engine or manager `error`.
         *
         * @param err
         * @private
         */
        onerror(err) {
            if (!this.connected) {
                this.emitReserved("connect_error", err);
            }
        }
        /**
         * Called upon engine `close`.
         *
         * @param reason
         * @private
         */
        onclose(reason) {
            debug("close (%s)", reason);
            this.connected = false;
            this.disconnected = true;
            delete this.id;
            this.emitReserved("disconnect", reason);
        }
        /**
         * Called with socket packet.
         *
         * @param packet
         * @private
         */
        onpacket(packet) {
            const sameNamespace = packet.nsp === this.nsp;
            if (!sameNamespace)
                return;
            switch (packet.type) {
                case dist.PacketType.CONNECT:
                    if (packet.data && packet.data.sid) {
                        const id = packet.data.sid;
                        this.onconnect(id);
                    }
                    else {
                        this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
                    }
                    break;
                case dist.PacketType.EVENT:
                    this.onevent(packet);
                    break;
                case dist.PacketType.BINARY_EVENT:
                    this.onevent(packet);
                    break;
                case dist.PacketType.ACK:
                    this.onack(packet);
                    break;
                case dist.PacketType.BINARY_ACK:
                    this.onack(packet);
                    break;
                case dist.PacketType.DISCONNECT:
                    this.ondisconnect();
                    break;
                case dist.PacketType.CONNECT_ERROR:
                    const err = new Error(packet.data.message);
                    // @ts-ignore
                    err.data = packet.data.data;
                    this.emitReserved("connect_error", err);
                    break;
            }
        }
        /**
         * Called upon a server event.
         *
         * @param packet
         * @private
         */
        onevent(packet) {
            const args = packet.data || [];
            debug("emitting event %j", args);
            if (null != packet.id) {
                debug("attaching ack callback to event");
                args.push(this.ack(packet.id));
            }
            if (this.connected) {
                this.emitEvent(args);
            }
            else {
                this.receiveBuffer.push(Object.freeze(args));
            }
        }
        emitEvent(args) {
            if (this._anyListeners && this._anyListeners.length) {
                const listeners = this._anyListeners.slice();
                for (const listener of listeners) {
                    listener.apply(this, args);
                }
            }
            super.emit.apply(this, args);
        }
        /**
         * Produces an ack callback to emit with an event.
         *
         * @private
         */
        ack(id) {
            const self = this;
            let sent = false;
            return function (...args) {
                // prevent double callbacks
                if (sent)
                    return;
                sent = true;
                debug("sending ack %j", args);
                self.packet({
                    type: dist.PacketType.ACK,
                    id: id,
                    data: args,
                });
            };
        }
        /**
         * Called upon a server acknowlegement.
         *
         * @param packet
         * @private
         */
        onack(packet) {
            const ack = this.acks[packet.id];
            if ("function" === typeof ack) {
                debug("calling ack %s with %j", packet.id, packet.data);
                ack.apply(this, packet.data);
                delete this.acks[packet.id];
            }
            else {
                debug("bad ack %s", packet.id);
            }
        }
        /**
         * Called upon server connect.
         *
         * @private
         */
        onconnect(id) {
            debug("socket connected with id %s", id);
            this.id = id;
            this.connected = true;
            this.disconnected = false;
            this.emitReserved("connect");
            this.emitBuffered();
        }
        /**
         * Emit buffered events (received and emitted).
         *
         * @private
         */
        emitBuffered() {
            this.receiveBuffer.forEach((args) => this.emitEvent(args));
            this.receiveBuffer = [];
            this.sendBuffer.forEach((packet) => this.packet(packet));
            this.sendBuffer = [];
        }
        /**
         * Called upon server disconnect.
         *
         * @private
         */
        ondisconnect() {
            debug("server disconnect (%s)", this.nsp);
            this.destroy();
            this.onclose("io server disconnect");
        }
        /**
         * Called upon forced client/server side disconnections,
         * this method ensures the manager stops tracking us and
         * that reconnections don't get triggered for this.
         *
         * @private
         */
        destroy() {
            if (this.subs) {
                // clean subscriptions to avoid reconnections
                this.subs.forEach((subDestroy) => subDestroy());
                this.subs = undefined;
            }
            this.io["_destroy"](this);
        }
        /**
         * Disconnects the socket manually.
         *
         * @return self
         * @public
         */
        disconnect() {
            if (this.connected) {
                debug("performing disconnect (%s)", this.nsp);
                this.packet({ type: dist.PacketType.DISCONNECT });
            }
            // remove socket from pool
            this.destroy();
            if (this.connected) {
                // fire events
                this.onclose("io client disconnect");
            }
            return this;
        }
        /**
         * Alias for disconnect()
         *
         * @return self
         * @public
         */
        close() {
            return this.disconnect();
        }
        /**
         * Sets the compress flag.
         *
         * @param compress - if `true`, compresses the sending data
         * @return self
         * @public
         */
        compress(compress) {
            this.flags.compress = compress;
            return this;
        }
        /**
         * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
         * ready to send messages.
         *
         * @returns self
         * @public
         */
        get volatile() {
            this.flags.volatile = true;
            return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback.
         *
         * @param listener
         * @public
         */
        onAny(listener) {
            this._anyListeners = this._anyListeners || [];
            this._anyListeners.push(listener);
            return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback. The listener is added to the beginning of the listeners array.
         *
         * @param listener
         * @public
         */
        prependAny(listener) {
            this._anyListeners = this._anyListeners || [];
            this._anyListeners.unshift(listener);
            return this;
        }
        /**
         * Removes the listener that will be fired when any event is emitted.
         *
         * @param listener
         * @public
         */
        offAny(listener) {
            if (!this._anyListeners) {
                return this;
            }
            if (listener) {
                const listeners = this._anyListeners;
                for (let i = 0; i < listeners.length; i++) {
                    if (listener === listeners[i]) {
                        listeners.splice(i, 1);
                        return this;
                    }
                }
            }
            else {
                this._anyListeners = [];
            }
            return this;
        }
        /**
         * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
         * e.g. to remove listeners.
         *
         * @public
         */
        listenersAny() {
            return this._anyListeners || [];
        }
    }
    exports.Socket = Socket;
    });

    /**
     * Expose `Backoff`.
     */

    var backo2 = Backoff;

    /**
     * Initialize backoff timer with `opts`.
     *
     * - `min` initial timeout in milliseconds [100]
     * - `max` max timeout [10000]
     * - `jitter` [0]
     * - `factor` [2]
     *
     * @param {Object} opts
     * @api public
     */

    function Backoff(opts) {
      opts = opts || {};
      this.ms = opts.min || 100;
      this.max = opts.max || 10000;
      this.factor = opts.factor || 2;
      this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
      this.attempts = 0;
    }

    /**
     * Return the backoff duration.
     *
     * @return {Number}
     * @api public
     */

    Backoff.prototype.duration = function(){
      var ms = this.ms * Math.pow(this.factor, this.attempts++);
      if (this.jitter) {
        var rand =  Math.random();
        var deviation = Math.floor(rand * this.jitter * ms);
        ms = (Math.floor(rand * 10) & 1) == 0  ? ms - deviation : ms + deviation;
      }
      return Math.min(ms, this.max) | 0;
    };

    /**
     * Reset the number of attempts.
     *
     * @api public
     */

    Backoff.prototype.reset = function(){
      this.attempts = 0;
    };

    /**
     * Set the minimum duration
     *
     * @api public
     */

    Backoff.prototype.setMin = function(min){
      this.ms = min;
    };

    /**
     * Set the maximum duration
     *
     * @api public
     */

    Backoff.prototype.setMax = function(max){
      this.max = max;
    };

    /**
     * Set the jitter
     *
     * @api public
     */

    Backoff.prototype.setJitter = function(jitter){
      this.jitter = jitter;
    };

    var manager = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Manager = void 0;






    const debug = browser("socket.io-client:manager");
    class Manager extends typedEvents.StrictEventEmitter {
        constructor(uri, opts) {
            super();
            this.nsps = {};
            this.subs = [];
            if (uri && "object" === typeof uri) {
                opts = uri;
                uri = undefined;
            }
            opts = opts || {};
            opts.path = opts.path || "/socket.io";
            this.opts = opts;
            this.reconnection(opts.reconnection !== false);
            this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
            this.reconnectionDelay(opts.reconnectionDelay || 1000);
            this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
            this.randomizationFactor(opts.randomizationFactor || 0.5);
            this.backoff = new backo2({
                min: this.reconnectionDelay(),
                max: this.reconnectionDelayMax(),
                jitter: this.randomizationFactor(),
            });
            this.timeout(null == opts.timeout ? 20000 : opts.timeout);
            this._readyState = "closed";
            this.uri = uri;
            const _parser = opts.parser || dist;
            this.encoder = new _parser.Encoder();
            this.decoder = new _parser.Decoder();
            this._autoConnect = opts.autoConnect !== false;
            if (this._autoConnect)
                this.open();
        }
        reconnection(v) {
            if (!arguments.length)
                return this._reconnection;
            this._reconnection = !!v;
            return this;
        }
        reconnectionAttempts(v) {
            if (v === undefined)
                return this._reconnectionAttempts;
            this._reconnectionAttempts = v;
            return this;
        }
        reconnectionDelay(v) {
            var _a;
            if (v === undefined)
                return this._reconnectionDelay;
            this._reconnectionDelay = v;
            (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
            return this;
        }
        randomizationFactor(v) {
            var _a;
            if (v === undefined)
                return this._randomizationFactor;
            this._randomizationFactor = v;
            (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
            return this;
        }
        reconnectionDelayMax(v) {
            var _a;
            if (v === undefined)
                return this._reconnectionDelayMax;
            this._reconnectionDelayMax = v;
            (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
            return this;
        }
        timeout(v) {
            if (!arguments.length)
                return this._timeout;
            this._timeout = v;
            return this;
        }
        /**
         * Starts trying to reconnect if reconnection is enabled and we have not
         * started reconnecting yet
         *
         * @private
         */
        maybeReconnectOnOpen() {
            // Only try to reconnect if it's the first time we're connecting
            if (!this._reconnecting &&
                this._reconnection &&
                this.backoff.attempts === 0) {
                // keeps reconnection from firing twice for the same reconnection loop
                this.reconnect();
            }
        }
        /**
         * Sets the current transport `socket`.
         *
         * @param {Function} fn - optional, callback
         * @return self
         * @public
         */
        open(fn) {
            debug("readyState %s", this._readyState);
            if (~this._readyState.indexOf("open"))
                return this;
            debug("opening %s", this.uri);
            this.engine = lib(this.uri, this.opts);
            const socket = this.engine;
            const self = this;
            this._readyState = "opening";
            this.skipReconnect = false;
            // emit `open`
            const openSubDestroy = on_1.on(socket, "open", function () {
                self.onopen();
                fn && fn();
            });
            // emit `error`
            const errorSub = on_1.on(socket, "error", (err) => {
                debug("error");
                self.cleanup();
                self._readyState = "closed";
                this.emitReserved("error", err);
                if (fn) {
                    fn(err);
                }
                else {
                    // Only do this if there is no fn to handle the error
                    self.maybeReconnectOnOpen();
                }
            });
            if (false !== this._timeout) {
                const timeout = this._timeout;
                debug("connect attempt will timeout after %d", timeout);
                if (timeout === 0) {
                    openSubDestroy(); // prevents a race condition with the 'open' event
                }
                // set timer
                const timer = setTimeout(() => {
                    debug("connect attempt timed out after %d", timeout);
                    openSubDestroy();
                    socket.close();
                    socket.emit("error", new Error("timeout"));
                }, timeout);
                if (this.opts.autoUnref) {
                    timer.unref();
                }
                this.subs.push(function subDestroy() {
                    clearTimeout(timer);
                });
            }
            this.subs.push(openSubDestroy);
            this.subs.push(errorSub);
            return this;
        }
        /**
         * Alias for open()
         *
         * @return self
         * @public
         */
        connect(fn) {
            return this.open(fn);
        }
        /**
         * Called upon transport open.
         *
         * @private
         */
        onopen() {
            debug("open");
            // clear old subs
            this.cleanup();
            // mark as open
            this._readyState = "open";
            this.emitReserved("open");
            // add new subs
            const socket = this.engine;
            this.subs.push(on_1.on(socket, "ping", this.onping.bind(this)), on_1.on(socket, "data", this.ondata.bind(this)), on_1.on(socket, "error", this.onerror.bind(this)), on_1.on(socket, "close", this.onclose.bind(this)), on_1.on(this.decoder, "decoded", this.ondecoded.bind(this)));
        }
        /**
         * Called upon a ping.
         *
         * @private
         */
        onping() {
            this.emitReserved("ping");
        }
        /**
         * Called with data.
         *
         * @private
         */
        ondata(data) {
            this.decoder.add(data);
        }
        /**
         * Called when parser fully decodes a packet.
         *
         * @private
         */
        ondecoded(packet) {
            this.emitReserved("packet", packet);
        }
        /**
         * Called upon socket error.
         *
         * @private
         */
        onerror(err) {
            debug("error", err);
            this.emitReserved("error", err);
        }
        /**
         * Creates a new socket for the given `nsp`.
         *
         * @return {Socket}
         * @public
         */
        socket(nsp, opts) {
            let socket$1 = this.nsps[nsp];
            if (!socket$1) {
                socket$1 = new socket.Socket(this, nsp, opts);
                this.nsps[nsp] = socket$1;
            }
            return socket$1;
        }
        /**
         * Called upon a socket close.
         *
         * @param socket
         * @private
         */
        _destroy(socket) {
            const nsps = Object.keys(this.nsps);
            for (const nsp of nsps) {
                const socket = this.nsps[nsp];
                if (socket.active) {
                    debug("socket %s is still active, skipping close", nsp);
                    return;
                }
            }
            this._close();
        }
        /**
         * Writes a packet.
         *
         * @param packet
         * @private
         */
        _packet(packet) {
            debug("writing packet %j", packet);
            const encodedPackets = this.encoder.encode(packet);
            for (let i = 0; i < encodedPackets.length; i++) {
                this.engine.write(encodedPackets[i], packet.options);
            }
        }
        /**
         * Clean up transport subscriptions and packet buffer.
         *
         * @private
         */
        cleanup() {
            debug("cleanup");
            this.subs.forEach((subDestroy) => subDestroy());
            this.subs.length = 0;
            this.decoder.destroy();
        }
        /**
         * Close the current socket.
         *
         * @private
         */
        _close() {
            debug("disconnect");
            this.skipReconnect = true;
            this._reconnecting = false;
            if ("opening" === this._readyState) {
                // `onclose` will not fire because
                // an open event never happened
                this.cleanup();
            }
            this.backoff.reset();
            this._readyState = "closed";
            if (this.engine)
                this.engine.close();
        }
        /**
         * Alias for close()
         *
         * @private
         */
        disconnect() {
            return this._close();
        }
        /**
         * Called upon engine close.
         *
         * @private
         */
        onclose(reason) {
            debug("onclose");
            this.cleanup();
            this.backoff.reset();
            this._readyState = "closed";
            this.emitReserved("close", reason);
            if (this._reconnection && !this.skipReconnect) {
                this.reconnect();
            }
        }
        /**
         * Attempt a reconnection.
         *
         * @private
         */
        reconnect() {
            if (this._reconnecting || this.skipReconnect)
                return this;
            const self = this;
            if (this.backoff.attempts >= this._reconnectionAttempts) {
                debug("reconnect failed");
                this.backoff.reset();
                this.emitReserved("reconnect_failed");
                this._reconnecting = false;
            }
            else {
                const delay = this.backoff.duration();
                debug("will wait %dms before reconnect attempt", delay);
                this._reconnecting = true;
                const timer = setTimeout(() => {
                    if (self.skipReconnect)
                        return;
                    debug("attempting reconnect");
                    this.emitReserved("reconnect_attempt", self.backoff.attempts);
                    // check again for the case socket closed in above events
                    if (self.skipReconnect)
                        return;
                    self.open((err) => {
                        if (err) {
                            debug("reconnect attempt error");
                            self._reconnecting = false;
                            self.reconnect();
                            this.emitReserved("reconnect_error", err);
                        }
                        else {
                            debug("reconnect success");
                            self.onreconnect();
                        }
                    });
                }, delay);
                if (this.opts.autoUnref) {
                    timer.unref();
                }
                this.subs.push(function subDestroy() {
                    clearTimeout(timer);
                });
            }
        }
        /**
         * Called upon successful reconnect.
         *
         * @private
         */
        onreconnect() {
            const attempt = this.backoff.attempts;
            this._reconnecting = false;
            this.backoff.reset();
            this.emitReserved("reconnect", attempt);
        }
    }
    exports.Manager = Manager;
    });

    var build = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Socket = exports.io = exports.Manager = exports.protocol = void 0;



    Object.defineProperty(exports, "Socket", { enumerable: true, get: function () { return socket.Socket; } });
    const debug = browser("socket.io-client");
    /**
     * Module exports.
     */
    module.exports = exports = lookup;
    /**
     * Managers cache.
     */
    const cache = (exports.managers = {});
    function lookup(uri, opts) {
        if (typeof uri === "object") {
            opts = uri;
            uri = undefined;
        }
        opts = opts || {};
        const parsed = url_1.url(uri, opts.path);
        const source = parsed.source;
        const id = parsed.id;
        const path = parsed.path;
        const sameNamespace = cache[id] && path in cache[id]["nsps"];
        const newConnection = opts.forceNew ||
            opts["force new connection"] ||
            false === opts.multiplex ||
            sameNamespace;
        let io;
        if (newConnection) {
            debug("ignoring socket cache for %s", source);
            io = new manager.Manager(source, opts);
        }
        else {
            if (!cache[id]) {
                debug("new io instance for %s", source);
                cache[id] = new manager.Manager(source, opts);
            }
            io = cache[id];
        }
        if (parsed.query && !opts.query) {
            opts.query = parsed.queryKey;
        }
        return io.socket(parsed.path, opts);
    }
    exports.io = lookup;
    /**
     * Protocol version.
     *
     * @public
     */

    Object.defineProperty(exports, "protocol", { enumerable: true, get: function () { return dist.protocol; } });
    /**
     * `connect`.
     *
     * @param {String} uri
     * @public
     */
    exports.connect = lookup;
    /**
     * Expose constructors for standalone build.
     *
     * @public
     */
    var manager_2 = manager;
    Object.defineProperty(exports, "Manager", { enumerable: true, get: function () { return manager_2.Manager; } });
    exports.default = lookup;
    });

    var io = /*@__PURE__*/getDefaultExportFromCjs(build);

    io.Manager;

    /* src/components/WalletConnect.svelte generated by Svelte v3.37.0 */
    const file$b = "src/components/WalletConnect.svelte";

    // (127:12) {:else}
    function create_else_block$4(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "svelte-1ovrybi");
    			add_location(input, file$b, 127, 14, 3940);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			if (!mounted) {
    				dispose = listen_dev(input, "click", /*click_handler_1*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(127:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (125:12) {#if (walletConnected)}
    function create_if_block$5(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "checkbox");
    			input.checked = true;
    			attr_dev(input, "class", "svelte-1ovrybi");
    			add_location(input, file$b, 125, 14, 3841);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			if (!mounted) {
    				dispose = listen_dev(input, "click", /*click_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(125:12) {#if (walletConnected)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div1;
    	let div0;
    	let label;
    	let t0;
    	let span0;
    	let t2;
    	let span1;
    	let t4;
    	let span2;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*walletConnected*/ ctx[1]) return create_if_block$5;
    		return create_else_block$4;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			label = element("label");
    			if_block.c();
    			t0 = space();
    			span0 = element("span");
    			span0.textContent = "On";
    			t2 = space();
    			span1 = element("span");
    			span1.textContent = "Off";
    			t4 = space();
    			span2 = element("span");
    			attr_dev(span0, "class", "switch-left svelte-1ovrybi");
    			add_location(span0, file$b, 129, 12, 4027);
    			attr_dev(span1, "class", "switch-right svelte-1ovrybi");
    			add_location(span1, file$b, 130, 12, 4075);
    			attr_dev(label, "class", "rocker svelte-1ovrybi");
    			add_location(label, file$b, 123, 8, 3768);
    			attr_dev(div0, "class", "wallet-switch svelte-1ovrybi");
    			add_location(div0, file$b, 122, 4, 3732);
    			attr_dev(span2, "id", "refreshBalance");
    			attr_dev(span2, "class", "svelte-1ovrybi");
    			add_location(span2, file$b, 133, 4, 4145);
    			attr_dev(div1, "class", "wallet-switch-wrapper svelte-1ovrybi");
    			add_location(div1, file$b, 121, 0, 3692);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, label);
    			if_block.m(label, null);
    			append_dev(label, t0);
    			append_dev(label, span0);
    			append_dev(label, t2);
    			append_dev(label, span1);
    			append_dev(div1, t4);
    			append_dev(div1, span2);

    			if (!mounted) {
    				dispose = listen_dev(span2, "click", /*click_handler_2*/ ctx[8], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(label, t0);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function initiateApproval$1() {
    	const detail = JSON.stringify({
    		contractName: "currency",
    		methodName: "approve",
    		networkType: "mainnet",
    		kwargs: {
    			amount: 999999999, // amount of TAU to approve
    			to: "con_future_games_slots"
    		},
    		stampLimit: 100, //Max stamps to be used. Could use less, won't use more.
    		
    	});

    	document.dispatchEvent(new CustomEvent("lamdenWalletSendTx", { detail }));

    	document.addEventListener("lamdenWalletTxStatus", response => {
    		if (response.detail.status === "error") ; else if (response.detail.data.status == "Transaction Cancelled") ; else {
    			if (response.detail.data.resultInfo.title && response.detail.data.resultInfo.title == "Transaction Successful") {
    				localStorage.setItem("approval", "true"); //Handle Errors///
    			}
    		}
    	});
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("WalletConnect", slots, []);
    	let { tauBalance } = $$props;
    	let { network } = $$props;
    	let { wallet } = $$props;

    	function initiateSocketConnection(wallet) {
    		const socket = io();

    		socket.on("initialize", function (data) {
    			let websocket_id = data;
    			localStorage.setItem("websocket_id", websocket_id);
    			let playerInfo = { wallet, id: websocket_id };
    			socket.emit("register", playerInfo);
    		});
    	}

    	async function getBalance(wallet) {
    		let balance;

    		await network.API.getCurrencyBalance(wallet).then(function (result) {
    			balance = parseInt(result.c[0]);

    			if (balance > 10000000000) {
    				balance = 0;
    			}
    		});

    		return balance;
    	}

    	const detail = JSON.stringify({
    		appName: "A Chance At The Moon",
    		version: "1.0.0",
    		logo: "/half-moon.svg", //or whatever the location of your logo
    		contractName: "con_future_games_slots",
    		networkType: "mainnet", // other option is 'mainnet'
    		
    	});

    	let walletConnected;

    	function connectWallet() {
    		if (walletConnected) {
    			$$invalidate(1, walletConnected = false);
    			$$invalidate(4, tauBalance = undefined);
    		} else {
    			document.dispatchEvent(new CustomEvent("lamdenWalletConnect", { detail }));

    			document.addEventListener("lamdenWalletInfo", response => {
    				if (response.detail.errors && response.detail.errors[0] == "User rejected connection request") {
    					document.getElementById("on-off").click();
    				}

    				if (response.detail.approvals) ; else if (response.detail.data && response.detail.data.status == "Transaction Cancelled") {
    					/**
                         * Do something to 
                         * **/
    					document.getElementById("on-off").click();
    				}

    				if (response.detail.errors && response.detail.errors.length > 0) {
    					//Respond to Errors
    					if (document.getElementById("on-off")) {
    						document.getElementById("on-off").click();
    					}

    					if (response.detail.errors[0] == "Wallet is Locked") {
    						//Prompt user to unlock wallet
    						$$invalidate(4, tauBalance = "Wallet Locked");
    					}
    				} else {
    					//Get user's account address
    					let playerWallet = response.detail.wallets[0];

    					$$invalidate(0, wallet = response.detail.wallets[0]);
    					initiateSocketConnection(wallet);

    					getBalance(playerWallet).then(async function (result) {
    						$$invalidate(4, tauBalance = await result);
    						$$invalidate(1, walletConnected = true);
    					});

    					localStorage.setItem("wallet", response.detail.wallets[0]);
    				}
    			});
    		}
    	}

    	const writable_props = ["tauBalance", "network", "wallet"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<WalletConnect> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => connectWallet();
    	const click_handler_1 = () => connectWallet();
    	const click_handler_2 = () => getBalance(wallet);

    	$$self.$$set = $$props => {
    		if ("tauBalance" in $$props) $$invalidate(4, tauBalance = $$props.tauBalance);
    		if ("network" in $$props) $$invalidate(5, network = $$props.network);
    		if ("wallet" in $$props) $$invalidate(0, wallet = $$props.wallet);
    	};

    	$$self.$capture_state = () => ({
    		io,
    		host,
    		tauBalance,
    		network,
    		wallet,
    		initiateApproval: initiateApproval$1,
    		initiateSocketConnection,
    		getBalance,
    		detail,
    		walletConnected,
    		connectWallet
    	});

    	$$self.$inject_state = $$props => {
    		if ("tauBalance" in $$props) $$invalidate(4, tauBalance = $$props.tauBalance);
    		if ("network" in $$props) $$invalidate(5, network = $$props.network);
    		if ("wallet" in $$props) $$invalidate(0, wallet = $$props.wallet);
    		if ("walletConnected" in $$props) $$invalidate(1, walletConnected = $$props.walletConnected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		wallet,
    		walletConnected,
    		getBalance,
    		connectWallet,
    		tauBalance,
    		network,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class WalletConnect extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { tauBalance: 4, network: 5, wallet: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WalletConnect",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*tauBalance*/ ctx[4] === undefined && !("tauBalance" in props)) {
    			console.warn("<WalletConnect> was created without expected prop 'tauBalance'");
    		}

    		if (/*network*/ ctx[5] === undefined && !("network" in props)) {
    			console.warn("<WalletConnect> was created without expected prop 'network'");
    		}

    		if (/*wallet*/ ctx[0] === undefined && !("wallet" in props)) {
    			console.warn("<WalletConnect> was created without expected prop 'wallet'");
    		}
    	}

    	get tauBalance() {
    		throw new Error("<WalletConnect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tauBalance(value) {
    		throw new Error("<WalletConnect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get network() {
    		throw new Error("<WalletConnect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set network(value) {
    		throw new Error("<WalletConnect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get wallet() {
    		throw new Error("<WalletConnect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set wallet(value) {
    		throw new Error("<WalletConnect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Screw.svelte generated by Svelte v3.37.0 */

    const file$a = "src/components/Screw.svelte";

    function create_fragment$a(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "indent svelte-1f91vc1");
    			add_location(div0, file$a, 4, 19, 40);
    			attr_dev(div1, "class", "screw svelte-1f91vc1");
    			add_location(div1, file$a, 4, 0, 21);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Screw", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Screw> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Screw extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Screw",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/components/HelpMenu.svelte generated by Svelte v3.37.0 */

    const file$9 = "src/components/HelpMenu.svelte";

    function create_fragment$9(ctx) {
    	let div29;
    	let div28;
    	let div0;
    	let t0;
    	let div27;
    	let div1;
    	let t1;
    	let span0;
    	let t3;
    	let t4;
    	let div4;
    	let div2;
    	let t6;
    	let div3;
    	let t8;
    	let div7;
    	let div5;
    	let t10;
    	let div6;
    	let t12;
    	let div10;
    	let div8;
    	let t14;
    	let div9;
    	let t16;
    	let div13;
    	let div11;
    	let t18;
    	let div12;
    	let t19;
    	let a;
    	let t21;
    	let div16;
    	let div14;
    	let t23;
    	let div15;
    	let t25;
    	let div19;
    	let div17;
    	let t27;
    	let div18;
    	let t29;
    	let div22;
    	let div20;
    	let t31;
    	let div21;
    	let t33;
    	let div25;
    	let div23;
    	let t35;
    	let div24;
    	let t37;
    	let div26;
    	let t38;
    	let span1;
    	let t40;

    	const block = {
    		c: function create() {
    			div29 = element("div");
    			div28 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div27 = element("div");
    			div1 = element("div");
    			t1 = text("FAQ (");
    			span0 = element("span");
    			span0.textContent = "Press A to exit";
    			t3 = text(")");
    			t4 = space();
    			div4 = element("div");
    			div2 = element("div");
    			div2.textContent = "What is A Chance At The Moon?";
    			t6 = space();
    			div3 = element("div");
    			div3.textContent = "-> A Chance At The Moon is a slot machine game built using a combination of Svelte & Node.JS, backed by the Lamden Blockchain";
    			t8 = space();
    			div7 = element("div");
    			div5 = element("div");
    			div5.textContent = "What does it mean when the display says \"Connect Wallet\"?";
    			t10 = space();
    			div6 = element("div");
    			div6.textContent = "-> To play A Chance At The Moon, the player must have installed the Lamden Wallet and have a balance of at least 42-44 TAU to cover the transcaction. If these requirements are satisfied please press the On switch located on the bottom left";
    			t12 = space();
    			div10 = element("div");
    			div8 = element("div");
    			div8.textContent = "What does it mean when the display says \"Wallet Locked\"?";
    			t14 = space();
    			div9 = element("div");
    			div9.textContent = "-> The player must unlock the wallet and reload the application. Once this is done, press the on swich and get started";
    			t16 = space();
    			div13 = element("div");
    			div11 = element("div");
    			div11.textContent = "Where can I download the Lamden Wallet?";
    			t18 = space();
    			div12 = element("div");
    			t19 = text("-> The wallet can be found on the Google Chrome Store or ");
    			a = element("a");
    			a.textContent = "https://lamden.io";
    			t21 = space();
    			div16 = element("div");
    			div14 = element("div");
    			div14.textContent = "How much does it cost to play?";
    			t23 = space();
    			div15 = element("div");
    			div15.textContent = "-> Each spin will cost 40 TAU before fees, which may come out to be between 1-3 TAU.";
    			t25 = space();
    			div19 = element("div");
    			div17 = element("div");
    			div17.textContent = "How are the odds determined?";
    			t27 = space();
    			div18 = element("div");
    			div18.textContent = "-> The odds are based on random chance, generated via the con_slot_machine smart contract on the Lamden Blockchain";
    			t29 = space();
    			div22 = element("div");
    			div20 = element("div");
    			div20.textContent = "Do I have to bet anything for practice mode?";
    			t31 = space();
    			div21 = element("div");
    			div21.textContent = "-> NO! Practice mode is completely free to try. Have a spin, it's on the house ;)";
    			t33 = space();
    			div25 = element("div");
    			div23 = element("div");
    			div23.textContent = "Where can I get more information on Lamden?";
    			t35 = space();
    			div24 = element("div");
    			div24.textContent = "-> This can be found by visiting the Discord server or the official Lamden Telegram. Join the ever-growing community now!";
    			t37 = space();
    			div26 = element("div");
    			t38 = text("(");
    			span1 = element("span");
    			span1.textContent = "Press A to exit....";
    			t40 = text(")");
    			attr_dev(div0, "class", "scanline");
    			add_location(div0, file$9, 8, 8, 194);
    			set_style(span0, "color", "#78FF00");
    			add_location(span0, file$9, 12, 21, 379);
    			set_style(div1, "margin-top", "-.25rem");
    			add_location(div1, file$9, 11, 12, 324);
    			attr_dev(div2, "class", "question svelte-togbvg");
    			add_location(div2, file$9, 15, 16, 509);
    			set_style(div3, "margin-top", ".25rem");
    			add_location(div3, file$9, 18, 16, 621);
    			set_style(div4, "margin-top", "1rem");
    			add_location(div4, file$9, 14, 12, 462);
    			attr_dev(div5, "class", "question svelte-togbvg");
    			add_location(div5, file$9, 23, 16, 901);
    			set_style(div6, "margin-top", ".25rem");
    			add_location(div6, file$9, 26, 16, 1041);
    			set_style(div7, "margin-top", "1rem");
    			add_location(div7, file$9, 22, 12, 854);
    			attr_dev(div8, "class", "question svelte-togbvg");
    			add_location(div8, file$9, 32, 16, 1436);
    			set_style(div9, "margin-top", ".25rem");
    			add_location(div9, file$9, 35, 16, 1575);
    			set_style(div10, "margin-top", "1rem");
    			add_location(div10, file$9, 31, 12, 1389);
    			attr_dev(div11, "class", "question svelte-togbvg");
    			add_location(div11, file$9, 41, 16, 1849);
    			attr_dev(a, "href", "https://lamden.io/en/");
    			set_style(a, "color", "rgb(85, 244, 255)");
    			add_location(a, file$9, 45, 77, 2081);
    			set_style(div12, "margin-top", ".25rem");
    			add_location(div12, file$9, 44, 16, 1971);
    			set_style(div13, "margin-top", "1rem");
    			add_location(div13, file$9, 40, 12, 1802);
    			attr_dev(div14, "class", "question svelte-togbvg");
    			add_location(div14, file$9, 49, 16, 2268);
    			set_style(div15, "margin-top", ".25rem");
    			add_location(div15, file$9, 52, 16, 2381);
    			set_style(div16, "margin-top", "1rem");
    			add_location(div16, file$9, 48, 12, 2221);
    			attr_dev(div17, "class", "question svelte-togbvg");
    			add_location(div17, file$9, 57, 16, 2620);
    			set_style(div18, "margin-top", ".25rem");
    			add_location(div18, file$9, 60, 16, 2731);
    			set_style(div19, "margin-top", "1rem");
    			add_location(div19, file$9, 56, 12, 2573);
    			attr_dev(div20, "class", "question svelte-togbvg");
    			add_location(div20, file$9, 66, 16, 3001);
    			set_style(div21, "margin-top", ".25rem");
    			add_location(div21, file$9, 69, 16, 3128);
    			set_style(div22, "margin-top", "1rem");
    			add_location(div22, file$9, 65, 12, 2954);
    			attr_dev(div23, "class", "question svelte-togbvg");
    			add_location(div23, file$9, 74, 16, 3364);
    			set_style(div24, "margin-top", ".25rem");
    			add_location(div24, file$9, 77, 16, 3490);
    			set_style(div25, "margin-top", "1rem");
    			add_location(div25, file$9, 73, 12, 3317);
    			set_style(span1, "color", "#78FF00");
    			add_location(span1, file$9, 82, 17, 3784);
    			set_style(div26, "margin-top", "1rem");
    			set_style(div26, "text-align", "center");
    			add_location(div26, file$9, 81, 12, 3719);
    			attr_dev(div27, "class", "terminal svelte-togbvg");
    			set_style(div27, "color", "white");
    			add_location(div27, file$9, 10, 8, 269);
    			attr_dev(div28, "id", "crt");
    			attr_dev(div28, "class", "off svelte-togbvg");
    			attr_dev(div28, "onclick", "handleClick(event)");
    			add_location(div28, file$9, 6, 4, 89);
    			attr_dev(div29, "id", "faq");
    			add_location(div29, file$9, 4, 0, 21);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div29, anchor);
    			append_dev(div29, div28);
    			append_dev(div28, div0);
    			append_dev(div28, t0);
    			append_dev(div28, div27);
    			append_dev(div27, div1);
    			append_dev(div1, t1);
    			append_dev(div1, span0);
    			append_dev(div1, t3);
    			append_dev(div27, t4);
    			append_dev(div27, div4);
    			append_dev(div4, div2);
    			append_dev(div4, t6);
    			append_dev(div4, div3);
    			append_dev(div27, t8);
    			append_dev(div27, div7);
    			append_dev(div7, div5);
    			append_dev(div7, t10);
    			append_dev(div7, div6);
    			append_dev(div27, t12);
    			append_dev(div27, div10);
    			append_dev(div10, div8);
    			append_dev(div10, t14);
    			append_dev(div10, div9);
    			append_dev(div27, t16);
    			append_dev(div27, div13);
    			append_dev(div13, div11);
    			append_dev(div13, t18);
    			append_dev(div13, div12);
    			append_dev(div12, t19);
    			append_dev(div12, a);
    			append_dev(div27, t21);
    			append_dev(div27, div16);
    			append_dev(div16, div14);
    			append_dev(div16, t23);
    			append_dev(div16, div15);
    			append_dev(div27, t25);
    			append_dev(div27, div19);
    			append_dev(div19, div17);
    			append_dev(div19, t27);
    			append_dev(div19, div18);
    			append_dev(div27, t29);
    			append_dev(div27, div22);
    			append_dev(div22, div20);
    			append_dev(div22, t31);
    			append_dev(div22, div21);
    			append_dev(div27, t33);
    			append_dev(div27, div25);
    			append_dev(div25, div23);
    			append_dev(div25, t35);
    			append_dev(div25, div24);
    			append_dev(div27, t37);
    			append_dev(div27, div26);
    			append_dev(div26, t38);
    			append_dev(div26, span1);
    			append_dev(div26, t40);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div29);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("HelpMenu", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<HelpMenu> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class HelpMenu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HelpMenu",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/components/ConfirmTransaction.svelte generated by Svelte v3.37.0 */

    const file$8 = "src/components/ConfirmTransaction.svelte";

    // (36:12) {:else}
    function create_else_block$3(ctx) {
    	let div0;
    	let t1;
    	let div1;
    	let span;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div0.textContent = "Wallet connected.";
    			t1 = space();
    			div1 = element("div");
    			span = element("span");
    			span.textContent = "Press A to continue";
    			add_location(div0, file$8, 36, 12, 1235);
    			set_style(span, "color", "#78FF00");
    			add_location(span, file$8, 40, 16, 1329);
    			add_location(div1, file$8, 39, 12, 1307);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, span);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(36:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (32:42) 
    function create_if_block_3$1(ctx) {
    	let div;
    	let span;
    	let t0;
    	let br;
    	let t1;
    	let t2_value = 42 - /*walletStatus*/ ctx[0] + "";
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text("Not enough funds to play! ");
    			br = element("br");
    			t1 = text(" Please add more ");
    			t2 = text(t2_value);
    			t3 = text(" Tau to continue");
    			add_location(br, file$8, 33, 58, 1119);
    			attr_dev(span, "class", "error svelte-6qc49s");
    			add_location(span, file$8, 33, 12, 1073);
    			add_location(div, file$8, 32, 12, 1055);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(span, br);
    			append_dev(span, t1);
    			append_dev(span, t2);
    			append_dev(span, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*walletStatus*/ 1 && t2_value !== (t2_value = 42 - /*walletStatus*/ ctx[0] + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(32:42) ",
    		ctx
    	});

    	return block;
    }

    // (28:56) 
    function create_if_block_2$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Please connect your wallet to continue";
    			add_location(div, file$8, 28, 12, 920);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(28:56) ",
    		ctx
    	});

    	return block;
    }

    // (21:55) 
    function create_if_block_1$2(ctx) {
    	let div0;
    	let t1;
    	let div1;
    	let span;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div0.textContent = "Please approve spending";
    			t1 = space();
    			div1 = element("div");
    			span = element("span");
    			span.textContent = "Press A to continue";
    			add_location(div0, file$8, 21, 12, 678);
    			set_style(span, "color", "#78FF00");
    			add_location(span, file$8, 25, 16, 777);
    			add_location(div1, file$8, 24, 12, 755);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, span);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(21:55) ",
    		ctx
    	});

    	return block;
    }

    // (17:12) {#if (typeof walletStatus == 'undefined')}
    function create_if_block$4(ctx) {
    	let div;
    	let span;
    	let t0;
    	let br;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text("Please connect your wallet ");
    			br = element("br");
    			t1 = text(" to continue");
    			add_location(br, file$8, 18, 63, 566);
    			attr_dev(span, "class", "error svelte-6qc49s");
    			add_location(span, file$8, 18, 16, 519);
    			add_location(div, file$8, 17, 12, 497);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(span, br);
    			append_dev(span, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(17:12) {#if (typeof walletStatus == 'undefined')}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let t;
    	let div1;

    	function select_block_type(ctx, dirty) {
    		if (typeof /*walletStatus*/ ctx[0] == "undefined") return create_if_block$4;
    		if (/*walletStatus*/ ctx[0] == "not approved") return create_if_block_1$2;
    		if (/*walletStatus*/ ctx[0] == "Wallet Locked") return create_if_block_2$1;
    		if (/*walletStatus*/ ctx[0] < 42) return create_if_block_3$1;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			t = space();
    			div1 = element("div");
    			if_block.c();
    			attr_dev(div0, "class", "scanline");
    			add_location(div0, file$8, 12, 8, 278);
    			attr_dev(div1, "class", "terminal svelte-6qc49s");
    			set_style(div1, "color", "white");
    			set_style(div1, "font-size", "2rem");
    			set_style(div1, "text-align", "center");
    			add_location(div1, file$8, 14, 8, 353);
    			attr_dev(div2, "id", "crt");
    			attr_dev(div2, "class", "off svelte-6qc49s");
    			attr_dev(div2, "onclick", "handleClick(event)");
    			add_location(div2, file$8, 10, 4, 173);
    			attr_dev(div3, "id", "bezel");
    			add_location(div3, file$8, 8, 0, 104);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t);
    			append_dev(div2, div1);
    			if_block.m(div1, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ConfirmTransaction", slots, []);
    	let { walletStatus } = $$props;
    	let approved = localStorage.getItem("approval");
    	const writable_props = ["walletStatus"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ConfirmTransaction> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("walletStatus" in $$props) $$invalidate(0, walletStatus = $$props.walletStatus);
    	};

    	$$self.$capture_state = () => ({ walletStatus, approved });

    	$$self.$inject_state = $$props => {
    		if ("walletStatus" in $$props) $$invalidate(0, walletStatus = $$props.walletStatus);
    		if ("approved" in $$props) approved = $$props.approved;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [walletStatus];
    }

    class ConfirmTransaction extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { walletStatus: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ConfirmTransaction",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*walletStatus*/ ctx[0] === undefined && !("walletStatus" in props)) {
    			console.warn("<ConfirmTransaction> was created without expected prop 'walletStatus'");
    		}
    	}

    	get walletStatus() {
    		throw new Error("<ConfirmTransaction>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set walletStatus(value) {
    		throw new Error("<ConfirmTransaction>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Error.svelte generated by Svelte v3.37.0 */

    const { Error: Error_1$1 } = globals;
    const file$7 = "src/components/Error.svelte";

    function create_fragment$7(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let t0;
    	let div2;
    	let div1;
    	let span;
    	let t1;
    	let br;
    	let t2;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			span = element("span");
    			t1 = text("Transaction Failed ");
    			br = element("br");
    			t2 = text(" Please try again later");
    			attr_dev(div0, "class", "scanline");
    			add_location(div0, file$7, 8, 8, 195);
    			add_location(br, file$7, 12, 55, 419);
    			attr_dev(span, "class", "error svelte-6qc49s");
    			add_location(span, file$7, 12, 16, 380);
    			add_location(div1, file$7, 11, 12, 358);
    			attr_dev(div2, "class", "terminal svelte-6qc49s");
    			set_style(div2, "color", "white");
    			set_style(div2, "font-size", "2rem");
    			set_style(div2, "text-align", "center");
    			add_location(div2, file$7, 10, 8, 270);
    			attr_dev(div3, "id", "crt");
    			attr_dev(div3, "class", "off svelte-6qc49s");
    			attr_dev(div3, "onclick", "handleClick(event)");
    			add_location(div3, file$7, 6, 4, 90);
    			attr_dev(div4, "id", "bezel");
    			add_location(div4, file$7, 4, 0, 21);
    		},
    		l: function claim(nodes) {
    			throw new Error_1$1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, span);
    			append_dev(span, t1);
    			append_dev(span, br);
    			append_dev(span, t2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Error", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Error> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Error$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Error",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/components/Loading.svelte generated by Svelte v3.37.0 */

    const file$6 = "src/components/Loading.svelte";

    // (77:3) {:else}
    function create_else_block$2(ctx) {
    	let div;
    	let span;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			span.textContent = "Please begin a game to view transactions";
    			attr_dev(span, "class", "error svelte-18vd2i3");
    			add_location(span, file$6, 78, 16, 2310);
    			attr_dev(div, "class", "svelte-18vd2i3");
    			add_location(div, file$6, 77, 3, 2288);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(77:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (55:3) {#if (transactionStatus)}
    function create_if_block$3(ctx) {
    	let div0;
    	let t0;
    	let span0;
    	let t1;
    	let t2;
    	let div1;
    	let t3;
    	let span1;
    	let t4_value = /*transactionTime*/ ctx[1].toFixed(3) + "";
    	let t4;
    	let t5;
    	let t6;
    	let div2;
    	let t7;
    	let span2;
    	let t8;
    	let t9;
    	let div3;
    	let t10;
    	let a0;
    	let t11;
    	let t12;
    	let div4;
    	let t13;
    	let a1;
    	let t15;
    	let div5;
    	let t16;
    	let span3;
    	let t18;
    	let div6;
    	let span4;
    	let span5;
    	let span6;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text("Transaction Status: ");
    			span0 = element("span");
    			t1 = text(/*transactionStatus*/ ctx[0]);
    			t2 = space();
    			div1 = element("div");
    			t3 = text("Transaction Completed in ");
    			span1 = element("span");
    			t4 = text(t4_value);
    			t5 = text(" seconds");
    			t6 = space();
    			div2 = element("div");
    			t7 = text("Stamps used: ");
    			span2 = element("span");
    			t8 = text(/*stampsUsed*/ ctx[2]);
    			t9 = space();
    			div3 = element("div");
    			t10 = text("Buy Txn: ");
    			a0 = element("a");
    			t11 = text(/*txHash*/ ctx[3]);
    			t12 = space();
    			div4 = element("div");
    			t13 = text("Game Txn: ");
    			a1 = element("a");
    			a1.textContent = `${setResultTxn()}`;
    			t15 = space();
    			div5 = element("div");
    			t16 = text("Score: ");
    			span3 = element("span");
    			span3.textContent = `${setScore()}`;
    			t18 = space();
    			div6 = element("div");
    			span4 = element("span");
    			span4.textContent = "(";
    			span5 = element("span");
    			span5.textContent = "Press A to start";
    			span6 = element("span");
    			span6.textContent = ")";
    			set_style(span0, "color", "#78FF00");
    			attr_dev(span0, "class", "svelte-18vd2i3");
    			add_location(span0, file$6, 56, 36, 1203);
    			attr_dev(div0, "class", "svelte-18vd2i3");
    			add_location(div0, file$6, 55, 3, 1161);
    			set_style(span1, "color", "white");
    			attr_dev(span1, "class", "svelte-18vd2i3");
    			add_location(span1, file$6, 59, 41, 1336);
    			attr_dev(div1, "class", "svelte-18vd2i3");
    			add_location(div1, file$6, 58, 12, 1289);
    			set_style(span2, "color", "#ec1111");
    			attr_dev(span2, "class", "svelte-18vd2i3");
    			add_location(span2, file$6, 62, 29, 1472);
    			attr_dev(div2, "class", "svelte-18vd2i3");
    			add_location(div2, file$6, 61, 12, 1437);
    			set_style(a0, "color", "rgb(85, 244, 255)");
    			set_style(a0, "font-size", "small");
    			attr_dev(a0, "href", "#");
    			attr_dev(a0, "class", "svelte-18vd2i3");
    			add_location(a0, file$6, 65, 25, 1582);
    			attr_dev(div3, "class", "svelte-18vd2i3");
    			add_location(div3, file$6, 64, 12, 1551);
    			attr_dev(a1, "id", "result-txn");
    			set_style(a1, "color", "rgb(85, 244, 255)");
    			set_style(a1, "font-size", "small");
    			attr_dev(a1, "href", "#");
    			attr_dev(a1, "class", "svelte-18vd2i3");
    			add_location(a1, file$6, 68, 14, 1778);
    			attr_dev(div4, "class", "svelte-18vd2i3");
    			add_location(div4, file$6, 67, 3, 1758);
    			set_style(span3, "color", "white");
    			attr_dev(span3, "class", "svelte-18vd2i3");
    			add_location(span3, file$6, 71, 11, 2003);
    			attr_dev(div5, "class", "svelte-18vd2i3");
    			add_location(div5, file$6, 70, 3, 1986);
    			set_style(span4, "color", "white");
    			attr_dev(span4, "class", "svelte-18vd2i3");
    			add_location(span4, file$6, 74, 16, 2144);
    			set_style(span5, "color", "#78FF00");
    			attr_dev(span5, "class", "svelte-18vd2i3");
    			add_location(span5, file$6, 74, 50, 2178);
    			set_style(span6, "color", "white");
    			attr_dev(span6, "class", "svelte-18vd2i3");
    			add_location(span6, file$6, 74, 101, 2229);
    			set_style(div6, "margin-top", "1rem");
    			set_style(div6, "text-align", "center");
    			attr_dev(div6, "class", "svelte-18vd2i3");
    			add_location(div6, file$6, 73, 12, 2080);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			append_dev(div0, span0);
    			append_dev(span0, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t3);
    			append_dev(div1, span1);
    			append_dev(span1, t4);
    			append_dev(div1, t5);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, t7);
    			append_dev(div2, span2);
    			append_dev(span2, t8);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, t10);
    			append_dev(div3, a0);
    			append_dev(a0, t11);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, t13);
    			append_dev(div4, a1);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, t16);
    			append_dev(div5, span3);
    			insert_dev(target, t18, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, span4);
    			append_dev(div6, span5);
    			append_dev(div6, span6);

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", /*click_handler*/ ctx[4], false, false, false),
    					listen_dev(a1, "click", /*click_handler_1*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*transactionStatus*/ 1) set_data_dev(t1, /*transactionStatus*/ ctx[0]);
    			if (dirty & /*transactionTime*/ 2 && t4_value !== (t4_value = /*transactionTime*/ ctx[1].toFixed(3) + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*stampsUsed*/ 4) set_data_dev(t8, /*stampsUsed*/ ctx[2]);
    			if (dirty & /*txHash*/ 8) set_data_dev(t11, /*txHash*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(div5);
    			if (detaching) detach_dev(t18);
    			if (detaching) detach_dev(div6);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(55:3) {#if (transactionStatus)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let html;
    	let body;
    	let div20;
    	let div4;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let t2;
    	let div3;
    	let t3;
    	let div9;
    	let div5;
    	let t4;
    	let div6;
    	let t5;
    	let div7;
    	let t6;
    	let div8;
    	let t7;
    	let div14;
    	let div10;
    	let t8;
    	let div11;
    	let t9;
    	let div12;
    	let t10;
    	let div13;
    	let t11;
    	let div19;
    	let div15;
    	let t12;
    	let div16;
    	let t13;
    	let div17;
    	let t14;
    	let div18;
    	let t15;
    	let div21;

    	function select_block_type(ctx, dirty) {
    		if (/*transactionStatus*/ ctx[0]) return create_if_block$3;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			html = element("html");
    			body = element("body");
    			div20 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			t2 = space();
    			div3 = element("div");
    			t3 = space();
    			div9 = element("div");
    			div5 = element("div");
    			t4 = space();
    			div6 = element("div");
    			t5 = space();
    			div7 = element("div");
    			t6 = space();
    			div8 = element("div");
    			t7 = space();
    			div14 = element("div");
    			div10 = element("div");
    			t8 = space();
    			div11 = element("div");
    			t9 = space();
    			div12 = element("div");
    			t10 = space();
    			div13 = element("div");
    			t11 = space();
    			div19 = element("div");
    			div15 = element("div");
    			t12 = space();
    			div16 = element("div");
    			t13 = space();
    			div17 = element("div");
    			t14 = space();
    			div18 = element("div");
    			t15 = space();
    			div21 = element("div");
    			if_block.c();
    			attr_dev(div0, "class", "svelte-18vd2i3");
    			add_location(div0, file$6, 27, 16, 474);
    			attr_dev(div1, "class", "svelte-18vd2i3");
    			add_location(div1, file$6, 28, 16, 502);
    			attr_dev(div2, "class", "svelte-18vd2i3");
    			add_location(div2, file$6, 29, 16, 530);
    			attr_dev(div3, "class", "svelte-18vd2i3");
    			add_location(div3, file$6, 30, 16, 558);
    			attr_dev(div4, "class", "box svelte-18vd2i3");
    			add_location(div4, file$6, 26, 12, 440);
    			attr_dev(div5, "class", "svelte-18vd2i3");
    			add_location(div5, file$6, 33, 16, 635);
    			attr_dev(div6, "class", "svelte-18vd2i3");
    			add_location(div6, file$6, 34, 16, 663);
    			attr_dev(div7, "class", "svelte-18vd2i3");
    			add_location(div7, file$6, 35, 16, 691);
    			attr_dev(div8, "class", "svelte-18vd2i3");
    			add_location(div8, file$6, 36, 16, 719);
    			attr_dev(div9, "class", "box svelte-18vd2i3");
    			add_location(div9, file$6, 32, 12, 601);
    			attr_dev(div10, "class", "svelte-18vd2i3");
    			add_location(div10, file$6, 39, 16, 796);
    			attr_dev(div11, "class", "svelte-18vd2i3");
    			add_location(div11, file$6, 40, 16, 824);
    			attr_dev(div12, "class", "svelte-18vd2i3");
    			add_location(div12, file$6, 41, 16, 852);
    			attr_dev(div13, "class", "svelte-18vd2i3");
    			add_location(div13, file$6, 42, 16, 880);
    			attr_dev(div14, "class", "box svelte-18vd2i3");
    			add_location(div14, file$6, 38, 12, 762);
    			attr_dev(div15, "class", "svelte-18vd2i3");
    			add_location(div15, file$6, 45, 16, 957);
    			attr_dev(div16, "class", "svelte-18vd2i3");
    			add_location(div16, file$6, 46, 16, 985);
    			attr_dev(div17, "class", "svelte-18vd2i3");
    			add_location(div17, file$6, 47, 16, 1013);
    			attr_dev(div18, "class", "svelte-18vd2i3");
    			add_location(div18, file$6, 48, 16, 1041);
    			attr_dev(div19, "class", "box svelte-18vd2i3");
    			add_location(div19, file$6, 44, 12, 923);
    			attr_dev(div20, "class", "boxes svelte-18vd2i3");
    			add_location(div20, file$6, 25, 8, 408);
    			set_style(div21, "margin-left", "2rem");
    			attr_dev(div21, "class", "svelte-18vd2i3");
    			add_location(div21, file$6, 52, 8, 1096);
    			attr_dev(body, "class", "svelte-18vd2i3");
    			add_location(body, file$6, 24, 4, 393);
    			attr_dev(html, "class", "svelte-18vd2i3");
    			add_location(html, file$6, 23, 0, 382);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, html, anchor);
    			append_dev(html, body);
    			append_dev(body, div20);
    			append_dev(div20, div4);
    			append_dev(div4, div0);
    			append_dev(div4, t0);
    			append_dev(div4, div1);
    			append_dev(div4, t1);
    			append_dev(div4, div2);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			append_dev(div20, t3);
    			append_dev(div20, div9);
    			append_dev(div9, div5);
    			append_dev(div9, t4);
    			append_dev(div9, div6);
    			append_dev(div9, t5);
    			append_dev(div9, div7);
    			append_dev(div9, t6);
    			append_dev(div9, div8);
    			append_dev(div20, t7);
    			append_dev(div20, div14);
    			append_dev(div14, div10);
    			append_dev(div14, t8);
    			append_dev(div14, div11);
    			append_dev(div14, t9);
    			append_dev(div14, div12);
    			append_dev(div14, t10);
    			append_dev(div14, div13);
    			append_dev(div20, t11);
    			append_dev(div20, div19);
    			append_dev(div19, div15);
    			append_dev(div19, t12);
    			append_dev(div19, div16);
    			append_dev(div19, t13);
    			append_dev(div19, div17);
    			append_dev(div19, t14);
    			append_dev(div19, div18);
    			append_dev(body, t15);
    			append_dev(body, div21);
    			if_block.m(div21, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div21, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function NewTab(link) {
    	window.open(link, "_blank");
    }

    function setResultTxn() {
    	return localStorage.getItem("result-txn");
    }

    function setScore() {
    	return localStorage.getItem("score");
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Loading", slots, []);
    	let { transactionStatus } = $$props;
    	let { transactionTime = 0 } = $$props;
    	let { stampsUsed } = $$props;
    	let { txHash = "" } = $$props;
    	const writable_props = ["transactionStatus", "transactionTime", "stampsUsed", "txHash"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Loading> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => NewTab("https://mainnet.lamden.io/transactions/" + txHash.toLowerCase());
    	const click_handler_1 = () => NewTab("https://mainnet.lamden.io/transactions/" + setResultTxn().toLowerCase());

    	$$self.$$set = $$props => {
    		if ("transactionStatus" in $$props) $$invalidate(0, transactionStatus = $$props.transactionStatus);
    		if ("transactionTime" in $$props) $$invalidate(1, transactionTime = $$props.transactionTime);
    		if ("stampsUsed" in $$props) $$invalidate(2, stampsUsed = $$props.stampsUsed);
    		if ("txHash" in $$props) $$invalidate(3, txHash = $$props.txHash);
    	};

    	$$self.$capture_state = () => ({
    		transactionStatus,
    		transactionTime,
    		stampsUsed,
    		txHash,
    		NewTab,
    		setResultTxn,
    		setScore
    	});

    	$$self.$inject_state = $$props => {
    		if ("transactionStatus" in $$props) $$invalidate(0, transactionStatus = $$props.transactionStatus);
    		if ("transactionTime" in $$props) $$invalidate(1, transactionTime = $$props.transactionTime);
    		if ("stampsUsed" in $$props) $$invalidate(2, stampsUsed = $$props.stampsUsed);
    		if ("txHash" in $$props) $$invalidate(3, txHash = $$props.txHash);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		transactionStatus,
    		transactionTime,
    		stampsUsed,
    		txHash,
    		click_handler,
    		click_handler_1
    	];
    }

    class Loading extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			transactionStatus: 0,
    			transactionTime: 1,
    			stampsUsed: 2,
    			txHash: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Loading",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*transactionStatus*/ ctx[0] === undefined && !("transactionStatus" in props)) {
    			console.warn("<Loading> was created without expected prop 'transactionStatus'");
    		}

    		if (/*stampsUsed*/ ctx[2] === undefined && !("stampsUsed" in props)) {
    			console.warn("<Loading> was created without expected prop 'stampsUsed'");
    		}
    	}

    	get transactionStatus() {
    		throw new Error("<Loading>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transactionStatus(value) {
    		throw new Error("<Loading>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transactionTime() {
    		throw new Error("<Loading>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transactionTime(value) {
    		throw new Error("<Loading>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get stampsUsed() {
    		throw new Error("<Loading>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stampsUsed(value) {
    		throw new Error("<Loading>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get txHash() {
    		throw new Error("<Loading>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set txHash(value) {
    		throw new Error("<Loading>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Console.svelte generated by Svelte v3.37.0 */

    const { Error: Error_1 } = globals;
    const file$5 = "src/components/Console.svelte";

    // (295:57) 
    function create_if_block_8(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1_value = /*currentDisplay*/ ctx[5].toUpperCase() + "";
    	let t1;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			t1 = text(t1_value);
    			set_style(div0, "background-color", "red");
    			set_style(div0, "border-radius", "9999px");
    			set_style(div0, "width", ".5rem");
    			set_style(div0, "height", ".5rem");
    			set_style(div0, "float", "left");
    			set_style(div0, "margin-top", ".14rem");
    			set_style(div0, "margin-right", ".25rem");
    			add_location(div0, file$5, 296, 24, 9912);
    			add_location(div1, file$5, 295, 20, 9882);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div1, t0);
    			append_dev(div1, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*currentDisplay*/ 32 && t1_value !== (t1_value = /*currentDisplay*/ ctx[5].toUpperCase() + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(295:57) ",
    		ctx
    	});

    	return block;
    }

    // (290:20) {#if (currentDisplay == 'practice')}
    function create_if_block_7(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1_value = /*currentDisplay*/ ctx[5].toUpperCase() + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = text(" MODE");
    			set_style(div0, "background-color", "#1c162f");
    			set_style(div0, "border-radius", "9999px");
    			set_style(div0, "width", ".5rem");
    			set_style(div0, "height", ".5rem");
    			set_style(div0, "float", "left");
    			set_style(div0, "margin-top", ".1rem");
    			set_style(div0, "margin-right", ".25rem");
    			add_location(div0, file$5, 291, 24, 9581);
    			add_location(div1, file$5, 290, 20, 9551);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div1, t0);
    			append_dev(div1, t1);
    			append_dev(div1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*currentDisplay*/ 32 && t1_value !== (t1_value = /*currentDisplay*/ ctx[5].toUpperCase() + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(290:20) {#if (currentDisplay == 'practice')}",
    		ctx
    	});

    	return block;
    }

    // (340:24) {#if (practiceSlotLoaded)}
    function create_if_block_6(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "id", "practice-slot-live");
    			add_location(span, file$5, 340, 28, 13057);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(340:24) {#if (practiceSlotLoaded)}",
    		ctx
    	});

    	return block;
    }

    // (344:24) {#if (liveSlotLoaded)}
    function create_if_block_5(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "id", "slot-live");
    			add_location(span, file$5, 344, 28, 13221);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(344:24) {#if (liveSlotLoaded)}",
    		ctx
    	});

    	return block;
    }

    // (363:64) 
    function create_if_block_4(ctx) {
    	let div;
    	let loading;
    	let current;

    	loading = new Loading({
    			props: {
    				transactionStatus: /*transactionStatus*/ ctx[2],
    				transactionTime: /*transactionTime*/ ctx[1],
    				stampsUsed: /*stampsUsed*/ ctx[3],
    				txHash: /*txHash*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(loading.$$.fragment);
    			attr_dev(div, "class", "bet-menu svelte-pzjb6g");
    			add_location(div, file$5, 363, 28, 14216);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(loading, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const loading_changes = {};
    			if (dirty[0] & /*transactionStatus*/ 4) loading_changes.transactionStatus = /*transactionStatus*/ ctx[2];
    			if (dirty[0] & /*transactionTime*/ 2) loading_changes.transactionTime = /*transactionTime*/ ctx[1];
    			if (dirty[0] & /*stampsUsed*/ 8) loading_changes.stampsUsed = /*stampsUsed*/ ctx[3];
    			if (dirty[0] & /*txHash*/ 16) loading_changes.txHash = /*txHash*/ ctx[4];
    			loading.$set(loading_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loading.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loading.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(loading);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(363:64) ",
    		ctx
    	});

    	return block;
    }

    // (359:62) 
    function create_if_block_3(ctx) {
    	let div;
    	let error;
    	let current;
    	error = new Error$1({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(error.$$.fragment);
    			attr_dev(div, "class", "bet-menu svelte-pzjb6g");
    			add_location(div, file$5, 359, 28, 14023);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(error, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(error.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(error.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(error);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(359:62) ",
    		ctx
    	});

    	return block;
    }

    // (355:64) 
    function create_if_block_2(ctx) {
    	let div;
    	let confirmtransaction;
    	let current;

    	confirmtransaction = new ConfirmTransaction({
    			props: { walletStatus: /*walletStatus*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(confirmtransaction.$$.fragment);
    			attr_dev(div, "class", "bet-menu svelte-pzjb6g");
    			add_location(div, file$5, 355, 28, 13795);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(confirmtransaction, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const confirmtransaction_changes = {};
    			if (dirty[0] & /*walletStatus*/ 1) confirmtransaction_changes.walletStatus = /*walletStatus*/ ctx[0];
    			confirmtransaction.$set(confirmtransaction_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(confirmtransaction.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(confirmtransaction.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(confirmtransaction);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(355:64) ",
    		ctx
    	});

    	return block;
    }

    // (351:69) 
    function create_if_block_1$1(ctx) {
    	let div;
    	let confirmtransaction;
    	let current;

    	confirmtransaction = new ConfirmTransaction({
    			props: { walletStatus: "not approved" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(confirmtransaction.$$.fragment);
    			attr_dev(div, "class", "bet-menu svelte-pzjb6g");
    			add_location(div, file$5, 351, 24, 13567);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(confirmtransaction, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(confirmtransaction.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(confirmtransaction.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(confirmtransaction);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(351:69) ",
    		ctx
    	});

    	return block;
    }

    // (347:24) {#if (currentDisplay == 'info')}
    function create_if_block$2(ctx) {
    	let div;
    	let helpmenu;
    	let current;
    	helpmenu = new HelpMenu({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(helpmenu.$$.fragment);
    			attr_dev(div, "class", "help-menu svelte-pzjb6g");
    			add_location(div, file$5, 347, 28, 13360);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(helpmenu, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(helpmenu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(helpmenu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(helpmenu);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(347:24) {#if (currentDisplay == 'info')}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div28;
    	let div25;
    	let div24;
    	let div23;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div20;
    	let div18;
    	let div9;
    	let div8;
    	let div7;
    	let div2;
    	let div2_style_value;
    	let t2;
    	let div3;
    	let div3_style_value;
    	let t3;
    	let div4;
    	let div4_style_value;
    	let t4;
    	let div5;
    	let div5_style_value;
    	let t5;
    	let div6;
    	let div6_style_value;
    	let div7_style_value;
    	let div8_style_value;
    	let div9_style_value;
    	let t6;
    	let span0;
    	let t7;
    	let div17;
    	let div16;
    	let div15;
    	let div10;
    	let div10_style_value;
    	let t8;
    	let div11;
    	let div11_style_value;
    	let t9;
    	let div12;
    	let div12_style_value;
    	let t10;
    	let div13;
    	let div13_style_value;
    	let t11;
    	let div14;
    	let div14_style_value;
    	let div15_style_value;
    	let div17_style_value;
    	let t12;
    	let span1;
    	let t13;
    	let span2;
    	let t14;
    	let script;
    	let script_src_value;
    	let t15;
    	let span3;
    	let t16;
    	let span4;
    	let t17;
    	let div19;
    	let t18;
    	let t19;
    	let current_block_type_index;
    	let if_block3;
    	let t20;
    	let div21;
    	let t21;
    	let div22;
    	let t22;
    	let div27;
    	let div26;
    	let span5;
    	let t24;
    	let span6;
    	let t26;
    	let span7;
    	let t28;
    	let span8;
    	let t30;
    	let span9;
    	let img;
    	let img_src_value;
    	let t31;
    	let span10;
    	let t32;
    	let span11;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*currentDisplay*/ ctx[5] == "practice") return create_if_block_7;
    		if (/*currentDisplay*/ ctx[5] == "live") return create_if_block_8;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type && current_block_type(ctx);
    	let if_block1 = /*practiceSlotLoaded*/ ctx[7] && create_if_block_6(ctx);
    	let if_block2 = /*liveSlotLoaded*/ ctx[6] && create_if_block_5(ctx);

    	const if_block_creators = [
    		create_if_block$2,
    		create_if_block_1$1,
    		create_if_block_2,
    		create_if_block_3,
    		create_if_block_4
    	];

    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*currentDisplay*/ ctx[5] == "info") return 0;
    		if (/*currentDisplay*/ ctx[5] == "not approved") return 1;
    		if (/*currentDisplay*/ ctx[5] == "confirm") return 2;
    		if (/*currentDisplay*/ ctx[5] == "error") return 3;
    		if (/*currentDisplay*/ ctx[5] == "loading") return 4;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type_1(ctx))) {
    		if_block3 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			div28 = element("div");
    			div25 = element("div");
    			div24 = element("div");
    			div23 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div20 = element("div");
    			div18 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div2 = element("div");
    			t2 = space();
    			div3 = element("div");
    			t3 = space();
    			div4 = element("div");
    			t4 = space();
    			div5 = element("div");
    			t5 = space();
    			div6 = element("div");
    			t6 = space();
    			span0 = element("span");
    			t7 = space();
    			div17 = element("div");
    			div16 = element("div");
    			div15 = element("div");
    			div10 = element("div");
    			t8 = space();
    			div11 = element("div");
    			t9 = space();
    			div12 = element("div");
    			t10 = space();
    			div13 = element("div");
    			t11 = space();
    			div14 = element("div");
    			t12 = space();
    			span1 = element("span");
    			t13 = space();
    			span2 = element("span");
    			t14 = space();
    			script = element("script");
    			t15 = space();
    			span3 = element("span");
    			t16 = space();
    			span4 = element("span");
    			t17 = space();
    			div19 = element("div");
    			if (if_block1) if_block1.c();
    			t18 = space();
    			if (if_block2) if_block2.c();
    			t19 = space();
    			if (if_block3) if_block3.c();
    			t20 = space();
    			div21 = element("div");
    			t21 = space();
    			div22 = element("div");
    			t22 = space();
    			div27 = element("div");
    			div26 = element("div");
    			span5 = element("span");
    			span5.textContent = "Practice";
    			t24 = space();
    			span6 = element("span");
    			span6.textContent = `${/*spinButton*/ ctx[11]}`;
    			t26 = space();
    			span7 = element("span");
    			span7.textContent = "A";
    			t28 = space();
    			span8 = element("span");
    			span8.textContent = "?";
    			t30 = space();
    			span9 = element("span");
    			img = element("img");
    			t31 = space();
    			span10 = element("span");
    			t32 = space();
    			span11 = element("span");
    			set_style(div0, "position", "absolute");
    			set_style(div0, "left", "0");
    			set_style(div0, "margin-left", "1.5rem");
    			set_style(div0, "margin-top", ".4rem");
    			set_style(div0, "font-weight", "700");
    			set_style(div0, "color", "white");
    			set_style(div0, "font-size", "x-small");
    			add_location(div0, file$5, 288, 16, 9348);
    			set_style(div1, "position", "absolute");
    			set_style(div1, "right", "0");
    			set_style(div1, "transform", "rotate(90deg)");
    			add_location(div1, file$5, 301, 16, 10192);
    			attr_dev(div2, "style", div2_style_value = isVisible("practice", /*currentDisplay*/ ctx[5]));
    			attr_dev(div2, "class", "practice-reel");
    			add_location(div2, file$5, 309, 40, 10741);
    			attr_dev(div3, "style", div3_style_value = isVisible("practice", /*currentDisplay*/ ctx[5]));
    			attr_dev(div3, "class", "practice-reel");
    			add_location(div3, file$5, 310, 40, 10861);
    			attr_dev(div4, "style", div4_style_value = isVisible("practice", /*currentDisplay*/ ctx[5]));
    			attr_dev(div4, "class", "practice-reel");
    			add_location(div4, file$5, 311, 40, 10981);
    			attr_dev(div5, "style", div5_style_value = isVisible("practice", /*currentDisplay*/ ctx[5]));
    			attr_dev(div5, "class", "practice-reel");
    			add_location(div5, file$5, 312, 40, 11101);
    			attr_dev(div6, "style", div6_style_value = isVisible("practice", /*currentDisplay*/ ctx[5]));
    			attr_dev(div6, "class", "practice-reel");
    			add_location(div6, file$5, 313, 40, 11221);
    			attr_dev(div7, "style", div7_style_value = isVisible("practice", /*currentDisplay*/ ctx[5]));
    			attr_dev(div7, "id", "reels");
    			add_location(div7, file$5, 308, 36, 10637);
    			attr_dev(div8, "style", div8_style_value = isVisible("practice", /*currentDisplay*/ ctx[5]));
    			attr_dev(div8, "class", "slot-machine");
    			add_location(div8, file$5, 307, 32, 10527);
    			attr_dev(div9, "style", div9_style_value = isVisible("practice", /*currentDisplay*/ ctx[5]));
    			attr_dev(div9, "id", "practice-slot");
    			add_location(div9, file$5, 306, 28, 10424);
    			set_style(span0, "display", "none");
    			attr_dev(span0, "id", "reset-practice-slot");
    			add_location(span0, file$5, 317, 28, 11451);
    			attr_dev(div10, "style", div10_style_value = isVisible("live", /*currentDisplay*/ ctx[5]));
    			attr_dev(div10, "class", "reel");
    			add_location(div10, file$5, 321, 36, 11782);
    			attr_dev(div11, "style", div11_style_value = isVisible("live", /*currentDisplay*/ ctx[5]));
    			attr_dev(div11, "class", "reel");
    			add_location(div11, file$5, 322, 36, 11885);
    			attr_dev(div12, "style", div12_style_value = isVisible("live", /*currentDisplay*/ ctx[5]));
    			attr_dev(div12, "class", "reel");
    			add_location(div12, file$5, 323, 36, 11988);
    			attr_dev(div13, "style", div13_style_value = isVisible("live", /*currentDisplay*/ ctx[5]));
    			attr_dev(div13, "class", "reel");
    			add_location(div13, file$5, 324, 36, 12091);
    			attr_dev(div14, "style", div14_style_value = isVisible("live", /*currentDisplay*/ ctx[5]));
    			attr_dev(div14, "class", "reel");
    			add_location(div14, file$5, 325, 36, 12194);
    			attr_dev(div15, "style", div15_style_value = isVisible("live", /*currentDisplay*/ ctx[5]));
    			attr_dev(div15, "id", "reels");
    			add_location(div15, file$5, 320, 36, 11687);
    			attr_dev(div16, "class", "slot-machine");
    			add_location(div16, file$5, 319, 32, 11624);
    			attr_dev(div17, "style", div17_style_value = isVisible("live", /*currentDisplay*/ ctx[5]));
    			attr_dev(div17, "id", "slot");
    			add_location(div17, file$5, 318, 28, 11534);
    			set_style(span1, "display", "none");
    			attr_dev(span1, "id", "slot-not-spun");
    			add_location(span1, file$5, 329, 28, 12411);
    			set_style(span2, "display", "none");
    			attr_dev(span2, "id", "reset-slot");
    			add_location(span2, file$5, 330, 28, 12488);
    			attr_dev(script, "crossorigin", "anonymous");
    			if (script.src !== (script_src_value = "https://polyfill.io/v3/polyfill.min.js?features=default%2CWebAnimations")) attr_dev(script, "src", script_src_value);
    			add_location(script, file$5, 331, 28, 12562);
    			attr_dev(span3, "id", "spin-not-bought");
    			set_style(span3, "display", "none");
    			add_location(span3, file$5, 335, 24, 12791);
    			attr_dev(span4, "id", "load-slot");
    			set_style(span4, "display", "none");
    			add_location(span4, file$5, 336, 24, 12866);
    			attr_dev(div18, "class", "game svelte-pzjb6g");
    			add_location(div18, file$5, 305, 20, 10377);
    			attr_dev(div19, "class", "menus svelte-pzjb6g");
    			add_location(div19, file$5, 338, 20, 12958);
    			attr_dev(div20, "class", "console-inner-border svelte-pzjb6g");
    			add_location(div20, file$5, 304, 16, 10322);
    			set_style(div21, "position", "absolute");
    			set_style(div21, "left", "0");
    			set_style(div21, "bottom", "0");
    			set_style(div21, "transform", "rotate(50deg)");
    			add_location(div21, file$5, 370, 16, 14551);
    			set_style(div22, "position", "absolute");
    			set_style(div22, "right", "0");
    			set_style(div22, "bottom", "0");
    			set_style(div22, "transform", "rotate(180deg)");
    			add_location(div22, file$5, 373, 16, 14691);
    			set_style(div23, "display", "grid");
    			set_style(div23, "position", "relative");
    			add_location(div23, file$5, 287, 12, 9285);
    			attr_dev(div24, "class", "console-outer-border svelte-pzjb6g");
    			add_location(div24, file$5, 286, 8, 9238);
    			attr_dev(div25, "class", "console svelte-pzjb6g");
    			add_location(div25, file$5, 285, 4, 9208);
    			attr_dev(span5, "class", "start-btn svelte-pzjb6g");
    			attr_dev(span5, "id", "practice-spin");
    			add_location(span5, file$5, 382, 12, 14946);
    			attr_dev(span6, "class", "start-btn spin-button svelte-pzjb6g");
    			attr_dev(span6, "id", "spin");
    			add_location(span6, file$5, 383, 12, 15054);
    			attr_dev(span7, "class", "okay-game-button svelte-pzjb6g");
    			add_location(span7, file$5, 384, 12, 15165);
    			attr_dev(span8, "class", "info-game-button svelte-pzjb6g");
    			add_location(span8, file$5, 385, 12, 15261);
    			attr_dev(img, "class", "tau-logo svelte-pzjb6g");
    			attr_dev(img, "alt", "");
    			if (img.src !== (img_src_value = "assests/symbols/tau-logo.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$5, 387, 16, 15416);
    			attr_dev(span9, "class", "lamden-game-button svelte-pzjb6g");
    			add_location(span9, file$5, 386, 12, 15340);
    			attr_dev(div26, "class", "buttons svelte-pzjb6g");
    			add_location(div26, file$5, 381, 8, 14912);
    			set_style(span10, "display", "none");
    			attr_dev(span10, "id", "un-mute");
    			add_location(span10, file$5, 390, 8, 15525);
    			set_style(span11, "display", "none");
    			attr_dev(span11, "id", "failedTxn");
    			add_location(span11, file$5, 391, 8, 15576);
    			attr_dev(div27, "class", "console-controller svelte-pzjb6g");
    			add_location(div27, file$5, 380, 4, 14871);
    			attr_dev(div28, "class", "slot-machine-controller svelte-pzjb6g");
    			add_location(div28, file$5, 283, 0, 9165);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div28, anchor);
    			append_dev(div28, div25);
    			append_dev(div25, div24);
    			append_dev(div24, div23);
    			append_dev(div23, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div23, t0);
    			append_dev(div23, div1);
    			append_dev(div23, t1);
    			append_dev(div23, div20);
    			append_dev(div20, div18);
    			append_dev(div18, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div2);
    			append_dev(div7, t2);
    			append_dev(div7, div3);
    			append_dev(div7, t3);
    			append_dev(div7, div4);
    			append_dev(div7, t4);
    			append_dev(div7, div5);
    			append_dev(div7, t5);
    			append_dev(div7, div6);
    			append_dev(div18, t6);
    			append_dev(div18, span0);
    			append_dev(div18, t7);
    			append_dev(div18, div17);
    			append_dev(div17, div16);
    			append_dev(div16, div15);
    			append_dev(div15, div10);
    			append_dev(div15, t8);
    			append_dev(div15, div11);
    			append_dev(div15, t9);
    			append_dev(div15, div12);
    			append_dev(div15, t10);
    			append_dev(div15, div13);
    			append_dev(div15, t11);
    			append_dev(div15, div14);
    			append_dev(div18, t12);
    			append_dev(div18, span1);
    			append_dev(div18, t13);
    			append_dev(div18, span2);
    			append_dev(div18, t14);
    			append_dev(div18, script);
    			append_dev(div18, t15);
    			append_dev(div18, span3);
    			append_dev(div18, t16);
    			append_dev(div18, span4);
    			append_dev(div20, t17);
    			append_dev(div20, div19);
    			if (if_block1) if_block1.m(div19, null);
    			append_dev(div19, t18);
    			if (if_block2) if_block2.m(div19, null);
    			append_dev(div19, t19);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div19, null);
    			}

    			append_dev(div23, t20);
    			append_dev(div23, div21);
    			append_dev(div23, t21);
    			append_dev(div23, div22);
    			append_dev(div28, t22);
    			append_dev(div28, div27);
    			append_dev(div27, div26);
    			append_dev(div26, span5);
    			append_dev(div26, t24);
    			append_dev(div26, span6);
    			append_dev(div26, t26);
    			append_dev(div26, span7);
    			append_dev(div26, t28);
    			append_dev(div26, span8);
    			append_dev(div26, t30);
    			append_dev(div26, span9);
    			append_dev(span9, img);
    			append_dev(div27, t31);
    			append_dev(div27, span10);
    			append_dev(div27, t32);
    			append_dev(div27, span11);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(span5, "click", /*click_handler*/ ctx[18], false, false, false),
    					listen_dev(span6, "click", /*click_handler_1*/ ctx[19], false, false, false),
    					listen_dev(span7, "click", /*click_handler_2*/ ctx[20], false, false, false),
    					listen_dev(span8, "click", /*click_handler_3*/ ctx[21], false, false, false),
    					listen_dev(span9, "click", /*click_handler_4*/ ctx[22], false, false, false),
    					listen_dev(span11, "click", /*click_handler_5*/ ctx[23], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if (if_block0) if_block0.d(1);
    				if_block0 = current_block_type && current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			}

    			if (!current || dirty[0] & /*currentDisplay*/ 32 && div2_style_value !== (div2_style_value = isVisible("practice", /*currentDisplay*/ ctx[5]))) {
    				attr_dev(div2, "style", div2_style_value);
    			}

    			if (!current || dirty[0] & /*currentDisplay*/ 32 && div3_style_value !== (div3_style_value = isVisible("practice", /*currentDisplay*/ ctx[5]))) {
    				attr_dev(div3, "style", div3_style_value);
    			}

    			if (!current || dirty[0] & /*currentDisplay*/ 32 && div4_style_value !== (div4_style_value = isVisible("practice", /*currentDisplay*/ ctx[5]))) {
    				attr_dev(div4, "style", div4_style_value);
    			}

    			if (!current || dirty[0] & /*currentDisplay*/ 32 && div5_style_value !== (div5_style_value = isVisible("practice", /*currentDisplay*/ ctx[5]))) {
    				attr_dev(div5, "style", div5_style_value);
    			}

    			if (!current || dirty[0] & /*currentDisplay*/ 32 && div6_style_value !== (div6_style_value = isVisible("practice", /*currentDisplay*/ ctx[5]))) {
    				attr_dev(div6, "style", div6_style_value);
    			}

    			if (!current || dirty[0] & /*currentDisplay*/ 32 && div7_style_value !== (div7_style_value = isVisible("practice", /*currentDisplay*/ ctx[5]))) {
    				attr_dev(div7, "style", div7_style_value);
    			}

    			if (!current || dirty[0] & /*currentDisplay*/ 32 && div8_style_value !== (div8_style_value = isVisible("practice", /*currentDisplay*/ ctx[5]))) {
    				attr_dev(div8, "style", div8_style_value);
    			}

    			if (!current || dirty[0] & /*currentDisplay*/ 32 && div9_style_value !== (div9_style_value = isVisible("practice", /*currentDisplay*/ ctx[5]))) {
    				attr_dev(div9, "style", div9_style_value);
    			}

    			if (!current || dirty[0] & /*currentDisplay*/ 32 && div10_style_value !== (div10_style_value = isVisible("live", /*currentDisplay*/ ctx[5]))) {
    				attr_dev(div10, "style", div10_style_value);
    			}

    			if (!current || dirty[0] & /*currentDisplay*/ 32 && div11_style_value !== (div11_style_value = isVisible("live", /*currentDisplay*/ ctx[5]))) {
    				attr_dev(div11, "style", div11_style_value);
    			}

    			if (!current || dirty[0] & /*currentDisplay*/ 32 && div12_style_value !== (div12_style_value = isVisible("live", /*currentDisplay*/ ctx[5]))) {
    				attr_dev(div12, "style", div12_style_value);
    			}

    			if (!current || dirty[0] & /*currentDisplay*/ 32 && div13_style_value !== (div13_style_value = isVisible("live", /*currentDisplay*/ ctx[5]))) {
    				attr_dev(div13, "style", div13_style_value);
    			}

    			if (!current || dirty[0] & /*currentDisplay*/ 32 && div14_style_value !== (div14_style_value = isVisible("live", /*currentDisplay*/ ctx[5]))) {
    				attr_dev(div14, "style", div14_style_value);
    			}

    			if (!current || dirty[0] & /*currentDisplay*/ 32 && div15_style_value !== (div15_style_value = isVisible("live", /*currentDisplay*/ ctx[5]))) {
    				attr_dev(div15, "style", div15_style_value);
    			}

    			if (!current || dirty[0] & /*currentDisplay*/ 32 && div17_style_value !== (div17_style_value = isVisible("live", /*currentDisplay*/ ctx[5]))) {
    				attr_dev(div17, "style", div17_style_value);
    			}

    			if (/*practiceSlotLoaded*/ ctx[7]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_6(ctx);
    					if_block1.c();
    					if_block1.m(div19, t18);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*liveSlotLoaded*/ ctx[6]) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block_5(ctx);
    					if_block2.c();
    					if_block2.m(div19, t19);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block3) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block3 = if_blocks[current_block_type_index];

    					if (!if_block3) {
    						if_block3 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block3.c();
    					} else {
    						if_block3.p(ctx, dirty);
    					}

    					transition_in(if_block3, 1);
    					if_block3.m(div19, null);
    				} else {
    					if_block3 = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block3);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block3);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div28);

    			if (if_block0) {
    				if_block0.d();
    			}

    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function initiateApproval() {
    	const detail = JSON.stringify({
    		contractName: "currency",
    		methodName: "approve",
    		networkType: "mainnet",
    		kwargs: {
    			amount: 999999999, // amount of TAU to approve
    			to: "con_future_games_slots"
    		},
    		stampLimit: 100, //Max stamps to be used. Could use less, won't use more.
    		
    	});

    	document.dispatchEvent(new CustomEvent("lamdenWalletSendTx", { detail }));

    	document.addEventListener("lamdenWalletTxStatus", response => {
    		if (response.detail.status === "error") ; else if (response.detail.data.status == "Transaction Cancelled") ; else {
    			if (response.detail.data.resultInfo.title && response.detail.data.resultInfo.title == "Transaction Successful") {
    				localStorage.setItem("approval", "true"); //Handle Errors///
    			}
    		}
    	});
    }

    function isVisible(display, currentDisplay) {
    	if (display != currentDisplay) {
    		return "display:none";
    	} else {
    		return "visibility:visible";
    	}
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Console", slots, []);
    	let { wallet } = $$props;
    	let { walletStatus } = $$props;
    	let { network } = $$props;
    	let { houseBalance } = $$props;
    	let transactionTime;

    	let houseVk = ({
    		"env": {
    			"isProd": "true",
    			"PROD3_URL": "https://futuregames.io",
    			"PROD_URL2": "http://161.35.179.72:3232",
    			"PROD_URL": "http://localhost:3232",
    			"HOUSE_VK": "e326c852bcf436b8f65842339de78039be435c5607f341176aefb4436f153a28",
    			"API_WIN": "/api/sendWinnings",
    			"API_REFUND": "/api/refund",
    			"API_SPIN": "/api/spin",
    			"API_PRICE": "/api/getPrice"
    		}
    	}).env.HOUSE_VK;

    	let transactionStatus;
    	let stampsUsed;
    	let txHash;

    	onMount(async () => {
    		practiceSlot();
    		slot();
    	});

    	async function getBalance(wallet) {
    		let balance;

    		await network.API.getCurrencyBalance(wallet).then(function (result) {
    			balance = result.c[0];
    		});

    		return balance;
    	}

    	let spinBought = false;

    	function confirmBuyIn(wallet) {
    		let websocket_id = localStorage.getItem("websocket_id");

    		axios({
    			method: "post",
    			url: host + "/api/confirmBuyIn",
    			data: { wallet, id: websocket_id }
    		}).then(result => {
    			spinBought = true;
    			return result;
    		});
    	}

    	const placeBet = async () => {
    		$$invalidate(4, txHash = "");
    		$$invalidate(1, transactionTime = "");

    		const detail = JSON.stringify({
    			//Which Lamden Network to send this to
    			//mainnet, practiceSlotLoadednet are the only acceptable values
    			contractName: "con_future_games_slots",
    			methodName: "transfer",
    			networkType: "mainnet",
    			kwargs: {
    				player: wallet, // contract to approve
    				
    			},
    			//Could you less but won't be allowed to use more
    			stampLimit: 100
    		});

    		document.dispatchEvent(new CustomEvent("lamdenWalletSendTx", { detail }));
    		$$invalidate(1, transactionTime = 0);

    		document.addEventListener("lamdenWalletTxStatus", response => {
    			var startTx = performance.now();

    			if (response.detail.status === "error") ; else {
    				getBalance(wallet).then(async function (result) {
    					$$invalidate(0, walletStatus = result); //Handle Errors
    				});

    				getBalance(houseVk).then(async function (result) {
    					$$invalidate(15, houseBalance = await result);
    				});

    				$$invalidate(2, transactionStatus = response.detail.status);
    				var endTx = performance.now();
    				$$invalidate(1, transactionTime = endTx - startTx + transactionTime);
    				$$invalidate(5, currentDisplay = "live");

    				if (response.detail.data.resultInfo.title == "Transaction Successful") {
    					$$invalidate(3, stampsUsed = response.detail.data.txBlockResult.stamps_used);
    					$$invalidate(4, txHash = response.detail.data.txHash);

    					if (!spinBought) {
    						confirmBuyIn(wallet);
    					}

    					let spinRemain = document.getElementById("spin-remain");

    					if (spinRemain) {
    						spinRemain.innerHTML = "1";
    					}
    				}
    			} //Do soemething
    		});
    	};

    	let currentDisplay = "loading";
    	let betPlaced;

    	function setDisplay(display) {
    		$$invalidate(5, currentDisplay = display);
    	}

    	var startTime;
    	var seconds;

    	function setAButton(display) {
    		if (display == "confirm" && typeof walletStatus == "number") {
    			setDisplay("live");
    		} else if (display == "not approved") {
    			let approved = localStorage.getItem("approval");

    			if (approved) {
    				setDisplay("live");
    			} else {
    				if (startTime) {
    					let currentTime = new Date();
    					var timeDiff = currentTime - startTime; //in ms

    					// strip the ms
    					timeDiff /= 1000;

    					// get seconds 
    					seconds = Math.round(timeDiff);

    					if (seconds > 4) {
    						initiateApproval();
    						startTime = new Date();
    					} else {
    						let clip = new Audio("/assests/sounds/invalid_button.mp3");
    						var un_mute = document.getElementById("un-mute");

    						if (un_mute) {
    							clip.play();
    						}
    					}
    				} else {
    					startTime = new Date();
    					initiateApproval();
    				}
    			}
    		} else if (currentDisplay == "practice" || currentDisplay == "live") {
    			return null;
    		} else if (currentDisplay == "info" || currentDisplay == "loading") {
    			loadPracticeSlots();
    		}
    	}

    	let practiceSpinId = "";
    	let spinId = "";
    	let liveSlotLoaded;
    	let practiceSlotLoaded;
    	let practiceSlotSelected;

    	async function loadPracticeSlots() {
    		liveSlotSelected = false;
    		$$invalidate(6, liveSlotLoaded = false);
    		let resetJackpot = document.getElementById("reset-jackpot");

    		if (resetJackpot) {
    			resetJackpot.click();
    		}

    		if (!practiceSlotSelected) {
    			await setDisplay("practice");
    			document.getElementById("reset-practice-slot").click();
    			$$invalidate(7, practiceSlotLoaded = true);
    			practiceSlotSelected = true;
    		} else {
    			$$invalidate(7, practiceSlotLoaded = true);
    			practiceSlotSelected = true;
    		}
    	}

    	let liveSlotSelected;
    	let spinButton = "Spin";

    	async function loadLiveSlots() {
    		practiceSlotSelected = false;
    		$$invalidate(7, practiceSlotLoaded = false);
    		let approved = localStorage.getItem("approval");

    		if (approved) {
    			if (typeof walletStatus != "undefined" && walletStatus != "Wallet Locked" && walletStatus >= 42) {
    				$$invalidate(5, currentDisplay = "live");
    				document.getElementById("reset-jackpot").click();
    				let slotSpun = document.getElementById("spin");

    				if (slotSpun.innerHTML == "Reset") {
    					spinBought = false;
    					document.getElementById("reset-slot").click();
    					slotSpun.innerHTML = "Spin";
    					placeBet();
    				} else {
    					let spinDisabled = document.getElementById("spin-disabled");

    					if (spinDisabled == null) {
    						placeBet();
    						spinId = "spin";
    					}
    				}

    				liveSlotSelected = true;
    				$$invalidate(6, liveSlotLoaded = true);
    			} else {
    				$$invalidate(5, currentDisplay = "confirm");
    			}
    		} else {
    			$$invalidate(5, currentDisplay = "not approved");
    		}
    	}

    	function getInfo() {
    		setDisplay("info");
    		practiceSlotSelected = false;
    		$$invalidate(7, practiceSlotLoaded = false);
    		liveSlotSelected = false;
    	}

    	function getTxn() {
    		setDisplay("loading");
    		practiceSlotSelected = false;
    		$$invalidate(7, practiceSlotLoaded = false);
    		liveSlotSelected = false;
    	}

    	loadPracticeSlots();

    	const capitalize = s => {
    		if (typeof s !== "string") return "";
    		return s.charAt(0).toUpperCase() + s.slice(1);
    	};

    	const writable_props = ["wallet", "walletStatus", "network", "houseBalance"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Console> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => loadPracticeSlots();
    	const click_handler_1 = () => loadLiveSlots();
    	const click_handler_2 = () => setAButton(currentDisplay);
    	const click_handler_3 = () => getInfo();
    	const click_handler_4 = () => getTxn();
    	const click_handler_5 = () => setDisplay("error");

    	$$self.$$set = $$props => {
    		if ("wallet" in $$props) $$invalidate(16, wallet = $$props.wallet);
    		if ("walletStatus" in $$props) $$invalidate(0, walletStatus = $$props.walletStatus);
    		if ("network" in $$props) $$invalidate(17, network = $$props.network);
    		if ("houseBalance" in $$props) $$invalidate(15, houseBalance = $$props.houseBalance);
    	};

    	$$self.$capture_state = () => ({
    		axios,
    		Screw,
    		HelpMenu,
    		ConfirmTransaction,
    		Error: Error$1,
    		Loading,
    		slot,
    		practiceSlot,
    		onMount,
    		host,
    		wallet,
    		walletStatus,
    		network,
    		houseBalance,
    		transactionTime,
    		houseVk,
    		transactionStatus,
    		stampsUsed,
    		txHash,
    		initiateApproval,
    		getBalance,
    		spinBought,
    		confirmBuyIn,
    		placeBet,
    		currentDisplay,
    		betPlaced,
    		setDisplay,
    		startTime,
    		seconds,
    		setAButton,
    		practiceSpinId,
    		spinId,
    		liveSlotLoaded,
    		practiceSlotLoaded,
    		practiceSlotSelected,
    		loadPracticeSlots,
    		liveSlotSelected,
    		spinButton,
    		loadLiveSlots,
    		getInfo,
    		getTxn,
    		isVisible,
    		capitalize
    	});

    	$$self.$inject_state = $$props => {
    		if ("wallet" in $$props) $$invalidate(16, wallet = $$props.wallet);
    		if ("walletStatus" in $$props) $$invalidate(0, walletStatus = $$props.walletStatus);
    		if ("network" in $$props) $$invalidate(17, network = $$props.network);
    		if ("houseBalance" in $$props) $$invalidate(15, houseBalance = $$props.houseBalance);
    		if ("transactionTime" in $$props) $$invalidate(1, transactionTime = $$props.transactionTime);
    		if ("houseVk" in $$props) houseVk = $$props.houseVk;
    		if ("transactionStatus" in $$props) $$invalidate(2, transactionStatus = $$props.transactionStatus);
    		if ("stampsUsed" in $$props) $$invalidate(3, stampsUsed = $$props.stampsUsed);
    		if ("txHash" in $$props) $$invalidate(4, txHash = $$props.txHash);
    		if ("spinBought" in $$props) spinBought = $$props.spinBought;
    		if ("currentDisplay" in $$props) $$invalidate(5, currentDisplay = $$props.currentDisplay);
    		if ("betPlaced" in $$props) betPlaced = $$props.betPlaced;
    		if ("startTime" in $$props) startTime = $$props.startTime;
    		if ("seconds" in $$props) seconds = $$props.seconds;
    		if ("practiceSpinId" in $$props) practiceSpinId = $$props.practiceSpinId;
    		if ("spinId" in $$props) spinId = $$props.spinId;
    		if ("liveSlotLoaded" in $$props) $$invalidate(6, liveSlotLoaded = $$props.liveSlotLoaded);
    		if ("practiceSlotLoaded" in $$props) $$invalidate(7, practiceSlotLoaded = $$props.practiceSlotLoaded);
    		if ("practiceSlotSelected" in $$props) practiceSlotSelected = $$props.practiceSlotSelected;
    		if ("liveSlotSelected" in $$props) liveSlotSelected = $$props.liveSlotSelected;
    		if ("spinButton" in $$props) $$invalidate(11, spinButton = $$props.spinButton);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		walletStatus,
    		transactionTime,
    		transactionStatus,
    		stampsUsed,
    		txHash,
    		currentDisplay,
    		liveSlotLoaded,
    		practiceSlotLoaded,
    		setDisplay,
    		setAButton,
    		loadPracticeSlots,
    		spinButton,
    		loadLiveSlots,
    		getInfo,
    		getTxn,
    		houseBalance,
    		wallet,
    		network,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5
    	];
    }

    class Console extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$5,
    			create_fragment$5,
    			safe_not_equal,
    			{
    				wallet: 16,
    				walletStatus: 0,
    				network: 17,
    				houseBalance: 15
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Console",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*wallet*/ ctx[16] === undefined && !("wallet" in props)) {
    			console.warn("<Console> was created without expected prop 'wallet'");
    		}

    		if (/*walletStatus*/ ctx[0] === undefined && !("walletStatus" in props)) {
    			console.warn("<Console> was created without expected prop 'walletStatus'");
    		}

    		if (/*network*/ ctx[17] === undefined && !("network" in props)) {
    			console.warn("<Console> was created without expected prop 'network'");
    		}

    		if (/*houseBalance*/ ctx[15] === undefined && !("houseBalance" in props)) {
    			console.warn("<Console> was created without expected prop 'houseBalance'");
    		}
    	}

    	get wallet() {
    		throw new Error_1("<Console>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set wallet(value) {
    		throw new Error_1("<Console>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get walletStatus() {
    		throw new Error_1("<Console>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set walletStatus(value) {
    		throw new Error_1("<Console>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get network() {
    		throw new Error_1("<Console>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set network(value) {
    		throw new Error_1("<Console>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get houseBalance() {
    		throw new Error_1("<Console>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set houseBalance(value) {
    		throw new Error_1("<Console>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/WalletBalance.svelte generated by Svelte v3.37.0 */

    const file$4 = "src/components/WalletBalance.svelte";

    // (52:16) {:else}
    function create_else_block$1(ctx) {
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			img = element("img");
    			set_style(img, "cursor", "pointer");
    			if (img.src !== (img_src_value = "/assests/volume.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "title", "Unmute/speaker icon");
    			attr_dev(img, "class", "mute svelte-1ql38pk");
    			add_location(img, file$4, 52, 20, 1667);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);

    			if (!mounted) {
    				dispose = listen_dev(img, "click", /*click_handler_1*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(52:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (50:16) {#if (muteButton)}
    function create_if_block$1(ctx) {
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			img = element("img");
    			set_style(img, "cursor", "pointer");
    			if (img.src !== (img_src_value = "/assests/no-sound.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "title", "Mute icon");
    			attr_dev(img, "class", "mute svelte-1ql38pk");
    			add_location(img, file$4, 50, 20, 1500);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);

    			if (!mounted) {
    				dispose = listen_dev(img, "click", /*click_handler*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(50:16) {#if (muteButton)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div9;
    	let div5;
    	let div4;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let t2_value = display(/*tauBalance*/ ctx[0]) + "";
    	let t2;
    	let t3;
    	let div3;
    	let t5;
    	let div8;
    	let div7;
    	let div6;

    	function select_block_type(ctx, dirty) {
    		if (/*muteButton*/ ctx[1]) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			t2 = text(t2_value);
    			t3 = space();
    			div3 = element("div");
    			div3.textContent = "00000000000000";
    			t5 = space();
    			div8 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			if_block.c();
    			attr_dev(div0, "id", "slot-overlay");
    			attr_dev(div0, "class", "svelte-1ql38pk");
    			add_location(div0, file$4, 35, 12, 837);
    			attr_dev(div1, "id", "slot-overlay-line");
    			attr_dev(div1, "class", "svelte-1ql38pk");
    			add_location(div1, file$4, 36, 12, 874);
    			attr_dev(div2, "id", "slot-credits");
    			attr_dev(div2, "class", "svelte-1ql38pk");
    			add_location(div2, file$4, 37, 12, 916);
    			attr_dev(div3, "id", "slot-zeros");
    			attr_dev(div3, "class", "svelte-1ql38pk");
    			add_location(div3, file$4, 40, 12, 1007);
    			attr_dev(div4, "id", "slot-display");
    			attr_dev(div4, "class", "svelte-1ql38pk");
    			add_location(div4, file$4, 34, 8, 801);
    			attr_dev(div5, "class", "slot-machine-score svelte-1ql38pk");
    			add_location(div5, file$4, 33, 4, 760);
    			set_style(div6, "margin", "auto");
    			set_style(div6, "cursor", "pointer");
    			add_location(div6, file$4, 47, 12, 1386);
    			attr_dev(div7, "class", "mute-button");
    			set_style(div7, "background-color", "rgb(16 255 254)");
    			set_style(div7, "border-radius", "9999px");
    			set_style(div7, "width", "1.25rem");
    			set_style(div7, "height", "1.25rem");
    			set_style(div7, "display", "grid");
    			set_style(div7, "cursor", "pointer");
    			set_style(div7, "box-shadow", "0 0 10px 5px black");
    			add_location(div7, file$4, 46, 8, 1197);
    			set_style(div8, "float", "left");
    			set_style(div8, "position", "absolute");
    			set_style(div8, "margin-left", "8rem");
    			set_style(div8, "margin-top", ".75rem");
    			add_location(div8, file$4, 45, 4, 1111);
    			attr_dev(div9, "class", "wallet-balance");
    			add_location(div9, file$4, 32, 0, 727);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div4, t0);
    			append_dev(div4, div1);
    			append_dev(div4, t1);
    			append_dev(div4, div2);
    			append_dev(div2, t2);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div9, t5);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			if_block.m(div6, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*tauBalance*/ 1 && t2_value !== (t2_value = display(/*tauBalance*/ ctx[0]) + "")) set_data_dev(t2, t2_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div6, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function display(balance) {
    	if (typeof balance == "undefined") {
    		return "Connect Wallet";
    	} else if (balance == "Wallet Locked") {
    		return balance;
    	} else {
    		return balance + " TAU";
    	}
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("WalletBalance", slots, []);
    	let { tauBalance } = $$props;
    	let muteButton = false;

    	function mute(state) {
    		if (state) {
    			var un_mute = document.getElementById("mute");
    			un_mute.setAttribute("id", "un-mute");
    			$$invalidate(1, muteButton = false);
    		} else {
    			var un_mute = document.getElementById("un-mute");
    			un_mute.setAttribute("id", "mute");
    			$$invalidate(1, muteButton = true);
    		}
    	}

    	const writable_props = ["tauBalance"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<WalletBalance> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => mute(muteButton);
    	const click_handler_1 = () => mute(muteButton);

    	$$self.$$set = $$props => {
    		if ("tauBalance" in $$props) $$invalidate(0, tauBalance = $$props.tauBalance);
    	};

    	$$self.$capture_state = () => ({ tauBalance, display, muteButton, mute });

    	$$self.$inject_state = $$props => {
    		if ("tauBalance" in $$props) $$invalidate(0, tauBalance = $$props.tauBalance);
    		if ("muteButton" in $$props) $$invalidate(1, muteButton = $$props.muteButton);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [tauBalance, muteButton, mute, click_handler, click_handler_1];
    }

    class WalletBalance extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { tauBalance: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WalletBalance",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*tauBalance*/ ctx[0] === undefined && !("tauBalance" in props)) {
    			console.warn("<WalletBalance> was created without expected prop 'tauBalance'");
    		}
    	}

    	get tauBalance() {
    		throw new Error("<WalletBalance>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tauBalance(value) {
    		throw new Error("<WalletBalance>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Jackpot.svelte generated by Svelte v3.37.0 */
    const file$3 = "src/components/Jackpot.svelte";

    // (82:12) {:else}
    function create_else_block(ctx) {
    	let div3;
    	let div0;
    	let t0;
    	let t1_value = numberWithCommas(/*houseBalance*/ ctx[0]) + "";
    	let t1;
    	let t2;
    	let t3;
    	let div1;
    	let t4;
    	let t5_value = numberWithCommas(/*returnUSD*/ ctx[5](/*houseBalance*/ ctx[0])) + "";
    	let t5;
    	let t6;
    	let div2;
    	let t7;
    	let t8_value = numberWithCommas(/*returnEUR*/ ctx[6](/*houseBalance*/ ctx[0])) + "";
    	let t8;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = text("Jackpot: ");
    			t1 = text(t1_value);
    			t2 = text(" Tau");
    			t3 = text("\n              ");
    			div1 = element("div");
    			t4 = text("USD Value: $");
    			t5 = text(t5_value);
    			t6 = text("\n              ");
    			div2 = element("div");
    			t7 = text("Euro Value: $");
    			t8 = text(t8_value);
    			set_style(div0, "padding-top", "14px");
    			attr_dev(div0, "class", "svelte-1g5zqo1");
    			add_location(div0, file$3, 83, 14, 2413);
    			set_style(div1, "margin-top", "-1.5rem");
    			attr_dev(div1, "class", "svelte-1g5zqo1");
    			add_location(div1, file$3, 86, 14, 2545);
    			set_style(div2, "margin-top", "-1.5rem");
    			attr_dev(div2, "class", "svelte-1g5zqo1");
    			add_location(div2, file$3, 89, 14, 2690);
    			set_style(div3, "margin-left", "1.15rem");
    			attr_dev(div3, "class", "svelte-1g5zqo1");
    			add_location(div3, file$3, 82, 12, 2363);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    			append_dev(div3, t3);
    			append_dev(div3, div1);
    			append_dev(div1, t4);
    			append_dev(div1, t5);
    			append_dev(div3, t6);
    			append_dev(div3, div2);
    			append_dev(div2, t7);
    			append_dev(div2, t8);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*houseBalance*/ 1 && t1_value !== (t1_value = numberWithCommas(/*houseBalance*/ ctx[0]) + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*houseBalance*/ 1 && t5_value !== (t5_value = numberWithCommas(/*returnUSD*/ ctx[5](/*houseBalance*/ ctx[0])) + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*houseBalance*/ 1 && t8_value !== (t8_value = numberWithCommas(/*returnEUR*/ ctx[6](/*houseBalance*/ ctx[0])) + "")) set_data_dev(t8, t8_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(82:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (71:33) 
    function create_if_block_1(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t2;
    	let br;
    	let t3;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Sorry!";
    			t1 = text("\n              ");
    			div1 = element("div");
    			t2 = text("You've lost, ");
    			br = element("br");
    			t3 = text("try again to win!");
    			set_style(div0, "color", "#f91212");
    			attr_dev(div0, "class", "svelte-1g5zqo1");
    			add_location(div0, file$3, 73, 14, 2096);
    			attr_dev(br, "class", "svelte-1g5zqo1");
    			add_location(br, file$3, 77, 29, 2256);
    			set_style(div1, "font-size", ".85rem");
    			set_style(div1, "margin", "-1rem");
    			attr_dev(div1, "class", "svelte-1g5zqo1");
    			add_location(div1, file$3, 76, 14, 2182);
    			set_style(div2, "font-weight", "bold");
    			set_style(div2, "font-size", ".95rem");
    			set_style(div2, "text-align", "center");
    			set_style(div2, "padding", ".5rem");
    			attr_dev(div2, "class", "svelte-1g5zqo1");
    			add_location(div2, file$3, 72, 12, 2001);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, t2);
    			append_dev(div1, br);
    			append_dev(div1, t3);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(71:33) ",
    		ctx
    	});

    	return block;
    }

    // (61:12) {#if (userWon)}
    function create_if_block(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t2;
    	let br;
    	let span;
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Congratulations!";
    			t1 = text("\n              ");
    			div1 = element("div");
    			t2 = text("You've won ");
    			br = element("br");
    			span = element("span");
    			t3 = text(/*score*/ ctx[1]);
    			t4 = text(" TAU!");
    			attr_dev(div0, "class", "svelte-1g5zqo1");
    			add_location(div0, file$3, 63, 14, 1718);
    			attr_dev(br, "class", "svelte-1g5zqo1");
    			add_location(br, file$3, 67, 27, 1864);
    			set_style(span, "color", "white");
    			attr_dev(span, "class", "svelte-1g5zqo1");
    			add_location(span, file$3, 67, 31, 1868);
    			set_style(div1, "font-size", ".85rem");
    			set_style(div1, "margin", "-1rem");
    			attr_dev(div1, "class", "svelte-1g5zqo1");
    			add_location(div1, file$3, 66, 14, 1792);
    			set_style(div2, "font-weight", "bold");
    			set_style(div2, "font-size", ".95rem");
    			set_style(div2, "text-align", "center");
    			set_style(div2, "padding", ".5rem");
    			attr_dev(div2, "class", "svelte-1g5zqo1");
    			add_location(div2, file$3, 62, 12, 1623);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, t2);
    			append_dev(div1, br);
    			append_dev(div1, span);
    			append_dev(span, t3);
    			append_dev(div1, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*score*/ 2) set_data_dev(t3, /*score*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(61:12) {#if (userWon)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let body;
    	let pre;
    	let output;
    	let div;
    	let t;
    	let span;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*userWon*/ ctx[2]) return create_if_block;
    		if (/*userLost*/ ctx[3]) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			body = element("body");
    			pre = element("pre");
    			output = element("output");
    			div = element("div");
    			if_block.c();
    			t = text("\n            ");
    			span = element("span");
    			attr_dev(div, "id", "tester");
    			attr_dev(div, "class", "svelte-1g5zqo1");
    			add_location(div, file$3, 59, 10, 1526);
    			set_style(span, "display", "none");
    			attr_dev(span, "id", "reset-jackpot");
    			attr_dev(span, "class", "svelte-1g5zqo1");
    			add_location(span, file$3, 95, 12, 2886);
    			attr_dev(output, "class", "svelte-1g5zqo1");
    			add_location(output, file$3, 58, 8, 1507);
    			set_style(pre, "margin-top", "1rem");
    			attr_dev(pre, "class", "svelte-1g5zqo1");
    			add_location(pre, file$3, 57, 4, 1467);
    			attr_dev(body, "class", "svelte-1g5zqo1");
    			add_location(body, file$3, 56, 0, 1456);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			append_dev(body, pre);
    			append_dev(pre, output);
    			append_dev(output, div);
    			if_block.m(div, null);
    			append_dev(output, t);
    			append_dev(output, span);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "click", /*click_handler*/ ctx[8], false, false, false),
    					listen_dev(span, "click", /*click_handler_1*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function numberWithCommas(x) {
    	if (typeof x == "string") {
    		let num = parseInt(x.split(".")[0]);
    		return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + x.split(".")[1];
    	}

    	if (typeof x == "number") {
    		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    	}
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Jackpot", slots, []);
    	let { houseBalance } = $$props;
    	let score;
    	let userWon;
    	let userLost;

    	function updateLocalStorage() {
    		$$invalidate(1, score = localStorage.getItem("score"));

    		if (score > 0) {
    			$$invalidate(2, userWon = true);
    		} else {
    			$$invalidate(3, userLost = true);
    		}
    	}

    	let tauUSD;
    	let tauEUR;
    	let prices;

    	async function getPrices() {
    		prices = await axios.get(host + ({
    			"env": {
    				"isProd": "true",
    				"PROD3_URL": "https://futuregames.io",
    				"PROD_URL2": "http://161.35.179.72:3232",
    				"PROD_URL": "http://localhost:3232",
    				"HOUSE_VK": "e326c852bcf436b8f65842339de78039be435c5607f341176aefb4436f153a28",
    				"API_WIN": "/api/sendWinnings",
    				"API_REFUND": "/api/refund",
    				"API_SPIN": "/api/spin",
    				"API_PRICE": "/api/getPrice"
    			}
    		}).env.API_PRICE);
    	}

    	getPrices();

    	function returnUSD(hb) {
    		if (hb && prices) {
    			let value = prices.data.usd * hb;
    			return value.toFixed(2);
    		}
    	}

    	function returnEUR(hb) {
    		if (hb && prices) {
    			let value = prices.data.eur * hb;
    			return value.toFixed(2);
    		}
    	}

    	function resetScreen() {
    		$$invalidate(2, userWon = null);
    		$$invalidate(3, userLost = null);
    	}

    	const writable_props = ["houseBalance"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Jackpot> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => updateLocalStorage();
    	const click_handler_1 = () => resetScreen();

    	$$self.$$set = $$props => {
    		if ("houseBalance" in $$props) $$invalidate(0, houseBalance = $$props.houseBalance);
    	};

    	$$self.$capture_state = () => ({
    		axios,
    		host,
    		houseBalance,
    		numberWithCommas,
    		score,
    		userWon,
    		userLost,
    		updateLocalStorage,
    		tauUSD,
    		tauEUR,
    		prices,
    		getPrices,
    		returnUSD,
    		returnEUR,
    		resetScreen
    	});

    	$$self.$inject_state = $$props => {
    		if ("houseBalance" in $$props) $$invalidate(0, houseBalance = $$props.houseBalance);
    		if ("score" in $$props) $$invalidate(1, score = $$props.score);
    		if ("userWon" in $$props) $$invalidate(2, userWon = $$props.userWon);
    		if ("userLost" in $$props) $$invalidate(3, userLost = $$props.userLost);
    		if ("tauUSD" in $$props) tauUSD = $$props.tauUSD;
    		if ("tauEUR" in $$props) tauEUR = $$props.tauEUR;
    		if ("prices" in $$props) prices = $$props.prices;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		houseBalance,
    		score,
    		userWon,
    		userLost,
    		updateLocalStorage,
    		returnUSD,
    		returnEUR,
    		resetScreen,
    		click_handler,
    		click_handler_1
    	];
    }

    class Jackpot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { houseBalance: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Jackpot",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*houseBalance*/ ctx[0] === undefined && !("houseBalance" in props)) {
    			console.warn("<Jackpot> was created without expected prop 'houseBalance'");
    		}
    	}

    	get houseBalance() {
    		throw new Error("<Jackpot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set houseBalance(value) {
    		throw new Error("<Jackpot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Winners.svelte generated by Svelte v3.37.0 */

    const file$2 = "src/components/Winners.svelte";

    function create_fragment$2(ctx) {
    	let div8;
    	let div0;
    	let t1;
    	let div7;
    	let div3;
    	let div1;
    	let t3;
    	let div2;
    	let t5;
    	let div6;
    	let div4;
    	let t7;
    	let div5;

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div0 = element("div");
    			div0.textContent = "Top Winners";
    			t1 = space();
    			div7 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			div1.textContent = "Address";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "Address Link";
    			t5 = space();
    			div6 = element("div");
    			div4 = element("div");
    			div4.textContent = "Prize";
    			t7 = space();
    			div5 = element("div");
    			div5.textContent = "Winnings";
    			set_style(div0, "font-size", "x-large");
    			set_style(div0, "font-weight", "bold");
    			set_style(div0, "margin", "1rem");
    			add_location(div0, file$2, 8, 4, 119);
    			set_style(div1, "border-bottom", "1px solid #adadad");
    			set_style(div1, "font-weight", "700");
    			set_style(div1, "margin-bottom", "1rem");
    			add_location(div1, file$2, 14, 12, 283);
    			add_location(div2, file$2, 17, 12, 421);
    			attr_dev(div3, "class", "winners svelte-o8vbhe");
    			add_location(div3, file$2, 13, 8, 249);
    			set_style(div4, "border-bottom", "1px solid #adadad");
    			set_style(div4, "font-weight", "700");
    			set_style(div4, "margin-bottom", "1rem");
    			add_location(div4, file$2, 22, 12, 533);
    			add_location(div5, file$2, 25, 12, 669);
    			attr_dev(div6, "class", "winnings svelte-o8vbhe");
    			add_location(div6, file$2, 21, 8, 498);
    			attr_dev(div7, "class", "scoreboard svelte-o8vbhe");
    			add_location(div7, file$2, 12, 4, 216);
    			attr_dev(div8, "class", "slot-machine-scoreboard svelte-o8vbhe");
    			set_style(div8, "text-align", "center");
    			set_style(div8, "width", "80%");
    			set_style(div8, "margin-top", "4rem");
    			add_location(div8, file$2, 5, 0, 22);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div0);
    			append_dev(div8, t1);
    			append_dev(div8, div7);
    			append_dev(div7, div3);
    			append_dev(div3, div1);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div7, t5);
    			append_dev(div7, div6);
    			append_dev(div6, div4);
    			append_dev(div6, t7);
    			append_dev(div6, div5);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Winners", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Winners> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Winners extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Winners",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Donate.svelte generated by Svelte v3.37.0 */

    const file$1 = "src/components/Donate.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let ul;
    	let li;
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			ul = element("ul");
    			li = element("li");
    			a = element("a");
    			a.textContent = "Donate";
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "svelte-127nv8b");
    			add_location(a, file$1, 42, 13, 1118);
    			attr_dev(li, "class", "svelte-127nv8b");
    			add_location(li, file$1, 42, 9, 1114);
    			attr_dev(ul, "class", "svelte-127nv8b");
    			add_location(ul, file$1, 41, 6, 1100);
    			attr_dev(div0, "class", "container");
    			add_location(div0, file$1, 40, 4, 1038);
    			attr_dev(div1, "class", "donate-button");
    			add_location(div1, file$1, 39, 0, 1006);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, ul);
    			append_dev(ul, li);
    			append_dev(li, a);

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", /*click_handler*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const donationAddress = "";

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Donate", slots, []);

    	const sendDonation = async () => {
    		const detail = JSON.stringify({
    			//Which Lamden Network to send this to
    			//mainnet, testnet are the only acceptable values
    			contractName: "currency",
    			methodName: "transfer",
    			networkType: "mainnet",
    			kwargs: {
    				amount: 15, // amount of TAU to approve
    				to: donationAddress, // contract to approve
    				
    			},
    			//Could you less but won't be allowed to use more
    			stampLimit: 100
    		});

    		document.dispatchEvent(new CustomEvent("lamdenWalletSendTx", { detail }));

    		document.addEventListener("lamdenWalletTxStatus", response => {
    			performance.now();

    			if (response.detail.status === "error") ; else {
    				currentDisplay = "loading"; //Handle Errors
    			} //Do soemething
    		});
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Donate> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => sendDonation();
    	$$self.$capture_state = () => ({ donationAddress, sendDonation });
    	return [sendDonation, click_handler];
    }

    class Donate extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Donate",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.37.0 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let head;
    	let link0;
    	let t0;
    	let link1;
    	let t1;
    	let link2;
    	let t2;
    	let link3;
    	let t3;
    	let link4;
    	let t4;
    	let link5;
    	let t5;
    	let div10;
    	let div3;
    	let div0;
    	let t7;
    	let div1;
    	let prizeboard;
    	let updating_houseBalance;
    	let t8;
    	let div2;
    	let walletconnect;
    	let updating_tauBalance;
    	let updating_wallet;
    	let t9;
    	let div5;
    	let div4;
    	let walletbalance;
    	let updating_tauBalance_1;
    	let t10;
    	let console;
    	let updating_walletStatus;
    	let updating_houseBalance_1;
    	let t11;
    	let span0;
    	let t12;
    	let span1;
    	let t13;
    	let div9;
    	let div6;
    	let jackpot;
    	let updating_houseBalance_2;
    	let t14;
    	let div7;
    	let winners;
    	let t15;
    	let div8;
    	let donate;
    	let t16;
    	let span2;
    	let current;
    	let mounted;
    	let dispose;

    	function prizeboard_houseBalance_binding(value) {
    		/*prizeboard_houseBalance_binding*/ ctx[6](value);
    	}

    	let prizeboard_props = {};

    	if (/*houseBalance*/ ctx[2] !== void 0) {
    		prizeboard_props.houseBalance = /*houseBalance*/ ctx[2];
    	}

    	prizeboard = new PrizeBoard({ props: prizeboard_props, $$inline: true });
    	binding_callbacks.push(() => bind$1(prizeboard, "houseBalance", prizeboard_houseBalance_binding));

    	function walletconnect_tauBalance_binding(value) {
    		/*walletconnect_tauBalance_binding*/ ctx[7](value);
    	}

    	function walletconnect_wallet_binding(value) {
    		/*walletconnect_wallet_binding*/ ctx[8](value);
    	}

    	let walletconnect_props = { network: /*lamdenNetwork*/ ctx[3] };

    	if (/*tauBalance*/ ctx[0] !== void 0) {
    		walletconnect_props.tauBalance = /*tauBalance*/ ctx[0];
    	}

    	if (/*wallet*/ ctx[1] !== void 0) {
    		walletconnect_props.wallet = /*wallet*/ ctx[1];
    	}

    	walletconnect = new WalletConnect({
    			props: walletconnect_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind$1(walletconnect, "tauBalance", walletconnect_tauBalance_binding));
    	binding_callbacks.push(() => bind$1(walletconnect, "wallet", walletconnect_wallet_binding));

    	function walletbalance_tauBalance_binding(value) {
    		/*walletbalance_tauBalance_binding*/ ctx[9](value);
    	}

    	let walletbalance_props = {};

    	if (/*tauBalance*/ ctx[0] !== void 0) {
    		walletbalance_props.tauBalance = /*tauBalance*/ ctx[0];
    	}

    	walletbalance = new WalletBalance({
    			props: walletbalance_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind$1(walletbalance, "tauBalance", walletbalance_tauBalance_binding));

    	function console_walletStatus_binding(value) {
    		/*console_walletStatus_binding*/ ctx[11](value);
    	}

    	function console_houseBalance_binding(value) {
    		/*console_houseBalance_binding*/ ctx[12](value);
    	}

    	let console_props = {
    		wallet: /*wallet*/ ctx[1],
    		network: /*lamdenNetwork*/ ctx[3]
    	};

    	if (/*tauBalance*/ ctx[0] !== void 0) {
    		console_props.walletStatus = /*tauBalance*/ ctx[0];
    	}

    	if (/*houseBalance*/ ctx[2] !== void 0) {
    		console_props.houseBalance = /*houseBalance*/ ctx[2];
    	}

    	console = new Console({ props: console_props, $$inline: true });
    	binding_callbacks.push(() => bind$1(console, "walletStatus", console_walletStatus_binding));
    	binding_callbacks.push(() => bind$1(console, "houseBalance", console_houseBalance_binding));

    	function jackpot_houseBalance_binding(value) {
    		/*jackpot_houseBalance_binding*/ ctx[13](value);
    	}

    	let jackpot_props = {};

    	if (/*houseBalance*/ ctx[2] !== void 0) {
    		jackpot_props.houseBalance = /*houseBalance*/ ctx[2];
    	}

    	jackpot = new Jackpot({ props: jackpot_props, $$inline: true });
    	binding_callbacks.push(() => bind$1(jackpot, "houseBalance", jackpot_houseBalance_binding));
    	winners = new Winners({ $$inline: true });
    	donate = new Donate({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			head = element("head");
    			link0 = element("link");
    			t0 = space();
    			link1 = element("link");
    			t1 = space();
    			link2 = element("link");
    			t2 = space();
    			link3 = element("link");
    			t3 = space();
    			link4 = element("link");
    			t4 = space();
    			link5 = element("link");
    			t5 = space();
    			div10 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			div0.textContent = "Prizes";
    			t7 = space();
    			div1 = element("div");
    			create_component(prizeboard.$$.fragment);
    			t8 = space();
    			div2 = element("div");
    			create_component(walletconnect.$$.fragment);
    			t9 = space();
    			div5 = element("div");
    			div4 = element("div");
    			create_component(walletbalance.$$.fragment);
    			t10 = space();
    			create_component(console.$$.fragment);
    			t11 = space();
    			span0 = element("span");
    			t12 = space();
    			span1 = element("span");
    			t13 = space();
    			div9 = element("div");
    			div6 = element("div");
    			create_component(jackpot.$$.fragment);
    			t14 = space();
    			div7 = element("div");
    			create_component(winners.$$.fragment);
    			t15 = space();
    			div8 = element("div");
    			create_component(donate.$$.fragment);
    			t16 = space();
    			span2 = element("span");
    			attr_dev(link0, "rel", "preconnect");
    			attr_dev(link0, "href", "https://fonts.gstatic.com");
    			add_location(link0, file, 82, 4, 2570);
    			attr_dev(link1, "href", "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap");
    			attr_dev(link1, "rel", "stylesheet");
    			add_location(link1, file, 83, 4, 2631);
    			attr_dev(link2, "rel", "preconnect");
    			attr_dev(link2, "href", "https://fonts.gstatic.com");
    			add_location(link2, file, 84, 4, 2735);
    			attr_dev(link3, "href", "https://fonts.googleapis.com/css2?family=Fredericka+the+Great&display=swap");
    			attr_dev(link3, "rel", "stylesheet");
    			add_location(link3, file, 85, 4, 2796);
    			attr_dev(link4, "rel", "preconnect");
    			attr_dev(link4, "href", "https://fonts.gstatic.com");
    			add_location(link4, file, 86, 4, 2906);
    			attr_dev(link5, "href", "https://fonts.googleapis.com/css2?family=VT323&display=swap");
    			attr_dev(link5, "rel", "stylesheet");
    			add_location(link5, file, 87, 2, 2965);
    			add_location(head, file, 81, 2, 2559);
    			attr_dev(div0, "class", "slot-machine-title svelte-1datnmz");
    			set_style(div0, "color", "white");
    			set_style(div0, "font-size", "1.75rem");
    			set_style(div0, "margin", "auto");
    			set_style(div0, "text-shadow", "0 2px 2px #141414c7");
    			add_location(div0, file, 93, 6, 3149);
    			attr_dev(div1, "class", "slot-machine-prizes svelte-1datnmz");
    			add_location(div1, file, 96, 6, 3301);
    			attr_dev(div2, "class", "slot-machine-wallet svelte-1datnmz");
    			add_location(div2, file, 99, 6, 3410);
    			attr_dev(div3, "class", "slot-machine-left svelte-1datnmz");
    			add_location(div3, file, 92, 4, 3111);
    			attr_dev(div4, "id", "player-balance");
    			add_location(div4, file, 105, 6, 3610);
    			attr_dev(span0, "id", "practice-spin-enabled");
    			set_style(span0, "display", "none");
    			add_location(span0, file, 109, 6, 3865);
    			attr_dev(span1, "id", "spin-enabled");
    			set_style(span1, "display", "none");
    			add_location(span1, file, 110, 6, 3928);
    			attr_dev(div5, "class", "slot-machine-center svelte-1datnmz");
    			add_location(div5, file, 104, 4, 3570);
    			attr_dev(div6, "id", "jackpot-balance");
    			add_location(div6, file, 114, 6, 4031);
    			attr_dev(div7, "class", "slot-machine-winners");
    			set_style(div7, "visibility", "hidden");
    			add_location(div7, file, 117, 6, 4165);
    			attr_dev(div8, "class", "slot-machine-donate");
    			add_location(div8, file, 120, 6, 4264);
    			attr_dev(div9, "class", "slot-machine-right svelte-1datnmz");
    			add_location(div9, file, 113, 4, 3992);
    			attr_dev(span2, "id", "test");
    			add_location(span2, file, 124, 4, 4344);
    			attr_dev(div10, "class", "slot-machine-gradient svelte-1datnmz");
    			add_location(div10, file, 90, 1, 3070);
    			attr_dev(main, "class", "svelte-1datnmz");
    			add_location(main, file, 80, 0, 2550);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, head);
    			append_dev(head, link0);
    			append_dev(head, t0);
    			append_dev(head, link1);
    			append_dev(head, t1);
    			append_dev(head, link2);
    			append_dev(head, t2);
    			append_dev(head, link3);
    			append_dev(head, t3);
    			append_dev(head, link4);
    			append_dev(head, t4);
    			append_dev(head, link5);
    			append_dev(main, t5);
    			append_dev(main, div10);
    			append_dev(div10, div3);
    			append_dev(div3, div0);
    			append_dev(div3, t7);
    			append_dev(div3, div1);
    			mount_component(prizeboard, div1, null);
    			append_dev(div3, t8);
    			append_dev(div3, div2);
    			mount_component(walletconnect, div2, null);
    			append_dev(div10, t9);
    			append_dev(div10, div5);
    			append_dev(div5, div4);
    			mount_component(walletbalance, div4, null);
    			append_dev(div5, t10);
    			mount_component(console, div5, null);
    			append_dev(div5, t11);
    			append_dev(div5, span0);
    			append_dev(div5, t12);
    			append_dev(div5, span1);
    			append_dev(div10, t13);
    			append_dev(div10, div9);
    			append_dev(div9, div6);
    			mount_component(jackpot, div6, null);
    			append_dev(div9, t14);
    			append_dev(div9, div7);
    			mount_component(winners, div7, null);
    			append_dev(div9, t15);
    			append_dev(div9, div8);
    			mount_component(donate, div8, null);
    			append_dev(div10, t16);
    			append_dev(div10, span2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div4, "click", /*click_handler*/ ctx[10], false, false, false),
    					listen_dev(div6, "click", /*click_handler_1*/ ctx[14], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const prizeboard_changes = {};

    			if (!updating_houseBalance && dirty & /*houseBalance*/ 4) {
    				updating_houseBalance = true;
    				prizeboard_changes.houseBalance = /*houseBalance*/ ctx[2];
    				add_flush_callback(() => updating_houseBalance = false);
    			}

    			prizeboard.$set(prizeboard_changes);
    			const walletconnect_changes = {};

    			if (!updating_tauBalance && dirty & /*tauBalance*/ 1) {
    				updating_tauBalance = true;
    				walletconnect_changes.tauBalance = /*tauBalance*/ ctx[0];
    				add_flush_callback(() => updating_tauBalance = false);
    			}

    			if (!updating_wallet && dirty & /*wallet*/ 2) {
    				updating_wallet = true;
    				walletconnect_changes.wallet = /*wallet*/ ctx[1];
    				add_flush_callback(() => updating_wallet = false);
    			}

    			walletconnect.$set(walletconnect_changes);
    			const walletbalance_changes = {};

    			if (!updating_tauBalance_1 && dirty & /*tauBalance*/ 1) {
    				updating_tauBalance_1 = true;
    				walletbalance_changes.tauBalance = /*tauBalance*/ ctx[0];
    				add_flush_callback(() => updating_tauBalance_1 = false);
    			}

    			walletbalance.$set(walletbalance_changes);
    			const console_changes = {};
    			if (dirty & /*wallet*/ 2) console_changes.wallet = /*wallet*/ ctx[1];

    			if (!updating_walletStatus && dirty & /*tauBalance*/ 1) {
    				updating_walletStatus = true;
    				console_changes.walletStatus = /*tauBalance*/ ctx[0];
    				add_flush_callback(() => updating_walletStatus = false);
    			}

    			if (!updating_houseBalance_1 && dirty & /*houseBalance*/ 4) {
    				updating_houseBalance_1 = true;
    				console_changes.houseBalance = /*houseBalance*/ ctx[2];
    				add_flush_callback(() => updating_houseBalance_1 = false);
    			}

    			console.$set(console_changes);
    			const jackpot_changes = {};

    			if (!updating_houseBalance_2 && dirty & /*houseBalance*/ 4) {
    				updating_houseBalance_2 = true;
    				jackpot_changes.houseBalance = /*houseBalance*/ ctx[2];
    				add_flush_callback(() => updating_houseBalance_2 = false);
    			}

    			jackpot.$set(jackpot_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(prizeboard.$$.fragment, local);
    			transition_in(walletconnect.$$.fragment, local);
    			transition_in(walletbalance.$$.fragment, local);
    			transition_in(console.$$.fragment, local);
    			transition_in(jackpot.$$.fragment, local);
    			transition_in(winners.$$.fragment, local);
    			transition_in(donate.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(prizeboard.$$.fragment, local);
    			transition_out(walletconnect.$$.fragment, local);
    			transition_out(walletbalance.$$.fragment, local);
    			transition_out(console.$$.fragment, local);
    			transition_out(jackpot.$$.fragment, local);
    			transition_out(winners.$$.fragment, local);
    			transition_out(donate.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(prizeboard);
    			destroy_component(walletconnect);
    			destroy_component(walletbalance);
    			destroy_component(console);
    			destroy_component(jackpot);
    			destroy_component(winners);
    			destroy_component(donate);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function setNetwork() {
    	let network;

    	{
    		network = {
    			"name": "Lamden Public Mainnet",
    			"type": "mainnet",
    			"url": "https://masternode-01.lamden.io:443"
    		};

    		return network;
    	}
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let currentNetwork;
    	currentNetwork = setNetwork();

    	let lamdenNetwork = new lamden.Network({
    			name: currentNetwork.name,
    			type: currentNetwork.type,
    			hosts: [currentNetwork.url]
    		});

    	let tauBalance;
    	let wallet;

    	let houseVk = ({
    		"env": {
    			"isProd": "true",
    			"PROD3_URL": "https://futuregames.io",
    			"PROD_URL2": "http://161.35.179.72:3232",
    			"PROD_URL": "http://localhost:3232",
    			"HOUSE_VK": "e326c852bcf436b8f65842339de78039be435c5607f341176aefb4436f153a28",
    			"API_WIN": "/api/sendWinnings",
    			"API_REFUND": "/api/refund",
    			"API_SPIN": "/api/spin",
    			"API_PRICE": "/api/getPrice"
    		}
    	}).env.HOUSE_VK;

    	async function getBalance(wallet) {
    		let balance;

    		await lamdenNetwork.API.getCurrencyBalance(wallet).then(function (result) {
    			balance = result.c[0];
    		});

    		return balance;
    	}

    	let houseBalance;

    	getBalance(houseVk).then(async function (result) {
    		$$invalidate(2, houseBalance = await result);
    	});

    	async function refreshBalance() {
    		await getBalance(wallet).then(async function (result) {
    			$$invalidate(0, tauBalance = await result);
    		});
    	}

    	async function refreshJackpot() {
    		await getBalance(houseVk).then(async function (result) {
    			$$invalidate(2, houseBalance = await result);
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function prizeboard_houseBalance_binding(value) {
    		houseBalance = value;
    		$$invalidate(2, houseBalance);
    	}

    	function walletconnect_tauBalance_binding(value) {
    		tauBalance = value;
    		$$invalidate(0, tauBalance);
    	}

    	function walletconnect_wallet_binding(value) {
    		wallet = value;
    		$$invalidate(1, wallet);
    	}

    	function walletbalance_tauBalance_binding(value) {
    		tauBalance = value;
    		$$invalidate(0, tauBalance);
    	}

    	const click_handler = () => refreshBalance();

    	function console_walletStatus_binding(value) {
    		tauBalance = value;
    		$$invalidate(0, tauBalance);
    	}

    	function console_houseBalance_binding(value) {
    		houseBalance = value;
    		$$invalidate(2, houseBalance);
    	}

    	function jackpot_houseBalance_binding(value) {
    		houseBalance = value;
    		$$invalidate(2, houseBalance);
    	}

    	const click_handler_1 = () => refreshJackpot();

    	$$self.$capture_state = () => ({
    		onMount,
    		slot,
    		practiceSlot,
    		Network: lamden.Network,
    		Lamden: lamden.Lamden,
    		PrizeBoard,
    		WalletConnect,
    		Console,
    		WalletBalance,
    		Jackpot,
    		Winners,
    		Donate,
    		currentNetwork,
    		setNetwork,
    		lamdenNetwork,
    		tauBalance,
    		wallet,
    		houseVk,
    		getBalance,
    		houseBalance,
    		refreshBalance,
    		refreshJackpot
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentNetwork" in $$props) currentNetwork = $$props.currentNetwork;
    		if ("lamdenNetwork" in $$props) $$invalidate(3, lamdenNetwork = $$props.lamdenNetwork);
    		if ("tauBalance" in $$props) $$invalidate(0, tauBalance = $$props.tauBalance);
    		if ("wallet" in $$props) $$invalidate(1, wallet = $$props.wallet);
    		if ("houseVk" in $$props) houseVk = $$props.houseVk;
    		if ("houseBalance" in $$props) $$invalidate(2, houseBalance = $$props.houseBalance);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		tauBalance,
    		wallet,
    		houseBalance,
    		lamdenNetwork,
    		refreshBalance,
    		refreshJackpot,
    		prizeboard_houseBalance_binding,
    		walletconnect_tauBalance_binding,
    		walletconnect_wallet_binding,
    		walletbalance_tauBalance_binding,
    		click_handler,
    		console_walletStatus_binding,
    		console_houseBalance_binding,
    		jackpot_houseBalance_binding,
    		click_handler_1
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
