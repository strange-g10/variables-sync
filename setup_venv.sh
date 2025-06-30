#!/bin/bash
# Setup Virtual Environment for Variables Sync Pipeline

echo "🔧 Setting up Virtual Environment for Variables Sync Pipeline"
echo "============================================================"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📥 Installing Python packages..."
pip install -r requirements.txt

# Create activation script
echo "📝 Creating activation script..."
cat > activate_env.sh << 'EOF'
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
EOF

chmod +x activate_env.sh

# Test setup
echo "🧪 Testing setup..."
python setup_pipeline.py

echo ""
echo "✅ Setup completed!"
echo ""
echo "🚀 Quick Start:"
echo "   ./activate_env.sh                    # Activate environment"
echo "   python pipeline_main.py --interactive  # Run enhanced pipeline"
echo ""
echo "📝 Next Steps:"
echo "   1. Configure your .env file with Organization PAT"
echo "   2. Add Google Service Account credentials"
echo "   3. Run: python pipeline_main.py --interactive"
