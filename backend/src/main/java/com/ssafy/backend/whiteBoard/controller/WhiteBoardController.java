package com.ssafy.backend.whiteBoard.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.common.dto.response.SuccessResponseDTO;
import com.ssafy.backend.security.dto.JwtUserInfo;
import com.ssafy.backend.whiteBoard.dto.request.CreateDiagramRequestDTO;
import com.ssafy.backend.whiteBoard.dto.request.CreateTravelRequestDTO;
import com.ssafy.backend.whiteBoard.dto.request.ModifyWhiteBoardObjectRequestDTO;
import com.ssafy.backend.whiteBoard.dto.response.RetrieveWhiteBoardObjectsResponseDTO;
import com.ssafy.backend.whiteBoard.service.WhiteBoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api/v1/plan/{planId}/whiteBoardObject")
public class WhiteBoardController {
    private final WhiteBoardService whiteBoardService;
    @PostMapping("/diagram")
    public CommonResponse<SuccessResponseDTO> createDiagram(@PathVariable Long planId, @RequestBody CreateDiagramRequestDTO createDiagramRequestDTO, @AuthenticationPrincipal JwtUserInfo jwtUserInfo) throws JsonProcessingException {
        whiteBoardService.createDiagram(planId,createDiagramRequestDTO);
        return new CommonResponse<>(new SuccessResponseDTO(true), HttpStatus.OK);
    }
    @PostMapping("/travel")
    public CommonResponse<SuccessResponseDTO> createTravel(@PathVariable Long planId, @RequestBody CreateTravelRequestDTO createTravelRequestDTO, @AuthenticationPrincipal JwtUserInfo jwtUserInfo) throws JsonProcessingException {
        whiteBoardService.createTravel(planId,createTravelRequestDTO);
        return new CommonResponse<>(new SuccessResponseDTO(true), HttpStatus.OK);
    }
    @GetMapping
    public CommonResponse<RetrieveWhiteBoardObjectsResponseDTO> retrieveWhiteBoardObjects(@PathVariable Long planId){
        return new CommonResponse<>(whiteBoardService.retrieveWhiteBoardObjects(planId), HttpStatus.OK);
    }
    @PutMapping("/{whiteObjectId}/modify")
    public CommonResponse<SuccessResponseDTO> modifyWhiteBoardObject(@PathVariable Long planId,@PathVariable Long whiteObjectId,
                                                                     @RequestBody ModifyWhiteBoardObjectRequestDTO modifyWhiteBoardObjectRequestDTO) throws JsonProcessingException {
        whiteBoardService.modifyWhiteBoardObject(planId,whiteObjectId,modifyWhiteBoardObjectRequestDTO);
        return new CommonResponse<>(new SuccessResponseDTO(true), HttpStatus.OK);
    }
}
