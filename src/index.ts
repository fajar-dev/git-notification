import { Hono } from 'hono'
import { Hooks } from './hooks'
import { PORT } from './config'

const app = new Hono()

app.get('/webhook/', (c) => {
    return c.text('Pong!')
})

app.post('/webhook/github', async (c) => {
    try {
        const space = c.req.query('space')
        const event = c.req.header('X-GitHub-Event')
        
        if (event === 'ping') {
            const body = await c.req.json()
            const repoName = body.repository?.full_name || 'unknown'
            const msg = `connected to github repository: *${repoName}* (${space || 'default'})`
            console.log(`GitHub Ping received for: ${repoName} (space: ${space})`)
            await Hooks.sendMessage(msg, space)
            return c.text(msg)
        }

        const body = await c.req.json()
        console.log("GitHub Webhook Body received")
        await Hooks.sendGitHubNotification(body, space)
        return c.json({ status: 'success', provider: 'github' })
    } catch (error) {
        console.error("GitHub Webhook Error:", error)
        return c.json({ status: 'error', message: 'Failed github webhook' }, 400)
    }
})

app.post('/webhook/bitbucket', async (c) => {
    try {
        const space = c.req.query('space')
        const event = c.req.header('X-Event-Key')
        
        if (event === 'diagnostic:ping') {
            const body = await c.req.json()
            const repoName = body.repository?.full_name || 'unknown'
            const msg = `connected to bitbucket repository: *${repoName}* (${space || 'default'})`
            console.log(`BitBucket Ping received for: ${repoName} (space: ${space})`)
            await Hooks.sendMessage(msg, space)
            return c.text(msg)
        }

        const body = await c.req.json()
        console.log("BitBucket Webhook Body received")
        await Hooks.sendBitBucketNotification(body, space)
        return c.json({ status: 'success', provider: 'bitbucket' })
    } catch (error) {
        console.error("BitBucket Webhook Error:", error)
        return c.json({ status: 'error', message: 'Failed bitbucket webhook' }, 400)
    }
})

export default {
    port: PORT,
    fetch: app.fetch,
}