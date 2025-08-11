package com.ssafy.backend.plan.controller;

import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.plan.dto.response.BookmarkListResponseDTO;
import com.ssafy.backend.plan.service.BookmarkService;
import com.ssafy.backend.security.dto.JwtUserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/plan/{planId}/bookmark")
public class BookmarkController {
    private final BookmarkService bookmarkService;

    @GetMapping("")
    public CommonResponse<BookmarkListResponseDTO> showBookmark(@PathVariable Long planId, @AuthenticationPrincipal JwtUserInfo jwtUserInfo) {
        return new CommonResponse<>(bookmarkService.showBookmark(planId, jwtUserInfo.getUserId()), HttpStatus.OK);
    }
}
