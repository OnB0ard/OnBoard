package com.ssafy.backend.place.controller;

import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.place.dto.RetrievePlaceDetailResponseDTO;
import com.ssafy.backend.place.service.PlaceService;
import com.ssafy.backend.plan.dto.response.RetrievePlanResponse;
import com.ssafy.backend.security.dto.JwtUserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api/v1/place")
public class PlaceController {

    private final PlaceService placeService;

    @GetMapping("/{placeId}")
    public CommonResponse<RetrievePlaceDetailResponseDTO> retrievePlaceDetail(@PathVariable Long placeId) {
        return new CommonResponse<>(placeService.retrievePlaceDetail(placeId),HttpStatus.OK);
    }
}
