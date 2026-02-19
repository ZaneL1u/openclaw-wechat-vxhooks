import type { WechatMessageContext } from '../../src/types.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startCallbackServer } from '../../src/callback-server.js'

describe('callbackServer integration', () => {
  let stop: () => void
  let port: number
  const receivedMessages: WechatMessageContext[] = []

  beforeAll(async () => {
    const result = await startCallbackServer({
      port: 0, // use random available port
      apiKey: 'test_key',
      onMessage: (msg) => {
        receivedMessages.push(msg)
      },
    })
    port = result.port
    stop = result.stop
  })

  afterAll(() => {
    stop?.()
  })

  it('starts and listens on the assigned port', () => {
    expect(port).toBeGreaterThan(0)
  })

  it('returns 404 for unknown routes', async () => {
    const res = await fetch(`http://localhost:${port}/unknown`)
    expect(res.status).toBe(404)
  })

  it('returns 404 for GET on webhook path', async () => {
    const res = await fetch(`http://localhost:${port}/webhook/wechat`)
    expect(res.status).toBe(404)
  })

  it('accepts POST on /webhook/wechat and processes text message', async () => {
    receivedMessages.length = 0

    const payload = {
      messageType: '60001',
      wcId: 'wxid_self',
      fromUser: 'wxid_sender',
      content: 'integration test message',
      newMsgId: 99999,
      timestamp: Date.now(),
    }

    const res = await fetch(`http://localhost:${port}/webhook/wechat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    expect(res.status).toBe(200)
    expect(await res.text()).toBe('OK')

    // Give callback a tick to process
    await new Promise(r => setTimeout(r, 50))

    expect(receivedMessages).toHaveLength(1)
    expect(receivedMessages[0].type).toBe('text')
    expect(receivedMessages[0].content).toBe('integration test message')
    expect(receivedMessages[0].sender.id).toBe('wxid_sender')
  })

  it('returns 400 for malformed JSON body', async () => {
    const res = await fetch(`http://localhost:${port}/webhook/wechat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    })

    expect(res.status).toBe(400)
  })

  it('returns 200 for offline notification (no message dispatched)', async () => {
    receivedMessages.length = 0

    const payload = {
      messageType: '30000',
      wcId: 'wxid_self',
      content: 'offline',
    }

    const res = await fetch(`http://localhost:${port}/webhook/wechat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    expect(res.status).toBe(200)

    await new Promise(r => setTimeout(r, 50))
    expect(receivedMessages).toHaveLength(0)
  })
})
