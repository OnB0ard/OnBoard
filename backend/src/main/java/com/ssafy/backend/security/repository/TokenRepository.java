package com.ssafy.backend.security.repository;

import com.ssafy.backend.security.entity.Token;
import com.ssafy.backend.security.entity.TokenType;
import com.ssafy.backend.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface TokenRepository extends JpaRepository<Token, Long> {
    boolean existsByTokenTypeAndTokenString(TokenType tokenType, String tokenString);

    void deleteAllByExpireDateBefore(LocalDateTime expireDateBefore);

    void deleteByTokenString(String tokenString);
}
