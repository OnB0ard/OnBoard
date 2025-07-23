package com.ssafy.backend.user.dto.request;

import lombok.Data;

@Data
public class LogoutRequestDTO {
    private String accessToken;
    private String refreshToken;
}
