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
            this.standby = options.standby || false;
            this.options = $.extend({
                paddingTop: paddingTop,
                paddingBottom: paddingBottom
            }, options || {});

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
            this.$relativeParent.css({height: this.$element.height()});
            this.$element.css({top: 0, position: 'absolute', width: 'inherit'});

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

            if (this.standby) return;

            if (this.options.mediaUp && (+this.options.mediaUp < window.innerWidth) ||
                this.options.mediaDown && (+this.options.mediaDown > window.innerWidth) ||
                !(this.options.mediaUp || this.options.mediaDown)) {
                this.recalc();
            }
        };

        Floater.prototype.recalc = function () {
            var top, oldTop = +this.$element.css('top').replace('px', ''),
                max = this.$containerParent.height() - this.$element.height(),
                parentOffsetTop = this.$relativeParent.offset().top,
                offsetTop = this.$element.offset().top,
                offsetBottom = offsetTop + this.$element.height(),
                scrollYHeight = window.pageYOffset + window.innerHeight;

            // (Re)Set relative parent height
            this.$relativeParent.css({height: this.$element.height()});

            // Stick to top
            top = $(window).scrollTop() - parentOffsetTop + +this.options.paddingTop;

            if (this.$element.height() > window.innerHeight) {
                switch (this.scrollDirection) {
                    case 'UP': // Stick to top || oldTop
                        top = (offsetTop > window.pageYOffset) ?
                            Math.min(top, oldTop) : oldTop;
                        break;
                    case 'DOWN': // Stick to bottom || oldTop
                        top = (offsetBottom < scrollYHeight) ?
                        oldTop + (scrollYHeight - offsetBottom) - +this.options.paddingBottom : oldTop;
                        break;
                }
            }

            top = Math.max(top, 0);
            top = Math.min(top, max);

            if (debug) console.log('FLOATER TOP', top);

            window.requestAnimationFrame(function() {
                this.options.animate === "false" ?
                    this.scrollTop(top) :
                    this.animateTop(top);
            }.bind(this));
        };

        Floater.prototype.scrollTop = function(top) {
            this.$element.css({top: top + 'px'});
        };

        Floater.prototype.animateTop = function(top) {
            this.$element.animate({top: top + "px"}, {
                queue: false, duration: +this.options.animationDuration || 250
            });
        };

        return Floater;
    })();

    $(document).ready(function() {
        ns.Floater.attach('[data-component="floater"]');
    });
}(jQuery, window, 'floater');