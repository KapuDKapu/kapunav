
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
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
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
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
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
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
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
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
        const prop_values = options.props || {};
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
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
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
            mount_component(component, options.target, options.anchor);
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
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

    var Token;
    (function (Token) {
        Token[Token["D0"] = 0] = "D0";
        Token[Token["D1"] = 1] = "D1";
        Token[Token["D2"] = 2] = "D2";
        Token[Token["D3"] = 3] = "D3";
        Token[Token["D4"] = 4] = "D4";
        Token[Token["D5"] = 5] = "D5";
        Token[Token["D6"] = 6] = "D6";
        Token[Token["D7"] = 7] = "D7";
        Token[Token["D8"] = 8] = "D8";
        Token[Token["D9"] = 9] = "D9";
        Token[Token["Dian"] = 10] = "Dian";
        Token[Token["Shi"] = 11] = "Shi";
        Token[Token["Bai"] = 12] = "Bai";
        Token[Token["Qian"] = 13] = "Qian";
        Token[Token["Wan"] = 14] = "Wan";
        Token[Token["Yi"] = 15] = "Yi";
    })(Token || (Token = {}));
    function parseTill10K(n) {
        if (n >= 10000 || n < 0) {
            throw `value must be between 0 and 10000 (n=${n})`;
        }
        const digits = [1000, 100, 10, 1].map(i => Math.floor(n / i) % 10).map(i => i);
        const ans = [];
        if (digits[0] != Token.D0) {
            ans.push(digits[0], Token.Qian);
        }
        if (digits[1] != Token.D0) {
            ans.push(digits[1], Token.Bai);
        }
        else if (digits[0] != Token.D0 && (digits[2] != Token.D0 || digits[3] != Token.D0)) {
            ans.push(Token.D0);
        }
        if (digits[2] == Token.D1 && digits[1] == Token.D0) {
            ans.push(Token.Shi);
        }
        else if (digits[2] != Token.D0) {
            ans.push(digits[2], Token.Shi);
        }
        else if (digits[1] != Token.D0 && digits[3] != Token.D0) {
            ans.push(Token.D0);
        }
        if (digits[3] != Token.D0 || digits.filter(d => d == Token.D0).length == digits.length) {
            ans.push(digits[3]);
        }
        return ans;
    }
    function splitToSections(n) {
        const i = Math.floor(n);
        const d = Math.round(n * 100) % 100;
        if (n < 0 || n > 999999999999.99) {
            throw `value must be between 0 and 9999_9999_9999.99 (n=${n})`;
        }
        return {
            yi: Math.floor(i / 100000000),
            wan: Math.floor(i / 10000) % 10000,
            yuan: i % 10000,
            jiao: Math.floor(d / 10),
            fen: d % 10,
        };
    }
    function needPrefixD0(n, largeSections) {
        return largeSections.some(i => i > 0) && n > 0 && n < 1000;
    }
    function parse(n) {
        if (Math.floor(n * 100) == 0) {
            return [Token.D0];
        }
        const sections = splitToSections(n);
        const tokenized = {
            yi: null, wan: null, yuan: null, jiao: null, fen: null
        };
        Object.keys(sections).map(s => tokenized[s] = parseTill10K(sections[s]));
        const ans = [];
        if (sections.yi > 0) {
            ans.splice(ans.length, 0, ...tokenized.yi);
            ans.push(Token.Yi);
        }
        if (needPrefixD0(sections.wan, [sections.yi,])) {
            ans.push(Token.D0);
        }
        if (sections.wan > 0) {
            ans.splice(ans.length, 0, ...tokenized.wan);
            ans.push(Token.Wan);
        }
        if (needPrefixD0(sections.yuan, [sections.yi, sections.wan,])) {
            ans.push(Token.D0);
        }
        if ([sections.yuan, sections.jiao, sections.fen].some(i => i > 0)) {
            ans.splice(ans.length, 0, ...tokenized.yuan);
        }
        if (sections.jiao > 0 || sections.fen > 0) {
            ans.push(Token.Dian);
            ans.splice(ans.length, 0, ...tokenized.jiao);
            if (sections.fen > 0) {
                ans.splice(ans.length, 0, ...tokenized.fen);
            }
        }
        return ans;
    }

    class TTSProvider {
    }
    class LocalAliPayTTS extends TTSProvider {
        constructor() {
            super(...arguments);
            this.base = 'build/assets/alipay/';
        }
        begin() {
            return [`${this.base}diaoluo_da.mp3`, `${this.base}tts_success.mp3`];
        }
        end() {
            return [`${this.base}tts_yuan.mp3`];
        }
        use(token) {
            const digitals = new Set([...Array(10).keys()].map((_, idx) => idx));
            const suffix = new Map([
                [Token.Dian, 'dot'],
                [Token.Shi, 'ten'],
                [Token.Bai, 'hundred'],
                [Token.Qian, 'thousand'],
                [Token.Wan, 'ten_thousand'],
                [Token.Yi, 'ten_million'],
            ]);
            if (digitals.has(token)) {
                return `${this.base}tts_${token}.mp3`;
            }
            if (suffix.has(token)) {
                return `${this.base}tts_${suffix.get(token)}.mp3`;
            }
            throw `invalid token ${token}`;
        }
    }
    const alipay = new LocalAliPayTTS();

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    		path: basedir,
    		exports: {},
    		require: function (path, base) {
    			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    		}
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var crunker = createCommonjsModule(function (module, exports) {
    !function(e,t){module.exports=t();}(window,(function(){return function(e){var t={};function n(o){if(t[o])return t[o].exports;var r=t[o]={i:o,l:!1,exports:{}};return e[o].call(r.exports,r,r.exports,n),r.l=!0,r.exports}return n.m=e,n.c=t,n.d=function(e,t,o){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:o});},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0});},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var o=Object.create(null);if(n.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)n.d(o,r,function(t){return e[t]}.bind(null,r));return o},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=1)}([function(e,t,n){!function(e,t,n,o){function r(e){return e&&"object"==typeof e&&"default"in e?e:{default:e}}var a=r(t),i=r(n),s=r(o),c=function(e,t,n){return {endTime:t,insertTime:n,type:"exponentialRampToValue",value:e}},u=function(e,t,n){return {endTime:t,insertTime:n,type:"linearRampToValue",value:e}},l=function(e,t){return {startTime:t,type:"setValue",value:e}},d=function(e,t,n){return {duration:n,startTime:t,type:"setValueCurve",values:e}},h=function(e,t,n){var o=n.startTime,r=n.target,a=n.timeConstant;return r+(t-r)*Math.exp((o-e)/a)},f=function(e){return "exponentialRampToValue"===e.type},p=function(e){return "linearRampToValue"===e.type},v=function(e){return f(e)||p(e)},m=function(e){return "setValue"===e.type},g=function(e){return "setValueCurve"===e.type},C=function e(t,n,o,r){var a=t[n];return void 0===a?r:v(a)||m(a)?a.value:g(a)?a.values[a.values.length-1]:h(o,e(t,n-1,a.startTime,r),a)},y=function(e,t,n,o,r){return void 0===n?[o.insertTime,r]:v(n)?[n.endTime,n.value]:m(n)?[n.startTime,n.value]:g(n)?[n.startTime+n.duration,n.values[n.values.length-1]]:[n.startTime,C(e,t-1,n.startTime,r)]},w=function(e){return "cancelAndHold"===e.type},_=function(e){return "cancelScheduledValues"===e.type},b=function(e){return w(e)||_(e)?e.cancelTime:f(e)||p(e)?e.endTime:e.startTime},M=function(e,t,n,o){var r=o.endTime,a=o.value;return n===a?a:0<n&&0<a||n<0&&a<0?n*Math.pow(a/n,(e-t)/(r-t)):0},A=function(e,t,n,o){return n+(e-t)/(o.endTime-t)*(o.value-n)},x=function(e,t){var n=Math.floor(t),o=Math.ceil(t);return n===o?e[n]:(1-(t-n))*e[n]+(1-(o-t))*e[o]},O=function(e,t){var n=t.duration,o=t.startTime,r=t.values,a=(e-o)/n*(r.length-1);return x(r,a)},E=function(e){return "setTarget"===e.type},I=function(){function e(t){i.default(this,e),this._automationEvents=[],this._currenTime=0,this._defaultValue=t;}return s.default(e,[{key:Symbol.iterator,value:function(){return this._automationEvents[Symbol.iterator]()}},{key:"add",value:function(e){var t=b(e);if(w(e)||_(e)){var n=this._automationEvents.findIndex((function(n){return _(e)&&g(n)?n.startTime+n.duration>=t:b(n)>=t})),o=this._automationEvents[n];if(-1!==n&&(this._automationEvents=this._automationEvents.slice(0,n)),w(e)){var r=this._automationEvents[this._automationEvents.length-1];if(void 0!==o&&v(o)){if(E(r))throw new Error("The internal list is malformed.");var a=g(r)?r.startTime+r.duration:b(r),i=g(r)?r.values[r.values.length-1]:r.value,s=f(o)?M(t,a,i,o):A(t,a,i,o),h=f(o)?c(s,t,this._currenTime):u(s,t,this._currenTime);this._automationEvents.push(h);}void 0!==r&&E(r)&&this._automationEvents.push(l(this.getValue(t),t)),void 0!==r&&g(r)&&r.startTime+r.duration>t&&(this._automationEvents[this._automationEvents.length-1]=d(new Float32Array([6,7]),r.startTime,t-r.startTime));}}else {var m=this._automationEvents.findIndex((function(e){return b(e)>t})),C=-1===m?this._automationEvents[this._automationEvents.length-1]:this._automationEvents[m-1];if(void 0!==C&&g(C)&&b(C)+C.duration>t)return !1;var y=f(e)?c(e.value,e.endTime,this._currenTime):p(e)?u(e.value,t,this._currenTime):e;if(-1===m)this._automationEvents.push(y);else {if(g(e)&&t+e.duration>b(this._automationEvents[m]))return !1;this._automationEvents.splice(m,0,y);}}return !0}},{key:"flush",value:function(e){var t=this._automationEvents.findIndex((function(t){return b(t)>e}));if(t>1){var n=this._automationEvents.slice(t-1),o=n[0];E(o)&&n.unshift(l(C(this._automationEvents,t-2,o.startTime,this._defaultValue),o.startTime)),this._automationEvents=n;}}},{key:"getValue",value:function(e){if(0===this._automationEvents.length)return this._defaultValue;var t=this._automationEvents[this._automationEvents.length-1],n=this._automationEvents.findIndex((function(t){return b(t)>e})),o=this._automationEvents[n],r=b(t)<=e?t:this._automationEvents[n-1];if(void 0!==r&&E(r)&&(void 0===o||!v(o)||o.insertTime>e))return h(e,C(this._automationEvents,n-2,r.startTime,this._defaultValue),r);if(void 0!==r&&m(r)&&(void 0===o||!v(o)))return r.value;if(void 0!==r&&g(r)&&(void 0===o||!v(o)||r.startTime+r.duration>e))return e<r.startTime+r.duration?O(e,r):r.values[r.values.length-1];if(void 0!==r&&v(r)&&(void 0===o||!v(o)))return r.value;if(void 0!==o&&f(o)){var i=y(this._automationEvents,n-1,r,o,this._defaultValue),s=a.default(i,2),c=s[0],u=s[1];return M(e,c,u,o)}if(void 0!==o&&p(o)){var l=y(this._automationEvents,n-1,r,o,this._defaultValue),d=a.default(l,2),w=d[0],_=d[1];return A(e,w,_,o)}return this._defaultValue}}]),e}(),N=function(e){return {cancelTime:e,type:"cancelAndHold"}},T=function(e){return {cancelTime:e,type:"cancelScheduledValues"}},S=function(e,t){return {endTime:t,type:"exponentialRampToValue",value:e}},k=function(e,t){return {endTime:t,type:"linearRampToValue",value:e}},D=function(e,t,n){return {startTime:t,target:e,timeConstant:n,type:"setTarget"}};e.AutomationEventList=I,e.createCancelAndHoldAutomationEvent=N,e.createCancelScheduledValuesAutomationEvent=T,e.createExponentialRampToValueAutomationEvent=S,e.createLinearRampToValueAutomationEvent=k,e.createSetTargetAutomationEvent=D,e.createSetValueAutomationEvent=l,e.createSetValueCurveAutomationEvent=d,Object.defineProperty(e,"__esModule",{value:!0});}(t,n(2),n(8),n(9));},function(e,t,n){Object.defineProperty(t,"__esModule",{value:!0});var o=function(){function e(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o);}}return function(t,n,o){return n&&e(t.prototype,n),o&&e(t,o),t}}();function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}var a=n(10).AudioContext,i=function(){function e(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},n=t.sampleRate,o=void 0===n?44100:n;r(this,e),this._sampleRate=o,this._context=this._createContext();}return o(e,[{key:"_createContext",value:function(){return new a}},{key:"fetchAudio",value:async function(){for(var e=this,t=arguments.length,n=Array(t),o=0;o<t;o++)n[o]=arguments[o];var r=n.map((async function(t){var n=await fetch(t).then((function(e){return e.arrayBuffer()}));return await e._context.decodeAudioData(n)}));return await Promise.all(r)}},{key:"mergeAudio",value:function(e){var t=this._context.createBuffer(1,this._sampleRate*this._maxDuration(e),this._sampleRate);return e.map((function(e){for(var n=e.getChannelData(0).length-1;n>=0;n--)t.getChannelData(0)[n]+=e.getChannelData(0)[n];})),t}},{key:"concatAudio",value:function(e){var t=this._context.createBuffer(1,this._totalLength(e),this._sampleRate),n=0;return e.map((function(e){t.getChannelData(0).set(e.getChannelData(0),n),n+=e.length;})),t}},{key:"play",value:function(e){var t=this._context.createBufferSource();return t.buffer=e,t.connect(this._context.destination),t.start(),t}},{key:"export",value:function(e,t){var n=t||"audio/mp3",o=this._interleave(e),r=this._writeHeaders(o),a=new Blob([r],{type:n});return {blob:a,url:this._renderURL(a),element:this._renderAudioElement(a,n)}}},{key:"download",value:function(e,t){var n=t||"crunker",o=document.createElement("a");return o.style="display: none",o.href=this._renderURL(e),o.download=n+"."+e.type.split("/")[1],o.click(),o}},{key:"notSupported",value:function(e){return !this._isSupported()&&e()}},{key:"close",value:function(){return this._context.close(),this}},{key:"_maxDuration",value:function(e){return Math.max.apply(Math,e.map((function(e){return e.duration})))}},{key:"_totalLength",value:function(e){return e.map((function(e){return e.length})).reduce((function(e,t){return e+t}),0)}},{key:"_isSupported",value:function(){return "AudioContext"in window}},{key:"_writeHeaders",value:function(e){var t=new ArrayBuffer(44+2*e.length),n=new DataView(t);return this._writeString(n,0,"RIFF"),n.setUint32(4,32+2*e.length,!0),this._writeString(n,8,"WAVE"),this._writeString(n,12,"fmt "),n.setUint32(16,16,!0),n.setUint16(20,1,!0),n.setUint16(22,2,!0),n.setUint32(24,this._sampleRate,!0),n.setUint32(28,4*this._sampleRate,!0),n.setUint16(32,4,!0),n.setUint16(34,16,!0),this._writeString(n,36,"data"),n.setUint32(40,2*e.length,!0),this._floatTo16BitPCM(n,e,44)}},{key:"_floatTo16BitPCM",value:function(e,t,n){for(var o=0;o<t.length;o++,n+=2){var r=Math.max(-1,Math.min(1,t[o]));e.setInt16(n,r<0?32768*r:32767*r,!0);}return e}},{key:"_writeString",value:function(e,t,n){for(var o=0;o<n.length;o++)e.setUint8(t+o,n.charCodeAt(o));}},{key:"_interleave",value:function(e){for(var t=e.getChannelData(0),n=2*t.length,o=new Float32Array(n),r=0,a=0;r<n;)o[r++]=t[a],o[r++]=t[a],a++;return o}},{key:"_renderAudioElement",value:function(e,t){var n=document.createElement("audio");return n.controls="controls",n.type=t,n.src=this._renderURL(e),n}},{key:"_renderURL",value:function(e){return (window.URL||window.webkitURL).createObjectURL(e)}}]),e}();t.default=i;},function(e,t,n){var o=n(3),r=n(4),a=n(5),i=n(7);e.exports=function(e,t){return o(e)||r(e,t)||a(e,t)||i()};},function(e,t){e.exports=function(e){if(Array.isArray(e))return e};},function(e,t){e.exports=function(e,t){if("undefined"!=typeof Symbol&&Symbol.iterator in Object(e)){var n=[],o=!0,r=!1,a=void 0;try{for(var i,s=e[Symbol.iterator]();!(o=(i=s.next()).done)&&(n.push(i.value),!t||n.length!==t);o=!0);}catch(e){r=!0,a=e;}finally{try{o||null==s.return||s.return();}finally{if(r)throw a}}return n}};},function(e,t,n){var o=n(6);e.exports=function(e,t){if(e){if("string"==typeof e)return o(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return "Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?o(e,t):void 0}};},function(e,t){e.exports=function(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,o=new Array(t);n<t;n++)o[n]=e[n];return o};},function(e,t){e.exports=function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")};},function(e,t){e.exports=function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")};},function(e,t){function n(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o);}}e.exports=function(e,t,o){return t&&n(e.prototype,t),o&&n(e,o),e};},function(e,t,n){n.r(t);var o=n(0);const r=new WeakSet,a=new WeakMap,i=new WeakMap,s=new WeakMap,c=new WeakMap,u=new WeakMap,l=new WeakMap,d=new WeakMap,h=new WeakMap,f=new WeakMap,p={construct:()=>p},v=/^import(?:(?:[\s]+[\w]+|(?:[\s]+[\w]+[\s]*,)?[\s]*\{[\s]*[\w]+(?:[\s]+as[\s]+[\w]+)?(?:[\s]*,[\s]*[\w]+(?:[\s]+as[\s]+[\w]+)?)*[\s]*}|(?:[\s]+[\w]+[\s]*,)?[\s]*\*[\s]+as[\s]+[\w]+)[\s]+from)?(?:[\s]*)("([^"\\]|\\.)+"|'([^'\\]|\\.)+')(?:[\s]*);?/,m=(e,t)=>{const n=[];let o=e.replace(/^[\s]+/,""),r=o.match(v);for(;null!==r;){const e=r[1].slice(1,-1),a=r[0].replace(/([\s]+)?;?$/,"").replace(e,new URL(e,t).toString());n.push(a),o=o.slice(r[0].length).replace(/^[\s]+/,""),r=o.match(v);}return [n.join(";"),o]},g=e=>{if(void 0!==e&&!Array.isArray(e))throw new TypeError("The parameterDescriptors property of given value for processorCtor is not an array.")},C=e=>{if(!(e=>{try{new new Proxy(e,p);}catch{return !1}return !0})(e))throw new TypeError("The given value for processorCtor should be a constructor.");if(null===e.prototype||"object"!=typeof e.prototype)throw new TypeError("The given value for processorCtor should have a prototype.")},y=(e,t)=>{const n=e.get(t);if(void 0===n)throw new Error("A value with the given key could not be found.");return n},w=(e,t)=>{const n=Array.from(e).filter(t);if(n.length>1)throw Error("More than one element was found.");if(0===n.length)throw Error("No element was found.");const[o]=n;return e.delete(o),o},_=(e,t,n,o)=>{const r=y(e,t),a=w(r,(e=>e[0]===n&&e[1]===o));return 0===r.size&&e.delete(t),a},b=e=>y(l,e),M=e=>{if(r.has(e))throw new Error("The AudioNode is already stored.");r.add(e),b(e).forEach((e=>e(!0)));},A=e=>"port"in e,x=e=>{if(!r.has(e))throw new Error("The AudioNode is not stored.");r.delete(e),b(e).forEach((e=>e(!1)));},O=(e,t)=>{!A(e)&&t.every((e=>0===e.size))&&x(e);},E={channelCount:2,channelCountMode:"max",channelInterpretation:"speakers",fftSize:2048,maxDecibels:-30,minDecibels:-100,smoothingTimeConstant:.8},I=(e,t)=>e.context===t,N=e=>{try{e.copyToChannel(new Float32Array(1),0,-1);}catch{return !1}return !0},T=()=>new DOMException("","IndexSizeError"),S=e=>{var t;e.getChannelData=(t=e.getChannelData,n=>{try{return t.call(e,n)}catch(e){if(12===e.code)throw T();throw e}});},k={numberOfChannels:1},D=-34028234663852886e22,R=-D,P=e=>r.has(e),L={buffer:null,channelCount:2,channelCountMode:"max",channelInterpretation:"speakers",loop:!1,loopEnd:0,loopStart:0,playbackRate:1},F=e=>y(a,e),W=e=>y(s,e),B=(e,t)=>{const{activeInputs:n}=F(e);n.forEach((n=>n.forEach((([n])=>{t.includes(e)||B(n,[...t,e]);}))));const o=(e=>"playbackRate"in e)(e)?[e.playbackRate]:A(e)?Array.from(e.parameters.values()):(e=>"frequency"in e&&"gain"in e)(e)?[e.Q,e.detune,e.frequency,e.gain]:(e=>"offset"in e)(e)?[e.offset]:(e=>!("frequency"in e)&&"gain"in e)(e)?[e.gain]:(e=>"detune"in e&&"frequency"in e)(e)?[e.detune,e.frequency]:(e=>"pan"in e)(e)?[e.pan]:[];for(const e of o){const n=W(e);void 0!==n&&n.activeInputs.forEach((([e])=>B(e,t)));}P(e)&&x(e);},V=e=>{B(e.destination,[]);},j=e=>void 0===e||"number"==typeof e||"string"==typeof e&&("balanced"===e||"interactive"===e||"playback"===e),q=e=>"context"in e,X=e=>q(e[0]),Y=(e,t,n,o)=>{for(const t of e)if(n(t)){if(o)return !1;throw Error("The set contains at least one similar element.")}return e.add(t),!0},Z=(e,t,[n,o],r)=>{Y(e,[t,n,o],(e=>e[0]===t&&e[1]===n),r);},G=(e,[t,n,o],r)=>{const a=e.get(t);void 0===a?e.set(t,new Set([[n,o]])):Y(a,[n,o],(e=>e[0]===n),r);},z=e=>"inputs"in e,U=(e,t,n,o)=>{if(z(t)){const r=t.inputs[o];return e.connect(r,n,0),[r,n,0]}return e.connect(t,n,o),[t,n,o]},H=(e,t,n)=>{for(const o of e)if(o[0]===t&&o[1]===n)return e.delete(o),o;return null},Q=(e,t)=>{if(!b(e).delete(t))throw new Error("Missing the expected event listener.")},$=(e,t,n)=>{const o=y(e,t),r=w(o,(e=>e[0]===n));return 0===o.size&&e.delete(t),r},J=(e,t,n,o)=>{z(t)?e.disconnect(t.inputs[o],n,0):e.disconnect(t,n,o);},K=e=>y(i,e),ee=e=>y(c,e),te=e=>d.has(e),ne=e=>!r.has(e),oe=e=>new Promise((t=>{const n=e.createScriptProcessor(256,1,1),o=e.createGain(),r=e.createBuffer(1,2,44100),a=r.getChannelData(0);a[0]=1,a[1]=1;const i=e.createBufferSource();i.buffer=r,i.loop=!0,i.connect(n).connect(e.destination),i.connect(o),i.disconnect(o),n.onaudioprocess=o=>{const r=o.inputBuffer.getChannelData(0);Array.prototype.some.call(r,(e=>1===e))?t(!0):t(!1),i.stop(),n.onaudioprocess=null,i.disconnect(n),n.disconnect(e.destination);},i.start();})),re=(e,t)=>{const n=new Map;for(const t of e)for(const e of t){const t=n.get(e);n.set(e,void 0===t?1:t+1);}n.forEach(((e,n)=>t(n,e)));},ae=e=>"context"in e,ie=(e,t,n,o)=>{const{activeInputs:r,passiveInputs:a}=W(t),{outputs:i}=F(e),s=b(e),c=i=>{const s=K(e),c=ee(t);if(i){const t=$(a,e,n);Z(r,e,t,!1),o||te(e)||s.connect(c,n);}else {const t=((e,t,n)=>w(e,(e=>e[0]===t&&e[1]===n)))(r,e,n);G(a,t,!1),o||te(e)||s.disconnect(c,n);}};return !!Y(i,[t,n],(e=>e[0]===t&&e[1]===n),!0)&&(s.add(c),P(e)?Z(r,e,[n,c],!0):G(a,[e,n,c],!0),!0)},se=(e,t,n,o,r)=>{const[a,i]=((e,t,n,o)=>{const{activeInputs:r,passiveInputs:a}=F(t),i=H(r[o],e,n);if(null===i)return [_(a,e,n,o)[2],!1];return [i[2],!0]})(e,n,o,r);if(null!==a&&(Q(e,a),!i||t||te(e)||J(K(e),K(n),o,r)),P(n)){const{activeInputs:e}=F(n);O(n,e);}},ce=(e,t,n,o)=>{const[r,a]=((e,t,n)=>{const{activeInputs:o,passiveInputs:r}=W(t),a=H(o,e,n);if(null===a)return [$(r,e,n)[1],!1];return [a[2],!0]})(e,n,o);null!==r&&(Q(e,r),!a||t||te(e)||K(e).disconnect(ee(n),o));};class ue{constructor(e){this._map=new Map(e);}get size(){return this._map.size}entries(){return this._map.entries()}forEach(e,t=null){return this._map.forEach(((n,o)=>e.call(t,n,o,this)))}get(e){return this._map.get(e)}has(e){return this._map.has(e)}keys(){return this._map.keys()}values(){return this._map.values()}}const le={channelCount:2,channelCountMode:"explicit",channelInterpretation:"speakers",numberOfInputs:1,numberOfOutputs:1,parameterData:{},processorOptions:{}};function de(e,t,n,o,r){if("function"==typeof e.copyFromChannel)0===t[n].byteLength&&(t[n]=new Float32Array(128)),e.copyFromChannel(t[n],o,r);else {const a=e.getChannelData(o);if(0===t[n].byteLength)t[n]=a.slice(r,r+128);else {const e=new Float32Array(a.buffer,r*Float32Array.BYTES_PER_ELEMENT,128);t[n].set(e);}}}const he=(e,t,n,o,r)=>{"function"==typeof e.copyToChannel?0!==t[n].byteLength&&e.copyToChannel(t[n],o,r):0!==t[n].byteLength&&e.getChannelData(o).set(t[n],r);},fe=(e,t)=>{const n=[];for(let o=0;o<e;o+=1){const e=[],r="number"==typeof t?t:t[o];for(let t=0;t<r;t+=1)e.push(new Float32Array(128));n.push(e);}return n},pe=async(e,t,n,o,r,a,i)=>{const s=null===t?128*Math.ceil(e.context.length/128):t.length,c=o.channelCount*o.numberOfInputs,u=r.reduce(((e,t)=>e+t),0),l=0===u?null:n.createBuffer(u,s,n.sampleRate);if(void 0===a)throw new Error("Missing the processor constructor.");const d=F(e),h=await((e,t)=>{const n=y(f,e),o=K(t);return y(n,o)})(n,e),p=fe(o.numberOfInputs,o.channelCount),v=fe(o.numberOfOutputs,r),m=Array.from(e.parameters.keys()).reduce(((e,t)=>({...e,[t]:new Float32Array(128)})),{});for(let u=0;u<s;u+=128){if(o.numberOfInputs>0&&null!==t)for(let e=0;e<o.numberOfInputs;e+=1)for(let n=0;n<o.channelCount;n+=1)de(t,p[e],n,n,u);void 0!==a.parameterDescriptors&&null!==t&&a.parameterDescriptors.forEach((({name:e},n)=>{de(t,m,e,c+n,u);}));for(let e=0;e<o.numberOfInputs;e+=1)for(let t=0;t<r[e];t+=1)0===v[e][t].byteLength&&(v[e][t]=new Float32Array(128));try{const e=p.map(((e,t)=>0===d.activeInputs[t].size?[]:e)),t=i(u/n.sampleRate,n.sampleRate,(()=>h.process(e,v,m)));if(null!==l)for(let e=0,t=0;e<o.numberOfOutputs;e+=1){for(let n=0;n<r[e];n+=1)he(l,v[e],n,t+n,u);t+=r[e];}if(!t)break}catch(t){e.dispatchEvent(new ErrorEvent("processorerror",{colno:t.colno,filename:t.filename,lineno:t.lineno,message:t.message}));break}}return l},ve={Q:1,channelCount:2,channelCountMode:"max",channelInterpretation:"speakers",detune:0,frequency:350,gain:0,type:"lowpass"},me={channelCount:1,channelCountMode:"explicit",channelInterpretation:"speakers",numberOfInputs:6},ge={channelCount:6,channelCountMode:"explicit",channelInterpretation:"discrete",numberOfOutputs:6},Ce={channelCount:2,channelCountMode:"max",channelInterpretation:"speakers",offset:1},ye={buffer:null,channelCount:2,channelCountMode:"clamped-max",channelInterpretation:"speakers",disableNormalization:!1},we={channelCount:2,channelCountMode:"max",channelInterpretation:"speakers",delayTime:0,maxDelayTime:1},_e=(e,t,n)=>{const o=t[n];if(void 0===o)throw e();return o},be={attack:.003,channelCount:2,channelCountMode:"clamped-max",channelInterpretation:"speakers",knee:30,ratio:12,release:.25,threshold:-24},Me={channelCount:2,channelCountMode:"max",channelInterpretation:"speakers",gain:1},Ae=()=>new DOMException("","InvalidStateError"),xe=()=>new DOMException("","InvalidAccessError"),Oe={channelCount:2,channelCountMode:"max",channelInterpretation:"speakers"},Ee=(e,t,n,o,r,a,i,s,c,u,l)=>{const d=u.length;let h=s;for(let s=0;s<d;s+=1){let d=n[0]*u[s];for(let t=1;t<r;t+=1){const o=h-t&c-1;d+=n[t]*a[o],d-=e[t]*i[o];}for(let e=r;e<o;e+=1)d+=n[e]*a[h-e&c-1];for(let n=r;n<t;n+=1)d-=e[n]*i[h-n&c-1];a[h]=u[s],i[h]=d,h=h+1&c-1,l[s]=d;}return h},Ie={channelCount:2,channelCountMode:"explicit",channelInterpretation:"speakers"},Ne=e=>{const t=new Uint32Array([1179011410,40,1163280727,544501094,16,131073,44100,176400,1048580,1635017060,4,0]);try{const n=e.decodeAudioData(t.buffer,(()=>{}));return void 0!==n&&(n.catch((()=>{})),!0)}catch{}return !1},Te={numberOfChannels:1},Se=(e,t,n)=>{const o=t[n];void 0!==o&&o!==e[n]&&(e[n]=o);},ke=(e,t)=>{Se(e,t,"channelCount"),Se(e,t,"channelCountMode"),Se(e,t,"channelInterpretation");},De=e=>"function"==typeof e.getFloatTimeDomainData,Re=(e,t,n)=>{const o=t[n];void 0!==o&&o!==e[n].value&&(e[n].value=o);},Pe=e=>{var t;e.start=(t=e.start,(n=0,o=0,r)=>{if("number"==typeof r&&r<0||o<0||n<0)throw new RangeError("The parameters can't be negative.");t.call(e,n,o,r);});},Le=e=>{var t;e.stop=(t=e.stop,(n=0)=>{if(n<0)throw new RangeError("The parameter can't be negative.");t.call(e,n);});},Fe=(e,t)=>null===e?512:Math.max(512,Math.min(16384,Math.pow(2,Math.round(Math.log2(e*t))))),We=async(e,t)=>new e(await(e=>new Promise(((t,n)=>{const{port1:o,port2:r}=new MessageChannel;o.onmessage=({data:e})=>{o.close(),r.close(),t(e);},o.onmessageerror=({data:e})=>{o.close(),r.close(),n(e);},r.postMessage(e);})))(t)),Be=(e,t)=>{const n=e.createBiquadFilter();return ke(n,t),Re(n,t,"Q"),Re(n,t,"detune"),Re(n,t,"frequency"),Re(n,t,"gain"),Se(n,t,"type"),n},Ve=(e,t)=>{const n=e.createChannelSplitter(t.numberOfOutputs);return ke(n,t),(e=>{const t=e.numberOfOutputs;Object.defineProperty(e,"channelCount",{get:()=>t,set:e=>{if(e!==t)throw Ae()}}),Object.defineProperty(e,"channelCountMode",{get:()=>"explicit",set:e=>{if("explicit"!==e)throw Ae()}}),Object.defineProperty(e,"channelInterpretation",{get:()=>"discrete",set:e=>{if("discrete"!==e)throw Ae()}});})(n),n},je=(e,t)=>(e.connect=t.connect.bind(t),e.disconnect=t.disconnect.bind(t),e),qe=(e,t)=>{const n=e.createDelay(t.maxDelayTime);return ke(n,t),Re(n,t,"delayTime"),n},Xe=(e,t)=>{const n=e.createGain();return ke(n,t),Re(n,t,"gain"),n};function Ye(e,t){const n=t[0]*t[0]+t[1]*t[1];return [(e[0]*t[0]+e[1]*t[1])/n,(e[1]*t[0]-e[0]*t[1])/n]}function Ze(e,t){let n=[0,0];for(let a=e.length-1;a>=0;a-=1)r=t,n=[(o=n)[0]*r[0]-o[1]*r[1],o[0]*r[1]+o[1]*r[0]],n[0]+=e[a];var o,r;return n}const Ge=(e,t,n,o)=>e.createScriptProcessor(t,n,o),ze=()=>new DOMException("","NotSupportedError"),Ue={numberOfChannels:1},He={channelCount:2,channelCountMode:"max",channelInterpretation:"speakers",detune:0,frequency:440,periodicWave:void 0,type:"sine"},Qe={channelCount:2,channelCountMode:"clamped-max",channelInterpretation:"speakers",coneInnerAngle:360,coneOuterAngle:360,coneOuterGain:0,distanceModel:"inverse",maxDistance:1e4,orientationX:1,orientationY:0,orientationZ:0,panningModel:"equalpower",positionX:0,positionY:0,positionZ:0,refDistance:1,rolloffFactor:1},$e={disableNormalization:!1},Je={channelCount:2,channelCountMode:"explicit",channelInterpretation:"speakers",pan:0},Ke=()=>new DOMException("","UnknownError"),et={channelCount:2,channelCountMode:"max",channelInterpretation:"speakers",curve:null,oversample:"none"},tt=e=>{if(null===e)return !1;const t=e.length;return t%2!=0?0!==e[Math.floor(t/2)]:e[t/2-1]+e[t/2]!==0},nt=(e,t,n,o)=>{let r=Object.getPrototypeOf(e);for(;!r.hasOwnProperty(t);)r=Object.getPrototypeOf(r);const{get:a,set:i}=Object.getOwnPropertyDescriptor(r,t);Object.defineProperty(e,t,{get:n(a),set:o(i)});},ot=e=>{const t=e.createOscillator();try{t.start(-1);}catch(e){return e instanceof RangeError}return !1},rt=e=>{const t=e.createBuffer(1,1,44100),n=e.createBufferSource();n.buffer=t,n.start(),n.stop();try{return n.stop(),!0}catch{return !1}},at=e=>{const t=e.createOscillator();try{t.stop(-1);}catch(e){return e instanceof RangeError}return !1},it=()=>{try{new DOMException;}catch{return !1}return !0},st=()=>new Promise((e=>{const t=new ArrayBuffer(0),{port1:n,port2:o}=new MessageChannel;n.onmessage=({data:t})=>e(null!==t),o.postMessage(t,[t]);})),ct=(e,t)=>{const n=t.createGain();e.connect(n);const o=(r=e.disconnect,()=>{r.call(e,n),e.removeEventListener("ended",o);});var r;e.addEventListener("ended",o),je(e,n),e.stop=(t=>{let o=!1;return (r=0)=>{if(o)try{t.call(e,r);}catch{n.gain.setValueAtTime(0,r);}else t.call(e,r),o=!0;}})(e.stop);},ut=(e,t)=>n=>{const o={value:e};return Object.defineProperties(n,{currentTarget:o,target:o}),"function"==typeof t?t.call(e,n):t.handleEvent.call(e,n)};n.d(t,"AnalyserNode",(function(){return Zt})),n.d(t,"AudioBuffer",(function(){return Jt})),n.d(t,"AudioBufferSourceNode",(function(){return dn})),n.d(t,"addAudioWorkletModule",(function(){return mo})),n.d(t,"decodeAudioData",(function(){return Co})),n.d(t,"AudioContext",(function(){return Ao})),n.d(t,"AudioWorkletNode",(function(){return Bo})),n.d(t,"BiquadFilterNode",(function(){return vn})),n.d(t,"ChannelMergerNode",(function(){return Nn})),n.d(t,"ChannelSplitterNode",(function(){return Tn})),n.d(t,"ConvolverNode",(function(){return Pn})),n.d(t,"ConstantSourceNode",(function(){return Dn})),n.d(t,"DelayNode",(function(){return Ln})),n.d(t,"DynamicsCompressorNode",(function(){return Bn})),n.d(t,"GainNode",(function(){return Vn})),n.d(t,"IIRFilterNode",(function(){return Zn})),n.d(t,"MediaElementAudioSourceNode",(function(){return wo})),n.d(t,"MediaStreamAudioDestinationNode",(function(){return _o})),n.d(t,"MediaStreamAudioSourceNode",(function(){return bo})),n.d(t,"MediaStreamTrackAudioSourceNode",(function(){return Mo})),n.d(t,"MinimalAudioContext",(function(){return Vo})),n.d(t,"MinimalOfflineAudioContext",(function(){return Xo})),n.d(t,"OfflineAudioContext",(function(){return Yo})),n.d(t,"OscillatorNode",(function(){return Qn})),n.d(t,"PannerNode",(function(){return ro})),n.d(t,"PeriodicWave",(function(){return ao})),n.d(t,"StereoPannerNode",(function(){return so})),n.d(t,"WaveShaperNode",(function(){return uo})),n.d(t,"isAnyAudioContext",(function(){return Zo})),n.d(t,"isAnyAudioNode",(function(){return Go})),n.d(t,"isAnyAudioParam",(function(){return Ho})),n.d(t,"isAnyOfflineAudioContext",(function(){return Jo})),n.d(t,"isSupported",(function(){return Ko}));const lt=(dt=Y,(e,t,[n,o,r],a)=>{dt(e[o],[t,n,r],(e=>e[0]===t&&e[1]===n),a);});var dt;const ht=(e=>(t,n,[o,r,a],i)=>{const s=t.get(o);void 0===s?t.set(o,new Set([[r,n,a]])):e(s,[r,n,a],(e=>e[0]===r&&e[1]===n),i);})(Y),ft=(e=>(t,n,o,r)=>e(t[r],(e=>e[0]===n&&e[1]===o)))(w),pt=new WeakMap,vt=(e=>t=>{var n;return null!==(n=e.get(t))&&void 0!==n?n:0})(pt),mt=(gt=new Map,Ct=new WeakMap,(e,t)=>{const n=Ct.get(e);if(void 0!==n)return n;const o=gt.get(e);if(void 0!==o)return o;try{const n=t();return n instanceof Promise?(gt.set(e,n),n.catch((()=>!1)).then((t=>(gt.delete(e),Ct.set(e,t),t)))):(Ct.set(e,n),n)}catch{return Ct.set(e,!1),!1}});var gt,Ct;const yt="undefined"==typeof window?null:window,wt=(_t=mt,bt=T,(e,t)=>{const n=e.createAnalyser();if(ke(n,t),!(t.maxDecibels>t.minDecibels))throw bt();return Se(n,t,"fftSize"),Se(n,t,"maxDecibels"),Se(n,t,"minDecibels"),Se(n,t,"smoothingTimeConstant"),_t(De,(()=>De(n)))||(e=>{e.getFloatTimeDomainData=t=>{const n=new Uint8Array(t.length);e.getByteTimeDomainData(n);const o=Math.max(n.length,e.fftSize);for(let e=0;e<o;e+=1)t[e]=.0078125*(n[e]-128);return t};})(n),n});var _t,bt;const Mt=(At=F,e=>{const t=At(e);if(null===t.renderer)throw new Error("Missing the renderer of the given AudioNode in the audio graph.");return t.renderer});var At;const xt=((e,t,n)=>async(o,r,a,i)=>{const s=e(o),c=[...i,o];await Promise.all(s.activeInputs.map(((e,i)=>Array.from(e).filter((([e])=>!c.includes(e))).map((async([e,s])=>{const u=t(e),l=await u.render(e,r,c),d=o.context.destination;n(e)||o===d&&n(o)||l.connect(a,s,i);})))).reduce(((e,t)=>[...e,...t]),[]));})(F,Mt,te),Ot=(Et=wt,It=K,Nt=xt,()=>{const e=new WeakMap;return {render(t,n,o){const r=e.get(n);return void 0!==r?Promise.resolve(r):(async(t,n,o)=>{let r=It(t);if(!I(r,n)){const e={channelCount:r.channelCount,channelCountMode:r.channelCountMode,channelInterpretation:r.channelInterpretation,fftSize:r.fftSize,maxDecibels:r.maxDecibels,minDecibels:r.minDecibels,smoothingTimeConstant:r.smoothingTimeConstant};r=Et(n,e);}return e.set(n,r),await Nt(t,n,r,o),r})(t,n,o)}}});var Et,It,Nt;const Tt=(St=u,e=>{const t=St.get(e);if(void 0===t)throw Ae();return t});var St;const kt=(e=>null===e?null:e.hasOwnProperty("OfflineAudioContext")?e.OfflineAudioContext:e.hasOwnProperty("webkitOfflineAudioContext")?e.webkitOfflineAudioContext:null)(yt),Dt=(Rt=kt,e=>null!==Rt&&e instanceof Rt);var Rt;const Pt=new WeakMap,Lt=(Ft=ut,class{constructor(e){this._nativeEventTarget=e,this._listeners=new WeakMap;}addEventListener(e,t,n){if(null!==t){let o=this._listeners.get(t);void 0===o&&(o=Ft(this,t),"function"==typeof t&&this._listeners.set(t,o)),this._nativeEventTarget.addEventListener(e,o,n);}}dispatchEvent(e){return this._nativeEventTarget.dispatchEvent(e)}removeEventListener(e,t,n){const o=null===t?void 0:this._listeners.get(t);this._nativeEventTarget.removeEventListener(e,void 0===o?null:o,n);}});var Ft;const Wt=(e=>null===e?null:e.hasOwnProperty("AudioContext")?e.AudioContext:e.hasOwnProperty("webkitAudioContext")?e.webkitAudioContext:null)(yt),Bt=(Vt=Wt,e=>null!==Vt&&e instanceof Vt);var Vt;const jt=(e=>t=>null!==e&&"function"==typeof e.AudioNode&&t instanceof e.AudioNode)(yt),qt=(e=>t=>null!==e&&"function"==typeof e.AudioParam&&t instanceof e.AudioParam)(yt),Xt=((e,t,n,o,r,a,s,c,u,d,h,f,p,v,m)=>class extends d{constructor(t,o,r,a){super(r),this._context=t,this._nativeAudioNode=r;const s=h(t);f(s)&&!0!==n(oe,(()=>oe(s)))&&(e=>{const t=new Map;var n,o;e.connect=(n=e.connect.bind(e),(e,o=0,r=0)=>{const a=ae(e)?n(e,o,r):n(e,o),i=t.get(e);return void 0===i?t.set(e,[{input:r,output:o}]):i.every((e=>e.input!==r||e.output!==o))&&i.push({input:r,output:o}),a}),e.disconnect=(o=e.disconnect,(n,r,a)=>{if(o.apply(e),void 0===n)t.clear();else if("number"==typeof n)for(const[e,o]of t){const r=o.filter((e=>e.output!==n));0===r.length?t.delete(e):t.set(e,r);}else if(t.has(n))if(void 0===r)t.delete(n);else {const e=t.get(n);if(void 0!==e){const o=e.filter((e=>e.output!==r&&(e.input!==a||void 0===a)));0===o.length?t.delete(n):t.set(n,o);}}for(const[n,o]of t)o.forEach((t=>{ae(n)?e.connect(n,t.output,t.input):e.connect(n,t.output);}));});})(r),i.set(this,r),l.set(this,new Set),"closed"!==t.state&&o&&M(this),e(this,a,r);}get channelCount(){return this._nativeAudioNode.channelCount}set channelCount(e){this._nativeAudioNode.channelCount=e;}get channelCountMode(){return this._nativeAudioNode.channelCountMode}set channelCountMode(e){this._nativeAudioNode.channelCountMode=e;}get channelInterpretation(){return this._nativeAudioNode.channelInterpretation}set channelInterpretation(e){this._nativeAudioNode.channelInterpretation=e;}get context(){return this._context}get numberOfInputs(){return this._nativeAudioNode.numberOfInputs}get numberOfOutputs(){return this._nativeAudioNode.numberOfOutputs}connect(e,n=0,i=0){if(n<0||n>=this._nativeAudioNode.numberOfOutputs)throw r();const c=h(this._context),l=m(c);if(p(e)||v(e))throw a();if(q(e)){const r=K(e);try{const t=U(this._nativeAudioNode,r,n,i),o=ne(this);(l||o)&&this._nativeAudioNode.disconnect(...t),"closed"!==this.context.state&&!o&&ne(e)&&M(e);}catch(e){if(12===e.code)throw a();throw e}if(t(this,e,n,i,l)){const t=u([this],e);re(t,o(l));}return e}const d=ee(e);if("playbackRate"===d.name)throw s();try{this._nativeAudioNode.connect(d,n),(l||ne(this))&&this._nativeAudioNode.disconnect(d,n);}catch(e){if(12===e.code)throw a();throw e}if(ie(this,e,n,l)){const t=u([this],e);re(t,o(l));}}disconnect(e,t,n){let o;const i=h(this._context),s=m(i);if(void 0===e)o=((e,t)=>{const n=F(e),o=[];for(const r of n.outputs)X(r)?se(e,t,...r):ce(e,t,...r),o.push(r[0]);return n.outputs.clear(),o})(this,s);else if("number"==typeof e){if(e<0||e>=this.numberOfOutputs)throw r();o=((e,t,n)=>{const o=F(e),r=[];for(const a of o.outputs)a[1]===n&&(X(a)?se(e,t,...a):ce(e,t,...a),r.push(a[0]),o.outputs.delete(a));return r})(this,s,e);}else {if(void 0!==t&&(t<0||t>=this.numberOfOutputs))throw r();if(q(e)&&void 0!==n&&(n<0||n>=e.numberOfInputs))throw r();if(o=((e,t,n,o,r)=>{const a=F(e);return Array.from(a.outputs).filter((e=>!(e[0]!==n||void 0!==o&&e[1]!==o||void 0!==r&&e[2]!==r))).map((n=>(X(n)?se(e,t,...n):ce(e,t,...n),a.outputs.delete(n),n[0])))})(this,s,e,t,n),0===o.length)throw a()}for(const e of o){const t=u([this],e);re(t,c);}}})((Yt=a,(e,t,n)=>{const o=[];for(let e=0;e<n.numberOfInputs;e+=1)o.push(new Set);Yt.set(e,{activeInputs:o,outputs:new Set,passiveInputs:new WeakMap,renderer:t});}),((e,t,n,o,r,a,i,s,c,u,l,d,h)=>(f,p,v,m,g)=>{const{activeInputs:C,passiveInputs:y}=a(p),{outputs:w}=a(f),b=s(f),A=a=>{const s=c(p),u=c(f);if(a){const t=_(y,f,v,m);e(C,f,t,!1),g||d(f)||n(u,s,v,m),h(p)&&M(p);}else {const e=o(C,f,v,m);t(y,m,e,!1),g||d(f)||r(u,s,v,m);const n=i(p);0===n?l(p)&&O(p,C):setTimeout((()=>{l(p)&&O(p,C);}),1e3*n);}};return !!u(w,[p,v,m],(e=>e[0]===p&&e[1]===v&&e[2]===m),!0)&&(b.add(A),l(f)?e(C,f,[v,m,A],!0):t(y,m,[f,v,A],!0),!0)})(lt,ht,U,ft,J,F,vt,b,K,Y,P,te,ne),mt,((e,t,n,o,r,a)=>i=>(s,c)=>{const u=e.get(s);if(void 0===u){if(!i&&a(s)){const e=o(s),{outputs:a}=n(s);for(const n of a)if(X(n)){const r=o(n[0]);t(e,r,n[1],n[2]);}else {const t=r(n[0]);e.disconnect(t,n[1]);}}e.set(s,c);}else e.set(s,u+c);})(d,J,F,K,ee,P),T,xe,ze,((e,t,n,o,r,a,i,s)=>(c,u)=>{const l=t.get(c);if(void 0===l)throw new Error("Missing the expected cycle count.");const d=a(c.context),h=s(d);if(l===u){if(t.delete(c),!h&&i(c)){const t=o(c),{outputs:a}=n(c);for(const n of a)if(X(n)){const r=o(n[0]);e(t,r,n[1],n[2]);}else {const e=r(n[0]);t.connect(e,n[1]);}}}else t.set(c,l-u);})(U,d,F,K,ee,Tt,P,Dt),((e,t,n)=>function o(r,a){const i=q(a)?a:n(e,a);if((e=>"delayTime"in e)(i))return [];if(r[0]===i)return [r];if(r.includes(i))return [];const{outputs:s}=t(i);return Array.from(s).map((e=>o([...r,i],e[0]))).reduce(((e,t)=>e.concat(t)),[])})(Pt,F,y),Lt,Tt,Bt,jt,qt,Dt);var Yt;const Zt=((e,t,n,o,r,a)=>class extends e{constructor(e,n){const i=r(e),s={...E,...n},c=o(i,s);super(e,!1,c,a(i)?t():null),this._nativeAnalyserNode=c;}get fftSize(){return this._nativeAnalyserNode.fftSize}set fftSize(e){this._nativeAnalyserNode.fftSize=e;}get frequencyBinCount(){return this._nativeAnalyserNode.frequencyBinCount}get maxDecibels(){return this._nativeAnalyserNode.maxDecibels}set maxDecibels(e){const t=this._nativeAnalyserNode.maxDecibels;if(this._nativeAnalyserNode.maxDecibels=e,!(e>this._nativeAnalyserNode.minDecibels))throw this._nativeAnalyserNode.maxDecibels=t,n()}get minDecibels(){return this._nativeAnalyserNode.minDecibels}set minDecibels(e){const t=this._nativeAnalyserNode.minDecibels;if(this._nativeAnalyserNode.minDecibels=e,!(this._nativeAnalyserNode.maxDecibels>e))throw this._nativeAnalyserNode.minDecibels=t,n()}get smoothingTimeConstant(){return this._nativeAnalyserNode.smoothingTimeConstant}set smoothingTimeConstant(e){this._nativeAnalyserNode.smoothingTimeConstant=e;}getByteFrequencyData(e){this._nativeAnalyserNode.getByteFrequencyData(e);}getByteTimeDomainData(e){this._nativeAnalyserNode.getByteTimeDomainData(e);}getFloatFrequencyData(e){this._nativeAnalyserNode.getFloatFrequencyData(e);}getFloatTimeDomainData(e){this._nativeAnalyserNode.getFloatTimeDomainData(e);}})(Xt,Ot,T,wt,Tt,Dt),Gt=new WeakSet,zt=(e=>null===e?null:e.hasOwnProperty("AudioBuffer")?e.AudioBuffer:null)(yt),Ut=(Ht=new Uint32Array(1),e=>(Ht[0]=e,Ht[0]));var Ht;const Qt=((e,t)=>n=>{n.copyFromChannel=(o,r,a=0)=>{const i=e(a),s=e(r);if(s>=n.numberOfChannels)throw t();const c=n.length,u=n.getChannelData(s),l=o.length;for(let e=i<0?-i:0;e+i<c&&e<l;e+=1)o[e]=u[e+i];},n.copyToChannel=(o,r,a=0)=>{const i=e(a),s=e(r);if(s>=n.numberOfChannels)throw t();const c=n.length,u=n.getChannelData(s),l=o.length;for(let e=i<0?-i:0;e+i<c&&e<l;e+=1)u[e+i]=o[e];};})(Ut,T),$t=(e=>t=>{t.copyFromChannel=(n=>(o,r,a=0)=>{const i=e(a),s=e(r);if(i<t.length)return n.call(t,o,s,i)})(t.copyFromChannel),t.copyToChannel=(n=>(o,r,a=0)=>{const i=e(a),s=e(r);if(i<t.length)return n.call(t,o,s,i)})(t.copyToChannel);})(Ut),Jt=((e,t,n,o,r,a,i,s)=>{let c=null;return class u{constructor(u){if(null===r)throw new Error("Missing the native OfflineAudioContext constructor.");const{length:l,numberOfChannels:d,sampleRate:h}={...k,...u};null===c&&(c=new r(1,1,44100));const f=null!==o&&t(a,a)?new o({length:l,numberOfChannels:d,sampleRate:h}):c.createBuffer(d,l,h);if(0===f.numberOfChannels)throw n();return "function"!=typeof f.copyFromChannel?(i(f),S(f)):t(N,(()=>N(f)))||s(f),e.add(f),f}static[Symbol.hasInstance](t){return null!==t&&"object"==typeof t&&Object.getPrototypeOf(t)===u.prototype||e.has(t)}}})(Gt,mt,ze,zt,kt,(Kt=zt,()=>{if(null===Kt)return !1;try{new Kt({length:1,sampleRate:44100});}catch{return !1}return !0}),Qt,$t);var Kt;const en=(tn=Xe,(e,t)=>{const n=tn(e,{channelCount:1,channelCountMode:"explicit",channelInterpretation:"discrete",gain:0});t.connect(n).connect(e.destination);const o=()=>{t.removeEventListener("ended",o),t.disconnect(n),n.disconnect();};t.addEventListener("ended",o);});var tn;const nn=((e,t,n)=>async(o,r,a,i)=>{const s=t(o);await Promise.all(Array.from(s.activeInputs).map((async([t,o])=>{const s=e(t),c=await s.render(t,r,i);n(t)||c.connect(a,o);})));})(Mt,W,te),on=(e=>(t,n,o,r)=>e(n,t,o,r))(nn),rn=((e,t,n,o,r,a,i,s,c,u,l)=>(d,h)=>{const f=d.createBufferSource();return ke(f,h),Re(f,h,"playbackRate"),Se(f,h,"buffer"),Se(f,h,"loop"),Se(f,h,"loopEnd"),Se(f,h,"loopStart"),t(n,(()=>n(d)))||(e=>{e.start=(t=>{let n=!1;return (o=0,r=0,a)=>{if(n)throw Ae();t.call(e,o,r,a),n=!0;}})(e.start);})(f),t(o,(()=>o(d)))||c(f),t(r,(()=>r(d)))||u(f,d),t(a,(()=>a(d)))||Pe(f),t(i,(()=>i(d)))||l(f,d),t(s,(()=>s(d)))||Le(f),e(d,f),f})(en,mt,(e=>{const t=e.createBufferSource();t.start();try{t.start();}catch{return !0}return !1}),(e=>{const t=e.createBufferSource(),n=e.createBuffer(1,1,44100);t.buffer=n;try{t.start(0,1);}catch{return !1}return !0}),(e=>{const t=e.createBufferSource();t.start();try{t.stop();}catch{return !1}return !0}),ot,rt,at,(e=>{var t;e.start=(t=e.start,(n=0,o=0,r)=>{const a=e.buffer,i=null===a?o:Math.min(a.duration,o);null!==a&&i>a.duration-.5/e.context.sampleRate?t.call(e,n,0,0):t.call(e,n,i,r);});}),(an=nt,(e,t)=>{const n=t.createBuffer(1,1,44100);null===e.buffer&&(e.buffer=n),an(e,"buffer",(t=>()=>{const o=t.call(e);return o===n?null:o}),(t=>o=>t.call(e,null===o?n:o)));}),ct);var an;const sn=((e,t)=>(n,o,r,a)=>(e(o).replay(r),t(o,n,r,a)))((e=>t=>{const n=e(t);if(null===n.renderer)throw new Error("Missing the renderer of the given AudioParam in the audio graph.");return n.renderer})(W),nn),cn=((e,t,n,o,r)=>()=>{const a=new WeakMap;let i=null,s=null;return {set start(e){i=e;},set stop(e){s=e;},render(c,u,l){const d=a.get(u);return void 0!==d?Promise.resolve(d):(async(c,u,l)=>{let d=n(c);const h=I(d,u);if(!h){const e={buffer:d.buffer,channelCount:d.channelCount,channelCountMode:d.channelCountMode,channelInterpretation:d.channelInterpretation,loop:d.loop,loopEnd:d.loopEnd,loopStart:d.loopStart,playbackRate:d.playbackRate.value};d=t(u,e),null!==i&&d.start(...i),null!==s&&d.stop(s);}return a.set(u,d),h?await e(u,c.playbackRate,d.playbackRate,l):await o(u,c.playbackRate,d.playbackRate,l),await r(c,u,d,l),d})(c,u,l)}}})(on,rn,K,sn,xt),un=((e,t,n,r,a,i,s,c,u,l,d,h)=>(f,p,v,m=null,g=null)=>{const C=new o.AutomationEventList(v.defaultValue),y=p?r(C):null,w={get defaultValue(){return v.defaultValue},get maxValue(){return null===m?v.maxValue:m},get minValue(){return null===g?v.minValue:g},get value(){return v.value},set value(e){v.value=e,w.setValueAtTime(e,f.context.currentTime);},cancelAndHoldAtTime(e){if("function"==typeof v.cancelAndHoldAtTime)null===y&&C.flush(f.context.currentTime),C.add(a(e)),v.cancelAndHoldAtTime(e);else {const t=Array.from(C).pop();null===y&&C.flush(f.context.currentTime),C.add(a(e));const n=Array.from(C).pop();v.cancelScheduledValues(e),t!==n&&void 0!==n&&("exponentialRampToValue"===n.type?v.exponentialRampToValueAtTime(n.value,n.endTime):"linearRampToValue"===n.type?v.linearRampToValueAtTime(n.value,n.endTime):"setValue"===n.type?v.setValueAtTime(n.value,n.startTime):"setValueCurve"===n.type&&v.setValueCurveAtTime(n.values,n.startTime,n.duration));}return w},cancelScheduledValues:e=>(null===y&&C.flush(f.context.currentTime),C.add(i(e)),v.cancelScheduledValues(e),w),exponentialRampToValueAtTime(e,t){if(0===e)throw new RangeError;if(!Number.isFinite(t)||t<0)throw new RangeError;return null===y&&C.flush(f.context.currentTime),C.add(s(e,t)),v.exponentialRampToValueAtTime(e,t),w},linearRampToValueAtTime:(e,t)=>(null===y&&C.flush(f.context.currentTime),C.add(c(e,t)),v.linearRampToValueAtTime(e,t),w),setTargetAtTime:(e,t,n)=>(null===y&&C.flush(f.context.currentTime),C.add(u(e,t,n)),v.setTargetAtTime(e,t,n),w),setValueAtTime:(e,t)=>(null===y&&C.flush(f.context.currentTime),C.add(l(e,t)),v.setValueAtTime(e,t),w),setValueCurveAtTime(e,t,n){const o=e instanceof Float32Array?e:new Float32Array(e);if(null!==h&&"webkitAudioContext"===h.name){const e=t+n,r=f.context.sampleRate,a=Math.ceil(t*r),i=Math.floor(e*r),s=i-a,c=new Float32Array(s);for(let e=0;e<s;e+=1){const i=(o.length-1)/n*((a+e)/r-t),s=Math.floor(i),u=Math.ceil(i);c[e]=s===u?o[s]:(1-(i-s))*o[s]+(1-(u-i))*o[u];}null===y&&C.flush(f.context.currentTime),C.add(d(c,t,n)),v.setValueCurveAtTime(c,t,n);const u=i/r;u<e&&w.setValueAtTime(c[c.length-1],u),w.setValueAtTime(o[o.length-1],e);}else null===y&&C.flush(f.context.currentTime),C.add(d(o,t,n)),v.setValueCurveAtTime(o,t,n);return w}};return n.set(w,v),t.set(w,f),e(w,y),w})((ln=s,(e,t)=>{ln.set(e,{activeInputs:new Set,passiveInputs:new WeakMap,renderer:t});}),Pt,c,(e=>({replay(t){for(const n of e)if("exponentialRampToValue"===n.type){const{endTime:e,value:o}=n;t.exponentialRampToValueAtTime(o,e);}else if("linearRampToValue"===n.type){const{endTime:e,value:o}=n;t.linearRampToValueAtTime(o,e);}else if("setTarget"===n.type){const{startTime:e,target:o,timeConstant:r}=n;t.setTargetAtTime(o,e,r);}else if("setValue"===n.type){const{startTime:e,value:o}=n;t.setValueAtTime(o,e);}else {if("setValueCurve"!==n.type)throw new Error("Can't apply an unknown automation.");{const{duration:e,startTime:o,values:r}=n;t.setValueCurveAtTime(r,o,e);}}}})),o.createCancelAndHoldAutomationEvent,o.createCancelScheduledValuesAutomationEvent,o.createExponentialRampToValueAutomationEvent,o.createLinearRampToValueAutomationEvent,o.createSetTargetAutomationEvent,o.createSetValueAutomationEvent,o.createSetValueCurveAutomationEvent,Wt);var ln;const dn=((e,t,n,o,r,a,i,s)=>class extends e{constructor(e,o){const s=a(e),c={...L,...o},u=r(s,c),l=i(s),d=l?t():null;super(e,!1,u,d),this._audioBufferSourceNodeRenderer=d,this._isBufferNullified=!1,this._isBufferSet=null!==c.buffer,this._nativeAudioBufferSourceNode=u,this._onended=null,this._playbackRate=n(this,l,u.playbackRate,R,D);}get buffer(){return this._isBufferNullified?null:this._nativeAudioBufferSourceNode.buffer}set buffer(e){if(this._nativeAudioBufferSourceNode.buffer=e,null!==e){if(this._isBufferSet)throw o();this._isBufferSet=!0;}}get loop(){return this._nativeAudioBufferSourceNode.loop}set loop(e){this._nativeAudioBufferSourceNode.loop=e;}get loopEnd(){return this._nativeAudioBufferSourceNode.loopEnd}set loopEnd(e){this._nativeAudioBufferSourceNode.loopEnd=e;}get loopStart(){return this._nativeAudioBufferSourceNode.loopStart}set loopStart(e){this._nativeAudioBufferSourceNode.loopStart=e;}get onended(){return this._onended}set onended(e){const t="function"==typeof e?s(this,e):null;this._nativeAudioBufferSourceNode.onended=t;const n=this._nativeAudioBufferSourceNode.onended;this._onended=null!==n&&n===t?e:n;}get playbackRate(){return this._playbackRate}start(e=0,t=0,n){if(this._nativeAudioBufferSourceNode.start(e,t,n),null!==this._audioBufferSourceNodeRenderer&&(this._audioBufferSourceNodeRenderer.start=void 0===n?[e,t]:[e,t,n]),"closed"!==this.context.state){M(this);const e=()=>{this._nativeAudioBufferSourceNode.removeEventListener("ended",e),P(this)&&x(this);};this._nativeAudioBufferSourceNode.addEventListener("ended",e);}}stop(e=0){this._nativeAudioBufferSourceNode.stop(e),null!==this._audioBufferSourceNodeRenderer&&(this._audioBufferSourceNodeRenderer.stop=e);}})(Xt,cn,un,Ae,rn,Tt,Dt,ut),hn=((e,t,n,o,r,a,i,s)=>class extends e{constructor(e,n){const o=a(e),c=i(o),u=r(o,n,c);super(e,!1,u,c?t(s):null),this._isNodeOfNativeOfflineAudioContext=c,this._nativeAudioDestinationNode=u;}get channelCount(){return this._nativeAudioDestinationNode.channelCount}set channelCount(e){if(this._isNodeOfNativeOfflineAudioContext)throw o();if(e>this._nativeAudioDestinationNode.maxChannelCount)throw n();this._nativeAudioDestinationNode.channelCount=e;}get channelCountMode(){return this._nativeAudioDestinationNode.channelCountMode}set channelCountMode(e){if(this._isNodeOfNativeOfflineAudioContext)throw o();this._nativeAudioDestinationNode.channelCountMode=e;}get maxChannelCount(){return this._nativeAudioDestinationNode.maxChannelCount}})(Xt,(e=>{let t=null;return {render:(n,o,r)=>(null===t&&(t=(async(t,n,o)=>{const r=n.destination;return await e(t,n,r,o),r})(n,o,r)),t)}}),T,Ae,((e,t)=>(n,o,r)=>{const a=n.destination;if(a.channelCount!==o)try{a.channelCount=o;}catch{}r&&"explicit"!==a.channelCountMode&&(a.channelCountMode="explicit"),0===a.maxChannelCount&&Object.defineProperty(a,"maxChannelCount",{value:o});const i=e(n,{channelCount:o,channelCountMode:a.channelCountMode,channelInterpretation:a.channelInterpretation,gain:1});return t(i,"channelCount",(e=>()=>e.call(i)),(e=>t=>{e.call(i,t);try{a.channelCount=t;}catch(e){if(t>a.maxChannelCount)throw e}})),t(i,"channelCountMode",(e=>()=>e.call(i)),(e=>t=>{e.call(i,t),a.channelCountMode=t;})),t(i,"channelInterpretation",(e=>()=>e.call(i)),(e=>t=>{e.call(i,t),a.channelInterpretation=t;})),Object.defineProperty(i,"maxChannelCount",{get:()=>a.maxChannelCount}),i.connect(a),i})(Xe,nt),Tt,Dt,xt),fn=((e,t,n,o,r)=>()=>{const a=new WeakMap;return {render(i,s,c){const u=a.get(s);return void 0!==u?Promise.resolve(u):(async(i,s,c)=>{let u=n(i);const l=I(u,s);if(!l){const e={Q:u.Q.value,channelCount:u.channelCount,channelCountMode:u.channelCountMode,channelInterpretation:u.channelInterpretation,detune:u.detune.value,frequency:u.frequency.value,gain:u.gain.value,type:u.type};u=t(s,e);}return a.set(s,u),l?(await e(s,i.Q,u.Q,c),await e(s,i.detune,u.detune,c),await e(s,i.frequency,u.frequency,c),await e(s,i.gain,u.gain,c)):(await o(s,i.Q,u.Q,c),await o(s,i.detune,u.detune,c),await o(s,i.frequency,u.frequency,c),await o(s,i.gain,u.gain,c)),await r(i,s,u,c),u})(i,s,c)}}})(on,Be,K,sn,xt),pn=(e=>(t,n)=>e.set(t,n))(pt),vn=(mn=Xt,gn=un,Cn=fn,yn=xe,wn=Be,_n=Tt,bn=Dt,Mn=pn,class extends mn{constructor(e,t){const n=_n(e),o={...ve,...t},r=wn(n,o),a=bn(n);super(e,!1,r,a?Cn():null),this._Q=gn(this,a,r.Q,R,D),this._detune=gn(this,a,r.detune,1200*Math.log2(R),-1200*Math.log2(R)),this._frequency=gn(this,a,r.frequency,e.sampleRate/2,0),this._gain=gn(this,a,r.gain,40*Math.log10(R),D),this._nativeBiquadFilterNode=r,Mn(this,1);}get detune(){return this._detune}get frequency(){return this._frequency}get gain(){return this._gain}get Q(){return this._Q}get type(){return this._nativeBiquadFilterNode.type}set type(e){this._nativeBiquadFilterNode.type=e;}getFrequencyResponse(e,t,n){if(this._nativeBiquadFilterNode.getFrequencyResponse(e,t,n),e.length!==t.length||t.length!==n.length)throw yn()}});var mn,gn,Cn,yn,wn,_n,bn,Mn;const An=((e,t)=>(n,o,r)=>{const a=new Set;var i,s;return n.connect=(i=n.connect,(r,s=0,c=0)=>{const u=0===a.size;if(t(r))return i.call(n,r,s,c),e(a,[r,s,c],(e=>e[0]===r&&e[1]===s&&e[2]===c),!0),u&&o(),r;i.call(n,r,s),e(a,[r,s],(e=>e[0]===r&&e[1]===s),!0),u&&o();}),n.disconnect=(s=n.disconnect,(e,o,i)=>{const c=a.size>0;if(void 0===e)s.apply(n),a.clear();else if("number"==typeof e){s.call(n,e);for(const t of a)t[1]===e&&a.delete(t);}else {t(e)?s.call(n,e,o,i):s.call(n,e,o);for(const t of a)t[0]!==e||void 0!==o&&t[1]!==o||void 0!==i&&t[2]!==i||a.delete(t);}const u=0===a.size;c&&u&&r();}),n})(Y,jt),xn=(On=Ae,En=An,(e,t)=>{t.channelCount=1,t.channelCountMode="explicit",Object.defineProperty(t,"channelCount",{get:()=>1,set:()=>{throw On()}}),Object.defineProperty(t,"channelCountMode",{get:()=>"explicit",set:()=>{throw On()}});const n=e.createBufferSource();En(t,(()=>{const e=t.numberOfInputs;for(let o=0;o<e;o+=1)n.connect(t,0,o);}),(()=>n.disconnect(t)));});var On,En;const In=((e,t)=>(n,o)=>{const r=n.createChannelMerger(o.numberOfInputs);return null!==e&&"webkitAudioContext"===e.name&&t(n,r),ke(r,o),r})(Wt,xn),Nn=((e,t,n,o,r)=>class extends e{constructor(e,a){const i=o(e),s={...me,...a};super(e,!1,n(i,s),r(i)?t():null);}})(Xt,((e,t,n)=>()=>{const o=new WeakMap;return {render(r,a,i){const s=o.get(a);return void 0!==s?Promise.resolve(s):(async(r,a,i)=>{let s=t(r);if(!I(s,a)){const t={channelCount:s.channelCount,channelCountMode:s.channelCountMode,channelInterpretation:s.channelInterpretation,numberOfInputs:s.numberOfInputs};s=e(a,t);}return o.set(a,s),await n(r,a,s,i),s})(r,a,i)}}})(In,K,xt),In,Tt,Dt),Tn=((e,t,n,o,r,a)=>class extends e{constructor(e,i){const s=o(e),c=a({...ge,...i});super(e,!1,n(s,c),r(s)?t():null);}})(Xt,((e,t,n)=>()=>{const o=new WeakMap;return {render(r,a,i){const s=o.get(a);return void 0!==s?Promise.resolve(s):(async(r,a,i)=>{let s=t(r);if(!I(s,a)){const t={channelCount:s.channelCount,channelCountMode:s.channelCountMode,channelInterpretation:s.channelInterpretation,numberOfOutputs:s.numberOfOutputs};s=e(a,t);}return o.set(a,s),await n(r,a,s,i),s})(r,a,i)}}})(Ve,K,xt),Ve,Tt,Dt,(e=>({...e,channelCount:e.numberOfOutputs}))),Sn=((e,t,n,o)=>(r,{offset:a,...i})=>{const s=r.createBuffer(1,2,44100),c=t(r,{buffer:null,channelCount:2,channelCountMode:"max",channelInterpretation:"speakers",loop:!1,loopEnd:0,loopStart:0,playbackRate:1}),u=n(r,{...i,gain:a}),l=s.getChannelData(0);l[0]=1,l[1]=1,c.buffer=s,c.loop=!0;const d={get bufferSize(){},get channelCount(){return u.channelCount},set channelCount(e){u.channelCount=e;},get channelCountMode(){return u.channelCountMode},set channelCountMode(e){u.channelCountMode=e;},get channelInterpretation(){return u.channelInterpretation},set channelInterpretation(e){u.channelInterpretation=e;},get context(){return u.context},get inputs(){return []},get numberOfInputs(){return c.numberOfInputs},get numberOfOutputs(){return u.numberOfOutputs},get offset(){return u.gain},get onended(){return c.onended},set onended(e){c.onended=e;},addEventListener:(...e)=>c.addEventListener(e[0],e[1],e[2]),dispatchEvent:(...e)=>c.dispatchEvent(e[0]),removeEventListener:(...e)=>c.removeEventListener(e[0],e[1],e[2]),start(e=0){c.start.call(c,e);},stop(e=0){c.stop.call(c,e);}};return e(r,c),o(je(d,u),(()=>c.connect(u)),(()=>c.disconnect(u)))})(en,rn,Xe,An),kn=((e,t,n,o,r)=>(a,i)=>{if(void 0===a.createConstantSource)return n(a,i);const s=a.createConstantSource();return ke(s,i),Re(s,i,"offset"),t(o,(()=>o(a)))||Pe(s),t(r,(()=>r(a)))||Le(s),e(a,s),s})(en,mt,Sn,ot,at),Dn=((e,t,n,o,r,a,i)=>class extends e{constructor(e,i){const s=r(e),c={...Ce,...i},u=o(s,c),l=a(s),d=l?n():null;super(e,!1,u,d),this._constantSourceNodeRenderer=d,this._nativeConstantSourceNode=u,this._offset=t(this,l,u.offset,R,D),this._onended=null;}get offset(){return this._offset}get onended(){return this._onended}set onended(e){const t="function"==typeof e?i(this,e):null;this._nativeConstantSourceNode.onended=t;const n=this._nativeConstantSourceNode.onended;this._onended=null!==n&&n===t?e:n;}start(e=0){if(this._nativeConstantSourceNode.start(e),null!==this._constantSourceNodeRenderer&&(this._constantSourceNodeRenderer.start=e),"closed"!==this.context.state){M(this);const e=()=>{this._nativeConstantSourceNode.removeEventListener("ended",e),P(this)&&x(this);};this._nativeConstantSourceNode.addEventListener("ended",e);}}stop(e=0){this._nativeConstantSourceNode.stop(e),null!==this._constantSourceNodeRenderer&&(this._constantSourceNodeRenderer.stop=e);}})(Xt,un,((e,t,n,o,r)=>()=>{const a=new WeakMap;let i=null,s=null;return {set start(e){i=e;},set stop(e){s=e;},render(c,u,l){const d=a.get(u);return void 0!==d?Promise.resolve(d):(async(c,u,l)=>{let d=n(c);const h=I(d,u);if(!h){const e={channelCount:d.channelCount,channelCountMode:d.channelCountMode,channelInterpretation:d.channelInterpretation,offset:d.offset.value};d=t(u,e),null!==i&&d.start(i),null!==s&&d.stop(s);}return a.set(u,d),h?await e(u,c.offset,d.offset,l):await o(u,c.offset,d.offset,l),await r(c,u,d,l),d})(c,u,l)}}})(on,kn,K,sn,xt),kn,Tt,Dt,ut),Rn=((e,t)=>(n,o)=>{const r=n.createConvolver();if(ke(r,o),o.disableNormalization===r.normalize&&(r.normalize=!o.disableNormalization),Se(r,o,"buffer"),o.channelCount>2)throw e();if(t(r,"channelCount",(e=>()=>e.call(r)),(t=>n=>{if(n>2)throw e();return t.call(r,n)})),"max"===o.channelCountMode)throw e();return t(r,"channelCountMode",(e=>()=>e.call(r)),(t=>n=>{if("max"===n)throw e();return t.call(r,n)})),r})(ze,nt),Pn=((e,t,n,o,r,a)=>class extends e{constructor(e,i){const s=o(e),c={...ye,...i},u=n(s,c);super(e,!1,u,r(s)?t():null),this._isBufferNullified=!1,this._nativeConvolverNode=u,null!==c.buffer&&a(this,c.buffer.duration);}get buffer(){return this._isBufferNullified?null:this._nativeConvolverNode.buffer}set buffer(e){if(this._nativeConvolverNode.buffer=e,null===e&&null!==this._nativeConvolverNode.buffer){const e=this._nativeConvolverNode.context;this._nativeConvolverNode.buffer=e.createBuffer(1,1,44100),this._isBufferNullified=!0,a(this,0);}else this._isBufferNullified=!1,a(this,null===this._nativeConvolverNode.buffer?0:this._nativeConvolverNode.buffer.duration);}get normalize(){return this._nativeConvolverNode.normalize}set normalize(e){this._nativeConvolverNode.normalize=e;}})(Xt,((e,t,n)=>()=>{const o=new WeakMap;return {render(r,a,i){const s=o.get(a);return void 0!==s?Promise.resolve(s):(async(r,a,i)=>{let s=t(r);if(!I(s,a)){const t={buffer:s.buffer,channelCount:s.channelCount,channelCountMode:s.channelCountMode,channelInterpretation:s.channelInterpretation,disableNormalization:!s.normalize};s=e(a,t);}return o.set(a,s),z(s)?await n(r,a,s.inputs[0],i):await n(r,a,s,i),s})(r,a,i)}}})(Rn,K,xt),Rn,Tt,Dt,pn),Ln=((e,t,n,o,r,a,i)=>class extends e{constructor(e,s){const c=r(e),u={...we,...s},l=o(c,u),d=a(c);super(e,!1,l,d?n(u.maxDelayTime):null),this._delayTime=t(this,d,l.delayTime),i(this,u.maxDelayTime);}get delayTime(){return this._delayTime}})(Xt,un,((e,t,n,o,r)=>a=>{const i=new WeakMap;return {render(s,c,u){const l=i.get(c);return void 0!==l?Promise.resolve(l):(async(s,c,u)=>{let l=n(s);const d=I(l,c);if(!d){const e={channelCount:l.channelCount,channelCountMode:l.channelCountMode,channelInterpretation:l.channelInterpretation,delayTime:l.delayTime.value,maxDelayTime:a};l=t(c,e);}return i.set(c,l),d?await e(c,s.delayTime,l.delayTime,u):await o(c,s.delayTime,l.delayTime,u),await r(s,c,l,u),l})(s,c,u)}}})(on,qe,K,sn,xt),qe,Tt,Dt,pn),Fn=(Wn=ze,(e,t)=>{const n=e.createDynamicsCompressor();if(ke(n,t),t.channelCount>2)throw Wn();if("max"===t.channelCountMode)throw Wn();return Re(n,t,"attack"),Re(n,t,"knee"),Re(n,t,"ratio"),Re(n,t,"release"),Re(n,t,"threshold"),n});var Wn;const Bn=((e,t,n,o,r,a,i,s)=>class extends e{constructor(e,r){const c=a(e),u={...be,...r},l=o(c,u),d=i(c);super(e,!1,l,d?n():null),this._attack=t(this,d,l.attack),this._knee=t(this,d,l.knee),this._nativeDynamicsCompressorNode=l,this._ratio=t(this,d,l.ratio),this._release=t(this,d,l.release),this._threshold=t(this,d,l.threshold),s(this,.006);}get attack(){return this._attack}get channelCount(){return this._nativeDynamicsCompressorNode.channelCount}set channelCount(e){const t=this._nativeDynamicsCompressorNode.channelCount;if(this._nativeDynamicsCompressorNode.channelCount=e,e>2)throw this._nativeDynamicsCompressorNode.channelCount=t,r()}get channelCountMode(){return this._nativeDynamicsCompressorNode.channelCountMode}set channelCountMode(e){const t=this._nativeDynamicsCompressorNode.channelCountMode;if(this._nativeDynamicsCompressorNode.channelCountMode=e,"max"===e)throw this._nativeDynamicsCompressorNode.channelCountMode=t,r()}get knee(){return this._knee}get ratio(){return this._ratio}get reduction(){return "number"==typeof this._nativeDynamicsCompressorNode.reduction.value?this._nativeDynamicsCompressorNode.reduction.value:this._nativeDynamicsCompressorNode.reduction}get release(){return this._release}get threshold(){return this._threshold}})(Xt,un,((e,t,n,o,r)=>()=>{const a=new WeakMap;return {render(i,s,c){const u=a.get(s);return void 0!==u?Promise.resolve(u):(async(i,s,c)=>{let u=n(i);const l=I(u,s);if(!l){const e={attack:u.attack.value,channelCount:u.channelCount,channelCountMode:u.channelCountMode,channelInterpretation:u.channelInterpretation,knee:u.knee.value,ratio:u.ratio.value,release:u.release.value,threshold:u.threshold.value};u=t(s,e);}return a.set(s,u),l?(await e(s,i.attack,u.attack,c),await e(s,i.knee,u.knee,c),await e(s,i.ratio,u.ratio,c),await e(s,i.release,u.release,c),await e(s,i.threshold,u.threshold,c)):(await o(s,i.attack,u.attack,c),await o(s,i.knee,u.knee,c),await o(s,i.ratio,u.ratio,c),await o(s,i.release,u.release,c),await o(s,i.threshold,u.threshold,c)),await r(i,s,u,c),u})(i,s,c)}}})(on,Fn,K,sn,xt),Fn,ze,Tt,Dt,pn),Vn=((e,t,n,o,r,a)=>class extends e{constructor(e,i){const s=r(e),c={...Me,...i},u=o(s,c),l=a(s);super(e,!1,u,l?n():null),this._gain=t(this,l,u.gain,R,D);}get gain(){return this._gain}})(Xt,un,((e,t,n,o,r)=>()=>{const a=new WeakMap;return {render(i,s,c){const u=a.get(s);return void 0!==u?Promise.resolve(u):(async(i,s,c)=>{let u=n(i);const l=I(u,s);if(!l){const e={channelCount:u.channelCount,channelCountMode:u.channelCountMode,channelInterpretation:u.channelInterpretation,gain:u.gain.value};u=t(s,e);}return a.set(s,u),l?await e(s,i.gain,u.gain,c):await o(s,i.gain,u.gain,c),await r(i,s,u,c),u})(i,s,c)}}})(on,Xe,K,sn,xt),Xe,Tt,Dt),jn=((e,t,n,o)=>(r,a,{channelCount:i,channelCountMode:s,channelInterpretation:c,feedback:u,feedforward:l})=>{const d=Fe(a,r.sampleRate),h=u instanceof Float64Array?u:new Float64Array(u),f=l instanceof Float64Array?l:new Float64Array(l),p=h.length,v=f.length,m=Math.min(p,v);if(0===p||p>20)throw o();if(0===h[0])throw t();if(0===v||v>20)throw o();if(0===f[0])throw t();if(1!==h[0]){for(let e=0;e<v;e+=1)f[e]/=h[0];for(let e=1;e<p;e+=1)h[e]/=h[0];}const g=n(r,d,i,i);g.channelCount=i,g.channelCountMode=s,g.channelInterpretation=c;const C=[],y=[],w=[];for(let e=0;e<i;e+=1){C.push(0);const e=new Float32Array(32),t=new Float32Array(32);e.fill(0),t.fill(0),y.push(e),w.push(t);}g.onaudioprocess=e=>{const t=e.inputBuffer,n=e.outputBuffer,o=t.numberOfChannels;for(let e=0;e<o;e+=1){const o=t.getChannelData(e),r=n.getChannelData(e);C[e]=Ee(h,p,f,v,m,y[e],w[e],C[e],32,o,r);}};const _=r.sampleRate/2;return je({get bufferSize(){return d},get channelCount(){return g.channelCount},set channelCount(e){g.channelCount=e;},get channelCountMode(){return g.channelCountMode},set channelCountMode(e){g.channelCountMode=e;},get channelInterpretation(){return g.channelInterpretation},set channelInterpretation(e){g.channelInterpretation=e;},get context(){return g.context},get inputs(){return [g]},get numberOfInputs(){return g.numberOfInputs},get numberOfOutputs(){return g.numberOfOutputs},addEventListener:(...e)=>g.addEventListener(e[0],e[1],e[2]),dispatchEvent:(...e)=>g.dispatchEvent(e[0]),getFrequencyResponse(t,n,o){if(t.length!==n.length||n.length!==o.length)throw e();const r=t.length;for(let e=0;e<r;e+=1){const r=-Math.PI*(t[e]/_),a=[Math.cos(r),Math.sin(r)],i=Ye(Ze(f,a),Ze(h,a));n[e]=Math.sqrt(i[0]*i[0]+i[1]*i[1]),o[e]=Math.atan2(i[1],i[0]);}},removeEventListener:(...e)=>g.removeEventListener(e[0],e[1],e[2])},g)})(xe,Ae,Ge,ze),qn=((e,t,n,o)=>r=>e(Ne,(()=>Ne(r)))?Promise.resolve(e(o,o)).then((e=>{if(!e){const e=n(r,512,0,1);r.oncomplete=()=>{e.onaudioprocess=null,e.disconnect();},e.onaudioprocess=()=>r.currentTime,e.connect(r.destination);}return r.startRendering()})):new Promise((e=>{const n=t(r,{channelCount:1,channelCountMode:"explicit",channelInterpretation:"discrete",gain:0});r.oncomplete=t=>{n.disconnect(),e(t.renderedBuffer);},n.connect(r.destination),r.startRendering();})))(mt,Xe,Ge,((e,t)=>()=>{if(null===t)return Promise.resolve(!1);const n=new t(1,1,44100),o=e(n,{channelCount:1,channelCountMode:"explicit",channelInterpretation:"discrete",gain:0});return new Promise((e=>{n.oncomplete=()=>{o.disconnect(),e(0!==n.currentTime);},n.startRendering();}))})(Xe,kt)),Xn=((e,t,n,o,r)=>(a,i)=>{const s=new WeakMap;let c=null;const u=async(u,l,d)=>{let h=null,f=t(u);const p=I(f,l);if(void 0===l.createIIRFilter?h=e(l,{buffer:null,channelCount:2,channelCountMode:"max",channelInterpretation:"speakers",loop:!1,loopEnd:0,loopStart:0,playbackRate:1}):p||(f=l.createIIRFilter(i,a)),s.set(l,null===h?f:h),null!==h){if(null===c){if(null===n)throw new Error("Missing the native OfflineAudioContext constructor.");const e=new n(u.context.destination.channelCount,u.context.length,l.sampleRate);c=(async()=>{await o(u,e,e.destination,d);return ((e,t,n,o)=>{const r=n instanceof Float64Array?n:new Float64Array(n),a=o instanceof Float64Array?o:new Float64Array(o),i=r.length,s=a.length,c=Math.min(i,s);if(1!==r[0]){for(let e=0;e<i;e+=1)a[e]/=r[0];for(let e=1;e<s;e+=1)r[e]/=r[0];}const u=new Float32Array(32),l=new Float32Array(32),d=t.createBuffer(e.numberOfChannels,e.length,e.sampleRate),h=e.numberOfChannels;for(let t=0;t<h;t+=1){const n=e.getChannelData(t),o=d.getChannelData(t);u.fill(0),l.fill(0),Ee(r,i,a,s,c,u,l,0,32,n,o);}return d})(await r(e),l,a,i)})();}const e=await c;return h.buffer=e,h.start(0),h}return await o(u,l,f,d),f};return {render(e,t,n){const o=s.get(t);return void 0!==o?Promise.resolve(o):u(e,t,n)}}})(rn,K,kt,xt,qn);var Yn;const Zn=((e,t,n,o,r,a)=>class extends e{constructor(e,i){const s=o(e),c=r(s),u={...Oe,...i},l=t(s,c?null:e.baseLatency,u);super(e,!1,l,c?n(u.feedback,u.feedforward):null),(e=>{var t;e.getFrequencyResponse=(t=e.getFrequencyResponse,(n,o,r)=>{if(n.length!==o.length||o.length!==r.length)throw xe();return t.call(e,n,o,r)});})(l),this._nativeIIRFilterNode=l,a(this,1);}getFrequencyResponse(e,t,n){return this._nativeIIRFilterNode.getFrequencyResponse(e,t,n)}})(Xt,(Yn=jn,(e,t,n)=>{if(void 0===e.createIIRFilter)return Yn(e,t,n);const o=e.createIIRFilter(n.feedforward,n.feedback);return ke(o,n),o}),Xn,Tt,Dt,pn),Gn=((e,t,n,o,r)=>(a,i)=>{const s=i.listener,{forwardX:c,forwardY:u,forwardZ:l,positionX:d,positionY:h,positionZ:f,upX:p,upY:v,upZ:m}=void 0===s.forwardX?(()=>{const c=t(i,{channelCount:1,channelCountMode:"explicit",channelInterpretation:"speakers",numberOfInputs:9}),u=r(i),l=o(i,256,9,0),d=(t,o)=>{const r=n(i,{channelCount:1,channelCountMode:"explicit",channelInterpretation:"discrete",offset:o});return r.connect(c,0,t),r.start(),Object.defineProperty(r.offset,"defaultValue",{get:()=>o}),e({context:a},u,r.offset,R,D)};let h=[0,0,-1,0,1,0],f=[0,0,0];return l.onaudioprocess=({inputBuffer:e})=>{const t=[e.getChannelData(0)[0],e.getChannelData(1)[0],e.getChannelData(2)[0],e.getChannelData(3)[0],e.getChannelData(4)[0],e.getChannelData(5)[0]];t.some(((e,t)=>e!==h[t]))&&(s.setOrientation(...t),h=t);const n=[e.getChannelData(6)[0],e.getChannelData(7)[0],e.getChannelData(8)[0]];n.some(((e,t)=>e!==f[t]))&&(s.setPosition(...n),f=n);},c.connect(l),{forwardX:d(0,0),forwardY:d(1,0),forwardZ:d(2,-1),positionX:d(6,0),positionY:d(7,0),positionZ:d(8,0),upX:d(3,0),upY:d(4,1),upZ:d(5,0)}})():s;return {get forwardX(){return c},get forwardY(){return u},get forwardZ(){return l},get positionX(){return d},get positionY(){return h},get positionZ(){return f},get upX(){return p},get upY(){return v},get upZ(){return m}}})(un,In,kn,Ge,Dt),zn=new WeakMap,Un=((e,t,n,o,r,a)=>class extends n{constructor(n,a){super(n),this._nativeContext=n,u.set(this,n),o(n)&&r.set(n,new Set),this._destination=new e(this,a),this._listener=t(this,n),this._onstatechange=null;}get currentTime(){return this._nativeContext.currentTime}get destination(){return this._destination}get listener(){return this._listener}get onstatechange(){return this._onstatechange}set onstatechange(e){const t="function"==typeof e?a(this,e):null;this._nativeContext.onstatechange=t;const n=this._nativeContext.onstatechange;this._onstatechange=null!==n&&n===t?e:n;}get sampleRate(){return this._nativeContext.sampleRate}get state(){return this._nativeContext.state}})(hn,Gn,Lt,Dt,zn,ut),Hn=((e,t,n,o,r,a)=>(i,s)=>{const c=i.createOscillator();return ke(c,s),Re(c,s,"detune"),Re(c,s,"frequency"),void 0!==s.periodicWave?c.setPeriodicWave(s.periodicWave):Se(c,s,"type"),t(n,(()=>n(i)))||Pe(c),t(o,(()=>o(i)))||a(c,i),t(r,(()=>r(i)))||Le(c),e(i,c),c})(en,mt,ot,rt,at,ct),Qn=((e,t,n,o,r,a,i)=>class extends e{constructor(e,i){const s=r(e),c={...He,...i},u=n(s,c),l=a(s),d=l?o():null,h=e.sampleRate/2;super(e,!1,u,d),this._detune=t(this,l,u.detune,153600,-153600),this._frequency=t(this,l,u.frequency,h,-h),this._nativeOscillatorNode=u,this._onended=null,this._oscillatorNodeRenderer=d,null!==this._oscillatorNodeRenderer&&void 0!==c.periodicWave&&(this._oscillatorNodeRenderer.periodicWave=c.periodicWave);}get detune(){return this._detune}get frequency(){return this._frequency}get onended(){return this._onended}set onended(e){const t="function"==typeof e?i(this,e):null;this._nativeOscillatorNode.onended=t;const n=this._nativeOscillatorNode.onended;this._onended=null!==n&&n===t?e:n;}get type(){return this._nativeOscillatorNode.type}set type(e){this._nativeOscillatorNode.type=e,null!==this._oscillatorNodeRenderer&&(this._oscillatorNodeRenderer.periodicWave=null);}setPeriodicWave(e){this._nativeOscillatorNode.setPeriodicWave(e),null!==this._oscillatorNodeRenderer&&(this._oscillatorNodeRenderer.periodicWave=e);}start(e=0){if(this._nativeOscillatorNode.start(e),null!==this._oscillatorNodeRenderer&&(this._oscillatorNodeRenderer.start=e),"closed"!==this.context.state){M(this);const e=()=>{this._nativeOscillatorNode.removeEventListener("ended",e),P(this)&&x(this);};this._nativeOscillatorNode.addEventListener("ended",e);}}stop(e=0){this._nativeOscillatorNode.stop(e),null!==this._oscillatorNodeRenderer&&(this._oscillatorNodeRenderer.stop=e);}})(Xt,un,Hn,((e,t,n,o,r)=>()=>{const a=new WeakMap;let i=null,s=null,c=null;return {set periodicWave(e){i=e;},set start(e){s=e;},set stop(e){c=e;},render(u,l,d){const h=a.get(l);return void 0!==h?Promise.resolve(h):(async(u,l,d)=>{let h=n(u);const f=I(h,l);if(!f){const e={channelCount:h.channelCount,channelCountMode:h.channelCountMode,channelInterpretation:h.channelInterpretation,detune:h.detune.value,frequency:h.frequency.value,periodicWave:null===i?void 0:i,type:h.type};h=t(l,e),null!==s&&h.start(s),null!==c&&h.stop(c);}return a.set(l,h),f?(await e(l,u.detune,h.detune,d),await e(l,u.frequency,h.frequency,d)):(await o(l,u.detune,h.detune,d),await o(l,u.frequency,h.frequency,d)),await r(u,l,h,d),h})(u,l,d)}}})(on,Hn,K,sn,xt),Tt,Dt,ut),$n=(Jn=rn,(e,t)=>{const n=Jn(e,{buffer:null,channelCount:2,channelCountMode:"max",channelInterpretation:"speakers",loop:!1,loopEnd:0,loopStart:0,playbackRate:1}),o=e.createBuffer(1,2,44100);return n.buffer=o,n.loop=!0,n.connect(t),n.start(),()=>{n.stop(),n.disconnect(t);}});var Jn;const Kn=((e,t,n,o,r)=>(a,{curve:i,oversample:s,...c})=>{const u=a.createWaveShaper(),l=a.createWaveShaper();ke(u,c),ke(l,c);const d=n(a,{...c,gain:1}),h=n(a,{...c,gain:-1}),f=n(a,{...c,gain:1}),p=n(a,{...c,gain:-1});let v=null,m=!1,g=null;const C={get bufferSize(){},get channelCount(){return u.channelCount},set channelCount(e){d.channelCount=e,h.channelCount=e,u.channelCount=e,f.channelCount=e,l.channelCount=e,p.channelCount=e;},get channelCountMode(){return u.channelCountMode},set channelCountMode(e){d.channelCountMode=e,h.channelCountMode=e,u.channelCountMode=e,f.channelCountMode=e,l.channelCountMode=e,p.channelCountMode=e;},get channelInterpretation(){return u.channelInterpretation},set channelInterpretation(e){d.channelInterpretation=e,h.channelInterpretation=e,u.channelInterpretation=e,f.channelInterpretation=e,l.channelInterpretation=e,p.channelInterpretation=e;},get context(){return u.context},get curve(){return g},set curve(n){if(null!==n&&n.length<2)throw t();if(null===n)u.curve=n,l.curve=n;else {const e=n.length,t=new Float32Array(e+2-e%2),o=new Float32Array(e+2-e%2);t[0]=n[0],o[0]=-n[e-1];const r=Math.ceil((e+1)/2),a=(e+1)/2-1;for(let i=1;i<r;i+=1){const s=i/r*a,c=Math.floor(s),u=Math.ceil(s);t[i]=c===u?n[c]:(1-(s-c))*n[c]+(1-(u-s))*n[u],o[i]=c===u?-n[e-1-c]:-(1-(s-c))*n[e-1-c]-(1-(u-s))*n[e-1-u];}t[r]=e%2==1?n[r-1]:(n[r-2]+n[r-1])/2,u.curve=t,l.curve=o;}g=n,m&&(o(g)&&null===v?v=e(a,d):null!==v&&(v(),v=null));},get inputs(){return [d]},get numberOfInputs(){return u.numberOfInputs},get numberOfOutputs(){return u.numberOfOutputs},get oversample(){return u.oversample},set oversample(e){u.oversample=e,l.oversample=e;},addEventListener:(...e)=>d.addEventListener(e[0],e[1],e[2]),dispatchEvent:(...e)=>d.dispatchEvent(e[0]),removeEventListener:(...e)=>d.removeEventListener(e[0],e[1],e[2])};null!==i&&(C.curve=i instanceof Float32Array?i:new Float32Array(i)),s!==C.oversample&&(C.oversample=s);return r(je(C,f),(()=>{d.connect(u).connect(f),d.connect(h).connect(l).connect(p).connect(f),m=!0,o(g)&&(v=e(a,d));}),(()=>{d.disconnect(u),u.disconnect(f),d.disconnect(h),h.disconnect(l),l.disconnect(p),p.disconnect(f),m=!1,null!==v&&(v(),v=null);}))})($n,Ae,Xe,tt,An),eo=((e,t,n,o,r,a,i)=>(s,c)=>{const u=s.createWaveShaper();if(null!==a&&"webkitAudioContext"===a.name)return n(s,c);ke(u,c);const l=null===c.curve||c.curve instanceof Float32Array?c.curve:new Float32Array(c.curve);if(null!==l&&l.length<2)throw t();Se(u,{curve:l},"curve"),Se(u,c,"oversample");let d=null,h=!1;i(u,"curve",(e=>()=>e.call(u)),(t=>n=>(t.call(u,n),h&&(o(n)&&null===d?d=e(s,u):o(n)||null===d||(d(),d=null)),n)));return r(u,(()=>{h=!0,o(u.curve)&&(d=e(s,u));}),(()=>{h=!1,null!==d&&(d(),d=null);}))})($n,Ae,Kn,tt,An,Wt,nt),to=((e,t,n,o,r,a,i,s,c)=>(u,{coneInnerAngle:l,coneOuterAngle:d,coneOuterGain:h,distanceModel:f,maxDistance:p,orientationX:v,orientationY:m,orientationZ:g,panningModel:C,positionX:y,positionY:w,positionZ:_,refDistance:b,rolloffFactor:M,...A})=>{const x=u.createPanner();if(A.channelCount>2)throw i();if("max"===A.channelCountMode)throw i();ke(x,A);const O={channelCount:1,channelCountMode:"explicit",channelInterpretation:"discrete"},E=n(u,{...O,channelInterpretation:"speakers",numberOfInputs:6}),I=o(u,{...A,gain:1}),N=o(u,{...O,gain:1}),T=o(u,{...O,gain:0}),S=o(u,{...O,gain:0}),k=o(u,{...O,gain:0}),D=o(u,{...O,gain:0}),R=o(u,{...O,gain:0}),P=r(u,256,6,1),L=a(u,{...O,curve:new Float32Array([1,1]),oversample:"none"});let F=[v,m,g],W=[y,w,_];P.onaudioprocess=({inputBuffer:e})=>{const t=[e.getChannelData(0)[0],e.getChannelData(1)[0],e.getChannelData(2)[0]];t.some(((e,t)=>e!==F[t]))&&(x.setOrientation(...t),F=t);const n=[e.getChannelData(3)[0],e.getChannelData(4)[0],e.getChannelData(5)[0]];n.some(((e,t)=>e!==W[t]))&&(x.setPosition(...n),W=n);},Object.defineProperty(T.gain,"defaultValue",{get:()=>0}),Object.defineProperty(S.gain,"defaultValue",{get:()=>0}),Object.defineProperty(k.gain,"defaultValue",{get:()=>0}),Object.defineProperty(D.gain,"defaultValue",{get:()=>0}),Object.defineProperty(R.gain,"defaultValue",{get:()=>0});const B={get bufferSize(){},get channelCount(){return x.channelCount},set channelCount(e){if(e>2)throw i();I.channelCount=e,x.channelCount=e;},get channelCountMode(){return x.channelCountMode},set channelCountMode(e){if("max"===e)throw i();I.channelCountMode=e,x.channelCountMode=e;},get channelInterpretation(){return x.channelInterpretation},set channelInterpretation(e){I.channelInterpretation=e,x.channelInterpretation=e;},get coneInnerAngle(){return x.coneInnerAngle},set coneInnerAngle(e){x.coneInnerAngle=e;},get coneOuterAngle(){return x.coneOuterAngle},set coneOuterAngle(e){x.coneOuterAngle=e;},get coneOuterGain(){return x.coneOuterGain},set coneOuterGain(e){if(e<0||e>1)throw t();x.coneOuterGain=e;},get context(){return x.context},get distanceModel(){return x.distanceModel},set distanceModel(e){x.distanceModel=e;},get inputs(){return [I]},get maxDistance(){return x.maxDistance},set maxDistance(e){if(e<0)throw new RangeError;x.maxDistance=e;},get numberOfInputs(){return x.numberOfInputs},get numberOfOutputs(){return x.numberOfOutputs},get orientationX(){return N.gain},get orientationY(){return T.gain},get orientationZ(){return S.gain},get panningModel(){return x.panningModel},set panningModel(e){x.panningModel=e;},get positionX(){return k.gain},get positionY(){return D.gain},get positionZ(){return R.gain},get refDistance(){return x.refDistance},set refDistance(e){if(e<0)throw new RangeError;x.refDistance=e;},get rolloffFactor(){return x.rolloffFactor},set rolloffFactor(e){if(e<0)throw new RangeError;x.rolloffFactor=e;},addEventListener:(...e)=>I.addEventListener(e[0],e[1],e[2]),dispatchEvent:(...e)=>I.dispatchEvent(e[0]),removeEventListener:(...e)=>I.removeEventListener(e[0],e[1],e[2])};l!==B.coneInnerAngle&&(B.coneInnerAngle=l),d!==B.coneOuterAngle&&(B.coneOuterAngle=d),h!==B.coneOuterGain&&(B.coneOuterGain=h),f!==B.distanceModel&&(B.distanceModel=f),p!==B.maxDistance&&(B.maxDistance=p),v!==B.orientationX.value&&(B.orientationX.value=v),m!==B.orientationY.value&&(B.orientationY.value=m),g!==B.orientationZ.value&&(B.orientationZ.value=g),C!==B.panningModel&&(B.panningModel=C),y!==B.positionX.value&&(B.positionX.value=y),w!==B.positionY.value&&(B.positionY.value=w),_!==B.positionZ.value&&(B.positionZ.value=_),b!==B.refDistance&&(B.refDistance=b),M!==B.rolloffFactor&&(B.rolloffFactor=M),1===F[0]&&0===F[1]&&0===F[2]||x.setOrientation(...F),0===W[0]&&0===W[1]&&0===W[2]||x.setPosition(...W);return c(je(B,x),(()=>{I.connect(x),e(I,L,0,0),L.connect(N).connect(E,0,0),L.connect(T).connect(E,0,1),L.connect(S).connect(E,0,2),L.connect(k).connect(E,0,3),L.connect(D).connect(E,0,4),L.connect(R).connect(E,0,5),E.connect(P).connect(u.destination);}),(()=>{I.disconnect(x),s(I,L,0,0),L.disconnect(N),N.disconnect(E),L.disconnect(T),T.disconnect(E),L.disconnect(S),S.disconnect(E),L.disconnect(k),k.disconnect(E),L.disconnect(D),D.disconnect(E),L.disconnect(R),R.disconnect(E),E.disconnect(P),P.disconnect(u.destination);}))})(U,Ae,In,Xe,Ge,eo,ze,J,An),no=(oo=to,(e,t)=>{const n=e.createPanner();return void 0===n.orientationX?oo(e,t):(ke(n,t),Re(n,t,"orientationX"),Re(n,t,"orientationY"),Re(n,t,"orientationZ"),Re(n,t,"positionX"),Re(n,t,"positionY"),Re(n,t,"positionZ"),Se(n,t,"coneInnerAngle"),Se(n,t,"coneOuterAngle"),Se(n,t,"coneOuterGain"),Se(n,t,"distanceModel"),Se(n,t,"maxDistance"),Se(n,t,"panningModel"),Se(n,t,"refDistance"),Se(n,t,"rolloffFactor"),n)});var oo;const ro=((e,t,n,o,r,a,i)=>class extends e{constructor(e,s){const c=r(e),u={...Qe,...s},l=n(c,u),d=a(c);super(e,!1,l,d?o():null),this._nativePannerNode=l,this._orientationX=t(this,d,l.orientationX,R,D),this._orientationY=t(this,d,l.orientationY,R,D),this._orientationZ=t(this,d,l.orientationZ,R,D),this._positionX=t(this,d,l.positionX,R,D),this._positionY=t(this,d,l.positionY,R,D),this._positionZ=t(this,d,l.positionZ,R,D),i(this,1);}get coneInnerAngle(){return this._nativePannerNode.coneInnerAngle}set coneInnerAngle(e){this._nativePannerNode.coneInnerAngle=e;}get coneOuterAngle(){return this._nativePannerNode.coneOuterAngle}set coneOuterAngle(e){this._nativePannerNode.coneOuterAngle=e;}get coneOuterGain(){return this._nativePannerNode.coneOuterGain}set coneOuterGain(e){this._nativePannerNode.coneOuterGain=e;}get distanceModel(){return this._nativePannerNode.distanceModel}set distanceModel(e){this._nativePannerNode.distanceModel=e;}get maxDistance(){return this._nativePannerNode.maxDistance}set maxDistance(e){this._nativePannerNode.maxDistance=e;}get orientationX(){return this._orientationX}get orientationY(){return this._orientationY}get orientationZ(){return this._orientationZ}get panningModel(){return this._nativePannerNode.panningModel}set panningModel(e){this._nativePannerNode.panningModel=e;}get positionX(){return this._positionX}get positionY(){return this._positionY}get positionZ(){return this._positionZ}get refDistance(){return this._nativePannerNode.refDistance}set refDistance(e){this._nativePannerNode.refDistance=e;}get rolloffFactor(){return this._nativePannerNode.rolloffFactor}set rolloffFactor(e){this._nativePannerNode.rolloffFactor=e;}})(Xt,un,no,((e,t,n,o,r,a,i,s,c,u)=>()=>{const l=new WeakMap;let d=null;return {render(h,f,p){const v=l.get(f);return void 0!==v?Promise.resolve(v):(async(h,f,p)=>{let v=null,m=a(h);const g={channelCount:m.channelCount,channelCountMode:m.channelCountMode,channelInterpretation:m.channelInterpretation},C={...g,coneInnerAngle:m.coneInnerAngle,coneOuterAngle:m.coneOuterAngle,coneOuterGain:m.coneOuterGain,distanceModel:m.distanceModel,maxDistance:m.maxDistance,panningModel:m.panningModel,refDistance:m.refDistance,rolloffFactor:m.rolloffFactor},y=I(m,f);if("bufferSize"in m)v=o(f,{...g,gain:1});else if(!y){const e={...C,orientationX:m.orientationX.value,orientationY:m.orientationY.value,orientationZ:m.orientationZ.value,positionX:m.positionX.value,positionY:m.positionY.value,positionZ:m.positionZ.value};m=r(f,e);}if(l.set(f,null===v?m:v),null!==v){if(null===d){if(null===i)throw new Error("Missing the native OfflineAudioContext constructor.");const e=new i(6,h.context.length,f.sampleRate),o=t(e,{channelCount:1,channelCountMode:"explicit",channelInterpretation:"speakers",numberOfInputs:6});o.connect(e.destination),d=(async()=>{const t=await Promise.all([h.orientationX,h.orientationY,h.orientationZ,h.positionX,h.positionY,h.positionZ].map((async(t,o)=>{const r=n(e,{channelCount:1,channelCountMode:"explicit",channelInterpretation:"discrete",offset:0===o?1:0});return await s(e,t,r.offset,p),r})));for(let e=0;e<6;e+=1)t[e].connect(o,0,e),t[e].start(0);return u(e)})();}const e=await d,a=o(f,{...g,gain:1});await c(h,f,a,p);const l=[];for(let t=0;t<e.numberOfChannels;t+=1)l.push(e.getChannelData(t));let m=[l[0][0],l[1][0],l[2][0]],y=[l[3][0],l[4][0],l[5][0]],w=o(f,{...g,gain:1}),_=r(f,{...C,orientationX:m[0],orientationY:m[1],orientationZ:m[2],positionX:y[0],positionY:y[1],positionZ:y[2]});a.connect(w).connect(_.inputs[0]),_.connect(v);for(let t=128;t<e.length;t+=128){const e=[l[0][t],l[1][t],l[2][t]],n=[l[3][t],l[4][t],l[5][t]];if(e.some(((e,t)=>e!==m[t]))||n.some(((e,t)=>e!==y[t]))){m=e,y=n;const i=t/f.sampleRate;w.gain.setValueAtTime(0,i),w=o(f,{...g,gain:0}),_=r(f,{...C,orientationX:m[0],orientationY:m[1],orientationZ:m[2],positionX:y[0],positionY:y[1],positionZ:y[2]}),w.gain.setValueAtTime(1,i),a.connect(w).connect(_.inputs[0]),_.connect(v);}}return v}return y?(await e(f,h.orientationX,m.orientationX,p),await e(f,h.orientationY,m.orientationY,p),await e(f,h.orientationZ,m.orientationZ,p),await e(f,h.positionX,m.positionX,p),await e(f,h.positionY,m.positionY,p),await e(f,h.positionZ,m.positionZ,p)):(await s(f,h.orientationX,m.orientationX,p),await s(f,h.orientationY,m.orientationY,p),await s(f,h.orientationZ,m.orientationZ,p),await s(f,h.positionX,m.positionX,p),await s(f,h.positionY,m.positionY,p),await s(f,h.positionZ,m.positionZ,p)),z(m)?await c(h,f,m.inputs[0],p):await c(h,f,m,p),m})(h,f,p)}}})(on,In,kn,Xe,no,K,kt,sn,xt,qn),Tt,Dt,pn),ao=((e,t,n,o)=>class r{constructor(r,a){const i=t(r),s=o({...$e,...a}),c=e(i,s);return n.add(c),c}static[Symbol.hasInstance](e){return null!==e&&"object"==typeof e&&Object.getPrototypeOf(e)===r.prototype||n.has(e)}})((e=>(t,{disableNormalization:n,imag:o,real:r})=>{const a=o instanceof Float32Array?o:new Float32Array(o),i=r instanceof Float32Array?r:new Float32Array(r),s=t.createPeriodicWave(i,a,{disableNormalization:n});if(Array.from(o).length<2)throw e();return s})(T),Tt,new WeakSet,(e=>{const{imag:t,real:n}=e;return void 0===t?void 0===n?{...e,imag:[0,0],real:[0,0]}:{...e,imag:Array.from(n,(()=>0)),real:n}:void 0===n?{...e,imag:t,real:Array.from(t,(()=>0))}:{...e,imag:t,real:n}})),io=((e,t)=>(n,o)=>{const r=o.channelCountMode;if("clamped-max"===r)throw t();if(void 0===n.createStereoPanner)return e(n,o);const a=n.createStereoPanner();return ke(a,o),Re(a,o,"pan"),Object.defineProperty(a,"channelCountMode",{get:()=>r,set:e=>{if(e!==r)throw t()}}),a})(((e,t,n,o,r,a)=>{const i=16385,s=new Float32Array([1,1]),c=Math.PI/2,u={channelCount:1,channelCountMode:"explicit",channelInterpretation:"discrete"},l={...u,oversample:"none"},d=(e,a,d,h,f)=>{if(1===a)return ((e,t,r,a)=>{const d=new Float32Array(i),h=new Float32Array(i);for(let e=0;e<i;e+=1){const t=e/16384*c;d[e]=Math.cos(t),h[e]=Math.sin(t);}const f=n(e,{...u,gain:0}),p=o(e,{...l,curve:d}),v=o(e,{...l,curve:s}),m=n(e,{...u,gain:0}),g=o(e,{...l,curve:h});return {connectGraph(){t.connect(f),t.connect(v.inputs[0]),t.connect(m),v.connect(r),r.connect(p.inputs[0]),r.connect(g.inputs[0]),p.connect(f.gain),g.connect(m.gain),f.connect(a,0,0),m.connect(a,0,1);},disconnectGraph(){t.disconnect(f),t.disconnect(v.inputs[0]),t.disconnect(m),v.disconnect(r),r.disconnect(p.inputs[0]),r.disconnect(g.inputs[0]),p.disconnect(f.gain),g.disconnect(m.gain),f.disconnect(a,0,0),m.disconnect(a,0,1);}}})(e,d,h,f);if(2===a)return ((e,r,a,d)=>{const h=new Float32Array(i),f=new Float32Array(i),p=new Float32Array(i),v=new Float32Array(i),m=Math.floor(8192.5);for(let e=0;e<i;e+=1)if(e>m){const t=(e-m)/(16384-m)*c;h[e]=Math.cos(t),f[e]=Math.sin(t),p[e]=0,v[e]=1;}else {const t=e/(16384-m)*c;h[e]=1,f[e]=0,p[e]=Math.cos(t),v[e]=Math.sin(t);}const g=t(e,{channelCount:2,channelCountMode:"explicit",channelInterpretation:"discrete",numberOfOutputs:2}),C=n(e,{...u,gain:0}),y=o(e,{...l,curve:h}),w=n(e,{...u,gain:0}),_=o(e,{...l,curve:f}),b=o(e,{...l,curve:s}),M=n(e,{...u,gain:0}),A=o(e,{...l,curve:p}),x=n(e,{...u,gain:0}),O=o(e,{...l,curve:v});return {connectGraph(){r.connect(g),r.connect(b.inputs[0]),g.connect(C,0),g.connect(w,0),g.connect(M,1),g.connect(x,1),b.connect(a),a.connect(y.inputs[0]),a.connect(_.inputs[0]),a.connect(A.inputs[0]),a.connect(O.inputs[0]),y.connect(C.gain),_.connect(w.gain),A.connect(M.gain),O.connect(x.gain),C.connect(d,0,0),M.connect(d,0,0),w.connect(d,0,1),x.connect(d,0,1);},disconnectGraph(){r.disconnect(g),r.disconnect(b.inputs[0]),g.disconnect(C,0),g.disconnect(w,0),g.disconnect(M,1),g.disconnect(x,1),b.disconnect(a),a.disconnect(y.inputs[0]),a.disconnect(_.inputs[0]),a.disconnect(A.inputs[0]),a.disconnect(O.inputs[0]),y.disconnect(C.gain),_.disconnect(w.gain),A.disconnect(M.gain),O.disconnect(x.gain),C.disconnect(d,0,0),M.disconnect(d,0,0),w.disconnect(d,0,1),x.disconnect(d,0,1);}}})(e,d,h,f);throw r()};return (t,{channelCount:o,channelCountMode:i,pan:s,...c})=>{if("max"===i)throw r();const u=e(t,{...c,channelCount:1,channelCountMode:i,numberOfInputs:2}),l=n(t,{...c,channelCount:o,channelCountMode:i,gain:1}),h=n(t,{channelCount:1,channelCountMode:"explicit",channelInterpretation:"discrete",gain:s});let{connectGraph:f,disconnectGraph:p}=d(t,o,l,h,u);Object.defineProperty(h.gain,"defaultValue",{get:()=>0}),Object.defineProperty(h.gain,"minValue",{get:()=>-1});const v={get bufferSize(){},get channelCount(){return l.channelCount},set channelCount(e){l.channelCount!==e&&(m&&p(),({connectGraph:f,disconnectGraph:p}=d(t,e,l,h,u)),m&&f()),l.channelCount=e;},get channelCountMode(){return l.channelCountMode},set channelCountMode(e){if("clamped-max"===e||"max"===e)throw r();l.channelCountMode=e;},get channelInterpretation(){return l.channelInterpretation},set channelInterpretation(e){l.channelInterpretation=e;},get context(){return l.context},get inputs(){return [l]},get numberOfInputs(){return l.numberOfInputs},get numberOfOutputs(){return l.numberOfOutputs},get pan(){return h.gain},addEventListener:(...e)=>l.addEventListener(e[0],e[1],e[2]),dispatchEvent:(...e)=>l.dispatchEvent(e[0]),removeEventListener:(...e)=>l.removeEventListener(e[0],e[1],e[2])};let m=!1;return a(je(v,u),(()=>{f(),m=!0;}),(()=>{p(),m=!1;}))}})(In,Ve,Xe,eo,ze,An),ze),so=((e,t,n,o,r,a)=>class extends e{constructor(e,i){const s=r(e),c={...Je,...i},u=n(s,c),l=a(s);super(e,!1,u,l?o():null),this._pan=t(this,l,u.pan);}get pan(){return this._pan}})(Xt,un,io,((e,t,n,o,r)=>()=>{const a=new WeakMap;return {render(i,s,c){const u=a.get(s);return void 0!==u?Promise.resolve(u):(async(i,s,c)=>{let u=n(i);const l=I(u,s);if(!l){const e={channelCount:u.channelCount,channelCountMode:u.channelCountMode,channelInterpretation:u.channelInterpretation,pan:u.pan.value};u=t(s,e);}return a.set(s,u),l?await e(s,i.pan,u.pan,c):await o(s,i.pan,u.pan,c),z(u)?await r(i,s,u.inputs[0],c):await r(i,s,u,c),u})(i,s,c)}}})(on,io,K,sn,xt),Tt,Dt),co=((e,t,n)=>()=>{const o=new WeakMap;return {render(r,a,i){const s=o.get(a);return void 0!==s?Promise.resolve(s):(async(r,a,i)=>{let s=t(r);if(!I(s,a)){const t={channelCount:s.channelCount,channelCountMode:s.channelCountMode,channelInterpretation:s.channelInterpretation,curve:s.curve,oversample:s.oversample};s=e(a,t);}return o.set(a,s),z(s)?await n(r,a,s.inputs[0],i):await n(r,a,s,i),s})(r,a,i)}}})(eo,K,xt),uo=((e,t,n,o,r,a,i)=>class extends e{constructor(e,t){const s=r(e),c={...et,...t},u=n(s,c);super(e,!0,u,a(s)?o():null),this._isCurveNullified=!1,this._nativeWaveShaperNode=u,i(this,1);}get curve(){return this._isCurveNullified?null:this._nativeWaveShaperNode.curve}set curve(e){if(null===e)this._isCurveNullified=!0,this._nativeWaveShaperNode.curve=new Float32Array([0,0]);else {if(e.length<2)throw t();this._isCurveNullified=!1,this._nativeWaveShaperNode.curve=e;}}get oversample(){return this._nativeWaveShaperNode.oversample}set oversample(e){this._nativeWaveShaperNode.oversample=e;}})(Xt,Ae,eo,co,Tt,Dt,pn),lo=(e=>null!==e&&e.isSecureContext)(yt),ho=(e=>(t,n,o)=>{Object.defineProperties(e,{currentFrame:{configurable:!0,get:()=>Math.round(t*n)},currentTime:{configurable:!0,get:()=>t}});try{return o()}finally{null!==e&&(delete e.currentFrame,delete e.currentTime);}})(yt),fo=new WeakMap,po=((e,t)=>n=>{let o=e.get(n);if(void 0!==o)return o;if(null===t)throw new Error("Missing the native OfflineAudioContext constructor.");return o=new t(1,1,8e3),e.set(n,o),o})(fo,kt),vo=(e=>null===e?null:e.hasOwnProperty("AudioWorkletNode")?e.AudioWorkletNode:null)(yt),mo=lo?((e,t,n,o,r,a,i,s,c,u,l,d)=>(f,p,v={credentials:"omit"})=>{const y=a(f),w=new URL(p,d.location.href).toString();if(void 0!==y.audioWorklet)return Promise.all([r(p),Promise.resolve(e(l,l))]).then((([e,t])=>{const[n,o]=m(e,w),r=t?o:o.replace(/\s+extends\s+AudioWorkletProcessor\s*{/," extends (class extends AudioWorkletProcessor {__b=new WeakSet();constructor(){super();(p=>p.postMessage=(q=>(m,t)=>q.call(p,m,t?t.filter(u=>!this.__b.has(u)):t))(p.postMessage))(this.port)}}){"),a=new Blob([`${n};(registerProcessor=>{${r}\n})((n,p)=>registerProcessor(n,class extends p{${t?"":"__c = (a) => a.forEach(e=>this.__b.add(e.buffer));"}process(i,o,p){${t?"":"i.forEach(this.__c);o.forEach(this.__c);this.__c(Object.values(p));"}return super.process(i.map(j=>j.some(k=>k.length===0)?[]:j),o,p)}}))`],{type:"application/javascript; charset=utf-8"}),c=URL.createObjectURL(a);return y.audioWorklet.addModule(c,v).then((()=>{if(s(y))return;return i(y).audioWorklet.addModule(c,v)})).finally((()=>URL.revokeObjectURL(c)))}));const _=u.get(f);if(void 0!==_&&_.has(p))return Promise.resolve();const b=c.get(f);if(void 0!==b){const e=b.get(p);if(void 0!==e)return e}const M=r(p).then((e=>{const[t,o]=m(e,w);return n(`${t};((a,b)=>{(a[b]=a[b]||[]).push((AudioWorkletProcessor,global,registerProcessor,sampleRate,self,window)=>{${o}\n})})(window,'_AWGS')`)})).then((()=>{const e=d._AWGS.pop();if(void 0===e)throw new SyntaxError;o(y.currentTime,y.sampleRate,(()=>e(class{},void 0,((e,n)=>{if(""===e.trim())throw t();const o=h.get(y);if(void 0!==o){if(o.has(e))throw t();C(n),g(n.parameterDescriptors),o.set(e,n);}else C(n),g(n.parameterDescriptors),h.set(y,new Map([[e,n]]));}),y.sampleRate,void 0,void 0)));}));return void 0===b?c.set(f,new Map([[p,M]])):b.set(p,M),M.then((()=>{const e=u.get(f);void 0===e?u.set(f,new Set([p])):e.add(p);})).finally((()=>{const e=c.get(f);void 0!==e&&e.delete(p);})),M})(mt,ze,(e=>t=>new Promise(((n,o)=>{if(null===e)return void o(new SyntaxError);const r=e.document.head;if(null===r)o(new SyntaxError);else {const a=e.document.createElement("script"),i=new Blob([t],{type:"application/javascript"}),s=URL.createObjectURL(i),c=e.onerror,u=()=>{e.onerror=c,URL.revokeObjectURL(s);};e.onerror=(t,n,r,a,i)=>n===s||n===e.location.href&&1===r&&1===a?(u(),o(i),!1):null!==c?c(t,n,r,a,i):void 0,a.onerror=()=>{u(),o(new SyntaxError);},a.onload=()=>{u(),n();},a.src=s,a.type="module",r.appendChild(a);}})))(yt),ho,(e=>async t=>{try{const e=await fetch(t);if(e.ok)return e.text()}catch{}throw e()})((()=>new DOMException("","AbortError"))),Tt,po,Dt,new WeakMap,new WeakMap,((e,t)=>async()=>{if(null===e)return !0;if(null===t)return !1;const n=new Blob(['class A extends AudioWorkletProcessor{process(i){this.port.postMessage(i,[i[0][0].buffer])}}registerProcessor("a",A)'],{type:"application/javascript; charset=utf-8"}),o=new t(1,128,8e3),r=URL.createObjectURL(n);let a=!1,i=!1;try{await o.audioWorklet.addModule(r);const t=new e(o,"a",{numberOfOutputs:0}),n=o.createOscillator();t.port.onmessage=()=>a=!0,t.onprocessorerror=()=>i=!0,n.connect(t),await o.startRendering();}catch{}finally{URL.revokeObjectURL(r);}return a&&!i})(vo,kt),yt):void 0,go=((e,t)=>n=>e(n)||t(n))(Bt,Dt),Co=((e,t,n,o,r,a,i,s,c,u,l)=>(d,h)=>{const f=i(d)?d:a(d);if(r.has(h)){const e=n();return Promise.reject(e)}try{r.add(h);}catch{}return t(c,(()=>c(f)))?f.decodeAudioData(h).then((n=>(t(s,(()=>s(n)))||l(n),e.add(n),n))):new Promise(((t,n)=>{const r=()=>{try{(e=>{const{port1:t}=new MessageChannel;t.postMessage(e,[e]);})(h);}catch{}},a=e=>{n(e),r();};try{f.decodeAudioData(h,(n=>{"function"!=typeof n.copyFromChannel&&(u(n),S(n)),e.add(n),r(),t(n);}),(e=>{a(null===e?o():e);}));}catch(e){a(e);}}))})(Gt,mt,(()=>new DOMException("","DataCloneError")),(()=>new DOMException("","EncodingError")),new WeakSet,Tt,go,N,Ne,Qt,$t),yo=((e,t,n,o,r,a,i,s,c,u,l,d,h,f,p,v,m,g,C,y)=>class extends p{constructor(t,n){super(t,n),this._nativeContext=t,this._audioWorklet=void 0===e?void 0:{addModule:(t,n)=>e(this,t,n)};}get audioWorklet(){return this._audioWorklet}createAnalyser(){return new t(this)}createBiquadFilter(){return new r(this)}createBuffer(e,t,o){return new n({length:t,numberOfChannels:e,sampleRate:o})}createBufferSource(){return new o(this)}createChannelMerger(e=6){return new a(this,{numberOfInputs:e})}createChannelSplitter(e=6){return new i(this,{numberOfOutputs:e})}createConstantSource(){return new s(this)}createConvolver(){return new c(this)}createDelay(e=1){return new l(this,{maxDelayTime:e})}createDynamicsCompressor(){return new d(this)}createGain(){return new h(this)}createIIRFilter(e,t){return new f(this,{feedback:t,feedforward:e})}createOscillator(){return new v(this)}createPanner(){return new m(this)}createPeriodicWave(e,t,n={disableNormalization:!1}){return new g(this,{...n,imag:t,real:e})}createStereoPanner(){return new C(this)}createWaveShaper(){return new y(this)}decodeAudioData(e,t,n){return u(this._nativeContext,e).then((e=>("function"==typeof t&&t(e),e))).catch((e=>{throw "function"==typeof n&&n(e),e}))}})(mo,Zt,Jt,dn,vn,Nn,Tn,Dn,Pn,Co,Ln,Bn,Vn,Zn,Un,Qn,ro,ao,so,uo),wo=((e,t,n,o)=>class extends e{constructor(e,r){const a=n(e),i=t(a,r);if(o(a))throw TypeError();super(e,!0,i,null),this._nativeMediaElementAudioSourceNode=i;}get mediaElement(){return this._nativeMediaElementAudioSourceNode.mediaElement}})(Xt,((e,t)=>e.createMediaElementSource(t.mediaElement)),Tt,Dt),_o=((e,t,n,o)=>class extends e{constructor(e,r){const a=n(e);if(o(a))throw new TypeError;const i={...Ie,...r},s=t(a,i);super(e,!1,s,null),this._nativeMediaStreamAudioDestinationNode=s;}get stream(){return this._nativeMediaStreamAudioDestinationNode.stream}})(Xt,((e,t)=>{const n=e.createMediaStreamDestination();return ke(n,t),1===n.numberOfOutputs&&Object.defineProperty(n,"numberOfOutputs",{get:()=>0}),n}),Tt,Dt),bo=((e,t,n,o)=>class extends e{constructor(e,r){const a=n(e),i=t(a,r);if(o(a))throw new TypeError;super(e,!0,i,null),this._nativeMediaStreamAudioSourceNode=i;}get mediaStream(){return this._nativeMediaStreamAudioSourceNode.mediaStream}})(Xt,((e,{mediaStream:t})=>{const n=t.getAudioTracks();n.sort(((e,t)=>e.id<t.id?-1:e.id>t.id?1:0));const o=n.slice(0,1),r=e.createMediaStreamSource(new MediaStream(o));return Object.defineProperty(r,"mediaStream",{value:t}),r}),Tt,Dt),Mo=((e,t,n)=>class extends e{constructor(e,o){const r=n(e);super(e,!0,t(r,o),null);}})(Xt,((e,t)=>(n,{mediaStreamTrack:o})=>{if("function"==typeof n.createMediaStreamTrackSource)return n.createMediaStreamTrackSource(o);const r=new MediaStream([o]),a=n.createMediaStreamSource(r);if("audio"!==o.kind)throw e();if(t(n))throw new TypeError;return a})(Ae,Dt),Tt),Ao=((e,t,n,o,r,a,i,s,c)=>class extends e{constructor(e={}){if(null===c)throw new Error("Missing the native AudioContext constructor.");const t=new c(e);if(null===t)throw o();if(!j(e.latencyHint))throw new TypeError(`The provided value '${e.latencyHint}' is not a valid enum value of type AudioContextLatencyCategory.`);if(void 0!==e.sampleRate&&t.sampleRate!==e.sampleRate)throw n();super(t,2);const{latencyHint:r}=e,{sampleRate:a}=t;if(this._baseLatency="number"==typeof t.baseLatency?t.baseLatency:"balanced"===r?512/a:"interactive"===r||void 0===r?256/a:"playback"===r?1024/a:128*Math.max(2,Math.min(128,Math.round(r*a/128)))/a,this._nativeAudioContext=t,"webkitAudioContext"===c.name?(this._nativeGainNode=t.createGain(),this._nativeOscillatorNode=t.createOscillator(),this._nativeGainNode.gain.value=1e-37,this._nativeOscillatorNode.connect(this._nativeGainNode).connect(t.destination),this._nativeOscillatorNode.start()):(this._nativeGainNode=null,this._nativeOscillatorNode=null),this._state=null,"running"===t.state){this._state="suspended";const e=()=>{"suspended"===this._state&&(this._state=null),t.removeEventListener("statechange",e);};t.addEventListener("statechange",e);}}get baseLatency(){return this._baseLatency}get state(){return null!==this._state?this._state:this._nativeAudioContext.state}close(){return "closed"===this.state?this._nativeAudioContext.close().then((()=>{throw t()})):("suspended"===this._state&&(this._state=null),this._nativeAudioContext.close().then((()=>{null!==this._nativeGainNode&&null!==this._nativeOscillatorNode&&(this._nativeOscillatorNode.stop(),this._nativeGainNode.disconnect(),this._nativeOscillatorNode.disconnect()),V(this);})))}createMediaElementSource(e){return new r(this,{mediaElement:e})}createMediaStreamDestination(){return new a(this)}createMediaStreamSource(e){return new i(this,{mediaStream:e})}createMediaStreamTrackSource(e){return new s(this,{mediaStreamTrack:e})}resume(){return "suspended"===this._state?new Promise(((e,t)=>{const n=()=>{this._nativeAudioContext.removeEventListener("statechange",n),"running"===this._nativeAudioContext.state?e():this.resume().then(e,t);};this._nativeAudioContext.addEventListener("statechange",n);})):this._nativeAudioContext.resume().catch((e=>{if(void 0===e||15===e.code)throw t();throw e}))}suspend(){return this._nativeAudioContext.suspend().catch((e=>{if(void 0===e)throw t();throw e}))}})(yo,Ae,ze,Ke,wo,_o,bo,Mo,Wt),xo=(Oo=zn,e=>{const t=Oo.get(e);if(void 0===t)throw new Error("The context has no set of AudioWorkletNodes.");return t});var Oo;const Eo=(Io=xo,(e,t)=>{Io(e).add(t);});var Io;const No=(e=>(t,n,o=0,r=0)=>{const a=t[o];if(void 0===a)throw e();return ae(n)?a.connect(n,0,r):a.connect(n,0)})(T),To=(e=>(t,n)=>{e(t).delete(n);})(xo),So=(e=>(t,n,o,r=0)=>void 0===n?t.forEach((e=>e.disconnect())):"number"==typeof n?_e(e,t,n).disconnect():ae(n)?void 0===o?t.forEach((e=>e.disconnect(n))):void 0===r?_e(e,t,o).disconnect(n,0):_e(e,t,o).disconnect(n,0,r):void 0===o?t.forEach((e=>e.disconnect(n))):_e(e,t,o).disconnect(n,0))(T),ko=new WeakMap,Do=((e,t)=>n=>t(e,n))(ko,y),Ro=((e,t,n,o,r,a,i,s,c,u,l,d,h)=>(p,v,m,g)=>{if(0===g.numberOfInputs&&0===g.numberOfOutputs)throw c();const C=Array.isArray(g.outputChannelCount)?g.outputChannelCount:Array.from(g.outputChannelCount);if(C.some((e=>e<1)))throw c();if(C.length!==g.numberOfOutputs)throw t();if("explicit"!==g.channelCountMode)throw c();const y=g.channelCount*g.numberOfInputs,w=C.reduce(((e,t)=>e+t),0),_=void 0===m.parameterDescriptors?0:m.parameterDescriptors.length;if(y+_>6||w>6)throw c();const b=new MessageChannel,M=[],A=[];for(let e=0;e<g.numberOfInputs;e+=1)M.push(i(p,{channelCount:g.channelCount,channelCountMode:g.channelCountMode,channelInterpretation:g.channelInterpretation,gain:1})),A.push(r(p,{channelCount:g.channelCount,channelCountMode:"explicit",channelInterpretation:"discrete",numberOfOutputs:g.channelCount}));const x=[];if(void 0!==m.parameterDescriptors)for(const{defaultValue:e,maxValue:t,minValue:n,name:o}of m.parameterDescriptors){const r=a(p,{channelCount:1,channelCountMode:"explicit",channelInterpretation:"discrete",offset:void 0!==g.parameterData[o]?g.parameterData[o]:void 0===e?0:e});Object.defineProperties(r.offset,{defaultValue:{get:()=>void 0===e?0:e},maxValue:{get:()=>void 0===t?R:t},minValue:{get:()=>void 0===n?D:n}}),x.push(r);}const O=o(p,{channelCount:1,channelCountMode:"explicit",channelInterpretation:"speakers",numberOfInputs:Math.max(1,y+_)}),E=Fe(v,p.sampleRate),I=s(p,E,y+_,Math.max(1,w)),N=r(p,{channelCount:Math.max(1,w),channelCountMode:"explicit",channelInterpretation:"discrete",numberOfOutputs:Math.max(1,w)}),T=[];for(let e=0;e<g.numberOfOutputs;e+=1)T.push(o(p,{channelCount:1,channelCountMode:"explicit",channelInterpretation:"speakers",numberOfInputs:C[e]}));for(let e=0;e<g.numberOfInputs;e+=1){M[e].connect(A[e]);for(let t=0;t<g.channelCount;t+=1)A[e].connect(O,t,e*g.channelCount+t);}const S=new ue(void 0===m.parameterDescriptors?[]:m.parameterDescriptors.map((({name:e},t)=>{const n=x[t];return n.connect(O,0,y+t),n.start(0),[e,n.offset]})));O.connect(I);let k=g.channelInterpretation,P=null;const L=0===g.numberOfOutputs?[I]:T,F={get bufferSize(){return E},get channelCount(){return g.channelCount},set channelCount(e){throw n()},get channelCountMode(){return g.channelCountMode},set channelCountMode(e){throw n()},get channelInterpretation(){return k},set channelInterpretation(e){for(const t of M)t.channelInterpretation=e;k=e;},get context(){return I.context},get inputs(){return M},get numberOfInputs(){return g.numberOfInputs},get numberOfOutputs(){return g.numberOfOutputs},get onprocessorerror(){return P},set onprocessorerror(e){"function"==typeof P&&F.removeEventListener("processorerror",P),P="function"==typeof e?e:null,"function"==typeof P&&F.addEventListener("processorerror",P);},get parameters(){return S},get port(){return b.port2},addEventListener:(...e)=>I.addEventListener(e[0],e[1],e[2]),connect:e.bind(null,L),disconnect:u.bind(null,L),dispatchEvent:(...e)=>I.dispatchEvent(e[0]),removeEventListener:(...e)=>I.removeEventListener(e[0],e[1],e[2])},W=new Map;var B,V;b.port1.addEventListener=(B=b.port1.addEventListener,(...e)=>{if("message"===e[0]){const t="function"==typeof e[1]?e[1]:"object"==typeof e[1]&&null!==e[1]&&"function"==typeof e[1].handleEvent?e[1].handleEvent:null;if(null!==t){const n=W.get(e[1]);void 0!==n?e[1]=n:(e[1]=e=>{l(p.currentTime,p.sampleRate,(()=>t(e)));},W.set(t,e[1]));}}return B.call(b.port1,e[0],e[1],e[2])}),b.port1.removeEventListener=(V=b.port1.removeEventListener,(...e)=>{if("message"===e[0]){const t=W.get(e[1]);void 0!==t&&(W.delete(e[1]),e[1]=t);}return V.call(b.port1,e[0],e[1],e[2])});let j=null;Object.defineProperty(b.port1,"onmessage",{get:()=>j,set:e=>{"function"==typeof j&&b.port1.removeEventListener("message",j),j="function"==typeof e?e:null,"function"==typeof j&&(b.port1.addEventListener("message",j),b.port1.start());}}),m.prototype.port=b.port1;let q=null;((e,t,n,o)=>{let r=f.get(e);void 0===r&&(r=new WeakMap,f.set(e,r));const a=We(n,o);return r.set(t,a),a})(p,F,m,g).then((e=>q=e));const X=fe(g.numberOfInputs,g.channelCount),Y=fe(g.numberOfOutputs,C),Z=void 0===m.parameterDescriptors?[]:m.parameterDescriptors.reduce(((e,{name:t})=>({...e,[t]:new Float32Array(128)})),{});let G=!0;const z=()=>{g.numberOfOutputs>0&&I.disconnect(N);for(let e=0,t=0;e<g.numberOfOutputs;e+=1){const n=T[e];for(let o=0;o<C[e];o+=1)N.disconnect(n,t+o,o);t+=C[e];}},U=new Map;I.onaudioprocess=({inputBuffer:e,outputBuffer:t})=>{if(null!==q){const n=d(F);for(let o=0;o<E;o+=128){for(let t=0;t<g.numberOfInputs;t+=1)for(let n=0;n<g.channelCount;n+=1)de(e,X[t],n,n,o);void 0!==m.parameterDescriptors&&m.parameterDescriptors.forEach((({name:t},n)=>{de(e,Z,t,y+n,o);}));for(let e=0;e<g.numberOfInputs;e+=1)for(let t=0;t<C[e];t+=1)0===Y[e][t].byteLength&&(Y[e][t]=new Float32Array(128));try{const e=X.map(((e,t)=>{if(n[t].size>0)return U.set(t,E/128),e;const o=U.get(t);return void 0===o?[]:(e.every((e=>e.every((e=>0===e))))&&(1===o?U.delete(t):U.set(t,o-1)),e)})),r=l(p.currentTime+o/p.sampleRate,p.sampleRate,(()=>q.process(e,Y,Z)));G=r;for(let e=0,n=0;e<g.numberOfOutputs;e+=1){for(let r=0;r<C[e];r+=1)he(t,Y[e],r,n+r,o);n+=C[e];}}catch(e){G=!1,F.dispatchEvent(new ErrorEvent("processorerror",{colno:e.colno,filename:e.filename,lineno:e.lineno,message:e.message}));}if(!G){for(let e=0;e<g.numberOfInputs;e+=1){M[e].disconnect(A[e]);for(let t=0;t<g.channelCount;t+=1)A[o].disconnect(O,t,e*g.channelCount+t);}if(void 0!==m.parameterDescriptors){const e=m.parameterDescriptors.length;for(let t=0;t<e;t+=1){const e=x[t];e.disconnect(O,0,y+t),e.stop();}}O.disconnect(I),I.onaudioprocess=null,H?z():J();break}}}};let H=!1;const Q=i(p,{channelCount:1,channelCountMode:"explicit",channelInterpretation:"discrete",gain:0}),$=()=>I.connect(Q).connect(p.destination),J=()=>{I.disconnect(Q),Q.disconnect();};return $(),h(F,(()=>{if(G){J(),g.numberOfOutputs>0&&I.connect(N);for(let e=0,t=0;e<g.numberOfOutputs;e+=1){const n=T[e];for(let o=0;o<C[e];o+=1)N.connect(n,t+o,o);t+=C[e];}}H=!0;}),(()=>{G&&($(),z()),H=!1;}))})(No,T,Ae,In,Ve,kn,Xe,Ge,ze,So,ho,Do,An),Po=((e,t,n,o,r)=>(a,i,s,c,u,l)=>{if(null!==s)try{const t=new s(a,c,l),o=new Map;let i=null;if(Object.defineProperties(t,{channelCount:{get:()=>l.channelCount,set:()=>{throw e()}},channelCountMode:{get:()=>"explicit",set:()=>{throw e()}},onprocessorerror:{get:()=>i,set:e=>{"function"==typeof i&&t.removeEventListener("processorerror",i),i="function"==typeof e?e:null,"function"==typeof i&&t.addEventListener("processorerror",i);}}}),t.addEventListener=(h=t.addEventListener,(...e)=>{if("processorerror"===e[0]){const t="function"==typeof e[1]?e[1]:"object"==typeof e[1]&&null!==e[1]&&"function"==typeof e[1].handleEvent?e[1].handleEvent:null;if(null!==t){const n=o.get(e[1]);void 0!==n?e[1]=n:(e[1]=n=>{"error"===n.type?(Object.defineProperties(n,{type:{value:"processorerror"}}),t(n)):t(new ErrorEvent(e[0],{...n}));},o.set(t,e[1]));}}return h.call(t,"error",e[1],e[2]),h.call(t,...e)}),t.removeEventListener=(d=t.removeEventListener,(...e)=>{if("processorerror"===e[0]){const t=o.get(e[1]);void 0!==t&&(o.delete(e[1]),e[1]=t);}return d.call(t,"error",e[1],e[2]),d.call(t,e[0],e[1],e[2])}),0!==l.numberOfOutputs){const e=n(a,{channelCount:1,channelCountMode:"explicit",channelInterpretation:"discrete",gain:0});t.connect(e).connect(a.destination);return r(t,(()=>e.disconnect()),(()=>e.connect(a.destination)))}return t}catch(e){if(11===e.code)throw o();throw e}var d,h;if(void 0===u)throw o();return (e=>{const{port1:t}=new MessageChannel;try{t.postMessage(e);}finally{t.close();}})(l),t(a,i,u,l)})(Ae,Ro,Xe,ze,An),Lo=((e,t,n,o,r,a,i,s,c,u,l,d,h,f,p,v)=>(m,g,C)=>{const y=new WeakMap;let w=null;return {render(_,b,M){s(b,_);const A=y.get(b);return void 0!==A?Promise.resolve(A):(async(s,_,b)=>{let M=l(s),A=null;const x=I(M,_),O=Array.isArray(g.outputChannelCount)?g.outputChannelCount:Array.from(g.outputChannelCount);if(null===d){const e=O.reduce(((e,t)=>e+t),0),n=r(_,{channelCount:Math.max(1,e),channelCountMode:"explicit",channelInterpretation:"discrete",numberOfOutputs:Math.max(1,e)}),a=[];for(let e=0;e<s.numberOfOutputs;e+=1)a.push(o(_,{channelCount:1,channelCountMode:"explicit",channelInterpretation:"speakers",numberOfInputs:O[e]}));const u=i(_,{channelCount:g.channelCount,channelCountMode:g.channelCountMode,channelInterpretation:g.channelInterpretation,gain:1});u.connect=t.bind(null,a),u.disconnect=c.bind(null,a),A=[n,a,u];}else x||(M=new d(_,m));if(y.set(_,null===A?M:A[2]),null!==A){if(null===w){if(void 0===C)throw new Error("Missing the processor constructor.");if(null===h)throw new Error("Missing the native OfflineAudioContext constructor.");const e=s.channelCount*s.numberOfInputs,t=void 0===C.parameterDescriptors?0:C.parameterDescriptors.length,n=e+t,c=async()=>{const c=new h(n,128*Math.ceil(s.context.length/128),_.sampleRate),u=[],l=[];for(let e=0;e<g.numberOfInputs;e+=1)u.push(i(c,{channelCount:g.channelCount,channelCountMode:g.channelCountMode,channelInterpretation:g.channelInterpretation,gain:1})),l.push(r(c,{channelCount:g.channelCount,channelCountMode:"explicit",channelInterpretation:"discrete",numberOfOutputs:g.channelCount}));const d=await Promise.all(Array.from(s.parameters.values()).map((async e=>{const t=a(c,{channelCount:1,channelCountMode:"explicit",channelInterpretation:"discrete",offset:e.value});return await f(c,e,t.offset,b),t}))),m=o(c,{channelCount:1,channelCountMode:"explicit",channelInterpretation:"speakers",numberOfInputs:Math.max(1,e+t)});for(let e=0;e<g.numberOfInputs;e+=1){u[e].connect(l[e]);for(let t=0;t<g.channelCount;t+=1)l[e].connect(m,t,e*g.channelCount+t);}for(const[t,n]of d.entries())n.connect(m,0,e+t),n.start(0);return m.connect(c.destination),await Promise.all(u.map((e=>p(s,c,e,b)))),v(c)};w=pe(s,0===n?null:await c(),_,g,O,C,u);}const e=await w,t=n(_,{buffer:null,channelCount:2,channelCountMode:"max",channelInterpretation:"speakers",loop:!1,loopEnd:0,loopStart:0,playbackRate:1}),[c,l,d]=A;null!==e&&(t.buffer=e,t.start(0)),t.connect(c);for(let e=0,t=0;e<s.numberOfOutputs;e+=1){const n=l[e];for(let o=0;o<O[e];o+=1)c.connect(n,t+o,o);t+=O[e];}return d}if(x)for(const[t,n]of s.parameters.entries())await e(_,n,M.parameters.get(t),b);else for(const[e,t]of s.parameters.entries())await f(_,t,M.parameters.get(e),b);return await p(s,_,M,b),M})(_,b,M)}}})(on,No,rn,In,Ve,kn,Xe,To,So,ho,K,vo,kt,sn,xt,qn),Fo=(e=>t=>e.get(t))(fo),Wo=(e=>(t,n)=>{e.set(t,n);})(ko),Bo=lo?((e,t,n,o,r,a,i,s,c,u,l,d,f)=>class extends t{constructor(t,f,p){var v;const m=s(t),g=c(m),C=l({...le,...p}),y=h.get(m),w=null==y?void 0:y.get(f),_=g||"closed"!==m.state?m:null!==(v=i(m))&&void 0!==v?v:m,b=r(_,g?null:t.baseLatency,u,f,w,C);super(t,!0,b,g?o(f,C,w):null);const M=[];b.parameters.forEach(((e,t)=>{const o=n(this,g,e);M.push([t,o]);})),this._nativeAudioWorkletNode=b,this._onprocessorerror=null,this._parameters=new ue(M),g&&e(m,this);const{activeInputs:A}=a(this);d(b,A);}get onprocessorerror(){return this._onprocessorerror}set onprocessorerror(e){const t="function"==typeof e?f(this,e):null;this._nativeAudioWorkletNode.onprocessorerror=t;const n=this._nativeAudioWorkletNode.onprocessorerror;this._onprocessorerror=null!==n&&n===t?e:n;}get parameters(){return null===this._parameters?this._nativeAudioWorkletNode.parameters:this._parameters}get port(){return this._nativeAudioWorkletNode.port}})(Eo,Xt,un,Lo,Po,F,Fo,Tt,Dt,vo,(e=>({...e,outputChannelCount:void 0!==e.outputChannelCount?e.outputChannelCount:1===e.numberOfInputs&&1===e.numberOfOutputs?[e.channelCount]:Array.from({length:e.numberOfOutputs},(()=>1))})),Wo,ut):void 0,Vo=((e,t,n,o,r)=>class extends o{constructor(e={}){if(null===r)throw new Error("Missing the native AudioContext constructor.");const o=new r(e);if(null===o)throw n();if(!j(e.latencyHint))throw new TypeError(`The provided value '${e.latencyHint}' is not a valid enum value of type AudioContextLatencyCategory.`);if(void 0!==e.sampleRate&&o.sampleRate!==e.sampleRate)throw t();super(o,2);const{latencyHint:a}=e,{sampleRate:i}=o;if(this._baseLatency="number"==typeof o.baseLatency?o.baseLatency:"balanced"===a?512/i:"interactive"===a||void 0===a?256/i:"playback"===a?1024/i:128*Math.max(2,Math.min(128,Math.round(a*i/128)))/i,this._nativeAudioContext=o,"webkitAudioContext"===r.name?(this._nativeGainNode=o.createGain(),this._nativeOscillatorNode=o.createOscillator(),this._nativeGainNode.gain.value=1e-37,this._nativeOscillatorNode.connect(this._nativeGainNode).connect(o.destination),this._nativeOscillatorNode.start()):(this._nativeGainNode=null,this._nativeOscillatorNode=null),this._state=null,"running"===o.state){this._state="suspended";const e=()=>{"suspended"===this._state&&(this._state=null),o.removeEventListener("statechange",e);};o.addEventListener("statechange",e);}}get baseLatency(){return this._baseLatency}get state(){return null!==this._state?this._state:this._nativeAudioContext.state}close(){return "closed"===this.state?this._nativeAudioContext.close().then((()=>{throw e()})):("suspended"===this._state&&(this._state=null),this._nativeAudioContext.close().then((()=>{null!==this._nativeGainNode&&null!==this._nativeOscillatorNode&&(this._nativeOscillatorNode.stop(),this._nativeGainNode.disconnect(),this._nativeOscillatorNode.disconnect()),V(this);})))}resume(){return "suspended"===this._state?new Promise(((e,t)=>{const n=()=>{this._nativeAudioContext.removeEventListener("statechange",n),"running"===this._nativeAudioContext.state?e():this.resume().then(e,t);};this._nativeAudioContext.addEventListener("statechange",n);})):this._nativeAudioContext.resume().catch((t=>{if(void 0===t||15===t.code)throw e();throw t}))}suspend(){return this._nativeAudioContext.suspend().catch((t=>{if(void 0===t)throw e();throw t}))}})(Ae,ze,Ke,Un,Wt),jo=((e,t)=>(n,o,r)=>{if(null===t)throw new Error("Missing the native OfflineAudioContext constructor.");try{return new t(n,o,r)}catch(t){if("SyntaxError"===t.name)throw e();throw t}})(ze,kt),qo=((e,t,n,o,r,a,i,s)=>{const c=[];return (u,l)=>n(u).render(u,l,c).then((()=>Promise.all(Array.from(o(l)).map((e=>n(e).render(e,l,c)))))).then((()=>r(l))).then((n=>("function"!=typeof n.copyFromChannel?(i(n),S(n)):t(a,(()=>a(n)))||s(n),e.add(n),n)))})(Gt,mt,Mt,xo,qn,N,Qt,$t),Xo=((e,t,n,o,r)=>class extends o{constructor(t){const{length:o,numberOfChannels:r,sampleRate:a}={...Te,...t},i=n(r,o,a);e(Ne,(()=>Ne(i)))||i.addEventListener("statechange",(()=>{let e=0;const t=n=>{"running"===this._state&&(e>0?(i.removeEventListener("statechange",t),n.stopImmediatePropagation(),this._waitForThePromiseToSettle(n)):e+=1);};return t})()),super(i,r),this._length=o,this._nativeOfflineAudioContext=i,this._state=null;}get length(){return void 0===this._nativeOfflineAudioContext.length?this._length:this._nativeOfflineAudioContext.length}get state(){return null===this._state?this._nativeOfflineAudioContext.state:this._state}startRendering(){return "running"===this._state?Promise.reject(t()):(this._state="running",r(this.destination,this._nativeOfflineAudioContext).finally((()=>{this._state=null,V(this);})))}_waitForThePromiseToSettle(e){null===this._state?this._nativeOfflineAudioContext.dispatchEvent(e):setTimeout((()=>this._waitForThePromiseToSettle(e)));}})(mt,Ae,jo,Un,qo),Yo=((e,t,n,o,r)=>class extends e{constructor(e,n,r){let a;if("number"==typeof e&&void 0!==n&&void 0!==r)a={length:n,numberOfChannels:e,sampleRate:r};else {if("object"!=typeof e)throw new Error("The given parameters are not valid.");a=e;}const{length:i,numberOfChannels:s,sampleRate:c}={...Ue,...a},u=o(s,i,c);t(Ne,(()=>Ne(u)))||u.addEventListener("statechange",(()=>{let e=0;const t=n=>{"running"===this._state&&(e>0?(u.removeEventListener("statechange",t),n.stopImmediatePropagation(),this._waitForThePromiseToSettle(n)):e+=1);};return t})()),super(u,s),this._length=i,this._nativeOfflineAudioContext=u,this._state=null;}get length(){return void 0===this._nativeOfflineAudioContext.length?this._length:this._nativeOfflineAudioContext.length}get state(){return null===this._state?this._nativeOfflineAudioContext.state:this._state}startRendering(){return "running"===this._state?Promise.reject(n()):(this._state="running",r(this.destination,this._nativeOfflineAudioContext).finally((()=>{this._state=null,V(this);})))}_waitForThePromiseToSettle(e){null===this._state?this._nativeOfflineAudioContext.dispatchEvent(e):setTimeout((()=>this._waitForThePromiseToSettle(e)));}})(yo,mt,Ae,jo,qo),Zo=((e,t)=>n=>{const o=e.get(n);return t(o)||t(n)})(u,Bt),Go=(zo=i,Uo=jt,e=>zo.has(e)||Uo(e));var zo,Uo;const Ho=(Qo=c,$o=qt,e=>Qo.has(e)||$o(e));var Qo,$o;const Jo=((e,t)=>n=>{const o=e.get(n);return t(o)||t(n)})(u,Dt),Ko=()=>(async(e,t,n,o,r,a,i,s,c,u,l,d,h,f,p,v)=>{if(e(t,t)&&e(n,n)&&e(r,r)&&e(a,a)&&e(s,s)&&e(c,c)&&e(u,u)&&e(l,l)&&e(d,d)&&e(h,h)&&e(f,f))return (await Promise.all([e(o,o),e(i,i),e(p,p),e(v,v)])).every((e=>e));return !1})(mt,(e=>()=>{if(null===e)return !1;const t=new e(1,1,44100).createBuffer(1,1,44100);if(void 0===t.copyToChannel)return !0;const n=new Float32Array(2);try{t.copyFromChannel(n,0,0);}catch{return !1}return !0})(kt),(e=>()=>{if(null===e)return !1;if(void 0!==e.prototype&&void 0!==e.prototype.close)return !0;const t=new e,n=void 0!==t.close;try{t.close();}catch{}return n})(Wt),(e=>()=>{if(null===e)return Promise.resolve(!1);const t=new e(1,1,44100);return new Promise((e=>{let n=!0;const o=o=>{n&&(n=!1,t.startRendering(),e(o instanceof TypeError));};let r;try{r=t.decodeAudioData(null,(()=>{}),o);}catch(e){o(e);}void 0!==r&&r.catch(o);}))})(kt),(e=>()=>{if(null===e)return !1;let t;try{t=new e({latencyHint:"balanced"});}catch{return !1}return t.close(),!0})(Wt),(e=>()=>{if(null===e)return !1;const t=new e(1,1,44100).createGain(),n=t.connect(t)===t;return t.disconnect(t),n})(kt),((e,t)=>async()=>{if(null===e)return !0;if(null===t)return !1;const n=new Blob(['class A extends AudioWorkletProcessor{process(){this.port.postMessage(0)}}registerProcessor("a",A)'],{type:"application/javascript; charset=utf-8"}),o=new t(1,128,8e3),r=URL.createObjectURL(n);let a=!1;try{await o.audioWorklet.addModule(r);const t=new e(o,"a",{numberOfOutputs:0}),n=o.createOscillator();t.port.onmessage=()=>a=!0,n.connect(t),n.start(0),await o.startRendering(),a||await new Promise((e=>setTimeout(e,5)));}catch{}finally{URL.revokeObjectURL(r);}return a})(vo,kt),(e=>()=>{if(null===e)return !1;const t=new e(1,1,44100).createChannelMerger();if("max"===t.channelCountMode)return !0;try{t.channelCount=2;}catch{return !0}return !1})(kt),(e=>()=>{if(null===e)return !1;const t=new e(1,1,44100);return void 0===t.createConstantSource||t.createConstantSource().offset.maxValue!==Number.POSITIVE_INFINITY})(kt),(e=>()=>{if(null===e)return !1;const t=new e(1,1,44100),n=t.createConvolver();n.buffer=t.createBuffer(1,1,t.sampleRate);try{n.buffer=t.createBuffer(1,1,t.sampleRate);}catch{return !1}return !0})(kt),(e=>()=>{if(null===e)return !1;const t=new e(1,1,44100).createConvolver();try{t.channelCount=1;}catch{return !1}return !0})(kt),it,(e=>()=>null!==e&&e.hasOwnProperty("isSecureContext"))(yt),(e=>()=>{if(null===e)return !1;const t=new e;try{return t.createMediaStreamSource(new MediaStream),!1}catch(e){return !0}})(Wt),(e=>()=>{if(null===e)return Promise.resolve(!1);const t=new e(1,1,44100);if(void 0===t.createStereoPanner)return Promise.resolve(!0);if(void 0===t.createConstantSource)return Promise.resolve(!0);const n=t.createConstantSource(),o=t.createStereoPanner();return n.channelCount=1,n.offset.value=1,o.channelCount=1,n.start(),n.connect(o).connect(t.destination),t.startRendering().then((e=>1!==e.getChannelData(0)[0]))})(kt),st);}])}));
    });

    var Crunker = /*@__PURE__*/getDefaultExportFromCjs(crunker);

    class AudioMerger {
        constructor() {
            this.cache = new Map();
            this._crunker = new Crunker();
        }
        async loadOne(url) {
            if (this.cache.has(url)) {
                return this.cache.get(url);
            }
            const buffers = await this.crunker.fetchAudio(url);
            const [buffer] = buffers;
            this.cache.set(url, buffer);
            return buffer;
        }
        async load(...urls) {
            return await Promise.all(urls.map(url => this.loadOne(url)));
        }
        async concat(...urls) {
            const buffers = await this.load(...urls);
            return this.crunker.concatAudio(buffers);
        }
        async export(audio) {
            const output = await this.crunker.export(audio, 'audio/mp3');
            return output;
        }
        get crunker() {
            return this._crunker;
        }
    }
    var merger = new AudioMerger();

    var eva = createCommonjsModule(function (module, exports) {
    (function webpackUniversalModuleDefinition(root, factory) {
    	module.exports = factory();
    })(typeof self !== "undefined" ? self : commonjsGlobal, function() {
    return /******/ (function(modules) { // webpackBootstrap
    /******/ 	// The module cache
    /******/ 	var installedModules = {};
    /******/
    /******/ 	// The require function
    /******/ 	function __webpack_require__(moduleId) {
    /******/
    /******/ 		// Check if module is in cache
    /******/ 		if(installedModules[moduleId]) {
    /******/ 			return installedModules[moduleId].exports;
    /******/ 		}
    /******/ 		// Create a new module (and put it into the cache)
    /******/ 		var module = installedModules[moduleId] = {
    /******/ 			i: moduleId,
    /******/ 			l: false,
    /******/ 			exports: {}
    /******/ 		};
    /******/
    /******/ 		// Execute the module function
    /******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
    /******/
    /******/ 		// Flag the module as loaded
    /******/ 		module.l = true;
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
    /******/ 	// define getter function for harmony exports
    /******/ 	__webpack_require__.d = function(exports, name, getter) {
    /******/ 		if(!__webpack_require__.o(exports, name)) {
    /******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
    /******/ 		}
    /******/ 	};
    /******/
    /******/ 	// define __esModule on exports
    /******/ 	__webpack_require__.r = function(exports) {
    /******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
    /******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    /******/ 		}
    /******/ 		Object.defineProperty(exports, '__esModule', { value: true });
    /******/ 	};
    /******/
    /******/ 	// create a fake namespace object
    /******/ 	// mode & 1: value is a module id, require it
    /******/ 	// mode & 2: merge all properties of value into the ns
    /******/ 	// mode & 4: return value when already ns object
    /******/ 	// mode & 8|1: behave like require
    /******/ 	__webpack_require__.t = function(value, mode) {
    /******/ 		if(mode & 1) value = __webpack_require__(value);
    /******/ 		if(mode & 8) return value;
    /******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
    /******/ 		var ns = Object.create(null);
    /******/ 		__webpack_require__.r(ns);
    /******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
    /******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
    /******/ 		return ns;
    /******/ 	};
    /******/
    /******/ 	// getDefaultExport function for compatibility with non-harmony modules
    /******/ 	__webpack_require__.n = function(module) {
    /******/ 		var getter = module && module.__esModule ?
    /******/ 			function getDefault() { return module['default']; } :
    /******/ 			function getModuleExports() { return module; };
    /******/ 		__webpack_require__.d(getter, 'a', getter);
    /******/ 		return getter;
    /******/ 	};
    /******/
    /******/ 	// Object.prototype.hasOwnProperty.call
    /******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
    /******/
    /******/ 	// __webpack_public_path__
    /******/ 	__webpack_require__.p = "";
    /******/
    /******/
    /******/ 	// Load entry module and return exports
    /******/ 	return __webpack_require__(__webpack_require__.s = "./package/src/index.js");
    /******/ })
    /************************************************************************/
    /******/ ({

    /***/ "./node_modules/classnames/dedupe.js":
    /*!*******************************************!*\
      !*** ./node_modules/classnames/dedupe.js ***!
      \*******************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!
      Copyright (c) 2017 Jed Watson.
      Licensed under the MIT License (MIT), see
      http://jedwatson.github.io/classnames
    */
    /* global define */

    (function () {

    	var classNames = (function () {
    		// don't inherit from Object so we can skip hasOwnProperty check later
    		// http://stackoverflow.com/questions/15518328/creating-js-object-with-object-createnull#answer-21079232
    		function StorageObject() {}
    		StorageObject.prototype = Object.create(null);

    		function _parseArray (resultSet, array) {
    			var length = array.length;

    			for (var i = 0; i < length; ++i) {
    				_parse(resultSet, array[i]);
    			}
    		}

    		var hasOwn = {}.hasOwnProperty;

    		function _parseNumber (resultSet, num) {
    			resultSet[num] = true;
    		}

    		function _parseObject (resultSet, object) {
    			for (var k in object) {
    				if (hasOwn.call(object, k)) {
    					// set value to false instead of deleting it to avoid changing object structure
    					// https://www.smashingmagazine.com/2012/11/writing-fast-memory-efficient-javascript/#de-referencing-misconceptions
    					resultSet[k] = !!object[k];
    				}
    			}
    		}

    		var SPACE = /\s+/;
    		function _parseString (resultSet, str) {
    			var array = str.split(SPACE);
    			var length = array.length;

    			for (var i = 0; i < length; ++i) {
    				resultSet[array[i]] = true;
    			}
    		}

    		function _parse (resultSet, arg) {
    			if (!arg) return;
    			var argType = typeof arg;

    			// 'foo bar'
    			if (argType === 'string') {
    				_parseString(resultSet, arg);

    			// ['foo', 'bar', ...]
    			} else if (Array.isArray(arg)) {
    				_parseArray(resultSet, arg);

    			// { 'foo': true, ... }
    			} else if (argType === 'object') {
    				_parseObject(resultSet, arg);

    			// '130'
    			} else if (argType === 'number') {
    				_parseNumber(resultSet, arg);
    			}
    		}

    		function _classNames () {
    			// don't leak arguments
    			// https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#32-leaking-arguments
    			var len = arguments.length;
    			var args = Array(len);
    			for (var i = 0; i < len; i++) {
    				args[i] = arguments[i];
    			}

    			var classSet = new StorageObject();
    			_parseArray(classSet, args);

    			var list = [];

    			for (var k in classSet) {
    				if (classSet[k]) {
    					list.push(k);
    				}
    			}

    			return list.join(' ');
    		}

    		return _classNames;
    	})();

    	if (typeof module !== 'undefined' && module.exports) {
    		classNames.default = classNames;
    		module.exports = classNames;
    	} else {
    		// register as 'classnames', consistent with npm package name
    		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (function () {
    			return classNames;
    		}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
    				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
    	}
    }());


    /***/ }),

    /***/ "./node_modules/css-loader/index.js!./node_modules/sass-loader/lib/loader.js!./package/src/animation.scss":
    /*!*******************************************************************************************************!*\
      !*** ./node_modules/css-loader!./node_modules/sass-loader/lib/loader.js!./package/src/animation.scss ***!
      \*******************************************************************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    exports = module.exports = __webpack_require__(/*! ../../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")(false);
    // imports


    // module
    exports.push([module.i, "/**\n * @license\n * Copyright Akveo. All Rights Reserved.\n * Licensed under the MIT License. See License.txt in the project root for license information.\n */\n.eva-animation {\n  animation-duration: 1s;\n  animation-fill-mode: both; }\n\n.eva-infinite {\n  animation-iteration-count: infinite; }\n\n.eva-icon-shake {\n  animation-name: eva-shake; }\n\n.eva-icon-zoom {\n  animation-name: eva-zoomIn; }\n\n.eva-icon-pulse {\n  animation-name: eva-pulse; }\n\n.eva-icon-flip {\n  animation-name: eva-flipInY; }\n\n.eva-hover {\n  display: inline-block; }\n\n.eva-hover:hover .eva-icon-hover-shake, .eva-parent-hover:hover .eva-icon-hover-shake {\n  animation-name: eva-shake; }\n\n.eva-hover:hover .eva-icon-hover-zoom, .eva-parent-hover:hover .eva-icon-hover-zoom {\n  animation-name: eva-zoomIn; }\n\n.eva-hover:hover .eva-icon-hover-pulse, .eva-parent-hover:hover .eva-icon-hover-pulse {\n  animation-name: eva-pulse; }\n\n.eva-hover:hover .eva-icon-hover-flip, .eva-parent-hover:hover .eva-icon-hover-flip {\n  animation-name: eva-flipInY; }\n\n@keyframes eva-flipInY {\n  from {\n    transform: perspective(400px) rotate3d(0, 1, 0, 90deg);\n    animation-timing-function: ease-in;\n    opacity: 0; }\n  40% {\n    transform: perspective(400px) rotate3d(0, 1, 0, -20deg);\n    animation-timing-function: ease-in; }\n  60% {\n    transform: perspective(400px) rotate3d(0, 1, 0, 10deg);\n    opacity: 1; }\n  80% {\n    transform: perspective(400px) rotate3d(0, 1, 0, -5deg); }\n  to {\n    transform: perspective(400px); } }\n\n@keyframes eva-shake {\n  from,\n  to {\n    transform: translate3d(0, 0, 0); }\n  10%,\n  30%,\n  50%,\n  70%,\n  90% {\n    transform: translate3d(-3px, 0, 0); }\n  20%,\n  40%,\n  60%,\n  80% {\n    transform: translate3d(3px, 0, 0); } }\n\n@keyframes eva-pulse {\n  from {\n    transform: scale3d(1, 1, 1); }\n  50% {\n    transform: scale3d(1.2, 1.2, 1.2); }\n  to {\n    transform: scale3d(1, 1, 1); } }\n\n@keyframes eva-zoomIn {\n  from {\n    opacity: 1;\n    transform: scale3d(0.5, 0.5, 0.5); }\n  50% {\n    opacity: 1; } }\n", ""]);

    // exports


    /***/ }),

    /***/ "./node_modules/css-loader/lib/css-base.js":
    /*!*************************************************!*\
      !*** ./node_modules/css-loader/lib/css-base.js ***!
      \*************************************************/
    /*! no static exports found */
    /***/ (function(module, exports) {

    /*
    	MIT License http://www.opensource.org/licenses/mit-license.php
    	Author Tobias Koppers @sokra
    */
    // css base code, injected by the css-loader
    module.exports = function(useSourceMap) {
    	var list = [];

    	// return the list of modules as css string
    	list.toString = function toString() {
    		return this.map(function (item) {
    			var content = cssWithMappingToString(item, useSourceMap);
    			if(item[2]) {
    				return "@media " + item[2] + "{" + content + "}";
    			} else {
    				return content;
    			}
    		}).join("");
    	};

    	// import a list of modules into the list
    	list.i = function(modules, mediaQuery) {
    		if(typeof modules === "string")
    			modules = [[null, modules, ""]];
    		var alreadyImportedModules = {};
    		for(var i = 0; i < this.length; i++) {
    			var id = this[i][0];
    			if(typeof id === "number")
    				alreadyImportedModules[id] = true;
    		}
    		for(i = 0; i < modules.length; i++) {
    			var item = modules[i];
    			// skip already imported module
    			// this implementation is not 100% perfect for weird media query combinations
    			//  when a module is imported multiple times with different media queries.
    			//  I hope this will never occur (Hey this way we have smaller bundles)
    			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
    				if(mediaQuery && !item[2]) {
    					item[2] = mediaQuery;
    				} else if(mediaQuery) {
    					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
    				}
    				list.push(item);
    			}
    		}
    	};
    	return list;
    };

    function cssWithMappingToString(item, useSourceMap) {
    	var content = item[1] || '';
    	var cssMapping = item[3];
    	if (!cssMapping) {
    		return content;
    	}

    	if (useSourceMap && typeof btoa === 'function') {
    		var sourceMapping = toComment(cssMapping);
    		var sourceURLs = cssMapping.sources.map(function (source) {
    			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */'
    		});

    		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
    	}

    	return [content].join('\n');
    }

    // Adapted from convert-source-map (MIT)
    function toComment(sourceMap) {
    	// eslint-disable-next-line no-undef
    	var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
    	var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

    	return '/*# ' + data + ' */';
    }


    /***/ }),

    /***/ "./node_modules/isomorphic-style-loader/insertCss.js":
    /*!***********************************************************!*\
      !*** ./node_modules/isomorphic-style-loader/insertCss.js ***!
      \***********************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {
    /*! Isomorphic Style Loader | MIT License | https://github.com/kriasoft/isomorphic-style-loader */



    var inserted = {};

    function b64EncodeUnicode(str) {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
        return String.fromCharCode("0x" + p1);
      }));
    }

    function removeCss(ids) {
      ids.forEach(function (id) {
        if (--inserted[id] <= 0) {
          var elem = document.getElementById(id);

          if (elem) {
            elem.parentNode.removeChild(elem);
          }
        }
      });
    }

    function insertCss(styles, _temp) {
      var _ref = _temp === void 0 ? {} : _temp,
          _ref$replace = _ref.replace,
          replace = _ref$replace === void 0 ? false : _ref$replace,
          _ref$prepend = _ref.prepend,
          prepend = _ref$prepend === void 0 ? false : _ref$prepend,
          _ref$prefix = _ref.prefix,
          prefix = _ref$prefix === void 0 ? 's' : _ref$prefix;

      var ids = [];

      for (var i = 0; i < styles.length; i++) {
        var _styles$i = styles[i],
            moduleId = _styles$i[0],
            css = _styles$i[1],
            media = _styles$i[2],
            sourceMap = _styles$i[3];
        var id = "" + prefix + moduleId + "-" + i;
        ids.push(id);

        if (inserted[id]) {
          if (!replace) {
            inserted[id]++;
            continue;
          }
        }

        inserted[id] = 1;
        var elem = document.getElementById(id);
        var create = false;

        if (!elem) {
          create = true;
          elem = document.createElement('style');
          elem.setAttribute('type', 'text/css');
          elem.id = id;

          if (media) {
            elem.setAttribute('media', media);
          }
        }

        var cssText = css;

        if (sourceMap && typeof btoa === 'function') {
          cssText += "\n/*# sourceMappingURL=data:application/json;base64," + b64EncodeUnicode(JSON.stringify(sourceMap)) + "*/";
          cssText += "\n/*# sourceURL=" + sourceMap.file + "?" + id + "*/";
        }

        if ('textContent' in elem) {
          elem.textContent = cssText;
        } else {
          elem.styleSheet.cssText = cssText;
        }

        if (create) {
          if (prepend) {
            document.head.insertBefore(elem, document.head.childNodes[0]);
          } else {
            document.head.appendChild(elem);
          }
        }
      }

      return removeCss.bind(null, ids);
    }

    module.exports = insertCss;



    /***/ }),

    /***/ "./package-build/eva-icons.json":
    /*!**************************************!*\
      !*** ./package-build/eva-icons.json ***!
      \**************************************/
    /*! exports provided: activity, alert-circle, alert-triangle, archive, arrow-back, arrow-circle-down, arrow-circle-left, arrow-circle-right, arrow-circle-up, arrow-down, arrow-downward, arrow-forward, arrow-ios-back, arrow-ios-downward, arrow-ios-forward, arrow-ios-upward, arrow-left, arrow-right, arrow-up, arrow-upward, arrowhead-down, arrowhead-left, arrowhead-right, arrowhead-up, at, attach-2, attach, award, backspace, bar-chart-2, bar-chart, battery, behance, bell-off, bell, bluetooth, book-open, book, bookmark, briefcase, browser, brush, bulb, calendar, camera, car, cast, charging, checkmark-circle-2, checkmark-circle, checkmark-square-2, checkmark-square, checkmark, chevron-down, chevron-left, chevron-right, chevron-up, clipboard, clock, close-circle, close-square, close, cloud-download, cloud-upload, code-download, code, collapse, color-palette, color-picker, compass, copy, corner-down-left, corner-down-right, corner-left-down, corner-left-up, corner-right-down, corner-right-up, corner-up-left, corner-up-right, credit-card, crop, cube, diagonal-arrow-left-down, diagonal-arrow-left-up, diagonal-arrow-right-down, diagonal-arrow-right-up, done-all, download, droplet-off, droplet, edit-2, edit, email, expand, external-link, eye-off-2, eye-off, eye, facebook, file-add, file-remove, file-text, file, film, flag, flash-off, flash, flip-2, flip, folder-add, folder-remove, folder, funnel, gift, github, globe-2, globe-3, globe, google, grid, hard-drive, hash, headphones, heart, home, image-2, image, inbox, info, keypad, layers, layout, link-2, link, linkedin, list, lock, log-in, log-out, map, maximize, menu-2, menu-arrow, menu, message-circle, message-square, mic-off, mic, minimize, minus-circle, minus-square, minus, monitor, moon, more-horizontal, more-vertical, move, music, navigation-2, navigation, npm, options-2, options, pantone, paper-plane, pause-circle, people, percent, person-add, person-delete, person-done, person-remove, person, phone-call, phone-missed, phone-off, phone, pie-chart-2, pie-chart, pin, play-circle, plus-circle, plus-square, plus, power, pricetags, printer, question-mark-circle, question-mark, radio-button-off, radio-button-on, radio, recording, refresh, repeat, rewind-left, rewind-right, save, scissors, search, settings-2, settings, shake, share, shield-off, shield, shopping-bag, shopping-cart, shuffle-2, shuffle, skip-back, skip-forward, slash, smartphone, smiling-face, speaker, square, star, stop-circle, sun, swap, sync, text, thermometer-minus, thermometer-plus, thermometer, toggle-left, toggle-right, trash-2, trash, trending-down, trending-up, tv, twitter, umbrella, undo, unlock, upload, video-off, video, volume-down, volume-mute, volume-off, volume-up, wifi-off, wifi, activity-outline, alert-circle-outline, alert-triangle-outline, archive-outline, arrow-back-outline, arrow-circle-down-outline, arrow-circle-left-outline, arrow-circle-right-outline, arrow-circle-up-outline, arrow-down-outline, arrow-downward-outline, arrow-forward-outline, arrow-ios-back-outline, arrow-ios-downward-outline, arrow-ios-forward-outline, arrow-ios-upward-outline, arrow-left-outline, arrow-right-outline, arrow-up-outline, arrow-upward-outline, arrowhead-down-outline, arrowhead-left-outline, arrowhead-right-outline, arrowhead-up-outline, at-outline, attach-2-outline, attach-outline, award-outline, backspace-outline, bar-chart-2-outline, bar-chart-outline, battery-outline, behance-outline, bell-off-outline, bell-outline, bluetooth-outline, book-open-outline, book-outline, bookmark-outline, briefcase-outline, browser-outline, brush-outline, bulb-outline, calendar-outline, camera-outline, car-outline, cast-outline, charging-outline, checkmark-circle-2-outline, checkmark-circle-outline, checkmark-outline, checkmark-square-2-outline, checkmark-square-outline, chevron-down-outline, chevron-left-outline, chevron-right-outline, chevron-up-outline, clipboard-outline, clock-outline, close-circle-outline, close-outline, close-square-outline, cloud-download-outline, cloud-upload-outline, code-download-outline, code-outline, collapse-outline, color-palette-outline, color-picker-outline, compass-outline, copy-outline, corner-down-left-outline, corner-down-right-outline, corner-left-down-outline, corner-left-up-outline, corner-right-down-outline, corner-right-up-outline, corner-up-left-outline, corner-up-right-outline, credit-card-outline, crop-outline, cube-outline, diagonal-arrow-left-down-outline, diagonal-arrow-left-up-outline, diagonal-arrow-right-down-outline, diagonal-arrow-right-up-outline, done-all-outline, download-outline, droplet-off-outline, droplet-outline, edit-2-outline, edit-outline, email-outline, expand-outline, external-link-outline, eye-off-2-outline, eye-off-outline, eye-outline, facebook-outline, file-add-outline, file-outline, file-remove-outline, file-text-outline, film-outline, flag-outline, flash-off-outline, flash-outline, flip-2-outline, flip-outline, folder-add-outline, folder-outline, folder-remove-outline, funnel-outline, gift-outline, github-outline, globe-2-outline, globe-outline, google-outline, grid-outline, hard-drive-outline, hash-outline, headphones-outline, heart-outline, home-outline, image-outline, inbox-outline, info-outline, keypad-outline, layers-outline, layout-outline, link-2-outline, link-outline, linkedin-outline, list-outline, loader-outline, lock-outline, log-in-outline, log-out-outline, map-outline, maximize-outline, menu-2-outline, menu-arrow-outline, menu-outline, message-circle-outline, message-square-outline, mic-off-outline, mic-outline, minimize-outline, minus-circle-outline, minus-outline, minus-square-outline, monitor-outline, moon-outline, more-horizontal-outline, more-vertical-outline, move-outline, music-outline, navigation-2-outline, navigation-outline, npm-outline, options-2-outline, options-outline, pantone-outline, paper-plane-outline, pause-circle-outline, people-outline, percent-outline, person-add-outline, person-delete-outline, person-done-outline, person-outline, person-remove-outline, phone-call-outline, phone-missed-outline, phone-off-outline, phone-outline, pie-chart-outline, pin-outline, play-circle-outline, plus-circle-outline, plus-outline, plus-square-outline, power-outline, pricetags-outline, printer-outline, question-mark-circle-outline, question-mark-outline, radio-button-off-outline, radio-button-on-outline, radio-outline, recording-outline, refresh-outline, repeat-outline, rewind-left-outline, rewind-right-outline, save-outline, scissors-outline, search-outline, settings-2-outline, settings-outline, shake-outline, share-outline, shield-off-outline, shield-outline, shopping-bag-outline, shopping-cart-outline, shuffle-2-outline, shuffle-outline, skip-back-outline, skip-forward-outline, slash-outline, smartphone-outline, smiling-face-outline, speaker-outline, square-outline, star-outline, stop-circle-outline, sun-outline, swap-outline, sync-outline, text-outline, thermometer-minus-outline, thermometer-outline, thermometer-plus-outline, toggle-left-outline, toggle-right-outline, trash-2-outline, trash-outline, trending-down-outline, trending-up-outline, tv-outline, twitter-outline, umbrella-outline, undo-outline, unlock-outline, upload-outline, video-off-outline, video-outline, volume-down-outline, volume-mute-outline, volume-off-outline, volume-up-outline, wifi-off-outline, wifi-outline, default */
    /***/ (function(module) {

    module.exports = {"activity":"<g data-name=\"Layer 2\"><g data-name=\"activity\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M14.33 20h-.21a2 2 0 0 1-1.76-1.58L9.68 6l-2.76 6.4A1 1 0 0 1 6 13H3a1 1 0 0 1 0-2h2.34l2.51-5.79a2 2 0 0 1 3.79.38L14.32 18l2.76-6.38A1 1 0 0 1 18 11h3a1 1 0 0 1 0 2h-2.34l-2.51 5.79A2 2 0 0 1 14.33 20z\"/></g></g>","alert-circle":"<g data-name=\"Layer 2\"><g data-name=\"alert-circle\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 15a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm1-4a1 1 0 0 1-2 0V8a1 1 0 0 1 2 0z\"/></g></g>","alert-triangle":"<g data-name=\"Layer 2\"><g data-name=\"alert-triangle\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M22.56 16.3L14.89 3.58a3.43 3.43 0 0 0-5.78 0L1.44 16.3a3 3 0 0 0-.05 3A3.37 3.37 0 0 0 4.33 21h15.34a3.37 3.37 0 0 0 2.94-1.66 3 3 0 0 0-.05-3.04zM12 17a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm1-4a1 1 0 0 1-2 0V9a1 1 0 0 1 2 0z\"/></g></g>","archive":"<g data-name=\"Layer 2\"><g data-name=\"archive\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M18 3H6a3 3 0 0 0-2 5.22V18a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8.22A3 3 0 0 0 18 3zm-3 10.13a.87.87 0 0 1-.87.87H9.87a.87.87 0 0 1-.87-.87v-.26a.87.87 0 0 1 .87-.87h4.26a.87.87 0 0 1 .87.87zM18 7H6a1 1 0 0 1 0-2h12a1 1 0 0 1 0 2z\"/></g></g>","arrow-back":"<g data-name=\"Layer 2\"><g data-name=\"arrow-back\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M19 11H7.14l3.63-4.36a1 1 0 1 0-1.54-1.28l-5 6a1.19 1.19 0 0 0-.09.15c0 .05 0 .08-.07.13A1 1 0 0 0 4 12a1 1 0 0 0 .07.36c0 .05 0 .08.07.13a1.19 1.19 0 0 0 .09.15l5 6A1 1 0 0 0 10 19a1 1 0 0 0 .64-.23 1 1 0 0 0 .13-1.41L7.14 13H19a1 1 0 0 0 0-2z\"/></g></g>","arrow-circle-down":"<g data-name=\"Layer 2\"><g data-name=\"arrow-circle-down\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm3.69 11.86l-3 2.86a.49.49 0 0 1-.15.1.54.54 0 0 1-.16.1.94.94 0 0 1-.76 0 1 1 0 0 1-.33-.21l-3-3a1 1 0 0 1 1.42-1.42l1.29 1.3V8a1 1 0 0 1 2 0v5.66l1.31-1.25a1 1 0 0 1 1.38 1.45z\"/></g></g>","arrow-circle-left":"<g data-name=\"Layer 2\"><g data-name=\"arrow-circle-left\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M22 12a10 10 0 1 0-10 10 10 10 0 0 0 10-10zm-11.86 3.69l-2.86-3a.49.49 0 0 1-.1-.15.54.54 0 0 1-.1-.16.94.94 0 0 1 0-.76 1 1 0 0 1 .21-.33l3-3a1 1 0 0 1 1.42 1.42L10.41 11H16a1 1 0 0 1 0 2h-5.66l1.25 1.31a1 1 0 0 1-1.45 1.38z\"/></g></g>","arrow-circle-right":"<g data-name=\"Layer 2\"><g data-name=\"arrow-circle-right\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M2 12A10 10 0 1 0 12 2 10 10 0 0 0 2 12zm11.86-3.69l2.86 3a.49.49 0 0 1 .1.15.54.54 0 0 1 .1.16.94.94 0 0 1 0 .76 1 1 0 0 1-.21.33l-3 3a1 1 0 0 1-1.42-1.42l1.3-1.29H8a1 1 0 0 1 0-2h5.66l-1.25-1.31a1 1 0 0 1 1.45-1.38z\"/></g></g>","arrow-circle-up":"<g data-name=\"Layer 2\"><g data-name=\"arrow-circle-up\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M12 22A10 10 0 1 0 2 12a10 10 0 0 0 10 10zM8.31 10.14l3-2.86a.49.49 0 0 1 .15-.1.54.54 0 0 1 .16-.1.94.94 0 0 1 .76 0 1 1 0 0 1 .33.21l3 3a1 1 0 0 1-1.42 1.42L13 10.41V16a1 1 0 0 1-2 0v-5.66l-1.31 1.25a1 1 0 0 1-1.38-1.45z\"/></g></g>","arrow-down":"<g data-name=\"Layer 2\"><g data-name=\"arrow-downward\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M12 17a1.72 1.72 0 0 1-1.33-.64l-4.21-5.1a2.1 2.1 0 0 1-.26-2.21A1.76 1.76 0 0 1 7.79 8h8.42a1.76 1.76 0 0 1 1.59 1.05 2.1 2.1 0 0 1-.26 2.21l-4.21 5.1A1.72 1.72 0 0 1 12 17z\"/></g></g>","arrow-downward":"<g data-name=\"Layer 2\"><g data-name=\"arrow-down\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18.77 13.36a1 1 0 0 0-1.41-.13L13 16.86V5a1 1 0 0 0-2 0v11.86l-4.36-3.63a1 1 0 1 0-1.28 1.54l6 5 .15.09.13.07a1 1 0 0 0 .72 0l.13-.07.15-.09 6-5a1 1 0 0 0 .13-1.41z\"/></g></g>","arrow-forward":"<g data-name=\"Layer 2\"><g data-name=\"arrow-forward\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M5 13h11.86l-3.63 4.36a1 1 0 0 0 1.54 1.28l5-6a1.19 1.19 0 0 0 .09-.15c0-.05.05-.08.07-.13A1 1 0 0 0 20 12a1 1 0 0 0-.07-.36c0-.05-.05-.08-.07-.13a1.19 1.19 0 0 0-.09-.15l-5-6A1 1 0 0 0 14 5a1 1 0 0 0-.64.23 1 1 0 0 0-.13 1.41L16.86 11H5a1 1 0 0 0 0 2z\"/></g></g>","arrow-ios-back":"<g data-name=\"Layer 2\"><g data-name=\"arrow-ios-back\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M13.83 19a1 1 0 0 1-.78-.37l-4.83-6a1 1 0 0 1 0-1.27l5-6a1 1 0 0 1 1.54 1.28L10.29 12l4.32 5.36a1 1 0 0 1-.78 1.64z\"/></g></g>","arrow-ios-downward":"<g data-name=\"Layer 2\"><g data-name=\"arrow-ios-downward\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 16a1 1 0 0 1-.64-.23l-6-5a1 1 0 1 1 1.28-1.54L12 13.71l5.36-4.32a1 1 0 0 1 1.41.15 1 1 0 0 1-.14 1.46l-6 4.83A1 1 0 0 1 12 16z\"/></g></g>","arrow-ios-forward":"<g data-name=\"Layer 2\"><g data-name=\"arrow-ios-forward\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M10 19a1 1 0 0 1-.64-.23 1 1 0 0 1-.13-1.41L13.71 12 9.39 6.63a1 1 0 0 1 .15-1.41 1 1 0 0 1 1.46.15l4.83 6a1 1 0 0 1 0 1.27l-5 6A1 1 0 0 1 10 19z\"/></g></g>","arrow-ios-upward":"<g data-name=\"Layer 2\"><g data-name=\"arrow-ios-upward\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M18 15a1 1 0 0 1-.64-.23L12 10.29l-5.37 4.32a1 1 0 0 1-1.41-.15 1 1 0 0 1 .15-1.41l6-4.83a1 1 0 0 1 1.27 0l6 5a1 1 0 0 1 .13 1.41A1 1 0 0 1 18 15z\"/></g></g>","arrow-left":"<g data-name=\"Layer 2\"><g data-name=\"arrow-left\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M13.54 18a2.06 2.06 0 0 1-1.3-.46l-5.1-4.21a1.7 1.7 0 0 1 0-2.66l5.1-4.21a2.1 2.1 0 0 1 2.21-.26 1.76 1.76 0 0 1 1.05 1.59v8.42a1.76 1.76 0 0 1-1.05 1.59 2.23 2.23 0 0 1-.91.2z\"/></g></g>","arrow-right":"<g data-name=\"Layer 2\"><g data-name=\"arrow-right\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M10.46 18a2.23 2.23 0 0 1-.91-.2 1.76 1.76 0 0 1-1.05-1.59V7.79A1.76 1.76 0 0 1 9.55 6.2a2.1 2.1 0 0 1 2.21.26l5.1 4.21a1.7 1.7 0 0 1 0 2.66l-5.1 4.21a2.06 2.06 0 0 1-1.3.46z\"/></g></g>","arrow-up":"<g data-name=\"Layer 2\"><g data-name=\"arrow-up\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1 2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1z\"/></g></g>","arrow-upward":"<g data-name=\"Layer 2\"><g data-name=\"arrow-upward\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M5.23 10.64a1 1 0 0 0 1.41.13L11 7.14V19a1 1 0 0 0 2 0V7.14l4.36 3.63a1 1 0 1 0 1.28-1.54l-6-5-.15-.09-.13-.07a1 1 0 0 0-.72 0l-.13.07-.15.09-6 5a1 1 0 0 0-.13 1.41z\"/></g></g>","arrowhead-down":"<g data-name=\"Layer 2\"><g data-name=\"arrowhead-down\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M17.37 12.39L12 16.71l-5.36-4.48a1 1 0 1 0-1.28 1.54l6 5a1 1 0 0 0 1.27 0l6-4.83a1 1 0 0 0 .15-1.41 1 1 0 0 0-1.41-.14z\"/><path d=\"M11.36 11.77a1 1 0 0 0 1.27 0l6-4.83a1 1 0 0 0 .15-1.41 1 1 0 0 0-1.41-.15L12 9.71 6.64 5.23a1 1 0 0 0-1.28 1.54z\"/></g></g>","arrowhead-left":"<g data-name=\"Layer 2\"><g data-name=\"arrowhead-left\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M11.64 5.23a1 1 0 0 0-1.41.13l-5 6a1 1 0 0 0 0 1.27l4.83 6a1 1 0 0 0 .78.37 1 1 0 0 0 .78-1.63L7.29 12l4.48-5.37a1 1 0 0 0-.13-1.4z\"/><path d=\"M14.29 12l4.48-5.37a1 1 0 0 0-1.54-1.28l-5 6a1 1 0 0 0 0 1.27l4.83 6a1 1 0 0 0 .78.37 1 1 0 0 0 .78-1.63z\"/></g></g>","arrowhead-right":"<g data-name=\"Layer 2\"><g data-name=\"arrowhead-right\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M18.78 11.37l-4.78-6a1 1 0 0 0-1.41-.15 1 1 0 0 0-.15 1.41L16.71 12l-4.48 5.37a1 1 0 0 0 .13 1.41A1 1 0 0 0 13 19a1 1 0 0 0 .77-.36l5-6a1 1 0 0 0 .01-1.27z\"/><path d=\"M7 5.37a1 1 0 0 0-1.61 1.26L9.71 12l-4.48 5.36a1 1 0 0 0 .13 1.41A1 1 0 0 0 6 19a1 1 0 0 0 .77-.36l5-6a1 1 0 0 0 0-1.27z\"/></g></g>","arrowhead-up":"<g data-name=\"Layer 2\"><g data-name=\"arrowhead-up\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M6.63 11.61L12 7.29l5.37 4.48A1 1 0 0 0 18 12a1 1 0 0 0 .77-.36 1 1 0 0 0-.13-1.41l-6-5a1 1 0 0 0-1.27 0l-6 4.83a1 1 0 0 0-.15 1.41 1 1 0 0 0 1.41.14z\"/><path d=\"M12.64 12.23a1 1 0 0 0-1.27 0l-6 4.83a1 1 0 0 0-.15 1.41 1 1 0 0 0 1.41.15L12 14.29l5.37 4.48A1 1 0 0 0 18 19a1 1 0 0 0 .77-.36 1 1 0 0 0-.13-1.41z\"/></g></g>","at":"<g data-name=\"Layer 2\"><g data-name=\"at\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M13 2a10 10 0 0 0-5 19.1 10.15 10.15 0 0 0 4 .9 10 10 0 0 0 6.08-2.06 1 1 0 0 0 .19-1.4 1 1 0 0 0-1.41-.19A8 8 0 1 1 12.77 4 8.17 8.17 0 0 1 20 12.22v.68a1.71 1.71 0 0 1-1.78 1.7 1.82 1.82 0 0 1-1.62-1.88V8.4a1 1 0 0 0-1-1 1 1 0 0 0-1 .87 5 5 0 0 0-3.44-1.36A5.09 5.09 0 1 0 15.31 15a3.6 3.6 0 0 0 5.55.61A3.67 3.67 0 0 0 22 12.9v-.68A10.2 10.2 0 0 0 13 2zm-1.82 13.09A3.09 3.09 0 1 1 14.27 12a3.1 3.1 0 0 1-3.09 3.09z\"/></g></g>","attach-2":"<g data-name=\"Layer 2\"><g data-name=\"attach-2\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 22a5.86 5.86 0 0 1-6-5.7V6.13A4.24 4.24 0 0 1 10.33 2a4.24 4.24 0 0 1 4.34 4.13v10.18a2.67 2.67 0 0 1-5.33 0V6.92a1 1 0 0 1 1-1 1 1 0 0 1 1 1v9.39a.67.67 0 0 0 1.33 0V6.13A2.25 2.25 0 0 0 10.33 4 2.25 2.25 0 0 0 8 6.13V16.3a3.86 3.86 0 0 0 4 3.7 3.86 3.86 0 0 0 4-3.7V6.13a1 1 0 1 1 2 0V16.3a5.86 5.86 0 0 1-6 5.7z\"/></g></g>","attach":"<g data-name=\"Layer 2\"><g data-name=\"attach\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M9.29 21a6.23 6.23 0 0 1-4.43-1.88 6 6 0 0 1-.22-8.49L12 3.2A4.11 4.11 0 0 1 15 2a4.48 4.48 0 0 1 3.19 1.35 4.36 4.36 0 0 1 .15 6.13l-7.4 7.43a2.54 2.54 0 0 1-1.81.75 2.72 2.72 0 0 1-1.95-.82 2.68 2.68 0 0 1-.08-3.77l6.83-6.86a1 1 0 0 1 1.37 1.41l-6.83 6.86a.68.68 0 0 0 .08.95.78.78 0 0 0 .53.23.56.56 0 0 0 .4-.16l7.39-7.43a2.36 2.36 0 0 0-.15-3.31 2.38 2.38 0 0 0-3.27-.15L6.06 12a4 4 0 0 0 .22 5.67 4.22 4.22 0 0 0 3 1.29 3.67 3.67 0 0 0 2.61-1.06l7.39-7.43a1 1 0 1 1 1.42 1.41l-7.39 7.43A5.65 5.65 0 0 1 9.29 21z\"/></g></g>","award":"<g data-name=\"Layer 2\"><g data-name=\"award\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19 20.75l-2.31-9A5.94 5.94 0 0 0 18 8 6 6 0 0 0 6 8a5.94 5.94 0 0 0 1.34 3.77L5 20.75a1 1 0 0 0 1.48 1.11l5.33-3.13 5.68 3.14A.91.91 0 0 0 18 22a1 1 0 0 0 1-1.25zM12 4a4 4 0 1 1-4 4 4 4 0 0 1 4-4z\"/></g></g>","backspace":"<g data-name=\"Layer 2\"><g data-name=\"backspace\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.14 4h-9.77a3 3 0 0 0-2 .78l-.1.11-6 7.48a1 1 0 0 0 .11 1.37l6 5.48a3 3 0 0 0 2 .78h9.77A1.84 1.84 0 0 0 22 18.18V5.82A1.84 1.84 0 0 0 20.14 4zm-3.43 9.29a1 1 0 0 1 0 1.42 1 1 0 0 1-1.42 0L14 13.41l-1.29 1.3a1 1 0 0 1-1.42 0 1 1 0 0 1 0-1.42l1.3-1.29-1.3-1.29a1 1 0 0 1 1.42-1.42l1.29 1.3 1.29-1.3a1 1 0 0 1 1.42 1.42L15.41 12z\"/></g></g>","bar-chart-2":"<g data-name=\"Layer 2\"><g data-name=\"bar-chart-2\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M12 8a1 1 0 0 0-1 1v11a1 1 0 0 0 2 0V9a1 1 0 0 0-1-1z\"/><path d=\"M19 4a1 1 0 0 0-1 1v15a1 1 0 0 0 2 0V5a1 1 0 0 0-1-1z\"/><path d=\"M5 12a1 1 0 0 0-1 1v7a1 1 0 0 0 2 0v-7a1 1 0 0 0-1-1z\"/></g></g>","bar-chart":"<g data-name=\"Layer 2\"><g data-name=\"bar-chart\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M12 4a1 1 0 0 0-1 1v15a1 1 0 0 0 2 0V5a1 1 0 0 0-1-1z\"/><path d=\"M19 12a1 1 0 0 0-1 1v7a1 1 0 0 0 2 0v-7a1 1 0 0 0-1-1z\"/><path d=\"M5 8a1 1 0 0 0-1 1v11a1 1 0 0 0 2 0V9a1 1 0 0 0-1-1z\"/></g></g>","battery":"<g data-name=\"Layer 2\"><g data-name=\"battery\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M15.83 6H4.17A2.31 2.31 0 0 0 2 8.43v7.14A2.31 2.31 0 0 0 4.17 18h11.66A2.31 2.31 0 0 0 18 15.57V8.43A2.31 2.31 0 0 0 15.83 6z\"/><path d=\"M21 9a1 1 0 0 0-1 1v4a1 1 0 0 0 2 0v-4a1 1 0 0 0-1-1z\"/></g></g>","behance":"<g data-name=\"Layer 2\"><g data-name=\"behance\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M14.76 11.19a1 1 0 0 0-1 1.09h2.06a1 1 0 0 0-1.06-1.09z\"/><path d=\"M9.49 12.3H8.26v1.94h1c1 0 1.44-.33 1.44-1s-.46-.94-1.21-.94z\"/><path d=\"M10.36 10.52c0-.53-.35-.85-.95-.85H8.26v1.74h.85c.89 0 1.25-.32 1.25-.89z\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zM9.7 15.2H7V8.7h2.7c1.17 0 1.94.61 1.94 1.6a1.4 1.4 0 0 1-1.12 1.43A1.52 1.52 0 0 1 12 13.37c0 1.16-1 1.83-2.3 1.83zm3.55-6h3v.5h-3zM17 13.05h-3.3v.14a1.07 1.07 0 0 0 1.09 1.19.9.9 0 0 0 1-.63H17a2 2 0 0 1-2.17 1.55 2.15 2.15 0 0 1-2.36-2.3v-.44a2.11 2.11 0 0 1 2.28-2.25A2.12 2.12 0 0 1 17 12.58z\"/></g></g>","bell-off":"<g data-name=\"Layer 2\"><g data-name=\"bell-off\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M15.88 18.71l-.59-.59L14 16.78l-.07-.07L6.58 9.4 5.31 8.14a5.68 5.68 0 0 0 0 .59v4.67l-1.8 1.81A1.64 1.64 0 0 0 4.64 18H8v.34A3.84 3.84 0 0 0 12 22a3.88 3.88 0 0 0 4-3.22zM14 18.34A1.88 1.88 0 0 1 12 20a1.88 1.88 0 0 1-2-1.66V18h4z\"/><path d=\"M7.13 4.3l1.46 1.46 9.53 9.53 2 2 .31.3a1.58 1.58 0 0 0 .45-.6 1.62 1.62 0 0 0-.35-1.78l-1.8-1.81V8.94a6.86 6.86 0 0 0-5.83-6.88 6.71 6.71 0 0 0-5.32 1.61 6.88 6.88 0 0 0-.58.54z\"/><path d=\"M20.71 19.29L19.41 18l-2-2-9.52-9.53L6.42 5 4.71 3.29a1 1 0 0 0-1.42 1.42L5.53 7l1.75 1.7 7.31 7.3.07.07L16 17.41l.59.59 2.7 2.71a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z\"/></g></g>","bell":"<g data-name=\"Layer 2\"><g data-name=\"bell\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.52 15.21l-1.8-1.81V8.94a6.86 6.86 0 0 0-5.82-6.88 6.74 6.74 0 0 0-7.62 6.67v4.67l-1.8 1.81A1.64 1.64 0 0 0 4.64 18H8v.34A3.84 3.84 0 0 0 12 22a3.84 3.84 0 0 0 4-3.66V18h3.36a1.64 1.64 0 0 0 1.16-2.79zM14 18.34A1.88 1.88 0 0 1 12 20a1.88 1.88 0 0 1-2-1.66V18h4z\"/></g></g>","bluetooth":"<g data-name=\"Layer 2\"><g data-name=\"bluetooth\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M13.63 12l4-3.79a1.14 1.14 0 0 0-.13-1.77l-4.67-3.23a1.17 1.17 0 0 0-1.21-.08 1.15 1.15 0 0 0-.62 1v6.2l-3.19-4a1 1 0 0 0-1.56 1.3L9.72 12l-3.5 4.43a1 1 0 0 0 .16 1.4A1 1 0 0 0 7 18a1 1 0 0 0 .78-.38L11 13.56v6.29A1.16 1.16 0 0 0 12.16 21a1.16 1.16 0 0 0 .67-.21l4.64-3.18a1.17 1.17 0 0 0 .49-.85 1.15 1.15 0 0 0-.34-.91zM13 5.76l2.5 1.73L13 9.85zm0 12.49v-4.07l2.47 2.38z\"/></g></g>","book-open":"<g data-name=\"Layer 2\"><g data-name=\"book-open\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M21 4.34a1.24 1.24 0 0 0-1.08-.23L13 5.89v14.27l7.56-1.94A1.25 1.25 0 0 0 21.5 17V5.32a1.25 1.25 0 0 0-.5-.98z\"/><path d=\"M11 5.89L4.06 4.11A1.27 1.27 0 0 0 3 4.34a1.25 1.25 0 0 0-.48 1V17a1.25 1.25 0 0 0 .94 1.21L11 20.16z\"/></g></g>","book":"<g data-name=\"Layer 2\"><g data-name=\"book\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19 3H7a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zM7 19a1 1 0 0 1 0-2h11v2z\"/></g></g>","bookmark":"<g data-name=\"Layer 2\"><g data-name=\"bookmark\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M6 21a1 1 0 0 1-.49-.13A1 1 0 0 1 5 20V5.33A2.28 2.28 0 0 1 7.2 3h9.6A2.28 2.28 0 0 1 19 5.33V20a1 1 0 0 1-.5.86 1 1 0 0 1-1 0l-5.67-3.21-5.33 3.2A1 1 0 0 1 6 21z\"/></g></g>","briefcase":"<g data-name=\"Layer 2\"><g data-name=\"briefcase\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M7 21h10V7h-1V5.5A2.5 2.5 0 0 0 13.5 3h-3A2.5 2.5 0 0 0 8 5.5V7H7zm3-15.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V7h-4z\"/><path d=\"M19 7v14a3 3 0 0 0 3-3v-8a3 3 0 0 0-3-3z\"/><path d=\"M5 7a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z\"/></g></g>","browser":"<g data-name=\"Layer 2\"><g data-name=\"browser\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zm-6 3a1 1 0 1 1-1 1 1 1 0 0 1 1-1zM8 6a1 1 0 1 1-1 1 1 1 0 0 1 1-1zm11 12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7h14z\"/></g></g>","brush":"<g data-name=\"Layer 2\"><g data-name=\"brush\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M7.12 12.55a4 4 0 0 0-3.07 3.86v3.11a.47.47 0 0 0 .48.48l3.24-.06a3.78 3.78 0 0 0 3.44-2.2 3.65 3.65 0 0 0-4.09-5.19z\"/><path d=\"M19.26 4.46a2.14 2.14 0 0 0-2.88.21L10 11.08a.47.47 0 0 0 0 .66L12.25 14a.47.47 0 0 0 .66 0l6.49-6.47a2.06 2.06 0 0 0 .6-1.47 2 2 0 0 0-.74-1.6z\"/></g></g>","bulb":"<g data-name=\"Layer 2\"><g data-name=\"bulb\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M12 7a5 5 0 0 0-3 9v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-4a5 5 0 0 0-3-9z\"/><path d=\"M12 6a1 1 0 0 0 1-1V3a1 1 0 0 0-2 0v2a1 1 0 0 0 1 1z\"/><path d=\"M21 11h-2a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2z\"/><path d=\"M5 11H3a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2z\"/><path d=\"M7.66 6.42L6.22 5a1 1 0 0 0-1.39 1.47l1.44 1.39a1 1 0 0 0 .73.28 1 1 0 0 0 .72-.31 1 1 0 0 0-.06-1.41z\"/><path d=\"M19.19 5.05a1 1 0 0 0-1.41 0l-1.44 1.37a1 1 0 0 0 0 1.41 1 1 0 0 0 .72.31 1 1 0 0 0 .69-.28l1.44-1.39a1 1 0 0 0 0-1.42z\"/></g></g>","calendar":"<g data-name=\"Layer 2\"><g data-name=\"calendar\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 4h-1V3a1 1 0 0 0-2 0v1H9V3a1 1 0 0 0-2 0v1H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zM8 17a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm8 0h-4a1 1 0 0 1 0-2h4a1 1 0 0 1 0 2zm3-6H5V7a1 1 0 0 1 1-1h1v1a1 1 0 0 0 2 0V6h6v1a1 1 0 0 0 2 0V6h1a1 1 0 0 1 1 1z\"/></g></g>","camera":"<g data-name=\"Layer 2\"><g data-name=\"camera\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><circle cx=\"12\" cy=\"14\" r=\"1.5\"/><path d=\"M19 7h-3V5.5A2.5 2.5 0 0 0 13.5 3h-3A2.5 2.5 0 0 0 8 5.5V7H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-8a3 3 0 0 0-3-3zm-9-1.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V7h-4zm2 12a3.5 3.5 0 1 1 3.5-3.5 3.5 3.5 0 0 1-3.5 3.5z\"/></g></g>","car":"<g data-name=\"Layer 2\"><g data-name=\"car\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21.6 11.22L17 7.52V5a1.91 1.91 0 0 0-1.81-2H3.79A1.91 1.91 0 0 0 2 5v10a2 2 0 0 0 1.2 1.88 3 3 0 1 0 5.6.12h6.36a3 3 0 1 0 5.64 0h.2a1 1 0 0 0 1-1v-4a1 1 0 0 0-.4-.78zM20 12.48V15h-3v-4.92zM7 18a1 1 0 1 1-1-1 1 1 0 0 1 1 1zm12 0a1 1 0 1 1-1-1 1 1 0 0 1 1 1z\"/></g></g>","cast":"<g data-name=\"Layer 2\"><g data-name=\"cast\"><polyline points=\"24 24 0 24 0 0\" opacity=\"0\"/><path d=\"M18.4 3H5.6A2.7 2.7 0 0 0 3 5.78V7a1 1 0 0 0 2 0V5.78A.72.72 0 0 1 5.6 5h12.8a.72.72 0 0 1 .6.78v12.44a.72.72 0 0 1-.6.78H17a1 1 0 0 0 0 2h1.4a2.7 2.7 0 0 0 2.6-2.78V5.78A2.7 2.7 0 0 0 18.4 3z\"/><path d=\"M3.86 14A1 1 0 0 0 3 15.17a1 1 0 0 0 1.14.83 2.49 2.49 0 0 1 2.12.72 2.52 2.52 0 0 1 .51 2.84 1 1 0 0 0 .48 1.33 1.06 1.06 0 0 0 .42.09 1 1 0 0 0 .91-.58A4.52 4.52 0 0 0 3.86 14z\"/><path d=\"M3.86 10.08a1 1 0 0 0 .28 2 6 6 0 0 1 5.09 1.71 6 6 0 0 1 1.53 5.95 1 1 0 0 0 .68 1.26.9.9 0 0 0 .28 0 1 1 0 0 0 1-.72 8 8 0 0 0-8.82-10.2z\"/><circle cx=\"4\" cy=\"19\" r=\"1\"/></g></g>","charging":"<g data-name=\"Layer 2\"><g data-name=\"charging\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M11.28 13H7a1 1 0 0 1-.86-.5 1 1 0 0 1 0-1L9.28 6H4.17A2.31 2.31 0 0 0 2 8.43v7.14A2.31 2.31 0 0 0 4.17 18h4.25z\"/><path d=\"M15.83 6h-4.25l-2.86 5H13a1 1 0 0 1 .86.5 1 1 0 0 1 0 1L10.72 18h5.11A2.31 2.31 0 0 0 18 15.57V8.43A2.31 2.31 0 0 0 15.83 6z\"/><path d=\"M21 9a1 1 0 0 0-1 1v4a1 1 0 0 0 2 0v-4a1 1 0 0 0-1-1z\"/></g></g>","checkmark-circle-2":"<g data-name=\"Layer 2\"><g data-name=\"checkmark-circle-2\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm4.3 7.61l-4.57 6a1 1 0 0 1-.79.39 1 1 0 0 1-.79-.38l-2.44-3.11a1 1 0 0 1 1.58-1.23l1.63 2.08 3.78-5a1 1 0 1 1 1.6 1.22z\"/></g></g>","checkmark-circle":"<g data-name=\"Layer 2\"><g data-name=\"checkmark-circle\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M9.71 11.29a1 1 0 0 0-1.42 1.42l3 3A1 1 0 0 0 12 16a1 1 0 0 0 .72-.34l7-8a1 1 0 0 0-1.5-1.32L12 13.54z\"/><path d=\"M21 11a1 1 0 0 0-1 1 8 8 0 0 1-8 8A8 8 0 0 1 6.33 6.36 7.93 7.93 0 0 1 12 4a8.79 8.79 0 0 1 1.9.22 1 1 0 1 0 .47-1.94A10.54 10.54 0 0 0 12 2a10 10 0 0 0-7 17.09A9.93 9.93 0 0 0 12 22a10 10 0 0 0 10-10 1 1 0 0 0-1-1z\"/></g></g>","checkmark-square-2":"<g data-name=\"Layer 2\"><g data-name=\"checkmark-square-2\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M18 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zm-1.7 6.61l-4.57 6a1 1 0 0 1-.79.39 1 1 0 0 1-.79-.38l-2.44-3.11a1 1 0 0 1 1.58-1.23l1.63 2.08 3.78-5a1 1 0 1 1 1.6 1.22z\"/></g></g>","checkmark-square":"<g data-name=\"Layer 2\"><g data-name=\"checkmark-square\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20 11.83a1 1 0 0 0-1 1v5.57a.6.6 0 0 1-.6.6H5.6a.6.6 0 0 1-.6-.6V5.6a.6.6 0 0 1 .6-.6h9.57a1 1 0 1 0 0-2H5.6A2.61 2.61 0 0 0 3 5.6v12.8A2.61 2.61 0 0 0 5.6 21h12.8a2.61 2.61 0 0 0 2.6-2.6v-5.57a1 1 0 0 0-1-1z\"/><path d=\"M10.72 11a1 1 0 0 0-1.44 1.38l2.22 2.33a1 1 0 0 0 .72.31 1 1 0 0 0 .72-.3l6.78-7a1 1 0 1 0-1.44-1.4l-6.05 6.26z\"/></g></g>","checkmark":"<g data-name=\"Layer 2\"><g data-name=\"checkmark\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M9.86 18a1 1 0 0 1-.73-.32l-4.86-5.17a1 1 0 1 1 1.46-1.37l4.12 4.39 8.41-9.2a1 1 0 1 1 1.48 1.34l-9.14 10a1 1 0 0 1-.73.33z\"/></g></g>","chevron-down":"<g data-name=\"Layer 2\"><g data-name=\"chevron-down\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 15.5a1 1 0 0 1-.71-.29l-4-4a1 1 0 1 1 1.42-1.42L12 13.1l3.3-3.18a1 1 0 1 1 1.38 1.44l-4 3.86a1 1 0 0 1-.68.28z\"/></g></g>","chevron-left":"<g data-name=\"Layer 2\"><g data-name=\"chevron-left\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M13.36 17a1 1 0 0 1-.72-.31l-3.86-4a1 1 0 0 1 0-1.4l4-4a1 1 0 1 1 1.42 1.42L10.9 12l3.18 3.3a1 1 0 0 1 0 1.41 1 1 0 0 1-.72.29z\"/></g></g>","chevron-right":"<g data-name=\"Layer 2\"><g data-name=\"chevron-right\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M10.5 17a1 1 0 0 1-.71-.29 1 1 0 0 1 0-1.42L13.1 12 9.92 8.69a1 1 0 0 1 0-1.41 1 1 0 0 1 1.42 0l3.86 4a1 1 0 0 1 0 1.4l-4 4a1 1 0 0 1-.7.32z\"/></g></g>","chevron-up":"<g data-name=\"Layer 2\"><g data-name=\"chevron-up\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M16 14.5a1 1 0 0 1-.71-.29L12 10.9l-3.3 3.18a1 1 0 0 1-1.41 0 1 1 0 0 1 0-1.42l4-3.86a1 1 0 0 1 1.4 0l4 4a1 1 0 0 1 0 1.42 1 1 0 0 1-.69.28z\"/></g></g>","clipboard":"<g data-name=\"Layer 2\"><g data-name=\"clipboard\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 4v3a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3z\"/><rect x=\"7\" y=\"2\" width=\"10\" height=\"6\" rx=\"1\" ry=\"1\"/></g></g>","clock":"<g data-name=\"Layer 2\"><g data-name=\"clock\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm4 11h-4a1 1 0 0 1-1-1V8a1 1 0 0 1 2 0v3h3a1 1 0 0 1 0 2z\"/></g></g>","close-circle":"<g data-name=\"Layer 2\"><g data-name=\"close-circle\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm2.71 11.29a1 1 0 0 1 0 1.42 1 1 0 0 1-1.42 0L12 13.41l-1.29 1.3a1 1 0 0 1-1.42 0 1 1 0 0 1 0-1.42l1.3-1.29-1.3-1.29a1 1 0 0 1 1.42-1.42l1.29 1.3 1.29-1.3a1 1 0 0 1 1.42 1.42L13.41 12z\"/></g></g>","close-square":"<g data-name=\"Layer 2\"><g data-name=\"close-square\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zm-3.29 10.29a1 1 0 0 1 0 1.42 1 1 0 0 1-1.42 0L12 13.41l-1.29 1.3a1 1 0 0 1-1.42 0 1 1 0 0 1 0-1.42l1.3-1.29-1.3-1.29a1 1 0 0 1 1.42-1.42l1.29 1.3 1.29-1.3a1 1 0 0 1 1.42 1.42L13.41 12z\"/></g></g>","close":"<g data-name=\"Layer 2\"><g data-name=\"close\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M13.41 12l4.3-4.29a1 1 0 1 0-1.42-1.42L12 10.59l-4.29-4.3a1 1 0 0 0-1.42 1.42l4.3 4.29-4.3 4.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l4.29-4.3 4.29 4.3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z\"/></g></g>","cloud-download":"<g data-name=\"Layer 2\"><g data-name=\"cloud-download\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21.9 11c0-.11-.06-.22-.09-.33a4.17 4.17 0 0 0-.18-.57c-.05-.12-.12-.24-.18-.37s-.15-.3-.24-.44S21 9.08 21 9s-.2-.25-.31-.37-.21-.2-.32-.3L20 8l-.36-.24a3.68 3.68 0 0 0-.44-.23l-.39-.18a4.13 4.13 0 0 0-.5-.15 3 3 0 0 0-.41-.09h-.18A6 6 0 0 0 6.33 7h-.18a3 3 0 0 0-.41.09 4.13 4.13 0 0 0-.5.15l-.39.18a3.68 3.68 0 0 0-.44.23L4.05 8l-.37.31c-.11.1-.22.19-.32.3s-.21.25-.31.37-.18.23-.26.36-.16.29-.24.44-.13.25-.18.37a4.17 4.17 0 0 0-.18.57c0 .11-.07.22-.09.33A5.23 5.23 0 0 0 2 12a5.5 5.5 0 0 0 .09.91c0 .1.05.19.07.29a5.58 5.58 0 0 0 .18.58l.12.29a5 5 0 0 0 .3.56l.14.22a.56.56 0 0 0 .05.08L3 15a5 5 0 0 0 4 2 2 2 0 0 1 .59-1.41A2 2 0 0 1 9 15a1.92 1.92 0 0 1 1 .27V12a2 2 0 0 1 4 0v3.37a2 2 0 0 1 1-.27 2.05 2.05 0 0 1 1.44.61A2 2 0 0 1 17 17a5 5 0 0 0 4-2l.05-.05a.56.56 0 0 0 .05-.08l.14-.22a5 5 0 0 0 .3-.56l.12-.29a5.58 5.58 0 0 0 .18-.58c0-.1.05-.19.07-.29A5.5 5.5 0 0 0 22 12a5.23 5.23 0 0 0-.1-1z\"/><path d=\"M14.31 16.38L13 17.64V12a1 1 0 0 0-2 0v5.59l-1.29-1.3a1 1 0 0 0-1.42 1.42l3 3A1 1 0 0 0 12 21a1 1 0 0 0 .69-.28l3-2.9a1 1 0 1 0-1.38-1.44z\"/><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21.9 11c0-.11-.06-.22-.09-.33a4.17 4.17 0 0 0-.18-.57c-.05-.12-.12-.24-.18-.37s-.15-.3-.24-.44S21 9.08 21 9s-.2-.25-.31-.37-.21-.2-.32-.3L20 8l-.36-.24a3.68 3.68 0 0 0-.44-.23l-.39-.18a4.13 4.13 0 0 0-.5-.15 3 3 0 0 0-.41-.09h-.18A6 6 0 0 0 6.33 7h-.18a3 3 0 0 0-.41.09 4.13 4.13 0 0 0-.5.15l-.39.18a3.68 3.68 0 0 0-.44.23L4.05 8l-.37.31c-.11.1-.22.19-.32.3s-.21.25-.31.37-.18.23-.26.36-.16.29-.24.44-.13.25-.18.37a4.17 4.17 0 0 0-.18.57c0 .11-.07.22-.09.33A5.23 5.23 0 0 0 2 12a5.5 5.5 0 0 0 .09.91c0 .1.05.19.07.29a5.58 5.58 0 0 0 .18.58l.12.29a5 5 0 0 0 .3.56l.14.22a.56.56 0 0 0 .05.08L3 15a5 5 0 0 0 4 2 2 2 0 0 1 .59-1.41A2 2 0 0 1 9 15a1.92 1.92 0 0 1 1 .27V12a2 2 0 0 1 4 0v3.37a2 2 0 0 1 1-.27 2.05 2.05 0 0 1 1.44.61A2 2 0 0 1 17 17a5 5 0 0 0 4-2l.05-.05a.56.56 0 0 0 .05-.08l.14-.22a5 5 0 0 0 .3-.56l.12-.29a5.58 5.58 0 0 0 .18-.58c0-.1.05-.19.07-.29A5.5 5.5 0 0 0 22 12a5.23 5.23 0 0 0-.1-1z\"/><path d=\"M14.31 16.38L13 17.64V12a1 1 0 0 0-2 0v5.59l-1.29-1.3a1 1 0 0 0-1.42 1.42l3 3A1 1 0 0 0 12 21a1 1 0 0 0 .69-.28l3-2.9a1 1 0 1 0-1.38-1.44z\"/></g></g>","cloud-upload":"<g data-name=\"Layer 2\"><g data-name=\"cloud-upload\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21.9 12c0-.11-.06-.22-.09-.33a4.17 4.17 0 0 0-.18-.57c-.05-.12-.12-.24-.18-.37s-.15-.3-.24-.44S21 10.08 21 10s-.2-.25-.31-.37-.21-.2-.32-.3L20 9l-.36-.24a3.68 3.68 0 0 0-.44-.23l-.39-.18a4.13 4.13 0 0 0-.5-.15 3 3 0 0 0-.41-.09L17.67 8A6 6 0 0 0 6.33 8l-.18.05a3 3 0 0 0-.41.09 4.13 4.13 0 0 0-.5.15l-.39.18a3.68 3.68 0 0 0-.44.23l-.36.3-.37.31c-.11.1-.22.19-.32.3s-.21.25-.31.37-.18.23-.26.36-.16.29-.24.44-.13.25-.18.37a4.17 4.17 0 0 0-.18.57c0 .11-.07.22-.09.33A5.23 5.23 0 0 0 2 13a5.5 5.5 0 0 0 .09.91c0 .1.05.19.07.29a5.58 5.58 0 0 0 .18.58l.12.29a5 5 0 0 0 .3.56l.14.22a.56.56 0 0 0 .05.08L3 16a5 5 0 0 0 4 2h3v-1.37a2 2 0 0 1-1 .27 2.05 2.05 0 0 1-1.44-.61 2 2 0 0 1 .05-2.83l3-2.9A2 2 0 0 1 12 10a2 2 0 0 1 1.41.59l3 3a2 2 0 0 1 0 2.82A2 2 0 0 1 15 17a1.92 1.92 0 0 1-1-.27V18h3a5 5 0 0 0 4-2l.05-.05a.56.56 0 0 0 .05-.08l.14-.22a5 5 0 0 0 .3-.56l.12-.29a5.58 5.58 0 0 0 .18-.58c0-.1.05-.19.07-.29A5.5 5.5 0 0 0 22 13a5.23 5.23 0 0 0-.1-1z\"/><path d=\"M12.71 11.29a1 1 0 0 0-1.4 0l-3 2.9a1 1 0 1 0 1.38 1.44L11 14.36V20a1 1 0 0 0 2 0v-5.59l1.29 1.3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z\"/></g></g>","code-download":"<g data-name=\"Layer 2\"><g data-name=\"code-download\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M4.29 12l4.48-5.36a1 1 0 1 0-1.54-1.28l-5 6a1 1 0 0 0 0 1.27l4.83 6a1 1 0 0 0 .78.37 1 1 0 0 0 .78-1.63z\"/><path d=\"M21.78 11.37l-4.78-6a1 1 0 0 0-1.56 1.26L19.71 12l-4.48 5.37a1 1 0 0 0 .13 1.41A1 1 0 0 0 16 19a1 1 0 0 0 .77-.36l5-6a1 1 0 0 0 .01-1.27z\"/><path d=\"M15.72 11.41a1 1 0 0 0-1.41 0L13 12.64V8a1 1 0 0 0-2 0v4.59l-1.29-1.3a1 1 0 0 0-1.42 1.42l3 3A1 1 0 0 0 12 16a1 1 0 0 0 .69-.28l3-2.9a1 1 0 0 0 .03-1.41z\"/></g></g>","code":"<g data-name=\"Layer 2\"><g data-name=\"code\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M8.64 5.23a1 1 0 0 0-1.41.13l-5 6a1 1 0 0 0 0 1.27l4.83 6a1 1 0 0 0 .78.37 1 1 0 0 0 .78-1.63L4.29 12l4.48-5.36a1 1 0 0 0-.13-1.41z\"/><path d=\"M21.78 11.37l-4.78-6a1 1 0 0 0-1.41-.15 1 1 0 0 0-.15 1.41L19.71 12l-4.48 5.37a1 1 0 0 0 .13 1.41A1 1 0 0 0 16 19a1 1 0 0 0 .77-.36l5-6a1 1 0 0 0 .01-1.27z\"/></g></g>","collapse":"<g data-name=\"Layer 2\"><g data-name=\"collapse\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M19 9h-2.58l3.29-3.29a1 1 0 1 0-1.42-1.42L15 7.57V5a1 1 0 0 0-1-1 1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 0-2z\"/><path d=\"M10 13H5a1 1 0 0 0 0 2h2.57l-3.28 3.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0L9 16.42V19a1 1 0 0 0 1 1 1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1z\"/></g></g>","color-palette":"<g data-name=\"Layer 2\"><g data-name=\"color-palette\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19.54 5.08A10.61 10.61 0 0 0 11.91 2a10 10 0 0 0-.05 20 2.58 2.58 0 0 0 2.53-1.89 2.52 2.52 0 0 0-.57-2.28.5.5 0 0 1 .37-.83h1.65A6.15 6.15 0 0 0 22 11.33a8.48 8.48 0 0 0-2.46-6.25zm-12.7 9.66a1.5 1.5 0 1 1 .4-2.08 1.49 1.49 0 0 1-.4 2.08zM8.3 9.25a1.5 1.5 0 1 1-.55-2 1.5 1.5 0 0 1 .55 2zM11 7a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 11 7zm5.75.8a1.5 1.5 0 1 1 .55-2 1.5 1.5 0 0 1-.55 2z\"/></g></g>","color-picker":"<g data-name=\"Layer 2\"><g data-name=\"color-picker\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19.4 7.34L16.66 4.6A1.92 1.92 0 0 0 14 4.53l-2 2-1.29-1.24a1 1 0 0 0-1.42 1.42L10.53 8 5 13.53a2 2 0 0 0-.57 1.21L4 18.91a1 1 0 0 0 .29.8A1 1 0 0 0 5 20h.09l4.17-.38a2 2 0 0 0 1.21-.57l5.58-5.58 1.24 1.24a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42l-1.24-1.24 2-2a1.92 1.92 0 0 0-.07-2.71zm-13 7.6L12 9.36l2.69 2.7-2.79 2.79\"/></g></g>","compass":"<g data-name=\"Layer 2\"><g data-name=\"compass\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><polygon points=\"10.8 13.21 12.49 12.53 13.2 10.79 11.51 11.47 10.8 13.21\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm3.93 7.42l-1.75 4.26a1 1 0 0 1-.55.55l-4.21 1.7A1 1 0 0 1 9 16a1 1 0 0 1-.71-.31h-.05a1 1 0 0 1-.18-1l1.75-4.26a1 1 0 0 1 .55-.55l4.21-1.7a1 1 0 0 1 1.1.25 1 1 0 0 1 .26.99z\"/></g></g>","copy":"<g data-name=\"Layer 2\"><g data-name=\"copy\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 9h-3V5.67A2.68 2.68 0 0 0 12.33 3H5.67A2.68 2.68 0 0 0 3 5.67v6.66A2.68 2.68 0 0 0 5.67 15H9v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3zm-9 3v1H5.67a.67.67 0 0 1-.67-.67V5.67A.67.67 0 0 1 5.67 5h6.66a.67.67 0 0 1 .67.67V9h-1a3 3 0 0 0-3 3z\"/></g></g>","corner-down-left":"<g data-name=\"Layer 2\"><g data-name=\"corner-down-left\"><rect x=\".05\" y=\".05\" width=\"24\" height=\"24\" transform=\"rotate(-89.76 12.05 12.05)\" opacity=\"0\"/><path d=\"M20 6a1 1 0 0 0-1-1 1 1 0 0 0-1 1v5a1 1 0 0 1-.29.71A1 1 0 0 1 17 12H8.08l2.69-3.39a1 1 0 0 0-1.52-1.17l-4 5a1 1 0 0 0 0 1.25l4 5a1 1 0 0 0 .78.37 1 1 0 0 0 .62-.22 1 1 0 0 0 .15-1.41l-2.66-3.36h8.92a3 3 0 0 0 3-3z\"/></g></g>","corner-down-right":"<g data-name=\"Layer 2\"><g data-name=\"corner-down-right\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M19.78 12.38l-4-5a1 1 0 0 0-1.56 1.24l2.7 3.38H8a1 1 0 0 1-1-1V6a1 1 0 0 0-2 0v5a3 3 0 0 0 3 3h8.92l-2.7 3.38a1 1 0 0 0 .16 1.4A1 1 0 0 0 15 19a1 1 0 0 0 .78-.38l4-5a1 1 0 0 0 0-1.24z\"/></g></g>","corner-left-down":"<g data-name=\"Layer 2\"><g data-name=\"corner-left-down\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 5h-5a3 3 0 0 0-3 3v8.92l-3.38-2.7a1 1 0 0 0-1.24 1.56l5 4a1 1 0 0 0 1.24 0l5-4a1 1 0 1 0-1.24-1.56L12 16.92V8a1 1 0 0 1 1-1h5a1 1 0 0 0 0-2z\"/></g></g>","corner-left-up":"<g data-name=\"Layer 2\"><g data-name=\"corner-left-up\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M18 17h-5a1 1 0 0 1-1-1V7.08l3.38 2.7A1 1 0 0 0 16 10a1 1 0 0 0 .78-.38 1 1 0 0 0-.16-1.4l-5-4a1 1 0 0 0-1.24 0l-5 4a1 1 0 0 0 1.24 1.56L10 7.08V16a3 3 0 0 0 3 3h5a1 1 0 0 0 0-2z\"/></g></g>","corner-right-down":"<g data-name=\"Layer 2\"><g data-name=\"corner-right-down\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18.78 14.38a1 1 0 0 0-1.4-.16L14 16.92V8a3 3 0 0 0-3-3H6a1 1 0 0 0 0 2h5a1 1 0 0 1 1 1v8.92l-3.38-2.7a1 1 0 0 0-1.24 1.56l5 4a1 1 0 0 0 1.24 0l5-4a1 1 0 0 0 .16-1.4z\"/></g></g>","corner-right-up":"<g data-name=\"Layer 2\"><g data-name=\"corner-right-up\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M18.62 8.22l-5-4a1 1 0 0 0-1.24 0l-5 4a1 1 0 0 0 1.24 1.56L12 7.08V16a1 1 0 0 1-1 1H6a1 1 0 0 0 0 2h5a3 3 0 0 0 3-3V7.08l3.38 2.7A1 1 0 0 0 18 10a1 1 0 0 0 .78-.38 1 1 0 0 0-.16-1.4z\"/></g></g>","corner-up-left":"<g data-name=\"Layer 2\"><g data-name=\"corner-up-left\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M16 10H7.08l2.7-3.38a1 1 0 1 0-1.56-1.24l-4 5a1 1 0 0 0 0 1.24l4 5A1 1 0 0 0 9 17a1 1 0 0 0 .62-.22 1 1 0 0 0 .16-1.4L7.08 12H16a1 1 0 0 1 1 1v5a1 1 0 0 0 2 0v-5a3 3 0 0 0-3-3z\"/></g></g>","corner-up-right":"<g data-name=\"Layer 2\"><g data-name=\"corner-up-right\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M19.78 10.38l-4-5a1 1 0 0 0-1.56 1.24l2.7 3.38H8a3 3 0 0 0-3 3v5a1 1 0 0 0 2 0v-5a1 1 0 0 1 1-1h8.92l-2.7 3.38a1 1 0 0 0 .16 1.4A1 1 0 0 0 15 17a1 1 0 0 0 .78-.38l4-5a1 1 0 0 0 0-1.24z\"/></g></g>","credit-card":"<g data-name=\"Layer 2\"><g data-name=\"credit-card\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19 5H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3zm-8 10H7a1 1 0 0 1 0-2h4a1 1 0 0 1 0 2zm6 0h-2a1 1 0 0 1 0-2h2a1 1 0 0 1 0 2zm3-6H4V8a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1z\"/></g></g>","crop":"<g data-name=\"Layer 2\"><g data-name=\"crop\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21 16h-3V8.56A2.56 2.56 0 0 0 15.44 6H8V3a1 1 0 0 0-2 0v3H3a1 1 0 0 0 0 2h3v7.44A2.56 2.56 0 0 0 8.56 18H16v3a1 1 0 0 0 2 0v-3h3a1 1 0 0 0 0-2zM8.56 16a.56.56 0 0 1-.56-.56V8h7.44a.56.56 0 0 1 .56.56V16z\"/></g></g>","cube":"<g data-name=\"Layer 2\"><g data-name=\"cube\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M11.25 11.83L3 8.36v7.73a1.69 1.69 0 0 0 1 1.52L11.19 21h.06z\"/><path d=\"M12 10.5l8.51-3.57a1.62 1.62 0 0 0-.51-.38l-7.2-3.37a1.87 1.87 0 0 0-1.6 0L4 6.55a1.62 1.62 0 0 0-.51.38z\"/><path d=\"M12.75 11.83V21h.05l7.2-3.39a1.69 1.69 0 0 0 1-1.51V8.36z\"/></g></g>","diagonal-arrow-left-down":"<g data-name=\"Layer 2\"><g data-name=\"diagonal-arrow-left-down\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M17.71 6.29a1 1 0 0 0-1.42 0L8 14.59V9a1 1 0 0 0-2 0v8a1 1 0 0 0 1 1h8a1 1 0 0 0 0-2H9.41l8.3-8.29a1 1 0 0 0 0-1.42z\"/></g></g>","diagonal-arrow-left-up":"<g data-name=\"Layer 2\"><g data-name=\"diagonal-arrow-left-up\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M17.71 16.29L9.42 8H15a1 1 0 0 0 0-2H7.05a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1H7a1 1 0 0 0 1-1V9.45l8.26 8.26a1 1 0 0 0 1.42 0 1 1 0 0 0 .03-1.42z\"/></g></g>","diagonal-arrow-right-down":"<g data-name=\"Layer 2\"><g data-name=\"diagonal-arrow-right-down\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M17 8a1 1 0 0 0-1 1v5.59l-8.29-8.3a1 1 0 0 0-1.42 1.42l8.3 8.29H9a1 1 0 0 0 0 2h8a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1z\"/></g></g>","diagonal-arrow-right-up":"<g data-name=\"Layer 2\"><g data-name=\"diagonal-arrow-right-up\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M18 7.05a1 1 0 0 0-1-1L9 6a1 1 0 0 0 0 2h5.56l-8.27 8.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0L16 9.42V15a1 1 0 0 0 1 1 1 1 0 0 0 1-1z\"/></g></g>","done-all":"<g data-name=\"Layer 2\"><g data-name=\"done-all\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M16.62 6.21a1 1 0 0 0-1.41.17l-7 9-3.43-4.18a1 1 0 1 0-1.56 1.25l4.17 5.18a1 1 0 0 0 .78.37 1 1 0 0 0 .83-.38l7.83-10a1 1 0 0 0-.21-1.41z\"/><path d=\"M21.62 6.21a1 1 0 0 0-1.41.17l-7 9-.61-.75-1.26 1.62 1.1 1.37a1 1 0 0 0 .78.37 1 1 0 0 0 .78-.38l7.83-10a1 1 0 0 0-.21-1.4z\"/><path d=\"M8.71 13.06L10 11.44l-.2-.24a1 1 0 0 0-1.43-.2 1 1 0 0 0-.15 1.41z\"/></g></g>","download":"<g data-name=\"Layer 2\"><g data-name=\"download\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><rect x=\"4\" y=\"18\" width=\"16\" height=\"2\" rx=\"1\" ry=\"1\"/><rect x=\"3\" y=\"17\" width=\"4\" height=\"2\" rx=\"1\" ry=\"1\" transform=\"rotate(-90 5 18)\"/><rect x=\"17\" y=\"17\" width=\"4\" height=\"2\" rx=\"1\" ry=\"1\" transform=\"rotate(-90 19 18)\"/><path d=\"M12 15a1 1 0 0 1-.58-.18l-4-2.82a1 1 0 0 1-.24-1.39 1 1 0 0 1 1.4-.24L12 12.76l3.4-2.56a1 1 0 0 1 1.2 1.6l-4 3a1 1 0 0 1-.6.2z\"/><path d=\"M12 13a1 1 0 0 1-1-1V4a1 1 0 0 1 2 0v8a1 1 0 0 1-1 1z\"/></g></g>","droplet-off":"<g data-name=\"Layer 2\"><g data-name=\"droplet-off\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19 16.14A7.73 7.73 0 0 0 17.34 8l-4.56-4.69a1 1 0 0 0-.71-.31 1 1 0 0 0-.72.3L8.74 5.92z\"/><path d=\"M6 8.82a7.73 7.73 0 0 0 .64 9.9A7.44 7.44 0 0 0 11.92 21a7.34 7.34 0 0 0 4.64-1.6z\"/><path d=\"M20.71 19.29l-16-16a1 1 0 0 0-1.42 1.42l16 16a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z\"/></g></g>","droplet":"<g data-name=\"Layer 2\"><g data-name=\"droplet\"><rect x=\".1\" y=\".1\" width=\"24\" height=\"24\" transform=\"rotate(.48 11.987 11.887)\" opacity=\"0\"/><path d=\"M12 21.1a7.4 7.4 0 0 1-5.28-2.28 7.73 7.73 0 0 1 .1-10.77l4.64-4.65a.94.94 0 0 1 .71-.3 1 1 0 0 1 .71.31l4.56 4.72a7.73 7.73 0 0 1-.09 10.77A7.33 7.33 0 0 1 12 21.1z\"/></g></g>","edit-2":"<g data-name=\"Layer 2\"><g data-name=\"edit-2\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19 20H5a1 1 0 0 0 0 2h14a1 1 0 0 0 0-2z\"/><path d=\"M5 18h.09l4.17-.38a2 2 0 0 0 1.21-.57l9-9a1.92 1.92 0 0 0-.07-2.71L16.66 2.6A2 2 0 0 0 14 2.53l-9 9a2 2 0 0 0-.57 1.21L4 16.91a1 1 0 0 0 .29.8A1 1 0 0 0 5 18zM15.27 4L18 6.73l-2 1.95L13.32 6z\"/></g></g>","edit":"<g data-name=\"Layer 2\"><g data-name=\"edit\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19.4 7.34L16.66 4.6A2 2 0 0 0 14 4.53l-9 9a2 2 0 0 0-.57 1.21L4 18.91a1 1 0 0 0 .29.8A1 1 0 0 0 5 20h.09l4.17-.38a2 2 0 0 0 1.21-.57l9-9a1.92 1.92 0 0 0-.07-2.71zM16 10.68L13.32 8l1.95-2L18 8.73z\"/></g></g>","email":"<g data-name=\"Layer 2\"><g data-name=\"email\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19 4H5a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm0 2l-6.5 4.47a1 1 0 0 1-1 0L5 6z\"/></g></g>","expand":"<g data-name=\"Layer 2\"><g data-name=\"expand\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M20 5a1 1 0 0 0-1-1h-5a1 1 0 0 0 0 2h2.57l-3.28 3.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0L18 7.42V10a1 1 0 0 0 1 1 1 1 0 0 0 1-1z\"/><path d=\"M10.71 13.29a1 1 0 0 0-1.42 0L6 16.57V14a1 1 0 0 0-1-1 1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 0-2H7.42l3.29-3.29a1 1 0 0 0 0-1.42z\"/></g></g>","external-link":"<g data-name=\"Layer 2\"><g data-name=\"external-link\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20 11a1 1 0 0 0-1 1v6a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6a1 1 0 0 0 0-2H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-6a1 1 0 0 0-1-1z\"/><path d=\"M16 5h1.58l-6.29 6.28a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0L19 6.42V8a1 1 0 0 0 1 1 1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-4a1 1 0 0 0 0 2z\"/></g></g>","eye-off-2":"<g data-name=\"Layer 2\"><g data-name=\"eye-off-2\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M17.81 13.39A8.93 8.93 0 0 0 21 7.62a1 1 0 1 0-2-.24 7.07 7.07 0 0 1-14 0 1 1 0 1 0-2 .24 8.93 8.93 0 0 0 3.18 5.77l-2.3 2.32a1 1 0 0 0 1.41 1.41l2.61-2.6a9.06 9.06 0 0 0 3.1.92V19a1 1 0 0 0 2 0v-3.56a9.06 9.06 0 0 0 3.1-.92l2.61 2.6a1 1 0 0 0 1.41-1.41z\"/></g></g>","eye-off":"<g data-name=\"Layer 2\"><g data-name=\"eye-off\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><circle cx=\"12\" cy=\"12\" r=\"1.5\"/><path d=\"M15.29 18.12L14 16.78l-.07-.07-1.27-1.27a4.07 4.07 0 0 1-.61.06A3.5 3.5 0 0 1 8.5 12a4.07 4.07 0 0 1 .06-.61l-2-2L5 7.87a15.89 15.89 0 0 0-2.87 3.63 1 1 0 0 0 0 1c.63 1.09 4 6.5 9.89 6.5h.25a9.48 9.48 0 0 0 3.23-.67z\"/><path d=\"M8.59 5.76l2.8 2.8A4.07 4.07 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 4.07 4.07 0 0 1-.06.61l2.68 2.68.84.84a15.89 15.89 0 0 0 2.91-3.63 1 1 0 0 0 0-1c-.64-1.11-4.16-6.68-10.14-6.5a9.48 9.48 0 0 0-3.23.67z\"/><path d=\"M20.71 19.29L19.41 18l-2-2-9.52-9.53L6.42 5 4.71 3.29a1 1 0 0 0-1.42 1.42L5.53 7l1.75 1.7 7.31 7.3.07.07L16 17.41l.59.59 2.7 2.71a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z\"/></g></g>","eye":"<g data-name=\"Layer 2\"><g data-name=\"eye\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><circle cx=\"12\" cy=\"12\" r=\"1.5\"/><path d=\"M21.87 11.5c-.64-1.11-4.16-6.68-10.14-6.5-5.53.14-8.73 5-9.6 6.5a1 1 0 0 0 0 1c.63 1.09 4 6.5 9.89 6.5h.25c5.53-.14 8.74-5 9.6-6.5a1 1 0 0 0 0-1zm-9.87 4a3.5 3.5 0 1 1 3.5-3.5 3.5 3.5 0 0 1-3.5 3.5z\"/></g></g>","facebook":"<g data-name=\"Layer 2\"><g data-name=\"facebook\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M17 3.5a.5.5 0 0 0-.5-.5H14a4.77 4.77 0 0 0-5 4.5v2.7H6.5a.5.5 0 0 0-.5.5v2.6a.5.5 0 0 0 .5.5H9v6.7a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-6.7h2.62a.5.5 0 0 0 .49-.37l.72-2.6a.5.5 0 0 0-.48-.63H13V7.5a1 1 0 0 1 1-.9h2.5a.5.5 0 0 0 .5-.5z\"/></g></g>","file-add":"<g data-name=\"Layer 2\"><g data-name=\"file-add\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19.74 7.33l-4.44-5a1 1 0 0 0-.74-.33h-8A2.53 2.53 0 0 0 4 4.5v15A2.53 2.53 0 0 0 6.56 22h10.88A2.53 2.53 0 0 0 20 19.5V8a1 1 0 0 0-.26-.67zM14 15h-1v1a1 1 0 0 1-2 0v-1h-1a1 1 0 0 1 0-2h1v-1a1 1 0 0 1 2 0v1h1a1 1 0 0 1 0 2zm.71-7a.79.79 0 0 1-.71-.85V4l3.74 4z\"/></g></g>","file-remove":"<g data-name=\"Layer 2\"><g data-name=\"file-remove\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19.74 7.33l-4.44-5a1 1 0 0 0-.74-.33h-8A2.53 2.53 0 0 0 4 4.5v15A2.53 2.53 0 0 0 6.56 22h10.88A2.53 2.53 0 0 0 20 19.5V8a1 1 0 0 0-.26-.67zM14 15h-4a1 1 0 0 1 0-2h4a1 1 0 0 1 0 2zm.71-7a.79.79 0 0 1-.71-.85V4l3.74 4z\"/></g></g>","file-text":"<g data-name=\"Layer 2\"><g data-name=\"file-text\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19.74 7.33l-4.44-5a1 1 0 0 0-.74-.33h-8A2.53 2.53 0 0 0 4 4.5v15A2.53 2.53 0 0 0 6.56 22h10.88A2.53 2.53 0 0 0 20 19.5V8a1 1 0 0 0-.26-.67zM9 12h3a1 1 0 0 1 0 2H9a1 1 0 0 1 0-2zm6 6H9a1 1 0 0 1 0-2h6a1 1 0 0 1 0 2zm-.29-10a.79.79 0 0 1-.71-.85V4l3.74 4z\"/></g></g>","file":"<g data-name=\"Layer 2\"><g data-name=\"file\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19.74 7.33l-4.44-5a1 1 0 0 0-.74-.33h-8A2.53 2.53 0 0 0 4 4.5v15A2.53 2.53 0 0 0 6.56 22h10.88A2.53 2.53 0 0 0 20 19.5V8a1 1 0 0 0-.26-.67zM14 4l3.74 4h-3a.79.79 0 0 1-.74-.85z\"/></g></g>","film":"<g data-name=\"Layer 2\"><g data-name=\"film\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18.26 3H5.74A2.74 2.74 0 0 0 3 5.74v12.52A2.74 2.74 0 0 0 5.74 21h12.52A2.74 2.74 0 0 0 21 18.26V5.74A2.74 2.74 0 0 0 18.26 3zM7 11H5V9h2zm-2 2h2v2H5zm14-2h-2V9h2zm-2 2h2v2h-2zm2-7.26V7h-2V5h1.26a.74.74 0 0 1 .74.74zM5.74 5H7v2H5V5.74A.74.74 0 0 1 5.74 5zM5 18.26V17h2v2H5.74a.74.74 0 0 1-.74-.74zm14 0a.74.74 0 0 1-.74.74H17v-2h2z\"/></g></g>","flag":"<g data-name=\"Layer 2\"><g data-name=\"flag\"><polyline points=\"24 24 0 24 0 0\" opacity=\"0\"/><path d=\"M19.27 4.68a1.79 1.79 0 0 0-1.6-.25 7.53 7.53 0 0 1-2.17.28 8.54 8.54 0 0 1-3.13-.78A10.15 10.15 0 0 0 8.5 3c-2.89 0-4 1-4.2 1.14a1 1 0 0 0-.3.72V20a1 1 0 0 0 2 0v-4.3a6.28 6.28 0 0 1 2.5-.41 8.54 8.54 0 0 1 3.13.78 10.15 10.15 0 0 0 3.87.93 7.66 7.66 0 0 0 3.5-.7 1.74 1.74 0 0 0 1-1.55V6.11a1.77 1.77 0 0 0-.73-1.43z\"/></g></g>","flash-off":"<g data-name=\"Layer 2\"><g data-name=\"flash-off\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M17.33 14.5l2.5-3.74A1 1 0 0 0 19 9.2h-5.89l.77-7.09a1 1 0 0 0-.65-1 1 1 0 0 0-1.17.38L8.94 6.11z\"/><path d=\"M6.67 9.5l-2.5 3.74A1 1 0 0 0 5 14.8h5.89l-.77 7.09a1 1 0 0 0 .65 1.05 1 1 0 0 0 .34.06 1 1 0 0 0 .83-.44l3.12-4.67z\"/><path d=\"M20.71 19.29l-16-16a1 1 0 0 0-1.42 1.42l16 16a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z\"/></g></g>","flash":"<g data-name=\"Layer 2\"><g data-name=\"flash\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M11.11 23a1 1 0 0 1-.34-.06 1 1 0 0 1-.65-1.05l.77-7.09H5a1 1 0 0 1-.83-1.56l7.89-11.8a1 1 0 0 1 1.17-.38 1 1 0 0 1 .65 1l-.77 7.14H19a1 1 0 0 1 .83 1.56l-7.89 11.8a1 1 0 0 1-.83.44z\"/></g></g>","flip-2":"<g data-name=\"Layer 2\"><g data-name=\"flip-2\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M6.09 19h12l-1.3 1.29a1 1 0 0 0 1.42 1.42l3-3a1 1 0 0 0 0-1.42l-3-3a1 1 0 0 0-1.42 0 1 1 0 0 0 0 1.42l1.3 1.29h-12a1.56 1.56 0 0 1-1.59-1.53V13a1 1 0 0 0-2 0v2.47A3.56 3.56 0 0 0 6.09 19z\"/><path d=\"M5.79 9.71a1 1 0 1 0 1.42-1.42L5.91 7h12a1.56 1.56 0 0 1 1.59 1.53V11a1 1 0 0 0 2 0V8.53A3.56 3.56 0 0 0 17.91 5h-12l1.3-1.29a1 1 0 0 0 0-1.42 1 1 0 0 0-1.42 0l-3 3a1 1 0 0 0 0 1.42z\"/></g></g>","flip":"<g data-name=\"Layer 2\"><g data-name=\"flip-in\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M5 6.09v12l-1.29-1.3a1 1 0 0 0-1.42 1.42l3 3a1 1 0 0 0 1.42 0l3-3a1 1 0 0 0 0-1.42 1 1 0 0 0-1.42 0L7 18.09v-12A1.56 1.56 0 0 1 8.53 4.5H11a1 1 0 0 0 0-2H8.53A3.56 3.56 0 0 0 5 6.09z\"/><path d=\"M14.29 5.79a1 1 0 0 0 1.42 1.42L17 5.91v12a1.56 1.56 0 0 1-1.53 1.59H13a1 1 0 0 0 0 2h2.47A3.56 3.56 0 0 0 19 17.91v-12l1.29 1.3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42l-3-3a1 1 0 0 0-1.42 0z\"/></g></g>","folder-add":"<g data-name=\"Layer 2\"><g data-name=\"folder-add\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19.5 7.05h-7L9.87 3.87a1 1 0 0 0-.77-.37H4.5A2.47 2.47 0 0 0 2 5.93v12.14a2.47 2.47 0 0 0 2.5 2.43h15a2.47 2.47 0 0 0 2.5-2.43V9.48a2.47 2.47 0 0 0-2.5-2.43zM14 15h-1v1a1 1 0 0 1-2 0v-1h-1a1 1 0 0 1 0-2h1v-1a1 1 0 0 1 2 0v1h1a1 1 0 0 1 0 2z\"/></g></g>","folder-remove":"<g data-name=\"Layer 2\"><g data-name=\"folder-remove\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19.5 7.05h-7L9.87 3.87a1 1 0 0 0-.77-.37H4.5A2.47 2.47 0 0 0 2 5.93v12.14a2.47 2.47 0 0 0 2.5 2.43h15a2.47 2.47 0 0 0 2.5-2.43V9.48a2.47 2.47 0 0 0-2.5-2.43zM14 15h-4a1 1 0 0 1 0-2h4a1 1 0 0 1 0 2z\"/></g></g>","folder":"<g data-name=\"Layer 2\"><g data-name=\"folder\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19.5 20.5h-15A2.47 2.47 0 0 1 2 18.07V5.93A2.47 2.47 0 0 1 4.5 3.5h4.6a1 1 0 0 1 .77.37l2.6 3.18h7A2.47 2.47 0 0 1 22 9.48v8.59a2.47 2.47 0 0 1-2.5 2.43z\"/></g></g>","funnel":"<g data-name=\"Layer 2\"><g data-name=\"funnel\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M13.9 22a1 1 0 0 1-.6-.2l-4-3.05a1 1 0 0 1-.39-.8v-3.27l-4.8-9.22A1 1 0 0 1 5 4h14a1 1 0 0 1 .86.49 1 1 0 0 1 0 1l-5 9.21V21a1 1 0 0 1-.55.9 1 1 0 0 1-.41.1z\"/></g></g>","gift":"<g data-name=\"Layer 2\"><g data-name=\"gift\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M4.64 15.27v4.82a.92.92 0 0 0 .92.91h5.62v-5.73z\"/><path d=\"M12.82 21h5.62a.92.92 0 0 0 .92-.91v-4.82h-6.54z\"/><path d=\"M20.1 7.09h-1.84a2.82 2.82 0 0 0 .29-1.23A2.87 2.87 0 0 0 15.68 3 4.21 4.21 0 0 0 12 5.57 4.21 4.21 0 0 0 8.32 3a2.87 2.87 0 0 0-2.87 2.86 2.82 2.82 0 0 0 .29 1.23H3.9c-.5 0-.9.59-.9 1.31v3.93c0 .72.4 1.31.9 1.31h7.28V7.09h1.64v6.55h7.28c.5 0 .9-.59.9-1.31V8.4c0-.72-.4-1.31-.9-1.31zm-11.78 0a1.23 1.23 0 1 1 0-2.45c1.4 0 2.19 1.44 2.58 2.45zm7.36 0H13.1c.39-1 1.18-2.45 2.58-2.45a1.23 1.23 0 1 1 0 2.45z\"/></g></g>","github":"<g data-name=\"Layer 2\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M12 1A10.89 10.89 0 0 0 1 11.77 10.79 10.79 0 0 0 8.52 22c.55.1.75-.23.75-.52v-1.83c-3.06.65-3.71-1.44-3.71-1.44a2.86 2.86 0 0 0-1.22-1.58c-1-.66.08-.65.08-.65a2.31 2.31 0 0 1 1.68 1.11 2.37 2.37 0 0 0 3.2.89 2.33 2.33 0 0 1 .7-1.44c-2.44-.27-5-1.19-5-5.32a4.15 4.15 0 0 1 1.11-2.91 3.78 3.78 0 0 1 .11-2.84s.93-.29 3 1.1a10.68 10.68 0 0 1 5.5 0c2.1-1.39 3-1.1 3-1.1a3.78 3.78 0 0 1 .11 2.84A4.15 4.15 0 0 1 19 11.2c0 4.14-2.58 5.05-5 5.32a2.5 2.5 0 0 1 .75 2v2.95c0 .35.2.63.75.52A10.8 10.8 0 0 0 23 11.77 10.89 10.89 0 0 0 12 1\" data-name=\"github\"/></g>","globe-2":"<g data-name=\"Layer 2\"><g data-name=\"globe-2\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 2a8.19 8.19 0 0 1 1.79.21 2.61 2.61 0 0 1-.78 1c-.22.17-.46.31-.7.46a4.56 4.56 0 0 0-1.85 1.67 6.49 6.49 0 0 0-.62 3.3c0 1.36 0 2.16-.95 2.87-1.37 1.07-3.46.47-4.76-.07A8.33 8.33 0 0 1 4 12a8 8 0 0 1 8-8zm4.89 14.32a6.79 6.79 0 0 0-.63-1.14c-.11-.16-.22-.32-.32-.49-.39-.68-.25-1 .38-2l.1-.17a4.77 4.77 0 0 0 .58-2.43 5.42 5.42 0 0 1 .09-1c.16-.73 1.71-.93 2.67-1a7.94 7.94 0 0 1-2.86 8.28z\"/></g></g>","globe-3":"<g data-name=\"Layer 2\"><g data-name=\"globe-3\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zM5 15.8a8.42 8.42 0 0 0 2 .27 5 5 0 0 0 3.14-1c1.71-1.34 1.71-3.06 1.71-4.44a4.76 4.76 0 0 1 .37-2.34 2.86 2.86 0 0 1 1.12-.91 9.75 9.75 0 0 0 .92-.61 4.55 4.55 0 0 0 1.4-1.87A8 8 0 0 1 19 8.12c-1.43.2-3.46.67-3.86 2.53A7 7 0 0 0 15 12a2.93 2.93 0 0 1-.29 1.47l-.1.17c-.65 1.08-1.38 2.31-.39 4 .12.21.25.41.38.61a2.29 2.29 0 0 1 .52 1.08A7.89 7.89 0 0 1 12 20a8 8 0 0 1-7-4.2z\"/></g></g>","globe":"<g data-name=\"Layer 2\"><g data-name=\"globe\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M22 12A10 10 0 0 0 12 2a10 10 0 0 0 0 20 10 10 0 0 0 10-10zm-2.07-1H17a12.91 12.91 0 0 0-2.33-6.54A8 8 0 0 1 19.93 11zM9.08 13H15a11.44 11.44 0 0 1-3 6.61A11 11 0 0 1 9.08 13zm0-2A11.4 11.4 0 0 1 12 4.4a11.19 11.19 0 0 1 3 6.6zm.36-6.57A13.18 13.18 0 0 0 7.07 11h-3a8 8 0 0 1 5.37-6.57zM4.07 13h3a12.86 12.86 0 0 0 2.35 6.56A8 8 0 0 1 4.07 13zm10.55 6.55A13.14 13.14 0 0 0 17 13h2.95a8 8 0 0 1-5.33 6.55z\"/></g></g>","google":"<g data-name=\"Layer 2\"><g data-name=\"google\"><polyline points=\"0 0 24 0 24 24 0 24\" opacity=\"0\"/><path d=\"M17.5 14a5.51 5.51 0 0 1-4.5 3.93 6.15 6.15 0 0 1-7-5.45A6 6 0 0 1 12 6a6.12 6.12 0 0 1 2.27.44.5.5 0 0 0 .64-.21l1.44-2.65a.52.52 0 0 0-.23-.7A10 10 0 0 0 2 12.29 10.12 10.12 0 0 0 11.57 22 10 10 0 0 0 22 12.52v-2a.51.51 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h5\"/></g></g>","grid":"<g data-name=\"Layer 2\"><g data-name=\"grid\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M9 3H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z\"/><path d=\"M19 3h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z\"/><path d=\"M9 13H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2z\"/><path d=\"M19 13h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2z\"/></g></g>","hard-drive":"<g data-name=\"Layer 2\"><g data-name=\"hard-drive\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.79 11.34l-3.34-6.68A3 3 0 0 0 14.76 3H9.24a3 3 0 0 0-2.69 1.66l-3.34 6.68a2 2 0 0 0-.21.9V18a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-5.76a2 2 0 0 0-.21-.9zM8 17a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm8 0h-4a1 1 0 0 1 0-2h4a1 1 0 0 1 0 2zM5.62 11l2.72-5.45a1 1 0 0 1 .9-.55h5.52a1 1 0 0 1 .9.55L18.38 11z\"/></g></g>","hash":"<g data-name=\"Layer 2\"><g data-name=\"hash\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M20 14h-4.3l.73-4H20a1 1 0 0 0 0-2h-3.21l.69-3.81A1 1 0 0 0 16.64 3a1 1 0 0 0-1.22.82L14.67 8h-3.88l.69-3.81A1 1 0 0 0 10.64 3a1 1 0 0 0-1.22.82L8.67 8H4a1 1 0 0 0 0 2h4.3l-.73 4H4a1 1 0 0 0 0 2h3.21l-.69 3.81A1 1 0 0 0 7.36 21a1 1 0 0 0 1.22-.82L9.33 16h3.88l-.69 3.81a1 1 0 0 0 .84 1.19 1 1 0 0 0 1.22-.82l.75-4.18H20a1 1 0 0 0 0-2zM9.7 14l.73-4h3.87l-.73 4z\"/></g></g>","headphones":"<g data-name=\"Layer 2\"><g data-name=\"headphones\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2A10.2 10.2 0 0 0 2 12.37V17a4 4 0 1 0 4-4 3.91 3.91 0 0 0-2 .56v-1.19A8.2 8.2 0 0 1 12 4a8.2 8.2 0 0 1 8 8.37v1.19a3.91 3.91 0 0 0-2-.56 4 4 0 1 0 4 4v-4.63A10.2 10.2 0 0 0 12 2z\"/></g></g>","heart":"<g data-name=\"Layer 2\"><g data-name=\"heart\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 21a1 1 0 0 1-.71-.29l-7.77-7.78a5.26 5.26 0 0 1 0-7.4 5.24 5.24 0 0 1 7.4 0L12 6.61l1.08-1.08a5.24 5.24 0 0 1 7.4 0 5.26 5.26 0 0 1 0 7.4l-7.77 7.78A1 1 0 0 1 12 21z\"/></g></g>","home":"<g data-name=\"Layer 2\"><g data-name=\"home\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><rect x=\"10\" y=\"14\" width=\"4\" height=\"7\"/><path d=\"M20.42 10.18L12.71 2.3a1 1 0 0 0-1.42 0l-7.71 7.89A2 2 0 0 0 3 11.62V20a2 2 0 0 0 1.89 2H8v-9a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v9h3.11A2 2 0 0 0 21 20v-8.38a2.07 2.07 0 0 0-.58-1.44z\"/></g></g>","image-2":"<g data-name=\"Layer 2\"><g data-name=\"image-2\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zM8 7a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 8 7zm11 10.83A1.09 1.09 0 0 1 18 19H6l7.57-6.82a.69.69 0 0 1 .93 0l4.5 4.48z\"/></g></g>","image":"<g data-name=\"Layer 2\"><g data-name=\"image\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zM6 5h12a1 1 0 0 1 1 1v8.36l-3.2-2.73a2.77 2.77 0 0 0-3.52 0L5 17.7V6a1 1 0 0 1 1-1z\"/><circle cx=\"8\" cy=\"8.5\" r=\"1.5\"/></g></g>","inbox":"<g data-name=\"Layer 2\"><g data-name=\"inbox\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M20.79 11.34l-3.34-6.68A3 3 0 0 0 14.76 3H9.24a3 3 0 0 0-2.69 1.66l-3.34 6.68a2 2 0 0 0-.21.9V18a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-5.76a2 2 0 0 0-.21-.9zM8.34 5.55a1 1 0 0 1 .9-.55h5.52a1 1 0 0 1 .9.55L18.38 11H16a1 1 0 0 0-1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-2a1 1 0 0 0-1-1H5.62z\"/></g></g>","info":"<g data-name=\"Layer 2\"><g data-name=\"info\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14a1 1 0 0 1-2 0v-5a1 1 0 0 1 2 0zm-1-7a1 1 0 1 1 1-1 1 1 0 0 1-1 1z\"/></g></g>","keypad":"<g data-name=\"Layer 2\"><g data-name=\"keypad\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M5 2a3 3 0 1 0 3 3 3 3 0 0 0-3-3z\"/><path d=\"M12 2a3 3 0 1 0 3 3 3 3 0 0 0-3-3z\"/><path d=\"M19 8a3 3 0 1 0-3-3 3 3 0 0 0 3 3z\"/><path d=\"M5 9a3 3 0 1 0 3 3 3 3 0 0 0-3-3z\"/><path d=\"M12 9a3 3 0 1 0 3 3 3 3 0 0 0-3-3z\"/><path d=\"M19 9a3 3 0 1 0 3 3 3 3 0 0 0-3-3z\"/><path d=\"M5 16a3 3 0 1 0 3 3 3 3 0 0 0-3-3z\"/><path d=\"M12 16a3 3 0 1 0 3 3 3 3 0 0 0-3-3z\"/><path d=\"M19 16a3 3 0 1 0 3 3 3 3 0 0 0-3-3z\"/></g></g>","layers":"<g data-name=\"Layer 2\"><g data-name=\"layers\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M3.24 7.29l8.52 4.63a.51.51 0 0 0 .48 0l8.52-4.63a.44.44 0 0 0-.05-.81L12.19 3a.5.5 0 0 0-.38 0L3.29 6.48a.44.44 0 0 0-.05.81z\"/><path d=\"M20.71 10.66l-1.83-.78-6.64 3.61a.51.51 0 0 1-.48 0L5.12 9.88l-1.83.78a.48.48 0 0 0 0 .85l8.52 4.9a.46.46 0 0 0 .48 0l8.52-4.9a.48.48 0 0 0-.1-.85z\"/><path d=\"M20.71 15.1l-1.56-.68-6.91 3.76a.51.51 0 0 1-.48 0l-6.91-3.76-1.56.68a.49.49 0 0 0 0 .87l8.52 5a.51.51 0 0 0 .48 0l8.52-5a.49.49 0 0 0-.1-.87z\"/></g></g>","layout":"<g data-name=\"Layer 2\"><g data-name=\"layout\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21 8V6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v2z\"/><path d=\"M3 10v8a3 3 0 0 0 3 3h5V10z\"/><path d=\"M13 10v11h5a3 3 0 0 0 3-3v-8z\"/></g></g>","link-2":"<g data-name=\"Layer 2\"><g data-name=\"link-2\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M13.29 9.29l-4 4a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l4-4a1 1 0 0 0-1.42-1.42z\"/><path d=\"M12.28 17.4L11 18.67a4.2 4.2 0 0 1-5.58.4 4 4 0 0 1-.27-5.93l1.42-1.43a1 1 0 0 0 0-1.42 1 1 0 0 0-1.42 0l-1.27 1.28a6.15 6.15 0 0 0-.67 8.07 6.06 6.06 0 0 0 9.07.6l1.42-1.42a1 1 0 0 0-1.42-1.42z\"/><path d=\"M19.66 3.22a6.18 6.18 0 0 0-8.13.68L10.45 5a1.09 1.09 0 0 0-.17 1.61 1 1 0 0 0 1.42 0L13 5.3a4.17 4.17 0 0 1 5.57-.4 4 4 0 0 1 .27 5.95l-1.42 1.43a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l1.42-1.42a6.06 6.06 0 0 0-.6-9.06z\"/></g></g>","link":"<g data-name=\"Layer 2\"><g data-name=\"link\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M8 12a1 1 0 0 0 1 1h6a1 1 0 0 0 0-2H9a1 1 0 0 0-1 1z\"/><path d=\"M9 16H7.21A4.13 4.13 0 0 1 3 12.37 4 4 0 0 1 7 8h2a1 1 0 0 0 0-2H7.21a6.15 6.15 0 0 0-6.16 5.21A6 6 0 0 0 7 18h2a1 1 0 0 0 0-2z\"/><path d=\"M23 11.24A6.16 6.16 0 0 0 16.76 6h-1.51C14.44 6 14 6.45 14 7a1 1 0 0 0 1 1h1.79A4.13 4.13 0 0 1 21 11.63 4 4 0 0 1 17 16h-2a1 1 0 0 0 0 2h2a6 6 0 0 0 6-6.76z\"/></g></g>","linkedin":"<g data-name=\"Layer 2\"><g data-name=\"linkedin\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M15.15 8.4a5.83 5.83 0 0 0-5.85 5.82v5.88a.9.9 0 0 0 .9.9h2.1a.9.9 0 0 0 .9-.9v-5.88a1.94 1.94 0 0 1 2.15-1.93 2 2 0 0 1 1.75 2v5.81a.9.9 0 0 0 .9.9h2.1a.9.9 0 0 0 .9-.9v-5.88a5.83 5.83 0 0 0-5.85-5.82z\"/><rect x=\"3\" y=\"9.3\" width=\"4.5\" height=\"11.7\" rx=\".9\" ry=\".9\"/><circle cx=\"5.25\" cy=\"5.25\" r=\"2.25\"/></g></g>","list":"<g data-name=\"Layer 2\"><g data-name=\"list\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><circle cx=\"4\" cy=\"7\" r=\"1\"/><circle cx=\"4\" cy=\"12\" r=\"1\"/><circle cx=\"4\" cy=\"17\" r=\"1\"/><rect x=\"7\" y=\"11\" width=\"14\" height=\"2\" rx=\".94\" ry=\".94\"/><rect x=\"7\" y=\"16\" width=\"14\" height=\"2\" rx=\".94\" ry=\".94\"/><rect x=\"7\" y=\"6\" width=\"14\" height=\"2\" rx=\".94\" ry=\".94\"/></g></g>","lock":"<g data-name=\"Layer 2\"><g data-name=\"lock\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><circle cx=\"12\" cy=\"15\" r=\"1\"/><path d=\"M17 8h-1V6.11a4 4 0 1 0-8 0V8H7a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-8a3 3 0 0 0-3-3zm-7-1.89A2.06 2.06 0 0 1 12 4a2.06 2.06 0 0 1 2 2.11V8h-4zM12 18a3 3 0 1 1 3-3 3 3 0 0 1-3 3z\"/></g></g>","log-in":"<g data-name=\"Layer 2\"><g data-name=\"log-in\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M19 4h-2a1 1 0 0 0 0 2h1v12h-1a1 1 0 0 0 0 2h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z\"/><path d=\"M11.8 7.4a1 1 0 0 0-1.6 1.2L12 11H4a1 1 0 0 0 0 2h8.09l-1.72 2.44a1 1 0 0 0 .24 1.4 1 1 0 0 0 .58.18 1 1 0 0 0 .81-.42l2.82-4a1 1 0 0 0 0-1.18z\"/></g></g>","log-out":"<g data-name=\"Layer 2\"><g data-name=\"log-out\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M7 6a1 1 0 0 0 0-2H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h2a1 1 0 0 0 0-2H6V6z\"/><path d=\"M20.82 11.42l-2.82-4a1 1 0 0 0-1.39-.24 1 1 0 0 0-.24 1.4L18.09 11H10a1 1 0 0 0 0 2h8l-1.8 2.4a1 1 0 0 0 .2 1.4 1 1 0 0 0 .6.2 1 1 0 0 0 .8-.4l3-4a1 1 0 0 0 .02-1.18z\"/></g></g>","map":"<g data-name=\"Layer 2\"><g data-name=\"map\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M20.41 5.89l-4-1.8H15.59L12 5.7 8.41 4.09h-.05L8.24 4h-.6l-4 1.8a1 1 0 0 0-.64 1V19a1 1 0 0 0 .46.84A1 1 0 0 0 4 20a1 1 0 0 0 .41-.09L8 18.3l3.59 1.61h.05a.85.85 0 0 0 .72 0h.05L16 18.3l3.59 1.61A1 1 0 0 0 20 20a1 1 0 0 0 .54-.16A1 1 0 0 0 21 19V6.8a1 1 0 0 0-.59-.91zM9 6.55l2 .89v10l-2-.89zm10 10.9l-2-.89v-10l2 .89z\"/></g></g>","maximize":"<g data-name=\"Layer 2\"><g data-name=\"maximize\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.71 19.29l-3.4-3.39A7.92 7.92 0 0 0 19 11a8 8 0 1 0-8 8 7.92 7.92 0 0 0 4.9-1.69l3.39 3.4a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42zM13 12h-1v1a1 1 0 0 1-2 0v-1H9a1 1 0 0 1 0-2h1V9a1 1 0 0 1 2 0v1h1a1 1 0 0 1 0 2z\"/></g></g>","menu-2":"<g data-name=\"Layer 2\"><g data-name=\"menu-2\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><circle cx=\"4\" cy=\"12\" r=\"1\"/><rect x=\"7\" y=\"11\" width=\"14\" height=\"2\" rx=\".94\" ry=\".94\"/><rect x=\"3\" y=\"16\" width=\"18\" height=\"2\" rx=\".94\" ry=\".94\"/><rect x=\"3\" y=\"6\" width=\"18\" height=\"2\" rx=\".94\" ry=\".94\"/></g></g>","menu-arrow":"<g data-name=\"Layer 2\"><g data-name=\"menu-arrow\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M20.05 11H5.91l1.3-1.29a1 1 0 0 0-1.42-1.42l-3 3a1 1 0 0 0 0 1.42l3 3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42L5.91 13h14.14a1 1 0 0 0 .95-.95V12a1 1 0 0 0-.95-1z\"/><rect x=\"3\" y=\"17\" width=\"18\" height=\"2\" rx=\".95\" ry=\".95\"/><rect x=\"3\" y=\"5\" width=\"18\" height=\"2\" rx=\".95\" ry=\".95\"/></g></g>","menu":"<g data-name=\"Layer 2\"><g data-name=\"menu\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><rect x=\"3\" y=\"11\" width=\"18\" height=\"2\" rx=\".95\" ry=\".95\"/><rect x=\"3\" y=\"16\" width=\"18\" height=\"2\" rx=\".95\" ry=\".95\"/><rect x=\"3\" y=\"6\" width=\"18\" height=\"2\" rx=\".95\" ry=\".95\"/></g></g>","message-circle":"<g data-name=\"Layer 2\"><g data-name=\"message-circle\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19.07 4.93a10 10 0 0 0-16.28 11 1.06 1.06 0 0 1 .09.64L2 20.8a1 1 0 0 0 .27.91A1 1 0 0 0 3 22h.2l4.28-.86a1.26 1.26 0 0 1 .64.09 10 10 0 0 0 11-16.28zM8 13a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm4 0a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm4 0a1 1 0 1 1 1-1 1 1 0 0 1-1 1z\"/></g></g>","message-square":"<g data-name=\"Layer 2\"><g data-name=\"message-square\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19 3H5a3 3 0 0 0-3 3v15a1 1 0 0 0 .51.87A1 1 0 0 0 3 22a1 1 0 0 0 .51-.14L8 19.14a1 1 0 0 1 .55-.14H19a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zM8 12a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm4 0a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm4 0a1 1 0 1 1 1-1 1 1 0 0 1-1 1z\"/></g></g>","mic-off":"<g data-name=\"Layer 2\"><g data-name=\"mic-off\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M15.58 12.75A4 4 0 0 0 16 11V6a4 4 0 0 0-7.92-.75\"/><path d=\"M19 11a1 1 0 0 0-2 0 4.86 4.86 0 0 1-.69 2.48L17.78 15A7 7 0 0 0 19 11z\"/><path d=\"M12 15h.16L8 10.83V11a4 4 0 0 0 4 4z\"/><path d=\"M20.71 19.29l-16-16a1 1 0 0 0-1.42 1.42l16 16a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z\"/><path d=\"M15 20h-2v-2.08a7 7 0 0 0 1.65-.44l-1.6-1.6A4.57 4.57 0 0 1 12 16a5 5 0 0 1-5-5 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V20H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2z\"/></g></g>","mic":"<g data-name=\"Layer 2\"><g data-name=\"mic\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 15a4 4 0 0 0 4-4V6a4 4 0 0 0-8 0v5a4 4 0 0 0 4 4z\"/><path d=\"M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V20H8.89a.89.89 0 0 0-.89.89v.22a.89.89 0 0 0 .89.89h6.22a.89.89 0 0 0 .89-.89v-.22a.89.89 0 0 0-.89-.89H13v-2.08A7 7 0 0 0 19 11z\"/></g></g>","minimize":"<g data-name=\"Layer 2\"><g data-name=\"minimize\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.71 19.29l-3.4-3.39A7.92 7.92 0 0 0 19 11a8 8 0 1 0-8 8 7.92 7.92 0 0 0 4.9-1.69l3.39 3.4a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42zM13 12H9a1 1 0 0 1 0-2h4a1 1 0 0 1 0 2z\"/></g></g>","minus-circle":"<g data-name=\"Layer 2\"><g data-name=\"minus-circle\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm3 11H9a1 1 0 0 1 0-2h6a1 1 0 0 1 0 2z\"/></g></g>","minus-square":"<g data-name=\"Layer 2\"><g data-name=\"minus-square\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zm-3 10H9a1 1 0 0 1 0-2h6a1 1 0 0 1 0 2z\"/></g></g>","minus":"<g data-name=\"Layer 2\"><g data-name=\"minus\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M19 13H5a1 1 0 0 1 0-2h14a1 1 0 0 1 0 2z\"/></g></g>","monitor":"<g data-name=\"Layer 2\"><g data-name=\"monitor\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19 3H5a3 3 0 0 0-3 3v5h20V6a3 3 0 0 0-3-3z\"/><path d=\"M2 14a3 3 0 0 0 3 3h6v2H7a1 1 0 0 0 0 2h10a1 1 0 0 0 0-2h-4v-2h6a3 3 0 0 0 3-3v-1H2z\"/></g></g>","moon":"<g data-name=\"Layer 2\"><g data-name=\"moon\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12.3 22h-.1a10.31 10.31 0 0 1-7.34-3.15 10.46 10.46 0 0 1-.26-14 10.13 10.13 0 0 1 4-2.74 1 1 0 0 1 1.06.22 1 1 0 0 1 .24 1 8.4 8.4 0 0 0 1.94 8.81 8.47 8.47 0 0 0 8.83 1.94 1 1 0 0 1 1.27 1.29A10.16 10.16 0 0 1 19.6 19a10.28 10.28 0 0 1-7.3 3z\"/></g></g>","more-horizontal":"<g data-name=\"Layer 2\"><g data-name=\"more-horizotnal\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/><circle cx=\"19\" cy=\"12\" r=\"2\"/><circle cx=\"5\" cy=\"12\" r=\"2\"/></g></g>","more-vertical":"<g data-name=\"Layer 2\"><g data-name=\"more-vertical\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/><circle cx=\"12\" cy=\"5\" r=\"2\"/><circle cx=\"12\" cy=\"19\" r=\"2\"/></g></g>","move":"<g data-name=\"Layer 2\"><g data-name=\"move\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M21.71 11.31l-3-3a1 1 0 0 0-1.42 1.42L18.58 11H13V5.41l1.29 1.3A1 1 0 0 0 15 7a1 1 0 0 0 .71-.29 1 1 0 0 0 0-1.42l-3-3A1 1 0 0 0 12 2a1 1 0 0 0-.7.29l-3 3a1 1 0 0 0 1.41 1.42L11 5.42V11H5.41l1.3-1.29a1 1 0 0 0-1.42-1.42l-3 3A1 1 0 0 0 2 12a1 1 0 0 0 .29.71l3 3A1 1 0 0 0 6 16a1 1 0 0 0 .71-.29 1 1 0 0 0 0-1.42L5.42 13H11v5.59l-1.29-1.3a1 1 0 0 0-1.42 1.42l3 3A1 1 0 0 0 12 22a1 1 0 0 0 .7-.29l3-3a1 1 0 0 0-1.42-1.42L13 18.58V13h5.59l-1.3 1.29a1 1 0 0 0 0 1.42A1 1 0 0 0 18 16a1 1 0 0 0 .71-.29l3-3A1 1 0 0 0 22 12a1 1 0 0 0-.29-.69z\"/></g></g>","music":"<g data-name=\"Layer 2\"><g data-name=\"music\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19 15V4a1 1 0 0 0-.38-.78 1 1 0 0 0-.84-.2l-9 2A1 1 0 0 0 8 6v8.34a3.49 3.49 0 1 0 2 3.18 4.36 4.36 0 0 0 0-.52V6.8l7-1.55v7.09a3.49 3.49 0 1 0 2 3.17 4.57 4.57 0 0 0 0-.51z\"/></g></g>","navigation-2":"<g data-name=\"Layer 2\"><g data-name=\"navigation-2\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M13.67 22h-.06a1 1 0 0 1-.92-.8l-1.54-7.57a1 1 0 0 0-.78-.78L2.8 11.31a1 1 0 0 1-.12-1.93l16-5.33A1 1 0 0 1 20 5.32l-5.33 16a1 1 0 0 1-1 .68z\"/></g></g>","navigation":"<g data-name=\"Layer 2\"><g data-name=\"navigation\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20 20a.94.94 0 0 1-.55-.17l-6.9-4.56a1 1 0 0 0-1.1 0l-6.9 4.56a1 1 0 0 1-1.44-1.28l8-16a1 1 0 0 1 1.78 0l8 16a1 1 0 0 1-.23 1.2A1 1 0 0 1 20 20z\"/></g></g>","npm":"<g data-name=\"Layer 2\"><g data-name=\"npm\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h7V11h4v10h1a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3z\"/></g></g>","options-2":"<g data-name=\"Layer 2\"><g data-name=\"options-2\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M19 9a3 3 0 0 0-2.82 2H3a1 1 0 0 0 0 2h13.18A3 3 0 1 0 19 9z\"/><path d=\"M3 7h1.18a3 3 0 0 0 5.64 0H21a1 1 0 0 0 0-2H9.82a3 3 0 0 0-5.64 0H3a1 1 0 0 0 0 2z\"/><path d=\"M21 17h-7.18a3 3 0 0 0-5.64 0H3a1 1 0 0 0 0 2h5.18a3 3 0 0 0 5.64 0H21a1 1 0 0 0 0-2z\"/></g></g>","options":"<g data-name=\"Layer 2\"><g data-name=\"options\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M7 14.18V3a1 1 0 0 0-2 0v11.18a3 3 0 0 0 0 5.64V21a1 1 0 0 0 2 0v-1.18a3 3 0 0 0 0-5.64z\"/><path d=\"M21 13a3 3 0 0 0-2-2.82V3a1 1 0 0 0-2 0v7.18a3 3 0 0 0 0 5.64V21a1 1 0 0 0 2 0v-5.18A3 3 0 0 0 21 13z\"/><path d=\"M15 5a3 3 0 1 0-4 2.82V21a1 1 0 0 0 2 0V7.82A3 3 0 0 0 15 5z\"/></g></g>","pantone":"<g data-name=\"Layer 2\"><g data-name=\"pantone\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20 13.18h-2.7l-1.86 2L11.88 19l-1.41 1.52L10 21h10a1 1 0 0 0 1-1v-5.82a1 1 0 0 0-1-1z\"/><path d=\"M18.19 9.3l-4.14-3.86a.89.89 0 0 0-.71-.26 1 1 0 0 0-.7.31l-.82.89v10.71a5.23 5.23 0 0 1-.06.57l6.48-6.95a1 1 0 0 0-.05-1.41z\"/><path d=\"M10.82 4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v13.09a3.91 3.91 0 0 0 7.82 0zm-2 13.09a1.91 1.91 0 0 1-3.82 0V15h3.82zm0-4.09H5v-3h3.82zm0-5H5V5h3.82z\"/></g></g>","paper-plane":"<g data-name=\"Layer 2\"><g data-name=\"paper-plane\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21 4a1.31 1.31 0 0 0-.06-.27v-.09a1 1 0 0 0-.2-.3 1 1 0 0 0-.29-.19h-.09a.86.86 0 0 0-.31-.15H20a1 1 0 0 0-.3 0l-18 6a1 1 0 0 0 0 1.9l8.53 2.84 2.84 8.53a1 1 0 0 0 1.9 0l6-18A1 1 0 0 0 21 4zm-4.7 2.29l-5.57 5.57L5.16 10zM14 18.84l-1.86-5.57 5.57-5.57z\"/></g></g>","pause-circle":"<g data-name=\"Layer 2\"><g data-name=\"pause-circle\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-2 13a1 1 0 0 1-2 0V9a1 1 0 0 1 2 0zm6 0a1 1 0 0 1-2 0V9a1 1 0 0 1 2 0z\"/></g></g>","people":"<g data-name=\"Layer 2\"><g data-name=\"people\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M9 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4z\"/><path d=\"M17 13a3 3 0 1 0-3-3 3 3 0 0 0 3 3z\"/><path d=\"M21 20a1 1 0 0 0 1-1 5 5 0 0 0-8.06-3.95A7 7 0 0 0 2 20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1\"/></g></g>","percent":"<g data-name=\"Layer 2\"><g data-name=\"percent\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M8 11a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 8 11zm0-5a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 8 6z\"/><path d=\"M16 14a3.5 3.5 0 1 0 3.5 3.5A3.5 3.5 0 0 0 16 14zm0 5a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 16 19z\"/><path d=\"M19.74 4.26a.89.89 0 0 0-1.26 0L4.26 18.48a.91.91 0 0 0-.26.63.89.89 0 0 0 1.52.63L19.74 5.52a.89.89 0 0 0 0-1.26z\"/></g></g>","person-add":"<g data-name=\"Layer 2\"><g data-name=\"person-add\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21 6h-1V5a1 1 0 0 0-2 0v1h-1a1 1 0 0 0 0 2h1v1a1 1 0 0 0 2 0V8h1a1 1 0 0 0 0-2z\"/><path d=\"M10 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4z\"/><path d=\"M16 21a1 1 0 0 0 1-1 7 7 0 0 0-14 0 1 1 0 0 0 1 1\"/></g></g>","person-delete":"<g data-name=\"Layer 2\"><g data-name=\"person-delete\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.47 7.5l.73-.73a1 1 0 0 0-1.47-1.47L19 6l-.73-.73a1 1 0 0 0-1.47 1.5l.73.73-.73.73a1 1 0 0 0 1.47 1.47L19 9l.73.73a1 1 0 0 0 1.47-1.5z\"/><path d=\"M10 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4z\"/><path d=\"M16 21a1 1 0 0 0 1-1 7 7 0 0 0-14 0 1 1 0 0 0 1 1z\"/></g></g>","person-done":"<g data-name=\"Layer 2\"><g data-name=\"person-done\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21.66 4.25a1 1 0 0 0-1.41.09l-1.87 2.15-.63-.71a1 1 0 0 0-1.5 1.33l1.39 1.56a1 1 0 0 0 .75.33 1 1 0 0 0 .74-.34l2.61-3a1 1 0 0 0-.08-1.41z\"/><path d=\"M10 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4z\"/><path d=\"M16 21a1 1 0 0 0 1-1 7 7 0 0 0-14 0 1 1 0 0 0 1 1\"/></g></g>","person-remove":"<g data-name=\"Layer 2\"><g data-name=\"person-remove\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21 6h-4a1 1 0 0 0 0 2h4a1 1 0 0 0 0-2z\"/><path d=\"M10 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4z\"/><path d=\"M16 21a1 1 0 0 0 1-1 7 7 0 0 0-14 0 1 1 0 0 0 1 1\"/></g></g>","person":"<g data-name=\"Layer 2\"><g data-name=\"person\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4z\"/><path d=\"M18 21a1 1 0 0 0 1-1 7 7 0 0 0-14 0 1 1 0 0 0 1 1z\"/></g></g>","phone-call":"<g data-name=\"Layer 2\"><g data-name=\"phone-call\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M13 8a3 3 0 0 1 3 3 1 1 0 0 0 2 0 5 5 0 0 0-5-5 1 1 0 0 0 0 2z\"/><path d=\"M13 4a7 7 0 0 1 7 7 1 1 0 0 0 2 0 9 9 0 0 0-9-9 1 1 0 0 0 0 2z\"/><path d=\"M21.75 15.91a1 1 0 0 0-.72-.65l-6-1.37a1 1 0 0 0-.92.26c-.14.13-.15.14-.8 1.38a9.91 9.91 0 0 1-4.87-4.89C9.71 10 9.72 10 9.85 9.85a1 1 0 0 0 .26-.92L8.74 3a1 1 0 0 0-.65-.72 3.79 3.79 0 0 0-.72-.18A3.94 3.94 0 0 0 6.6 2 4.6 4.6 0 0 0 2 6.6 15.42 15.42 0 0 0 17.4 22a4.6 4.6 0 0 0 4.6-4.6 4.77 4.77 0 0 0-.06-.76 4.34 4.34 0 0 0-.19-.73z\"/></g></g>","phone-missed":"<g data-name=\"Layer 2\"><g data-name=\"phone-missed\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21.94 16.64a4.34 4.34 0 0 0-.19-.73 1 1 0 0 0-.72-.65l-6-1.37a1 1 0 0 0-.92.26c-.14.13-.15.14-.8 1.38a10 10 0 0 1-4.88-4.89C9.71 10 9.72 10 9.85 9.85a1 1 0 0 0 .26-.92L8.74 3a1 1 0 0 0-.65-.72 3.79 3.79 0 0 0-.72-.18A3.94 3.94 0 0 0 6.6 2 4.6 4.6 0 0 0 2 6.6 15.42 15.42 0 0 0 17.4 22a4.6 4.6 0 0 0 4.6-4.6 4.77 4.77 0 0 0-.06-.76z\"/><path d=\"M15.8 8.7a1.05 1.05 0 0 0 1.47 0L18 8l.73.73a1 1 0 0 0 1.47-1.5l-.73-.73.73-.73a1 1 0 0 0-1.47-1.47L18 5l-.73-.73a1 1 0 0 0-1.47 1.5l.73.73-.73.73a1.05 1.05 0 0 0 0 1.47z\"/></g></g>","phone-off":"<g data-name=\"Layer 2\"><g data-name=\"phone-off\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M9.27 12.06a10.37 10.37 0 0 1-.8-1.42C9.71 10 9.72 10 9.85 9.85a1 1 0 0 0 .26-.92L8.74 3a1 1 0 0 0-.65-.72 3.79 3.79 0 0 0-.72-.18A3.94 3.94 0 0 0 6.6 2 4.6 4.6 0 0 0 2 6.6a15.33 15.33 0 0 0 3.27 9.46z\"/><path d=\"M21.94 16.64a4.34 4.34 0 0 0-.19-.73 1 1 0 0 0-.72-.65l-6-1.37a1 1 0 0 0-.92.26c-.14.13-.15.14-.8 1.38a10.88 10.88 0 0 1-1.41-.8l-4 4A15.33 15.33 0 0 0 17.4 22a4.6 4.6 0 0 0 4.6-4.6 4.77 4.77 0 0 0-.06-.76z\"/><path d=\"M19.74 4.26a.89.89 0 0 0-1.26 0L4.26 18.48a.91.91 0 0 0-.26.63.89.89 0 0 0 1.52.63L19.74 5.52a.89.89 0 0 0 0-1.26z\"/></g></g>","phone":"<g data-name=\"Layer 2\"><g data-name=\"phone\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M17.4 22A15.42 15.42 0 0 1 2 6.6 4.6 4.6 0 0 1 6.6 2a3.94 3.94 0 0 1 .77.07 3.79 3.79 0 0 1 .72.18 1 1 0 0 1 .65.75l1.37 6a1 1 0 0 1-.26.92c-.13.14-.14.15-1.37.79a9.91 9.91 0 0 0 4.87 4.89c.65-1.24.66-1.25.8-1.38a1 1 0 0 1 .92-.26l6 1.37a1 1 0 0 1 .72.65 4.34 4.34 0 0 1 .19.73 4.77 4.77 0 0 1 .06.76A4.6 4.6 0 0 1 17.4 22z\"/></g></g>","pie-chart-2":"<g data-name=\"Layer 2\"><g data-name=\"pie-chart-2\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M14.5 10.33h6.67A.83.83 0 0 0 22 9.5 7.5 7.5 0 0 0 14.5 2a.83.83 0 0 0-.83.83V9.5a.83.83 0 0 0 .83.83zm.83-6.6a5.83 5.83 0 0 1 4.94 4.94h-4.94z\"/><path d=\"M21.08 12h-8.15a.91.91 0 0 1-.91-.91V2.92A.92.92 0 0 0 11 2a10 10 0 1 0 11 11 .92.92 0 0 0-.92-1z\"/></g></g>","pie-chart":"<g data-name=\"Layer 2\"><g data-name=\"pie-chart\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M14.5 10.33h6.67A.83.83 0 0 0 22 9.5 7.5 7.5 0 0 0 14.5 2a.83.83 0 0 0-.83.83V9.5a.83.83 0 0 0 .83.83z\"/><path d=\"M21.08 12h-8.15a.91.91 0 0 1-.91-.91V2.92A.92.92 0 0 0 11 2a10 10 0 1 0 11 11 .92.92 0 0 0-.92-1z\"/></g></g>","pin":"<g data-name=\"Layer 2\"><g data-name=\"pin\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><circle cx=\"12\" cy=\"9.5\" r=\"1.5\"/><path d=\"M12 2a8 8 0 0 0-8 7.92c0 5.48 7.05 11.58 7.35 11.84a1 1 0 0 0 1.3 0C13 21.5 20 15.4 20 9.92A8 8 0 0 0 12 2zm0 11a3.5 3.5 0 1 1 3.5-3.5A3.5 3.5 0 0 1 12 13z\"/></g></g>","play-circle":"<g data-name=\"Layer 2\"><g data-name=\"play-circle\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><polygon points=\"11.5 14.6 14.31 12 11.5 9.4 11.5 14.6\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm4 11.18l-3.64 3.37a1.74 1.74 0 0 1-1.16.45 1.68 1.68 0 0 1-.69-.15 1.6 1.6 0 0 1-1-1.48V8.63a1.6 1.6 0 0 1 1-1.48 1.7 1.7 0 0 1 1.85.3L16 10.82a1.6 1.6 0 0 1 0 2.36z\"/></g></g>","plus-circle":"<g data-name=\"Layer 2\"><g data-name=\"plus-circle\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm3 11h-2v2a1 1 0 0 1-2 0v-2H9a1 1 0 0 1 0-2h2V9a1 1 0 0 1 2 0v2h2a1 1 0 0 1 0 2z\"/></g></g>","plus-square":"<g data-name=\"Layer 2\"><g data-name=\"plus-square\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zm-3 10h-2v2a1 1 0 0 1-2 0v-2H9a1 1 0 0 1 0-2h2V9a1 1 0 0 1 2 0v2h2a1 1 0 0 1 0 2z\"/></g></g>","plus":"<g data-name=\"Layer 2\"><g data-name=\"plus\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M19 11h-6V5a1 1 0 0 0-2 0v6H5a1 1 0 0 0 0 2h6v6a1 1 0 0 0 2 0v-6h6a1 1 0 0 0 0-2z\"/></g></g>","power":"<g data-name=\"Layer 2\"><g data-name=\"power\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 13a1 1 0 0 0 1-1V2a1 1 0 0 0-2 0v10a1 1 0 0 0 1 1z\"/><path d=\"M16.59 3.11a1 1 0 0 0-.92 1.78 8 8 0 1 1-7.34 0 1 1 0 1 0-.92-1.78 10 10 0 1 0 9.18 0z\"/></g></g>","pricetags":"<g data-name=\"Layer 2\"><g data-name=\"pricetags\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21.47 11.58l-6.42-6.41a1 1 0 0 0-.61-.29L5.09 4a1 1 0 0 0-.8.29 1 1 0 0 0-.29.8l.88 9.35a1 1 0 0 0 .29.61l6.41 6.42a1.84 1.84 0 0 0 1.29.53 1.82 1.82 0 0 0 1.28-.53l7.32-7.32a1.82 1.82 0 0 0 0-2.57zm-9.91 0a1.5 1.5 0 1 1 0-2.12 1.49 1.49 0 0 1 0 2.1z\"/></g></g>","printer":"<g data-name=\"Layer 2\"><g data-name=\"printer\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19.36 7H18V5a1.92 1.92 0 0 0-1.83-2H7.83A1.92 1.92 0 0 0 6 5v2H4.64A2.66 2.66 0 0 0 2 9.67v6.66A2.66 2.66 0 0 0 4.64 19h.86a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2h.86A2.66 2.66 0 0 0 22 16.33V9.67A2.66 2.66 0 0 0 19.36 7zM8 5h8v2H8zm-.5 14v-4h9v4z\"/></g></g>","question-mark-circle":"<g data-name=\"Layer 2\"><g data-name=\"menu-arrow-circle\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 16a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm1-5.16V14a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1 1.5 1.5 0 1 0-1.5-1.5 1 1 0 0 1-2 0 3.5 3.5 0 1 1 4.5 3.34z\"/></g></g>","question-mark":"<g data-name=\"Layer 2\"><g data-name=\"menu-arrow\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M17 9A5 5 0 0 0 7 9a1 1 0 0 0 2 0 3 3 0 1 1 3 3 1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-1.1A5 5 0 0 0 17 9z\"/><circle cx=\"12\" cy=\"19\" r=\"1\"/></g></g>","radio-button-off":"<g data-name=\"Layer 2\"><g data-name=\"radio-button-off\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 22a10 10 0 1 1 10-10 10 10 0 0 1-10 10zm0-18a8 8 0 1 0 8 8 8 8 0 0 0-8-8z\"/></g></g>","radio-button-on":"<g data-name=\"Layer 2\"><g data-name=\"radio-button-on\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z\"/><path d=\"M12 7a5 5 0 1 0 5 5 5 5 0 0 0-5-5z\"/></g></g>","radio":"<g data-name=\"Layer 2\"><g data-name=\"radio\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 8a3 3 0 0 0-1 5.83 1 1 0 0 0 0 .17v6a1 1 0 0 0 2 0v-6a1 1 0 0 0 0-.17A3 3 0 0 0 12 8z\"/><path d=\"M3.5 11a6.87 6.87 0 0 1 2.64-5.23 1 1 0 1 0-1.28-1.54A8.84 8.84 0 0 0 1.5 11a8.84 8.84 0 0 0 3.36 6.77 1 1 0 1 0 1.28-1.54A6.87 6.87 0 0 1 3.5 11z\"/><path d=\"M16.64 6.24a1 1 0 0 0-1.28 1.52A4.28 4.28 0 0 1 17 11a4.28 4.28 0 0 1-1.64 3.24A1 1 0 0 0 16 16a1 1 0 0 0 .64-.24A6.2 6.2 0 0 0 19 11a6.2 6.2 0 0 0-2.36-4.76z\"/><path d=\"M8.76 6.36a1 1 0 0 0-1.4-.12A6.2 6.2 0 0 0 5 11a6.2 6.2 0 0 0 2.36 4.76 1 1 0 0 0 1.4-.12 1 1 0 0 0-.12-1.4A4.28 4.28 0 0 1 7 11a4.28 4.28 0 0 1 1.64-3.24 1 1 0 0 0 .12-1.4z\"/><path d=\"M19.14 4.23a1 1 0 1 0-1.28 1.54A6.87 6.87 0 0 1 20.5 11a6.87 6.87 0 0 1-2.64 5.23 1 1 0 0 0 1.28 1.54A8.84 8.84 0 0 0 22.5 11a8.84 8.84 0 0 0-3.36-6.77z\"/></g></g>","recording":"<g data-name=\"Layer 2\"><g data-name=\"recording\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 8a4 4 0 0 0-4 4 3.91 3.91 0 0 0 .56 2H9.44a3.91 3.91 0 0 0 .56-2 4 4 0 1 0-4 4h12a4 4 0 0 0 0-8z\"/></g></g>","refresh":"<g data-name=\"Layer 2\"><g data-name=\"refresh\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.3 13.43a1 1 0 0 0-1.25.65A7.14 7.14 0 0 1 12.18 19 7.1 7.1 0 0 1 5 12a7.1 7.1 0 0 1 7.18-7 7.26 7.26 0 0 1 4.65 1.67l-2.17-.36a1 1 0 0 0-1.15.83 1 1 0 0 0 .83 1.15l4.24.7h.17a1 1 0 0 0 .34-.06.33.33 0 0 0 .1-.06.78.78 0 0 0 .2-.11l.09-.11c0-.05.09-.09.13-.15s0-.1.05-.14a1.34 1.34 0 0 0 .07-.18l.75-4a1 1 0 0 0-2-.38l-.27 1.45A9.21 9.21 0 0 0 12.18 3 9.1 9.1 0 0 0 3 12a9.1 9.1 0 0 0 9.18 9A9.12 9.12 0 0 0 21 14.68a1 1 0 0 0-.7-1.25z\"/></g></g>","repeat":"<g data-name=\"Layer 2\"><g data-name=\"repeat\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M17.91 5h-12l1.3-1.29a1 1 0 0 0-1.42-1.42l-3 3a1 1 0 0 0 0 1.42l3 3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42L5.91 7h12a1.56 1.56 0 0 1 1.59 1.53V11a1 1 0 0 0 2 0V8.53A3.56 3.56 0 0 0 17.91 5z\"/><path d=\"M18.21 14.29a1 1 0 0 0-1.42 1.42l1.3 1.29h-12a1.56 1.56 0 0 1-1.59-1.53V13a1 1 0 0 0-2 0v2.47A3.56 3.56 0 0 0 6.09 19h12l-1.3 1.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l3-3a1 1 0 0 0 0-1.42z\"/></g></g>","rewind-left":"<g data-name=\"Layer 2\"><g data-name=\"rewind-left\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M18.45 6.2a2.1 2.1 0 0 0-2.21.26l-4.74 3.92V7.79a1.76 1.76 0 0 0-1.05-1.59 2.1 2.1 0 0 0-2.21.26l-5.1 4.21a1.7 1.7 0 0 0 0 2.66l5.1 4.21a2.06 2.06 0 0 0 1.3.46 2.23 2.23 0 0 0 .91-.2 1.76 1.76 0 0 0 1.05-1.59v-2.59l4.74 3.92a2.06 2.06 0 0 0 1.3.46 2.23 2.23 0 0 0 .91-.2 1.76 1.76 0 0 0 1.05-1.59V7.79a1.76 1.76 0 0 0-1.05-1.59z\"/></g></g>","rewind-right":"<g data-name=\"Layer 2\"><g data-name=\"rewind-right\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.86 10.67l-5.1-4.21a2.1 2.1 0 0 0-2.21-.26 1.76 1.76 0 0 0-1.05 1.59v2.59L7.76 6.46a2.1 2.1 0 0 0-2.21-.26 1.76 1.76 0 0 0-1 1.59v8.42a1.76 1.76 0 0 0 1 1.59 2.23 2.23 0 0 0 .91.2 2.06 2.06 0 0 0 1.3-.46l4.74-3.92v2.59a1.76 1.76 0 0 0 1.05 1.59 2.23 2.23 0 0 0 .91.2 2.06 2.06 0 0 0 1.3-.46l5.1-4.21a1.7 1.7 0 0 0 0-2.66z\"/></g></g>","save":"<g data-name=\"Layer 2\"><g data-name=\"save\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><rect x=\"10\" y=\"17\" width=\"4\" height=\"4\"/><path d=\"M20.12 8.71l-4.83-4.83A3 3 0 0 0 13.17 3H10v6h5a1 1 0 0 1 0 2H9a1 1 0 0 1-1-1V3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h2v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4h2a3 3 0 0 0 3-3v-7.17a3 3 0 0 0-.88-2.12z\"/></g></g>","scissors":"<g data-name=\"Layer 2\"><g data-name=\"scissors\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.21 5.71a1 1 0 1 0-1.42-1.42l-6.28 6.31-3.3-3.31A3 3 0 0 0 9.5 6a3 3 0 1 0-3 3 3 3 0 0 0 1.29-.3L11.1 12l-3.29 3.3A3 3 0 0 0 6.5 15a3 3 0 1 0 3 3 3 3 0 0 0-.29-1.26zM6.5 7a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm0 12a1 1 0 1 1 1-1 1 1 0 0 1-1 1z\"/><path d=\"M15.21 13.29a1 1 0 0 0-1.42 1.42l5 5a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z\"/></g></g>","search":"<g data-name=\"Layer 2\"><g data-name=\"search\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.71 19.29l-3.4-3.39A7.92 7.92 0 0 0 19 11a8 8 0 1 0-8 8 7.92 7.92 0 0 0 4.9-1.69l3.39 3.4a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42zM5 11a6 6 0 1 1 6 6 6 6 0 0 1-6-6z\"/></g></g>","settings-2":"<g data-name=\"Layer 2\"><g data-name=\"settings-2\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><circle cx=\"12\" cy=\"12\" r=\"1.5\"/><path d=\"M20.32 9.37h-1.09c-.14 0-.24-.11-.3-.26a.34.34 0 0 1 0-.37l.81-.74a1.63 1.63 0 0 0 .5-1.18 1.67 1.67 0 0 0-.5-1.19L18.4 4.26a1.67 1.67 0 0 0-2.37 0l-.77.74a.38.38 0 0 1-.41 0 .34.34 0 0 1-.22-.29V3.68A1.68 1.68 0 0 0 13 2h-1.94a1.69 1.69 0 0 0-1.69 1.68v1.09c0 .14-.11.24-.26.3a.34.34 0 0 1-.37 0L8 4.26a1.72 1.72 0 0 0-1.19-.5 1.65 1.65 0 0 0-1.18.5L4.26 5.6a1.67 1.67 0 0 0 0 2.4l.74.74a.38.38 0 0 1 0 .41.34.34 0 0 1-.29.22H3.68A1.68 1.68 0 0 0 2 11.05v1.89a1.69 1.69 0 0 0 1.68 1.69h1.09c.14 0 .24.11.3.26a.34.34 0 0 1 0 .37l-.81.74a1.72 1.72 0 0 0-.5 1.19 1.66 1.66 0 0 0 .5 1.19l1.34 1.36a1.67 1.67 0 0 0 2.37 0l.77-.74a.38.38 0 0 1 .41 0 .34.34 0 0 1 .22.29v1.09A1.68 1.68 0 0 0 11.05 22h1.89a1.69 1.69 0 0 0 1.69-1.68v-1.09c0-.14.11-.24.26-.3a.34.34 0 0 1 .37 0l.76.77a1.72 1.72 0 0 0 1.19.5 1.65 1.65 0 0 0 1.18-.5l1.34-1.34a1.67 1.67 0 0 0 0-2.37l-.73-.73a.34.34 0 0 1 0-.37.34.34 0 0 1 .29-.22h1.09A1.68 1.68 0 0 0 22 13v-1.94a1.69 1.69 0 0 0-1.68-1.69zM12 15.5a3.5 3.5 0 1 1 3.5-3.5 3.5 3.5 0 0 1-3.5 3.5z\"/></g></g>","settings":"<g data-name=\"Layer 2\"><g data-name=\"settings\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><circle cx=\"12\" cy=\"12\" r=\"1.5\"/><path d=\"M21.89 10.32L21.1 7.8a2.26 2.26 0 0 0-2.88-1.51l-.34.11a1.74 1.74 0 0 1-1.59-.26l-.11-.08a1.76 1.76 0 0 1-.69-1.43v-.28a2.37 2.37 0 0 0-.68-1.68 2.26 2.26 0 0 0-1.6-.67h-2.55a2.32 2.32 0 0 0-2.29 2.33v.24a1.94 1.94 0 0 1-.73 1.51l-.13.1a1.93 1.93 0 0 1-1.78.29 2.14 2.14 0 0 0-1.68.12 2.18 2.18 0 0 0-1.12 1.33l-.82 2.6a2.34 2.34 0 0 0 1.48 2.94h.16a1.83 1.83 0 0 1 1.12 1.22l.06.16a2.06 2.06 0 0 1-.23 1.86 2.37 2.37 0 0 0 .49 3.3l2.07 1.57a2.25 2.25 0 0 0 1.35.43A2 2 0 0 0 9 22a2.25 2.25 0 0 0 1.47-1l.23-.33a1.8 1.8 0 0 1 1.43-.77 1.75 1.75 0 0 1 1.5.78l.12.17a2.24 2.24 0 0 0 3.22.53L19 19.86a2.38 2.38 0 0 0 .5-3.23l-.26-.38A2 2 0 0 1 19 14.6a1.89 1.89 0 0 1 1.21-1.28l.2-.07a2.36 2.36 0 0 0 1.48-2.93zM12 15.5a3.5 3.5 0 1 1 3.5-3.5 3.5 3.5 0 0 1-3.5 3.5z\"/></g></g>","shake":"<g data-name=\"Layer 2\"><g data-name=\"shake\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M5.5 18a1 1 0 0 1-.64-.24A8.81 8.81 0 0 1 1.5 11a8.81 8.81 0 0 1 3.36-6.76 1 1 0 1 1 1.28 1.52A6.9 6.9 0 0 0 3.5 11a6.9 6.9 0 0 0 2.64 5.24 1 1 0 0 1 .13 1.4 1 1 0 0 1-.77.36z\"/><path d=\"M12 7a4.09 4.09 0 0 1 1 .14V3a1 1 0 0 0-2 0v4.14A4.09 4.09 0 0 1 12 7z\"/><path d=\"M12 15a4.09 4.09 0 0 1-1-.14V20a1 1 0 0 0 2 0v-5.14a4.09 4.09 0 0 1-1 .14z\"/><path d=\"M16 16a1 1 0 0 1-.77-.36 1 1 0 0 1 .13-1.4A4.28 4.28 0 0 0 17 11a4.28 4.28 0 0 0-1.64-3.24 1 1 0 1 1 1.28-1.52A6.2 6.2 0 0 1 19 11a6.2 6.2 0 0 1-2.36 4.76A1 1 0 0 1 16 16z\"/><path d=\"M8 16a1 1 0 0 1-.64-.24A6.2 6.2 0 0 1 5 11a6.2 6.2 0 0 1 2.36-4.76 1 1 0 1 1 1.28 1.52A4.28 4.28 0 0 0 7 11a4.28 4.28 0 0 0 1.64 3.24 1 1 0 0 1 .13 1.4A1 1 0 0 1 8 16z\"/><path d=\"M18.5 18a1 1 0 0 1-.77-.36 1 1 0 0 1 .13-1.4A6.9 6.9 0 0 0 20.5 11a6.9 6.9 0 0 0-2.64-5.24 1 1 0 1 1 1.28-1.52A8.81 8.81 0 0 1 22.5 11a8.81 8.81 0 0 1-3.36 6.76 1 1 0 0 1-.64.24z\"/><path d=\"M12 12a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm0-1zm0 0zm0 0zm0 0zm0 0zm0 0zm0 0z\"/></g></g>","share":"<g data-name=\"Layer 2\"><g data-name=\"share\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 15a3 3 0 0 0-2.1.86L8 12.34V12v-.33l7.9-3.53A3 3 0 1 0 15 6v.34L7.1 9.86a3 3 0 1 0 0 4.28l7.9 3.53V18a3 3 0 1 0 3-3z\"/></g></g>","shield-off":"<g data-name=\"Layer 2\"><g data-name=\"shield-off\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M3.73 6.56A2 2 0 0 0 3 8.09v.14a15.17 15.17 0 0 0 7.72 13.2l.3.17a2 2 0 0 0 2 0l.3-.17a15.22 15.22 0 0 0 3-2.27z\"/><path d=\"M18.84 16A15.08 15.08 0 0 0 21 8.23v-.14a2 2 0 0 0-1-1.75L13 2.4a2 2 0 0 0-2 0L7.32 4.49z\"/><path d=\"M4.71 3.29a1 1 0 0 0-1.42 1.42l16 16a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z\"/></g></g>","shield":"<g data-name=\"Layer 2\"><g data-name=\"shield\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 21.85a2 2 0 0 1-1-.25l-.3-.17A15.17 15.17 0 0 1 3 8.23v-.14a2 2 0 0 1 1-1.75l7-3.94a2 2 0 0 1 2 0l7 3.94a2 2 0 0 1 1 1.75v.14a15.17 15.17 0 0 1-7.72 13.2l-.3.17a2 2 0 0 1-.98.25z\"/></g></g>","shopping-bag":"<g data-name=\"Layer 2\"><g data-name=\"shopping-bag\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.12 6.71l-2.83-2.83A3 3 0 0 0 15.17 3H8.83a3 3 0 0 0-2.12.88L3.88 6.71A3 3 0 0 0 3 8.83V18a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8.83a3 3 0 0 0-.88-2.12zM12 16a4 4 0 0 1-4-4 1 1 0 0 1 2 0 2 2 0 0 0 4 0 1 1 0 0 1 2 0 4 4 0 0 1-4 4zM6.41 7l1.71-1.71A1.05 1.05 0 0 1 8.83 5h6.34a1.05 1.05 0 0 1 .71.29L17.59 7z\"/></g></g>","shopping-cart":"<g data-name=\"Layer 2\"><g data-name=\"shopping-cart\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21.08 7a2 2 0 0 0-1.7-1H6.58L6 3.74A1 1 0 0 0 5 3H3a1 1 0 0 0 0 2h1.24L7 15.26A1 1 0 0 0 8 16h9a1 1 0 0 0 .89-.55l3.28-6.56A2 2 0 0 0 21.08 7z\"/><circle cx=\"7.5\" cy=\"19.5\" r=\"1.5\"/><circle cx=\"17.5\" cy=\"19.5\" r=\"1.5\"/></g></g>","shuffle-2":"<g data-name=\"Layer 2\"><g data-name=\"shuffle-2\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M18.71 14.29a1 1 0 0 0-1.42 1.42l.29.29H16a4 4 0 0 1 0-8h1.59l-.3.29a1 1 0 0 0 0 1.42A1 1 0 0 0 18 10a1 1 0 0 0 .71-.29l2-2A1 1 0 0 0 21 7a1 1 0 0 0-.29-.71l-2-2a1 1 0 0 0-1.42 1.42l.29.29H16a6 6 0 0 0-5 2.69A6 6 0 0 0 6 6H4a1 1 0 0 0 0 2h2a4 4 0 0 1 0 8H4a1 1 0 0 0 0 2h2a6 6 0 0 0 5-2.69A6 6 0 0 0 16 18h1.59l-.3.29a1 1 0 0 0 0 1.42A1 1 0 0 0 18 20a1 1 0 0 0 .71-.29l2-2A1 1 0 0 0 21 17a1 1 0 0 0-.29-.71z\"/></g></g>","shuffle":"<g data-name=\"Layer 2\"><g data-name=\"shuffle\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M18 9.31a1 1 0 0 0 1 1 1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-4.3a1 1 0 0 0-1 1 1 1 0 0 0 1 1h1.89L12 10.59 6.16 4.76a1 1 0 0 0-1.41 1.41L10.58 12l-6.29 6.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0L18 7.42z\"/><path d=\"M19 13.68a1 1 0 0 0-1 1v1.91l-2.78-2.79a1 1 0 0 0-1.42 1.42L16.57 18h-1.88a1 1 0 0 0 0 2H19a1 1 0 0 0 1-1.11v-4.21a1 1 0 0 0-1-1z\"/></g></g>","skip-back":"<g data-name=\"Layer 2\"><g data-name=\"skip-back\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M16.45 6.2a2.1 2.1 0 0 0-2.21.26l-5.1 4.21-.14.15V7a1 1 0 0 0-2 0v10a1 1 0 0 0 2 0v-3.82l.14.15 5.1 4.21a2.06 2.06 0 0 0 1.3.46 2.23 2.23 0 0 0 .91-.2 1.76 1.76 0 0 0 1.05-1.59V7.79a1.76 1.76 0 0 0-1.05-1.59z\"/></g></g>","skip-forward":"<g data-name=\"Layer 2\"><g data-name=\"skip-forward\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M16 6a1 1 0 0 0-1 1v3.82l-.14-.15-5.1-4.21a2.1 2.1 0 0 0-2.21-.26 1.76 1.76 0 0 0-1 1.59v8.42a1.76 1.76 0 0 0 1 1.59 2.23 2.23 0 0 0 .91.2 2.06 2.06 0 0 0 1.3-.46l5.1-4.21.14-.15V17a1 1 0 0 0 2 0V7a1 1 0 0 0-1-1z\"/></g></g>","slash":"<g data-name=\"Layer 2\"><g data-name=\"slash\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm8 10a7.92 7.92 0 0 1-1.69 4.9L7.1 5.69A7.92 7.92 0 0 1 12 4a8 8 0 0 1 8 8zM4 12a7.92 7.92 0 0 1 1.69-4.9L16.9 18.31A7.92 7.92 0 0 1 12 20a8 8 0 0 1-8-8z\"/></g></g>","smartphone":"<g data-name=\"Layer 2\"><g data-name=\"smartphone\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M17 2H7a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3zm-5 16a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 12 18zm2.5-10h-5a1 1 0 0 1 0-2h5a1 1 0 0 1 0 2z\"/></g></g>","smiling-face":"<defs><style/></defs><g id=\"Layer_2\" data-name=\"Layer 2\"><g id=\"smiling-face\"><g id=\"smiling-face\" data-name=\"smiling-face\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm5 9a5 5 0 0 1-10 0z\" id=\"&#x1F3A8;-Icon-&#x421;olor\"/></g></g></g>","speaker":"<g data-name=\"Layer 2\"><g data-name=\"speaker\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><circle cx=\"12\" cy=\"15.5\" r=\"1.5\"/><circle cx=\"12\" cy=\"8\" r=\"1\"/><path d=\"M17 2H7a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3zm-5 3a3 3 0 1 1-3 3 3 3 0 0 1 3-3zm0 14a3.5 3.5 0 1 1 3.5-3.5A3.5 3.5 0 0 1 12 19z\"/></g></g>","square":"<g data-name=\"Layer 2\"><g data-name=\"square\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 21H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3zM6 5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z\"/></g></g>","star":"<g data-name=\"Layer 2\"><g data-name=\"star\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M17.56 21a1 1 0 0 1-.46-.11L12 18.22l-5.1 2.67a1 1 0 0 1-1.45-1.06l1-5.63-4.12-4a1 1 0 0 1-.25-1 1 1 0 0 1 .81-.68l5.7-.83 2.51-5.13a1 1 0 0 1 1.8 0l2.54 5.12 5.7.83a1 1 0 0 1 .81.68 1 1 0 0 1-.25 1l-4.12 4 1 5.63a1 1 0 0 1-.4 1 1 1 0 0 1-.62.18z\"/></g></g>","stop-circle":"<g data-name=\"Layer 2\"><g data-name=\"stop-circle\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm4 12.75A1.25 1.25 0 0 1 14.75 16h-5.5A1.25 1.25 0 0 1 8 14.75v-5.5A1.25 1.25 0 0 1 9.25 8h5.5A1.25 1.25 0 0 1 16 9.25z\"/><rect x=\"10\" y=\"10\" width=\"4\" height=\"4\"/></g></g>","sun":"<g data-name=\"Layer 2\"><g data-name=\"sun\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M12 6a1 1 0 0 0 1-1V3a1 1 0 0 0-2 0v2a1 1 0 0 0 1 1z\"/><path d=\"M21 11h-2a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2z\"/><path d=\"M6 12a1 1 0 0 0-1-1H3a1 1 0 0 0 0 2h2a1 1 0 0 0 1-1z\"/><path d=\"M6.22 5a1 1 0 0 0-1.39 1.47l1.44 1.39a1 1 0 0 0 .73.28 1 1 0 0 0 .72-.31 1 1 0 0 0 0-1.41z\"/><path d=\"M17 8.14a1 1 0 0 0 .69-.28l1.44-1.39A1 1 0 0 0 17.78 5l-1.44 1.42a1 1 0 0 0 0 1.41 1 1 0 0 0 .66.31z\"/><path d=\"M12 18a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1z\"/><path d=\"M17.73 16.14a1 1 0 0 0-1.39 1.44L17.78 19a1 1 0 0 0 .69.28 1 1 0 0 0 .72-.3 1 1 0 0 0 0-1.42z\"/><path d=\"M6.27 16.14l-1.44 1.39a1 1 0 0 0 0 1.42 1 1 0 0 0 .72.3 1 1 0 0 0 .67-.25l1.44-1.39a1 1 0 0 0-1.39-1.44z\"/><path d=\"M12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4z\"/></g></g>","swap":"<g data-name=\"Layer 2\"><g data-name=\"swap\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M4 9h13l-1.6 1.2a1 1 0 0 0-.2 1.4 1 1 0 0 0 .8.4 1 1 0 0 0 .6-.2l4-3a1 1 0 0 0 0-1.59l-3.86-3a1 1 0 0 0-1.23 1.58L17.08 7H4a1 1 0 0 0 0 2z\"/><path d=\"M20 16H7l1.6-1.2a1 1 0 0 0-1.2-1.6l-4 3a1 1 0 0 0 0 1.59l3.86 3a1 1 0 0 0 .61.21 1 1 0 0 0 .79-.39 1 1 0 0 0-.17-1.4L6.92 18H20a1 1 0 0 0 0-2z\"/></g></g>","sync":"<g data-name=\"Layer 2\"><g data-name=\"sync\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21.66 10.37a.62.62 0 0 0 .07-.19l.75-4a1 1 0 0 0-2-.36l-.37 2a9.22 9.22 0 0 0-16.58.84 1 1 0 0 0 .55 1.3 1 1 0 0 0 1.31-.55A7.08 7.08 0 0 1 12.07 5a7.17 7.17 0 0 1 6.24 3.58l-1.65-.27a1 1 0 1 0-.32 2l4.25.71h.16a.93.93 0 0 0 .34-.06.33.33 0 0 0 .1-.06.78.78 0 0 0 .2-.11l.08-.1a1.07 1.07 0 0 0 .14-.16.58.58 0 0 0 .05-.16z\"/><path d=\"M19.88 14.07a1 1 0 0 0-1.31.56A7.08 7.08 0 0 1 11.93 19a7.17 7.17 0 0 1-6.24-3.58l1.65.27h.16a1 1 0 0 0 .16-2L3.41 13a.91.91 0 0 0-.33 0H3a1.15 1.15 0 0 0-.32.14 1 1 0 0 0-.18.18l-.09.1a.84.84 0 0 0-.07.19.44.44 0 0 0-.07.17l-.75 4a1 1 0 0 0 .8 1.22h.18a1 1 0 0 0 1-.82l.37-2a9.22 9.22 0 0 0 16.58-.83 1 1 0 0 0-.57-1.28z\"/></g></g>","text":"<g data-name=\"Layer 2\"><g data-name=\"text\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20 4H4a1 1 0 0 0-1 1v3a1 1 0 0 0 2 0V6h6v13H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2V6h6v2a1 1 0 0 0 2 0V5a1 1 0 0 0-1-1z\"/></g></g>","thermometer-minus":"<g data-name=\"Layer 2\"><g data-name=\"thermometer-minus\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><rect x=\"2\" y=\"5\" width=\"6\" height=\"2\" rx=\"1\" ry=\"1\"/><path d=\"M14 22a5 5 0 0 1-3-9V5a3 3 0 0 1 3-3 3 3 0 0 1 3 3v8a5 5 0 0 1-3 9zm1-12.46V5a.93.93 0 0 0-.29-.69A1 1 0 0 0 14 4a1 1 0 0 0-1 1v4.54z\"/></g></g>","thermometer-plus":"<g data-name=\"Layer 2\"><g data-name=\"thermometer-plus\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><rect x=\"2\" y=\"5\" width=\"6\" height=\"2\" rx=\"1\" ry=\"1\"/><rect x=\"2\" y=\"5\" width=\"6\" height=\"2\" rx=\"1\" ry=\"1\" transform=\"rotate(-90 5 6)\"/><path d=\"M14 22a5 5 0 0 1-3-9V5a3 3 0 0 1 3-3 3 3 0 0 1 3 3v8a5 5 0 0 1-3 9zm1-12.46V5a.93.93 0 0 0-.29-.69A1 1 0 0 0 14 4a1 1 0 0 0-1 1v4.54z\"/></g></g>","thermometer":"<g data-name=\"Layer 2\"><g data-name=\"thermometer\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 22a5 5 0 0 1-3-9V5a3 3 0 0 1 3-3 3 3 0 0 1 3 3v8a5 5 0 0 1-3 9zm1-12.46V5a.93.93 0 0 0-.29-.69A1 1 0 0 0 12 4a1 1 0 0 0-1 1v4.54z\"/></g></g>","toggle-left":"<g data-name=\"Layer 2\"><g data-name=\"toggle-left\"><rect x=\".02\" y=\".02\" width=\"23.97\" height=\"23.97\" transform=\"rotate(179.92 12.002 11.998)\" opacity=\"0\"/><path d=\"M15 5H9a7 7 0 0 0 0 14h6a7 7 0 0 0 0-14zM9 15a3 3 0 1 1 3-3 3 3 0 0 1-3 3z\"/><path d=\"M9 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z\"/></g></g>","toggle-right":"<g data-name=\"Layer 2\"><g data-name=\"toggle-right\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><circle cx=\"15\" cy=\"12\" r=\"1\"/><path d=\"M15 5H9a7 7 0 0 0 0 14h6a7 7 0 0 0 0-14zm0 10a3 3 0 1 1 3-3 3 3 0 0 1-3 3z\"/></g></g>","trash-2":"<g data-name=\"Layer 2\"><g data-name=\"trash-2\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21 6h-5V4.33A2.42 2.42 0 0 0 13.5 2h-3A2.42 2.42 0 0 0 8 4.33V6H3a1 1 0 0 0 0 2h1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8h1a1 1 0 0 0 0-2zM10 16a1 1 0 0 1-2 0v-4a1 1 0 0 1 2 0zm0-11.67c0-.16.21-.33.5-.33h3c.29 0 .5.17.5.33V6h-4zM16 16a1 1 0 0 1-2 0v-4a1 1 0 0 1 2 0z\"/></g></g>","trash":"<g data-name=\"Layer 2\"><g data-name=\"trash\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21 6h-5V4.33A2.42 2.42 0 0 0 13.5 2h-3A2.42 2.42 0 0 0 8 4.33V6H3a1 1 0 0 0 0 2h1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8h1a1 1 0 0 0 0-2zM10 4.33c0-.16.21-.33.5-.33h3c.29 0 .5.17.5.33V6h-4z\"/></g></g>","trending-down":"<g data-name=\"Layer 2\"><g data-name=\"trending-down\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M21 12a1 1 0 0 0-2 0v2.3l-4.24-5a1 1 0 0 0-1.27-.21L9.22 11.7 4.77 6.36a1 1 0 1 0-1.54 1.28l5 6a1 1 0 0 0 1.28.22l4.28-2.57 4 4.71H15a1 1 0 0 0 0 2h5a1.1 1.1 0 0 0 .36-.07l.14-.08a1.19 1.19 0 0 0 .15-.09.75.75 0 0 0 .14-.17 1.1 1.1 0 0 0 .09-.14.64.64 0 0 0 .05-.17A.78.78 0 0 0 21 17z\"/></g></g>","trending-up":"<g data-name=\"Layer 2\"><g data-name=\"trending-up\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M21 7a.78.78 0 0 0 0-.21.64.64 0 0 0-.05-.17 1.1 1.1 0 0 0-.09-.14.75.75 0 0 0-.14-.17l-.12-.07a.69.69 0 0 0-.19-.1h-.2A.7.7 0 0 0 20 6h-5a1 1 0 0 0 0 2h2.83l-4 4.71-4.32-2.57a1 1 0 0 0-1.28.22l-5 6a1 1 0 0 0 .13 1.41A1 1 0 0 0 4 18a1 1 0 0 0 .77-.36l4.45-5.34 4.27 2.56a1 1 0 0 0 1.27-.21L19 9.7V12a1 1 0 0 0 2 0V7z\"/></g></g>","tv":"<g data-name=\"Layer 2\"><g data-name=\"tv\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 6h-3.59l2.3-2.29a1 1 0 1 0-1.42-1.42L12 5.59l-3.29-3.3a1 1 0 1 0-1.42 1.42L9.59 6H6a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3zm1 13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1z\"/></g></g>","twitter":"<g data-name=\"Layer 2\"><g data-name=\"twitter\"><polyline points=\"0 0 24 0 24 24 0 24\" opacity=\"0\"/><path d=\"M8.08 20A11.07 11.07 0 0 0 19.52 9 8.09 8.09 0 0 0 21 6.16a.44.44 0 0 0-.62-.51 1.88 1.88 0 0 1-2.16-.38 3.89 3.89 0 0 0-5.58-.17A4.13 4.13 0 0 0 11.49 9C8.14 9.2 5.84 7.61 4 5.43a.43.43 0 0 0-.75.24 9.68 9.68 0 0 0 4.6 10.05A6.73 6.73 0 0 1 3.38 18a.45.45 0 0 0-.14.84A11 11 0 0 0 8.08 20\"/></g></g>","umbrella":"<g data-name=\"Layer 2\"><g data-name=\"umbrella\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2A10 10 0 0 0 2 12a1 1 0 0 0 1 1h8v6a3 3 0 0 0 6 0 1 1 0 0 0-2 0 1 1 0 0 1-2 0v-6h8a1 1 0 0 0 1-1A10 10 0 0 0 12 2z\"/></g></g>","undo":"<g data-name=\"Layer 2\"><g data-name=\"undo\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M20.22 21a1 1 0 0 1-1-.76 8.91 8.91 0 0 0-7.8-6.69v1.12a1.78 1.78 0 0 1-1.09 1.64A2 2 0 0 1 8.18 16l-5.06-4.41a1.76 1.76 0 0 1 0-2.68l5.06-4.42a2 2 0 0 1 2.18-.3 1.78 1.78 0 0 1 1.09 1.64V7A10.89 10.89 0 0 1 21.5 17.75a10.29 10.29 0 0 1-.31 2.49 1 1 0 0 1-1 .76z\"/></g></g>","unlock":"<g data-name=\"Layer 2\"><g data-name=\"unlock\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><circle cx=\"12\" cy=\"15\" r=\"1\"/><path d=\"M17 8h-7V6a2 2 0 0 1 4 0 1 1 0 0 0 2 0 4 4 0 0 0-8 0v2H7a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-8a3 3 0 0 0-3-3zm-5 10a3 3 0 1 1 3-3 3 3 0 0 1-3 3z\"/></g></g>","upload":"<g data-name=\"Layer 2\"><g data-name=\"upload\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><rect x=\"4\" y=\"4\" width=\"16\" height=\"2\" rx=\"1\" ry=\"1\" transform=\"rotate(180 12 5)\"/><rect x=\"17\" y=\"5\" width=\"4\" height=\"2\" rx=\"1\" ry=\"1\" transform=\"rotate(90 19 6)\"/><rect x=\"3\" y=\"5\" width=\"4\" height=\"2\" rx=\"1\" ry=\"1\" transform=\"rotate(90 5 6)\"/><path d=\"M8 14a1 1 0 0 1-.8-.4 1 1 0 0 1 .2-1.4l4-3a1 1 0 0 1 1.18 0l4 2.82a1 1 0 0 1 .24 1.39 1 1 0 0 1-1.4.24L12 11.24 8.6 13.8a1 1 0 0 1-.6.2z\"/><path d=\"M12 21a1 1 0 0 1-1-1v-8a1 1 0 0 1 2 0v8a1 1 0 0 1-1 1z\"/></g></g>","video-off":"<g data-name=\"Layer 2\"><g data-name=\"video-off\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M14.22 17.05L4.88 7.71 3.12 6 3 5.8A3 3 0 0 0 2 8v8a3 3 0 0 0 3 3h9a2.94 2.94 0 0 0 1.66-.51z\"/><path d=\"M21 7.15a1.7 1.7 0 0 0-1.85.3l-2.15 2V8a3 3 0 0 0-3-3H7.83l1.29 1.29 6.59 6.59 2 2 2 2a1.73 1.73 0 0 0 .6.11 1.68 1.68 0 0 0 .69-.15 1.6 1.6 0 0 0 1-1.48V8.63a1.6 1.6 0 0 0-1-1.48z\"/><path d=\"M17 15.59l-2-2L8.41 7l-2-2-1.7-1.71a1 1 0 0 0-1.42 1.42l.54.53L5.59 7l9.34 9.34 1.46 1.46 2.9 2.91a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z\"/></g></g>","video":"<g data-name=\"Layer 2\"><g data-name=\"video\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21 7.15a1.7 1.7 0 0 0-1.85.3l-2.15 2V8a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3v-1.45l2.16 2a1.74 1.74 0 0 0 1.16.45 1.68 1.68 0 0 0 .69-.15 1.6 1.6 0 0 0 1-1.48V8.63A1.6 1.6 0 0 0 21 7.15z\"/></g></g>","volume-down":"<g data-name=\"Layer 2\"><g data-name=\"volume-down\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.78 8.37a1 1 0 1 0-1.56 1.26 4 4 0 0 1 0 4.74A1 1 0 0 0 20 16a1 1 0 0 0 .78-.37 6 6 0 0 0 0-7.26z\"/><path d=\"M16.47 3.12a1 1 0 0 0-1 0L9 7.57H4a1 1 0 0 0-1 1v6.86a1 1 0 0 0 1 1h5l6.41 4.4A1.06 1.06 0 0 0 16 21a1 1 0 0 0 1-1V4a1 1 0 0 0-.53-.88z\"/></g></g>","volume-mute":"<g data-name=\"Layer 2\"><g data-name=\"volume-mute\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M17 21a1.06 1.06 0 0 1-.57-.17L10 16.43H5a1 1 0 0 1-1-1V8.57a1 1 0 0 1 1-1h5l6.41-4.4A1 1 0 0 1 18 4v16a1 1 0 0 1-1 1z\"/></g></g>","volume-off":"<g data-name=\"Layer 2\"><g data-name=\"volume-off\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M16.91 14.08l1.44 1.44a6 6 0 0 0-.07-7.15 1 1 0 1 0-1.56 1.26 4 4 0 0 1 .19 4.45z\"/><path d=\"M21 12a6.51 6.51 0 0 1-1.78 4.39l1.42 1.42A8.53 8.53 0 0 0 23 12a8.75 8.75 0 0 0-3.36-6.77 1 1 0 1 0-1.28 1.54A6.8 6.8 0 0 1 21 12z\"/><path d=\"M15 12.17V4a1 1 0 0 0-1.57-.83L9 6.2z\"/><path d=\"M4.74 7.57H2a1 1 0 0 0-1 1v6.86a1 1 0 0 0 1 1h5l6.41 4.4A1.06 1.06 0 0 0 14 21a1 1 0 0 0 1-1v-2.17z\"/><path d=\"M4.71 3.29a1 1 0 0 0-1.42 1.42l16 16a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z\"/></g></g>","volume-up":"<g data-name=\"Layer 2\"><g data-name=\"volume-up\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18.28 8.37a1 1 0 1 0-1.56 1.26 4 4 0 0 1 0 4.74A1 1 0 0 0 17.5 16a1 1 0 0 0 .78-.37 6 6 0 0 0 0-7.26z\"/><path d=\"M19.64 5.23a1 1 0 1 0-1.28 1.54A6.8 6.8 0 0 1 21 12a6.8 6.8 0 0 1-2.64 5.23 1 1 0 0 0-.13 1.41A1 1 0 0 0 19 19a1 1 0 0 0 .64-.23A8.75 8.75 0 0 0 23 12a8.75 8.75 0 0 0-3.36-6.77z\"/><path d=\"M14.47 3.12a1 1 0 0 0-1 0L7 7.57H2a1 1 0 0 0-1 1v6.86a1 1 0 0 0 1 1h5l6.41 4.4A1.06 1.06 0 0 0 14 21a1 1 0 0 0 1-1V4a1 1 0 0 0-.53-.88z\"/></g></g>","wifi-off":"<g data-name=\"Layer 2\"><g data-name=\"wifi-off\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><circle cx=\"12\" cy=\"19\" r=\"1\"/><path d=\"M12.44 11l-1.9-1.89-2.46-2.44-1.55-1.55-1.82-1.83a1 1 0 0 0-1.42 1.42l1.38 1.37 1.46 1.46 2.23 2.24 1.55 1.54 2.74 2.74 2.79 2.8 3.85 3.85a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z\"/><path d=\"M21.72 7.93A13.93 13.93 0 0 0 12 4a14.1 14.1 0 0 0-4.44.73l1.62 1.62a11.89 11.89 0 0 1 11.16 3 1 1 0 0 0 .69.28 1 1 0 0 0 .72-.31 1 1 0 0 0-.03-1.39z\"/><path d=\"M3.82 6.65a14.32 14.32 0 0 0-1.54 1.28 1 1 0 0 0 1.38 1.44 13.09 13.09 0 0 1 1.6-1.29z\"/><path d=\"M17 13.14a1 1 0 0 0 .71.3 1 1 0 0 0 .72-1.69A9 9 0 0 0 12 9h-.16l2.35 2.35A7 7 0 0 1 17 13.14z\"/><path d=\"M7.43 10.26a8.8 8.8 0 0 0-1.9 1.49A1 1 0 0 0 7 13.14a7.3 7.3 0 0 1 2-1.41z\"/><path d=\"M8.53 15.4a1 1 0 1 0 1.39 1.44 3.06 3.06 0 0 1 3.84-.25l-2.52-2.52a5 5 0 0 0-2.71 1.33z\"/></g></g>","wifi":"<g data-name=\"Layer 2\"><g data-name=\"wifi\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><circle cx=\"12\" cy=\"19\" r=\"1\"/><path d=\"M12 14a5 5 0 0 0-3.47 1.4 1 1 0 1 0 1.39 1.44 3.08 3.08 0 0 1 4.16 0 1 1 0 1 0 1.39-1.44A5 5 0 0 0 12 14z\"/><path d=\"M12 9a9 9 0 0 0-6.47 2.75A1 1 0 0 0 7 13.14a7 7 0 0 1 10.08 0 1 1 0 0 0 .71.3 1 1 0 0 0 .72-1.69A9 9 0 0 0 12 9z\"/><path d=\"M21.72 7.93a14 14 0 0 0-19.44 0 1 1 0 0 0 1.38 1.44 12 12 0 0 1 16.68 0 1 1 0 0 0 .69.28 1 1 0 0 0 .72-.31 1 1 0 0 0-.03-1.41z\"/></g></g>","activity-outline":"<g data-name=\"Layer 2\"><g data-name=\"activity\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M14.33 20h-.21a2 2 0 0 1-1.76-1.58L9.68 6l-2.76 6.4A1 1 0 0 1 6 13H3a1 1 0 0 1 0-2h2.34l2.51-5.79a2 2 0 0 1 3.79.38L14.32 18l2.76-6.38A1 1 0 0 1 18 11h3a1 1 0 0 1 0 2h-2.34l-2.51 5.79A2 2 0 0 1 14.33 20z\"/></g></g>","alert-circle-outline":"<g data-name=\"Layer 2\"><g data-name=\"alert-circle\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z\"/><circle cx=\"12\" cy=\"16\" r=\"1\"/><path d=\"M12 7a1 1 0 0 0-1 1v5a1 1 0 0 0 2 0V8a1 1 0 0 0-1-1z\"/></g></g>","alert-triangle-outline":"<g data-name=\"Layer 2\"><g data-name=\"alert-triangle\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M22.56 16.3L14.89 3.58a3.43 3.43 0 0 0-5.78 0L1.44 16.3a3 3 0 0 0-.05 3A3.37 3.37 0 0 0 4.33 21h15.34a3.37 3.37 0 0 0 2.94-1.66 3 3 0 0 0-.05-3.04zm-1.7 2.05a1.31 1.31 0 0 1-1.19.65H4.33a1.31 1.31 0 0 1-1.19-.65 1 1 0 0 1 0-1l7.68-12.73a1.48 1.48 0 0 1 2.36 0l7.67 12.72a1 1 0 0 1 .01 1.01z\"/><circle cx=\"12\" cy=\"16\" r=\"1\"/><path d=\"M12 8a1 1 0 0 0-1 1v4a1 1 0 0 0 2 0V9a1 1 0 0 0-1-1z\"/></g></g>","archive-outline":"<g data-name=\"Layer 2\"><g data-name=\"archive\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M21 6a3 3 0 0 0-3-3H6a3 3 0 0 0-2 5.22V18a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8.22A3 3 0 0 0 21 6zM6 5h12a1 1 0 0 1 0 2H6a1 1 0 0 1 0-2zm12 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h12z\"/><rect x=\"9\" y=\"12\" width=\"6\" height=\"2\" rx=\".87\" ry=\".87\"/></g></g>","arrow-back-outline":"<g data-name=\"Layer 2\"><g data-name=\"arrow-back\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M19 11H7.14l3.63-4.36a1 1 0 1 0-1.54-1.28l-5 6a1.19 1.19 0 0 0-.09.15c0 .05 0 .08-.07.13A1 1 0 0 0 4 12a1 1 0 0 0 .07.36c0 .05 0 .08.07.13a1.19 1.19 0 0 0 .09.15l5 6A1 1 0 0 0 10 19a1 1 0 0 0 .64-.23 1 1 0 0 0 .13-1.41L7.14 13H19a1 1 0 0 0 0-2z\"/></g></g>","arrow-circle-down-outline":"<g data-name=\"Layer 2\"><g data-name=\"arrow-circle-down\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M14.31 12.41L13 13.66V8a1 1 0 0 0-2 0v5.59l-1.29-1.3a1 1 0 0 0-1.42 1.42l3 3a1 1 0 0 0 .33.21.94.94 0 0 0 .76 0 .54.54 0 0 0 .16-.1.49.49 0 0 0 .15-.1l3-2.86a1 1 0 0 0-1.38-1.45z\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z\"/></g></g>","arrow-circle-left-outline":"<g data-name=\"Layer 2\"><g data-name=\"arrow-circle-left\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M16 11h-5.66l1.25-1.31a1 1 0 0 0-1.45-1.38l-2.86 3a1 1 0 0 0-.09.13.72.72 0 0 0-.11.19.88.88 0 0 0-.06.28L7 12a1 1 0 0 0 .08.38 1 1 0 0 0 .21.32l3 3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42L10.41 13H16a1 1 0 0 0 0-2z\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z\"/></g></g>","arrow-circle-right-outline":"<g data-name=\"Layer 2\"><g data-name=\"arrow-circle-right\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M17 12v-.09a.88.88 0 0 0-.06-.28.72.72 0 0 0-.11-.19 1 1 0 0 0-.09-.13l-2.86-3a1 1 0 0 0-1.45 1.38L13.66 11H8a1 1 0 0 0 0 2h5.59l-1.3 1.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l3-3a1 1 0 0 0 .21-.32A1 1 0 0 0 17 12z\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z\"/></g></g>","arrow-circle-up-outline":"<g data-name=\"Layer 2\"><g data-name=\"arrow-circle-up\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12.71 7.29a1 1 0 0 0-.32-.21A1 1 0 0 0 12 7h-.1a.82.82 0 0 0-.27.06.72.72 0 0 0-.19.11 1 1 0 0 0-.13.09l-3 2.86a1 1 0 0 0 1.38 1.45L11 10.34V16a1 1 0 0 0 2 0v-5.59l1.29 1.3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z\"/></g></g>","arrow-down-outline":"<g data-name=\"Layer 2\"><g data-name=\"arrow-down\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M12 17a1.72 1.72 0 0 1-1.33-.64l-4.21-5.1a2.1 2.1 0 0 1-.26-2.21A1.76 1.76 0 0 1 7.79 8h8.42a1.76 1.76 0 0 1 1.59 1.05 2.1 2.1 0 0 1-.26 2.21l-4.21 5.1A1.72 1.72 0 0 1 12 17zm-3.91-7L12 14.82 16 10z\"/></g></g>","arrow-downward-outline":"<g data-name=\"Layer 2\"><g data-name=\"arrow-downward\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18.77 13.36a1 1 0 0 0-1.41-.13L13 16.86V5a1 1 0 0 0-2 0v11.86l-4.36-3.63a1 1 0 1 0-1.28 1.54l6 5 .15.09.13.07a1 1 0 0 0 .72 0l.13-.07.15-.09 6-5a1 1 0 0 0 .13-1.41z\"/></g></g>","arrow-forward-outline":"<g data-name=\"Layer 2\"><g data-name=\"arrow-forward\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M5 13h11.86l-3.63 4.36a1 1 0 0 0 1.54 1.28l5-6a1.19 1.19 0 0 0 .09-.15c0-.05.05-.08.07-.13A1 1 0 0 0 20 12a1 1 0 0 0-.07-.36c0-.05-.05-.08-.07-.13a1.19 1.19 0 0 0-.09-.15l-5-6A1 1 0 0 0 14 5a1 1 0 0 0-.64.23 1 1 0 0 0-.13 1.41L16.86 11H5a1 1 0 0 0 0 2z\"/></g></g>","arrow-ios-back-outline":"<g data-name=\"Layer 2\"><g data-name=\"arrow-ios-back\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M13.83 19a1 1 0 0 1-.78-.37l-4.83-6a1 1 0 0 1 0-1.27l5-6a1 1 0 0 1 1.54 1.28L10.29 12l4.32 5.36a1 1 0 0 1-.78 1.64z\"/></g></g>","arrow-ios-downward-outline":"<g data-name=\"Layer 2\"><g data-name=\"arrow-ios-downward\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 16a1 1 0 0 1-.64-.23l-6-5a1 1 0 1 1 1.28-1.54L12 13.71l5.36-4.32a1 1 0 0 1 1.41.15 1 1 0 0 1-.14 1.46l-6 4.83A1 1 0 0 1 12 16z\"/></g></g>","arrow-ios-forward-outline":"<g data-name=\"Layer 2\"><g data-name=\"arrow-ios-forward\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M10 19a1 1 0 0 1-.64-.23 1 1 0 0 1-.13-1.41L13.71 12 9.39 6.63a1 1 0 0 1 .15-1.41 1 1 0 0 1 1.46.15l4.83 6a1 1 0 0 1 0 1.27l-5 6A1 1 0 0 1 10 19z\"/></g></g>","arrow-ios-upward-outline":"<g data-name=\"Layer 2\"><g data-name=\"arrow-ios-upward\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M18 15a1 1 0 0 1-.64-.23L12 10.29l-5.37 4.32a1 1 0 0 1-1.41-.15 1 1 0 0 1 .15-1.41l6-4.83a1 1 0 0 1 1.27 0l6 5a1 1 0 0 1 .13 1.41A1 1 0 0 1 18 15z\"/></g></g>","arrow-left-outline":"<g data-name=\"Layer 2\"><g data-name=\"arrow-left\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M13.54 18a2.06 2.06 0 0 1-1.3-.46l-5.1-4.21a1.7 1.7 0 0 1 0-2.66l5.1-4.21a2.1 2.1 0 0 1 2.21-.26 1.76 1.76 0 0 1 1.05 1.59v8.42a1.76 1.76 0 0 1-1.05 1.59 2.23 2.23 0 0 1-.91.2zm-4.86-6l4.82 4V8.09z\"/></g></g>","arrow-right-outline":"<g data-name=\"Layer 2\"><g data-name=\"arrow-right\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M10.46 18a2.23 2.23 0 0 1-.91-.2 1.76 1.76 0 0 1-1.05-1.59V7.79A1.76 1.76 0 0 1 9.55 6.2a2.1 2.1 0 0 1 2.21.26l5.1 4.21a1.7 1.7 0 0 1 0 2.66l-5.1 4.21a2.06 2.06 0 0 1-1.3.46zm0-10v7.9l4.86-3.9z\"/></g></g>","arrow-up-outline":"<g data-name=\"Layer 2\"><g data-name=\"arrow-up\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1 2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1zM8 14h7.9L12 9.18z\"/></g></g>","arrow-upward-outline":"<g data-name=\"Layer 2\"><g data-name=\"arrow-upward\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M5.23 10.64a1 1 0 0 0 1.41.13L11 7.14V19a1 1 0 0 0 2 0V7.14l4.36 3.63a1 1 0 1 0 1.28-1.54l-6-5-.15-.09-.13-.07a1 1 0 0 0-.72 0l-.13.07-.15.09-6 5a1 1 0 0 0-.13 1.41z\"/></g></g>","arrowhead-down-outline":"<g data-name=\"Layer 2\"><g data-name=\"arrowhead-down\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M17.37 12.39L12 16.71l-5.36-4.48a1 1 0 1 0-1.28 1.54l6 5a1 1 0 0 0 1.27 0l6-4.83a1 1 0 0 0 .15-1.41 1 1 0 0 0-1.41-.14z\"/><path d=\"M11.36 11.77a1 1 0 0 0 1.27 0l6-4.83a1 1 0 0 0 .15-1.41 1 1 0 0 0-1.41-.15L12 9.71 6.64 5.23a1 1 0 0 0-1.28 1.54z\"/></g></g>","arrowhead-left-outline":"<g data-name=\"Layer 2\"><g data-name=\"arrowhead-left\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M11.64 5.23a1 1 0 0 0-1.41.13l-5 6a1 1 0 0 0 0 1.27l4.83 6a1 1 0 0 0 .78.37 1 1 0 0 0 .78-1.63L7.29 12l4.48-5.37a1 1 0 0 0-.13-1.4z\"/><path d=\"M14.29 12l4.48-5.37a1 1 0 0 0-1.54-1.28l-5 6a1 1 0 0 0 0 1.27l4.83 6a1 1 0 0 0 .78.37 1 1 0 0 0 .78-1.63z\"/></g></g>","arrowhead-right-outline":"<g data-name=\"Layer 2\"><g data-name=\"arrowhead-right\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M18.78 11.37l-4.78-6a1 1 0 0 0-1.41-.15 1 1 0 0 0-.15 1.41L16.71 12l-4.48 5.37a1 1 0 0 0 .13 1.41A1 1 0 0 0 13 19a1 1 0 0 0 .77-.36l5-6a1 1 0 0 0 .01-1.27z\"/><path d=\"M7 5.37a1 1 0 0 0-1.61 1.26L9.71 12l-4.48 5.36a1 1 0 0 0 .13 1.41A1 1 0 0 0 6 19a1 1 0 0 0 .77-.36l5-6a1 1 0 0 0 0-1.27z\"/></g></g>","arrowhead-up-outline":"<g data-name=\"Layer 2\"><g data-name=\"arrowhead-up\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M6.63 11.61L12 7.29l5.37 4.48A1 1 0 0 0 18 12a1 1 0 0 0 .77-.36 1 1 0 0 0-.13-1.41l-6-5a1 1 0 0 0-1.27 0l-6 4.83a1 1 0 0 0-.15 1.41 1 1 0 0 0 1.41.14z\"/><path d=\"M12.64 12.23a1 1 0 0 0-1.27 0l-6 4.83a1 1 0 0 0-.15 1.41 1 1 0 0 0 1.41.15L12 14.29l5.37 4.48A1 1 0 0 0 18 19a1 1 0 0 0 .77-.36 1 1 0 0 0-.13-1.41z\"/></g></g>","at-outline":"<g data-name=\"Layer 2\"><g data-name=\"at\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M13 2a10 10 0 0 0-5 19.1 10.15 10.15 0 0 0 4 .9 10 10 0 0 0 6.08-2.06 1 1 0 0 0 .19-1.4 1 1 0 0 0-1.41-.19A8 8 0 1 1 12.77 4 8.17 8.17 0 0 1 20 12.22v.68a1.71 1.71 0 0 1-1.78 1.7 1.82 1.82 0 0 1-1.62-1.88V8.4a1 1 0 0 0-1-1 1 1 0 0 0-1 .87 5 5 0 0 0-3.44-1.36A5.09 5.09 0 1 0 15.31 15a3.6 3.6 0 0 0 5.55.61A3.67 3.67 0 0 0 22 12.9v-.68A10.2 10.2 0 0 0 13 2zm-1.82 13.09A3.09 3.09 0 1 1 14.27 12a3.1 3.1 0 0 1-3.09 3.09z\"/></g></g>","attach-2-outline":"<g data-name=\"Layer 2\"><g data-name=\"attach-2\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 22a5.86 5.86 0 0 1-6-5.7V6.13A4.24 4.24 0 0 1 10.33 2a4.24 4.24 0 0 1 4.34 4.13v10.18a2.67 2.67 0 0 1-5.33 0V6.92a1 1 0 0 1 1-1 1 1 0 0 1 1 1v9.39a.67.67 0 0 0 1.33 0V6.13A2.25 2.25 0 0 0 10.33 4 2.25 2.25 0 0 0 8 6.13V16.3a3.86 3.86 0 0 0 4 3.7 3.86 3.86 0 0 0 4-3.7V6.13a1 1 0 1 1 2 0V16.3a5.86 5.86 0 0 1-6 5.7z\"/></g></g>","attach-outline":"<g data-name=\"Layer 2\"><g data-name=\"attach\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M9.29 21a6.23 6.23 0 0 1-4.43-1.88 6 6 0 0 1-.22-8.49L12 3.2A4.11 4.11 0 0 1 15 2a4.48 4.48 0 0 1 3.19 1.35 4.36 4.36 0 0 1 .15 6.13l-7.4 7.43a2.54 2.54 0 0 1-1.81.75 2.72 2.72 0 0 1-1.95-.82 2.68 2.68 0 0 1-.08-3.77l6.83-6.86a1 1 0 0 1 1.37 1.41l-6.83 6.86a.68.68 0 0 0 .08.95.78.78 0 0 0 .53.23.56.56 0 0 0 .4-.16l7.39-7.43a2.36 2.36 0 0 0-.15-3.31 2.38 2.38 0 0 0-3.27-.15L6.06 12a4 4 0 0 0 .22 5.67 4.22 4.22 0 0 0 3 1.29 3.67 3.67 0 0 0 2.61-1.06l7.39-7.43a1 1 0 1 1 1.42 1.41l-7.39 7.43A5.65 5.65 0 0 1 9.29 21z\"/></g></g>","award-outline":"<g data-name=\"Layer 2\"><g data-name=\"award\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19 20.75l-2.31-9A5.94 5.94 0 0 0 18 8 6 6 0 0 0 6 8a5.94 5.94 0 0 0 1.34 3.77L5 20.75a1 1 0 0 0 1.48 1.11l5.33-3.13 5.68 3.14A.91.91 0 0 0 18 22a1 1 0 0 0 1-1.25zM12 4a4 4 0 1 1-4 4 4 4 0 0 1 4-4zm.31 12.71a1 1 0 0 0-1 0l-3.75 2.2L9 13.21a5.94 5.94 0 0 0 5.92 0L16.45 19z\"/></g></g>","backspace-outline":"<g data-name=\"Layer 2\"><g data-name=\"backspace\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.14 4h-9.77a3 3 0 0 0-2 .78l-.1.11-6 7.48a1 1 0 0 0 .11 1.37l6 5.48a3 3 0 0 0 2 .78h9.77A1.84 1.84 0 0 0 22 18.18V5.82A1.84 1.84 0 0 0 20.14 4zM20 18h-9.63a1 1 0 0 1-.67-.26l-5.33-4.85 5.38-6.67a1 1 0 0 1 .62-.22H20z\"/><path d=\"M11.29 14.71a1 1 0 0 0 1.42 0l1.29-1.3 1.29 1.3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42L15.41 12l1.3-1.29a1 1 0 0 0-1.42-1.42L14 10.59l-1.29-1.3a1 1 0 0 0-1.42 1.42l1.3 1.29-1.3 1.29a1 1 0 0 0 0 1.42z\"/></g></g>","bar-chart-2-outline":"<g data-name=\"Layer 2\"><g data-name=\"bar-chart-2\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M12 8a1 1 0 0 0-1 1v11a1 1 0 0 0 2 0V9a1 1 0 0 0-1-1z\"/><path d=\"M19 4a1 1 0 0 0-1 1v15a1 1 0 0 0 2 0V5a1 1 0 0 0-1-1z\"/><path d=\"M5 12a1 1 0 0 0-1 1v7a1 1 0 0 0 2 0v-7a1 1 0 0 0-1-1z\"/></g></g>","bar-chart-outline":"<g data-name=\"Layer 2\"><g data-name=\"bar-chart\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M12 4a1 1 0 0 0-1 1v15a1 1 0 0 0 2 0V5a1 1 0 0 0-1-1z\"/><path d=\"M19 12a1 1 0 0 0-1 1v7a1 1 0 0 0 2 0v-7a1 1 0 0 0-1-1z\"/><path d=\"M5 8a1 1 0 0 0-1 1v11a1 1 0 0 0 2 0V9a1 1 0 0 0-1-1z\"/></g></g>","battery-outline":"<g data-name=\"Layer 2\"><g data-name=\"battery\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M15.83 6H4.17A2.31 2.31 0 0 0 2 8.43v7.14A2.31 2.31 0 0 0 4.17 18h11.66A2.31 2.31 0 0 0 18 15.57V8.43A2.31 2.31 0 0 0 15.83 6zm.17 9.57a.52.52 0 0 1-.17.43H4.18a.5.5 0 0 1-.18-.43V8.43A.53.53 0 0 1 4.17 8h11.65a.5.5 0 0 1 .18.43z\"/><path d=\"M21 9a1 1 0 0 0-1 1v4a1 1 0 0 0 2 0v-4a1 1 0 0 0-1-1z\"/></g></g>","behance-outline":"<g data-name=\"Layer 2\"><g data-name=\"behance\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z\"/><path d=\"M10.52 11.78a1.4 1.4 0 0 0 1.12-1.43c0-1-.77-1.6-1.94-1.6H7v6.5h2.7c1.3-.05 2.3-.72 2.3-1.88a1.52 1.52 0 0 0-1.48-1.59zM8.26 9.67h1.15c.6 0 .95.32.95.85s-.38.89-1.25.89h-.85zm1 4.57h-1V12.3h1.23c.75 0 1.17.38 1.17 1s-.42.94-1.44.94z\"/><path d=\"M14.75 10.3a2.11 2.11 0 0 0-2.28 2.25V13a2.15 2.15 0 0 0 2.34 2.31A2 2 0 0 0 17 13.75h-1.21a.9.9 0 0 1-1 .63 1.07 1.07 0 0 1-1.09-1.19v-.14H17v-.47a2.12 2.12 0 0 0-2.25-2.28zm1 2h-2.02a1 1 0 0 1 1-1.09 1 1 0 0 1 1 1.09z\"/><rect x=\"13.25\" y=\"9.2\" width=\"3\" height=\".5\"/></g></g>","bell-off-outline":"<g data-name=\"Layer 2\"><g data-name=\"bell-off\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M8.9 5.17A4.67 4.67 0 0 1 12.64 4a4.86 4.86 0 0 1 4.08 4.9v4.5a1.92 1.92 0 0 0 .1.59l3.6 3.6a1.58 1.58 0 0 0 .45-.6 1.62 1.62 0 0 0-.35-1.78l-1.8-1.81V8.94a6.86 6.86 0 0 0-5.82-6.88 6.71 6.71 0 0 0-5.32 1.61 6.88 6.88 0 0 0-.58.54l1.47 1.43a4.79 4.79 0 0 1 .43-.47z\"/><path d=\"M14 16.86l-.83-.86H5.51l1.18-1.18a2 2 0 0 0 .59-1.42v-3.29l-2-2a5.68 5.68 0 0 0 0 .59v4.7l-1.8 1.81A1.63 1.63 0 0 0 4.64 18H8v.34A3.84 3.84 0 0 0 12 22a3.88 3.88 0 0 0 4-3.22l-.83-.78zM12 20a1.88 1.88 0 0 1-2-1.66V18h4v.34A1.88 1.88 0 0 1 12 20z\"/><path d=\"M20.71 19.29L19.41 18l-2-2-9.52-9.53L6.42 5 4.71 3.29a1 1 0 0 0-1.42 1.42L5.53 7l1.75 1.7 7.31 7.3.07.07L16 17.41l.59.59 2.7 2.71a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z\"/></g></g>","bell-outline":"<g data-name=\"Layer 2\"><g data-name=\"bell\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.52 15.21l-1.8-1.81V8.94a6.86 6.86 0 0 0-5.82-6.88 6.74 6.74 0 0 0-7.62 6.67v4.67l-1.8 1.81A1.64 1.64 0 0 0 4.64 18H8v.34A3.84 3.84 0 0 0 12 22a3.84 3.84 0 0 0 4-3.66V18h3.36a1.64 1.64 0 0 0 1.16-2.79zM14 18.34A1.88 1.88 0 0 1 12 20a1.88 1.88 0 0 1-2-1.66V18h4zM5.51 16l1.18-1.18a2 2 0 0 0 .59-1.42V8.73A4.73 4.73 0 0 1 8.9 5.17 4.67 4.67 0 0 1 12.64 4a4.86 4.86 0 0 1 4.08 4.9v4.5a2 2 0 0 0 .58 1.42L18.49 16z\"/></g></g>","bluetooth-outline":"<g data-name=\"Layer 2\"><g data-name=\"bluetooth\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M13.63 12l4-3.79a1.14 1.14 0 0 0-.13-1.77l-4.67-3.23a1.17 1.17 0 0 0-1.21-.08 1.15 1.15 0 0 0-.62 1v6.2l-3.19-4a1 1 0 0 0-1.56 1.3L9.72 12l-3.5 4.43a1 1 0 0 0 .16 1.4A1 1 0 0 0 7 18a1 1 0 0 0 .78-.38L11 13.56v6.29A1.16 1.16 0 0 0 12.16 21a1.16 1.16 0 0 0 .67-.21l4.64-3.18a1.17 1.17 0 0 0 .49-.85 1.15 1.15 0 0 0-.34-.91zM13 5.76l2.5 1.73L13 9.85zm0 12.49v-4.07l2.47 2.38z\"/></g></g>","book-open-outline":"<g data-name=\"Layer 2\"><g data-name=\"book-open\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M20.62 4.22a1 1 0 0 0-.84-.2L12 5.77 4.22 4A1 1 0 0 0 3 5v12.2a1 1 0 0 0 .78 1l8 1.8h.44l8-1.8a1 1 0 0 0 .78-1V5a1 1 0 0 0-.38-.78zM5 6.25l6 1.35v10.15L5 16.4zM19 16.4l-6 1.35V7.6l6-1.35z\"/></g></g>","book-outline":"<g data-name=\"Layer 2\"><g data-name=\"book\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19 3H7a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zM7 5h11v10H7a3 3 0 0 0-1 .18V6a1 1 0 0 1 1-1zm0 14a1 1 0 0 1 0-2h11v2z\"/></g></g>","bookmark-outline":"<g data-name=\"Layer 2\"><g data-name=\"bookmark\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M6.09 21.06a1 1 0 0 1-1-1L4.94 5.4a2.26 2.26 0 0 1 2.18-2.35L16.71 3a2.27 2.27 0 0 1 2.23 2.31l.14 14.66a1 1 0 0 1-.49.87 1 1 0 0 1-1 0l-5.7-3.16-5.29 3.23a1.2 1.2 0 0 1-.51.15zm5.76-5.55a1.11 1.11 0 0 1 .5.12l4.71 2.61-.12-12.95c0-.2-.13-.34-.21-.33l-9.6.09c-.08 0-.19.13-.19.33l.12 12.9 4.28-2.63a1.06 1.06 0 0 1 .51-.14z\"/></g></g>","briefcase-outline":"<g data-name=\"Layer 2\"><g data-name=\"briefcase\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19 7h-3V5.5A2.5 2.5 0 0 0 13.5 3h-3A2.5 2.5 0 0 0 8 5.5V7H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-8a3 3 0 0 0-3-3zm-4 2v10H9V9zm-5-3.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V7h-4zM4 18v-8a1 1 0 0 1 1-1h2v10H5a1 1 0 0 1-1-1zm16 0a1 1 0 0 1-1 1h-2V9h2a1 1 0 0 1 1 1z\"/></g></g>","browser-outline":"<g data-name=\"Layer 2\"><g data-name=\"browser\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zm1 15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7h14zM5 9V6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3z\"/><circle cx=\"8\" cy=\"7.03\" r=\"1\"/><circle cx=\"12\" cy=\"7.03\" r=\"1\"/></g></g>","brush-outline":"<g data-name=\"Layer 2\"><g data-name=\"brush\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20 6.83a2.76 2.76 0 0 0-.82-2 2.89 2.89 0 0 0-4 0l-6.6 6.6h-.22a4.42 4.42 0 0 0-4.3 4.31L4 19a1 1 0 0 0 .29.73A1.05 1.05 0 0 0 5 20l3.26-.06a4.42 4.42 0 0 0 4.31-4.3v-.23l6.61-6.6A2.74 2.74 0 0 0 20 6.83zM8.25 17.94L6 18v-2.23a2.4 2.4 0 0 1 2.4-2.36 2.15 2.15 0 0 1 2.15 2.19 2.4 2.4 0 0 1-2.3 2.34zm9.52-10.55l-5.87 5.87a4.55 4.55 0 0 0-.52-.64 3.94 3.94 0 0 0-.64-.52l5.87-5.86a.84.84 0 0 1 1.16 0 .81.81 0 0 1 .23.59.79.79 0 0 1-.23.56z\"/></g></g>","bulb-outline":"<g data-name=\"Layer 2\"><g data-name=\"bulb\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M12 7a5 5 0 0 0-3 9v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-4a5 5 0 0 0-3-9zm1.5 7.59a1 1 0 0 0-.5.87V20h-2v-4.54a1 1 0 0 0-.5-.87A3 3 0 0 1 9 12a3 3 0 0 1 6 0 3 3 0 0 1-1.5 2.59z\"/><path d=\"M12 6a1 1 0 0 0 1-1V3a1 1 0 0 0-2 0v2a1 1 0 0 0 1 1z\"/><path d=\"M21 11h-2a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2z\"/><path d=\"M5 11H3a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2z\"/><path d=\"M7.66 6.42L6.22 5a1 1 0 0 0-1.39 1.47l1.44 1.39a1 1 0 0 0 .73.28 1 1 0 0 0 .72-.31 1 1 0 0 0-.06-1.41z\"/><path d=\"M19.19 5.05a1 1 0 0 0-1.41 0l-1.44 1.37a1 1 0 0 0 0 1.41 1 1 0 0 0 .72.31 1 1 0 0 0 .69-.28l1.44-1.39a1 1 0 0 0 0-1.42z\"/></g></g>","calendar-outline":"<g data-name=\"Layer 2\"><g data-name=\"calendar\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 4h-1V3a1 1 0 0 0-2 0v1H9V3a1 1 0 0 0-2 0v1H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zM6 6h1v1a1 1 0 0 0 2 0V6h6v1a1 1 0 0 0 2 0V6h1a1 1 0 0 1 1 1v4H5V7a1 1 0 0 1 1-1zm12 14H6a1 1 0 0 1-1-1v-6h14v6a1 1 0 0 1-1 1z\"/><circle cx=\"8\" cy=\"16\" r=\"1\"/><path d=\"M16 15h-4a1 1 0 0 0 0 2h4a1 1 0 0 0 0-2z\"/></g></g>","camera-outline":"<g data-name=\"Layer 2\"><g data-name=\"camera\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19 7h-3V5.5A2.5 2.5 0 0 0 13.5 3h-3A2.5 2.5 0 0 0 8 5.5V7H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-8a3 3 0 0 0-3-3zm-9-1.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V7h-4zM20 18a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1z\"/><path d=\"M12 10.5a3.5 3.5 0 1 0 3.5 3.5 3.5 3.5 0 0 0-3.5-3.5zm0 5a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5z\"/></g></g>","car-outline":"<g data-name=\"Layer 2\"><g data-name=\"car\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21.6 11.22L17 7.52V5a1.91 1.91 0 0 0-1.81-2H3.79A1.91 1.91 0 0 0 2 5v10a2 2 0 0 0 1.2 1.88 3 3 0 1 0 5.6.12h6.36a3 3 0 1 0 5.64 0h.2a1 1 0 0 0 1-1v-4a1 1 0 0 0-.4-.78zM20 12.48V15h-3v-4.92zM7 18a1 1 0 1 1-1-1 1 1 0 0 1 1 1zm5-3H4V5h11v10zm7 3a1 1 0 1 1-1-1 1 1 0 0 1 1 1z\"/></g></g>","cast-outline":"<g data-name=\"Layer 2\"><g data-name=\"cast\"><polyline points=\"24 24 0 24 0 0\" opacity=\"0\"/><path d=\"M18.4 3H5.6A2.7 2.7 0 0 0 3 5.78V7a1 1 0 0 0 2 0V5.78A.72.72 0 0 1 5.6 5h12.8a.72.72 0 0 1 .6.78v12.44a.72.72 0 0 1-.6.78H17a1 1 0 0 0 0 2h1.4a2.7 2.7 0 0 0 2.6-2.78V5.78A2.7 2.7 0 0 0 18.4 3z\"/><path d=\"M3.86 14A1 1 0 0 0 3 15.17a1 1 0 0 0 1.14.83 2.49 2.49 0 0 1 2.12.72 2.52 2.52 0 0 1 .51 2.84 1 1 0 0 0 .48 1.33 1.06 1.06 0 0 0 .42.09 1 1 0 0 0 .91-.58A4.52 4.52 0 0 0 3.86 14z\"/><path d=\"M3.86 10.08a1 1 0 0 0 .28 2 6 6 0 0 1 5.09 1.71 6 6 0 0 1 1.53 5.95 1 1 0 0 0 .68 1.26.9.9 0 0 0 .28 0 1 1 0 0 0 1-.72 8 8 0 0 0-8.82-10.2z\"/><circle cx=\"4\" cy=\"19\" r=\"1\"/></g></g>","charging-outline":"<g data-name=\"Layer 2\"><g data-name=\"charging\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21 9a1 1 0 0 0-1 1v4a1 1 0 0 0 2 0v-4a1 1 0 0 0-1-1z\"/><path d=\"M15.83 6h-3.1l-1.14 2h4.23a.5.5 0 0 1 .18.43v7.14a.52.52 0 0 1-.17.43H13l-1.15 2h4A2.31 2.31 0 0 0 18 15.57V8.43A2.31 2.31 0 0 0 15.83 6z\"/><path d=\"M4 15.57V8.43A.53.53 0 0 1 4.17 8H7l1.13-2h-4A2.31 2.31 0 0 0 2 8.43v7.14A2.31 2.31 0 0 0 4.17 18h3.1l1.14-2H4.18a.5.5 0 0 1-.18-.43z\"/><path d=\"M9 20a1 1 0 0 1-.87-1.5l3.15-5.5H7a1 1 0 0 1-.86-.5 1 1 0 0 1 0-1l4-7a1 1 0 0 1 1.74 1L8.72 11H13a1 1 0 0 1 .86.5 1 1 0 0 1 0 1l-4 7A1 1 0 0 1 9 20z\"/></g></g>","checkmark-circle-2-outline":"<g data-name=\"Layer 2\"><g data-name=\"checkmark-circle-2\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z\"/><path d=\"M14.7 8.39l-3.78 5-1.63-2.11a1 1 0 0 0-1.58 1.23l2.43 3.11a1 1 0 0 0 .79.38 1 1 0 0 0 .79-.39l4.57-6a1 1 0 1 0-1.6-1.22z\"/></g></g>","checkmark-circle-outline":"<g data-name=\"Layer 2\"><g data-name=\"checkmark-circle\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M9.71 11.29a1 1 0 0 0-1.42 1.42l3 3A1 1 0 0 0 12 16a1 1 0 0 0 .72-.34l7-8a1 1 0 0 0-1.5-1.32L12 13.54z\"/><path d=\"M21 11a1 1 0 0 0-1 1 8 8 0 0 1-8 8A8 8 0 0 1 6.33 6.36 7.93 7.93 0 0 1 12 4a8.79 8.79 0 0 1 1.9.22 1 1 0 1 0 .47-1.94A10.54 10.54 0 0 0 12 2a10 10 0 0 0-7 17.09A9.93 9.93 0 0 0 12 22a10 10 0 0 0 10-10 1 1 0 0 0-1-1z\"/></g></g>","checkmark-outline":"<g data-name=\"Layer 2\"><g data-name=\"checkmark\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M9.86 18a1 1 0 0 1-.73-.32l-4.86-5.17a1 1 0 1 1 1.46-1.37l4.12 4.39 8.41-9.2a1 1 0 1 1 1.48 1.34l-9.14 10a1 1 0 0 1-.73.33z\"/></g></g>","checkmark-square-2-outline":"<g data-name=\"Layer 2\"><g data-name=\"checkmark-square-2\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M18 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zm1 15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1z\"/><path d=\"M14.7 8.39l-3.78 5-1.63-2.11a1 1 0 0 0-1.58 1.23l2.43 3.11a1 1 0 0 0 .79.38 1 1 0 0 0 .79-.39l4.57-6a1 1 0 1 0-1.6-1.22z\"/></g></g>","checkmark-square-outline":"<g data-name=\"Layer 2\"><g data-name=\"checkmark-square\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20 11.83a1 1 0 0 0-1 1v5.57a.6.6 0 0 1-.6.6H5.6a.6.6 0 0 1-.6-.6V5.6a.6.6 0 0 1 .6-.6h9.57a1 1 0 1 0 0-2H5.6A2.61 2.61 0 0 0 3 5.6v12.8A2.61 2.61 0 0 0 5.6 21h12.8a2.61 2.61 0 0 0 2.6-2.6v-5.57a1 1 0 0 0-1-1z\"/><path d=\"M10.72 11a1 1 0 0 0-1.44 1.38l2.22 2.33a1 1 0 0 0 .72.31 1 1 0 0 0 .72-.3l6.78-7a1 1 0 1 0-1.44-1.4l-6.05 6.26z\"/></g></g>","chevron-down-outline":"<g data-name=\"Layer 2\"><g data-name=\"chevron-down\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 15.5a1 1 0 0 1-.71-.29l-4-4a1 1 0 1 1 1.42-1.42L12 13.1l3.3-3.18a1 1 0 1 1 1.38 1.44l-4 3.86a1 1 0 0 1-.68.28z\"/></g></g>","chevron-left-outline":"<g data-name=\"Layer 2\"><g data-name=\"chevron-left\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M13.36 17a1 1 0 0 1-.72-.31l-3.86-4a1 1 0 0 1 0-1.4l4-4a1 1 0 1 1 1.42 1.42L10.9 12l3.18 3.3a1 1 0 0 1 0 1.41 1 1 0 0 1-.72.29z\"/></g></g>","chevron-right-outline":"<g data-name=\"Layer 2\"><g data-name=\"chevron-right\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M10.5 17a1 1 0 0 1-.71-.29 1 1 0 0 1 0-1.42L13.1 12 9.92 8.69a1 1 0 0 1 0-1.41 1 1 0 0 1 1.42 0l3.86 4a1 1 0 0 1 0 1.4l-4 4a1 1 0 0 1-.7.32z\"/></g></g>","chevron-up-outline":"<g data-name=\"Layer 2\"><g data-name=\"chevron-up\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M16 14.5a1 1 0 0 1-.71-.29L12 10.9l-3.3 3.18a1 1 0 0 1-1.41 0 1 1 0 0 1 0-1.42l4-3.86a1 1 0 0 1 1.4 0l4 4a1 1 0 0 1 0 1.42 1 1 0 0 1-.69.28z\"/></g></g>","clipboard-outline":"<g data-name=\"Layer 2\"><g data-name=\"clipboard\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 5V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v1a3 3 0 0 0-3 3v11a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3zM8 4h8v4H8V4zm11 15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7a1 1 0 0 1 1 1z\"/></g></g>","clock-outline":"<g data-name=\"Layer 2\"><g data-name=\"clock\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z\"/><path d=\"M16 11h-3V8a1 1 0 0 0-2 0v4a1 1 0 0 0 1 1h4a1 1 0 0 0 0-2z\"/></g></g>","close-circle-outline":"<g data-name=\"Layer 2\"><g data-name=\"close-circle\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z\"/><path d=\"M14.71 9.29a1 1 0 0 0-1.42 0L12 10.59l-1.29-1.3a1 1 0 0 0-1.42 1.42l1.3 1.29-1.3 1.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l1.29-1.3 1.29 1.3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42L13.41 12l1.3-1.29a1 1 0 0 0 0-1.42z\"/></g></g>","close-outline":"<g data-name=\"Layer 2\"><g data-name=\"close\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M13.41 12l4.3-4.29a1 1 0 1 0-1.42-1.42L12 10.59l-4.29-4.3a1 1 0 0 0-1.42 1.42l4.3 4.29-4.3 4.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l4.29-4.3 4.29 4.3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z\"/></g></g>","close-square-outline":"<g data-name=\"Layer 2\"><g data-name=\"close-square\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zm1 15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1z\"/><path d=\"M14.71 9.29a1 1 0 0 0-1.42 0L12 10.59l-1.29-1.3a1 1 0 0 0-1.42 1.42l1.3 1.29-1.3 1.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l1.29-1.3 1.29 1.3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42L13.41 12l1.3-1.29a1 1 0 0 0 0-1.42z\"/></g></g>","cloud-download-outline":"<g data-name=\"Layer 2\"><g data-name=\"cloud-download\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M14.31 16.38L13 17.64V12a1 1 0 0 0-2 0v5.59l-1.29-1.3a1 1 0 0 0-1.42 1.42l3 3A1 1 0 0 0 12 21a1 1 0 0 0 .69-.28l3-2.9a1 1 0 1 0-1.38-1.44z\"/><path d=\"M17.67 7A6 6 0 0 0 6.33 7a5 5 0 0 0-3.08 8.27A1 1 0 1 0 4.75 14 3 3 0 0 1 7 9h.1a1 1 0 0 0 1-.8 4 4 0 0 1 7.84 0 1 1 0 0 0 1 .8H17a3 3 0 0 1 2.25 5 1 1 0 0 0 .09 1.42 1 1 0 0 0 .66.25 1 1 0 0 0 .75-.34A5 5 0 0 0 17.67 7z\"/></g></g>","cloud-upload-outline":"<g data-name=\"Layer 2\"><g data-name=\"cloud-upload\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12.71 11.29a1 1 0 0 0-1.4 0l-3 2.9a1 1 0 1 0 1.38 1.44L11 14.36V20a1 1 0 0 0 2 0v-5.59l1.29 1.3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z\"/><path d=\"M17.67 7A6 6 0 0 0 6.33 7a5 5 0 0 0-3.08 8.27A1 1 0 1 0 4.75 14 3 3 0 0 1 7 9h.1a1 1 0 0 0 1-.8 4 4 0 0 1 7.84 0 1 1 0 0 0 1 .8H17a3 3 0 0 1 2.25 5 1 1 0 0 0 .09 1.42 1 1 0 0 0 .66.25 1 1 0 0 0 .75-.34A5 5 0 0 0 17.67 7z\"/></g></g>","code-download-outline":"<g data-name=\"Layer 2\"><g data-name=\"code-download\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M4.29 12l4.48-5.36a1 1 0 1 0-1.54-1.28l-5 6a1 1 0 0 0 0 1.27l4.83 6a1 1 0 0 0 .78.37 1 1 0 0 0 .78-1.63z\"/><path d=\"M21.78 11.37l-4.78-6a1 1 0 0 0-1.56 1.26L19.71 12l-4.48 5.37a1 1 0 0 0 .13 1.41A1 1 0 0 0 16 19a1 1 0 0 0 .77-.36l5-6a1 1 0 0 0 .01-1.27z\"/><path d=\"M15.72 11.41a1 1 0 0 0-1.41 0L13 12.64V8a1 1 0 0 0-2 0v4.59l-1.29-1.3a1 1 0 0 0-1.42 1.42l3 3A1 1 0 0 0 12 16a1 1 0 0 0 .69-.28l3-2.9a1 1 0 0 0 .03-1.41z\"/></g></g>","code-outline":"<g data-name=\"Layer 2\"><g data-name=\"code\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M8.64 5.23a1 1 0 0 0-1.41.13l-5 6a1 1 0 0 0 0 1.27l4.83 6a1 1 0 0 0 .78.37 1 1 0 0 0 .78-1.63L4.29 12l4.48-5.36a1 1 0 0 0-.13-1.41z\"/><path d=\"M21.78 11.37l-4.78-6a1 1 0 0 0-1.41-.15 1 1 0 0 0-.15 1.41L19.71 12l-4.48 5.37a1 1 0 0 0 .13 1.41A1 1 0 0 0 16 19a1 1 0 0 0 .77-.36l5-6a1 1 0 0 0 .01-1.27z\"/></g></g>","collapse-outline":"<g data-name=\"Layer 2\"><g data-name=\"collapse\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M19 9h-2.58l3.29-3.29a1 1 0 1 0-1.42-1.42L15 7.57V5a1 1 0 0 0-1-1 1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 0-2z\"/><path d=\"M10 13H5a1 1 0 0 0 0 2h2.57l-3.28 3.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0L9 16.42V19a1 1 0 0 0 1 1 1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1z\"/></g></g>","color-palette-outline":"<g data-name=\"Layer 2\"><g data-name=\"color-palette\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19.54 5.08A10.61 10.61 0 0 0 11.91 2a10 10 0 0 0-.05 20 2.58 2.58 0 0 0 2.53-1.89 2.52 2.52 0 0 0-.57-2.28.5.5 0 0 1 .37-.83h1.65A6.15 6.15 0 0 0 22 11.33a8.48 8.48 0 0 0-2.46-6.25zM15.88 15h-1.65a2.49 2.49 0 0 0-1.87 4.15.49.49 0 0 1 .12.49c-.05.21-.28.34-.59.36a8 8 0 0 1-7.82-9.11A8.1 8.1 0 0 1 11.92 4H12a8.47 8.47 0 0 1 6.1 2.48 6.5 6.5 0 0 1 1.9 4.77A4.17 4.17 0 0 1 15.88 15z\"/><circle cx=\"12\" cy=\"6.5\" r=\"1.5\"/><path d=\"M15.25 7.2a1.5 1.5 0 1 0 2.05.55 1.5 1.5 0 0 0-2.05-.55z\"/><path d=\"M8.75 7.2a1.5 1.5 0 1 0 .55 2.05 1.5 1.5 0 0 0-.55-2.05z\"/><path d=\"M6.16 11.26a1.5 1.5 0 1 0 2.08.4 1.49 1.49 0 0 0-2.08-.4z\"/></g></g>","color-picker-outline":"<g data-name=\"Layer 2\"><g data-name=\"color-picker\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19.4 7.34L16.66 4.6A1.92 1.92 0 0 0 14 4.53l-2 2-1.29-1.24a1 1 0 0 0-1.42 1.42L10.53 8 5 13.53a2 2 0 0 0-.57 1.21L4 18.91a1 1 0 0 0 .29.8A1 1 0 0 0 5 20h.09l4.17-.38a2 2 0 0 0 1.21-.57l5.58-5.58 1.24 1.24a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42l-1.24-1.24 2-2a1.92 1.92 0 0 0-.07-2.71zM9.08 17.62l-3 .28.27-3L12 9.36l2.69 2.7zm7-7L13.36 8l1.91-2L18 8.73z\"/></g></g>","compass-outline":"<g data-name=\"Layer 2\"><g data-name=\"compass\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z\"/><path d=\"M15.68 8.32a1 1 0 0 0-1.1-.25l-4.21 1.7a1 1 0 0 0-.55.55l-1.75 4.26a1 1 0 0 0 .18 1h.05A1 1 0 0 0 9 16a1 1 0 0 0 .38-.07l4.21-1.7a1 1 0 0 0 .55-.55l1.75-4.26a1 1 0 0 0-.21-1.1zm-4.88 4.89l.71-1.74 1.69-.68-.71 1.74z\"/></g></g>","copy-outline":"<g data-name=\"Layer 2\"><g data-name=\"copy\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 21h-6a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3zm-6-10a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1z\"/><path d=\"M9.73 15H5.67A2.68 2.68 0 0 1 3 12.33V5.67A2.68 2.68 0 0 1 5.67 3h6.66A2.68 2.68 0 0 1 15 5.67V9.4h-2V5.67a.67.67 0 0 0-.67-.67H5.67a.67.67 0 0 0-.67.67v6.66a.67.67 0 0 0 .67.67h4.06z\"/></g></g>","corner-down-left-outline":"<g data-name=\"Layer 2\"><g data-name=\"corner-down-left\"><rect x=\".05\" y=\".05\" width=\"24\" height=\"24\" transform=\"rotate(-89.76 12.05 12.05)\" opacity=\"0\"/><path d=\"M20 6a1 1 0 0 0-1-1 1 1 0 0 0-1 1v5a1 1 0 0 1-.29.71A1 1 0 0 1 17 12H8.08l2.69-3.39a1 1 0 0 0-1.52-1.17l-4 5a1 1 0 0 0 0 1.25l4 5a1 1 0 0 0 .78.37 1 1 0 0 0 .62-.22 1 1 0 0 0 .15-1.41l-2.66-3.36h8.92a3 3 0 0 0 3-3z\"/></g></g>","corner-down-right-outline":"<g data-name=\"Layer 2\"><g data-name=\"corner-down-right\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M19.78 12.38l-4-5a1 1 0 0 0-1.56 1.24l2.7 3.38H8a1 1 0 0 1-1-1V6a1 1 0 0 0-2 0v5a3 3 0 0 0 3 3h8.92l-2.7 3.38a1 1 0 0 0 .16 1.4A1 1 0 0 0 15 19a1 1 0 0 0 .78-.38l4-5a1 1 0 0 0 0-1.24z\"/></g></g>","corner-left-down-outline":"<g data-name=\"Layer 2\"><g data-name=\"corner-left-down\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 5h-5a3 3 0 0 0-3 3v8.92l-3.38-2.7a1 1 0 0 0-1.24 1.56l5 4a1 1 0 0 0 1.24 0l5-4a1 1 0 1 0-1.24-1.56L12 16.92V8a1 1 0 0 1 1-1h5a1 1 0 0 0 0-2z\"/></g></g>","corner-left-up-outline":"<g data-name=\"Layer 2\"><g data-name=\"corner-left-up\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M18 17h-5a1 1 0 0 1-1-1V7.08l3.38 2.7A1 1 0 0 0 16 10a1 1 0 0 0 .78-.38 1 1 0 0 0-.16-1.4l-5-4a1 1 0 0 0-1.24 0l-5 4a1 1 0 0 0 1.24 1.56L10 7.08V16a3 3 0 0 0 3 3h5a1 1 0 0 0 0-2z\"/></g></g>","corner-right-down-outline":"<g data-name=\"Layer 2\"><g data-name=\"corner-right-down\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18.78 14.38a1 1 0 0 0-1.4-.16L14 16.92V8a3 3 0 0 0-3-3H6a1 1 0 0 0 0 2h5a1 1 0 0 1 1 1v8.92l-3.38-2.7a1 1 0 0 0-1.24 1.56l5 4a1 1 0 0 0 1.24 0l5-4a1 1 0 0 0 .16-1.4z\"/></g></g>","corner-right-up-outline":"<g data-name=\"Layer 2\"><g data-name=\"corner-right-up\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M18.62 8.22l-5-4a1 1 0 0 0-1.24 0l-5 4a1 1 0 0 0 1.24 1.56L12 7.08V16a1 1 0 0 1-1 1H6a1 1 0 0 0 0 2h5a3 3 0 0 0 3-3V7.08l3.38 2.7A1 1 0 0 0 18 10a1 1 0 0 0 .78-.38 1 1 0 0 0-.16-1.4z\"/></g></g>","corner-up-left-outline":"<g data-name=\"Layer 2\"><g data-name=\"corner-up-left\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M16 10H7.08l2.7-3.38a1 1 0 1 0-1.56-1.24l-4 5a1 1 0 0 0 0 1.24l4 5A1 1 0 0 0 9 17a1 1 0 0 0 .62-.22 1 1 0 0 0 .16-1.4L7.08 12H16a1 1 0 0 1 1 1v5a1 1 0 0 0 2 0v-5a3 3 0 0 0-3-3z\"/></g></g>","corner-up-right-outline":"<g data-name=\"Layer 2\"><g data-name=\"corner-up-right\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M19.78 10.38l-4-5a1 1 0 0 0-1.56 1.24l2.7 3.38H8a3 3 0 0 0-3 3v5a1 1 0 0 0 2 0v-5a1 1 0 0 1 1-1h8.92l-2.7 3.38a1 1 0 0 0 .16 1.4A1 1 0 0 0 15 17a1 1 0 0 0 .78-.38l4-5a1 1 0 0 0 0-1.24z\"/></g></g>","credit-card-outline":"<g data-name=\"Layer 2\"><g data-name=\"credit-card\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19 5H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3zM4 8a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v1H4zm16 8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5h16z\"/><path d=\"M7 15h4a1 1 0 0 0 0-2H7a1 1 0 0 0 0 2z\"/><path d=\"M15 15h2a1 1 0 0 0 0-2h-2a1 1 0 0 0 0 2z\"/></g></g>","crop-outline":"<g data-name=\"Layer 2\"><g data-name=\"crop\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21 16h-3V8.56A2.56 2.56 0 0 0 15.44 6H8V3a1 1 0 0 0-2 0v3H3a1 1 0 0 0 0 2h3v7.44A2.56 2.56 0 0 0 8.56 18H16v3a1 1 0 0 0 2 0v-3h3a1 1 0 0 0 0-2zM8.56 16a.56.56 0 0 1-.56-.56V8h7.44a.56.56 0 0 1 .56.56V16z\"/></g></g>","cube-outline":"<g data-name=\"Layer 2\"><g data-name=\"cube\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.66 7.26c0-.07-.1-.14-.15-.21l-.09-.1a2.5 2.5 0 0 0-.86-.68l-6.4-3a2.7 2.7 0 0 0-2.26 0l-6.4 3a2.6 2.6 0 0 0-.86.68L3.52 7a1 1 0 0 0-.15.2A2.39 2.39 0 0 0 3 8.46v7.06a2.49 2.49 0 0 0 1.46 2.26l6.4 3a2.7 2.7 0 0 0 2.27 0l6.4-3A2.49 2.49 0 0 0 21 15.54V8.46a2.39 2.39 0 0 0-.34-1.2zm-8.95-2.2a.73.73 0 0 1 .58 0l5.33 2.48L12 10.15 6.38 7.54zM5.3 16a.47.47 0 0 1-.3-.43V9.1l6 2.79v6.72zm13.39 0L13 18.61v-6.72l6-2.79v6.44a.48.48 0 0 1-.31.46z\"/></g></g>","diagonal-arrow-left-down-outline":"<g data-name=\"Layer 2\"><g data-name=\"diagonal-arrow-left-down\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M17.71 6.29a1 1 0 0 0-1.42 0L8 14.59V9a1 1 0 0 0-2 0v8a1 1 0 0 0 1 1h8a1 1 0 0 0 0-2H9.41l8.3-8.29a1 1 0 0 0 0-1.42z\"/></g></g>","diagonal-arrow-left-up-outline":"<g data-name=\"Layer 2\"><g data-name=\"diagonal-arrow-left-up\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M17.71 16.29L9.42 8H15a1 1 0 0 0 0-2H7.05a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1H7a1 1 0 0 0 1-1V9.45l8.26 8.26a1 1 0 0 0 1.42 0 1 1 0 0 0 .03-1.42z\"/></g></g>","diagonal-arrow-right-down-outline":"<g data-name=\"Layer 2\"><g data-name=\"diagonal-arrow-right-down\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M17 8a1 1 0 0 0-1 1v5.59l-8.29-8.3a1 1 0 0 0-1.42 1.42l8.3 8.29H9a1 1 0 0 0 0 2h8a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1z\"/></g></g>","diagonal-arrow-right-up-outline":"<g data-name=\"Layer 2\"><g data-name=\"diagonal-arrow-right-up\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M18 7.05a1 1 0 0 0-1-1L9 6a1 1 0 0 0 0 2h5.56l-8.27 8.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0L16 9.42V15a1 1 0 0 0 1 1 1 1 0 0 0 1-1z\"/></g></g>","done-all-outline":"<g data-name=\"Layer 2\"><g data-name=\"done-all\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M16.62 6.21a1 1 0 0 0-1.41.17l-7 9-3.43-4.18a1 1 0 1 0-1.56 1.25l4.17 5.18a1 1 0 0 0 .78.37 1 1 0 0 0 .83-.38l7.83-10a1 1 0 0 0-.21-1.41z\"/><path d=\"M21.62 6.21a1 1 0 0 0-1.41.17l-7 9-.61-.75-1.26 1.62 1.1 1.37a1 1 0 0 0 .78.37 1 1 0 0 0 .78-.38l7.83-10a1 1 0 0 0-.21-1.4z\"/><path d=\"M8.71 13.06L10 11.44l-.2-.24a1 1 0 0 0-1.43-.2 1 1 0 0 0-.15 1.41z\"/></g></g>","download-outline":"<g data-name=\"Layer 2\"><g data-name=\"download\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><rect x=\"4\" y=\"18\" width=\"16\" height=\"2\" rx=\"1\" ry=\"1\"/><rect x=\"3\" y=\"17\" width=\"4\" height=\"2\" rx=\"1\" ry=\"1\" transform=\"rotate(-90 5 18)\"/><rect x=\"17\" y=\"17\" width=\"4\" height=\"2\" rx=\"1\" ry=\"1\" transform=\"rotate(-90 19 18)\"/><path d=\"M12 15a1 1 0 0 1-.58-.18l-4-2.82a1 1 0 0 1-.24-1.39 1 1 0 0 1 1.4-.24L12 12.76l3.4-2.56a1 1 0 0 1 1.2 1.6l-4 3a1 1 0 0 1-.6.2z\"/><path d=\"M12 13a1 1 0 0 1-1-1V4a1 1 0 0 1 2 0v8a1 1 0 0 1-1 1z\"/></g></g>","droplet-off-outline":"<g data-name=\"Layer 2\"><g data-name=\"droplet-off-outline\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 19a5.4 5.4 0 0 1-3.88-1.64 5.73 5.73 0 0 1-.69-7.11L6 8.82a7.74 7.74 0 0 0 .7 9.94A7.37 7.37 0 0 0 12 21a7.36 7.36 0 0 0 4.58-1.59L15.15 18A5.43 5.43 0 0 1 12 19z\"/><path d=\"M12 5.43l3.88 4a5.71 5.71 0 0 1 1.49 5.15L19 16.15A7.72 7.72 0 0 0 17.31 8l-4.6-4.7A1 1 0 0 0 12 3a1 1 0 0 0-.72.3L8.73 5.9l1.42 1.42z\"/><path d=\"M20.71 19.29l-16-16a1 1 0 0 0-1.42 1.42l16 16a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z\"/></g></g>","droplet-outline":"<g data-name=\"Layer 2\"><g data-name=\"droplet-outline\"><rect x=\".1\" y=\".1\" width=\"24\" height=\"24\" transform=\"rotate(.48 11.987 11.887)\" opacity=\"0\"/><path d=\"M12 21.1a7.4 7.4 0 0 1-5.28-2.28 7.73 7.73 0 0 1 .1-10.77l4.64-4.65a.94.94 0 0 1 .71-.3 1 1 0 0 1 .71.31l4.56 4.72a7.73 7.73 0 0 1-.09 10.77A7.33 7.33 0 0 1 12 21.1zm.13-15.57L8.24 9.45a5.74 5.74 0 0 0-.07 8A5.43 5.43 0 0 0 12 19.1a5.42 5.42 0 0 0 3.9-1.61 5.72 5.72 0 0 0 .06-8z\"/></g></g>","edit-2-outline":"<g data-name=\"Layer 2\"><g data-name=\"edit-2\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19 20H5a1 1 0 0 0 0 2h14a1 1 0 0 0 0-2z\"/><path d=\"M5 18h.09l4.17-.38a2 2 0 0 0 1.21-.57l9-9a1.92 1.92 0 0 0-.07-2.71L16.66 2.6A2 2 0 0 0 14 2.53l-9 9a2 2 0 0 0-.57 1.21L4 16.91a1 1 0 0 0 .29.8A1 1 0 0 0 5 18zM15.27 4L18 6.73l-2 1.95L13.32 6zm-8.9 8.91L12 7.32l2.7 2.7-5.6 5.6-3 .28z\"/></g></g>","edit-outline":"<g data-name=\"Layer 2\"><g data-name=\"edit\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19.4 7.34L16.66 4.6A2 2 0 0 0 14 4.53l-9 9a2 2 0 0 0-.57 1.21L4 18.91a1 1 0 0 0 .29.8A1 1 0 0 0 5 20h.09l4.17-.38a2 2 0 0 0 1.21-.57l9-9a1.92 1.92 0 0 0-.07-2.71zM9.08 17.62l-3 .28.27-3L12 9.32l2.7 2.7zM16 10.68L13.32 8l1.95-2L18 8.73z\"/></g></g>","email-outline":"<g data-name=\"Layer 2\"><g data-name=\"email\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19 4H5a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-.67 2L12 10.75 5.67 6zM19 18H5a1 1 0 0 1-1-1V7.25l7.4 5.55a1 1 0 0 0 .6.2 1 1 0 0 0 .6-.2L20 7.25V17a1 1 0 0 1-1 1z\"/></g></g>","expand-outline":"<g data-name=\"Layer 2\"><g data-name=\"expand\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M20 5a1 1 0 0 0-1-1h-5a1 1 0 0 0 0 2h2.57l-3.28 3.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0L18 7.42V10a1 1 0 0 0 1 1 1 1 0 0 0 1-1z\"/><path d=\"M10.71 13.29a1 1 0 0 0-1.42 0L6 16.57V14a1 1 0 0 0-1-1 1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 0-2H7.42l3.29-3.29a1 1 0 0 0 0-1.42z\"/></g></g>","external-link-outline":"<g data-name=\"Layer 2\"><g data-name=\"external-link\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20 11a1 1 0 0 0-1 1v6a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6a1 1 0 0 0 0-2H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-6a1 1 0 0 0-1-1z\"/><path d=\"M16 5h1.58l-6.29 6.28a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0L19 6.42V8a1 1 0 0 0 1 1 1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-4a1 1 0 0 0 0 2z\"/></g></g>","eye-off-2-outline":"<g data-name=\"Layer 2\"><g data-name=\"eye-off-2\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M17.81 13.39A8.93 8.93 0 0 0 21 7.62a1 1 0 1 0-2-.24 7.07 7.07 0 0 1-14 0 1 1 0 1 0-2 .24 8.93 8.93 0 0 0 3.18 5.77l-2.3 2.32a1 1 0 0 0 1.41 1.41l2.61-2.6a9.06 9.06 0 0 0 3.1.92V19a1 1 0 0 0 2 0v-3.56a9.06 9.06 0 0 0 3.1-.92l2.61 2.6a1 1 0 0 0 1.41-1.41z\"/></g></g>","eye-off-outline":"<g data-name=\"Layer 2\"><g data-name=\"eye-off\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M4.71 3.29a1 1 0 0 0-1.42 1.42l5.63 5.63a3.5 3.5 0 0 0 4.74 4.74l5.63 5.63a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42zM12 13.5a1.5 1.5 0 0 1-1.5-1.5v-.07l1.56 1.56z\"/><path d=\"M12.22 17c-4.3.1-7.12-3.59-8-5a13.7 13.7 0 0 1 2.24-2.72L5 7.87a15.89 15.89 0 0 0-2.87 3.63 1 1 0 0 0 0 1c.63 1.09 4 6.5 9.89 6.5h.25a9.48 9.48 0 0 0 3.23-.67l-1.58-1.58a7.74 7.74 0 0 1-1.7.25z\"/><path d=\"M21.87 11.5c-.64-1.11-4.17-6.68-10.14-6.5a9.48 9.48 0 0 0-3.23.67l1.58 1.58a7.74 7.74 0 0 1 1.7-.25c4.29-.11 7.11 3.59 8 5a13.7 13.7 0 0 1-2.29 2.72L19 16.13a15.89 15.89 0 0 0 2.91-3.63 1 1 0 0 0-.04-1z\"/></g></g>","eye-outline":"<g data-name=\"Layer 2\"><g data-name=\"eye\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21.87 11.5c-.64-1.11-4.16-6.68-10.14-6.5-5.53.14-8.73 5-9.6 6.5a1 1 0 0 0 0 1c.63 1.09 4 6.5 9.89 6.5h.25c5.53-.14 8.74-5 9.6-6.5a1 1 0 0 0 0-1zM12.22 17c-4.31.1-7.12-3.59-8-5 1-1.61 3.61-4.9 7.61-5 4.29-.11 7.11 3.59 8 5-1.03 1.61-3.61 4.9-7.61 5z\"/><path d=\"M12 8.5a3.5 3.5 0 1 0 3.5 3.5A3.5 3.5 0 0 0 12 8.5zm0 5a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5z\"/></g></g>","facebook-outline":"<g data-name=\"Layer 2\"><g data-name=\"facebook\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M13 22H9a1 1 0 0 1-1-1v-6.2H6a1 1 0 0 1-1-1v-3.6a1 1 0 0 1 1-1h2V7.5A5.77 5.77 0 0 1 14 2h3a1 1 0 0 1 1 1v3.6a1 1 0 0 1-1 1h-3v1.6h3a1 1 0 0 1 .8.39 1 1 0 0 1 .16.88l-1 3.6a1 1 0 0 1-1 .73H14V21a1 1 0 0 1-1 1zm-3-2h2v-6.2a1 1 0 0 1 1-1h2.24l.44-1.6H13a1 1 0 0 1-1-1V7.5a2 2 0 0 1 2-1.9h2V4h-2a3.78 3.78 0 0 0-4 3.5v2.7a1 1 0 0 1-1 1H7v1.6h2a1 1 0 0 1 1 1z\"/></g></g>","file-add-outline":"<g data-name=\"Layer 2\"><g data-name=\"file-add\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19.74 8.33l-5.44-6a1 1 0 0 0-.74-.33h-7A2.53 2.53 0 0 0 4 4.5v15A2.53 2.53 0 0 0 6.56 22h10.88A2.53 2.53 0 0 0 20 19.5V9a1 1 0 0 0-.26-.67zM14 5l2.74 3h-2a.79.79 0 0 1-.74-.85zm3.44 15H6.56a.53.53 0 0 1-.56-.5v-15a.53.53 0 0 1 .56-.5H12v3.15A2.79 2.79 0 0 0 14.71 10H18v9.5a.53.53 0 0 1-.56.5z\"/><path d=\"M14 13h-1v-1a1 1 0 0 0-2 0v1h-1a1 1 0 0 0 0 2h1v1a1 1 0 0 0 2 0v-1h1a1 1 0 0 0 0-2z\"/></g></g>","file-outline":"<g data-name=\"Layer 2\"><g data-name=\"file\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19.74 8.33l-5.44-6a1 1 0 0 0-.74-.33h-7A2.53 2.53 0 0 0 4 4.5v15A2.53 2.53 0 0 0 6.56 22h10.88A2.53 2.53 0 0 0 20 19.5V9a1 1 0 0 0-.26-.67zM17.65 9h-3.94a.79.79 0 0 1-.71-.85V4h.11zm-.21 11H6.56a.53.53 0 0 1-.56-.5v-15a.53.53 0 0 1 .56-.5H11v4.15A2.79 2.79 0 0 0 13.71 11H18v8.5a.53.53 0 0 1-.56.5z\"/></g></g>","file-remove-outline":"<g data-name=\"Layer 2\"><g data-name=\"file-remove\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19.74 8.33l-5.44-6a1 1 0 0 0-.74-.33h-7A2.53 2.53 0 0 0 4 4.5v15A2.53 2.53 0 0 0 6.56 22h10.88A2.53 2.53 0 0 0 20 19.5V9a1 1 0 0 0-.26-.67zM14 5l2.74 3h-2a.79.79 0 0 1-.74-.85zm3.44 15H6.56a.53.53 0 0 1-.56-.5v-15a.53.53 0 0 1 .56-.5H12v3.15A2.79 2.79 0 0 0 14.71 10H18v9.5a.53.53 0 0 1-.56.5z\"/><path d=\"M14 13h-4a1 1 0 0 0 0 2h4a1 1 0 0 0 0-2z\"/></g></g>","file-text-outline":"<g data-name=\"Layer 2\"><g data-name=\"file-text\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M15 16H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2z\"/><path d=\"M9 14h3a1 1 0 0 0 0-2H9a1 1 0 0 0 0 2z\"/><path d=\"M19.74 8.33l-5.44-6a1 1 0 0 0-.74-.33h-7A2.53 2.53 0 0 0 4 4.5v15A2.53 2.53 0 0 0 6.56 22h10.88A2.53 2.53 0 0 0 20 19.5V9a1 1 0 0 0-.26-.67zM14 5l2.74 3h-2a.79.79 0 0 1-.74-.85zm3.44 15H6.56a.53.53 0 0 1-.56-.5v-15a.53.53 0 0 1 .56-.5H12v3.15A2.79 2.79 0 0 0 14.71 10H18v9.5a.53.53 0 0 1-.56.5z\"/></g></g>","film-outline":"<g data-name=\"Layer 2\"><g data-name=\"film\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18.26 3H5.74A2.74 2.74 0 0 0 3 5.74v12.52A2.74 2.74 0 0 0 5.74 21h12.52A2.74 2.74 0 0 0 21 18.26V5.74A2.74 2.74 0 0 0 18.26 3zM7 11H5V9h2zm-2 2h2v2H5zm4-8h6v14H9zm10 6h-2V9h2zm-2 2h2v2h-2zm2-7.26V7h-2V5h1.26a.74.74 0 0 1 .74.74zM5.74 5H7v2H5V5.74A.74.74 0 0 1 5.74 5zM5 18.26V17h2v2H5.74a.74.74 0 0 1-.74-.74zm14 0a.74.74 0 0 1-.74.74H17v-2h2z\"/></g></g>","flag-outline":"<g data-name=\"Layer 2\"><g data-name=\"flag\"><polyline points=\"24 24 0 24 0 0\" opacity=\"0\"/><path d=\"M19.27 4.68a1.79 1.79 0 0 0-1.6-.25 7.53 7.53 0 0 1-2.17.28 8.54 8.54 0 0 1-3.13-.78A10.15 10.15 0 0 0 8.5 3c-2.89 0-4 1-4.2 1.14a1 1 0 0 0-.3.72V20a1 1 0 0 0 2 0v-4.3a6.28 6.28 0 0 1 2.5-.41 8.54 8.54 0 0 1 3.13.78 10.15 10.15 0 0 0 3.87.93 7.66 7.66 0 0 0 3.5-.7 1.74 1.74 0 0 0 1-1.55V6.11a1.77 1.77 0 0 0-.73-1.43zM18 14.59a6.32 6.32 0 0 1-2.5.41 8.36 8.36 0 0 1-3.13-.79 10.34 10.34 0 0 0-3.87-.92 9.51 9.51 0 0 0-2.5.29V5.42A6.13 6.13 0 0 1 8.5 5a8.36 8.36 0 0 1 3.13.79 10.34 10.34 0 0 0 3.87.92 9.41 9.41 0 0 0 2.5-.3z\"/></g></g>","flash-off-outline":"<g data-name=\"Layer 2\"><g data-name=\"flash-off\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.71 19.29l-16-16a1 1 0 0 0-1.42 1.42l16 16a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z\"/><path d=\"M12.54 18.06l.27-2.42L10 12.8H6.87l1.24-1.86L6.67 9.5l-2.5 3.74A1 1 0 0 0 5 14.8h5.89l-.77 7.09a1 1 0 0 0 .65 1.05 1 1 0 0 0 .34.06 1 1 0 0 0 .83-.44l3.12-4.67-1.44-1.44z\"/><path d=\"M11.46 5.94l-.27 2.42L14 11.2h3.1l-1.24 1.86 1.44 1.44 2.5-3.74A1 1 0 0 0 19 9.2h-5.89l.77-7.09a1 1 0 0 0-.65-1 1 1 0 0 0-1.17.38L8.94 6.11l1.44 1.44z\"/></g></g>","flash-outline":"<g data-name=\"Layer 2\"><g data-name=\"flash\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M11.11 23a1 1 0 0 1-.34-.06 1 1 0 0 1-.65-1.05l.77-7.09H5a1 1 0 0 1-.83-1.56l7.89-11.8a1 1 0 0 1 1.17-.38 1 1 0 0 1 .65 1l-.77 7.14H19a1 1 0 0 1 .83 1.56l-7.89 11.8a1 1 0 0 1-.83.44zM6.87 12.8H12a1 1 0 0 1 .74.33 1 1 0 0 1 .25.78l-.45 4.15 4.59-6.86H12a1 1 0 0 1-1-1.11l.45-4.15z\"/></g></g>","flip-2-outline":"<g data-name=\"Layer 2\"><g data-name=\"flip-2\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M6.09 19h12l-1.3 1.29a1 1 0 0 0 1.42 1.42l3-3a1 1 0 0 0 0-1.42l-3-3a1 1 0 0 0-1.42 0 1 1 0 0 0 0 1.42l1.3 1.29h-12a1.56 1.56 0 0 1-1.59-1.53V13a1 1 0 0 0-2 0v2.47A3.56 3.56 0 0 0 6.09 19z\"/><path d=\"M5.79 9.71a1 1 0 1 0 1.42-1.42L5.91 7h12a1.56 1.56 0 0 1 1.59 1.53V11a1 1 0 0 0 2 0V8.53A3.56 3.56 0 0 0 17.91 5h-12l1.3-1.29a1 1 0 0 0 0-1.42 1 1 0 0 0-1.42 0l-3 3a1 1 0 0 0 0 1.42z\"/></g></g>","flip-outline":"<g data-name=\"Layer 2\"><g data-name=\"flip-in\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M5 6.09v12l-1.29-1.3a1 1 0 0 0-1.42 1.42l3 3a1 1 0 0 0 1.42 0l3-3a1 1 0 0 0 0-1.42 1 1 0 0 0-1.42 0L7 18.09v-12A1.56 1.56 0 0 1 8.53 4.5H11a1 1 0 0 0 0-2H8.53A3.56 3.56 0 0 0 5 6.09z\"/><path d=\"M14.29 5.79a1 1 0 0 0 1.42 1.42L17 5.91v12a1.56 1.56 0 0 1-1.53 1.59H13a1 1 0 0 0 0 2h2.47A3.56 3.56 0 0 0 19 17.91v-12l1.29 1.3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42l-3-3a1 1 0 0 0-1.42 0z\"/></g></g>","folder-add-outline":"<g data-name=\"Layer 2\"><g data-name=\"folder-add\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M14 13h-1v-1a1 1 0 0 0-2 0v1h-1a1 1 0 0 0 0 2h1v1a1 1 0 0 0 2 0v-1h1a1 1 0 0 0 0-2z\"/><path d=\"M19.5 7.05h-7L9.87 3.87a1 1 0 0 0-.77-.37H4.5A2.47 2.47 0 0 0 2 5.93v12.14a2.47 2.47 0 0 0 2.5 2.43h15a2.47 2.47 0 0 0 2.5-2.43V9.48a2.47 2.47 0 0 0-2.5-2.43zm.5 11a.46.46 0 0 1-.5.43h-15a.46.46 0 0 1-.5-.43V5.93a.46.46 0 0 1 .5-.43h4.13l2.6 3.18a1 1 0 0 0 .77.37h7.5a.46.46 0 0 1 .5.43z\"/></g></g>","folder-outline":"<g data-name=\"Layer 2\"><g data-name=\"folder\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19.5 20.5h-15A2.47 2.47 0 0 1 2 18.07V5.93A2.47 2.47 0 0 1 4.5 3.5h4.6a1 1 0 0 1 .77.37l2.6 3.18h7A2.47 2.47 0 0 1 22 9.48v8.59a2.47 2.47 0 0 1-2.5 2.43zM4 13.76v4.31a.46.46 0 0 0 .5.43h15a.46.46 0 0 0 .5-.43V9.48a.46.46 0 0 0-.5-.43H12a1 1 0 0 1-.77-.37L8.63 5.5H4.5a.46.46 0 0 0-.5.43z\"/></g></g>","folder-remove-outline":"<g data-name=\"Layer 2\"><g data-name=\"folder-remove\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M14 13h-4a1 1 0 0 0 0 2h4a1 1 0 0 0 0-2z\"/><path d=\"M19.5 7.05h-7L9.87 3.87a1 1 0 0 0-.77-.37H4.5A2.47 2.47 0 0 0 2 5.93v12.14a2.47 2.47 0 0 0 2.5 2.43h15a2.47 2.47 0 0 0 2.5-2.43V9.48a2.47 2.47 0 0 0-2.5-2.43zm.5 11a.46.46 0 0 1-.5.43h-15a.46.46 0 0 1-.5-.43V5.93a.46.46 0 0 1 .5-.43h4.13l2.6 3.18a1 1 0 0 0 .77.37h7.5a.46.46 0 0 1 .5.43z\"/></g></g>","funnel-outline":"<g data-name=\"Layer 2\"><g data-name=\"funnel\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M13.9 22a1 1 0 0 1-.6-.2l-4-3.05a1 1 0 0 1-.39-.8v-3.27l-4.8-9.22A1 1 0 0 1 5 4h14a1 1 0 0 1 .86.49 1 1 0 0 1 0 1l-5 9.21V21a1 1 0 0 1-.55.9 1 1 0 0 1-.41.1zm-3-4.54l2 1.53v-4.55A1 1 0 0 1 13 14l4.3-8H6.64l4.13 8a1 1 0 0 1 .11.46z\"/></g></g>","gift-outline":"<g data-name=\"Layer 2\"><g data-name=\"gift\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M19.2 7h-.39A3 3 0 0 0 19 6a3.08 3.08 0 0 0-3.14-3A4.46 4.46 0 0 0 12 5.4 4.46 4.46 0 0 0 8.14 3 3.08 3.08 0 0 0 5 6a3 3 0 0 0 .19 1H4.8A2 2 0 0 0 3 9.2v3.6A2.08 2.08 0 0 0 4.5 15v4.37A1.75 1.75 0 0 0 6.31 21h11.38a1.75 1.75 0 0 0 1.81-1.67V15a2.08 2.08 0 0 0 1.5-2.2V9.2A2 2 0 0 0 19.2 7zM19 9.2v3.6a.56.56 0 0 1 0 .2h-6V9h6a.56.56 0 0 1 0 .2zM15.86 5A1.08 1.08 0 0 1 17 6a1.08 1.08 0 0 1-1.14 1H13.4a2.93 2.93 0 0 1 2.46-2zM7 6a1.08 1.08 0 0 1 1.14-1 2.93 2.93 0 0 1 2.45 2H8.14A1.08 1.08 0 0 1 7 6zM5 9.2A.56.56 0 0 1 5 9h6v4H5a.56.56 0 0 1 0-.2zM6.5 15H11v4H6.5zm6.5 4v-4h4.5v4z\"/></g></g>","github-outline":"<g data-name=\"Layer 2\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"\"/></g>","globe-2-outline":"<g data-name=\"Layer 2\"><g data-name=\"globe-2\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 2a8.19 8.19 0 0 1 1.79.21 2.61 2.61 0 0 1-.78 1c-.22.17-.46.31-.7.46a4.56 4.56 0 0 0-1.85 1.67 6.49 6.49 0 0 0-.62 3.3c0 1.36 0 2.16-.95 2.87-1.37 1.07-3.46.47-4.76-.07A8.33 8.33 0 0 1 4 12a8 8 0 0 1 8-8zM5 15.8a8.42 8.42 0 0 0 2 .27 5 5 0 0 0 3.14-1c1.71-1.34 1.71-3.06 1.71-4.44a4.76 4.76 0 0 1 .37-2.34 2.86 2.86 0 0 1 1.12-.91 9.75 9.75 0 0 0 .92-.61 4.55 4.55 0 0 0 1.4-1.87A8 8 0 0 1 19 8.12c-1.43.2-3.46.67-3.86 2.53A7 7 0 0 0 15 12a2.93 2.93 0 0 1-.29 1.47l-.1.17c-.65 1.08-1.38 2.31-.39 4 .12.21.25.41.38.61a2.29 2.29 0 0 1 .52 1.08A7.89 7.89 0 0 1 12 20a8 8 0 0 1-7-4.2zm11.93 2.52a6.79 6.79 0 0 0-.63-1.14c-.11-.16-.22-.32-.32-.49-.39-.68-.25-1 .38-2l.1-.17a4.77 4.77 0 0 0 .54-2.43 5.42 5.42 0 0 1 .09-1c.16-.73 1.71-.93 2.67-1a7.94 7.94 0 0 1-2.86 8.28z\"/></g></g>","globe-outline":"<g data-name=\"Layer 2\"><g data-name=\"globe\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M22 12A10 10 0 0 0 12 2a10 10 0 0 0 0 20 10 10 0 0 0 10-10zm-2.07-1H17a12.91 12.91 0 0 0-2.33-6.54A8 8 0 0 1 19.93 11zM9.08 13H15a11.44 11.44 0 0 1-3 6.61A11 11 0 0 1 9.08 13zm0-2A11.4 11.4 0 0 1 12 4.4a11.19 11.19 0 0 1 3 6.6zm.36-6.57A13.18 13.18 0 0 0 7.07 11h-3a8 8 0 0 1 5.37-6.57zM4.07 13h3a12.86 12.86 0 0 0 2.35 6.56A8 8 0 0 1 4.07 13zm10.55 6.55A13.14 13.14 0 0 0 17 13h2.95a8 8 0 0 1-5.33 6.55z\"/></g></g>","google-outline":"<g data-name=\"Layer 2\"><g data-name=\"google\"><polyline points=\"0 0 24 0 24 24 0 24\" opacity=\"0\"/><path d=\"M12 22h-.43A10.16 10.16 0 0 1 2 12.29a10 10 0 0 1 14.12-9.41 1.48 1.48 0 0 1 .77.86 1.47 1.47 0 0 1-.1 1.16L15.5 7.28a1.44 1.44 0 0 1-1.83.64A4.5 4.5 0 0 0 8.77 9a4.41 4.41 0 0 0-1.16 3.34 4.36 4.36 0 0 0 1.66 3 4.52 4.52 0 0 0 3.45 1 3.89 3.89 0 0 0 2.63-1.57h-2.9A1.45 1.45 0 0 1 11 13.33v-2.68a1.45 1.45 0 0 1 1.45-1.45h8.1A1.46 1.46 0 0 1 22 10.64v1.88A10 10 0 0 1 12 22zm0-18a8 8 0 0 0-8 8.24A8.12 8.12 0 0 0 11.65 20 8 8 0 0 0 20 12.42V11.2h-7v1.58h5.31l-.41 1.3a6 6 0 0 1-4.9 4.25A6.58 6.58 0 0 1 8 17a6.33 6.33 0 0 1-.72-9.3A6.52 6.52 0 0 1 14 5.91l.77-1.43A7.9 7.9 0 0 0 12 4z\"/></g></g>","grid-outline":"<g data-name=\"Layer 2\"><g data-name=\"grid\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M9 3H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM5 9V5h4v4z\"/><path d=\"M19 3h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-4 6V5h4v4z\"/><path d=\"M9 13H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2zm-4 6v-4h4v4z\"/><path d=\"M19 13h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2zm-4 6v-4h4v4z\"/></g></g>","hard-drive-outline":"<g data-name=\"Layer 2\"><g data-name=\"hard-drive\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.79 11.34l-3.34-6.68A3 3 0 0 0 14.76 3H9.24a3 3 0 0 0-2.69 1.66l-3.34 6.68a2 2 0 0 0-.21.9V18a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-5.76a2 2 0 0 0-.21-.9zM8.34 5.55a1 1 0 0 1 .9-.55h5.52a1 1 0 0 1 .9.55L18.38 11H5.62zM18 19H6a1 1 0 0 1-1-1v-5h14v5a1 1 0 0 1-1 1z\"/><path d=\"M16 15h-4a1 1 0 0 0 0 2h4a1 1 0 0 0 0-2z\"/><circle cx=\"8\" cy=\"16\" r=\"1\"/></g></g>","hash-outline":"<g data-name=\"Layer 2\"><g data-name=\"hash\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M20 14h-4.3l.73-4H20a1 1 0 0 0 0-2h-3.21l.69-3.81A1 1 0 0 0 16.64 3a1 1 0 0 0-1.22.82L14.67 8h-3.88l.69-3.81A1 1 0 0 0 10.64 3a1 1 0 0 0-1.22.82L8.67 8H4a1 1 0 0 0 0 2h4.3l-.73 4H4a1 1 0 0 0 0 2h3.21l-.69 3.81A1 1 0 0 0 7.36 21a1 1 0 0 0 1.22-.82L9.33 16h3.88l-.69 3.81a1 1 0 0 0 .84 1.19 1 1 0 0 0 1.22-.82l.75-4.18H20a1 1 0 0 0 0-2zM9.7 14l.73-4h3.87l-.73 4z\"/></g></g>","headphones-outline":"<g data-name=\"Layer 2\"><g data-name=\"headphones\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2A10.2 10.2 0 0 0 2 12.37V17a4 4 0 1 0 4-4 3.91 3.91 0 0 0-2 .56v-1.19A8.2 8.2 0 0 1 12 4a8.2 8.2 0 0 1 8 8.37v1.19a3.91 3.91 0 0 0-2-.56 4 4 0 1 0 4 4v-4.63A10.2 10.2 0 0 0 12 2zM6 15a2 2 0 1 1-2 2 2 2 0 0 1 2-2zm12 4a2 2 0 1 1 2-2 2 2 0 0 1-2 2z\"/></g></g>","heart-outline":"<g data-name=\"Layer 2\"><g data-name=\"heart\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 21a1 1 0 0 1-.71-.29l-7.77-7.78a5.26 5.26 0 0 1 0-7.4 5.24 5.24 0 0 1 7.4 0L12 6.61l1.08-1.08a5.24 5.24 0 0 1 7.4 0 5.26 5.26 0 0 1 0 7.4l-7.77 7.78A1 1 0 0 1 12 21zM7.22 6a3.2 3.2 0 0 0-2.28.94 3.24 3.24 0 0 0 0 4.57L12 18.58l7.06-7.07a3.24 3.24 0 0 0 0-4.57 3.32 3.32 0 0 0-4.56 0l-1.79 1.8a1 1 0 0 1-1.42 0L9.5 6.94A3.2 3.2 0 0 0 7.22 6z\"/></g></g>","home-outline":"<g data-name=\"Layer 2\"><g data-name=\"home\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.42 10.18L12.71 2.3a1 1 0 0 0-1.42 0l-7.71 7.89A2 2 0 0 0 3 11.62V20a2 2 0 0 0 1.89 2h14.22A2 2 0 0 0 21 20v-8.38a2.07 2.07 0 0 0-.58-1.44zM10 20v-6h4v6zm9 0h-3v-7a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v7H5v-8.42l7-7.15 7 7.19z\"/></g></g>","image-outline":"<g data-name=\"Layer 2\"><g data-name=\"image\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zM6 5h12a1 1 0 0 1 1 1v8.36l-3.2-2.73a2.77 2.77 0 0 0-3.52 0L5 17.7V6a1 1 0 0 1 1-1zm12 14H6.56l7-5.84a.78.78 0 0 1 .93 0L19 17v1a1 1 0 0 1-1 1z\"/><circle cx=\"8\" cy=\"8.5\" r=\"1.5\"/></g></g>","inbox-outline":"<g data-name=\"Layer 2\"><g data-name=\"inbox\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M20.79 11.34l-3.34-6.68A3 3 0 0 0 14.76 3H9.24a3 3 0 0 0-2.69 1.66l-3.34 6.68a2 2 0 0 0-.21.9V18a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-5.76a2 2 0 0 0-.21-.9zM8.34 5.55a1 1 0 0 1 .9-.55h5.52a1 1 0 0 1 .9.55L18.38 11H16a1 1 0 0 0-1 1v3H9v-3a1 1 0 0 0-1-1H5.62zM18 19H6a1 1 0 0 1-1-1v-5h2v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3h2v5a1 1 0 0 1-1 1z\"/></g></g>","info-outline":"<g data-name=\"Layer 2\"><g data-name=\"info\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z\"/><circle cx=\"12\" cy=\"8\" r=\"1\"/><path d=\"M12 10a1 1 0 0 0-1 1v5a1 1 0 0 0 2 0v-5a1 1 0 0 0-1-1z\"/></g></g>","keypad-outline":"<g data-name=\"Layer 2\"><g data-name=\"keypad\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M5 2a3 3 0 1 0 3 3 3 3 0 0 0-3-3zm0 4a1 1 0 1 1 1-1 1 1 0 0 1-1 1z\"/><path d=\"M12 2a3 3 0 1 0 3 3 3 3 0 0 0-3-3zm0 4a1 1 0 1 1 1-1 1 1 0 0 1-1 1z\"/><path d=\"M19 8a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0-4a1 1 0 1 1-1 1 1 1 0 0 1 1-1z\"/><path d=\"M5 9a3 3 0 1 0 3 3 3 3 0 0 0-3-3zm0 4a1 1 0 1 1 1-1 1 1 0 0 1-1 1z\"/><path d=\"M12 9a3 3 0 1 0 3 3 3 3 0 0 0-3-3zm0 4a1 1 0 1 1 1-1 1 1 0 0 1-1 1z\"/><path d=\"M19 9a3 3 0 1 0 3 3 3 3 0 0 0-3-3zm0 4a1 1 0 1 1 1-1 1 1 0 0 1-1 1z\"/><path d=\"M5 16a3 3 0 1 0 3 3 3 3 0 0 0-3-3zm0 4a1 1 0 1 1 1-1 1 1 0 0 1-1 1z\"/><path d=\"M12 16a3 3 0 1 0 3 3 3 3 0 0 0-3-3zm0 4a1 1 0 1 1 1-1 1 1 0 0 1-1 1z\"/><path d=\"M19 16a3 3 0 1 0 3 3 3 3 0 0 0-3-3zm0 4a1 1 0 1 1 1-1 1 1 0 0 1-1 1z\"/></g></g>","layers-outline":"<g data-name=\"Layer 2\"><g data-name=\"layers\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M21 11.35a1 1 0 0 0-.61-.86l-2.15-.92 2.26-1.3a1 1 0 0 0 .5-.92 1 1 0 0 0-.61-.86l-8-3.41a1 1 0 0 0-.78 0l-8 3.41a1 1 0 0 0-.61.86 1 1 0 0 0 .5.92l2.26 1.3-2.15.92a1 1 0 0 0-.61.86 1 1 0 0 0 .5.92l2.26 1.3-2.15.92a1 1 0 0 0-.61.86 1 1 0 0 0 .5.92l8 4.6a1 1 0 0 0 1 0l8-4.6a1 1 0 0 0 .5-.92 1 1 0 0 0-.61-.86l-2.15-.92 2.26-1.3a1 1 0 0 0 .5-.92zm-9-6.26l5.76 2.45L12 10.85 6.24 7.54zm-.5 7.78a1 1 0 0 0 1 0l3.57-2 1.69.72L12 14.85l-5.76-3.31 1.69-.72zm6.26 2.67L12 18.85l-5.76-3.31 1.69-.72 3.57 2.05a1 1 0 0 0 1 0l3.57-2.05z\"/></g></g>","layout-outline":"<g data-name=\"Layer 2\"><g data-name=\"layout\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zM6 5h12a1 1 0 0 1 1 1v2H5V6a1 1 0 0 1 1-1zM5 18v-8h6v9H6a1 1 0 0 1-1-1zm13 1h-5v-9h6v8a1 1 0 0 1-1 1z\"/></g></g>","link-2-outline":"<g data-name=\"Layer 2\"><g data-name=\"link-2\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M13.29 9.29l-4 4a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l4-4a1 1 0 0 0-1.42-1.42z\"/><path d=\"M12.28 17.4L11 18.67a4.2 4.2 0 0 1-5.58.4 4 4 0 0 1-.27-5.93l1.42-1.43a1 1 0 0 0 0-1.42 1 1 0 0 0-1.42 0l-1.27 1.28a6.15 6.15 0 0 0-.67 8.07 6.06 6.06 0 0 0 9.07.6l1.42-1.42a1 1 0 0 0-1.42-1.42z\"/><path d=\"M19.66 3.22a6.18 6.18 0 0 0-8.13.68L10.45 5a1.09 1.09 0 0 0-.17 1.61 1 1 0 0 0 1.42 0L13 5.3a4.17 4.17 0 0 1 5.57-.4 4 4 0 0 1 .27 5.95l-1.42 1.43a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l1.42-1.42a6.06 6.06 0 0 0-.6-9.06z\"/></g></g>","link-outline":"<g data-name=\"Layer 2\"><g data-name=\"link\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M8 12a1 1 0 0 0 1 1h6a1 1 0 0 0 0-2H9a1 1 0 0 0-1 1z\"/><path d=\"M9 16H7.21A4.13 4.13 0 0 1 3 12.37 4 4 0 0 1 7 8h2a1 1 0 0 0 0-2H7.21a6.15 6.15 0 0 0-6.16 5.21A6 6 0 0 0 7 18h2a1 1 0 0 0 0-2z\"/><path d=\"M23 11.24A6.16 6.16 0 0 0 16.76 6h-1.51C14.44 6 14 6.45 14 7a1 1 0 0 0 1 1h1.79A4.13 4.13 0 0 1 21 11.63 4 4 0 0 1 17 16h-2a1 1 0 0 0 0 2h2a6 6 0 0 0 6-6.76z\"/></g></g>","linkedin-outline":"<g data-name=\"Layer 2\"><g data-name=\"linkedin\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M20 22h-1.67a2 2 0 0 1-2-2v-5.37a.92.92 0 0 0-.69-.93.84.84 0 0 0-.67.19.85.85 0 0 0-.3.65V20a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2v-5.46a6.5 6.5 0 1 1 13 0V20a2 2 0 0 1-2 2zm-4.5-10.31a3.73 3.73 0 0 1 .47 0 2.91 2.91 0 0 1 2.36 2.9V20H20v-5.46a4.5 4.5 0 1 0-9 0V20h1.67v-5.46a2.85 2.85 0 0 1 2.83-2.85z\"/><path d=\"M6 22H4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2zM4 10v10h2V10z\"/><path d=\"M5 7a3 3 0 1 1 3-3 3 3 0 0 1-3 3zm0-4a1 1 0 1 0 1 1 1 1 0 0 0-1-1z\"/></g></g>","list-outline":"<g data-name=\"Layer 2\"><g data-name=\"list\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><circle cx=\"4\" cy=\"7\" r=\"1\"/><circle cx=\"4\" cy=\"12\" r=\"1\"/><circle cx=\"4\" cy=\"17\" r=\"1\"/><rect x=\"7\" y=\"11\" width=\"14\" height=\"2\" rx=\".94\" ry=\".94\"/><rect x=\"7\" y=\"16\" width=\"14\" height=\"2\" rx=\".94\" ry=\".94\"/><rect x=\"7\" y=\"6\" width=\"14\" height=\"2\" rx=\".94\" ry=\".94\"/></g></g>","loader-outline":"<g data-name=\"Layer 2\"><g data-name=\"loader\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M12 2a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0V3a1 1 0 0 0-1-1z\"/><path d=\"M21 11h-2a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2z\"/><path d=\"M6 12a1 1 0 0 0-1-1H3a1 1 0 0 0 0 2h2a1 1 0 0 0 1-1z\"/><path d=\"M6.22 5a1 1 0 0 0-1.39 1.47l1.44 1.39a1 1 0 0 0 .73.28 1 1 0 0 0 .72-.31 1 1 0 0 0 0-1.41z\"/><path d=\"M17 8.14a1 1 0 0 0 .69-.28l1.44-1.39A1 1 0 0 0 17.78 5l-1.44 1.42a1 1 0 0 0 0 1.41 1 1 0 0 0 .66.31z\"/><path d=\"M12 18a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1z\"/><path d=\"M17.73 16.14a1 1 0 0 0-1.39 1.44L17.78 19a1 1 0 0 0 .69.28 1 1 0 0 0 .72-.3 1 1 0 0 0 0-1.42z\"/><path d=\"M6.27 16.14l-1.44 1.39a1 1 0 0 0 0 1.42 1 1 0 0 0 .72.3 1 1 0 0 0 .67-.25l1.44-1.39a1 1 0 0 0-1.39-1.44z\"/></g></g>","lock-outline":"<g data-name=\"Layer 2\"><g data-name=\"lock\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M17 8h-1V6.11a4 4 0 1 0-8 0V8H7a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-8a3 3 0 0 0-3-3zm-7-1.89A2.06 2.06 0 0 1 12 4a2.06 2.06 0 0 1 2 2.11V8h-4zM18 19a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1z\"/><path d=\"M12 12a3 3 0 1 0 3 3 3 3 0 0 0-3-3zm0 4a1 1 0 1 1 1-1 1 1 0 0 1-1 1z\"/></g></g>","log-in-outline":"<g data-name=\"Layer 2\"><g data-name=\"log-in\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M19 4h-2a1 1 0 0 0 0 2h1v12h-1a1 1 0 0 0 0 2h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z\"/><path d=\"M11.8 7.4a1 1 0 0 0-1.6 1.2L12 11H4a1 1 0 0 0 0 2h8.09l-1.72 2.44a1 1 0 0 0 .24 1.4 1 1 0 0 0 .58.18 1 1 0 0 0 .81-.42l2.82-4a1 1 0 0 0 0-1.18z\"/></g></g>","log-out-outline":"<g data-name=\"Layer 2\"><g data-name=\"log-out\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M7 6a1 1 0 0 0 0-2H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h2a1 1 0 0 0 0-2H6V6z\"/><path d=\"M20.82 11.42l-2.82-4a1 1 0 0 0-1.39-.24 1 1 0 0 0-.24 1.4L18.09 11H10a1 1 0 0 0 0 2h8l-1.8 2.4a1 1 0 0 0 .2 1.4 1 1 0 0 0 .6.2 1 1 0 0 0 .8-.4l3-4a1 1 0 0 0 .02-1.18z\"/></g></g>","map-outline":"<g data-name=\"Layer 2\"><g data-name=\"map\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M20.41 5.89l-4-1.8H15.59L12 5.7 8.41 4.09h-.05L8.24 4h-.6l-4 1.8a1 1 0 0 0-.64 1V19a1 1 0 0 0 .46.84A1 1 0 0 0 4 20a1 1 0 0 0 .41-.09L8 18.3l3.59 1.61h.05a.85.85 0 0 0 .72 0h.05L16 18.3l3.59 1.61A1 1 0 0 0 20 20a1 1 0 0 0 .54-.16A1 1 0 0 0 21 19V6.8a1 1 0 0 0-.59-.91zM5 7.44l2-.89v10l-2 .89zm4-.89l2 .89v10l-2-.89zm4 .89l2-.89v10l-2 .89zm6 10l-2-.89v-10l2 .89z\"/></g></g>","maximize-outline":"<g data-name=\"Layer 2\"><g data-name=\"maximize\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.71 19.29l-3.4-3.39A7.92 7.92 0 0 0 19 11a8 8 0 1 0-8 8 7.92 7.92 0 0 0 4.9-1.69l3.39 3.4a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42zM5 11a6 6 0 1 1 6 6 6 6 0 0 1-6-6z\"/><path d=\"M13 10h-1V9a1 1 0 0 0-2 0v1H9a1 1 0 0 0 0 2h1v1a1 1 0 0 0 2 0v-1h1a1 1 0 0 0 0-2z\"/></g></g>","menu-2-outline":"<g data-name=\"Layer 2\"><g data-name=\"menu-2\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><circle cx=\"4\" cy=\"12\" r=\"1\"/><rect x=\"7\" y=\"11\" width=\"14\" height=\"2\" rx=\".94\" ry=\".94\"/><rect x=\"3\" y=\"16\" width=\"18\" height=\"2\" rx=\".94\" ry=\".94\"/><rect x=\"3\" y=\"6\" width=\"18\" height=\"2\" rx=\".94\" ry=\".94\"/></g></g>","menu-arrow-outline":"<g data-name=\"Layer 2\"><g data-name=\"menu-arrow\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M20.05 11H5.91l1.3-1.29a1 1 0 0 0-1.42-1.42l-3 3a1 1 0 0 0 0 1.42l3 3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42L5.91 13h14.14a1 1 0 0 0 .95-.95V12a1 1 0 0 0-.95-1z\"/><rect x=\"3\" y=\"17\" width=\"18\" height=\"2\" rx=\".95\" ry=\".95\"/><rect x=\"3\" y=\"5\" width=\"18\" height=\"2\" rx=\".95\" ry=\".95\"/></g></g>","menu-outline":"<g data-name=\"Layer 2\"><g data-name=\"menu\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><rect x=\"3\" y=\"11\" width=\"18\" height=\"2\" rx=\".95\" ry=\".95\"/><rect x=\"3\" y=\"16\" width=\"18\" height=\"2\" rx=\".95\" ry=\".95\"/><rect x=\"3\" y=\"6\" width=\"18\" height=\"2\" rx=\".95\" ry=\".95\"/></g></g>","message-circle-outline":"<g data-name=\"Layer 2\"><g data-name=\"message-circle\"><circle cx=\"12\" cy=\"12\" r=\"1\"/><circle cx=\"16\" cy=\"12\" r=\"1\"/><circle cx=\"8\" cy=\"12\" r=\"1\"/><path d=\"M19.07 4.93a10 10 0 0 0-16.28 11 1.06 1.06 0 0 1 .09.64L2 20.8a1 1 0 0 0 .27.91A1 1 0 0 0 3 22h.2l4.28-.86a1.26 1.26 0 0 1 .64.09 10 10 0 0 0 11-16.28zm.83 8.36a8 8 0 0 1-11 6.08 3.26 3.26 0 0 0-1.25-.26 3.43 3.43 0 0 0-.56.05l-2.82.57.57-2.82a3.09 3.09 0 0 0-.21-1.81 8 8 0 0 1 6.08-11 8 8 0 0 1 9.19 9.19z\"/><rect width=\"24\" height=\"24\" opacity=\"0\"/></g></g>","message-square-outline":"<g data-name=\"Layer 2\"><g data-name=\"message-square\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><circle cx=\"12\" cy=\"11\" r=\"1\"/><circle cx=\"16\" cy=\"11\" r=\"1\"/><circle cx=\"8\" cy=\"11\" r=\"1\"/><path d=\"M19 3H5a3 3 0 0 0-3 3v15a1 1 0 0 0 .51.87A1 1 0 0 0 3 22a1 1 0 0 0 .51-.14L8 19.14a1 1 0 0 1 .55-.14H19a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zm1 13a1 1 0 0 1-1 1H8.55a3 3 0 0 0-1.55.43l-3 1.8V6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1z\"/></g></g>","mic-off-outline":"<g data-name=\"Layer 2\"><g data-name=\"mic-off\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M10 6a2 2 0 0 1 4 0v5a1 1 0 0 1 0 .16l1.6 1.59A4 4 0 0 0 16 11V6a4 4 0 0 0-7.92-.75L10 7.17z\"/><path d=\"M19 11a1 1 0 0 0-2 0 4.86 4.86 0 0 1-.69 2.48L17.78 15A7 7 0 0 0 19 11z\"/><path d=\"M12 15h.16L8 10.83V11a4 4 0 0 0 4 4z\"/><path d=\"M20.71 19.29l-16-16a1 1 0 0 0-1.42 1.42l16 16a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z\"/><path d=\"M15 20h-2v-2.08a7 7 0 0 0 1.65-.44l-1.6-1.6A4.57 4.57 0 0 1 12 16a5 5 0 0 1-5-5 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V20H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2z\"/></g></g>","mic-outline":"<g data-name=\"Layer 2\"><g data-name=\"mic\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 15a4 4 0 0 0 4-4V6a4 4 0 0 0-8 0v5a4 4 0 0 0 4 4zm-2-9a2 2 0 0 1 4 0v5a2 2 0 0 1-4 0z\"/><path d=\"M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V20H8.89a.89.89 0 0 0-.89.89v.22a.89.89 0 0 0 .89.89h6.22a.89.89 0 0 0 .89-.89v-.22a.89.89 0 0 0-.89-.89H13v-2.08A7 7 0 0 0 19 11z\"/></g></g>","minimize-outline":"<g data-name=\"Layer 2\"><g data-name=\"minimize\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.71 19.29l-3.4-3.39A7.92 7.92 0 0 0 19 11a8 8 0 1 0-8 8 7.92 7.92 0 0 0 4.9-1.69l3.39 3.4a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42zM5 11a6 6 0 1 1 6 6 6 6 0 0 1-6-6z\"/><path d=\"M13 10H9a1 1 0 0 0 0 2h4a1 1 0 0 0 0-2z\"/></g></g>","minus-circle-outline":"<g data-name=\"Layer 2\"><g data-name=\"minus-circle\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z\"/><path d=\"M15 11H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2z\"/></g></g>","minus-outline":"<g data-name=\"Layer 2\"><g data-name=\"minus\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M19 13H5a1 1 0 0 1 0-2h14a1 1 0 0 1 0 2z\"/></g></g>","minus-square-outline":"<g data-name=\"Layer 2\"><g data-name=\"minus-square\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zm1 15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1z\"/><path d=\"M15 11H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2z\"/></g></g>","monitor-outline":"<g data-name=\"Layer 2\"><g data-name=\"monitor\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19 3H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h6v2H7a1 1 0 0 0 0 2h10a1 1 0 0 0 0-2h-4v-2h6a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zm1 11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1z\"/></g></g>","moon-outline":"<g data-name=\"Layer 2\"><g data-name=\"moon\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12.3 22h-.1a10.31 10.31 0 0 1-7.34-3.15 10.46 10.46 0 0 1-.26-14 10.13 10.13 0 0 1 4-2.74 1 1 0 0 1 1.06.22 1 1 0 0 1 .24 1 8.4 8.4 0 0 0 1.94 8.81 8.47 8.47 0 0 0 8.83 1.94 1 1 0 0 1 1.27 1.29A10.16 10.16 0 0 1 19.6 19a10.28 10.28 0 0 1-7.3 3zM7.46 4.92a7.93 7.93 0 0 0-1.37 1.22 8.44 8.44 0 0 0 .2 11.32A8.29 8.29 0 0 0 12.22 20h.08a8.34 8.34 0 0 0 6.78-3.49A10.37 10.37 0 0 1 7.46 4.92z\"/></g></g>","more-horizontal-outline":"<g data-name=\"Layer 2\"><g data-name=\"more-horizotnal\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/><circle cx=\"19\" cy=\"12\" r=\"2\"/><circle cx=\"5\" cy=\"12\" r=\"2\"/></g></g>","more-vertical-outline":"<g data-name=\"Layer 2\"><g data-name=\"more-vertical\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/><circle cx=\"12\" cy=\"5\" r=\"2\"/><circle cx=\"12\" cy=\"19\" r=\"2\"/></g></g>","move-outline":"<g data-name=\"Layer 2\"><g data-name=\"move\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M21.71 11.31l-3-3a1 1 0 0 0-1.42 1.42L18.58 11H13V5.41l1.29 1.3A1 1 0 0 0 15 7a1 1 0 0 0 .71-.29 1 1 0 0 0 0-1.42l-3-3A1 1 0 0 0 12 2a1 1 0 0 0-.7.29l-3 3a1 1 0 0 0 1.41 1.42L11 5.42V11H5.41l1.3-1.29a1 1 0 0 0-1.42-1.42l-3 3A1 1 0 0 0 2 12a1 1 0 0 0 .29.71l3 3A1 1 0 0 0 6 16a1 1 0 0 0 .71-.29 1 1 0 0 0 0-1.42L5.42 13H11v5.59l-1.29-1.3a1 1 0 0 0-1.42 1.42l3 3A1 1 0 0 0 12 22a1 1 0 0 0 .7-.29l3-3a1 1 0 0 0-1.42-1.42L13 18.58V13h5.59l-1.3 1.29a1 1 0 0 0 0 1.42A1 1 0 0 0 18 16a1 1 0 0 0 .71-.29l3-3A1 1 0 0 0 22 12a1 1 0 0 0-.29-.69z\"/></g></g>","music-outline":"<g data-name=\"Layer 2\"><g data-name=\"music\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19 15V4a1 1 0 0 0-.38-.78 1 1 0 0 0-.84-.2l-9 2A1 1 0 0 0 8 6v8.34a3.49 3.49 0 1 0 2 3.18 4.36 4.36 0 0 0 0-.52V6.8l7-1.55v7.09a3.49 3.49 0 1 0 2 3.17 4.57 4.57 0 0 0 0-.51zM6.54 19A1.49 1.49 0 1 1 8 17.21a1.53 1.53 0 0 1 0 .3A1.49 1.49 0 0 1 6.54 19zm9-2A1.5 1.5 0 1 1 17 15.21a1.53 1.53 0 0 1 0 .3A1.5 1.5 0 0 1 15.51 17z\"/></g></g>","navigation-2-outline":"<g data-name=\"Layer 2\"><g data-name=\"navigation-2\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M13.67 22h-.06a1 1 0 0 1-.92-.8L11 13l-8.2-1.69a1 1 0 0 1-.12-1.93l16-5.33A1 1 0 0 1 20 5.32l-5.33 16a1 1 0 0 1-1 .68zm-6.8-11.9l5.19 1.06a1 1 0 0 1 .79.78l1.05 5.19 3.52-10.55z\"/></g></g>","navigation-outline":"<g data-name=\"Layer 2\"><g data-name=\"navigation\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20 20a.94.94 0 0 1-.55-.17L12 14.9l-7.45 4.93a1 1 0 0 1-1.44-1.28l8-16a1 1 0 0 1 1.78 0l8 16a1 1 0 0 1-.23 1.2A1 1 0 0 1 20 20zm-8-7.3a1 1 0 0 1 .55.17l4.88 3.23L12 5.24 6.57 16.1l4.88-3.23a1 1 0 0 1 .55-.17z\"/></g></g>","npm-outline":"<g data-name=\"Layer 2\"><g data-name=\"npm\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 21H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3zM6 5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z\"/><rect x=\"12\" y=\"9\" width=\"4\" height=\"10\"/></g></g>","options-2-outline":"<g data-name=\"Layer 2\"><g data-name=\"options-2\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M19 9a3 3 0 0 0-2.82 2H3a1 1 0 0 0 0 2h13.18A3 3 0 1 0 19 9zm0 4a1 1 0 1 1 1-1 1 1 0 0 1-1 1z\"/><path d=\"M3 7h1.18a3 3 0 0 0 5.64 0H21a1 1 0 0 0 0-2H9.82a3 3 0 0 0-5.64 0H3a1 1 0 0 0 0 2zm4-2a1 1 0 1 1-1 1 1 1 0 0 1 1-1z\"/><path d=\"M21 17h-7.18a3 3 0 0 0-5.64 0H3a1 1 0 0 0 0 2h5.18a3 3 0 0 0 5.64 0H21a1 1 0 0 0 0-2zm-10 2a1 1 0 1 1 1-1 1 1 0 0 1-1 1z\"/></g></g>","options-outline":"<g data-name=\"Layer 2\"><g data-name=\"options\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M7 14.18V3a1 1 0 0 0-2 0v11.18a3 3 0 0 0 0 5.64V21a1 1 0 0 0 2 0v-1.18a3 3 0 0 0 0-5.64zM6 18a1 1 0 1 1 1-1 1 1 0 0 1-1 1z\"/><path d=\"M21 13a3 3 0 0 0-2-2.82V3a1 1 0 0 0-2 0v7.18a3 3 0 0 0 0 5.64V21a1 1 0 0 0 2 0v-5.18A3 3 0 0 0 21 13zm-3 1a1 1 0 1 1 1-1 1 1 0 0 1-1 1z\"/><path d=\"M15 5a3 3 0 1 0-4 2.82V21a1 1 0 0 0 2 0V7.82A3 3 0 0 0 15 5zm-3 1a1 1 0 1 1 1-1 1 1 0 0 1-1 1z\"/></g></g>","pantone-outline":"<g data-name=\"Layer 2\"><g data-name=\"pantone\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20 13.18h-4.06l2.3-2.47a1 1 0 0 0 0-1.41l-4.19-3.86a.93.93 0 0 0-.71-.26 1 1 0 0 0-.7.31l-1.82 2V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v13.09A3.91 3.91 0 0 0 6.91 21H20a1 1 0 0 0 1-1v-5.82a1 1 0 0 0-1-1zm-6.58-5.59l2.67 2.49-5.27 5.66v-5.36zM8.82 10v3H5v-3zm0-5v3H5V5zM5 17.09V15h3.82v2.09a1.91 1.91 0 0 1-3.82 0zM19 19h-8.49l3.56-3.82H19z\"/></g></g>","paper-plane-outline":"<g data-name=\"Layer 2\"><g data-name=\"paper-plane\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21 4a1.31 1.31 0 0 0-.06-.27v-.09a1 1 0 0 0-.2-.3 1 1 0 0 0-.29-.19h-.09a.86.86 0 0 0-.31-.15H20a1 1 0 0 0-.3 0l-18 6a1 1 0 0 0 0 1.9l8.53 2.84 2.84 8.53a1 1 0 0 0 1.9 0l6-18A1 1 0 0 0 21 4zm-4.7 2.29l-5.57 5.57L5.16 10zM14 18.84l-1.86-5.57 5.57-5.57z\"/></g></g>","pause-circle-outline":"<g data-name=\"Layer 2\"><g data-name=\"pause-circle\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z\"/><path d=\"M15 8a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V9a1 1 0 0 0-1-1z\"/><path d=\"M9 8a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V9a1 1 0 0 0-1-1z\"/></g></g>","people-outline":"<g data-name=\"Layer 2\"><g data-name=\"people\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M9 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0-6a2 2 0 1 1-2 2 2 2 0 0 1 2-2z\"/><path d=\"M17 13a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0-4a1 1 0 1 1-1 1 1 1 0 0 1 1-1z\"/><path d=\"M17 14a5 5 0 0 0-3.06 1.05A7 7 0 0 0 2 20a1 1 0 0 0 2 0 5 5 0 0 1 10 0 1 1 0 0 0 2 0 6.9 6.9 0 0 0-.86-3.35A3 3 0 0 1 20 19a1 1 0 0 0 2 0 5 5 0 0 0-5-5z\"/></g></g>","percent-outline":"<g data-name=\"Layer 2\"><g data-name=\"percent\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M8 11a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 8 11zm0-5a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 8 6z\"/><path d=\"M16 14a3.5 3.5 0 1 0 3.5 3.5A3.5 3.5 0 0 0 16 14zm0 5a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 16 19z\"/><path d=\"M19.74 4.26a.89.89 0 0 0-1.26 0L4.26 18.48a.91.91 0 0 0-.26.63.89.89 0 0 0 1.52.63L19.74 5.52a.89.89 0 0 0 0-1.26z\"/></g></g>","person-add-outline":"<g data-name=\"Layer 2\"><g data-name=\"person-add\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21 6h-1V5a1 1 0 0 0-2 0v1h-1a1 1 0 0 0 0 2h1v1a1 1 0 0 0 2 0V8h1a1 1 0 0 0 0-2z\"/><path d=\"M10 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0-6a2 2 0 1 1-2 2 2 2 0 0 1 2-2z\"/><path d=\"M10 13a7 7 0 0 0-7 7 1 1 0 0 0 2 0 5 5 0 0 1 10 0 1 1 0 0 0 2 0 7 7 0 0 0-7-7z\"/></g></g>","person-delete-outline":"<g data-name=\"Layer 2\"><g data-name=\"person-delete\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.47 7.5l.73-.73a1 1 0 0 0-1.47-1.47L19 6l-.73-.73a1 1 0 0 0-1.47 1.5l.73.73-.73.73a1 1 0 0 0 1.47 1.47L19 9l.73.73a1 1 0 0 0 1.47-1.5z\"/><path d=\"M10 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0-6a2 2 0 1 1-2 2 2 2 0 0 1 2-2z\"/><path d=\"M10 13a7 7 0 0 0-7 7 1 1 0 0 0 2 0 5 5 0 0 1 10 0 1 1 0 0 0 2 0 7 7 0 0 0-7-7z\"/></g></g>","person-done-outline":"<g data-name=\"Layer 2\"><g data-name=\"person-done\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21.66 4.25a1 1 0 0 0-1.41.09l-1.87 2.15-.63-.71a1 1 0 0 0-1.5 1.33l1.39 1.56a1 1 0 0 0 .75.33 1 1 0 0 0 .74-.34l2.61-3a1 1 0 0 0-.08-1.41z\"/><path d=\"M10 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0-6a2 2 0 1 1-2 2 2 2 0 0 1 2-2z\"/><path d=\"M10 13a7 7 0 0 0-7 7 1 1 0 0 0 2 0 5 5 0 0 1 10 0 1 1 0 0 0 2 0 7 7 0 0 0-7-7z\"/></g></g>","person-outline":"<g data-name=\"Layer 2\"><g data-name=\"person\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0-6a2 2 0 1 1-2 2 2 2 0 0 1 2-2z\"/><path d=\"M12 13a7 7 0 0 0-7 7 1 1 0 0 0 2 0 5 5 0 0 1 10 0 1 1 0 0 0 2 0 7 7 0 0 0-7-7z\"/></g></g>","person-remove-outline":"<g data-name=\"Layer 2\"><g data-name=\"person-remove\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21 6h-4a1 1 0 0 0 0 2h4a1 1 0 0 0 0-2z\"/><path d=\"M10 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0-6a2 2 0 1 1-2 2 2 2 0 0 1 2-2z\"/><path d=\"M10 13a7 7 0 0 0-7 7 1 1 0 0 0 2 0 5 5 0 0 1 10 0 1 1 0 0 0 2 0 7 7 0 0 0-7-7z\"/></g></g>","phone-call-outline":"<g data-name=\"Layer 2\"><g data-name=\"phone-call\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M13 8a3 3 0 0 1 3 3 1 1 0 0 0 2 0 5 5 0 0 0-5-5 1 1 0 0 0 0 2z\"/><path d=\"M13 4a7 7 0 0 1 7 7 1 1 0 0 0 2 0 9 9 0 0 0-9-9 1 1 0 0 0 0 2z\"/><path d=\"M21.75 15.91a1 1 0 0 0-.72-.65l-6-1.37a1 1 0 0 0-.92.26c-.14.13-.15.14-.8 1.38a9.91 9.91 0 0 1-4.87-4.89C9.71 10 9.72 10 9.85 9.85a1 1 0 0 0 .26-.92L8.74 3a1 1 0 0 0-.65-.72 3.79 3.79 0 0 0-.72-.18A3.94 3.94 0 0 0 6.6 2 4.6 4.6 0 0 0 2 6.6 15.42 15.42 0 0 0 17.4 22a4.6 4.6 0 0 0 4.6-4.6 4.77 4.77 0 0 0-.06-.76 4.34 4.34 0 0 0-.19-.73zM17.4 20A13.41 13.41 0 0 1 4 6.6 2.61 2.61 0 0 1 6.6 4h.33L8 8.64l-.54.28c-.86.45-1.54.81-1.18 1.59a11.85 11.85 0 0 0 7.18 7.21c.84.34 1.17-.29 1.62-1.16l.29-.55L20 17.07v.33a2.61 2.61 0 0 1-2.6 2.6z\"/></g></g>","phone-missed-outline":"<g data-name=\"Layer 2\"><g data-name=\"phone-missed\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21.94 16.64a4.34 4.34 0 0 0-.19-.73 1 1 0 0 0-.72-.65l-6-1.37a1 1 0 0 0-.92.26c-.14.13-.15.14-.8 1.38a10 10 0 0 1-4.88-4.89C9.71 10 9.72 10 9.85 9.85a1 1 0 0 0 .26-.92L8.74 3a1 1 0 0 0-.65-.72 3.79 3.79 0 0 0-.72-.18A3.94 3.94 0 0 0 6.6 2 4.6 4.6 0 0 0 2 6.6 15.42 15.42 0 0 0 17.4 22a4.6 4.6 0 0 0 4.6-4.6 4.77 4.77 0 0 0-.06-.76zM17.4 20A13.41 13.41 0 0 1 4 6.6 2.61 2.61 0 0 1 6.6 4h.33L8 8.64l-.55.29c-.87.45-1.5.78-1.17 1.58a11.85 11.85 0 0 0 7.18 7.21c.84.34 1.17-.29 1.62-1.16l.29-.55L20 17.07v.33a2.61 2.61 0 0 1-2.6 2.6z\"/><path d=\"M15.8 8.7a1.05 1.05 0 0 0 1.47 0L18 8l.73.73a1 1 0 0 0 1.47-1.5l-.73-.73.73-.73a1 1 0 0 0-1.47-1.47L18 5l-.73-.73a1 1 0 0 0-1.47 1.5l.73.73-.73.73a1.05 1.05 0 0 0 0 1.47z\"/></g></g>","phone-off-outline":"<g data-name=\"Layer 2\"><g data-name=\"phone-off\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19.74 4.26a.89.89 0 0 0-1.26 0L4.26 18.48a.91.91 0 0 0-.26.63.89.89 0 0 0 1.52.63L19.74 5.52a.89.89 0 0 0 0-1.26z\"/><path d=\"M6.7 14.63A13.29 13.29 0 0 1 4 6.6 2.61 2.61 0 0 1 6.6 4h.33L8 8.64l-.55.29c-.87.45-1.5.78-1.17 1.58a11.57 11.57 0 0 0 1.57 3l1.43-1.42a10.37 10.37 0 0 1-.8-1.42C9.71 10 9.72 10 9.85 9.85a1 1 0 0 0 .26-.92L8.74 3a1 1 0 0 0-.65-.72 3.79 3.79 0 0 0-.72-.18A3.94 3.94 0 0 0 6.6 2 4.6 4.6 0 0 0 2 6.6a15.33 15.33 0 0 0 3.27 9.46z\"/><path d=\"M21.94 16.64a4.34 4.34 0 0 0-.19-.73 1 1 0 0 0-.72-.65l-6-1.37a1 1 0 0 0-.92.26c-.14.13-.15.14-.8 1.38a10.88 10.88 0 0 1-1.41-.8l-1.43 1.43a11.52 11.52 0 0 0 2.94 1.56c.84.34 1.17-.29 1.62-1.16l.29-.55L20 17.07v.33a2.61 2.61 0 0 1-2.6 2.6 13.29 13.29 0 0 1-8-2.7l-1.46 1.43A15.33 15.33 0 0 0 17.4 22a4.6 4.6 0 0 0 4.6-4.6 4.77 4.77 0 0 0-.06-.76z\"/></g></g>","phone-outline":"<g data-name=\"Layer 2\"><g data-name=\"phone\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M17.4 22A15.42 15.42 0 0 1 2 6.6 4.6 4.6 0 0 1 6.6 2a3.94 3.94 0 0 1 .77.07 3.79 3.79 0 0 1 .72.18 1 1 0 0 1 .65.75l1.37 6a1 1 0 0 1-.26.92c-.13.14-.14.15-1.37.79a9.91 9.91 0 0 0 4.87 4.89c.65-1.24.66-1.25.8-1.38a1 1 0 0 1 .92-.26l6 1.37a1 1 0 0 1 .72.65 4.34 4.34 0 0 1 .19.73 4.77 4.77 0 0 1 .06.76A4.6 4.6 0 0 1 17.4 22zM6.6 4A2.61 2.61 0 0 0 4 6.6 13.41 13.41 0 0 0 17.4 20a2.61 2.61 0 0 0 2.6-2.6v-.33L15.36 16l-.29.55c-.45.87-.78 1.5-1.62 1.16a11.85 11.85 0 0 1-7.18-7.21c-.36-.78.32-1.14 1.18-1.59L8 8.64 6.93 4z\"/></g></g>","pie-chart-outline":"<g data-name=\"Layer 2\"><g data-name=\"pie-chart\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M13 2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1 9 9 0 0 0-9-9zm1 8V4.07A7 7 0 0 1 19.93 10z\"/><path d=\"M20.82 14.06a1 1 0 0 0-1.28.61A8 8 0 1 1 9.33 4.46a1 1 0 0 0-.66-1.89 10 10 0 1 0 12.76 12.76 1 1 0 0 0-.61-1.27z\"/></g></g>","pin-outline":"<g data-name=\"Layer 2\"><g data-name=\"pin\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a8 8 0 0 0-8 7.92c0 5.48 7.05 11.58 7.35 11.84a1 1 0 0 0 1.3 0C13 21.5 20 15.4 20 9.92A8 8 0 0 0 12 2zm0 17.65c-1.67-1.59-6-6-6-9.73a6 6 0 0 1 12 0c0 3.7-4.33 8.14-6 9.73z\"/><path d=\"M12 6a3.5 3.5 0 1 0 3.5 3.5A3.5 3.5 0 0 0 12 6zm0 5a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 12 11z\"/></g></g>","play-circle-outline":"<g data-name=\"Layer 2\"><g data-name=\"play-circle\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z\"/><path d=\"M12.34 7.45a1.7 1.7 0 0 0-1.85-.3 1.6 1.6 0 0 0-1 1.48v6.74a1.6 1.6 0 0 0 1 1.48 1.68 1.68 0 0 0 .69.15 1.74 1.74 0 0 0 1.16-.45L16 13.18a1.6 1.6 0 0 0 0-2.36zm-.84 7.15V9.4l2.81 2.6z\"/></g></g>","plus-circle-outline":"<g data-name=\"Layer 2\"><g data-name=\"plus-circle\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z\"/><path d=\"M15 11h-2V9a1 1 0 0 0-2 0v2H9a1 1 0 0 0 0 2h2v2a1 1 0 0 0 2 0v-2h2a1 1 0 0 0 0-2z\"/></g></g>","plus-outline":"<g data-name=\"Layer 2\"><g data-name=\"plus\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M19 11h-6V5a1 1 0 0 0-2 0v6H5a1 1 0 0 0 0 2h6v6a1 1 0 0 0 2 0v-6h6a1 1 0 0 0 0-2z\"/></g></g>","plus-square-outline":"<g data-name=\"Layer 2\"><g data-name=\"plus-square\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zm1 15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1z\"/><path d=\"M15 11h-2V9a1 1 0 0 0-2 0v2H9a1 1 0 0 0 0 2h2v2a1 1 0 0 0 2 0v-2h2a1 1 0 0 0 0-2z\"/></g></g>","power-outline":"<g data-name=\"Layer 2\"><g data-name=\"power\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 13a1 1 0 0 0 1-1V2a1 1 0 0 0-2 0v10a1 1 0 0 0 1 1z\"/><path d=\"M16.59 3.11a1 1 0 0 0-.92 1.78 8 8 0 1 1-7.34 0 1 1 0 1 0-.92-1.78 10 10 0 1 0 9.18 0z\"/></g></g>","pricetags-outline":"<g data-name=\"Layer 2\"><g data-name=\"pricetags\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12.87 22a1.84 1.84 0 0 1-1.29-.53l-6.41-6.42a1 1 0 0 1-.29-.61L4 5.09a1 1 0 0 1 .29-.8 1 1 0 0 1 .8-.29l9.35.88a1 1 0 0 1 .61.29l6.42 6.41a1.82 1.82 0 0 1 0 2.57l-7.32 7.32a1.82 1.82 0 0 1-1.28.53zm-6-8.11l6 6 7.05-7.05-6-6-7.81-.73z\"/><circle cx=\"10.5\" cy=\"10.5\" r=\"1.5\"/></g></g>","printer-outline":"<g data-name=\"Layer 2\"><g data-name=\"printer\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M19.36 7H18V5a1.92 1.92 0 0 0-1.83-2H7.83A1.92 1.92 0 0 0 6 5v2H4.64A2.66 2.66 0 0 0 2 9.67v6.66A2.66 2.66 0 0 0 4.64 19h.86a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2h.86A2.66 2.66 0 0 0 22 16.33V9.67A2.66 2.66 0 0 0 19.36 7zM8 5h8v2H8zm-.5 14v-4h9v4zM20 16.33a.66.66 0 0 1-.64.67h-.86v-2a2 2 0 0 0-2-2h-9a2 2 0 0 0-2 2v2h-.86a.66.66 0 0 1-.64-.67V9.67A.66.66 0 0 1 4.64 9h14.72a.66.66 0 0 1 .64.67z\"/></g></g>","question-mark-circle-outline":"<g data-name=\"Layer 2\"><g data-name=\"menu-arrow-circle\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z\"/><path d=\"M12 6a3.5 3.5 0 0 0-3.5 3.5 1 1 0 0 0 2 0A1.5 1.5 0 1 1 12 11a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-1.16A3.49 3.49 0 0 0 12 6z\"/><circle cx=\"12\" cy=\"17\" r=\"1\"/></g></g>","question-mark-outline":"<g data-name=\"Layer 2\"><g data-name=\"question-mark\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M17 9A5 5 0 0 0 7 9a1 1 0 0 0 2 0 3 3 0 1 1 3 3 1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-1.1A5 5 0 0 0 17 9z\"/><circle cx=\"12\" cy=\"19\" r=\"1\"/></g></g>","radio-button-off-outline":"<g data-name=\"Layer 2\"><g data-name=\"radio-button-off\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 22a10 10 0 1 1 10-10 10 10 0 0 1-10 10zm0-18a8 8 0 1 0 8 8 8 8 0 0 0-8-8z\"/></g></g>","radio-button-on-outline":"<g data-name=\"Layer 2\"><g data-name=\"radio-button-on\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z\"/><path d=\"M12 7a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 8a3 3 0 1 1 3-3 3 3 0 0 1-3 3z\"/></g></g>","radio-outline":"<g data-name=\"Layer 2\"><g data-name=\"radio\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 8a3 3 0 0 0-1 5.83 1 1 0 0 0 0 .17v6a1 1 0 0 0 2 0v-6a1 1 0 0 0 0-.17A3 3 0 0 0 12 8zm0 4a1 1 0 1 1 1-1 1 1 0 0 1-1 1z\"/><path d=\"M3.5 11a6.87 6.87 0 0 1 2.64-5.23 1 1 0 1 0-1.28-1.54A8.84 8.84 0 0 0 1.5 11a8.84 8.84 0 0 0 3.36 6.77 1 1 0 1 0 1.28-1.54A6.87 6.87 0 0 1 3.5 11z\"/><path d=\"M16.64 6.24a1 1 0 0 0-1.28 1.52A4.28 4.28 0 0 1 17 11a4.28 4.28 0 0 1-1.64 3.24A1 1 0 0 0 16 16a1 1 0 0 0 .64-.24A6.2 6.2 0 0 0 19 11a6.2 6.2 0 0 0-2.36-4.76z\"/><path d=\"M8.76 6.36a1 1 0 0 0-1.4-.12A6.2 6.2 0 0 0 5 11a6.2 6.2 0 0 0 2.36 4.76 1 1 0 0 0 1.4-.12 1 1 0 0 0-.12-1.4A4.28 4.28 0 0 1 7 11a4.28 4.28 0 0 1 1.64-3.24 1 1 0 0 0 .12-1.4z\"/><path d=\"M19.14 4.23a1 1 0 1 0-1.28 1.54A6.87 6.87 0 0 1 20.5 11a6.87 6.87 0 0 1-2.64 5.23 1 1 0 0 0 1.28 1.54A8.84 8.84 0 0 0 22.5 11a8.84 8.84 0 0 0-3.36-6.77z\"/></g></g>","recording-outline":"<g data-name=\"Layer 2\"><g data-name=\"recording\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 8a4 4 0 0 0-4 4 3.91 3.91 0 0 0 .56 2H9.44a3.91 3.91 0 0 0 .56-2 4 4 0 1 0-4 4h12a4 4 0 0 0 0-8zM4 12a2 2 0 1 1 2 2 2 2 0 0 1-2-2zm14 2a2 2 0 1 1 2-2 2 2 0 0 1-2 2z\"/></g></g>","refresh-outline":"<g data-name=\"Layer 2\"><g data-name=\"refresh\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.3 13.43a1 1 0 0 0-1.25.65A7.14 7.14 0 0 1 12.18 19 7.1 7.1 0 0 1 5 12a7.1 7.1 0 0 1 7.18-7 7.26 7.26 0 0 1 4.65 1.67l-2.17-.36a1 1 0 0 0-1.15.83 1 1 0 0 0 .83 1.15l4.24.7h.17a1 1 0 0 0 .34-.06.33.33 0 0 0 .1-.06.78.78 0 0 0 .2-.11l.09-.11c0-.05.09-.09.13-.15s0-.1.05-.14a1.34 1.34 0 0 0 .07-.18l.75-4a1 1 0 0 0-2-.38l-.27 1.45A9.21 9.21 0 0 0 12.18 3 9.1 9.1 0 0 0 3 12a9.1 9.1 0 0 0 9.18 9A9.12 9.12 0 0 0 21 14.68a1 1 0 0 0-.7-1.25z\"/></g></g>","repeat-outline":"<g data-name=\"Layer 2\"><g data-name=\"repeat\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M17.91 5h-12l1.3-1.29a1 1 0 0 0-1.42-1.42l-3 3a1 1 0 0 0 0 1.42l3 3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42L5.91 7h12a1.56 1.56 0 0 1 1.59 1.53V11a1 1 0 0 0 2 0V8.53A3.56 3.56 0 0 0 17.91 5z\"/><path d=\"M18.21 14.29a1 1 0 0 0-1.42 1.42l1.3 1.29h-12a1.56 1.56 0 0 1-1.59-1.53V13a1 1 0 0 0-2 0v2.47A3.56 3.56 0 0 0 6.09 19h12l-1.3 1.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l3-3a1 1 0 0 0 0-1.42z\"/></g></g>","rewind-left-outline":"<g data-name=\"Layer 2\"><g data-name=\"rewind-left\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M18.45 6.2a2.1 2.1 0 0 0-2.21.26l-4.74 3.92V7.79a1.76 1.76 0 0 0-1.05-1.59 2.1 2.1 0 0 0-2.21.26l-5.1 4.21a1.7 1.7 0 0 0 0 2.66l5.1 4.21a2.06 2.06 0 0 0 1.3.46 2.23 2.23 0 0 0 .91-.2 1.76 1.76 0 0 0 1.05-1.59v-2.59l4.74 3.92a2.06 2.06 0 0 0 1.3.46 2.23 2.23 0 0 0 .91-.2 1.76 1.76 0 0 0 1.05-1.59V7.79a1.76 1.76 0 0 0-1.05-1.59zM9.5 16l-4.82-4L9.5 8.09zm8 0l-4.82-4 4.82-3.91z\"/></g></g>","rewind-right-outline":"<g data-name=\"Layer 2\"><g data-name=\"rewind-right\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.86 10.67l-5.1-4.21a2.1 2.1 0 0 0-2.21-.26 1.76 1.76 0 0 0-1.05 1.59v2.59L7.76 6.46a2.1 2.1 0 0 0-2.21-.26 1.76 1.76 0 0 0-1 1.59v8.42a1.76 1.76 0 0 0 1 1.59 2.23 2.23 0 0 0 .91.2 2.06 2.06 0 0 0 1.3-.46l4.74-3.92v2.59a1.76 1.76 0 0 0 1.05 1.59 2.23 2.23 0 0 0 .91.2 2.06 2.06 0 0 0 1.3-.46l5.1-4.21a1.7 1.7 0 0 0 0-2.66zM6.5 15.91V8l4.82 4zm8 0V8l4.82 4z\"/></g></g>","save-outline":"<g data-name=\"Layer 2\"><g data-name=\"save\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.12 8.71l-4.83-4.83A3 3 0 0 0 13.17 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-7.17a3 3 0 0 0-.88-2.12zM10 19v-2h4v2zm9-1a1 1 0 0 1-1 1h-2v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2v5a1 1 0 0 0 1 1h4a1 1 0 0 0 0-2h-3V5h3.17a1.05 1.05 0 0 1 .71.29l4.83 4.83a1 1 0 0 1 .29.71z\"/></g></g>","scissors-outline":"<g data-name=\"Layer 2\"><g data-name=\"scissors\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.21 5.71a1 1 0 1 0-1.42-1.42l-6.28 6.31-3.3-3.31A3 3 0 0 0 9.5 6a3 3 0 1 0-3 3 3 3 0 0 0 1.29-.3L11.1 12l-3.29 3.3A3 3 0 0 0 6.5 15a3 3 0 1 0 3 3 3 3 0 0 0-.29-1.26zM6.5 7a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm0 12a1 1 0 1 1 1-1 1 1 0 0 1-1 1z\"/><path d=\"M15.21 13.29a1 1 0 0 0-1.42 1.42l5 5a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z\"/></g></g>","search-outline":"<g data-name=\"Layer 2\"><g data-name=\"search\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.71 19.29l-3.4-3.39A7.92 7.92 0 0 0 19 11a8 8 0 1 0-8 8 7.92 7.92 0 0 0 4.9-1.69l3.39 3.4a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42zM5 11a6 6 0 1 1 6 6 6 6 0 0 1-6-6z\"/></g></g>","settings-2-outline":"<g data-name=\"Layer 2\"><g data-name=\"settings-2\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M12.94 22h-1.89a1.68 1.68 0 0 1-1.68-1.68v-1.09a.34.34 0 0 0-.22-.29.38.38 0 0 0-.41 0l-.74.8a1.67 1.67 0 0 1-2.37 0L4.26 18.4a1.66 1.66 0 0 1-.5-1.19 1.72 1.72 0 0 1 .5-1.21l.74-.74a.34.34 0 0 0 0-.37c-.06-.15-.16-.26-.3-.26H3.68A1.69 1.69 0 0 1 2 12.94v-1.89a1.68 1.68 0 0 1 1.68-1.68h1.09a.34.34 0 0 0 .29-.22.38.38 0 0 0 0-.41L4.26 8a1.67 1.67 0 0 1 0-2.37L5.6 4.26a1.65 1.65 0 0 1 1.18-.5 1.72 1.72 0 0 1 1.22.5l.74.74a.34.34 0 0 0 .37 0c.15-.06.26-.16.26-.3V3.68A1.69 1.69 0 0 1 11.06 2H13a1.68 1.68 0 0 1 1.68 1.68v1.09a.34.34 0 0 0 .22.29.38.38 0 0 0 .41 0l.69-.8a1.67 1.67 0 0 1 2.37 0l1.37 1.34a1.67 1.67 0 0 1 .5 1.19 1.63 1.63 0 0 1-.5 1.21l-.74.74a.34.34 0 0 0 0 .37c.06.15.16.26.3.26h1.09A1.69 1.69 0 0 1 22 11.06V13a1.68 1.68 0 0 1-1.68 1.68h-1.09a.34.34 0 0 0-.29.22.34.34 0 0 0 0 .37l.77.77a1.67 1.67 0 0 1 0 2.37l-1.31 1.33a1.65 1.65 0 0 1-1.18.5 1.72 1.72 0 0 1-1.19-.5l-.77-.74a.34.34 0 0 0-.37 0c-.15.06-.26.16-.26.3v1.09A1.69 1.69 0 0 1 12.94 22zm-1.57-2h1.26v-.77a2.33 2.33 0 0 1 1.46-2.14 2.36 2.36 0 0 1 2.59.47l.54.54.88-.88-.54-.55a2.34 2.34 0 0 1-.48-2.56 2.33 2.33 0 0 1 2.14-1.45H20v-1.29h-.77a2.33 2.33 0 0 1-2.14-1.46 2.36 2.36 0 0 1 .47-2.59l.54-.54-.88-.88-.55.54a2.39 2.39 0 0 1-4-1.67V4h-1.3v.77a2.33 2.33 0 0 1-1.46 2.14 2.36 2.36 0 0 1-2.59-.47l-.54-.54-.88.88.54.55a2.39 2.39 0 0 1-1.67 4H4v1.26h.77a2.33 2.33 0 0 1 2.14 1.46 2.36 2.36 0 0 1-.47 2.59l-.54.54.88.88.55-.54a2.39 2.39 0 0 1 4 1.67z\" data-name=\"&lt;Group&gt;\"/><path d=\"M12 15.5a3.5 3.5 0 1 1 3.5-3.5 3.5 3.5 0 0 1-3.5 3.5zm0-5a1.5 1.5 0 1 0 1.5 1.5 1.5 1.5 0 0 0-1.5-1.5z\"/></g></g>","settings-outline":"<g data-name=\"Layer 2\"><g data-name=\"settings\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M8.61 22a2.25 2.25 0 0 1-1.35-.46L5.19 20a2.37 2.37 0 0 1-.49-3.22 2.06 2.06 0 0 0 .23-1.86l-.06-.16a1.83 1.83 0 0 0-1.12-1.22h-.16a2.34 2.34 0 0 1-1.48-2.94L2.93 8a2.18 2.18 0 0 1 1.12-1.41 2.14 2.14 0 0 1 1.68-.12 1.93 1.93 0 0 0 1.78-.29l.13-.1a1.94 1.94 0 0 0 .73-1.51v-.24A2.32 2.32 0 0 1 10.66 2h2.55a2.26 2.26 0 0 1 1.6.67 2.37 2.37 0 0 1 .68 1.68v.28a1.76 1.76 0 0 0 .69 1.43l.11.08a1.74 1.74 0 0 0 1.59.26l.34-.11A2.26 2.26 0 0 1 21.1 7.8l.79 2.52a2.36 2.36 0 0 1-1.46 2.93l-.2.07A1.89 1.89 0 0 0 19 14.6a2 2 0 0 0 .25 1.65l.26.38a2.38 2.38 0 0 1-.5 3.23L17 21.41a2.24 2.24 0 0 1-3.22-.53l-.12-.17a1.75 1.75 0 0 0-1.5-.78 1.8 1.8 0 0 0-1.43.77l-.23.33A2.25 2.25 0 0 1 9 22a2 2 0 0 1-.39 0zM4.4 11.62a3.83 3.83 0 0 1 2.38 2.5v.12a4 4 0 0 1-.46 3.62.38.38 0 0 0 0 .51L8.47 20a.25.25 0 0 0 .37-.07l.23-.33a3.77 3.77 0 0 1 6.2 0l.12.18a.3.3 0 0 0 .18.12.25.25 0 0 0 .19-.05l2.06-1.56a.36.36 0 0 0 .07-.49l-.26-.38A4 4 0 0 1 17.1 14a3.92 3.92 0 0 1 2.49-2.61l.2-.07a.34.34 0 0 0 .19-.44l-.78-2.49a.35.35 0 0 0-.2-.19.21.21 0 0 0-.19 0l-.34.11a3.74 3.74 0 0 1-3.43-.57L15 7.65a3.76 3.76 0 0 1-1.49-3v-.31a.37.37 0 0 0-.1-.26.31.31 0 0 0-.21-.08h-2.54a.31.31 0 0 0-.29.33v.25a3.9 3.9 0 0 1-1.52 3.09l-.13.1a3.91 3.91 0 0 1-3.63.59.22.22 0 0 0-.14 0 .28.28 0 0 0-.12.15L4 11.12a.36.36 0 0 0 .22.45z\" data-name=\"&lt;Group&gt;\"/><path d=\"M12 15.5a3.5 3.5 0 1 1 3.5-3.5 3.5 3.5 0 0 1-3.5 3.5zm0-5a1.5 1.5 0 1 0 1.5 1.5 1.5 1.5 0 0 0-1.5-1.5z\"/></g></g>","shake-outline":"<g data-name=\"Layer 2\"><g data-name=\"shake\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M5.5 18a1 1 0 0 1-.64-.24A8.81 8.81 0 0 1 1.5 11a8.81 8.81 0 0 1 3.36-6.76 1 1 0 1 1 1.28 1.52A6.9 6.9 0 0 0 3.5 11a6.9 6.9 0 0 0 2.64 5.24 1 1 0 0 1 .13 1.4 1 1 0 0 1-.77.36z\"/><path d=\"M12 7a4.09 4.09 0 0 1 1 .14V3a1 1 0 0 0-2 0v4.14A4.09 4.09 0 0 1 12 7z\"/><path d=\"M12 15a4.09 4.09 0 0 1-1-.14V20a1 1 0 0 0 2 0v-5.14a4.09 4.09 0 0 1-1 .14z\"/><path d=\"M16 16a1 1 0 0 1-.77-.36 1 1 0 0 1 .13-1.4A4.28 4.28 0 0 0 17 11a4.28 4.28 0 0 0-1.64-3.24 1 1 0 1 1 1.28-1.52A6.2 6.2 0 0 1 19 11a6.2 6.2 0 0 1-2.36 4.76A1 1 0 0 1 16 16z\"/><path d=\"M8 16a1 1 0 0 1-.64-.24A6.2 6.2 0 0 1 5 11a6.2 6.2 0 0 1 2.36-4.76 1 1 0 1 1 1.28 1.52A4.28 4.28 0 0 0 7 11a4.28 4.28 0 0 0 1.64 3.24 1 1 0 0 1 .13 1.4A1 1 0 0 1 8 16z\"/><path d=\"M18.5 18a1 1 0 0 1-.77-.36 1 1 0 0 1 .13-1.4A6.9 6.9 0 0 0 20.5 11a6.9 6.9 0 0 0-2.64-5.24 1 1 0 1 1 1.28-1.52A8.81 8.81 0 0 1 22.5 11a8.81 8.81 0 0 1-3.36 6.76 1 1 0 0 1-.64.24z\"/><path d=\"M12 12a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm0-1zm0 0zm0 0zm0 0zm0 0zm0 0zm0 0z\"/></g></g>","share-outline":"<g data-name=\"Layer 2\"><g data-name=\"share\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 15a3 3 0 0 0-2.1.86L8 12.34V12v-.33l7.9-3.53A3 3 0 1 0 15 6v.34L7.1 9.86a3 3 0 1 0 0 4.28l7.9 3.53V18a3 3 0 1 0 3-3zm0-10a1 1 0 1 1-1 1 1 1 0 0 1 1-1zM5 13a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm13 6a1 1 0 1 1 1-1 1 1 0 0 1-1 1z\"/></g></g>","shield-off-outline":"<g data-name=\"Layer 2\"><g data-name=\"shield-off\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M4.71 3.29a1 1 0 0 0-1.42 1.42l16 16a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z\"/><path d=\"M12.3 19.68l-.3.17-.3-.17A13.15 13.15 0 0 1 5 8.23v-.14L5.16 8 3.73 6.56A2 2 0 0 0 3 8.09v.14a15.17 15.17 0 0 0 7.72 13.2l.3.17a2 2 0 0 0 2 0l.3-.17a15.22 15.22 0 0 0 3-2.27l-1.42-1.42a12.56 12.56 0 0 1-2.6 1.94z\"/><path d=\"M20 6.34L13 2.4a2 2 0 0 0-2 0L7.32 4.49 8.78 6 12 4.15l7 3.94v.14a13 13 0 0 1-1.63 6.31L18.84 16A15.08 15.08 0 0 0 21 8.23v-.14a2 2 0 0 0-1-1.75z\"/></g></g>","shield-outline":"<g data-name=\"Layer 2\"><g data-name=\"shield\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 21.85a2 2 0 0 1-1-.25l-.3-.17A15.17 15.17 0 0 1 3 8.23v-.14a2 2 0 0 1 1-1.75l7-3.94a2 2 0 0 1 2 0l7 3.94a2 2 0 0 1 1 1.75v.14a15.17 15.17 0 0 1-7.72 13.2l-.3.17a2 2 0 0 1-.98.25zm0-17.7L5 8.09v.14a13.15 13.15 0 0 0 6.7 11.45l.3.17.3-.17A13.15 13.15 0 0 0 19 8.23v-.14z\"/></g></g>","shopping-bag-outline":"<g data-name=\"Layer 2\"><g data-name=\"shopping-bag\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.12 6.71l-2.83-2.83A3 3 0 0 0 15.17 3H8.83a3 3 0 0 0-2.12.88L3.88 6.71A3 3 0 0 0 3 8.83V18a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8.83a3 3 0 0 0-.88-2.12zm-12-1.42A1.05 1.05 0 0 1 8.83 5h6.34a1.05 1.05 0 0 1 .71.29L17.59 7H6.41zM18 19H6a1 1 0 0 1-1-1V9h14v9a1 1 0 0 1-1 1z\"/><path d=\"M15 11a1 1 0 0 0-1 1 2 2 0 0 1-4 0 1 1 0 0 0-2 0 4 4 0 0 0 8 0 1 1 0 0 0-1-1z\"/></g></g>","shopping-cart-outline":"<g data-name=\"Layer 2\"><g data-name=\"shopping-cart\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21.08 7a2 2 0 0 0-1.7-1H6.58L6 3.74A1 1 0 0 0 5 3H3a1 1 0 0 0 0 2h1.24L7 15.26A1 1 0 0 0 8 16h9a1 1 0 0 0 .89-.55l3.28-6.56A2 2 0 0 0 21.08 7zm-4.7 7H8.76L7.13 8h12.25z\"/><circle cx=\"7.5\" cy=\"19.5\" r=\"1.5\"/><circle cx=\"17.5\" cy=\"19.5\" r=\"1.5\"/></g></g>","shuffle-2-outline":"<g data-name=\"Layer 2\"><g data-name=\"shuffle-2\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M18.71 14.29a1 1 0 0 0-1.42 1.42l.29.29H16a4 4 0 0 1 0-8h1.59l-.3.29a1 1 0 0 0 0 1.42A1 1 0 0 0 18 10a1 1 0 0 0 .71-.29l2-2A1 1 0 0 0 21 7a1 1 0 0 0-.29-.71l-2-2a1 1 0 0 0-1.42 1.42l.29.29H16a6 6 0 0 0-5 2.69A6 6 0 0 0 6 6H4a1 1 0 0 0 0 2h2a4 4 0 0 1 0 8H4a1 1 0 0 0 0 2h2a6 6 0 0 0 5-2.69A6 6 0 0 0 16 18h1.59l-.3.29a1 1 0 0 0 0 1.42A1 1 0 0 0 18 20a1 1 0 0 0 .71-.29l2-2A1 1 0 0 0 21 17a1 1 0 0 0-.29-.71z\"/></g></g>","shuffle-outline":"<g data-name=\"Layer 2\"><g data-name=\"shuffle\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M18 9.31a1 1 0 0 0 1 1 1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-4.3a1 1 0 0 0-1 1 1 1 0 0 0 1 1h1.89L12 10.59 6.16 4.76a1 1 0 0 0-1.41 1.41L10.58 12l-6.29 6.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0L18 7.42z\"/><path d=\"M19 13.68a1 1 0 0 0-1 1v1.91l-2.78-2.79a1 1 0 0 0-1.42 1.42L16.57 18h-1.88a1 1 0 0 0 0 2H19a1 1 0 0 0 1-1.11v-4.21a1 1 0 0 0-1-1z\"/></g></g>","skip-back-outline":"<g data-name=\"Layer 2\"><g data-name=\"skip-back\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M16.45 6.2a2.1 2.1 0 0 0-2.21.26l-5.1 4.21-.14.15V7a1 1 0 0 0-2 0v10a1 1 0 0 0 2 0v-3.82l.14.15 5.1 4.21a2.06 2.06 0 0 0 1.3.46 2.23 2.23 0 0 0 .91-.2 1.76 1.76 0 0 0 1.05-1.59V7.79a1.76 1.76 0 0 0-1.05-1.59zM15.5 16l-4.82-4 4.82-3.91z\"/></g></g>","skip-forward-outline":"<g data-name=\"Layer 2\"><g data-name=\"skip-forward\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M16 6a1 1 0 0 0-1 1v3.82l-.14-.15-5.1-4.21a2.1 2.1 0 0 0-2.21-.26 1.76 1.76 0 0 0-1 1.59v8.42a1.76 1.76 0 0 0 1 1.59 2.23 2.23 0 0 0 .91.2 2.06 2.06 0 0 0 1.3-.46l5.1-4.21.14-.15V17a1 1 0 0 0 2 0V7a1 1 0 0 0-1-1zm-7.5 9.91V8l4.82 4z\"/></g></g>","slash-outline":"<g data-name=\"Layer 2\"><g data-name=\"slash\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm8 10a7.92 7.92 0 0 1-1.69 4.9L7.1 5.69A7.92 7.92 0 0 1 12 4a8 8 0 0 1 8 8zM4 12a7.92 7.92 0 0 1 1.69-4.9L16.9 18.31A7.92 7.92 0 0 1 12 20a8 8 0 0 1-8-8z\"/></g></g>","smartphone-outline":"<g data-name=\"Layer 2\"><g data-name=\"smartphone\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M17 2H7a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3zm1 17a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1z\"/><circle cx=\"12\" cy=\"16.5\" r=\"1.5\"/><path d=\"M14.5 6h-5a1 1 0 0 0 0 2h5a1 1 0 0 0 0-2z\"/></g></g>","smiling-face-outline":"<defs><style/></defs><g id=\"Layer_2\" data-name=\"Layer 2\"><g id=\"smiling-face\"><g id=\"smiling-face\" data-name=\"smiling-face\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm5 9a5 5 0 0 1-10 0z\" id=\"&#x1F3A8;-Icon-&#x421;olor\"/></g></g></g>","speaker-outline":"<g data-name=\"Layer 2\"><g data-name=\"speaker\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M12 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0-4a1 1 0 1 1-1 1 1 1 0 0 1 1-1z\"/><path d=\"M12 12a3.5 3.5 0 1 0 3.5 3.5A3.5 3.5 0 0 0 12 12zm0 5a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 12 17z\"/><path d=\"M17 2H7a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3zm1 17a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1z\"/></g></g>","square-outline":"<g data-name=\"Layer 2\"><g data-name=\"square\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 21H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3zM6 5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z\"/></g></g>","star-outline":"<g data-name=\"Layer 2\"><g data-name=\"star\"><rect width=\"24\" height=\"24\" transform=\"rotate(90 12 12)\" opacity=\"0\"/><path d=\"M17.56 21a1 1 0 0 1-.46-.11L12 18.22l-5.1 2.67a1 1 0 0 1-1.45-1.06l1-5.63-4.12-4a1 1 0 0 1-.25-1 1 1 0 0 1 .81-.68l5.7-.83 2.51-5.13a1 1 0 0 1 1.8 0l2.54 5.12 5.7.83a1 1 0 0 1 .81.68 1 1 0 0 1-.25 1l-4.12 4 1 5.63a1 1 0 0 1-.4 1 1 1 0 0 1-.62.18zM12 16.1a.92.92 0 0 1 .46.11l3.77 2-.72-4.21a1 1 0 0 1 .29-.89l3-2.93-4.2-.62a1 1 0 0 1-.71-.56L12 5.25 10.11 9a1 1 0 0 1-.75.54l-4.2.62 3 2.93a1 1 0 0 1 .29.89l-.72 4.16 3.77-2a.92.92 0 0 1 .5-.04z\"/></g></g>","stop-circle-outline":"<g data-name=\"Layer 2\"><g data-name=\"stop-circle\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z\"/><path d=\"M14.75 8h-5.5A1.25 1.25 0 0 0 8 9.25v5.5A1.25 1.25 0 0 0 9.25 16h5.5A1.25 1.25 0 0 0 16 14.75v-5.5A1.25 1.25 0 0 0 14.75 8zM14 14h-4v-4h4z\"/></g></g>","sun-outline":"<g data-name=\"Layer 2\"><g data-name=\"sun\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M12 6a1 1 0 0 0 1-1V3a1 1 0 0 0-2 0v2a1 1 0 0 0 1 1z\"/><path d=\"M21 11h-2a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2z\"/><path d=\"M6 12a1 1 0 0 0-1-1H3a1 1 0 0 0 0 2h2a1 1 0 0 0 1-1z\"/><path d=\"M6.22 5a1 1 0 0 0-1.39 1.47l1.44 1.39a1 1 0 0 0 .73.28 1 1 0 0 0 .72-.31 1 1 0 0 0 0-1.41z\"/><path d=\"M17 8.14a1 1 0 0 0 .69-.28l1.44-1.39A1 1 0 0 0 17.78 5l-1.44 1.42a1 1 0 0 0 0 1.41 1 1 0 0 0 .66.31z\"/><path d=\"M12 18a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1z\"/><path d=\"M17.73 16.14a1 1 0 0 0-1.39 1.44L17.78 19a1 1 0 0 0 .69.28 1 1 0 0 0 .72-.3 1 1 0 0 0 0-1.42z\"/><path d=\"M6.27 16.14l-1.44 1.39a1 1 0 0 0 0 1.42 1 1 0 0 0 .72.3 1 1 0 0 0 .67-.25l1.44-1.39a1 1 0 0 0-1.39-1.44z\"/><path d=\"M12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4zm0 6a2 2 0 1 1 2-2 2 2 0 0 1-2 2z\"/></g></g>","swap-outline":"<g data-name=\"Layer 2\"><g data-name=\"swap\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M4 9h13l-1.6 1.2a1 1 0 0 0-.2 1.4 1 1 0 0 0 .8.4 1 1 0 0 0 .6-.2l4-3a1 1 0 0 0 0-1.59l-3.86-3a1 1 0 0 0-1.23 1.58L17.08 7H4a1 1 0 0 0 0 2z\"/><path d=\"M20 16H7l1.6-1.2a1 1 0 0 0-1.2-1.6l-4 3a1 1 0 0 0 0 1.59l3.86 3a1 1 0 0 0 .61.21 1 1 0 0 0 .79-.39 1 1 0 0 0-.17-1.4L6.92 18H20a1 1 0 0 0 0-2z\"/></g></g>","sync-outline":"<g data-name=\"Layer 2\"><g data-name=\"sync\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21.66 10.37a.62.62 0 0 0 .07-.19l.75-4a1 1 0 0 0-2-.36l-.37 2a9.22 9.22 0 0 0-16.58.84 1 1 0 0 0 .55 1.3 1 1 0 0 0 1.31-.55A7.08 7.08 0 0 1 12.07 5a7.17 7.17 0 0 1 6.24 3.58l-1.65-.27a1 1 0 1 0-.32 2l4.25.71h.16a.93.93 0 0 0 .34-.06.33.33 0 0 0 .1-.06.78.78 0 0 0 .2-.11l.08-.1a1.07 1.07 0 0 0 .14-.16.58.58 0 0 0 .05-.16z\"/><path d=\"M19.88 14.07a1 1 0 0 0-1.31.56A7.08 7.08 0 0 1 11.93 19a7.17 7.17 0 0 1-6.24-3.58l1.65.27h.16a1 1 0 0 0 .16-2L3.41 13a.91.91 0 0 0-.33 0H3a1.15 1.15 0 0 0-.32.14 1 1 0 0 0-.18.18l-.09.1a.84.84 0 0 0-.07.19.44.44 0 0 0-.07.17l-.75 4a1 1 0 0 0 .8 1.22h.18a1 1 0 0 0 1-.82l.37-2a9.22 9.22 0 0 0 16.58-.83 1 1 0 0 0-.57-1.28z\"/></g></g>","text-outline":"<g data-name=\"Layer 2\"><g data-name=\"text\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20 4H4a1 1 0 0 0-1 1v3a1 1 0 0 0 2 0V6h6v13H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2V6h6v2a1 1 0 0 0 2 0V5a1 1 0 0 0-1-1z\"/></g></g>","thermometer-minus-outline":"<g data-name=\"Layer 2\"><g data-name=\"thermometer-minus\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><rect x=\"2\" y=\"5\" width=\"6\" height=\"2\" rx=\"1\" ry=\"1\"/><path d=\"M14 22a5 5 0 0 1-3-9V5a3 3 0 0 1 3-3 3 3 0 0 1 3 3v8a5 5 0 0 1-3 9zm0-18a1 1 0 0 0-1 1v8.54a1 1 0 0 1-.5.87A3 3 0 0 0 11 17a3 3 0 0 0 6 0 3 3 0 0 0-1.5-2.59 1 1 0 0 1-.5-.87V5a.93.93 0 0 0-.29-.69A1 1 0 0 0 14 4z\"/></g></g>","thermometer-outline":"<g data-name=\"Layer 2\"><g data-name=\"thermometer\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 22a5 5 0 0 1-3-9V5a3 3 0 0 1 3-3 3 3 0 0 1 3 3v8a5 5 0 0 1-3 9zm0-18a1 1 0 0 0-1 1v8.54a1 1 0 0 1-.5.87A3 3 0 0 0 9 17a3 3 0 0 0 6 0 3 3 0 0 0-1.5-2.59 1 1 0 0 1-.5-.87V5a.93.93 0 0 0-.29-.69A1 1 0 0 0 12 4z\"/></g></g>","thermometer-plus-outline":"<g data-name=\"Layer 2\"><g data-name=\"thermometer-plus\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><rect x=\"2\" y=\"5\" width=\"6\" height=\"2\" rx=\"1\" ry=\"1\"/><rect x=\"2\" y=\"5\" width=\"6\" height=\"2\" rx=\"1\" ry=\"1\" transform=\"rotate(-90 5 6)\"/><path d=\"M14 22a5 5 0 0 1-3-9V5a3 3 0 0 1 3-3 3 3 0 0 1 3 3v8a5 5 0 0 1-3 9zm0-18a1 1 0 0 0-1 1v8.54a1 1 0 0 1-.5.87A3 3 0 0 0 11 17a3 3 0 0 0 6 0 3 3 0 0 0-1.5-2.59 1 1 0 0 1-.5-.87V5a.93.93 0 0 0-.29-.69A1 1 0 0 0 14 4z\"/></g></g>","toggle-left-outline":"<g data-name=\"Layer 2\"><g data-name=\"toggle-left\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><path d=\"M15 5H9a7 7 0 0 0 0 14h6a7 7 0 0 0 0-14zm0 12H9A5 5 0 0 1 9 7h6a5 5 0 0 1 0 10z\"/><path d=\"M9 9a3 3 0 1 0 3 3 3 3 0 0 0-3-3zm0 4a1 1 0 1 1 1-1 1 1 0 0 1-1 1z\"/></g></g>","toggle-right-outline":"<g data-name=\"Layer 2\"><g data-name=\"toggle-right\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M15 5H9a7 7 0 0 0 0 14h6a7 7 0 0 0 0-14zm0 12H9A5 5 0 0 1 9 7h6a5 5 0 0 1 0 10z\"/><path d=\"M15 9a3 3 0 1 0 3 3 3 3 0 0 0-3-3zm0 4a1 1 0 1 1 1-1 1 1 0 0 1-1 1z\"/></g></g>","trash-2-outline":"<g data-name=\"Layer 2\"><g data-name=\"trash-2\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21 6h-5V4.33A2.42 2.42 0 0 0 13.5 2h-3A2.42 2.42 0 0 0 8 4.33V6H3a1 1 0 0 0 0 2h1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8h1a1 1 0 0 0 0-2zM10 4.33c0-.16.21-.33.5-.33h3c.29 0 .5.17.5.33V6h-4zM18 19a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V8h12z\"/><path d=\"M9 17a1 1 0 0 0 1-1v-4a1 1 0 0 0-2 0v4a1 1 0 0 0 1 1z\"/><path d=\"M15 17a1 1 0 0 0 1-1v-4a1 1 0 0 0-2 0v4a1 1 0 0 0 1 1z\"/></g></g>","trash-outline":"<g data-name=\"Layer 2\"><g data-name=\"trash\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21 6h-5V4.33A2.42 2.42 0 0 0 13.5 2h-3A2.42 2.42 0 0 0 8 4.33V6H3a1 1 0 0 0 0 2h1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8h1a1 1 0 0 0 0-2zM10 4.33c0-.16.21-.33.5-.33h3c.29 0 .5.17.5.33V6h-4zM18 19a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V8h12z\"/></g></g>","trending-down-outline":"<g data-name=\"Layer 2\"><g data-name=\"trending-down\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M21 12a1 1 0 0 0-2 0v2.3l-4.24-5a1 1 0 0 0-1.27-.21L9.22 11.7 4.77 6.36a1 1 0 1 0-1.54 1.28l5 6a1 1 0 0 0 1.28.22l4.28-2.57 4 4.71H15a1 1 0 0 0 0 2h5a1.1 1.1 0 0 0 .36-.07l.14-.08a1.19 1.19 0 0 0 .15-.09.75.75 0 0 0 .14-.17 1.1 1.1 0 0 0 .09-.14.64.64 0 0 0 .05-.17A.78.78 0 0 0 21 17z\"/></g></g>","trending-up-outline":"<g data-name=\"Layer 2\"><g data-name=\"trending-up\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M21 7a.78.78 0 0 0 0-.21.64.64 0 0 0-.05-.17 1.1 1.1 0 0 0-.09-.14.75.75 0 0 0-.14-.17l-.12-.07a.69.69 0 0 0-.19-.1h-.2A.7.7 0 0 0 20 6h-5a1 1 0 0 0 0 2h2.83l-4 4.71-4.32-2.57a1 1 0 0 0-1.28.22l-5 6a1 1 0 0 0 .13 1.41A1 1 0 0 0 4 18a1 1 0 0 0 .77-.36l4.45-5.34 4.27 2.56a1 1 0 0 0 1.27-.21L19 9.7V12a1 1 0 0 0 2 0V7z\"/></g></g>","tv-outline":"<g data-name=\"Layer 2\"><g data-name=\"tv\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18 6h-3.59l2.3-2.29a1 1 0 1 0-1.42-1.42L12 5.59l-3.29-3.3a1 1 0 1 0-1.42 1.42L9.59 6H6a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3zm1 13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1z\"/></g></g>","twitter-outline":"<g data-name=\"Layer 2\"><g data-name=\"twitter\"><polyline points=\"0 0 24 0 24 24 0 24\" opacity=\"0\"/><path d=\"M8.51 20h-.08a10.87 10.87 0 0 1-4.65-1.09A1.38 1.38 0 0 1 3 17.47a1.41 1.41 0 0 1 1.16-1.18 6.63 6.63 0 0 0 2.54-.89 9.49 9.49 0 0 1-3.51-9.07 1.41 1.41 0 0 1 1-1.15 1.35 1.35 0 0 1 1.43.41 7.09 7.09 0 0 0 4.88 2.75 4.5 4.5 0 0 1 1.41-3.1 4.47 4.47 0 0 1 6.37.19.7.7 0 0 0 .78.1A1.39 1.39 0 0 1 21 7.13a6.66 6.66 0 0 1-1.28 2.6A10.79 10.79 0 0 1 8.51 20zm0-2h.08a8.79 8.79 0 0 0 9.09-8.59 1.32 1.32 0 0 1 .37-.85 5.19 5.19 0 0 0 .62-1 2.56 2.56 0 0 1-1.91-.85A2.45 2.45 0 0 0 15 6a2.5 2.5 0 0 0-1.79.69 2.53 2.53 0 0 0-.72 2.42l.26 1.14-1.17.08a8.3 8.3 0 0 1-6.54-2.4 7.12 7.12 0 0 0 3.73 6.46l.95.54-.63.9a5.62 5.62 0 0 1-2.68 1.92A8.34 8.34 0 0 0 8.5 18zM19 6.65z\"/></g></g>","umbrella-outline":"<g data-name=\"Layer 2\"><g data-name=\"umbrella\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M12 2A10 10 0 0 0 2 12a1 1 0 0 0 1 1h8v6a3 3 0 0 0 6 0 1 1 0 0 0-2 0 1 1 0 0 1-2 0v-6h8a1 1 0 0 0 1-1A10 10 0 0 0 12 2zm-7.94 9a8 8 0 0 1 15.88 0z\"/></g></g>","undo-outline":"<g data-name=\"Layer 2\"><g data-name=\"undo\"><rect width=\"24\" height=\"24\" transform=\"rotate(-90 12 12)\" opacity=\"0\"/><path d=\"M20.22 21a1 1 0 0 1-1-.76 8.91 8.91 0 0 0-7.8-6.69v1.12a1.78 1.78 0 0 1-1.09 1.64A2 2 0 0 1 8.18 16l-5.06-4.41a1.76 1.76 0 0 1 0-2.68l5.06-4.42a2 2 0 0 1 2.18-.3 1.78 1.78 0 0 1 1.09 1.64V7A10.89 10.89 0 0 1 21.5 17.75a10.29 10.29 0 0 1-.31 2.49 1 1 0 0 1-1 .76zm-9.77-9.5a11.07 11.07 0 0 1 8.81 4.26A9 9 0 0 0 10.45 9a1 1 0 0 1-1-1V6.08l-4.82 4.17 4.82 4.21v-2a1 1 0 0 1 1-.96z\"/></g></g>","unlock-outline":"<g data-name=\"Layer 2\"><g data-name=\"unlock\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M17 8h-7V6a2 2 0 0 1 4 0 1 1 0 0 0 2 0 4 4 0 0 0-8 0v2H7a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-8a3 3 0 0 0-3-3zm1 11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1z\"/><path d=\"M12 12a3 3 0 1 0 3 3 3 3 0 0 0-3-3zm0 4a1 1 0 1 1 1-1 1 1 0 0 1-1 1z\"/></g></g>","upload-outline":"<g data-name=\"Layer 2\"><g data-name=\"upload\"><rect width=\"24\" height=\"24\" transform=\"rotate(180 12 12)\" opacity=\"0\"/><rect x=\"4\" y=\"4\" width=\"16\" height=\"2\" rx=\"1\" ry=\"1\" transform=\"rotate(180 12 5)\"/><rect x=\"17\" y=\"5\" width=\"4\" height=\"2\" rx=\"1\" ry=\"1\" transform=\"rotate(90 19 6)\"/><rect x=\"3\" y=\"5\" width=\"4\" height=\"2\" rx=\"1\" ry=\"1\" transform=\"rotate(90 5 6)\"/><path d=\"M8 14a1 1 0 0 1-.8-.4 1 1 0 0 1 .2-1.4l4-3a1 1 0 0 1 1.18 0l4 2.82a1 1 0 0 1 .24 1.39 1 1 0 0 1-1.4.24L12 11.24 8.6 13.8a1 1 0 0 1-.6.2z\"/><path d=\"M12 21a1 1 0 0 1-1-1v-8a1 1 0 0 1 2 0v8a1 1 0 0 1-1 1z\"/></g></g>","video-off-outline":"<g data-name=\"Layer 2\"><g data-name=\"video-off\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M17 15.59l-2-2L8.41 7l-2-2-1.7-1.71a1 1 0 0 0-1.42 1.42l.54.53L5.59 7l9.34 9.34 1.46 1.46 2.9 2.91a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z\"/><path d=\"M14 17H5a1 1 0 0 1-1-1V8a1 1 0 0 1 .4-.78L3 5.8A3 3 0 0 0 2 8v8a3 3 0 0 0 3 3h9a2.94 2.94 0 0 0 1.66-.51L14.14 17a.7.7 0 0 1-.14 0z\"/><path d=\"M21 7.15a1.7 1.7 0 0 0-1.85.3l-2.15 2V8a3 3 0 0 0-3-3H7.83l2 2H14a1 1 0 0 1 1 1v4.17l4.72 4.72a1.73 1.73 0 0 0 .6.11 1.68 1.68 0 0 0 .69-.15 1.6 1.6 0 0 0 1-1.48V8.63A1.6 1.6 0 0 0 21 7.15zm-1 7.45L17.19 12 20 9.4z\"/></g></g>","video-outline":"<g data-name=\"Layer 2\"><g data-name=\"video\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M21 7.15a1.7 1.7 0 0 0-1.85.3l-2.15 2V8a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3v-1.45l2.16 2a1.74 1.74 0 0 0 1.16.45 1.68 1.68 0 0 0 .69-.15 1.6 1.6 0 0 0 1-1.48V8.63A1.6 1.6 0 0 0 21 7.15zM15 16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1zm5-1.4L17.19 12 20 9.4z\"/></g></g>","volume-down-outline":"<g data-name=\"Layer 2\"><g data-name=\"volume-down\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M20.78 8.37a1 1 0 1 0-1.56 1.26 4 4 0 0 1 0 4.74A1 1 0 0 0 20 16a1 1 0 0 0 .78-.37 6 6 0 0 0 0-7.26z\"/><path d=\"M16.47 3.12a1 1 0 0 0-1 0L9 7.57H4a1 1 0 0 0-1 1v6.86a1 1 0 0 0 1 1h5l6.41 4.4A1.06 1.06 0 0 0 16 21a1 1 0 0 0 1-1V4a1 1 0 0 0-.53-.88zM15 18.1l-5.1-3.5a1 1 0 0 0-.57-.17H5V9.57h4.33a1 1 0 0 0 .57-.17L15 5.9z\"/></g></g>","volume-mute-outline":"<g data-name=\"Layer 2\"><g data-name=\"volume-mute\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M17 21a1.06 1.06 0 0 1-.57-.17L10 16.43H5a1 1 0 0 1-1-1V8.57a1 1 0 0 1 1-1h5l6.41-4.4A1 1 0 0 1 18 4v16a1 1 0 0 1-1 1zM6 14.43h4.33a1 1 0 0 1 .57.17l5.1 3.5V5.9l-5.1 3.5a1 1 0 0 1-.57.17H6z\"/></g></g>","volume-off-outline":"<g data-name=\"Layer 2\"><g data-name=\"volume-off\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M4.71 3.29a1 1 0 0 0-1.42 1.42l16 16a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z\"/><path d=\"M16.91 14.08l1.44 1.44a6 6 0 0 0-.07-7.15 1 1 0 1 0-1.56 1.26 4 4 0 0 1 .19 4.45z\"/><path d=\"M21 12a6.51 6.51 0 0 1-1.78 4.39l1.42 1.42A8.53 8.53 0 0 0 23 12a8.75 8.75 0 0 0-3.36-6.77 1 1 0 1 0-1.28 1.54A6.8 6.8 0 0 1 21 12z\"/><path d=\"M13.5 18.1l-5.1-3.5a1 1 0 0 0-.57-.17H3.5V9.57h3.24l-2-2H2.5a1 1 0 0 0-1 1v6.86a1 1 0 0 0 1 1h5l6.41 4.4a1.06 1.06 0 0 0 .57.17 1 1 0 0 0 1-1v-1.67l-2-2z\"/><path d=\"M13.5 5.9v4.77l2 2V4a1 1 0 0 0-1.57-.83L9.23 6.4l1.44 1.44z\"/></g></g>","volume-up-outline":"<g data-name=\"Layer 2\"><g data-name=\"volume-up\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><path d=\"M18.28 8.37a1 1 0 1 0-1.56 1.26 4 4 0 0 1 0 4.74A1 1 0 0 0 17.5 16a1 1 0 0 0 .78-.37 6 6 0 0 0 0-7.26z\"/><path d=\"M19.64 5.23a1 1 0 1 0-1.28 1.54A6.8 6.8 0 0 1 21 12a6.8 6.8 0 0 1-2.64 5.23 1 1 0 0 0-.13 1.41A1 1 0 0 0 19 19a1 1 0 0 0 .64-.23A8.75 8.75 0 0 0 23 12a8.75 8.75 0 0 0-3.36-6.77z\"/><path d=\"M15 3.12a1 1 0 0 0-1 0L7.52 7.57h-5a1 1 0 0 0-1 1v6.86a1 1 0 0 0 1 1h5l6.41 4.4a1.06 1.06 0 0 0 .57.17 1 1 0 0 0 1-1V4a1 1 0 0 0-.5-.88zm-1.47 15L8.4 14.6a1 1 0 0 0-.57-.17H3.5V9.57h4.33a1 1 0 0 0 .57-.17l5.1-3.5z\"/></g></g>","wifi-off-outline":"<g data-name=\"Layer 2\"><g data-name=\"wifi-off\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><circle cx=\"12\" cy=\"19\" r=\"1\"/><path d=\"M12.44 11l-1.9-1.89-2.46-2.44-1.55-1.55-1.82-1.83a1 1 0 0 0-1.42 1.42l1.38 1.37 1.46 1.46 2.23 2.24 1.55 1.54 2.74 2.74 2.79 2.8 3.85 3.85a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z\"/><path d=\"M21.72 7.93A13.93 13.93 0 0 0 12 4a14.1 14.1 0 0 0-4.44.73l1.62 1.62a11.89 11.89 0 0 1 11.16 3 1 1 0 0 0 .69.28 1 1 0 0 0 .72-.31 1 1 0 0 0-.03-1.39z\"/><path d=\"M3.82 6.65a14.32 14.32 0 0 0-1.54 1.28 1 1 0 0 0 1.38 1.44 13.09 13.09 0 0 1 1.6-1.29z\"/><path d=\"M17 13.14a1 1 0 0 0 .71.3 1 1 0 0 0 .72-1.69A9 9 0 0 0 12 9h-.16l2.35 2.35A7 7 0 0 1 17 13.14z\"/><path d=\"M7.43 10.26a8.8 8.8 0 0 0-1.9 1.49A1 1 0 0 0 7 13.14a7.3 7.3 0 0 1 2-1.41z\"/><path d=\"M8.53 15.4a1 1 0 1 0 1.39 1.44 3.06 3.06 0 0 1 3.84-.25l-2.52-2.52a5 5 0 0 0-2.71 1.33z\"/></g></g>","wifi-outline":"<g data-name=\"Layer 2\"><g data-name=\"wifi\"><rect width=\"24\" height=\"24\" opacity=\"0\"/><circle cx=\"12\" cy=\"19\" r=\"1\"/><path d=\"M12 14a5 5 0 0 0-3.47 1.4 1 1 0 1 0 1.39 1.44 3.08 3.08 0 0 1 4.16 0 1 1 0 1 0 1.39-1.44A5 5 0 0 0 12 14z\"/><path d=\"M12 9a9 9 0 0 0-6.47 2.75A1 1 0 0 0 7 13.14a7 7 0 0 1 10.08 0 1 1 0 0 0 .71.3 1 1 0 0 0 .72-1.69A9 9 0 0 0 12 9z\"/><path d=\"M21.72 7.93a14 14 0 0 0-19.44 0 1 1 0 0 0 1.38 1.44 12 12 0 0 1 16.68 0 1 1 0 0 0 .69.28 1 1 0 0 0 .72-.31 1 1 0 0 0-.03-1.41z\"/></g></g>"};

    /***/ }),

    /***/ "./package/src/animation.scss":
    /*!************************************!*\
      !*** ./package/src/animation.scss ***!
      \************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {
        var css = __webpack_require__(/*! !../../node_modules/css-loader!../../node_modules/sass-loader/lib/loader.js!./animation.scss */ "./node_modules/css-loader/index.js!./node_modules/sass-loader/lib/loader.js!./package/src/animation.scss");
        var insertCss = __webpack_require__(/*! ../../node_modules/isomorphic-style-loader/insertCss.js */ "./node_modules/isomorphic-style-loader/insertCss.js");
        var content = typeof css === 'string' ? [[module.i, css, '']] : css;

        exports = module.exports = css.locals || {};
        exports._getContent = function() { return content; };
        exports._getCss = function() { return '' + css; };
        exports._insertCss = function(options) { return insertCss(content, options) };
      

    /***/ }),

    /***/ "./package/src/default-attrs.json":
    /*!****************************************!*\
      !*** ./package/src/default-attrs.json ***!
      \****************************************/
    /*! exports provided: xmlns, width, height, viewBox, default */
    /***/ (function(module) {

    module.exports = {"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24"};

    /***/ }),

    /***/ "./package/src/icon.js":
    /*!*****************************!*\
      !*** ./package/src/icon.js ***!
      \*****************************/
    /*! exports provided: default */
    /***/ (function(module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    /* harmony import */ var classnames_dedupe__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! classnames/dedupe */ "./node_modules/classnames/dedupe.js");
    /* harmony import */ var classnames_dedupe__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(classnames_dedupe__WEBPACK_IMPORTED_MODULE_0__);
    /* harmony import */ var _default_attrs_json__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./default-attrs.json */ "./package/src/default-attrs.json");
    function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

    function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

    function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

    /**
     * @license
     * Copyright Akveo. All Rights Reserved.
     * Licensed under the MIT License. See License.txt in the project root for license information.
     */


    var defaultAnimationOptions = {
      hover: true
    };

    var isString = function isString(value) {
      return typeof value === 'string' || value instanceof String;
    };

    var Icon =
    /*#__PURE__*/
    function () {
      function Icon(name, contents) {
        _classCallCheck(this, Icon);

        this.name = name;
        this.contents = contents;
        this.attrs = _objectSpread({}, _default_attrs_json__WEBPACK_IMPORTED_MODULE_1__, {
          class: "eva eva-".concat(name)
        });
      }

      _createClass(Icon, [{
        key: "toSvg",
        value: function toSvg() {
          var attrs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

          var animation = attrs.animation,
              remAttrs = _objectWithoutProperties(attrs, ["animation"]);

          var animationOptions = getAnimationOptions(animation);
          var animationClasses = animationOptions ? animationOptions.class : '';

          var combinedAttrs = _objectSpread({}, this.attrs, remAttrs, {
            class: classnames_dedupe__WEBPACK_IMPORTED_MODULE_0___default()(this.attrs.class, attrs.class, animationClasses)
          });

          var svg = "<svg ".concat(attrsToString(combinedAttrs), ">").concat(this.contents, "</svg>");
          return !!animationOptions ? animationOptions.hover ? "<i class=\"eva-hover\">".concat(svg, "</i>") : svg : svg;
        }
      }, {
        key: "toString",
        value: function toString() {
          return this.contents;
        }
      }]);

      return Icon;
    }();

    function getAnimationOptions(animation) {
      if (!animation) {
        return null;
      }

      if (animation.hover) {
        animation.hover = isString(animation.hover) ? JSON.parse(animation.hover) : animation.hover;
      }

      var mergedAnimationOptions = _objectSpread({}, defaultAnimationOptions, animation);

      var animationType = mergedAnimationOptions.hover ? "eva-icon-hover-".concat(mergedAnimationOptions.type) : "eva-icon-".concat(mergedAnimationOptions.type);
      mergedAnimationOptions.class = classnames_dedupe__WEBPACK_IMPORTED_MODULE_0___default()({
        'eva-animation': true,
        'eva-infinite': isString(animation.infinite) ? JSON.parse(animation.infinite) : animation.infinite
      }, animationType);
      return mergedAnimationOptions;
    }

    function attrsToString(attrs) {
      return Object.keys(attrs).map(function (key) {
        return "".concat(key, "=\"").concat(attrs[key], "\"");
      }).join(' ');
    }

    /* harmony default export */ __webpack_exports__["default"] = (Icon);

    /***/ }),

    /***/ "./package/src/icons.js":
    /*!******************************!*\
      !*** ./package/src/icons.js ***!
      \******************************/
    /*! exports provided: default */
    /***/ (function(module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    /* harmony import */ var _icon__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./icon */ "./package/src/icon.js");
    /* harmony import */ var _package_build_eva_icons_json__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../package-build/eva-icons.json */ "./package-build/eva-icons.json");
    /**
     * @license
     * Copyright Akveo. All Rights Reserved.
     * Licensed under the MIT License. See License.txt in the project root for license information.
     */


    /* harmony default export */ __webpack_exports__["default"] = (Object.keys(_package_build_eva_icons_json__WEBPACK_IMPORTED_MODULE_1__).map(function (key) {
      return new _icon__WEBPACK_IMPORTED_MODULE_0__["default"](key, _package_build_eva_icons_json__WEBPACK_IMPORTED_MODULE_1__[key]);
    }).reduce(function (object, icon) {
      object[icon.name] = icon;
      return object;
    }, {}));

    /***/ }),

    /***/ "./package/src/index.js":
    /*!******************************!*\
      !*** ./package/src/index.js ***!
      \******************************/
    /*! exports provided: icons, replace */
    /***/ (function(module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    /* harmony import */ var _icons__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./icons */ "./package/src/icons.js");
    /* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "icons", function() { return _icons__WEBPACK_IMPORTED_MODULE_0__["default"]; });

    /* harmony import */ var _replace__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./replace */ "./package/src/replace.js");
    /* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "replace", function() { return _replace__WEBPACK_IMPORTED_MODULE_1__["default"]; });

    /* harmony import */ var _animation_scss__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./animation.scss */ "./package/src/animation.scss");
    /* harmony import */ var _animation_scss__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_animation_scss__WEBPACK_IMPORTED_MODULE_2__);
    /**
     * @license
     * Copyright Akveo. All Rights Reserved.
     * Licensed under the MIT License. See License.txt in the project root for license information.
     */




    if (typeof window !== 'undefined') {
      _animation_scss__WEBPACK_IMPORTED_MODULE_2___default.a._insertCss();
    }



    /***/ }),

    /***/ "./package/src/replace.js":
    /*!********************************!*\
      !*** ./package/src/replace.js ***!
      \********************************/
    /*! exports provided: default */
    /***/ (function(module, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);
    /* harmony import */ var classnames_dedupe__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! classnames/dedupe */ "./node_modules/classnames/dedupe.js");
    /* harmony import */ var classnames_dedupe__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(classnames_dedupe__WEBPACK_IMPORTED_MODULE_0__);
    /* harmony import */ var _icons__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./icons */ "./package/src/icons.js");
    function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

    function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

    function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

    /**
     * @license
     * Copyright Akveo. All Rights Reserved.
     * Licensed under the MIT License. See License.txt in the project root for license information.
     */


    var animationKeys = {
      'data-eva-animation': 'type',
      'data-eva-hover': 'hover',
      'data-eva-infinite': 'infinite'
    };
    var dataAttributesKeys = {
      'data-eva': 'name',
      'data-eva-width': 'width',
      'data-eva-height': 'height',
      'data-eva-fill': 'fill'
    };

    function replace() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      if (typeof document === 'undefined') {
        throw new Error('`eva.replace()` only works in a browser environment.');
      }

      var elementsToReplace = document.querySelectorAll('[data-eva]');
      Array.from(elementsToReplace).forEach(function (element) {
        return replaceElement(element, options);
      });
    }

    function replaceElement(element) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var _getAttrs = getAttrs(element),
          name = _getAttrs.name,
          elementAttrs = _objectWithoutProperties(_getAttrs, ["name"]);

      var svgString = _icons__WEBPACK_IMPORTED_MODULE_1__["default"][name].toSvg(_objectSpread({}, options, elementAttrs, {
        animation: getAnimationObject(options.animation, elementAttrs.animation)
      }, {
        class: classnames_dedupe__WEBPACK_IMPORTED_MODULE_0___default()(options.class, elementAttrs.class)
      }));
      var svgDocument = new DOMParser().parseFromString(svgString, 'text/html');
      var svgElement = svgDocument.querySelector('.eva-hover') || svgDocument.querySelector('svg');
      element.parentNode.replaceChild(svgElement, element);
    }

    function getAttrs(element) {
      return Array.from(element.attributes).reduce(function (attrs, attr) {
        if (!!animationKeys[attr.name]) {
          attrs['animation'] = _objectSpread({}, attrs['animation'], _defineProperty({}, animationKeys[attr.name], attr.value));
        } else {
          attrs = _objectSpread({}, attrs, getAttr(attr));
        }

        return attrs;
      }, {});
    }

    function getAttr(attr) {
      if (!!dataAttributesKeys[attr.name]) {
        return _defineProperty({}, dataAttributesKeys[attr.name], attr.value);
      }

      return _defineProperty({}, attr.name, attr.value);
    }

    function getAnimationObject(optionsAnimation, elementAttrsAnimation) {
      if (optionsAnimation || elementAttrsAnimation) {
        return _objectSpread({}, optionsAnimation, elementAttrsAnimation);
      }

      return null;
    }

    /* harmony default export */ __webpack_exports__["default"] = (replace);

    /***/ })

    /******/ });
    });

    });

    var eva$1 = /*@__PURE__*/getDefaultExportFromCjs(eva);

    var eva$2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.assign(/*#__PURE__*/Object.create(null), eva, {
        'default': eva$1
    }));

    /* src\Components\Icon.svelte generated by Svelte v3.31.0 */
    const file = "src\\Components\\Icon.svelte";

    function create_fragment(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "data-eva", /*icon*/ ctx[1]);
    			attr_dev(i, "data-eva-fill", /*fill*/ ctx[4]);
    			attr_dev(i, "data-eva-height", /*height*/ ctx[3]);
    			attr_dev(i, "data-eva-width", /*width*/ ctx[2]);
    			attr_dev(i, "data-eva-animation", /*animationType*/ ctx[0]);
    			add_location(i, file, 12, 0, 268);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*icon*/ 2) {
    				attr_dev(i, "data-eva", /*icon*/ ctx[1]);
    			}

    			if (dirty & /*fill*/ 16) {
    				attr_dev(i, "data-eva-fill", /*fill*/ ctx[4]);
    			}

    			if (dirty & /*height*/ 8) {
    				attr_dev(i, "data-eva-height", /*height*/ ctx[3]);
    			}

    			if (dirty & /*width*/ 4) {
    				attr_dev(i, "data-eva-width", /*width*/ ctx[2]);
    			}

    			if (dirty & /*animationType*/ 1) {
    				attr_dev(i, "data-eva-animation", /*animationType*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
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

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Icon", slots, []);
    	let { animationType } = $$props;
    	let { icon } = $$props;
    	let { width = 30 } = $$props;
    	let { height = 30 } = $$props;
    	let { fill = null } = $$props;

    	afterUpdate(() => {
    		eva.replace();
    	});

    	const writable_props = ["animationType", "icon", "width", "height", "fill"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Icon> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("animationType" in $$props) $$invalidate(0, animationType = $$props.animationType);
    		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
    		if ("width" in $$props) $$invalidate(2, width = $$props.width);
    		if ("height" in $$props) $$invalidate(3, height = $$props.height);
    		if ("fill" in $$props) $$invalidate(4, fill = $$props.fill);
    	};

    	$$self.$capture_state = () => ({
    		eva: eva$2,
    		afterUpdate,
    		animationType,
    		icon,
    		width,
    		height,
    		fill
    	});

    	$$self.$inject_state = $$props => {
    		if ("animationType" in $$props) $$invalidate(0, animationType = $$props.animationType);
    		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
    		if ("width" in $$props) $$invalidate(2, width = $$props.width);
    		if ("height" in $$props) $$invalidate(3, height = $$props.height);
    		if ("fill" in $$props) $$invalidate(4, fill = $$props.fill);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [animationType, icon, width, height, fill];
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			animationType: 0,
    			icon: 1,
    			width: 2,
    			height: 3,
    			fill: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*animationType*/ ctx[0] === undefined && !("animationType" in props)) {
    			console.warn("<Icon> was created without expected prop 'animationType'");
    		}

    		if (/*icon*/ ctx[1] === undefined && !("icon" in props)) {
    			console.warn("<Icon> was created without expected prop 'icon'");
    		}
    	}

    	get animationType() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animationType(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fill() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fill(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\Tooltip.svelte generated by Svelte v3.31.0 */

    const file$1 = "src\\Components\\Tooltip.svelte";

    // (7:4) {#if tooltip}
    function create_if_block(ctx) {
    	let span;
    	let t;
    	let span_class_value;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*tooltip*/ ctx[1]);
    			attr_dev(span, "class", span_class_value = "tooltiptext tooltip-" + /*position*/ ctx[0] + " svelte-ik0aak");
    			add_location(span, file$1, 7, 8, 141);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*tooltip*/ 2) set_data_dev(t, /*tooltip*/ ctx[1]);

    			if (dirty & /*position*/ 1 && span_class_value !== (span_class_value = "tooltiptext tooltip-" + /*position*/ ctx[0] + " svelte-ik0aak")) {
    				attr_dev(span, "class", span_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(7:4) {#if tooltip}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let t;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);
    	let if_block = /*tooltip*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "tooltip svelte-ik0aak");
    			add_location(div, file$1, 4, 0, 80);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			append_dev(div, t);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
    			}

    			if (/*tooltip*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			if (if_block) if_block.d();
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tooltip", slots, ['default']);
    	let { position = "top" } = $$props;
    	let { tooltip } = $$props;
    	const writable_props = ["position", "tooltip"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tooltip> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("position" in $$props) $$invalidate(0, position = $$props.position);
    		if ("tooltip" in $$props) $$invalidate(1, tooltip = $$props.tooltip);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ position, tooltip });

    	$$self.$inject_state = $$props => {
    		if ("position" in $$props) $$invalidate(0, position = $$props.position);
    		if ("tooltip" in $$props) $$invalidate(1, tooltip = $$props.tooltip);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [position, tooltip, $$scope, slots];
    }

    class Tooltip extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { position: 0, tooltip: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tooltip",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*tooltip*/ ctx[1] === undefined && !("tooltip" in props)) {
    			console.warn("<Tooltip> was created without expected prop 'tooltip'");
    		}
    	}

    	get position() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tooltip() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tooltip(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\Player.svelte generated by Svelte v3.31.0 */

    const { console: console_1 } = globals;
    const file$2 = "src\\Components\\Player.svelte";

    // (78:4) <Tooltip tooltip="随机">
    function create_default_slot_3(ctx) {
    	let icon;
    	let current;

    	icon = new Icon({
    			props: { icon: "refresh", animationType: "pulse" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(78:4) <Tooltip tooltip=\\\"随机\\\">",
    		ctx
    	});

    	return block;
    }

    // (83:2) {#if audio}
    function create_if_block_1(ctx) {
    	let a;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block_2, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*playing*/ ctx[4]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			a = element("a");
    			if_block.c();
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "svelte-1hne3cz");
    			add_location(a, file$2, 84, 3, 2703);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			if_blocks[current_block_type_index].m(a, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*togglePlay*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
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
    				if_block.m(a, null);
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
    			if (detaching) detach_dev(a);
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(83:2) {#if audio}",
    		ctx
    	});

    	return block;
    }

    // (92:4) {:else}
    function create_else_block(ctx) {
    	let span;
    	let tooltip;
    	let current;

    	tooltip = new Tooltip({
    			props: {
    				tooltip: "播放",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			span = element("span");
    			create_component(tooltip.$$.fragment);
    			add_location(span, file$2, 92, 5, 2902);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			mount_component(tooltip, span, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tooltip.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tooltip.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			destroy_component(tooltip);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(92:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (86:4) {#if playing}
    function create_if_block_2(ctx) {
    	let span;
    	let tooltip;
    	let current;

    	tooltip = new Tooltip({
    			props: {
    				tooltip: "暂停",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			span = element("span");
    			create_component(tooltip.$$.fragment);
    			add_location(span, file$2, 86, 5, 2761);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			mount_component(tooltip, span, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tooltip.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tooltip.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			destroy_component(tooltip);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(86:4) {#if playing}",
    		ctx
    	});

    	return block;
    }

    // (94:6) <Tooltip tooltip="播放">
    function create_default_slot_2(ctx) {
    	let icon;
    	let current;

    	icon = new Icon({
    			props: {
    				icon: "play-circle",
    				animationType: "pulse"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(94:6) <Tooltip tooltip=\\\"播放\\\">",
    		ctx
    	});

    	return block;
    }

    // (88:6) <Tooltip tooltip="暂停">
    function create_default_slot_1(ctx) {
    	let icon;
    	let current;

    	icon = new Icon({
    			props: {
    				icon: "pause-circle",
    				animationType: "pulse"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(88:6) <Tooltip tooltip=\\\"暂停\\\">",
    		ctx
    	});

    	return block;
    }

    // (101:2) {#if download}
    function create_if_block$1(ctx) {
    	let tooltip;
    	let current;

    	tooltip = new Tooltip({
    			props: {
    				tooltip: "下载",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tooltip.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tooltip, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tooltip_changes = {};

    			if (dirty & /*$$scope, download*/ 4100) {
    				tooltip_changes.$$scope = { dirty, ctx };
    			}

    			tooltip.$set(tooltip_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tooltip.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tooltip.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tooltip, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(101:2) {#if download}",
    		ctx
    	});

    	return block;
    }

    // (102:3) <Tooltip tooltip="下载">
    function create_default_slot(ctx) {
    	let a;
    	let icon;
    	let a_href_value;
    	let a_download_value;
    	let current;

    	icon = new Icon({
    			props: { icon: "download", animationType: "pulse" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			a = element("a");
    			create_component(icon.$$.fragment);
    			attr_dev(a, "href", a_href_value = /*download*/ ctx[2].link);
    			attr_dev(a, "download", a_download_value = /*download*/ ctx[2].name);
    			attr_dev(a, "class", "svelte-1hne3cz");
    			add_location(a, file$2, 102, 4, 3098);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			mount_component(icon, a, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*download*/ 4 && a_href_value !== (a_href_value = /*download*/ ctx[2].link)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (!current || dirty & /*download*/ 4 && a_download_value !== (a_download_value = /*download*/ ctx[2].name)) {
    				attr_dev(a, "download", a_download_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(102:3) <Tooltip tooltip=\\\"下载\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let div0;
    	let input;
    	let t0;
    	let a;
    	let span;
    	let tooltip;
    	let t1;
    	let t2;
    	let t3;
    	let div1;
    	let current;
    	let mounted;
    	let dispose;

    	tooltip = new Tooltip({
    			props: {
    				tooltip: "随机",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block0 = /*audio*/ ctx[3] && create_if_block_1(ctx);
    	let if_block1 = /*download*/ ctx[2] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			a = element("a");
    			span = element("span");
    			create_component(tooltip.$$.fragment);
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			div1 = element("div");
    			attr_dev(input, "id", "money-input");
    			attr_dev(input, "type", "number");
    			attr_dev(input, "max", MAX_VALUE);
    			attr_dev(input, "min", MIN_VALUE);
    			attr_dev(input, "class", "svelte-1hne3cz");
    			add_location(input, file$2, 67, 2, 2323);
    			add_location(span, file$2, 76, 3, 2519);
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "svelte-1hne3cz");
    			add_location(a, file$2, 75, 2, 2482);
    			attr_dev(div0, "id", "ui");
    			attr_dev(div0, "class", "svelte-1hne3cz");
    			add_location(div0, file$2, 66, 1, 2307);
    			div1.hidden = true;
    			add_location(div1, file$2, 109, 1, 3241);
    			attr_dev(main, "class", "svelte-1hne3cz");
    			add_location(main, file$2, 65, 0, 2299);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*money*/ ctx[0]);
    			append_dev(div0, t0);
    			append_dev(div0, a);
    			append_dev(a, span);
    			mount_component(tooltip, span, null);
    			append_dev(div0, t1);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t2);
    			if (if_block1) if_block1.m(div0, null);
    			append_dev(main, t3);
    			append_dev(main, div1);
    			/*div1_binding*/ ctx[8](div1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    					listen_dev(a, "click", /*randomize*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*money*/ 1 && to_number(input.value) !== /*money*/ ctx[0]) {
    				set_input_value(input, /*money*/ ctx[0]);
    			}

    			const tooltip_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				tooltip_changes.$$scope = { dirty, ctx };
    			}

    			tooltip.$set(tooltip_changes);

    			if (/*audio*/ ctx[3]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*audio*/ 8) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, t2);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*download*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*download*/ 4) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div0, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tooltip.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tooltip.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(tooltip);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			/*div1_binding*/ ctx[8](null);
    			mounted = false;
    			run_all(dispose);
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

    const MAX_VALUE = 999999999999;
    const MIN_VALUE = 1;

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Player", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	let money;
    	let audioContainer;
    	let download;
    	let audio;
    	let playing = false;

    	onMount(() => {
    		randomize();
    	});

    	const randomize = () => {
    		$$invalidate(0, money = Math.round(Math.random() * 999999999) / 100);
    	};

    	const removeAllChildren = el => {
    		while (el.firstChild) {
    			el.removeChild(el.firstChild);
    		}
    	};

    	const updateAudio = money => __awaiter(void 0, void 0, void 0, function* () {
    		const tokens = parse(money);
    		console.debug(tokens);
    		const merged = yield merger.concat(...alipay.begin(), ...tokens.map(token => alipay.use(token)), ...alipay.end());
    		const { element, url } = yield merger.export(merged);
    		removeAllChildren(audioContainer);

    		$$invalidate(2, download = {
    			link: url,
    			name: `alipay_${money.toFixed(2).replace(".", "_")}.mp3`
    		});

    		audioContainer.appendChild(element);
    		$$invalidate(3, audio = element);

    		$$invalidate(
    			3,
    			audio.onplaying = () => {
    				$$invalidate(4, playing = true);
    			},
    			audio
    		);

    		$$invalidate(
    			3,
    			audio.onpause = () => {
    				$$invalidate(4, playing = false);
    			},
    			audio
    		);
    	});

    	const togglePlay = () => __awaiter(void 0, void 0, void 0, function* () {
    		if (playing) {
    			audio.pause();
    			$$invalidate(3, audio.currentTime = 0, audio);
    		} else {
    			audio.play();
    		}
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Player> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		money = to_number(this.value);
    		$$invalidate(0, money);
    	}

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			audioContainer = $$value;
    			$$invalidate(1, audioContainer);
    		});
    	}

    	$$self.$capture_state = () => ({
    		__awaiter,
    		alipay,
    		parse,
    		merger,
    		onMount,
    		Icon,
    		Tooltip,
    		MAX_VALUE,
    		MIN_VALUE,
    		money,
    		audioContainer,
    		download,
    		audio,
    		playing,
    		randomize,
    		removeAllChildren,
    		updateAudio,
    		togglePlay
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("money" in $$props) $$invalidate(0, money = $$props.money);
    		if ("audioContainer" in $$props) $$invalidate(1, audioContainer = $$props.audioContainer);
    		if ("download" in $$props) $$invalidate(2, download = $$props.download);
    		if ("audio" in $$props) $$invalidate(3, audio = $$props.audio);
    		if ("playing" in $$props) $$invalidate(4, playing = $$props.playing);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*money*/ 1) {
    			 $$invalidate(0, money = Math.max(Math.min(money, MAX_VALUE), MIN_VALUE));
    		}

    		if ($$self.$$.dirty & /*money*/ 1) {
    			 updateAudio(money);
    		}
    	};

    	return [
    		money,
    		audioContainer,
    		download,
    		audio,
    		playing,
    		randomize,
    		togglePlay,
    		input_input_handler,
    		div1_binding
    	];
    }

    class Player extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Player",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\Components\Footer.svelte generated by Svelte v3.31.0 */
    const file$3 = "src\\Components\\Footer.svelte";

    // (12:8) <Tooltip tooltip="Github" position="left">
    function create_default_slot$1(ctx) {
    	let a;
    	let icon;
    	let current;

    	icon = new Icon({
    			props: {
    				icon: "github-outline",
    				animationType: "pulse",
    				fill: "#1a2a2a"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			a = element("a");
    			create_component(icon.$$.fragment);
    			attr_dev(a, "href", "https://github.com/sayTheMoney/sayTheMoney-svelte");
    			add_location(a, file$3, 12, 12, 368);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			mount_component(icon, a, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(12:8) <Tooltip tooltip=\\\"Github\\\" position=\\\"left\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let footer;
    	let section;
    	let span;
    	let t0;
    	let a;
    	let t2;
    	let t3;
    	let nav;
    	let tooltip;
    	let current;

    	tooltip = new Tooltip({
    			props: {
    				tooltip: "Github",
    				position: "left",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			section = element("section");
    			span = element("span");
    			t0 = text(" ");
    			a = element("a");
    			a.textContent = " ";
    			t2 = text(" ");
    			t3 = space();
    			nav = element("nav");
    			create_component(tooltip.$$.fragment);
    			attr_dev(a, "href", "https://github.com/sayTheMoney");
    			add_location(a, file$3, 7, 26, 169);
    			add_location(span, file$3, 7, 8, 151);
    			attr_dev(section, "class", "container  ");
    			add_location(section, file$3, 6, 4, 115);
    			attr_dev(nav, "class", "nav  ");
    			add_location(nav, file$3, 10, 4, 287);
    			attr_dev(footer, "class", " ");
    			add_location(footer, file$3, 5, 0, 102);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, section);
    			append_dev(section, span);
    			append_dev(span, t0);
    			append_dev(span, a);
    			append_dev(span, t2);
    			append_dev(footer, t3);
    			append_dev(footer, nav);
    			mount_component(tooltip, nav, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const tooltip_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				tooltip_changes.$$scope = { dirty, ctx };
    			}

    			tooltip.$set(tooltip_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tooltip.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tooltip.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    			destroy_component(tooltip);
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

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Icon, Tooltip });
    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.31.0 */
    const file$4 = "src\\App.svelte";

    function create_fragment$4(ctx) {
    	let div3;
    	let div1;
    	let div0;
    	let h1;
    	let t1;
    	let h3;
    	let t3;
    	let h4;
    	let t5;
    	let div2;
    	let player;
    	let t6;
    	let footer;
    	let current;
    	player = new Player({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "💰💰💰💰💰💰";
    			t1 = space();
    			h3 = element("h3");
    			h3.textContent = " ";
    			t3 = space();
    			h4 = element("h4");
    			h4.textContent = "输入金额，即刻到账！";
    			t5 = space();
    			div2 = element("div");
    			create_component(player.$$.fragment);
    			t6 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(h1, "class", "svelte-1wmania");
    			add_location(h1, file$4, 9, 12, 318);
    			attr_dev(h3, "class", "svelte-1wmania");
    			add_location(h3, file$4, 10, 12, 356);
    			attr_dev(h4, "class", "svelte-1wmania");
    			add_location(h4, file$4, 11, 12, 388);
    			attr_dev(div0, "class", "column column-80 column-offset-10");
    			add_location(div0, file$4, 8, 8, 258);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file$4, 7, 4, 232);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$4, 15, 4, 439);
    			attr_dev(div3, "class", "container svelte-1wmania");
    			attr_dev(div3, "id", "root");
    			add_location(div3, file$4, 6, 0, 194);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, h3);
    			append_dev(div0, t3);
    			append_dev(div0, h4);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			mount_component(player, div2, null);
    			insert_dev(target, t6, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(player.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(player.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(player);
    			if (detaching) detach_dev(t6);
    			destroy_component(footer, detaching);
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

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Player, Footer });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
