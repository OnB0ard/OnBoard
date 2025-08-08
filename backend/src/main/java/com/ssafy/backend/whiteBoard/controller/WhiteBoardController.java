package com.ssafy.backend.whiteBoard.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.common.dto.response.SuccessResponseDTO;
import com.ssafy.backend.security.dto.JwtUserInfo;

import com.ssafy.backend.whiteBoard.dto.response.RetrieveWhiteBoardObjectsResponseDTO;
import com.ssafy.backend.whiteBoard.service.WhiteBoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api/v1/plan/{planId}/whiteBoardObject")
@PreAuthorize("isAuthenticated()")
public class WhiteBoardController {
    private final WhiteBoardService whiteBoardService;

    @GetMapping
    public CommonResponse<RetrieveWhiteBoardObjectsResponseDTO> retrieveWhiteBoardObjects(@PathVariable Long planId,@AuthenticationPrincipal JwtUserInfo jwtUserInfo){
        return new CommonResponse<>(whiteBoardService.retrieveWhiteBoardObjects(planId,jwtUserInfo.getUserId()), HttpStatus.OK);
    }

}
