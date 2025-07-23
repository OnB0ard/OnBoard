package com.ssafy.backend.security.dto;

import com.ssafy.backend.security.entity.TokenType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class TokenDTO {
    private String tokenString;
    private LocalDateTime expireDate;
    private TokenType tokenType;
}
