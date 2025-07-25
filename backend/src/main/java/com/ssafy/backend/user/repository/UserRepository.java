package com.ssafy.backend.user.repository;

import com.ssafy.backend.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    User findByGoogleEmail(String googleEmail);
}