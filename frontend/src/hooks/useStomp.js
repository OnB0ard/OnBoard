// src/hooks/useStomp.js
import { useEffect, useRef, useState } from 'react'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

// SockJS global 호환성을 위한 polyfill
if (typeof global === 'undefined') {
  var global = globalThis;
}

const SOCKET_URL = 'http://70.12.247.36:8080/ws' // 화이트보드와 동일한 서버 사용

const useStomp = (topic, onMessage) => {
  const clientRef = useRef(null)
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED') // 'CONNECTED', 'DISCONNECTED', 'CONNECTING'

  useEffect(() => {
    // topic이 없으면 연결하지 않음
    if (!topic) {
      console.log('📋 WebSocket topic이 없어서 연결하지 않음')
      return
    }

    setConnectionStatus('CONNECTING')
    console.log('🔄 WebSocket 연결 시도:', SOCKET_URL)
    
    const socket = new SockJS(SOCKET_URL)

    const stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log('[STOMP]', str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('🟢 STOMP 연결 성공')
        setConnectionStatus('CONNECTED')
        stompClient.subscribe(topic, (message) => {
          try {
            const payload = JSON.parse(message.body)
            onMessage(payload)
          } catch (error) {
            console.error('메시지 파싱 에러:', error)
          }
        })
      },
      onDisconnect: () => {
        console.log('🔴 STOMP 연결 종료')
        setConnectionStatus('DISCONNECTED')
      },
      onStompError: (frame) => {
        console.error('🚨 STOMP 에러:', frame)
        setConnectionStatus('DISCONNECTED')
      },
      onWebSocketError: (error) => {
        console.error('🚨 WebSocket 연결 에러:', error)
        setConnectionStatus('DISCONNECTED')
      }
    })

    stompClient.activate()
    clientRef.current = stompClient

    return () => {
      if (clientRef.current) {
        console.log('🔌 WebSocket 연결 해제')
        clientRef.current.deactivate()
      }
    }
  }, [topic, onMessage])

  // STOMP 클라이언트와 현재 연결 상태를 반환
  return {
    client: clientRef.current,
    connectionStatus
  }
}

export default useStomp