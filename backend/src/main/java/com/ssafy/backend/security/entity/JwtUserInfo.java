package com.ssafy.backend.security.entity;

import lombok.Data;

@Data
public class JwtUserInfo {

    private final Long userId;
    private final String googleEmail;
    private final String userName;
}