package com.ssafy.backend.security.entity;

import com.ssafy.backend.user.entity.User;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "token")
@Data
public class Token {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "token_id")
    private Long tokenId;

    @Enumerated(EnumType.STRING)
    private TokenType tokenType;

    @Column(name = "token_string")
    private String tokenString;
    @Column(name = "expire_date")
    private LocalDateTime expireDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}
