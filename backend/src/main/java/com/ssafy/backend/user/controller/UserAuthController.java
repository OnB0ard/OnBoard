package com.ssafy.backend.user.controller;

import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.user.dto.request.LoginRequestDTO;
import com.ssafy.backend.user.dto.response.LoginResponseDTO;
import com.ssafy.backend.user.service.UserAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/user")
public class UserAuthController {

    private final UserAuthService userAuthService;

    @PostMapping("/login")
    @PreAuthorize("permitAll()")
    public CommonResponse<LoginResponseDTO> login(@RequestBody LoginRequestDTO loginRequestDTO) {
        LoginResponseDTO userInfo = userAuthService.login(loginRequestDTO);
        return new CommonResponse<>(userInfo, HttpStatus.OK);
    }
}
