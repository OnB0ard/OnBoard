package com.ssafy.backend.plan.entity;

import com.ssafy.backend.user.entity.UserPlan;
import com.ssafy.backend.whiteBoard.entity.WhiteBoardObject;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.List;

@Entity
@NoArgsConstructor
@Table(name = "day_place")
@Data
@Builder
@AllArgsConstructor
public class DayPlace {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "day_place_id")
    private Long dayPlaceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "day_schedule_id")
    private DaySchedule daySchedule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "white_board_object_id")
    private WhiteBoardObject whiteBoardObject;

    @Column(name = "index_order")
    private Integer indexOrder;

    private String memo;
}