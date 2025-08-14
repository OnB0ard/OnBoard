package com.ssafy.backend.notification.controller;

import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.common.dto.response.SuccessResponseDTO;
import com.ssafy.backend.notification.dto.NotificationResponseDTO;
import com.ssafy.backend.notification.entity.Notification;
import com.ssafy.backend.notification.repository.NotificationRepository;
import com.ssafy.backend.notification.service.NotificationService;
import com.ssafy.backend.security.dto.JwtUserInfo;
import com.ssafy.backend.user.entity.User;
import com.ssafy.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Controller
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@RequestMapping("/api/v1/notification")
public class NotificationController {
    private final NotificationService notificationService;
    @GetMapping
    public CommonResponse<List<NotificationResponseDTO>> retrieveMessage(@AuthenticationPrincipal JwtUserInfo jwtUserInfo) {
        List<NotificationResponseDTO> messages = notificationService.retrieveMessage(jwtUserInfo.getUserId());

        return new CommonResponse<>(messages, HttpStatus.OK);
    }
    @PatchMapping("/{notificationId}")
    public CommonResponse<SuccessResponseDTO> updateRead(@AuthenticationPrincipal JwtUserInfo jwtUserInfo, @PathVariable Long notificationId
    ) {
        notificationService.updateRead(notificationId, jwtUserInfo.getUserId());
        return new CommonResponse<>(new SuccessResponseDTO(true),HttpStatus.OK);
    }
}
