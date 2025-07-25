package com.ssafy.backend.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class AccessTokenResponseDTO {
    private String accessToken;
    private LocalDateTime accessTokenExpireDate;
}
