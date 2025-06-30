#!/bin/bash
# Script để kích hoạt môi trường ảo Python cho dự án Variables Sync

echo "Kích hoạt môi trường ảo Python..."
source .venv/bin/activate

echo "Môi trường ảo đã được kích hoạt!"
echo "Python version: $(python --version)"
echo "Pip version: $(pip --version)"
echo ""
echo "Để chạy ứng dụng, sử dụng: python main.py"
echo "Để thoát môi trường ảo, sử dụng: deactivate"

# Khởi động shell với môi trường ảo đã kích hoạt
exec $SHELL
