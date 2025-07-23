package com.ssafy.backend.security.util;

import com.ssafy.backend.security.dto.JwtUserInfo;
import com.ssafy.backend.security.dto.TokenDTO;
import com.ssafy.backend.security.entity.Token;
import com.ssafy.backend.security.entity.TokenType;
import com.ssafy.backend.security.repository.TokenRepository;
import com.ssafy.backend.user.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

@Component
public class JwtUtil {

    private final SecretKey key;
    private final int accessExpirationTime;
    private final int refreshExpirationTime;
    private final TokenRepository tokenRepository;

    public JwtUtil(
            @Value("${jwt.secret}")String secret,
            @Value("${jwt.access-token.expiration}") int accessExpirationTime,
            @Value("${jwt.refresh-token.expiration}") int refreshExpirationTime,
            TokenRepository tokenRepository) throws NoSuchAlgorithmException {
        // 해싱으로 32바이트 고정
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hashBytes = digest.digest(secret.getBytes(StandardCharsets.UTF_8));
        this.key = new SecretKeySpec(hashBytes, Jwts.SIG.HS256.key().build().getAlgorithm());
        this.accessExpirationTime = accessExpirationTime;
        this.refreshExpirationTime = refreshExpirationTime;
        this.tokenRepository = tokenRepository;
    }

    private JwtParser getJwtParser() {
        return Jwts.parser()
                .verifyWith(key)
                .build();
    }

    /**
     * Access Token 생성
     */
    @Transactional
    public TokenDTO generateAccessToken(User user) {

        Date issuedAt = new Date(System.currentTimeMillis());
        Date expiration = new Date(System.currentTimeMillis() + accessExpirationTime * 1000L);

        String accessToken = Jwts.builder()
                .subject(String.valueOf(user.getUserId()))
                .claim("userId", user.getUserId())
                .claim("googleEmail", user.getGoogleEmail())
                .claim("userName", user.getUserName())
                .issuedAt(issuedAt)
                .expiration(expiration)
                .signWith(key)
                .compact();

        Token token = new Token();
        token.setTokenType(TokenType.ACCESS);
        token.setTokenString(accessToken);
        LocalDateTime expirationDateTime = expiration.toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();;
        token.setExpireDate(expirationDateTime);

        Token savedToken = tokenRepository.save(token);
        return TokenDTO.builder()
                .tokenString(savedToken.getTokenString())
                .tokenType(savedToken.getTokenType())
                .expireDate(savedToken.getExpireDate())
                .build();
    }

    /**
     * Refresh Token 생성
     */
    @Transactional
    public TokenDTO generateRefreshToken(Long userId) {

        Date issuedAt = new Date(System.currentTimeMillis());
        Date expiration = new Date(System.currentTimeMillis() + refreshExpirationTime * 1000L);

        String refreshToken = Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("userId", userId)
                .issuedAt(issuedAt)
                .expiration(expiration)
                .signWith(key)
                .compact();

        Token token = new Token();
        token.setTokenType(TokenType.REFRESH);
        token.setTokenString(refreshToken);
        LocalDateTime expirationDateTime = expiration.toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();
        token.setExpireDate(expirationDateTime);

        Token savedToken = tokenRepository.save(token);
        return TokenDTO.builder()
                .tokenString(savedToken.getTokenString())
                .tokenType(savedToken.getTokenType())
                .expireDate(savedToken.getExpireDate())
                .build();
    }

    /**
     * 토큰에서 JwtUserInfo 추출
     */
    public JwtUserInfo getUserInfoFromToken(String token) {
        Claims claims = getJwtParser()
                .parseSignedClaims(token)
                .getPayload();

        return new JwtUserInfo(
                claims.get("userId", Long.class),        // PK
                claims.get("googleEmail", String.class),    //  구글 이메일
                claims.get("userName", String.class)        // 이름
        );
    }

    /**
     * 토큰에서 userId 추출
     */
    public Long getUserId(String token) {
        return getJwtParser()
                .parseSignedClaims(token)
                .getPayload()
                .get("userId", Long.class);
    }

    /**
     * 토큰에서 google email 추출
     */
    public String getGoogleEmail(String token) {
        return getJwtParser()
                .parseSignedClaims(token)
                .getPayload()
                .get("googleEmail", String.class);
    }

    /**
     * 토큰에서 user name 추출
     */
    public String getName(String token) {
        return getJwtParser()
                .parseSignedClaims(token)
                .getPayload()
                .get("userName", String.class);
    }

    /**
     * 토큰 만료 시간 확인
     */
    public Boolean isExpired(String token) {
        try {
            return getJwtParser()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getExpiration()
                    .before(new Date());
        } catch (JwtException e) {
            return true;
        }
    }

    /**
     * 토큰에서 만료 일자 가져오기
     */
    public Date getExpirationDateFromToken(String token) {
        return getJwtParser()
                .parseSignedClaims(token)
                .getPayload()
                .getExpiration();
    }

    /**
     * 토큰 유효성 검증
     */
    @Transactional(readOnly = true)
    public boolean validateToken(String token, TokenType tokenType) {
        try {
            if (!isTokenAvailable(token, tokenType)) {
                return false;
            }
            getJwtParser().parseSignedClaims(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }

    /**
     * 토큰이 등록되어 있는지 확인
     */
    private boolean isTokenAvailable(String token, TokenType tokenType) {
        return tokenRepository.existsByTokenTypeAndTokenString(tokenType, token);
    }

    /**
     * 토큰을 화이트리스트에 추가 (로그인 시 사용)
     */
    public void addToWhitelist(TokenDTO token) {
        if (token != null && !token.getTokenString().isEmpty()) {
            Token newToken = new Token();
            newToken.setTokenType(token.getTokenType());
            newToken.setTokenString(token.getTokenString());
            newToken.setExpireDate(token.getExpireDate());
            tokenRepository.save(newToken);
        }
    }

    /**
     * 토큰을 화이트리스트에서 제거 (로그아웃 시 사용)
     */
    public void deleteFromWhiteList(String tokenString)  {
        if (tokenString != null) {
            tokenRepository.deleteByTokenString(extractToken(tokenString));
        }
    }

    /**
     * Bearer 토큰에서 실제 JWT 추출
     */
    public String extractToken(String bearerToken) {
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return bearerToken;
    }

    @Scheduled(cron = "0 */5 * * * *") // 30분 마다 실행
    public void cleanUpExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();
        tokenRepository.deleteAllByExpireDateBefore(now);
    }
}