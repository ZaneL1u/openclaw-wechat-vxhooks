import { describe, expect, it } from 'vitest'
import { wechatPlugin } from '../../src/channel.js'

describe('messaging adapter', () => {
  describe('normalizeTarget', () => {
    it('strips user: prefix', () => {
      expect(wechatPlugin.messaging!.normalizeTarget!('user:wxid_abc123')).toBe('wxid_abc123')
    })

    it('strips group: prefix', () => {
      expect(wechatPlugin.messaging!.normalizeTarget!('group:12345@chatroom')).toBe('12345@chatroom')
    })

    it('returns raw target when no prefix', () => {
      expect(wechatPlugin.messaging!.normalizeTarget!('wxid_direct')).toBe('wxid_direct')
    })

    it('returns chatroom target as-is', () => {
      expect(wechatPlugin.messaging!.normalizeTarget!('wxid_xxx@chatroom')).toBe('wxid_xxx@chatroom')
    })
  })

  describe('targetResolver.looksLikeId', () => {
    it('recognizes wxid_ prefix as valid id', () => {
      expect(wechatPlugin.messaging!.targetResolver!.looksLikeId!('wxid_abc123')).toBe(true)
    })

    it('recognizes @chatroom suffix as valid id', () => {
      expect(wechatPlugin.messaging!.targetResolver!.looksLikeId!('12345@chatroom')).toBe(true)
    })

    it('rejects invalid id format', () => {
      expect(wechatPlugin.messaging!.targetResolver!.looksLikeId!('invalid_id')).toBe(false)
    })

    it('rejects empty string', () => {
      expect(wechatPlugin.messaging!.targetResolver!.looksLikeId!('')).toBe(false)
    })
  })

  describe('targetResolver.hint', () => {
    it('provides hint string', () => {
      expect(wechatPlugin.messaging!.targetResolver!.hint).toBeTruthy()
      expect(typeof wechatPlugin.messaging!.targetResolver!.hint).toBe('string')
    })
  })
})
