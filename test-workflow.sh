#!/bin/bash

# HomeBank V2 完整功能測試腳本

echo "🏦 HomeBank V2 功能測試"
echo "======================="
echo ""

BASE_URL="http://localhost:3000"

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 測試函數
test_api() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  
  echo -n "測試: $name ... "
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s "$BASE_URL$endpoint")
  elif [ "$method" = "POST" ]; then
    response=$(curl -s -X POST "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  elif [ "$method" = "PUT" ]; then
    response=$(curl -s -X PUT "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  elif [ "$method" = "DELETE" ]; then
    response=$(curl -s -X DELETE "$BASE_URL$endpoint")
  fi
  
  if echo "$response" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ 通過${NC}"
    return 0
  else
    echo -e "${RED}✗ 失敗${NC}"
    echo "  回應: $response"
    return 1
  fi
}

echo -e "${BLUE}1. 初始化資料庫${NC}"
test_api "初始化資料庫" "POST" "/api/init"
echo ""

echo -e "${BLUE}2. 測試認證功能${NC}"
test_api "父母登入" "POST" "/api/auth/login" '{"email":"parent@test.com","password":"password123"}'
test_api "子女登入" "POST" "/api/auth/login" '{"email":"child@test.com","password":"password123"}'
echo ""

echo -e "${BLUE}3. 測試工作管理（父母）${NC}"
test_api "建立工作" "POST" "/api/jobs" '{"title":"測試工作","description":"這是測試","points":15,"createdBy":"1"}'
test_api "取得所有工作" "GET" "/api/jobs"
echo ""

echo -e "${BLUE}4. 測試獎勵管理（父母）${NC}"
test_api "建立獎勵" "POST" "/api/rewards" '{"title":"測試獎勵","description":"這是測試","points":30,"stock":5,"createdBy":"1"}'
test_api "取得所有獎勵" "GET" "/api/rewards"
echo ""

echo -e "${BLUE}5. 測試工作流程（子女）${NC}"
test_api "接取工作" "POST" "/api/jobs/2" '{"userId":"2"}'
test_api "完成工作" "PUT" "/api/jobs/2" '{"userId":"2"}'
echo ""

echo -e "${BLUE}6. 測試點數系統${NC}"
test_api "查看交易記錄" "GET" "/api/points"
test_api "查看用戶列表" "GET" "/api/users"
echo ""

echo -e "${BLUE}7. 測試獎勵兌換（子女）${NC}"
test_api "兌換獎勵" "POST" "/api/rewards/redeem" '{"userId":"2","rewardId":"2"}'
test_api "再次查看交易記錄" "GET" "/api/points"
echo ""

echo "======================="
echo -e "${GREEN}測試完成！${NC}"
echo ""
echo "請訪問以下頁面進行手動測試："
echo "  - 父母登入: $BASE_URL/login (parent@test.com / password123)"
echo "  - 子女登入: $BASE_URL/login (child@test.com / password123)"
