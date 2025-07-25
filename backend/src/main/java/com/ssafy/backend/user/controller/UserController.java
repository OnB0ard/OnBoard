package com.ssafy.backend.user.controller;

import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.common.dto.response.SuccessResponseDTO;
import com.ssafy.backend.security.dto.JwtUserInfo;
import com.ssafy.backend.user.dto.request.ModifyProfileRequestDTO;
import com.ssafy.backend.user.dto.response.LoginResponseDTO;
import com.ssafy.backend.user.dto.response.ModifyProfileResponseDTO;
import com.ssafy.backend.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/user")
public class UserController {
    private final UserService userService;

    @PutMapping("/{userId}")
    public CommonResponse<ModifyProfileResponseDTO> modifyProfile(
            @AuthenticationPrincipal JwtUserInfo jwtUserInfo, @RequestPart ModifyProfileRequestDTO modifyProfileRequestDTO, @RequestPart(value = "image",required = false) MultipartFile image) throws IOException {
        ModifyProfileResponseDTO modifyProfile = userService.modifyProfile(jwtUserInfo.getUserId(), modifyProfileRequestDTO,image);
        return new CommonResponse<>(modifyProfile, HttpStatus.OK);
    }

    @DeleteMapping("/{userId}")
    public CommonResponse<SuccessResponseDTO> deleteUser(@AuthenticationPrincipal JwtUserInfo jwtUserInfo, @PathVariable Long userId) {
        return new CommonResponse<>(new SuccessResponseDTO(userService.deleteUser(jwtUserInfo, userId)), HttpStatus.OK);
    }
}
