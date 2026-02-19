import { describe, expect, it } from 'vitest'
import { ProxyClient } from '../../src/proxy-client.js'

const PROXY_URL = process.env.PROXY_URL || ''
const API_KEY = process.env.API_KEY || 'test_api_key'

describe.skipIf(!PROXY_URL)('proxyClient integration', () => {
  it('getStatus returns account status', async () => {
    const client = new ProxyClient({ apiKey: API_KEY, baseUrl: PROXY_URL })
    const status = await client.getStatus()
    expect(status).toHaveProperty('valid')
    expect(status).toHaveProperty('isLoggedIn')
  })

  it('login starts DLL login flow', async () => {
    const client = new ProxyClient({ apiKey: API_KEY, baseUrl: PROXY_URL })
    const result = await client.login()
    expect(result).toHaveProperty('wId')
    expect(typeof result.wId).toBe('string')
  })
})

describe('proxyClient construction', () => {
  it('throws when baseUrl is missing', () => {
    expect(() => new ProxyClient({ apiKey: 'key' })).toThrow('proxyUrl is required')
  })

  it('stores apiKey and baseUrl', () => {
    const client = new ProxyClient({ apiKey: 'my_key', baseUrl: 'http://localhost:3000' })
    expect(client.baseUrl).toBe('http://localhost:3000')
  })
})
