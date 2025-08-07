package com.ssafy.backend.common.config;

import com.ssafy.backend.common.interceptor.StompChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket 설정 클래스
 * STOMP를 기반으로 한 WebSocket 메시지 브로커 설정을 담당함
 */
@Configuration
@RequiredArgsConstructor
@EnableWebSocketMessageBroker // STOMP 기반 WebSocket 메시지 브로커 사용을 활성화
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    // 클라이언트에서 들어오는 메시지를 가로채기 위한 커스텀 인터셉터
    private final StompChannelInterceptor stompChannelInterceptor;

    /**
     * 메시지 브로커 구성
     * 클라이언트와 서버 간의 메시지 라우팅 경로를 설정함
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 서버 → 클라이언트 방향 메시지를 전달할 브로커의 prefix
        // 예: /topic/mouse/1 → 클라이언트는 해당 주소를 구독
        registry.enableSimpleBroker("/topic");

        // 클라이언트 → 서버로 메시지를 보낼 때 사용할 prefix
        // 예: 클라이언트가 /app/mouse/move/1 주소로 메시지를 전송
        registry.setApplicationDestinationPrefixes("/app");
    }

    /**
     * STOMP WebSocket 연결 엔드포인트 등록
     * 클라이언트는 이 주소로 WebSocket 연결을 시도함
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")  // WebSocket 연결 시 사용할 엔드포인트 경로
                .setAllowedOriginPatterns("https://2a3e46f54cc9.ngrok-free.app") // 모든 도메인 허용 (CORS 설정)
                .withSockJS(); // SockJS를 사용하여 WebSocket 미지원 브라우저 호환성 제공
        // 최종 연결 주소: ws://localhost:8080/ws
    }

    /**
     * 클라이언트 → 서버로 들어오는 채널에 인터셉터 등록
     * STOMP CONNECT, SUBSCRIBE, SEND 등의 메시지를 가로채서 처리할 수 있음
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompChannelInterceptor); // JWT 인증 등 가로채기 가능
    }
}
