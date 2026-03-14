import { Hono } from 'hono'
import { Hooks } from './hooks'

const app = new Hono()

app.get('/', (c) => {
    return c.text('Pong!')
})

app.post('/webhook/github', async (c) => {
    try {
        const body = await c.req.json()
        console.log("GitHub Webhook Body received")
        await Hooks.sendGitHubNotification(body)
        return c.json({ status: 'success', provider: 'github' })
    } catch (error) {
        console.error("GitHub Webhook Error:", error)
        return c.json({ status: 'error', message: 'Failed github webhook' }, 400)
    }
})

app.post('/webhook/bitbucket', async (c) => {
    try {
        const body = await c.req.json()
        console.log("BitBucket Webhook Body received")
        await Hooks.sendBitBucketNotification(body)
        return c.json({ status: 'success', provider: 'bitbucket' })
    } catch (error) {
        console.error("BitBucket Webhook Error:", error)
        return c.json({ status: 'error', message: 'Failed bitbucket webhook' }, 400)
    }
})

export default app
