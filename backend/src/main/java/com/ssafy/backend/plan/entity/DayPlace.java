package com.ssafy.backend.plan.entity;

import com.ssafy.backend.place.entity.Place;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    @JoinColumn(name = "place_id")
    private Place place;

    @Column(name = "index_order")
    private Integer indexOrder;

    private String memo;
}