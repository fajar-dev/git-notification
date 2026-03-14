import { Hono } from 'hono'
import { Hooks } from './hooks'

const app = new Hono()

app.get('/', (c) => {
    return c.text('Pong!')
})

app.post('/webhook/github', async (c) => {
    try {
        const event = c.req.header('X-GitHub-Event')
        
        if (event === 'ping') {
            const body = await c.req.json()
            const repoName = body.repository?.full_name || 'unknown'
            const visibility = body.repository?.private ? 'Private' : 'Public'
            const msg = `connected to repo ${repoName} (${visibility})`
            console.log(`GitHub Ping received for: ${repoName} (${visibility})`)
            await Hooks.sendMessage(msg)
            return c.text(msg)
        }

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
        const event = c.req.header('X-Event-Key')
        
        // BitBucket diagnostic check (if supported by the hook version or manual test)
        if (event === 'diagnostic:ping') {
            const body = await c.req.json()
            const repoName = body.repository?.full_name || 'unknown'
            const visibility = body.repository?.is_private ? 'Private' : 'Public'
            const msg = `connected to bitbucket repo ${repoName} (${visibility})`
            console.log(`BitBucket Ping received for: ${repoName} (${visibility})`)
            await Hooks.sendMessage(msg)
            return c.text(msg)
        }

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
