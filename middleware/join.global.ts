export default defineNuxtRouteMiddleware((to) => {
  const path = to.path
  
  // If path is /join/[id], ensure it goes to /join/[id].vue
  // Check if path matches /join/[id] pattern
  const joinMatch = path.match(/^\/join\/([a-f0-9-]+)$/i)
  if (joinMatch && joinMatch[1]) {
    const groupId = joinMatch[1]
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(groupId)) {
      // Path is /join/[id], let it pass through to /join/[id].vue
      // Nuxt should handle this automatically, but we ensure it does
      return
    }
  }
  
  // If path is exactly /join (without ID), redirect to /join-code
  if (path === '/join') {
    return navigateTo('/join-code', { replace: true })
  }
})

