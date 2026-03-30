#!/bin/bash

# Pre-commit Security Check Script
# Blocks commits that contain sensitive information

set -e

echo "🔒 Running pre-commit security scan..."

# Get the list of files being committed
FILES=$(git diff --cached --name-only)

if [ -z "$FILES" ]; then
    echo "No files to check."
    exit 0
fi

echo "Checking files: $FILES"

# Create temporary directory for staged files
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Copy staged files to temporary directory
for file in $FILES; do
    if [ -f "$file" ]; then
        mkdir -p "$TEMP_DIR/$(dirname "$file")"
        git show ":$file" > "$TEMP_DIR/$file"
    fi
done

# Run the leak detector
echo "🔍 Scanning for security leaks..."
python3 leak-detector.py "$TEMP_DIR" --json --output "$TEMP_DIR/security-report.json"

# Check the results
if [ -f "$TEMP_DIR/security-report.json" ]; then
    CRITICAL=$(jq -r '.summary.critical' "$TEMP_DIR/security-report.json")
    HIGH=$(jq -r '.summary.high' "$TEMP_DIR/security-report.json")
    SCORE=$(jq -r '.summary.security_score' "$TEMP_DIR/security-report.json")
    
    echo "📊 Security Score: $SCORE/100"
    echo "🚨 Critical Issues: $CRITICAL"
    echo "⚠️  High Issues: $HIGH"
    
    if [ "$CRITICAL" -gt 0 ] || [ "$HIGH" -gt 0 ]; then
        echo ""
        echo "❌ SECURITY CHECK FAILED!"
        echo "The following security issues were found:"
        
        # Show critical and high findings
        jq -r '.findings_by_severity.CRITICAL[]? | "   📁 \(.file):\(.line) - \(.description)"' "$TEMP_DIR/security-report.json" 2>/dev/null || true
        jq -r '.findings_by_severity.HIGH[]? | "   📁 \(.file):\(.line) - \(.description)"' "$TEMP_DIR/security-report.json" 2>/dev/null || true
        
        echo ""
        echo "Please remove or encrypt the sensitive information before committing."
        echo "Run 'python3 leak-detector.py .' for a full report."
        exit 1
    fi
    
    if [ "$SCORE" -lt 80 ]; then
        echo ""
        echo "⚠️  SECURITY SCORE BELOW THRESHOLD ($SCORE < 80)"
        echo "Consider addressing the remaining security issues."
        exit 1
    fi
fi

echo "✅ Security check passed!"
exit 0
