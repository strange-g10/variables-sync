#!/bin/bash
# Activate virtual environment for Variables Sync Pipeline

if [ -d "venv" ]; then
    echo "🔄 Activating Variables Sync Pipeline virtual environment..."
    source venv/bin/activate
    echo "✅ Virtual environment activated!"
    echo "🚀 You can now run:"
    echo "   python pipeline_main.py --interactive"
    echo "   python setup_pipeline.py"
    echo "   python main.py"
    echo ""
    echo "💡 To deactivate: type 'deactivate'"
else
    echo "❌ Virtual environment not found. Run: ./setup_venv.sh"
fi
