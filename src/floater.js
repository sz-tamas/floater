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
            this.topPos = 0;
            this.oldTop = 0;
            this.lastPageY = window.pageYOffset;
            this.options = $.extend({
                paddingTop: paddingTop,
                paddingBottom: paddingBottom,
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
            this.$element.css({top: 0, position: 'absolute', width: 'inherit',transition:'300ms all'});

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
            this.lastPageY = $(window).scrollTop();
        };

        Floater.prototype.recalc = function () {
            var top, old = +this.$element.css('top').replace('px', ''),
                max = this.$containerParent.outerHeight(true) - this.$element.outerHeight(true),
                parentOffsetTop = this.$relativeParent.offset().top,
                offsetTop = this.$element.offset().top,
                offsetBottom = offsetTop + this.$element.outerHeight(true),
                scrollYHeight = window.pageYOffset + window.innerHeight;

            // (Re)Set relative parent height
            this.$relativeParent.css({height: this.$element.height()});


            // Stick to top
            //top = $(window).scrollTop() - parentOffsetTop;//+ +this.options.paddingTop;


            if (this.$element.height() > window.innerHeight) {
                var diff = $(window).scrollTop() - this.lastPageY;

                if(scrollYHeight - paddingBottom <= offsetBottom && $(window).scrollTop() >= offsetTop) {
                  top = this.oldTop;
                } else {
                  this.topPos += diff;
                }
            }


            top = this.topPos;

            top = Math.max(top, 0);
            top = Math.min(top, max);
            //top = this.oldTop;
            this.oldTop = top;

            if (debug) console.log('FLOATER TOP', top);

            window.requestAnimationFrame(function() {
                this.scrollTop(top)
            }.bind(this));
        };

        Floater.prototype.scrollTop = function(top) {
            top += 'px';
            var value = {};
            value[this.options.scrollProp] = this.options.scrollProp === "top" ? top : 'translate3d(0px,'+top+',0px)';
            //console.log(value);
            this.$element.css(value);
            /*this.$element[this.options.animate === "false" ? "css" : "animate"](value,{
              queue: false, duration: +this.options.animationDuration || 250
            });*/
        };



        return Floater;
    })();

    $(document).ready(function() {
        ns.Floater.attach('[data-component="floater"]');
    });
}(jQuery, window, 'floater');
