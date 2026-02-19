import type { ClawdbotConfig } from 'openclaw/plugin-sdk'
import { describe, expect, it } from 'vitest'
import { wechatPlugin } from '../../src/channel.js'

function makeConfig(wechat: Record<string, any>): ClawdbotConfig {
  return { channels: { wechat } } as any
}

describe('config adapter', () => {
  describe('listAccountIds', () => {
    it('returns default account when top-level apiKey is set', () => {
      const cfg = makeConfig({ apiKey: 'wc_test_key', proxyUrl: 'http://localhost:3000' })
      const ids = wechatPlugin.config!.listAccountIds!(cfg)
      expect(ids).toEqual(['default'])
    })

    it('returns account ids from accounts map', () => {
      const cfg = makeConfig({
        accounts: {
          alice: { apiKey: 'key_a', enabled: true },
          bob: { apiKey: 'key_b', enabled: true },
        },
      })
      const ids = wechatPlugin.config!.listAccountIds!(cfg)
      expect(ids).toContain('alice')
      expect(ids).toContain('bob')
    })

    it('filters out disabled accounts', () => {
      const cfg = makeConfig({
        accounts: {
          alice: { apiKey: 'key_a', enabled: true },
          bob: { apiKey: 'key_b', enabled: false },
        },
      })
      const ids = wechatPlugin.config!.listAccountIds!(cfg)
      expect(ids).toEqual(['alice'])
    })

    it('returns empty array when no config', () => {
      const cfg = { channels: {} } as any
      const ids = wechatPlugin.config!.listAccountIds!(cfg)
      expect(ids).toEqual([])
    })
  })

  describe('resolveAccount', () => {
    it('resolves default account from top-level config', () => {
      const cfg = makeConfig({
        apiKey: 'wc_test_key',
        proxyUrl: 'http://localhost:3000',
        webhookPort: 19000,
      })
      const account = wechatPlugin.config!.resolveAccount!(cfg, 'default')
      expect(account.accountId).toBe('default')
      expect(account.apiKey).toBe('wc_test_key')
      expect(account.proxyUrl).toBe('http://localhost:3000')
      expect(account.webhookPort).toBe(19000)
      expect(account.configured).toBe(true)
    })

    it('resolves named account from accounts map', () => {
      const cfg = makeConfig({
        accounts: {
          alice: {
            apiKey: 'key_alice',
            proxyUrl: 'http://proxy:3000',
            name: 'Alice',
          },
        },
      })
      const account = wechatPlugin.config!.resolveAccount!(cfg, 'alice')
      expect(account.accountId).toBe('alice')
      expect(account.apiKey).toBe('key_alice')
      expect(account.name).toBe('Alice')
    })

    it('merges top-level config with accounts.default', () => {
      const cfg = makeConfig({
        apiKey: 'top_key',
        proxyUrl: 'http://top-proxy:3000',
        accounts: {
          default: {
            apiKey: 'override_key',
            proxyUrl: 'http://override-proxy:3000',
            name: 'Override',
          },
        },
      })
      const account = wechatPlugin.config!.resolveAccount!(cfg, 'default')
      // accounts.default overrides top-level
      expect(account.apiKey).toBe('top_key')
      expect(account.name).toBe('Override')
    })

    it('throws when apiKey is missing', () => {
      const cfg = makeConfig({ proxyUrl: 'http://localhost:3000' })
      expect(() => wechatPlugin.config!.resolveAccount!(cfg, 'default')).toThrow('API Key')
    })

    it('throws when proxyUrl is missing', () => {
      const cfg = makeConfig({ apiKey: 'wc_test_key' })
      expect(() => wechatPlugin.config!.resolveAccount!(cfg, 'default')).toThrow('proxyUrl')
    })

    it('uses default webhookPort 18790 when not configured', () => {
      const cfg = makeConfig({ apiKey: 'wc_key', proxyUrl: 'http://localhost:3000' })
      const account = wechatPlugin.config!.resolveAccount!(cfg, 'default')
      expect(account.webhookPort).toBe(18790)
    })

    it('uses default webhookPath when not configured', () => {
      const cfg = makeConfig({ apiKey: 'wc_key', proxyUrl: 'http://localhost:3000' })
      const account = wechatPlugin.config!.resolveAccount!(cfg, 'default')
      expect(account.webhookPath).toBe('/webhook/wechat')
    })
  })

  describe('describeAccount', () => {
    it('returns account description', () => {
      const cfg = makeConfig({ apiKey: 'wc_key', proxyUrl: 'http://localhost:3000' })
      const account = wechatPlugin.config!.resolveAccount!(cfg, 'default')
      const desc = wechatPlugin.config!.describeAccount!(account)
      expect(desc).toHaveProperty('accountId', 'default')
      expect(desc).toHaveProperty('enabled', true)
      expect(desc).toHaveProperty('configured', true)
    })
  })

  describe('setAccountEnabled', () => {
    it('sets enabled for default account at top level', () => {
      const cfg = makeConfig({ apiKey: 'key', proxyUrl: 'http://p' })
      const result = wechatPlugin.config!.setAccountEnabled!({ cfg, accountId: 'default', enabled: false })
      expect((result.channels as any).wechat.enabled).toBe(false)
    })

    it('sets enabled for named account', () => {
      const cfg = makeConfig({
        accounts: {
          alice: { apiKey: 'key_a', enabled: true },
        },
      })
      const result = wechatPlugin.config!.setAccountEnabled!({ cfg, accountId: 'alice', enabled: false })
      expect((result.channels as any).wechat.accounts.alice.enabled).toBe(false)
    })
  })

  describe('deleteAccount', () => {
    it('deletes default account by removing wechat config', () => {
      const cfg = makeConfig({ apiKey: 'key', proxyUrl: 'http://p' })
      const result = wechatPlugin.config!.deleteAccount!({ cfg, accountId: 'default' })
      // When wechat is the only channel, channels is removed entirely
      const wechat = (result.channels as any)?.wechat
      expect(wechat).toBeUndefined()
    })

    it('deletes named account from accounts map', () => {
      const cfg = makeConfig({
        accounts: {
          alice: { apiKey: 'key_a' },
          bob: { apiKey: 'key_b' },
        },
      })
      const result = wechatPlugin.config!.deleteAccount!({ cfg, accountId: 'alice' })
      expect((result.channels as any).wechat.accounts.alice).toBeUndefined()
      expect((result.channels as any).wechat.accounts.bob).toBeDefined()
    })
  })
})
