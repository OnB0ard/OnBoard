package com.ssafy.backend.user.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "user")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;
    @Column(name = "user_name")
    private String userName;
    @Column(name = "google_email")
    private String googleEmail;
    @Column(name = "profile_image")
    private String profileImage;

    @OneToMany(mappedBy = "user",cascade = CascadeType.ALL)
    private List<UserPlan> userPlans;

//    @OneToMany(mappedBy = "user")
//    private List<Token> tokens;
}
