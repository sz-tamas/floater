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

            this.scroll = {last: window.pageYOffset - 1, timeout: null};

            this.state = {
                top: 0,
                lastTop: 0,
                parentTop: this.$relativeParent.offsetTop
            };

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

            this.$relativeParent.style.minHeight = this.$element.clientHeight;
            this.$relativeParent.style.minHeight = '100%';
            this.$element.style.position = 'absolute';
            this.$element.style.width = 'inherit';

            if (this.options.transform) {
                this.$element.style.transition = this.options.animationDuration + 'ms transform cubic-bezier(0.5, 0.32, 0.5, 0.32)';
            } else {
                this.$element.style.top = 'initial';
            }

            window.onscroll = this.onScroll.bind(this);
            window.onresize = this.onScroll.bind(this);

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
            var elHeight = this.$element.offsetHeight,
                top, max = this.$containerParent.offsetHeight - elHeight,
                elTop = this.state.lastTop - Number.parseInt(this.options.paddingTop),
                elBottom = this.state.lastTop + elHeight + Number.parseInt(this.options.paddingBottom),
                scrollY = window.scrollY,
                windowHeight = window.innerHeight,
                scrollHeight = scrollY + windowHeight;

            // (Re)Set relative parent height
            this.$relativeParent.style.height = elHeight;
            this.$relativeParent.style.minHeight = elHeight;

            // Skip setting top if in standby mode
            if (this.options.standby) return;

            // Stick to top
            if (this.$element.clientHeight > windowHeight) {
                if (elTop + this.state.parentTop > scrollY && this.scroll.last > scrollY) {
                    this.state.top -= Math.min(this.state.lastTop, (elTop + this.state.parentTop + Number.parseInt(this.options.paddingTop)) - scrollY);
                } else if (elBottom + this.state.parentTop + Number.parseInt(this.options.paddingBottom) < scrollHeight && this.scroll.last < scrollY) {
                    this.state.top += (scrollHeight) - (elBottom + this.state.parentTop);
                } else {
                    return;
                }

                top = this.state.top;
            } else {
                top = scrollY - this.state.parentTop + Number.parseInt(this.options.paddingTop);
            }

            top = Math.min(top, max);
            top = Math.max(top, 0);

            if (debug) console.log('FLOATER TOP', {top: top, lastTop: this.state.lastTop});

            this.state.lastTop = top;

            clearTimeout(this.scroll.timeout);
            this.scroll.timeout = setTimeout(function() {
                window.requestAnimationFrame(function() {
                    this.scrollTop(top)
                }.bind(this));
            }.bind(this), 1);
        };

        Floater.prototype.scrollTop = function(top) {
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