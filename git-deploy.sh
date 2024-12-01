#!/bin/bash

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Git Add ===${NC}"
git add .

echo -e "${YELLOW}커밋 메시지를 입력하세요:${NC}"
read message

echo -e "${GREEN}=== Git Commit ===${NC}"
git commit -m "$message"

echo -e "${GREEN}=== Git Push ===${NC}"
git push origin main

echo -e "${GREEN}=== 완료 ===${NC}" 