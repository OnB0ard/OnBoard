package com.ssafy.backend.user.entity;

import com.ssafy.backend.common.entity.DateEntity;
import com.ssafy.backend.notification.entity.Notification;
import com.ssafy.backend.security.entity.Token;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "\"user\"")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class User extends DateEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;
    @Column(name = "user_name")
    private String userName;
    @Column(name = "google_email", unique = true)
    private String googleEmail;
    @Column(name = "profile_image", length = 1000)
    private String profileImage;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserPlan> userPlans;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Token> tokens;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Notification> notifications;
}
