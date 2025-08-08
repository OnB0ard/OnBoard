package com.ssafy.backend.common.interceptor;

import com.ssafy.backend.security.util.JwtUtil;
import com.ssafy.backend.security.dto.JwtUserInfo;
import com.ssafy.backend.security.entity.TokenType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class StompChannelInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        // CONNECT 프레임일 때만 JWT 검증
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String bearerToken = accessor.getFirstNativeHeader("Authorization");
            // 🧪 누가 연결 시도하는지 확인용 상세 로그
            log.warn("[CONNECT] No Auth Header. Details ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓");
            log.warn("Session ID: {}", accessor.getSessionId());
            log.warn("Native Headers: {}", accessor.toNativeHeaderMap());
            log.warn("User Agent: {}", accessor.getFirstNativeHeader("User-Agent"));
            log.warn("Origin: {}", accessor.getFirstNativeHeader("Origin"));
            log.warn("Host: {}", accessor.getFirstNativeHeader("Host"));
            log.warn("Heartbeat: {}", accessor.getHeartbeat());
            log.warn("Command: {}", accessor.getCommand());

            // 🎯 IP 정보도 출력 (Message에서 직접 추출)
            Object simpSessionAttributes = accessor.getHeader("simpSessionAttributes");
            Object simpConnectMessage = accessor.getHeader("simpConnectMessage");
            log.warn("simpConnectMessage: {}", simpConnectMessage);
            if (bearerToken == null || !bearerToken.startsWith("Bearer ")) {
                log.warn("Authorization 헤더가 없거나 Bearer 형식이 아닙니다.");
                throw new IllegalArgumentException("Authorization 헤더가 없거나 Bearer 형식이 아닙니다.");
            }

            String token = jwtUtil.extractToken(bearerToken);

            if (!jwtUtil.validateToken(token, TokenType.ACCESS)) {
                log.warn("유효하지 않은 JWT 토큰입니다.");
                throw new IllegalArgumentException("유효하지 않은 JWT 토큰입니다.");
            }

            JwtUserInfo userInfo = jwtUtil.getUserInfoFromToken(token);

            accessor.getSessionAttributes().put("userId", userInfo.getUserId());
            accessor.getSessionAttributes().put("userName", userInfo.getUserName());
            accessor.getSessionAttributes().put("email", userInfo.getGoogleEmail());
        }

        return message;
    }
}
