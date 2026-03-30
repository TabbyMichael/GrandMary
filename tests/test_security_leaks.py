#!/usr/bin/env python3
"""
Security Leak Detection Tests
Automated tests to ensure no secrets or PII are exposed in the codebase
"""

import pytest
import json
import os
import subprocess
import tempfile
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))
from leak_detector import LeakDetector, Severity

class TestSecurityLeakDetection:
    def setup_method(self):
        self.project_root = Path(__file__).parent.parent
        self.detector = LeakDetector(str(self.project_root))
    
    def test_no_hardcoded_secrets(self):
        """Test that no hardcoded secrets are present in the codebase"""
        findings = self.detector.scan_directory()
        
        # Filter for critical and high severity findings
        critical_findings = [f for f in findings if f.severity in [Severity.CRITICAL, Severity.HIGH]]
        
        # Assert no critical or high severity findings
        assert len(critical_findings) == 0, f"Security issues found: {critical_findings}"
    
    def test_no_default_passwords(self):
        """Test that no default or weak passwords are present"""
        findings = self.detector.scan_directory()
        default_passwords = [f for f in findings if f.pattern == 'default_password']
        
        assert len(default_passwords) == 0, f"Default passwords found: {default_passwords}"
    
    def test_no_hardcoded_api_keys(self):
        """Test that no API keys are hardcoded"""
        findings = self.detector.scan_directory()
        api_keys = [f for f in findings if f.pattern in ['jwt_token', 'aws_access_key', 'google_api_key', 'github_token']]
        
        assert len(api_keys) == 0, f"API keys found: {api_keys}"
    
    def test_environment_files_secure(self):
        """Test that environment files don't contain insecure defaults"""
        env_files = ['.env.example', 'backend/.env.example']
        
        for env_file in env_files:
            file_path = self.project_root / env_file
            if file_path.exists():
                content = file_path.read_text()
                
                # Check for insecure defaults
                insecure_patterns = [
                    'change-this-password',
                    'your-super-secret',
                    'admin123',
                    'password123',
                    'changeme'
                ]
                
                for pattern in insecure_patterns:
                    assert pattern not in content.lower(), f"Insecure pattern '{pattern}' found in {env_file}"
    
    def test_gitignore_excludes_sensitive_files(self):
        """Test that .gitignore properly excludes sensitive files"""
        gitignore_path = self.project_root / '.gitignore'
        
        assert gitignore_path.exists(), ".gitignore file not found"
        
        content = gitignore_path.read_text()
        
        # Check for critical exclusions
        required_exclusions = [
            '.env',
            '*.env',
            '.env.local',
            '.env.development',
            '.env.production',
            '*.pem',
            '*.key',
            'id_rsa',
            'id_ed25519',
            'secrets.json',
            'config.json'
        ]
        
        for exclusion in required_exclusions:
            assert exclusion in content, f"Missing exclusion '{exclusion}' in .gitignore"
    
    def test_no_pii_in_test_files(self):
        """Test that test files don't contain real PII"""
        findings = self.detector.scan_directory()
        
        # Filter findings in test files
        test_file_findings = [
            f for f in findings 
            if any(keyword in f.file_path.lower() for keyword in ['test', 'spec'])
            and f.pattern in ['email_address', 'phone_number', 'ssn', 'credit_card']
        ]
        
        # Allow some PII in test files but ensure they're obvious test data
        allowed_domains = ['example.com', 'test.com', 'demo.com', 'localhost']
        for finding in test_file_findings:
            if finding.pattern == 'email_address':
                assert any(domain in finding.matched_text.lower() for domain in allowed_domains), \
                    f"Real email address found in test file: {finding.matched_text} in {finding.file_path}"
    
    def test_security_score_minimum(self):
        """Test that security score meets minimum threshold"""
        findings = self.detector.scan_directory()
        report = self.detector.generate_report()
        
        security_score = report['summary']['security_score']
        assert security_score >= 80, f"Security score {security_score} below minimum threshold of 80"
    
    def test_database_schema_no_pii_plaintext(self):
        """Test that database schema doesn't store PII in plaintext"""
        schema_files = [
            'backend/gallery-schema.sql',
            'backend/tribute-supabase-schema.sql',
            'backend/supabase-schema.sql'
        ]
        
        for schema_file in schema_files:
            file_path = self.project_root / schema_file
            if file_path.exists():
                content = file_path.read_text().lower()
                
                # Check for PII fields without encryption
                pii_fields = ['email', 'phone', 'ssn', 'credit_card', 'address']
                
                for field in pii_fields:
                    if f'{field}' in content:
                        # Check if there's any mention of encryption
                        has_encryption = any(keyword in content for keyword in ['encrypt', 'hash', 'cipher', 'aes'])
                        
                        # For emails, we allow plaintext but flag it
                        if field == 'email':
                            print(f"⚠️  Email field found without encryption in {schema_file}")
                        else:
                            assert has_encryption, f"PII field '{field}' found without encryption in {schema_file}"

class TestLeakDetectorFunctionality:
    def test_pattern_detection(self):
        """Test that the leak detector correctly identifies patterns"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
            f.write('''
                const apiKey = "AIza1234567890abcdefghijklmnopqrstuvwxyz";
                const password = "admin123";
                const email = "user@example.com";
                const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
            ''')
            
            detector = LeakDetector(os.path.dirname(f.name))
            findings = detector.scan_file(Path(f.name))
            
            # Should detect API key, weak password, email, and JWT
            patterns_found = {f.pattern for f in findings}
            
            assert 'google_api_key' in patterns_found
            assert 'default_password' in patterns_found
            assert 'email_address' in patterns_found
            assert 'jwt_token' in patterns_found
            
            os.unlink(f.name)
    
    def test_false_positive_filtering(self):
        """Test that common false positives are filtered out"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.test.js', delete=False) as f:
            f.write('''
                // This is a test file with examples
                const exampleEmail = "test@example.com";
                const demoPhone = "555-123-4567";
                const placeholderKey = "your-api-key-here";
                const jwtExample = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
            ''')
            
            detector = LeakDetector(os.path.dirname(f.name))
            findings = detector.scan_file(Path(f.name))
            
            # Should filter out most findings from test files
            assert len(findings) <= 1, f"Too many findings in test file: {findings}"
            
            os.unlink(f.name)

class TestPreCommitSimulation:
    def test_pre_commit_hook_simulation(self):
        """Simulate a pre-commit hook that blocks secrets"""
        # Create a temporary file with a secret
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
            f.write('const secret = "AIza1234567890abcdefghijklmnopqrstuvwxyz";')
            
        # Run the leak detector
        detector = LeakDetector(os.path.dirname(f.name))
        findings = detector.scan_file(Path(f.name))
        
        # Should detect the secret and fail
        critical_findings = [f for f in findings if f.severity == Severity.CRITICAL]
        assert len(critical_findings) > 0, "Should detect critical security issue"
        
        # Simulate pre-commit hook failure
        if critical_findings:
            print(f"❌ PRE-COMMIT HOOK FAILED: {len(critical_findings)} critical issues found")
            for finding in critical_findings:
                print(f"   - {finding.pattern} in {finding.file_path}:{finding.line_number}")
        
        os.unlink(f.name)

if __name__ == '__main__':
    # Run the security scan
    detector = LeakDetector('.')
    findings = detector.scan_directory()
    report = detector.generate_report()
    
    print("Security Leak Detection Results:")
    print(f"Security Score: {report['summary']['security_score']}/100")
    print(f"Critical Issues: {report['summary']['critical']}")
    print(f"High Issues: {report['summary']['high']}")
    
    if report['summary']['security_score'] < 80:
        print("❌ SECURITY AUDIT FAILED")
        exit(1)
    else:
        print("✅ SECURITY AUDIT PASSED")
        exit(0)
