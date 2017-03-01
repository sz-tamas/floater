/**
 @license Floater v1.0 | Tamas Szalczinger
 */
!function(window, namespace) {

    var ns = window[namespace] || {};
    window[namespace] = ns;

    var paddingTop = 8,
        paddingBottom = 8,
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

    var cssTransform = (function() {
        var prefixes = 'transform webkitTransform mozTransform oTransform msTransform'.split(' '),
            cssTransform;

        prefixes.some(function(prefix) {
            cssTransform = document.createElement('div').style[prefix] != undefined ? prefix : undefined;

            return !!cssTransform;
        });

        return cssTransform;
    })();

    ns.Floater = (function () {
        function Floater($element) {
            this.$element = $element;
            this.$containerParent = document.querySelector($element.dataset.floaterContainer);
            this.$relativeParent = document.querySelector($element.dataset.floaterParent) || $element.parentElement;

            this.scroll = {last: window.pageYOffset - 1, timeout: null, ticking: false};

            this.state = {top: 0, lastTop: 0};

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
            var self = this;

            document.querySelectorAll(target).forEach(function(element) {
                new self(element);
            });
        };

        Floater.prototype.init = function () {
            this.options.animationDuration = this.options.animate !== "false" ? this.options.animationDuration : 0;

            this.$relativeParent.style.minHeight = this.$element.offsetHeight + 'px';
            this.$relativeParent.style.height = '100%';
            this.$element.style.position = 'absolute';
            this.$element.style.width = 'inherit';

            if (this.options.transform) {
                this.$element.style.transition = this.options.animationDuration + 'ms transform cubic-bezier(0.5, 0.9, 0.8, 0.32)';
            } else {
                this.$element.style.top = 'initial';
            }

            window.addEventListener('scroll', this.onScroll.bind(this));
            window.addEventListener('resize', this.onScroll.bind(this));

            document.addEventListener('floater:recalc', this.recalc.bind(this));
            document.addEventListener('floater:standby-on', function() { this.options.standby = true; }.bind(this));
            document.addEventListener('floater:standby-off', function() { this.options.standby = false; }.bind(this));

            this.$element.addEventListener('floater:recalc', this.recalc.bind(this));
            this.$element.addEventListener('floater:standby-on', function() { this.options.standby = true; }.bind(this));
            this.$element.addEventListener('floater:standby-off', function() { this.options.standby = false; }.bind(this));

            if (debug) console.log('FLOATER ATTACHED', this.$element, this.options);

            this.onScroll();
        };

        Floater.prototype.onScroll = function() {
            if (this.options.mediaUp && (+this.options.mediaUp < window.innerWidth) ||
                this.options.mediaDown && (+this.options.mediaDown > window.innerWidth) ||
                !(this.options.mediaUp || this.options.mediaDown)) {
                this.recalc();
            } else {
                // Unset
                this.$element.style.position = 'absolute';
                this.$element.style.width = 'inherit';

                if (this.options.transform) {
                    this.$element.style.tansition = this.options.animationDuration + 'ms transform';
                } else {
                    this.$element.style.top = 'initial';
                }
            }

            this.scroll.last = window.pageYOffset;
        };

        Floater.prototype.recalc = function () {
            var top,
                elHeight = this.$element.offsetHeight,
                parentTop = Number.parseInt(this.$relativeParent.offsetTop) || Number.parseInt(this.$containerParent.offsetTop),
                max = (this.$containerParent.offsetHeight - elHeight - parentTop),
                elTop = this.state.lastTop - Number.parseInt(this.options.paddingTop),
                elBottom = this.state.lastTop + elHeight + Number.parseInt(this.options.paddingBottom),
                scrollY = window.scrollY,
                windowHeight = window.innerHeight,
                scrollHeight = scrollY + windowHeight;

            // (Re)Set relative parent height
            this.$relativeParent.style.height = elHeight + 'px';
            this.$relativeParent.style.minHeight = elHeight + 'px';

            // Skip setting top if in standby mode
            if (this.options.standby) return;

            // Stick to
            if (elHeight > windowHeight) {
                if (elTop + parentTop >= scrollY && this.scroll.last > scrollY) {
                    this.state.top -= Math.min(this.state.lastTop, (elTop + parentTop) - scrollY);
                } else if (elBottom + parentTop <= scrollHeight && this.scroll.last < scrollY) {
                    this.state.top += (scrollHeight) - (elBottom + parentTop);
                } else {
                    return;
                }

                top = this.state.top;
            } else {
                top = scrollY - parentTop + Number.parseInt(this.options.paddingTop);
            }

            top = Math.min(top, max);
            top = Math.max(top, 0);

            if (debug) console.log('FLOATER TOP', {top: top, lastTop: this.state.lastTop, max: max});

            this.state.top = top;
            this.state.lastTop = top;
            this.requestTick(top);
        };

        Floater.prototype.requestTick = function() {
            clearTimeout(this.scroll.timeout);
            this.scroll.timeout = setTimeout(function () {
                if (!this.scroll.ticking) {
                    window.requestAnimationFrame(function () {
                        this.scrollTop(this.state.top);
                    }.bind(this));
                }
                this.scroll.ticking = true;
            }.bind(this), 1);
        };

        Floater.prototype.scrollTop = function(top) {
            this.scroll.ticking = false;

            if (this.options.transform) {
                this.$element.style[this.options.transform] = 'translate3d(0, ' + top + 'px, 0)';
            } else {
                this.$element.style.top = top + 'px';
            }
        };

        return Floater;
    })();

    ns.Floater.attach('[data-component="floater"]');
}(window, 'floater');