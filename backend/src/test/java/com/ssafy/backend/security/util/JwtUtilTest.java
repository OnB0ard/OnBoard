package com.ssafy.backend.security.util;

import com.ssafy.backend.security.dto.JwtUserInfo;
import com.ssafy.backend.security.dto.TokenDTO;
import com.ssafy.backend.security.entity.Token;
import com.ssafy.backend.security.entity.TokenType;
import com.ssafy.backend.security.repository.TokenRepository;
import com.ssafy.backend.user.entity.User;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtUtilTest {

    private JwtUtil jwtUtil;

    @Mock
    private TokenRepository tokenRepository;

    private User testUser;
    private TokenDTO accessTokenDTO;
    private TokenDTO refreshTokenDTO;
    private Token accessToken;
    private Token refreshToken;

    private final String secretKey = "testSecretKeyWithAtLeast32BytesForHS256Algorithm";
    private final int accessExpirationTime = 3600;
    private final int refreshExpirationTime = 86400;
    private SecretKey key;

    @BeforeEach
    void setUp() throws NoSuchAlgorithmException {
        // JwtUtil 직접 생성
        key = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8),
                Jwts.SIG.HS256.key().build().getAlgorithm());
        jwtUtil = new JwtUtil(secretKey, accessExpirationTime, refreshExpirationTime, tokenRepository);

        // 테스트 유저 생성
        testUser = new User();
        testUser.setUserId(1L);
        testUser.setGoogleEmail("test@gmail.com");
        testUser.setUserName("테스트유저");

        // 토큰 엔티티 생성
        accessToken = new Token();
        accessToken.setTokenType(TokenType.ACCESS);
        accessToken.setTokenString("mock-access-token");
        accessToken.setExpireDate(LocalDateTime.now().plusHours(1));

        refreshToken = new Token();
        refreshToken.setTokenType(TokenType.REFRESH);
        refreshToken.setTokenString("mock-refresh-token");
        refreshToken.setExpireDate(LocalDateTime.now().plusDays(1));

        // 토큰 DTO 생성
        accessTokenDTO = TokenDTO.builder()
                .tokenString(accessToken.getTokenString())
                .tokenType(accessToken.getTokenType())
                .expireDate(accessToken.getExpireDate())
                .build();

        refreshTokenDTO = TokenDTO.builder()
                .tokenString(refreshToken.getTokenString())
                .tokenType(refreshToken.getTokenType())
                .expireDate(refreshToken.getExpireDate())
                .build();
    }

    @Test
    @DisplayName("액세스 토큰 생성 테스트")
    void generateAccessToken() {
        // Given
        when(tokenRepository.save(any(Token.class))).thenReturn(accessToken);

        // When
        TokenDTO result = jwtUtil.generateAccessToken(testUser);

        // Then
        assertNotNull(result);
        assertEquals(TokenType.ACCESS, result.getTokenType());
        assertEquals(accessToken.getTokenString(), result.getTokenString());

        ArgumentCaptor<Token> tokenCaptor = ArgumentCaptor.forClass(Token.class);
        verify(tokenRepository).save(tokenCaptor.capture());
        assertEquals(TokenType.ACCESS, tokenCaptor.getValue().getTokenType());
    }

    @Test
    @DisplayName("리프레시 토큰 생성 테스트")
    void generateRefreshToken() {
        // Given
        when(tokenRepository.save(any(Token.class))).thenReturn(refreshToken);

        // When
        TokenDTO result = jwtUtil.generateRefreshToken(testUser.getUserId());

        // Then
        assertNotNull(result);
        assertEquals(TokenType.REFRESH, result.getTokenType());
        assertEquals(refreshToken.getTokenString(), result.getTokenString());

        ArgumentCaptor<Token> tokenCaptor = ArgumentCaptor.forClass(Token.class);
        verify(tokenRepository).save(tokenCaptor.capture());
        assertEquals(TokenType.REFRESH, tokenCaptor.getValue().getTokenType());
    }

    @Test
    @DisplayName("실제 토큰 생성 및 검증 테스트")
    void generateAndValidateRealToken() {
        // Given
        when(tokenRepository.save(any(Token.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(tokenRepository.existsByTokenTypeAndTokenString(any(TokenType.class), anyString())).thenReturn(true);

        // When
        TokenDTO realAccessToken = jwtUtil.generateAccessToken(testUser);

        // Then
        assertNotNull(realAccessToken);
        assertNotNull(realAccessToken.getTokenString());

        // 토큰에서 사용자 정보 추출 테스트
        JwtUserInfo userInfo = jwtUtil.getUserInfoFromToken(realAccessToken.getTokenString());
        assertEquals(testUser.getUserId(), userInfo.getUserId());
        assertEquals(testUser.getGoogleEmail(), userInfo.getGoogleEmail());
        assertEquals(testUser.getUserName(), userInfo.getUserName());

        // 토큰 유효성 검증
        assertTrue(jwtUtil.validateToken(realAccessToken.getTokenString(), TokenType.ACCESS));
        assertFalse(jwtUtil.isExpired(realAccessToken.getTokenString()));
    }

    @Test
    @DisplayName("토큰에서 사용자 정보 추출 테스트")
    void getUserInfoFromToken() {
        // Given
        String token = Jwts.builder()
                .subject("1")
                .claim("userId", 1L)
                .claim("googleEmail", "test@gmail.com")
                .claim("userName", "테스트유저")
                .signWith(key)
                .expiration(new Date(System.currentTimeMillis() + 3600 * 1000))
                .compact();

        // When
        JwtUserInfo userInfo = jwtUtil.getUserInfoFromToken(token);

        // Then
        assertNotNull(userInfo);
        assertEquals(1L, userInfo.getUserId());
        assertEquals("test@gmail.com", userInfo.getGoogleEmail());
        assertEquals("테스트유저", userInfo.getUserName());
    }

    @Test
    @DisplayName("토큰에서 개별 정보 추출 테스트")
    void getIndividualInfoFromToken() {
        // Given
        String token = Jwts.builder()
                .subject("1")
                .claim("userId", 1L)
                .claim("googleEmail", "test@gmail.com")
                .claim("userName", "테스트유저")
                .signWith(key)
                .expiration(new Date(System.currentTimeMillis() + 3600 * 1000))
                .compact();

        // When & Then
        assertEquals(1L, jwtUtil.getUserId(token));
        assertEquals("test@gmail.com", jwtUtil.getGoogleEmail(token));
        assertEquals("테스트유저", jwtUtil.getName(token));
    }

    @Test
    @DisplayName("만료된 토큰 확인 테스트")
    void isExpiredToken() {
        // Given
        // 이미 만료된 토큰 생성
        String expiredToken = Jwts.builder()
                .subject("1")
                .claim("userId", 1L)
                .signWith(key)
                .expiration(new Date(System.currentTimeMillis() - 1000))
                .compact();

        // 유효한 토큰 생성
        String validToken = Jwts.builder()
                .subject("1")
                .claim("userId", 1L)
                .signWith(key)
                .expiration(new Date(System.currentTimeMillis() + 3600 * 1000))
                .compact();

        // When & Then
        assertTrue(jwtUtil.isExpired(expiredToken));
        assertFalse(jwtUtil.isExpired(validToken));
    }

    @Test
    @DisplayName("토큰 유효성 검증 테스트")
    void validateToken() {
        // Given
        String token = Jwts.builder()
                .subject("1")
                .claim("userId", 1L)
                .signWith(key)
                .expiration(new Date(System.currentTimeMillis() + 3600 * 1000))
                .compact();

        when(tokenRepository.existsByTokenTypeAndTokenString(TokenType.ACCESS, token)).thenReturn(true);
        when(tokenRepository.existsByTokenTypeAndTokenString(TokenType.REFRESH, token)).thenReturn(false);

        // When & Then
        assertTrue(jwtUtil.validateToken(token, TokenType.ACCESS));
        assertFalse(jwtUtil.validateToken(token, TokenType.REFRESH));

        // 잘못된 형식의 토큰
        assertFalse(jwtUtil.validateToken("invalid.token", TokenType.ACCESS));
    }

    @Test
    @DisplayName("토큰 화이트리스트 추가 테스트")
    void addToWhitelist() {
        // Given
        TokenDTO validToken = TokenDTO.builder()
                .tokenString("valid-token")
                .tokenType(TokenType.ACCESS)
                .expireDate(LocalDateTime.now().plusHours(1))
                .build();

        // When
        jwtUtil.addToWhitelist(validToken);

        // Then
        ArgumentCaptor<Token> tokenCaptor = ArgumentCaptor.forClass(Token.class);
        verify(tokenRepository).save(tokenCaptor.capture());
        assertEquals(validToken.getTokenString(), tokenCaptor.getValue().getTokenString());
        assertEquals(validToken.getTokenType(), tokenCaptor.getValue().getTokenType());
    }

    @Test
    @DisplayName("토큰 화이트리스트에서 제거 테스트")
    void addToWhiteList() {
        // Given
        TokenDTO validToken = TokenDTO.builder()
                .tokenString("valid-token")
                .tokenType(TokenType.ACCESS)
                .expireDate(LocalDateTime.now().plusHours(1))
                .build();

        // When
        jwtUtil.addToWhiteList(validToken);

        // Then
        verify(tokenRepository).deleteByTokenTypeAndTokenString(validToken.getTokenType(), validToken.getTokenString());
    }

    @Test
    @DisplayName("토큰 화이트리스트 추가 실패 테스트 (null 또는 빈 토큰)")
    void addToWhitelistWithNullOrEmptyToken() {
        // When
        jwtUtil.addToWhitelist(null);

        TokenDTO emptyToken = TokenDTO.builder()
                .tokenString("")
                .tokenType(TokenType.ACCESS)
                .expireDate(LocalDateTime.now().plusHours(1))
                .build();
        jwtUtil.addToWhitelist(emptyToken);

        // Then
        verify(tokenRepository, never()).save(any(Token.class));
    }

    @Test
    @DisplayName("Bearer 토큰에서 JWT 추출 테스트")
    void extractToken() {
        // Given
        String bearerToken = "Bearer token123";

        // When
        String token = jwtUtil.extractToken(bearerToken);

        // Then
        assertEquals("token123", token);

        // Bearer 접두사가 없는 경우
        assertEquals("token456", jwtUtil.extractToken("token456"));

        // null 처리
        assertNull(jwtUtil.extractToken(null));
    }

    @Test
    @DisplayName("만료된 토큰 정리 테스트")
    void cleanUpExpiredTokens() {
        // When
        jwtUtil.cleanUpExpiredTokens();

        // Then
        verify(tokenRepository).deleteAllByExpireDateBefore(any(LocalDateTime.class));
    }
}