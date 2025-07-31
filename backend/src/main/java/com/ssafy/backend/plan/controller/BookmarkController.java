package com.ssafy.backend.plan.controller;

import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.common.dto.response.SuccessResponseDTO;
import com.ssafy.backend.plan.dto.request.CreatePlaceRequestDTO;
import com.ssafy.backend.plan.service.BookmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api/v1/plan")
public class BookmarkController {
    private BookmarkService bookmarkService;

    @PostMapping("/{planId}/bookmark")
    public CommonResponse<SuccessResponseDTO> addBookmark(@PathVariable Long planId, @RequestBody CreatePlaceRequestDTO createPlaceRequestDTO) {
        return new CommonResponse<>(new SuccessResponseDTO(bookmarkService.addBookmark(planId, createPlaceRequestDTO)), HttpStatus.OK);
    }
}
