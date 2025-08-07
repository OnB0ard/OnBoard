package com.ssafy.backend.plan.controller;

import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.common.dto.response.SuccessResponseDTO;
import com.ssafy.backend.plan.dto.request.*;
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

    @PreAuthorize("permitAll()")
    @PostMapping("/{dayScheduleId}")
    public CommonResponse<SuccessResponseDTO> addDayPlace(@PathVariable Long planId, @PathVariable Long dayScheduleId, @RequestBody CreateDayPlaceRequestDTO createDayPlaceRequestDTO, @AuthenticationPrincipal JwtUserInfo jwtUserInfo) {
        return new CommonResponse<>(new SuccessResponseDTO(dayPlaceService.addDayPlace(planId, dayScheduleId, createDayPlaceRequestDTO, jwtUserInfo.getUserId())), HttpStatus.OK);
    }

    @PreAuthorize("permitAll()")
    @PutMapping("/{dayScheduleId}/{dayPlaceId}/updateMemo")
    public CommonResponse<SuccessResponseDTO> updateMemo(@PathVariable Long planId, @PathVariable Long dayScheduleId, @PathVariable Long dayPlaceId, @RequestBody PutMemoRequestDTO putMemoRequestDTO, @AuthenticationPrincipal JwtUserInfo jwtUserInfo) {
        return new CommonResponse<>(new SuccessResponseDTO(dayPlaceService.updateMemo(planId, dayScheduleId, dayPlaceId, putMemoRequestDTO, jwtUserInfo.getUserId())), HttpStatus.OK);
    }

    @PreAuthorize("permitAll()")
    @PutMapping("/{dayScheduleId}/updateInnerPosition")
    public CommonResponse<SuccessResponseDTO> updateInnerPosition(@PathVariable Long planId, @PathVariable Long dayScheduleId, @RequestBody UpdateInnerPositionRequestDTO updateInnerPositionRequestDTO, @AuthenticationPrincipal JwtUserInfo jwtUserInfo) {
        return new CommonResponse<>(new SuccessResponseDTO(dayPlaceService.updateInnerPosition(planId, dayScheduleId, updateInnerPositionRequestDTO, jwtUserInfo.getUserId())), HttpStatus.OK);
    }

    @PreAuthorize("permitAll()")
    @PutMapping("/{dayScheduleId}/updateOuterPosition")
    public CommonResponse<SuccessResponseDTO> updateOuterPosition(@PathVariable Long planId, @PathVariable Long dayScheduleId, @RequestBody UpdateOuterPositionRequestDTO updateOuterPositionRequestDTO, @AuthenticationPrincipal JwtUserInfo jwtUserInfo) {
        return new CommonResponse<>(new SuccessResponseDTO(dayPlaceService.updateOuterPosition(planId, dayScheduleId, updateOuterPositionRequestDTO, jwtUserInfo.getUserId())), HttpStatus.OK);
    }

    @PreAuthorize("permitAll()")
    @DeleteMapping("/{dayScheduleId}/{dayPlaceId}")
    public CommonResponse<SuccessResponseDTO> deleteDayPlace(@PathVariable Long planId, @PathVariable Long dayScheduleId, @PathVariable Long dayPlaceId, @AuthenticationPrincipal JwtUserInfo jwtUserInfo) {
        return new CommonResponse<>(new SuccessResponseDTO(dayPlaceService.deleteDayPlace(planId, dayScheduleId, dayPlaceId, jwtUserInfo.getUserId())), HttpStatus.OK);
    }


}
