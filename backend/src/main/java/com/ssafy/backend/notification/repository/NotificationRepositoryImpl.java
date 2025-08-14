package com.ssafy.backend.notification.repository;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.backend.notification.entity.Notification;
import com.ssafy.backend.notification.entity.QNotification;
import com.ssafy.backend.user.entity.QUser;
import lombok.RequiredArgsConstructor;

import java.util.List;

@RequiredArgsConstructor
public class NotificationRepositoryImpl implements NotificationQueryRepository {

    private final JPAQueryFactory queryFactory;


    @Override
    public List<Notification> findRecent50ByUserId(Long userId) {
        QNotification n = QNotification.notification;
        QUser u = QUser.user;
        return queryFactory
                .selectFrom(n)
                .join(n.user,u).fetchJoin()
                .where(u.userId.eq(userId))
                .orderBy(
                    n.createdAt.desc()
                )
                .limit(50)
                .fetch();
    }
}
