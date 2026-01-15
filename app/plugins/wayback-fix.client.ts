export default defineNuxtPlugin((nuxtApp) => {
  // Проверяем, находимся ли мы в Wayback Machine
  const isWaybackMachine = typeof window !== 'undefined' && 
    (window.location.href.includes('web.archive.org') || 
     window.location.href.includes('archive.org'))

  if (!isWaybackMachine) {
    return
  }

  console.log('Wayback Machine detected, applying router fixes...')

  // Перехватываем ошибки роутера, связанные с историей браузера
  const originalPushState = history.pushState
  const originalReplaceState = history.replaceState

  // Обёртка для pushState, которая игнорирует ошибки в Wayback Machine
  history.pushState = function(...args) {
    try {
      return originalPushState.apply(history, args)
    } catch (e) {
      // Игнорируем ошибки изменения истории в Wayback Machine
      if (e instanceof DOMException) {
        console.warn('Wayback Machine: pushState blocked, ignoring')
        return
      }
      throw e
    }
  }

  // Обёртка для replaceState
  history.replaceState = function(...args) {
    try {
      return originalReplaceState.apply(history, args)
    } catch (e) {
      // Игнорируем ошибки изменения истории в Wayback Machine
      if (e instanceof DOMException) {
        console.warn('Wayback Machine: replaceState blocked, ignoring')
        return
      }
      throw e
    }
  }

  // Перехватываем глобальные ошибки роутера ДО того, как они вызовут перезагрузку
  const errorHandler = (event: ErrorEvent) => {
    if (event.error instanceof DOMException && 
        (event.error.message.includes('Invalid history change') ||
         event.error.message.includes('history'))) {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      console.warn('Wayback Machine: Router history error prevented')
      return false
    }
  }

  window.addEventListener('error', errorHandler, true)

  // Предотвращаем автоматическую перезагрузку при ошибках роутера
  const rejectionHandler = (event: PromiseRejectionEvent) => {
    if (event.reason instanceof DOMException && 
        (event.reason.message.includes('Invalid history change') ||
         event.reason.message.includes('history'))) {
      event.preventDefault()
      console.warn('Wayback Machine: Router promise rejection prevented')
    }
  }

  window.addEventListener('unhandledrejection', rejectionHandler)

  // Перехватываем ошибки в роутере Nuxt напрямую
  nuxtApp.hook('app:error', (error) => {
    if (error instanceof DOMException && 
        error.message.includes('Invalid history change')) {
      console.warn('Wayback Machine: App router error caught and prevented')
      return false // Предотвращаем дальнейшую обработку ошибки
    }
  })

  // Очистка при размонтировании (хотя это не критично для плагина)
  nuxtApp.hook('app:beforeMount', () => {
    console.log('Wayback Machine: App mounting, router fixes active')
  })
})
