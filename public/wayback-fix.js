// Этот скрипт должен загружаться ДО загрузки Nuxt
(function() {
  'use strict';
  
  if (typeof window === 'undefined') return;
  
  // Проверяем, находимся ли мы в Wayback Machine
  const isWaybackMachine = window.location.href.includes('web.archive.org') || 
                           window.location.href.includes('archive.org');
  
  if (!isWaybackMachine) return;
  
  console.log('Wayback Machine: Early history API interception (inline script)');
  
  // Сохраняем оригинальные методы ДО того, как Nuxt их использует
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  // Перехватываем pushState
  try {
    Object.defineProperty(history, 'pushState', {
      value: function() {
        try {
          return originalPushState.apply(history, arguments);
        } catch (e) {
          if (e instanceof DOMException) {
            console.warn('Wayback Machine: pushState blocked');
            return;
          }
          throw e;
        }
      },
      writable: true,
      configurable: true
    });
  } catch (e) {
    history.pushState = function() {
      try {
        return originalPushState.apply(history, arguments);
      } catch (e) {
        if (e instanceof DOMException) {
          console.warn('Wayback Machine: pushState blocked');
          return;
        }
        throw e;
      }
    };
  }
  
  // Перехватываем replaceState
  try {
    Object.defineProperty(history, 'replaceState', {
      value: function() {
        try {
          return originalReplaceState.apply(history, arguments);
        } catch (e) {
          if (e instanceof DOMException) {
            console.warn('Wayback Machine: replaceState blocked');
            return;
          }
          throw e;
        }
      },
      writable: true,
      configurable: true
    });
  } catch (e) {
    history.replaceState = function() {
      try {
        return originalReplaceState.apply(history, arguments);
      } catch (e) {
        if (e instanceof DOMException) {
          console.warn('Wayback Machine: replaceState blocked');
          return;
        }
        throw e;
      }
    };
  }
  
  // Перехватываем ошибки глобально
  window.addEventListener('error', function(event) {
    if (event.error instanceof DOMException) {
      const message = event.error.message || '';
      if (message.includes('Invalid history change') || message.includes('history')) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        console.warn('Wayback Machine: History error prevented');
        return false;
      }
    }
  }, true);
  
  // Перехватываем unhandled rejections
  window.addEventListener('unhandledrejection', function(event) {
    if (event.reason instanceof DOMException) {
      const message = event.reason.message || '';
      if (message.includes('Invalid history change') || message.includes('history')) {
        event.preventDefault();
        console.warn('Wayback Machine: Promise rejection prevented');
      }
    }
  });
})();
