// Этот плагин должен загружаться как можно раньше
export default defineNuxtPlugin({
  name: 'wayback-fix',
  enforce: 'pre', // Загружаем ДО других плагинов
  setup(nuxtApp) {
    if (typeof window === 'undefined') return

    // Проверяем, находимся ли мы в Wayback Machine
    const isWaybackMachine = window.location.href.includes('web.archive.org') || 
                             window.location.href.includes('archive.org')

    if (!isWaybackMachine) {
      return
    }

    console.log('Wayback Machine detected, applying router fixes...')

    // Перехватываем ошибки роутера, связанные с историей браузера
    // Используем Object.defineProperty для более надежного перехвата
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    // Обёртка для pushState, которая игнорирует ошибки в Wayback Machine
    try {
      Object.defineProperty(history, 'pushState', {
        value: function(...args: any[]) {
          try {
            return originalPushState.apply(history, args)
          } catch (e) {
            if (e instanceof DOMException) {
              console.warn('Wayback Machine: pushState blocked, ignoring')
              return
            }
            throw e
          }
        },
        writable: true,
        configurable: true
      })
    } catch (e) {
      // Fallback на обычное присваивание
      history.pushState = function(...args: any[]) {
        try {
          return originalPushState.apply(history, args)
        } catch (e) {
          if (e instanceof DOMException) {
            console.warn('Wayback Machine: pushState blocked, ignoring')
            return
          }
          throw e
        }
      }
    }

    // Обёртка для replaceState
    try {
      Object.defineProperty(history, 'replaceState', {
        value: function(...args: any[]) {
          try {
            return originalReplaceState.apply(history, args)
          } catch (e) {
            if (e instanceof DOMException) {
              console.warn('Wayback Machine: replaceState blocked, ignoring')
              return
            }
            throw e
          }
        },
        writable: true,
        configurable: true
      })
    } catch (e) {
      // Fallback на обычное присваивание
      history.replaceState = function(...args: any[]) {
        try {
          return originalReplaceState.apply(history, args)
        } catch (e) {
          if (e instanceof DOMException) {
            console.warn('Wayback Machine: replaceState blocked, ignoring')
            return
          }
          throw e
        }
      }
    }

    // Перехватываем глобальные ошибки роутера ДО того, как они вызовут перезагрузку
    const errorHandler = (event: ErrorEvent) => {
      if (event.error instanceof DOMException) {
        const message = event.error.message || ''
        if (message.includes('Invalid history change') || message.includes('history')) {
          event.preventDefault()
          event.stopPropagation()
          event.stopImmediatePropagation()
          console.warn('Wayback Machine: Router history error prevented')
          return false
        }
      }
    }

    window.addEventListener('error', errorHandler, true)

    // Предотвращаем автоматическую перезагрузку при ошибках роутера
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      if (event.reason instanceof DOMException) {
        const message = event.reason.message || ''
        if (message.includes('Invalid history change') || message.includes('history')) {
          event.preventDefault()
          console.warn('Wayback Machine: Router promise rejection prevented')
        }
      }
    }

    window.addEventListener('unhandledrejection', rejectionHandler)

    // Перехватываем ошибки в роутере Nuxt напрямую
    nuxtApp.hook('app:error', (error: any) => {
      if (error instanceof DOMException) {
        const message = error.message || ''
        if (message.includes('Invalid history change')) {
          console.warn('Wayback Machine: App router error caught and prevented')
          return false
        }
      }
    })

    // Также перехватываем через vue:error
    nuxtApp.vueApp.config.errorHandler = (err: any, instance, info) => {
      if (err instanceof DOMException) {
        const message = err.message || ''
        if (message.includes('Invalid history change')) {
          console.warn('Wayback Machine: Vue error handler caught router error')
          return false
        }
      }
      // Пропускаем другие ошибки дальше
    }
  }
})
