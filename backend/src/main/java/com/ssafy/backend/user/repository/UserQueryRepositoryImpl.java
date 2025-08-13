package com.ssafy.backend.user.repository;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.backend.user.entity.QUser;
import com.ssafy.backend.user.entity.User;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;

import java.util.Optional;

@RequiredArgsConstructor
public class UserQueryRepositoryImpl implements UserQueryRepository {

    private final JPAQueryFactory queryFactory;

    public Optional<User> lockUser(Long userId)
    {
        QUser u = QUser.user;
        User user = queryFactory.selectFrom(u)
                .where(u.userId.eq(userId))
                .setLockMode(LockModeType.PESSIMISTIC_WRITE)
                .fetchOne();
        return Optional.ofNullable(user);
    }
}
