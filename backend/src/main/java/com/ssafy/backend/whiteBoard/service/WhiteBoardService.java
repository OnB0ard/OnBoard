package com.ssafy.backend.whiteBoard.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.backend.place.entity.Place;
import com.ssafy.backend.place.repository.PlaceRepository;
import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.plan.exception.UserNotInPlanException;
import com.ssafy.backend.plan.exception.PlanNotExistException;
import com.ssafy.backend.plan.exception.UserNotExistException;
import com.ssafy.backend.plan.repository.PlanRepository;
import com.ssafy.backend.plan.repository.UserPlanRepository;
import com.ssafy.backend.user.entity.User;
import com.ssafy.backend.user.entity.UserPlan;
import com.ssafy.backend.user.entity.UserStatus;
import com.ssafy.backend.user.repository.UserRepository;
import com.ssafy.backend.whiteBoard.dto.request.CreateDiagramRequestDTO;
import com.ssafy.backend.whiteBoard.dto.request.CreateLineRequestDTO;
import com.ssafy.backend.whiteBoard.dto.request.CreateTravelRequestDTO;
import com.ssafy.backend.whiteBoard.dto.request.ModifyWhiteBoardObjectRequestDTO;
import com.ssafy.backend.whiteBoard.dto.response.*;
import com.ssafy.backend.whiteBoard.entity.ObjectType;
import com.ssafy.backend.whiteBoard.entity.WhiteBoardObject;
import com.ssafy.backend.whiteBoard.exception.WhiteBoardObjectNotExistException;
import com.ssafy.backend.whiteBoard.exception.WhiteBoardObjectPlanMismatchException;
import com.ssafy.backend.whiteBoard.repository.WhiteBoardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.core.type.TypeReference;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WhiteBoardService {
    private final UserRepository userRepository;
    private final PlanRepository planRepository;
    private final WhiteBoardRepository whiteBoardRepository;
    private final PlaceRepository placeRepository;
    private final UserPlanRepository userPlanRepository;

    @Transactional
    public Long createDiagram(Long planId, CreateDiagramRequestDTO createDiagramRequestDTO, Long userId) throws JsonProcessingException {
        Plan plan = validatePlanExistence(planId);
        User user = validateUserExistence(userId);
        validateUserIsApprovedParticipant(plan, user);

        ObjectType objectType = ObjectType.valueOf(createDiagramRequestDTO.getType().toUpperCase());
        String pointsJson = null;
        if (createDiagramRequestDTO.getPoints() != null) {
            pointsJson = new ObjectMapper().writeValueAsString(createDiagramRequestDTO.getPoints());
        }
        //도형생성
        WhiteBoardObject whiteBoardObject = WhiteBoardObject.builder()
                .plan(plan)
                .objectType(objectType)
                .x(createDiagramRequestDTO.getX())
                .y(createDiagramRequestDTO.getY())
                .scaleX(createDiagramRequestDTO.getScaleX())
                .scaleY(createDiagramRequestDTO.getScaleY())
                .rotation(createDiagramRequestDTO.getRotation())
                .stroke(createDiagramRequestDTO.getStroke())
                .fill(createDiagramRequestDTO.getFill())
                .radius(createDiagramRequestDTO.getRadius())
                .width(createDiagramRequestDTO.getWidth())
                .height(createDiagramRequestDTO.getHeight())
                .text(createDiagramRequestDTO.getText())
                .points(pointsJson)
                .build();
        whiteBoardRepository.save(whiteBoardObject);
        return whiteBoardObject.getWhiteBoardObjectId();
    }

    @Transactional
    public Long createTravel(Long planId, CreateTravelRequestDTO createTravelRequestDTO, Long userId) {
        Plan plan = validatePlanExistence(planId);
        User user = validateUserExistence(userId);
        validateUserIsApprovedParticipant(plan, user);

        CreateTravelRequestDTO.WhiteBoardPlaceInfo placeInfo = createTravelRequestDTO.getWhiteBoardPlace();
        // 중복 방지용 조회 (google_place_id 기반)
        Place place = placeRepository.findByGooglePlaceIdForUpdate(placeInfo.getGooglePlaceId())
                .orElseGet(() -> {
                    // 없으면 저장
                    Place newPlace = Place.builder()
                            .googlePlaceId(placeInfo.getGooglePlaceId())
                            .placeName(placeInfo.getPlaceName())
                            .latitude(placeInfo.getLatitude())
                            .longitude(placeInfo.getLongitude())
                            .phoneNumber(placeInfo.getPhoneNumber())
                            .address(placeInfo.getAddress())
                            .rating(placeInfo.getRating())
                            .ratingCount(placeInfo.getRatingCount())
                            .placeUrl(placeInfo.getPlaceUrl())
                            .imageUrl(placeInfo.getImageUrl())
                            .siteUrl(placeInfo.getSiteUrl())
                            .category(placeInfo.getCategory())
                            .build();
                    return placeRepository.save(newPlace);
                });
        CreateTravelRequestDTO.ObjectInfo objectInfo = createTravelRequestDTO.getObjectInfo();

        // 2. 여행지객체 생성
        WhiteBoardObject whiteBoardObject = WhiteBoardObject.builder()
                .place(place) // 연관관계 설정
                .plan(plan)
                .x(objectInfo.getX())
                .y(objectInfo.getY())
                .objectType(ObjectType.PLACE) // ENUM
                .build();
        whiteBoardRepository.save(whiteBoardObject);
        return whiteBoardObject.getWhiteBoardObjectId();
    }

    public RetrieveWhiteBoardObjectsResponseDTO retrieveWhiteBoardObjects(Long planId, Long userId) {
        // 1. 플랜 존재 유효성 검사
        Plan plan = validatePlanExistence(planId);
        User user = validateUserExistence(userId);
        validateUserIsApprovedParticipant(plan, user);
        // 2. WhiteBoardObject + 연관된 Place를 Fetch Join으로 조회 (N+1 방지)
        List<WhiteBoardObject> objects = whiteBoardRepository.findByPlanWithPlace(plan);

        // 3. 도형류 (TEXT, CIRCLE, RECT, ...) 필터링 및 DTO 매핑
        List<WhiteBoardDiagramDTO> diagrams = objects.stream()
                .filter(obj -> obj.getObjectType() != ObjectType.PLACE)
                .map(obj -> WhiteBoardDiagramDTO.builder()
                        .whiteBoardObjectId(obj.getWhiteBoardObjectId())
                        .type(obj.getObjectType().name())
                        .x(obj.getX())
                        .y(obj.getY())
                        .scaleX(obj.getScaleX())
                        .scaleY(obj.getScaleY())
                        .rotation(obj.getRotation())
                        .radius(obj.getRadius())
                        .width(obj.getWidth())
                        .height(obj.getHeight())
                        .stroke(obj.getStroke())
                        .fill(obj.getFill())
                        .text(obj.getText())
                        .points(parsePoints(obj.getPoints())) // JSON → List<Double>
                        .build())
                .toList();

        // 4. 장소형 도형 (PLACE 타입) 필터링 및 DTO 매핑
        List<WhiteBoardPlaceDTO> places = objects.stream()
                .filter(obj -> obj.getObjectType() == ObjectType.PLACE && obj.getPlace() != null)
                .map(obj -> WhiteBoardPlaceDTO.builder()
                        .objectInfo(ObjectInfoDTO.builder()
                                .whiteBoardObjectId(obj.getWhiteBoardObjectId())
                                .x(obj.getX())
                                .y(obj.getY())
                                .build())
                        .place(PlaceInfoDTO.builder()
                                .placeId(obj.getPlace().getPlaceId())
                                .googlePlaceId(obj.getPlace().getGooglePlaceId())
                                .placeName(obj.getPlace().getPlaceName())
                                .latitude(obj.getPlace().getLatitude())
                                .longitude(obj.getPlace().getLongitude())
                                .address(obj.getPlace().getAddress())
                                .rating(obj.getPlace().getRating())
                                .googleImg(obj.getPlace().getImageUrl())
                                .build())
                        .build())
                .toList();

        // 5. 최종 응답 DTO 구성
        return RetrieveWhiteBoardObjectsResponseDTO.builder()
                .whiteBoardDiagrams(diagrams)
                .whiteBoardPlaces(places)
                .build();
    }

    @Transactional
    public void modifyWhiteBoardObject(Long planId, Long whiteObjectId, ModifyWhiteBoardObjectRequestDTO modifyWhiteBoardObjectRequestDTO, Long userId) throws JsonProcessingException {
        Plan plan = validatePlanExistence(planId);
        User user = validateUserExistence(userId);
        validateUserIsApprovedParticipant(plan, user);

        WhiteBoardObject whiteBoardObject = validateWhiteBoardObject(whiteObjectId);

        if (!whiteBoardObject.getPlan().equals(plan)) {
            throw new WhiteBoardObjectPlanMismatchException("요청한 플랜에 속하지 않는 화이트보드 객체입니다.");
        }

        whiteBoardObject.setX(modifyWhiteBoardObjectRequestDTO.getX());
        whiteBoardObject.setY(modifyWhiteBoardObjectRequestDTO.getY());
        whiteBoardObject.setScaleX(modifyWhiteBoardObjectRequestDTO.getScaleX());
        whiteBoardObject.setScaleY(modifyWhiteBoardObjectRequestDTO.getScaleY());
        whiteBoardObject.setRotation(modifyWhiteBoardObjectRequestDTO.getRotation());
        whiteBoardObject.setText(modifyWhiteBoardObjectRequestDTO.getText());

        if (modifyWhiteBoardObjectRequestDTO.getPoints() != null) {
            ObjectMapper mapper = new ObjectMapper();
            whiteBoardObject.setPoints(mapper.writeValueAsString(modifyWhiteBoardObjectRequestDTO.getPoints()));
        }

    }

    @Transactional
    public void deleteWhiteBoardObject(Long planId, Long whiteObjectId, Long userId) {
        Plan plan = validatePlanExistence(planId);
        User user = validateUserExistence(userId);
        validateUserIsApprovedParticipant(plan, user);

        WhiteBoardObject whiteBoardObject = validateWhiteBoardObject(whiteObjectId);

        if (!whiteBoardObject.getPlan().equals(plan)) {
            throw new WhiteBoardObjectPlanMismatchException("요청한 플랜에 속하지 않는 화이트보드 객체입니다.");
        }
        // 부몬 삭제
        whiteBoardRepository.delete(whiteBoardObject);

    }
    @Transactional
    public Long createLine(Long planId, CreateLineRequestDTO createLineRequestDTO, Long userId) throws JsonProcessingException {
        Plan plan = validatePlanExistence(planId);
        User user = validateUserExistence(userId);
        validateUserIsApprovedParticipant(plan, user);
        String pointsJson = new ObjectMapper().writeValueAsString(createLineRequestDTO.getPoints());
        //도형생성
        WhiteBoardObject whiteBoardObject = WhiteBoardObject.builder()
                .plan(plan)
                .objectType(ObjectType.PEN)
                .x(createLineRequestDTO.getX())
                .y(createLineRequestDTO.getY())
                .stroke(createLineRequestDTO.getStroke())
                .points(pointsJson)
                .build();
        whiteBoardRepository.save(whiteBoardObject);
        return whiteBoardObject.getWhiteBoardObjectId();

    }
    private void validateUserIsApprovedParticipant(Plan plan, User user) {
        if(!userPlanRepository.existsByPlanAndUser(plan, user)) {
            throw new UserNotInPlanException("당신은 이 방의 참여자가 아닙니다.");
        }
        UserPlan userPlan = userPlanRepository.getUserPlanByPlanAndUser(plan, user);
        if (userPlan.getUserStatus() != UserStatus.APPROVED) {
            throw new UserNotInPlanException("당신은 이 방의 참여자가 아닙니다.");
        }
    }
    private WhiteBoardObject validateWhiteBoardObject(Long whiteObjectId) {
        return whiteBoardRepository.findById(whiteObjectId)
                .orElseThrow(() -> new WhiteBoardObjectNotExistException("존재하지 않는 화이트보드 객체입니다. whiteObjectId=" + whiteObjectId));
    }
    private Plan validatePlanExistence(Long planId) {
        return planRepository.findById(planId)
                .orElseThrow(() -> new PlanNotExistException("존재하지 않는 계획입니다. planId=" + planId));
    }
    private User validateUserExistence(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotExistException("존재하지 않는 사용자입니다. userId=" + userId));
    }

    private List<Double> parsePoints(String pointsJson) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(pointsJson, new TypeReference<List<Double>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

}
