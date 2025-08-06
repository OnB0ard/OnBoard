package com.ssafy.backend.plan.controller;

import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.common.dto.response.SuccessResponseDTO;
import com.ssafy.backend.plan.dto.request.CreateDayPlaceRequestDTO;
import com.ssafy.backend.plan.dto.request.CreatePlaceRequestDTO;
import com.ssafy.backend.plan.service.DayPlaceService;
import com.ssafy.backend.security.dto.JwtUserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/plan/{planId}/schedule")
public class DayPlaceController {

    private final DayPlaceService dayPlaceService;

    @PostMapping("/{dayScheduleId}")
    public CommonResponse<SuccessResponseDTO> addDayPlace(@PathVariable Long planId, @PathVariable Long dayScheduleId, @RequestBody CreateDayPlaceRequestDTO createDayPlaceRequestDTO, @AuthenticationPrincipal JwtUserInfo jwtUserInfo) {
        return new CommonResponse<>(new SuccessResponseDTO(dayPlaceService.addDayPlace(planId, dayScheduleId, createDayPlaceRequestDTO, jwtUserInfo.getUserId())), HttpStatus.OK);
    }

    @PreAuthorize("permitAll()")
    @DeleteMapping("/{dayScheduleId}/{dayPlaceId}")
    public CommonResponse<SuccessResponseDTO> deleteDayPlace(@PathVariable Long planId, @PathVariable Long dayScheduleId, @PathVariable Long dayPlaceId, @AuthenticationPrincipal JwtUserInfo jwtUserInfo) {
        return new CommonResponse<>(new SuccessResponseDTO(dayPlaceService.deleteDayPlace(planId, dayScheduleId, dayPlaceId, jwtUserInfo.getUserId())), HttpStatus.OK);
    }


}
