#!/bin/bash

# 커밋 메시지를 파라미터로 받음
if [ -z "$1" ]; then
    # 파라미터가 없으면 기본 메시지 사용
    COMMIT_MESSAGE="Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
else
    # 파라미터가 있으면 해당 메시지 사용
    COMMIT_MESSAGE="$1 ($(date '+%Y-%m-%d %H:%M:%S'))"
fi

# Git 명령어 실행
echo "Committing with message: $COMMIT_MESSAGE"
git add .
git commit -m "$COMMIT_MESSAGE"
git push origin main

# 배포 상태 확인
echo "Pushing to main branch... Check GitHub Actions for deployment status"
echo "You can check pod status using: kubectl get pods"