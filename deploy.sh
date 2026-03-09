#!/bin/bash

###############################################################################
# 賓果預測器 - 一鍵部署腳本
# 
# 此腳本用於快速部署賓果預測器應用，並連接到中央共享數據庫
# 
# 使用方法：
#   bash deploy.sh
#
# 或者直接執行：
#   chmod +x deploy.sh
#   ./deploy.sh
###############################################################################

set -e  # 如果任何命令失敗，立即退出

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印帶顏色的消息
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# 檢查前置條件
check_prerequisites() {
    print_header "檢查前置條件"
    
    # 檢查 Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安裝"
        echo "請從 https://nodejs.org 下載安裝"
        exit 1
    fi
    print_success "Node.js 已安裝 ($(node --version))"
    
    # 檢查 pnpm
    if ! command -v pnpm &> /dev/null; then
        print_info "pnpm 未安裝，正在安裝..."
        npm install -g pnpm
    fi
    print_success "pnpm 已安裝 ($(pnpm --version))"
    
    # 檢查 Git
    if ! command -v git &> /dev/null; then
        print_error "Git 未安裝"
        echo "請從 https://git-scm.com 下載安裝"
        exit 1
    fi
    print_success "Git 已安裝 ($(git --version | awk '{print $3}'))"
}

# 克隆或更新代碼
setup_code() {
    print_header "設置應用代碼"
    
    REPO_URL="https://github.com/2297gupy-cloud/bingo-predictor.git"
    PROJECT_DIR="bingo-predictor"
    
    if [ -d "$PROJECT_DIR" ]; then
        print_info "項目目錄已存在，正在更新代碼..."
        cd "$PROJECT_DIR"
        git pull origin main
        cd ..
    else
        print_info "克隆代碼倉庫..."
        git clone "$REPO_URL" "$PROJECT_DIR"
    fi
    
    print_success "應用代碼已準備好"
    cd "$PROJECT_DIR"
}

# 安裝依賴
install_dependencies() {
    print_header "安裝依賴"
    
    print_info "安裝 npm 依賴..."
    pnpm install
    
    print_success "依賴安裝完成"
}

# 配置環境變數
setup_environment() {
    print_header "配置環境變數"
    
    print_info "請輸入中央數據庫連接字符串"
    print_info "格式: mysql://user:password@host:port/database"
    print_warning "您可以從原始帳號的 Manus Management UI 複製此字符串"
    echo ""
    
    read -p "請輸入 DATABASE_URL: " DATABASE_URL
    
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL 不能為空"
        exit 1
    fi
    
    # 檢查 .env 文件
    if [ ! -f ".env" ]; then
        print_info "建立 .env 文件..."
        cp .env.example .env 2>/dev/null || touch .env
    fi
    
    # 更新 .env 文件（注意：這只是示例，實際應使用 Manus 的環境變數管理）
    print_info "環境變數已準備好"
    print_warning "請在 Manus Management UI 的 Secrets 面板中設置以下環境變數："
    echo ""
    echo "  DATABASE_URL=$DATABASE_URL"
    echo ""
    print_info "或者，您可以在終端中執行："
    echo "  export DATABASE_URL='$DATABASE_URL'"
    echo ""
}

# 同步數據庫
sync_database() {
    print_header "同步數據庫"
    
    print_info "正在執行數據庫遷移..."
    pnpm db:push
    
    print_success "數據庫已同步"
}

# 啟動應用
start_application() {
    print_header "啟動應用"
    
    print_info "應用已準備好啟動"
    echo ""
    print_success "部署完成！"
    echo ""
    echo "要啟動開發服務器，請執行："
    echo "  cd $PROJECT_DIR"
    echo "  pnpm dev"
    echo ""
    echo "應用將在 http://localhost:3000 啟動"
    echo ""
}

# 主函數
main() {
    print_header "賓果預測器 - 一鍵部署"
    echo ""
    
    check_prerequisites
    echo ""
    
    setup_code
    echo ""
    
    install_dependencies
    echo ""
    
    setup_environment
    echo ""
    
    read -p "是否現在同步數據庫？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sync_database
        echo ""
    fi
    
    start_application
}

# 執行主函數
main
