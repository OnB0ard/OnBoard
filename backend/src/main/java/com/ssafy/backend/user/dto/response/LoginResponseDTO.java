package com.ssafy.backend.user.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponseDTO {
    private Long userId;
    private String googleEmail;
    private String userName;
    private String accessToken;
    private LocalDateTime accessTokenExpireDate;
    @JsonIgnore
    private String refreshToken;
    @JsonIgnore
    private LocalDateTime refreshTokenExpireDate;
}
