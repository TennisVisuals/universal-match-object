var touchManager = (function() {

   let behaviors = {
      orientation: undefined,
      time_threshold: 200,
      diff_threshold: 130,
      prevent_touch: true,
      prevent_double_tap: false,
      addSwipeTarget(target) {
         target.addEventListener('touchstart', handleTouchStart, false);
         target.addEventListener('touchmove', handleTouchMove, false);
         target.addEventListener('touchend', handleTouchEnd, false);

         target.addEventListener('mousedown', handleTouchStart, false);
         target.addEventListener('mousemove', handleTouchMove, false);
         target.addEventListener('mouseup', handleTouchEnd, false);
      },
   };

   document.addEventListener('touchmove', preventDrag, false);
   document.addEventListener('touchend', preventDoubleTap, false);

   document.addEventListener('mousemove', preventDrag, false);
   document.addEventListener('mouseup', preventDoubleTap, false);

   /* to make it appear more like a native app disable dragging and double tap */
   function preventDrag(evt) {
      if (behaviors.prevent_touch && (window.innerHeight > 450 || behaviors.orientation == 'landscape')) evt.preventDefault();
   }

   function preventDoubleTap(evt) { 
      let now = new Date().getTime();
      if (behaviors.prevent_double_tap && now - last_touch < 500) evt.preventDefault(); 
      last_touch = now;
   }

   let xDown = null;
   let yDown = null; 
   let xDiff = null;
   let yDiff = null;
   let timeDown = null;

   let last_touch = new Date().getTime();

   function handleTouchMove(evt) {
      if (!xDown || !yDown) return;
      if (evt.type == 'mousemove') {
         var xUp = evt.clientX;
         var yUp = evt.clientY;
      } else {
         var xUp = evt.touches[0].clientX;
         var yUp = evt.touches[0].clientY;
      }
      xDiff = xDown - xUp;
      yDiff = yDown - yUp;
   }

   function containsClassName (evntarget , classArr) {
      for (var i = classArr.length - 1; i >= 0; i--) {
         if( evntarget.classList.contains(classArr[i]) ) return true;
      }
   }

   let touch_target = null;
   function handleTouchStart(evt) { 
      touch_target = evt.target;
      timeDown = Date.now();
      if (evt.type == 'mousedown') {
         xDown = evt.clientX;
         yDown = evt.clientY;
      } else {
         xDown = evt.touches[0].clientX;
         yDown = evt.touches[0].clientY;
      }
      xDiff = 0;
      yDiff = 0;
   }

   function findAncestor (el, cls) {
      while ((el = el.parentNode) && el.classList && !el.classList.contains(cls));
      return el;
   }

   function handleTouchEnd(evt) { 
      let timeDiff = Date.now() - timeDown; 
      if (Math.abs(xDiff) > Math.abs(yDiff)) {
         if (Math.abs(xDiff) > behaviors.diff_threshold && timeDiff < behaviors.time_threshold) {
            if (xDiff > 0) { 
               if (typeof behaviors.swipeLeft == 'function') behaviors.swipeLeft(findAncestor(touch_target, 'swipe'));
            } else { 
               if (typeof behaviors.swipeRight == 'function') behaviors.swipeRight(findAncestor(touch_target, 'swipe'));
            }
         }
      } else {
         if (Math.abs(yDiff) > behaviors.diff_threshold && timeDiff < behaviors.time_threshold) {
            if (yDiff > 0) { 
               if (typeof behaviors.swipeUp == 'function') behaviors.swipeUp(findAncestor(touch_target, 'swipe'));
            } else { 
               if (typeof behaviors.swipeDown == 'function') behaviors.swipeDown(findAncestor(touch_target, 'swipe'));
            }
         }
      }
      xDown = null;
      yDown = null;
      timeDown = null; 
   }

   return behaviors;

})();
