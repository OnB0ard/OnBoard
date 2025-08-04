package com.ssafy.backend.plan.controller;

import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.common.dto.response.SuccessResponseDTO;
import com.ssafy.backend.plan.dto.request.CreatePlaceRequestDTO;
import com.ssafy.backend.plan.dto.response.BookmarkListResponseDTO;
import com.ssafy.backend.plan.service.BookmarkService;
import com.ssafy.backend.security.dto.JwtUserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/plan")
public class BookmarkController {
    private final BookmarkService bookmarkService;

    @PostMapping("/{planId}/bookmark")
    public CommonResponse<SuccessResponseDTO> addBookmark(@PathVariable Long planId, @RequestBody CreatePlaceRequestDTO createPlaceRequestDTO, @AuthenticationPrincipal JwtUserInfo jwtUserInfo) {
        return new CommonResponse<>(new SuccessResponseDTO(bookmarkService.addBookmark(planId, createPlaceRequestDTO, jwtUserInfo.getUserId())), HttpStatus.OK);
    }

    @GetMapping("/{planId}/bookmark")
    public CommonResponse<BookmarkListResponseDTO> showBookmark(@PathVariable Long planId, @AuthenticationPrincipal JwtUserInfo jwtUserInfo) {
        return new CommonResponse<>(bookmarkService.showBookmark(planId, jwtUserInfo.getUserId()), HttpStatus.OK);
    }
    @DeleteMapping("/{planId}/{bookmarkId}")
    public CommonResponse<SuccessResponseDTO> deleteBookmark(@PathVariable Long planId, @PathVariable Long bookmarkId, @AuthenticationPrincipal JwtUserInfo jwtUserInfo) {
        return new CommonResponse<>(new SuccessResponseDTO(bookmarkService.deleteBookmark(planId, bookmarkId, jwtUserInfo.getUserId())), HttpStatus.OK);
    }
}
