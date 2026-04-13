import { Avatar } from './Avatar.js'

// Simulate multiple avatars initializing at different times
const a = new Avatar('Avatar 1')
const b = new Avatar('Avatar 2')
const c = new Avatar('Avatar 3')

// Start them slightly staggered
a.init()
setTimeout(() => b.init(), 50)
setTimeout(() => c.init(), 100)
