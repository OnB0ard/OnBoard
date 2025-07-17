package com.ssafy.backend.plan.entity;

import com.ssafy.backend.user.entity.UserPlan;
import com.ssafy.backend.whiteBoard.entity.WhiteBoard;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "plan")
@Getter
public class Plan {
    @Id
    @Column(name = "plan_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long planId;
    @Column(name = "plan_name")
    private String planName;
    @Column(name = "plan_description")
    private String planDescription;

    @Column(name = "start_date")
    private LocalDateTime startDate;
    @Column(name = "end_date")
    private LocalDateTime endDate;
    @Column(name = "plan_image")
    private String planImage;

    @OneToMany(mappedBy = "plan",cascade = CascadeType.ALL)
    private List<UserPlan> userPlans;

    @OneToMany(mappedBy = "plan",cascade = CascadeType.ALL)
    private List<PlanPlace> planPlaces;

    @OneToMany(mappedBy = "plan",cascade = CascadeType.ALL)
    private List<Bookmark> bookmarks;

//    @OneToMany(mappedBy = "plan")
//    private List<WhiteBoard> whiteBoards;
}