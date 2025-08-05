package com.ssafy.backend.plan.controller;

import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.common.dto.response.SuccessResponseDTO;
import com.ssafy.backend.plan.dto.request.TitleRequestDTO;
import com.ssafy.backend.plan.dto.response.CreateDayScheduleResponseDTO;
import com.ssafy.backend.plan.dto.response.PlanScheduleResponseDTO;
import com.ssafy.backend.plan.service.DayScheduleService;
import com.ssafy.backend.security.dto.JwtUserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/plan/{planId}/schedule")
public class DayScheduleController {

    private final DayScheduleService dayScheduleService;

    @PostMapping("")
    public CommonResponse<CreateDayScheduleResponseDTO> createDaySchedule(@PathVariable Long planId, @RequestBody TitleRequestDTO titleRequestDTO, @AuthenticationPrincipal JwtUserInfo jwtUserInfo) {
        return new CommonResponse<>(dayScheduleService.createDaySchedule(planId, titleRequestDTO, jwtUserInfo.getUserId()), HttpStatus.OK);
    }

    @GetMapping("")
    public CommonResponse<PlanScheduleResponseDTO> getPlanSchedule(@PathVariable Long planId, @AuthenticationPrincipal JwtUserInfo jwtUserInfo) {
        return new CommonResponse<>(dayScheduleService.getPlanSchedule(planId, jwtUserInfo.getUserId()), HttpStatus.OK);
    }

    @PutMapping("/{dayScheduleId}/updateTitle")
    public CommonResponse<SuccessResponseDTO> modifyTitle(@PathVariable Long planId, @PathVariable Long dayScheduleId, @RequestBody TitleRequestDTO titleRequestDTO, @AuthenticationPrincipal JwtUserInfo jwtUserInfo) {
        return new CommonResponse<>(new SuccessResponseDTO(dayScheduleService.modifyTitle(planId, dayScheduleId, titleRequestDTO, jwtUserInfo.getUserId())), HttpStatus.OK);
    }
}
