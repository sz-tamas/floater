/**
 @license Floater v1.0 | Tamas Szalczinger
 */
!function($, window, namespace) {

    var ns = window[namespace] || {};
    window[namespace] = ns;

    var paddingTop = 8,
        paddingBottom = 8,
        debug = false;

    ns.Floater = (function () {
        function Floater($element, $containerParent, $relativeParent, options) {
            this.$element = $element;
            this.$containerParent = $containerParent;
            this.$relativeParent = $relativeParent.length ? $relativeParent : $element.parent();
            this.lastScroll = 0;
            this.scrollDirection = '';
            this.scrollTimeout = null;
            this.top = 0;
            this.oldTop = 0;
            this.lastPageY = window.pageYOffset;
            this.options = $.extend({
                paddingTop: paddingTop,
                paddingBottom: paddingBottom,
                animationDuration: 250,
                scrollProp: 'transform'
            }, options || {});
            this.standby = this.options.standby || false;

            this.init();
            if (debug) console.log('FLOATER ATTACHED', this.$element, this.options);
        }

        Floater.attach = function(target) {
            var self = this;

            $(target).each(function(i, element) {
                new self($(element),
                    $($(element).data('floaterContainer')),
                    $($(element).data('floaterParent')),
                    $(element).data('floaterOptions')
                );
            });
        };

        Floater.prototype.init = function () {
            this.$relativeParent.css({'min-height': this.$element.height(), height: '100%'});
            this.$element.css({
                top: 'initial',
                position: 'absolute',
                width: 'inherit',
                transition: this.options.animationDuration + 'ms all'
            });

            $(window).on('scroll', this.onScroll.bind(this));

            $(document).on('floater:recalc', this.recalc.bind(this));
            $(document).on('floater:standby-on', function() { this.standby = true; }.bind(this));
            $(document).on('floater:standby-off', function() { this.standby = false; }.bind(this));

            $(this.$element).on('floater:recalc', this.recalc.bind(this));
            $(this.$element).on('floater:standby-on', function() { this.standby = true; }.bind(this));
            $(this.$element).on('floater:standby-off', function() { this.standby = false; }.bind(this));
            this.onScroll();
        };

        Floater.prototype.onScroll = function() {
            this.scrollDirection = $(window).scrollTop() < this.lastScroll ? 'UP' : 'DOWN';
            this.lastScroll = $(window).scrollTop();

            if (debug) console.log('FLOATER SCROLL', this.scrollDirection);

            if (this.options.mediaUp && (+this.options.mediaUp < window.innerWidth) ||
                this.options.mediaDown && (+this.options.mediaDown > window.innerWidth) ||
                !(this.options.mediaUp || this.options.mediaDown)) {
                this.recalc();
            } else {
                // Unset
                this.$element.css({
                    transform: 'none',
                    top: 'initial',
                    position: 'absolute',
                    width: 'inherit',
                    transition: this.options.animationDuration+'ms transform ease-in-out 0s'
                });
            }

            this.lastPageY = $(window).scrollTop();
        };

        Floater.prototype.recalc = function () {
            var top, max = this.$containerParent.outerHeight(true) - this.$element.outerHeight(true),
                parentOffsetTop = this.$relativeParent.offset().top,
                offsetTop = this.$element.offset().top,
                offsetBottom = offsetTop + this.$element.outerHeight(true),
                scrollYHeight = window.pageYOffset + window.innerHeight,
                scrollTop = Number.parseInt($(window).scrollTop());

            // (Re)Set relative parent height
            this.$relativeParent.css({
                'min-height': this.$element.outerHeight(true),
                height: this.$element.outerHeight(true)
            });

            // Skip setting top if in standby mode
            if (this.standby) return;

            // Stick to top
            if (this.$element.height() > window.innerHeight) {
                if(scrollYHeight - Number.parseInt(this.options.paddingBottom) <= offsetBottom &&
                    scrollTop + Number.parseInt(this.options.paddingTop) >= offsetTop) {
                    this.top = this.oldTop;
                } else {
                    this.top += scrollTop - this.lastPageY;
                }
                top = this.top;
            } else {
                top = scrollTop - parentOffsetTop + Number.parseInt(this.options.paddingTop);
            }

            top = Math.max(top, 0);
            top = Math.min(top, max);

            if (debug) console.log('FLOATER TOP', {top: top, oldTop: oldTop});

            this.oldTop = top;

            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = setTimeout(function() {
                window.requestAnimationFrame(function() {
                    this.scrollTop(top)
                }.bind(this));
            }.bind(this), 5);
        };

        Floater.prototype.scrollTop = function(top) {
            var value = {};

            top = top < 0 ? 0 : top;

            value[this.options.scrollProp] = this.options.scrollProp === "top" ?
            top + 'px' : 'translate3d(0,' + top + 'px, 0)';

            this.$element.css(value);
        };

        return Floater;
    })();

    $(document).ready(function() {
        ns.Floater.attach('[data-component="floater"]');
    });
}(jQuery, window, 'floater');