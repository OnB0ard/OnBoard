package com.ssafy.backend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class GoogleUserInfoDTO {
    private String email;
    private boolean emailVerified;
    private String givenName;
    private String name;
    private String picture;
    private String sub;
}
