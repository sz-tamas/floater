/**
 @license Floater v2.0 | Tamas Szalczinger
 */
!function(window, namespace) {

    var ns = window[namespace] || {};
    window[namespace] = ns;

    var paddingTop = 0,
        paddingBottom = 0,
        debug = true;

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

            this.scroll = {last: window.pageYOffset - 1, ticking: 0, skipped: false};

            this.state = {top: 0, elHeight: 0, rpHeight: 0, cpHeight: 0, pTop: 0, wHeight: 0};

            this.options = Object.assign({
                paddingTop: paddingTop,
                paddingBottom: paddingBottom,
                animationDuration: 250,
                standby: false,
                transform: cssTransform
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
            this.$element.style.perspective = 1000;

            if (this.options.transform) {
                this.$element.style.transition = parseInt(this.options.animationDuration) + 'ms transform linear 0s';
                this.$element.style.willChange = 'transform, scroll-position, transition';
            } else {
                this.$element.style.top = 'initial';
                this.$element.style.willChange = 'top';
            }

            window.addEventListener('scroll', this.onscroll.bind(this));
            window.addEventListener('resize', this.onscroll.bind(this));
			window.addEventListener('touchmove', this.onscroll.bind(this));
            window.setInterval(this.cache.bind(this), 1500);

            document.addEventListener('floater:recalc', this.recalc.bind(this));
            document.addEventListener('floater:cache', this.cache.bind(this));
            document.addEventListener('floater:standby-on', function() { this.options.standby = true; }.bind(this));
            document.addEventListener('floater:standby-off', function() { this.options.standby = false; }.bind(this));

            this.$element.addEventListener('floater:recalc', this.recalc.bind(this));
            this.$element.addEventListener('floater:cache', this.cache.bind(this));
            this.$element.addEventListener('floater:standby-on', function() { this.options.standby = true; }.bind(this));
            this.$element.addEventListener('floater:standby-off', function() { this.options.standby = false; }.bind(this));

            this.debug('FLOATER ATTACHED', this.$element, this.options);
            this.cache();
            this.onscroll();
        };

        Floater.prototype.isMediaEnabled = function() {
            return this.options.mediaUp && (+this.options.mediaUp < window.innerWidth) ||
                this.options.mediaDown && (+this.options.mediaDown > window.innerWidth) ||
                !(this.options.mediaUp || this.options.mediaDown);
        };

        Floater.prototype.onscroll = function() {
            if (this.isMediaEnabled()) {
                this.recalc();
            } else {
                this.$element.style.position = 'relative';
                this.$element.style.width = 'inherit';

                if (this.options.transform) {
                    this.$element.style[this.options.transform] = 'none';
                } else {
                    this.$element.style.top = 'initial';
                }
            }
        };

        Floater.prototype.cache = function() {
            this.state.elHeight = this.$element.offsetHeight;
            this.state.rpHeight = this.$relativeParent.offsetHeight;
            this.state.cpHeight = this.$containerParent.offsetHeight;
            this.state.pTop = parseInt(this.$relativeParent.offsetTop) || parseInt(this.$containerParent.offsetTop);
            this.state.wHeight = window.innerHeight;
        };

        Floater.prototype.recalc = function () {
			if (this.scroll.ticking > 0) {
			    this.scroll.skipped = true;
			    return false;
            }

            this.scroll.ticking = window.requestAnimationFrame(function () {
                var top = this.state.top,
                    max = this.state.cpHeight - this.state.elHeight - this.options.paddingTop,
                    elTop = top - parseInt(this.options.paddingTop),
                    elBottom = top + this.state.elHeight + parseInt(this.options.paddingBottom),
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
                        top -= Math.min(this.state.top, (elTop + this.state.pTop) - scrollY);
                    } else if (elBottom + this.state.pTop < scrollHeight) {
                        top += scrollHeight - (elBottom + this.state.pTop);
                    } else {
                        this.debug('FLOATER TICKING END');
                        this.scroll.ticking = 0;
                        return;
                    }
                } else {
                    top = scrollY - this.state.pTop + parseInt(this.options.paddingTop);
                }

                top = Math.min(top, max);
                top = Math.max(top, 0);
                this.scrollTop(top);
                this.scroll.last = scrollY;
            }.bind(this));
        };

        Floater.prototype.scrollTop = function(top) {
            this.debug('FLOATER TOP', top, this.state.top);

            if (this.options.transform) {
                this.$element.style[this.options.transform] = 'translate3d(0, ' + top + 'px, 0)';
                setTimeout(function() {
                    this.state.top = top;
                    this.scroll.ticking = 0;

                    if (this.scroll.skipped) {
                        this.debug('FLOATER RUN SKIPPED');
                        this.scroll.skipped = false;
                        this.recalc();
                    }
                }.bind(this), parseInt(this.options.animationDuration));
            } else {
                this.$element.style.top = top + 'px';
                this.state.top = top;
                this.scroll.ticking = 0;
            }
        };

        Floater.prototype.debug = function() {
            if (debug && console && console['debug']) {
                console.debug(arguments);
            }
        };

        return Floater;
    })();

    window.onload = function() {
        ns.Floater.attach('[data-component="floater"]');
    };
}(window, 'floater');