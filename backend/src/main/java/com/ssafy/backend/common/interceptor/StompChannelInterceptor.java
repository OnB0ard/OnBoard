package com.ssafy.backend.common.interceptor;

import com.ssafy.backend.plan.exception.UserNotExistException;
import com.ssafy.backend.security.util.JwtUtil;
import com.ssafy.backend.security.dto.JwtUserInfo;
import com.ssafy.backend.security.entity.TokenType;
import com.ssafy.backend.user.entity.User;
import com.ssafy.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class StompChannelInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private UserRepository userRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        // CONNECT 프레임일 때만 JWT 검증
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String bearerToken = accessor.getFirstNativeHeader("Authorization");
            if (bearerToken == null || !bearerToken.startsWith("Bearer ")) {
                log.warn("Authorization 헤더가 없거나 Bearer 형식이 아닙니다.");
                throw new IllegalArgumentException("Authorization 헤더가 없거나 Bearer 형식이 아닙니다.");
            }

            String token = jwtUtil.extractToken(bearerToken);

            if (!jwtUtil.validateToken(token, TokenType.ACCESS)) {
//                log.warn("유효하지 않은 JWT 토큰입니다.");
                throw new IllegalArgumentException("유효하지 않은 JWT 토큰입니다.");
            }

            JwtUserInfo userInfo = jwtUtil.getUserInfoFromToken(token);

            User user = validateUserExistence(userInfo.getUserId());

            accessor.getSessionAttributes().put("userId", userInfo.getUserId());
            accessor.getSessionAttributes().put("userName", user.getUserName());
            accessor.getSessionAttributes().put("email", userInfo.getGoogleEmail());
        }

        return message;
    }
    private User validateUserExistence(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotExistException("존재하지 않는 사용자입니다. userId=" + userId));
    }
}
