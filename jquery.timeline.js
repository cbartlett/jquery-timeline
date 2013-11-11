(function($) {
  var touchable = !!('ontouchstart' in window)-0
    , moz = (/Firefox/i.test(navigator.userAgent))-0
    , transformProps = []
    , EVENT = {
        CLICK: 'click',
        DELTA: ['wheelDelta', 'detail'][moz],
        DELTA_FACTOR: [120, -3][moz],
        SCROLL: ['mousewheel', 'DOMMouseScroll'][moz],
        START: ['mousedown', 'touchstart'][touchable],
        MOVE: ['mousemove', 'touchmove'][touchable],
        END: ['mouseup', 'touchend'][touchable] }

  function has3d() {
    var el = document.createElement('p')
      , has3d
      , transforms = {
        'webkitTransform':'-webkit-transform',
        'OTransform':'-o-transform',
        'msTransform':'-ms-transform',
        'MozTransform':'-moz-transform',
        'transform':'transform' };

    document.body.insertBefore(el, null);

    for (var t in transforms) {
      if (el.style[t] !== undefined) {
        transformProps = [t, transforms[t]]
        el.style[t] = "translate3d(1px,1px,1px)";
        has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
      }
    }

    document.body.removeChild(el);

    return (has3d !== undefined && has3d.length > 0 && has3d !== "none");
  }

  $(has3d);

  $.fn.timeline = function(options) {
    var settings = $.extend({
        className: 'timeline',
        playheadTemplate: '<div><div></div></div>',
        scroll: true
      }, options || {})

    function transform(el, pos) {
      el.style[transformProps[0]] = 'translate3d(' + pos + 'px, 0, 0)';
    }

    function getTransform($el) {
        var results = $el.css(transformProps[1]).match(/matrix(?:(3d)\(\d+(?:, \d+)*(?:, (\d+))(?:, (\d+))(?:, (\d+)), \d+\)|\(\d+(?:, \d+)*(?:, (\d+))(?:, (\d+))\))/)

        if(!results) return [0, 0, 0];
        if(results[1] == '3d') return results.slice(2,5);

        results.push(0);
        return results.slice(5, 8);
    }

    function normalizeEvent(e) {
      var touch = null;
      if (e.originalEvent.touches && e.originalEvent.touches.length) {
        touch = e.originalEvent.touches[0];
      } else if (e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
        touch = e.originalEvent.changedTouches[0];
      }
      if(touch) {
        e.pageX = touch.pageX;
        e.pageY = touch.pageY;
        e.screenX = touch.screenX;
        e.screenY = touch.screenY;
        e.clientX = touch.clientX;
        e.clientY = touch.clientY;
        e['target'] = e['target'] || touch['target'];
        e['currentTarget'] = e['currentTarget'] || touch['currentTarget'];
        e['button'] = touch.button || 0;
      }
    }

    return this.each(function() {
      if (this.hasAttribute(settings.className)) return;
      this.setAttribute(settings.className, true);

      var $timeline = $(this).addClass(settings.className)
        , timeline = $timeline[0]
        , timelineWidth = $timeline.width()
        , $playhead = $(settings.playheadTemplate)
        , playhead = $playhead[0];

      var delta
        , direction
        , ease = false
        , ones = []
        , posX
        , then = (new Date()).getTime()
        , timeout;

      function cancel() {
        direction = null;
        ease = false;
        ones = [];
        posX = null;
        $(document).off(EVENT.SCROLL);
        setTimeout(function() {
          $(document).on(EVENT.SCROLL, scroll);
        }, 10);
      }

      function scroll(e) {
        var boost = 3
          , factor = EVENT.DELTA_FACTOR
          , now = (new Date()).getTime()
          , tmpDelta = e.originalEvent[EVENT.DELTA];

        delta = Math.round(Math.abs(tmpDelta / factor));

        if (delta > 1) ease = true;
        if (delta == 0) delta = 1;
        if (delta == 1 && ease) {
          ones.push(delta);
          if (ones.length > 10) {
            boost = 0;
          } else if (ones.length > 5) {
            boost = 1;
          } else if (ones.length > 2) {
            boost = 2;
          }
        } else {
          ones = [];
        }

        if (tmpDelta * factor < 0) {
          direction = 1;
        } else {
          direction = -1;
        }

        if (now - then > 400) {
          if (posX == null) {
            posX = getTransform($playhead)[0]-0;
          }
        }

        posX = posX + (delta * direction * boost);

        if (posX < 0) {
          posX = 0
        } else if (posX >= timelineWidth) {
          posX = timelineWidth-1;
        }

        transform(playhead, posX);

        clearTimeout(timeout);
        timeout = setTimeout(cancel, 300);
        then = now;
        return false;
      }

      function start(e) {
        normalizeEvent(e);
        e.preventDefault();
        e.stopPropagation();

        $(document).on(EVENT.MOVE, move);
        $(document).on(EVENT.END, end);

        var offsetX = $timeline.offset().left
          , newX = e.clientX - offsetX;

        transform(playhead, newX);

        function move(e) {
          normalizeEvent(e);
          e.preventDefault();

          newX = e.clientX - offsetX;

          if (newX < 5) {
            newX = 0;
          } else if (newX > timelineWidth - 5) {
            newX = timelineWidth-1;
          }

          transform(playhead, newX);
        }

        function end() {
          $(document).off(EVENT.MOVE, move);
          $(document).off(EVENT.END, end);
        }
      }

      if (!$.fn.timeline.initEvents) {
        $(document).on(EVENT.START, '.' + settings.className, start);

        if (settings.scroll) {
          $(document).on(EVENT.SCROLL, scroll);
        }

        $.fn.timeline.initEvents = true;
      }

      $timeline.css(transformProps[0], 'translate3d(0,0,0)').append($playhead);
    });
  }
})(jQuery);
