package com.ssafy.backend.plan.entity;

import com.ssafy.backend.common.entity.DateEntity;
import com.ssafy.backend.user.entity.UserPlan;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Entity
@NoArgsConstructor
@Table(name = "plan")
@Data
@Builder
@AllArgsConstructor
public class Plan extends DateEntity {
    @Id
    @Column(name = "plan_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long planId;
    @Column(name = "plan_name")
    private String planName;
    @Column(name = "plan_description")
    private String planDescription;

    @Column(name = "start_date")
    private LocalDate startDate;
    @Column(name = "end_date")
    private LocalDate endDate;
    @Column(name = "plan_image", length = 1000)
    private String planImage;
    @Column(name = "hash_tag")
    private String hashTage;

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserPlan> userPlans;

    @OneToMany(mappedBy = "plan",cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PlanPlace> planPlaces;

    @OneToMany(mappedBy = "plan",cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Bookmark> bookmarks;

//    @OneToMany(mappedBy = "plan")
//    private List<WhiteBoard> whiteBoards;
}