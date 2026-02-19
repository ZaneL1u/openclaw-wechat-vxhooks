import { describe, expect, it } from 'vitest'
import { convertToMessageContext, resolveMessageType } from '../../src/callback-server.js'

describe('resolveMessageType', () => {
  it('maps 60001 to text (private text)', () => {
    expect(resolveMessageType('60001')).toBe('text')
  })

  it('maps 80001 to text (group text)', () => {
    expect(resolveMessageType('80001')).toBe('text')
  })

  it('maps 60002 to image (private image)', () => {
    expect(resolveMessageType('60002')).toBe('image')
  })

  it('maps 80002 to image (group image)', () => {
    expect(resolveMessageType('80002')).toBe('image')
  })

  it('maps 60003 to video', () => {
    expect(resolveMessageType('60003')).toBe('video')
  })

  it('maps 80003 to video', () => {
    expect(resolveMessageType('80003')).toBe('video')
  })

  it('maps 60004 to voice', () => {
    expect(resolveMessageType('60004')).toBe('voice')
  })

  it('maps 80004 to voice', () => {
    expect(resolveMessageType('80004')).toBe('voice')
  })

  it('maps 60008 to file', () => {
    expect(resolveMessageType('60008')).toBe('file')
  })

  it('maps 80008 to file', () => {
    expect(resolveMessageType('80008')).toBe('file')
  })

  it('maps unknown code to unknown', () => {
    expect(resolveMessageType('99999')).toBe('unknown')
  })
})

describe('convertToMessageContext', () => {
  it('converts a private text message (flat format)', () => {
    const payload = {
      messageType: '60001',
      wcId: 'wxid_self',
      fromUser: 'wxid_sender',
      toUser: 'wxid_self',
      content: 'hello world',
      newMsgId: 12345,
      timestamp: 1700000000,
    }

    const result = convertToMessageContext(payload)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('text')
    expect(result!.sender.id).toBe('wxid_sender')
    expect(result!.content).toBe('hello world')
    expect(result!.id).toBe('12345')
    expect(result!.group).toBeUndefined()
  })

  it('converts a group text message (flat format)', () => {
    const payload = {
      messageType: '80001',
      wcId: 'wxid_self',
      fromUser: 'wxid_sender',
      fromGroup: 'room123@chatroom',
      content: 'group msg',
      newMsgId: 67890,
      timestamp: 1700000000,
    }

    const result = convertToMessageContext(payload)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('text')
    expect(result!.group).toBeDefined()
    expect(result!.group!.id).toBe('room123@chatroom')
    expect(result!.threadId).toBe('room123@chatroom')
  })

  it('converts a nested data format payload', () => {
    const payload = {
      messageType: '60001',
      wcId: 'wxid_self',
      data: {
        fromUser: 'wxid_nested_sender',
        content: 'nested content',
        newMsgId: 11111,
        timestamp: 1700000000,
      },
    }

    const result = convertToMessageContext(payload)
    expect(result).not.toBeNull()
    expect(result!.sender.id).toBe('wxid_nested_sender')
    expect(result!.content).toBe('nested content')
  })

  it('returns null for offline notification (30000)', () => {
    const payload = {
      messageType: '30000',
      wcId: 'wxid_self',
      content: 'offline',
    }

    const result = convertToMessageContext(payload)
    expect(result).toBeNull()
  })

  it('returns null for unhandled message type', () => {
    const payload = {
      messageType: '10001',
      wcId: 'wxid_self',
    }

    const result = convertToMessageContext(payload)
    expect(result).toBeNull()
  })

  it('returns null when fromUser is missing', () => {
    const payload = {
      messageType: '60001',
      wcId: 'wxid_self',
      data: {
        content: 'no sender',
      },
    }

    const result = convertToMessageContext(payload)
    expect(result).toBeNull()
  })

  it('uses Date.now() as fallback for missing newMsgId', () => {
    const payload = {
      messageType: '60001',
      wcId: 'wxid_self',
      fromUser: 'wxid_sender',
      content: 'test',
    }

    const result = convertToMessageContext(payload)
    expect(result).not.toBeNull()
    expect(result!.id).toBeTruthy()
  })

  it('handles image message type', () => {
    const payload = {
      messageType: '60002',
      wcId: 'wxid_self',
      fromUser: 'wxid_sender',
      content: '',
      newMsgId: 22222,
    }

    const result = convertToMessageContext(payload)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('image')
  })
})
