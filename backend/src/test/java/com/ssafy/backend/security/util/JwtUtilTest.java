package com.ssafy.backend.security.util;

import com.ssafy.backend.security.dto.JwtUserInfo;
import com.ssafy.backend.security.entity.TokenType;
import com.ssafy.backend.security.repository.TokenRepository;
import com.ssafy.backend.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtUtilTest {

    private JwtUtil jwtUtil;

    @Mock
    private TokenRepository tokenRepository;

    private User testUser;
    private String accessToken;
    private String refreshToken;

    @BeforeEach
    void setUp() {
        // JwtUtil 설정
        jwtUtil = new JwtUtil(
                "thisisasecretkeyfortestingpurposesonly12345678901234567890",
                3600, // access token 만료 시간 (1시간)
                86400, // refresh token 만료 시간 (24시간)
                tokenRepository
        );

        // 테스트용 사용자 생성
        testUser = new User();
        testUser.setUserId(1L);
        testUser.setGoogleEmail("test@example.com");
        testUser.setUserName("테스트 사용자");

        // 토큰 생성
        accessToken = jwtUtil.generateAccessToken(testUser);
        refreshToken = jwtUtil.generateRefreshToken(testUser.getUserId());

        // 토큰 레포지토리 설정
        when(tokenRepository.existsByTokenTypeAndTokenString(eq(TokenType.ACCESS), anyString())).thenReturn(true);
        when(tokenRepository.existsByTokenTypeAndTokenString(eq(TokenType.REFRESH), anyString())).thenReturn(true);
    }

    @Test
    @DisplayName("액세스 토큰 생성 테스트")
    void testGenerateAccessToken() {
        // when
        String token = jwtUtil.generateAccessToken(testUser);

        // then
        assertNotNull(token);
        assertTrue(token.length() > 0);
    }

    @Test
    @DisplayName("리프레시 토큰 생성 테스트")
    void testGenerateRefreshToken() {
        // when
        String token = jwtUtil.generateRefreshToken(testUser.getUserId());

        // then
        assertNotNull(token);
        assertTrue(token.length() > 0);
    }

    @Test
    @DisplayName("토큰에서 사용자 정보 추출 테스트")
    void testGetUserInfoFromToken() {
        // when
        JwtUserInfo userInfo = jwtUtil.getUserInfoFromToken(accessToken);

        // then
        assertNotNull(userInfo);
        assertEquals(testUser.getUserId().longValue(), userInfo.getUserId());
        assertEquals(testUser.getGoogleEmail(), userInfo.getGoogleEmail());
        assertEquals(testUser.getUserName(), userInfo.getUserName());
    }

    @Test
    @DisplayName("토큰에서 사용자 ID 추출 테스트")
    void testGetUserId() {
        // when
        Long userId = jwtUtil.getUserId(accessToken);

        // then
        assertEquals(testUser.getUserId(), userId);
    }

    @Test
    @DisplayName("토큰에서 사용자 이름 추출 테스트")
    void testGetName() {
        // when
        String userName = jwtUtil.getName(accessToken);

        // then
        assertEquals(testUser.getUserName(), userName);
    }

    @Test
    @DisplayName("토큰 유효성 검증 테스트 - 유효한 토큰")
    void testValidateToken_validToken() {
        // given
        when(tokenRepository.existsByTokenTypeAndTokenString(TokenType.ACCESS, accessToken)).thenReturn(true);

        // when
        boolean isValid = jwtUtil.validateToken(accessToken, TokenType.ACCESS);

        // then
        assertTrue(isValid);
    }

    @Test
    @DisplayName("토큰 유효성 검증 테스트 - 만료된 토큰")
    void testValidateToken_expiredToken() {
        // given
        // 만료된 토큰 생성을 위해 만료 시간을 -1초로 설정한 JwtUtil 생성
        JwtUtil expiredJwtUtil = new JwtUtil(
                "thisisasecretkeyfortestingpurposesonly12345678901234567890",
                -1, // 액세스 토큰이 이미 만료되도록 설정
                -1, // 리프레시 토큰도 만료되도록 설정
                tokenRepository
        );

        String expiredToken = expiredJwtUtil.generateAccessToken(testUser);
        when(tokenRepository.existsByTokenTypeAndTokenString(TokenType.ACCESS, expiredToken)).thenReturn(true);

        // when
        boolean isValid = jwtUtil.validateToken(expiredToken, TokenType.ACCESS);

        // then
        assertFalse(isValid);
    }

    @Test
    @DisplayName("토큰 유효성 검증 테스트 - 등록되지 않은 토큰")
    void testValidateToken_notRegisteredToken() {
        // given
        when(tokenRepository.existsByTokenTypeAndTokenString(TokenType.ACCESS, accessToken)).thenReturn(false);

        // when
        boolean isValid = jwtUtil.validateToken(accessToken, TokenType.ACCESS);

        // then
        assertFalse(isValid);
    }

    @Test
    @DisplayName("토큰 만료 확인 테스트")
    void testIsExpired() {
        // given
        // 만료되지 않은 토큰

        // when
        boolean isExpired = jwtUtil.isExpired(accessToken);

        // then
        assertFalse(isExpired);

        // given - 만료된 토큰
        JwtUtil expiredJwtUtil = new JwtUtil(
                "thisisasecretkeyfortestingpurposesonly12345678901234567890",
                -1, // 액세스 토큰이 이미 만료되도록 설정
                -1,
                tokenRepository
        );
        String expiredToken = expiredJwtUtil.generateAccessToken(testUser);

        // when
        boolean isExpiredToken = jwtUtil.isExpired(expiredToken);

        // then
        assertTrue(isExpiredToken);
    }

    @Test
    @DisplayName("토큰 만료 일자 가져오기 테스트")
    void testGetExpirationDateFromToken() {
        // when
        Date expirationDate = jwtUtil.getExpirationDateFromToken(accessToken);

        // then
        assertNotNull(expirationDate);
        // 현재 시간보다 미래인지 확인
        assertTrue(expirationDate.after(new Date()));
    }

    @Test
    @DisplayName("블랙리스트에 토큰 추가 테스트")
    void testAddToBlacklist() {
        // when
        jwtUtil.addToBlacklist(accessToken, TokenType.ACCESS);

        // then
        verify(tokenRepository, times(1)).deleteByTokenTypeAndTokenString(TokenType.ACCESS, accessToken);
    }

    @Test
    @DisplayName("Bearer 토큰에서 JWT 추출 테스트")
    void testExtractToken() {
        // given
        String bearerToken = "Bearer " + accessToken;

        // when
        String extractedToken = jwtUtil.extractToken(bearerToken);

        // then
        assertEquals(accessToken, extractedToken);

        // when - Bearer 접두사가 없는 경우
        String extractedToken2 = jwtUtil.extractToken(accessToken);

        // then
        assertEquals(accessToken, extractedToken2);

        // when - null인 경우
        String extractedToken3 = jwtUtil.extractToken(null);

        // then
        assertNull(extractedToken3);
    }
}