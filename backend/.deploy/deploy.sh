#!/bin/bash

set -e

ACTIVE=""
INACTIVE=""
ACTIVE_PORT=""
INACTIVE_PORT=""

if grep -q "8080" /etc/nginx/nginx.conf; then
  ACTIVE=blue
  INACTIVE=green
  ACTIVE_PORT=8080
  INACTIVE_PORT=8081
else
  ACTIVE=green
  INACTIVE=blue
  ACTIVE_PORT=8081
  INACTIVE_PORT=8080
fi

echo "현재 활성 서비스: $ACTIVE"
echo "새 배포는 $INACTIVE (${INACTIVE_PORT}) 쪽으로 실행합니다."

# 새 이미지 빌드
sudo docker build -t tripwith:latest ./backend

# inactive 서비스 실행
sudo docker-compose -f ./backend/.deploy/docker/docker-compose-${INACTIVE}.yml up -d --force-recreate

# 헬스 체크 (간단 버전)
echo "헬스체크 중..."
sleep 5
curl -f http://localhost:${INACTIVE_PORT}/actuator/health || {
  echo "❌ 새 서비스가 비정상입니다. 배포 중단"
  docker-compose -f docker-compose.${INACTIVE}.yml down
  exit 1
}

# nginx config 교체
sudo cp ./backend/.deploy/nginx/nginx-${INACTIVE}.conf /etc/nginx/sites-available/default 
sudo nginx -s reload

# 이전 서비스 종료
sudo docker-compose -f ./backend/.deploy/docker/docker-compose-${ACTIVE}.yml down

echo "✅ $INACTIVE 배포 완료. Nginx proxy 전환됨."
