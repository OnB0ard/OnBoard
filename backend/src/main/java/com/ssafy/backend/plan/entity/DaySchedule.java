package com.ssafy.backend.plan.entity;

import com.ssafy.backend.user.entity.UserPlan;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.List;

@Entity
@NoArgsConstructor
@Table(name = "day_schedule")
@Data
public class DaySchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "day_schedule_id")
    private Long dayScheduleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private Plan plan;

    @OneToMany(mappedBy = "daySchedule", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DayPlace> dayPlaces;

    @Column(name = "day_order")
    private Integer dayOrder;

    private String title;
}