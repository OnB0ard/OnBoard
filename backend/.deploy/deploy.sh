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
# 헬스 체크 (최대 30초 동안 재시도)
echo "헬스체크 중..."
MAX_RETRIES=10
RETRY_INTERVAL=3
SUCCESS=false

for i in $(seq 1 $MAX_RETRIES); do
  if curl -fs http://localhost:${INACTIVE_PORT}/actuator/health > /dev/null; then
    echo "✅ Health check 성공: $INACTIVE 서비스가 정상입니다."
    SUCCESS=true
    break
  fi
  echo "⏳ Health check 대기 중... ($i/${MAX_RETRIES})"
  sleep $RETRY_INTERVAL
done

if [ "$SUCCESS" != "true" ]; then
  echo "❌ Health check 실패: $INACTIVE 서비스가 30초 내에 기동되지 않았습니다. 롤백합니다."
  sudo docker-compose -f ./backend/.deploy/docker/docker-compose-${INACTIVE}.yml down
  exit 1
fi

# nginx config 교체
sudo cp ./backend/.deploy/nginx/nginx-${INACTIVE}.conf /etc/nginx/sites-available/default 
sudo nginx -s reload

# 이전 서비스 종료
sudo docker-compose -f ./backend/.deploy/docker/docker-compose-${ACTIVE}.yml down

echo "✅ $INACTIVE 배포 완료. Nginx proxy 전환됨."
