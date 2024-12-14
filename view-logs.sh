#!/bin/bash
# view-logs.sh

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}▲ Fargate Logs${NC}"
echo -e "${YELLOW}- Service:${NC} fsbone-service"
echo -e "${YELLOW}- Environment:${NC} production"
echo ""

# 최신 로그 스트림 가져오기
LATEST_STREAM=$(aws logs describe-log-streams \
    --log-group-name "/ecs/fsbone-task" \
    --order-by LastEventTime \
    --descending \
    --limit 1 \
    --query 'logStreams[0].logStreamName' \
    --output text)

# 실시간 로그 표시
echo -e "${GREEN}✓ Connected to log stream${NC}"
aws logs tail "/ecs/fsbone-task" \
    --follow \
    --format short \
    --since 1m