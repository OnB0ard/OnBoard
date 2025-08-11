package com.ssafy.backend.plan.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.ssafy.backend.plan.dto.request.CreateBookmarkRequestDTO;
import com.ssafy.backend.plan.dto.response.CreateBookmarkResponseDTO;
import com.ssafy.backend.plan.dto.websocket.BookmarkSocketDTO;
import com.ssafy.backend.plan.service.BookmarkService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class BookmarkSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final BookmarkService bookmarkService;

    @MessageMapping("/bookmark/{planId}")
    public void handleBookmarkSocket(@DestinationVariable Long planId,
                                     @Payload BookmarkSocketDTO bookmarkSocketDTO,
                                     SimpMessageHeaderAccessor accessor) throws JsonProcessingException {

        Long userId = (Long) accessor.getSessionAttributes().get("userId");

        switch (bookmarkSocketDTO.getAction()) {
            case "CREATE":
                CreateBookmarkRequestDTO createBookmarkRequestDTO = bookmarkSocketDTO.toCreateBookmarkRequestDTO();
                CreateBookmarkResponseDTO createBookmarkResponseDTO = bookmarkService.createBookmark(planId, createBookmarkRequestDTO, userId);
                bookmarkSocketDTO.setBookmarkId(createBookmarkResponseDTO.getBookmarkId());
                bookmarkSocketDTO.setPlaceId(createBookmarkResponseDTO.getPlaceId());
                messagingTemplate.convertAndSend("/topic/bookmark/" + planId, createBookmarkRequestDTO);
                break;

            case "DELETE":
                bookmarkService.deleteBookmark(planId, bookmarkSocketDTO.getBookmarkId(), userId);

                BookmarkSocketDTO deleteBookmarkSocketDTO = BookmarkSocketDTO.builder()
                        .action("DELETE")
                        .bookmarkId(bookmarkSocketDTO.getBookmarkId())
                        .build();
                messagingTemplate.convertAndSend("/topic/bookmark/" + planId, deleteBookmarkSocketDTO);
                break;

            default:
                log.warn("지원하지 않는 WebSocket action: {}", bookmarkSocketDTO.getAction());
                throw new IllegalArgumentException("지원하지 않는 WebSocket action: " + bookmarkSocketDTO.getAction());
        }
    }
}
