/**
 @license Floater v2.0 | Tamas Szalczinger
 */
!function(window, namespace) {

    var ns = window[namespace] || {};
    window[namespace] = ns;

    var paddingTop = 8,
        paddingBottom = 8,
        debug = false;

    // Polyfill
    if (typeof Object.assign != 'function') {
        Object.assign = function(target, varArgs) { // .length of function is 2
            'use strict';
            if (target == null) { // TypeError if undefined or null
                throw new TypeError('Cannot convert undefined or null to object');
            }

            var to = Object(target);

            for (var index = 1; index < arguments.length; index++) {
                var nextSource = arguments[index];

                if (nextSource != null) { // Skip over if undefined or null
                    for (var nextKey in nextSource) {
                        // Avoid bugs when hasOwnProperty is shadowed
                        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            }
            return to;
        };
    }

    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
    // requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
    // MIT license
    (function() {
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                || window[vendors[x]+'CancelRequestAnimationFrame'];
        }

        if (!window.requestAnimationFrame)
            window.requestAnimationFrame = function(callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                    timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };

        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
    }());

    var cssTransition = (function() {
        var fakeElement = document.createElement('div'),
            transitions = {
                "transition"      : "transitionend",
                "-o-Transition"     : "oTransitionEnd",
                "-moz-transition"   : "transitionend",
                "-webkit-transition": "webkitTransitionEnd"
            };

        for (t in transitions){
            if (fakeElement.style[t] !== undefined){
                return transitions[t];
            }
        }
    })();

    var cssTransform = (function() {
        var prefixes = 'transform -webkit-transform -moz-transform -o-transform'.split(' '),
            fakeElement = document.createElement('div'),
            cssTransform;

        prefixes.some(function(prefix) {
            cssTransform = fakeElement.style[prefix] != undefined ? prefix : undefined;

            return !!cssTransform;
        });

        return cssTransform;
    })();

    ns.Floater = (function () {
        function Floater($element) {
            this.$element = $element;
            this.$containerParent = document.querySelector($element.dataset.floaterContainer);
            this.$relativeParent = document.querySelector($element.dataset.floaterParent) || $element.parentElement;

            this.scroll = {last: window.pageYOffset - 1, timeout: null, ticking: 0};

            this.state = {top: 0, lastTop: 0, elHeight: 0, rpHeight: 0, cpHeight: 0, pTop: 0, wHeight: 0};

            this.options = Object.assign({
                paddingTop: paddingTop,
                paddingBottom: paddingBottom,
                animationDuration: 250,
                standby: false,
                transform: cssTransform,
                transition: cssTransition
            }, JSON.parse($element.dataset.floaterOptions || '{}'));

            this.init();
        }

        Floater.attach = function(target) {
            var self = this, elements = document.querySelectorAll(target);

            Object.keys(elements).forEach(function(key) {
                new self(elements[key]);
            });
        };

        Floater.prototype.init = function () {
            this.options.animationDuration = this.options.animate !== "false" ? this.options.animationDuration : 0;

            this.$relativeParent.style.minHeight = this.$element.offsetHeight + 'px';
            this.$relativeParent.style.height = '100%';
            this.$element.style.position = 'absolute';
            this.$element.style.width = 'inherit';
            this.$element.style.backfaceVisibility = 'hidden';
            this.$element.style.perspective = 1000;

            if (this.options.transform && this.options.transition) {
                this.$element.style.transition = (Number.parseInt(this.options.animationDuration) + 10) + 'ms all cubic-bezier(0.5, 0.5, 0.5, 0) 0s';
                this.$element.style.willChange = 'transform, scroll-position';
            } else {
                this.$element.style.top = 'initial';
                this.$element.style.willChange = 'top';
            }

            window.addEventListener('scroll', this.onscroll.bind(this));
            window.addEventListener('resize', this.onscroll.bind(this));
            window.setInterval(this.cache.bind(this), 3000);

            document.addEventListener('floater:recalc', this.recalc.bind(this));
            document.addEventListener('floater:cache', this.cache.bind(this));
            document.addEventListener('floater:standby-on', function() { this.options.standby = true; }.bind(this));
            document.addEventListener('floater:standby-off', function() { this.options.standby = false; }.bind(this));

            this.$element.addEventListener('floater:recalc', this.recalc.bind(this));
            this.$element.addEventListener('floater:cache', this.cache.bind(this));
            this.$element.addEventListener('floater:standby-on', function() { this.options.standby = true; }.bind(this));
            this.$element.addEventListener('floater:standby-off', function() { this.options.standby = false; }.bind(this));

            if (debug) console.log('FLOATER ATTACHED', this.$element, this.options);

            this.cache();
            this.onscroll();
        };

        Floater.prototype.onscroll = function() {
            if (this.options.mediaUp && (+this.options.mediaUp < window.innerWidth) ||
                this.options.mediaDown && (+this.options.mediaDown > window.innerWidth) ||
                !(this.options.mediaUp || this.options.mediaDown)) {
                this.recalc();
            } else {
                // Unset
                this.$element.style.position = 'absolute';
                this.$element.style.width = 'inherit';

                if (this.options.transform && this.options.transition) {
                    this.$element.style.transform = 'none';
                } else {
                    this.$element.style.top = 'initial';
                }
            }
        };

        Floater.prototype.cache = function() {
            this.state.elHeight = this.$element.offsetHeight;
            this.state.rpHeight = this.$relativeParent.offsetHeight;
            this.state.cpHeight = this.$containerParent.offsetHeight;
            this.state.pTop = Number.parseInt(this.$relativeParent.offsetTop) || Number.parseInt(this.$containerParent.offsetTop);
            this.state.wHeight = window.innerHeight;
        };

        Floater.prototype.recalc = function () {
            if (this.scroll.ticking > 0) return;

            this.scroll.ticking = window.requestAnimationFrame(function () {
                var top = this.state.lastTop,
                    max = this.state.cpHeight - this.state.elHeight - this.state.pTop,
                    elTop = this.state.lastTop - Number.parseInt(this.options.paddingTop),
                    elBottom = this.state.lastTop + this.state.elHeight + Number.parseInt(this.options.paddingBottom),
                    scrollY = window.pageYOffset,
                    scrollHeight = scrollY + this.state.wHeight;

                // (Re)Set relative parent height
                this.$relativeParent.style.height = this.state.elHeight + 'px';
                this.$relativeParent.style.minHeight = this.state.elHeight + 'px';

                // Skip setting top if in standby mode
                if (this.options.standby) return;

                // Stick to
                if (this.state.elHeight > this.state.wHeight) {
                    if (elTop + this.state.pTop > scrollY) {
                        top -= Math.min(this.state.lastTop, (elTop + this.state.pTop) - scrollY);
                    } else if (elBottom + this.state.pTop < scrollHeight) {
                        top += scrollHeight - (elBottom + this.state.pTop);
                    } else {
                        if (debug) console.log('FLOATER TICKING END');
                        this.scroll.ticking = 0;
                        return;
                    }
                } else {
                    top = scrollY - this.state.pTop + Number.parseInt(this.options.paddingTop);
                    this.scroll.ticking = 0;
                }

                top = Math.min(top, max);
                top = Math.max(top, 0);
                this.scrollTop(top);
                this.scroll.last = scrollY;
                // this.scroll.ticking = true;
            }.bind(this));
        };

        Floater.prototype.scrollTop = function(top) {
            if (debug) console.log('FLOATER TOP', {top: top, lastTop: this.state.lastTop});

            if (this.options.transform && this.options.transition) {
                this.$element.style[this.options.transform] = 'translate3d(0, ' + top + 'px, 0)';
                if (Number.parseInt(this.options.animationDuration) > 100) {
                    setTimeout(function() {
                        this.scroll.ticking = 0;
                    }.bind(this), Number.parseInt(this.options.animationEnd) + 10);
                }
            } else {
                this.$element.style.top = top + 'px';
                this.scroll.ticking = 0;
            }
            this.state.lastTop = this.state.top;
            this.state.top = top;
        };

        return Floater;
    })();

    ns.Floater.attach('[data-component="floater"]');
}(window, 'floater');