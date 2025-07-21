package com.ssafy.backend.security.entity;

import lombok.Data;

@Data
public class JwtUserInfo {

    private final int userId;
    private final String googleEmail;
    private final String userName;
}