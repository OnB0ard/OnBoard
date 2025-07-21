package com.ssafy.backend.security.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class JwtUserInfo {

    private final Long userId;
    private final String googleEmail;
    private final String userName;
}