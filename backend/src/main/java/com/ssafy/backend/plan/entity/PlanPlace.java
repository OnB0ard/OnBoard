package com.ssafy.backend.plan.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@NoArgsConstructor
@Table(name = "plan_place")
@Data
public class PlanPlace {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "plan_place_id")
    private Long planPlaceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private Plan plan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id")
    private Place place;

    @Column(name = "visit_date")
    private LocalDateTime visitDate;
    @Column(name = "visit_order")
    private Integer visitOrder;
    private Integer cost;
    
    @Column(columnDefinition = "TEXT")
    private String memo;
    @Column(name = "visit_time")
    private LocalTime visitTime;
}