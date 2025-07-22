package com.ssafy.backend.plan.controller;

import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.common.dto.response.SuccessResponseDTO;
import com.ssafy.backend.plan.service.PlanParticipantService;
import com.ssafy.backend.security.dto.JwtUserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/plan")
public class PlanParticipantController {

    private final PlanParticipantService planParticipantService;

    @PostMapping("/{planId}/join")
    public CommonResponse<SuccessResponseDTO> joinRequest(@PathVariable("planId") Long planId, @AuthenticationPrincipal JwtUserInfo jwtUserInfo) {
        return new CommonResponse<>(new SuccessResponseDTO(planParticipantService.joinRequest(planId, jwtUserInfo)), HttpStatus.OK);
    }

    @PostMapping("/{planId}/approve")
    public CommonResponse<SuccessResponseDTO> approveRequest(@PathVariable("planId") Long planId, @RequestBody Long userId, @AuthenticationPrincipal JwtUserInfo jwtUserInfo) {
        return new CommonResponse<>(new SuccessResponseDTO(planParticipantService.approveRequest(planId, userId, jwtUserInfo)), HttpStatus.OK);
    }

    @PostMapping("/{planId}/deny")
    public CommonResponse<SuccessResponseDTO> denyRequest(@PathVariable("planId") Long planId, @RequestBody Long userId, @AuthenticationPrincipal JwtUserInfo jwtUserInfo) {
        return new CommonResponse<>(new SuccessResponseDTO(planParticipantService.denyRequest(planId, userId, jwtUserInfo)), HttpStatus.OK);
    }

    @PostMapping("{planId}/delegate")
    public CommonResponse<SuccessResponseDTO> delegateRequest(@PathVariable("planId") Long planId, @RequestBody Long userId, @AuthenticationPrincipal JwtUserInfo jwtUserInfo) {
        return new CommonResponse<>(new SuccessResponseDTO(planParticipantService.delegateRequest(planId, userId, jwtUserInfo)), HttpStatus.OK);
    }
}
