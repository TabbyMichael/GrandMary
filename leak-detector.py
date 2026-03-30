#!/usr/bin/env python3
"""
Automated Security Leak Detection Suite
Scans codebase for hardcoded secrets, PII, and insecure configurations
"""

import re
import os
import sys
import json
import argparse
from pathlib import Path
from typing import List, Dict, Tuple, Set
from dataclasses import dataclass
from enum import Enum

class Severity(Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

@dataclass
class SecurityFinding:
    file_path: str
    line_number: int
    severity: Severity
    pattern: str
    matched_text: str
    description: str

class LeakDetector:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.findings: List[SecurityFinding] = []
        self.excluded_dirs = {
            'node_modules', '.git', 'dist', 'build', '.vscode', 
            '.idea', 'coverage', '.nyc_output', 'logs',
            'tests', '__tests__', 'spec', '.pytest_cache'
        }
        self.excluded_files = {
            '.log', '.min.js', '.min.css', '.map', '.lock', 
            'package-lock.json', 'yarn.lock', 'bun.lock',
            'test_security_leaks.py', 'leak-detector.py',
            '.test.js', '.spec.js', '.test.ts', '.spec.ts',
            'seed-gallery.js', 'test-upload.js'
        }
        
        # Security patterns
        self.patterns = {
            # API Keys and Secrets
            'jwt_token': {
                'pattern': r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+',
                'severity': Severity.CRITICAL,
                'description': 'JWT token detected'
            },
            'aws_access_key': {
                'pattern': r'AKIA[0-9A-Z]{16}',
                'severity': Severity.CRITICAL,
                'description': 'AWS Access Key ID detected'
            },
            'aws_secret_key': {
                'pattern': r'[0-9a-zA-Z/+]{40}',
                'severity': Severity.CRITICAL,
                'description': 'AWS Secret Access Key pattern'
            },
            'google_api_key': {
                'pattern': r'AIza[A-Za-z0-9_-]{35}',
                'severity': Severity.CRITICAL,
                'description': 'Google API Key detected'
            },
            'github_token': {
                'pattern': r'(ghp_|gho_|ghu_|ghs_|ghr_)[a-zA-Z0-9]{36}',
                'severity': Severity.CRITICAL,
                'description': 'GitHub token detected'
            },
            'slack_token': {
                'pattern': r'xox[baprs]-[0-9]{12}-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24}',
                'severity': Severity.HIGH,
                'description': 'Slack token detected'
            },
            'stripe_key': {
                'pattern': r'sk_(live|test)_[0-9a-zA-Z]{24}',
                'severity': Severity.CRITICAL,
                'description': 'Stripe API key detected'
            },
            
            # Database and Auth
            'database_url': {
                'pattern': r'(mongodb|mysql|postgresql)://[^\s\'"]+:[^\s\'"]+@[^\s\'"]+',
                'severity': Severity.HIGH,
                'description': 'Database connection URL with credentials'
            },
            'password_in_code': {
                'pattern': r'(?i)(password|passwd|pwd)\s*[:=]\s*[\'"][^\'"]{4,}[\'"]',
                'severity': Severity.HIGH,
                'description': 'Hardcoded password detected'
            },
            'secret_key': {
                'pattern': r'(?i)(secret|key|token)\s*[:=]\s*[\'"][A-Za-z0-9_-]{16,}[\'"]',
                'severity': Severity.HIGH,
                'description': 'Hardcoded secret/key detected'
            },
            
            # PII Patterns
            'email_address': {
                'pattern': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
                'severity': Severity.MEDIUM,
                'description': 'Email address detected'
            },
            'ip_address': {
                'pattern': r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b',
                'severity': Severity.MEDIUM,
                'description': 'IP address detected'
            },
            'phone_number': {
                'pattern': r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
                'severity': Severity.MEDIUM,
                'description': 'Phone number detected'
            },
            'credit_card': {
                'pattern': r'\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b',
                'severity': Severity.CRITICAL,
                'description': 'Credit card number detected'
            },
            'ssn': {
                'pattern': r'\b\d{3}-\d{2}-\d{4}\b',
                'severity': Severity.CRITICAL,
                'description': 'Social Security Number pattern detected'
            },
            
            # Insecure Configurations
            'default_password': {
                'pattern': r'(?i)(password|pwd)\s*[:=]\s*[\'"]?(admin|root|test|demo|password|123456|changeme)[\'"]?',
                'severity': Severity.HIGH,
                'description': 'Default or weak password detected'
            },
            'hardcoded_port': {
                'pattern': r'(?i)(port|listen)\s*[:=]\s*[\'"]?(3000|8080|5000|8000|9000)[\'"]?',
                'severity': Severity.LOW,
                'description': 'Common development port hardcoded'
            },
            'debug_mode': {
                'pattern': r'(?i)(debug|dev_mode|development)\s*[:=]\s*true',
                'severity': Severity.MEDIUM,
                'description': 'Debug mode enabled in configuration'
            }
        }
    
    def scan_file(self, file_path: Path) -> List[SecurityFinding]:
        findings = []
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                lines = content.split('\n')
                
                for line_num, line in enumerate(lines, 1):
                    for pattern_name, pattern_info in self.patterns.items():
                        matches = re.finditer(pattern_info['pattern'], line)
                        for match in matches:
                            # Skip common false positives
                            if self._is_false_positive(match.group(), pattern_name, file_path):
                                continue
                            
                            finding = SecurityFinding(
                                file_path=str(file_path.relative_to(self.project_root)),
                                line_number=line_num,
                                severity=pattern_info['severity'],
                                pattern=pattern_name,
                                matched_text=match.group(),
                                description=pattern_info['description']
                            )
                            findings.append(finding)
                            
        except Exception as e:
            print(f"Error scanning {file_path}: {e}")
            
        return findings
    
    def _is_false_positive(self, matched_text: str, pattern_name: str, file_path: Path) -> bool:
        # Skip test files and documentation
        if any(keyword in file_path.name.lower() for keyword in ['test', 'spec', 'example', 'demo', 'readme', 'setup', 'seed']):
            if pattern_name in ['email_address', 'phone_number', 'ip_address', 'default_password']:
                return True
        
        # Skip our own security files
        if file_path.name in ['leak-detector.py', 'test_security_leaks.py', 'security-audit-findings.md', 'FEAT_SECURITY_AUDIT.md']:
            return True
        
        # Skip common placeholder patterns
        placeholders = [
            'your-', 'example-', 'test-', 'demo-', 'xxx', 'yyy', 'zzz',
            'placeholder', 'change-this', 'replace-with', 'your-',
            'abc123', 'def456', 'test123', 'demo123', 'sarah@', 'michael@', 'grace@'
        ]
        
        matched_lower = matched_text.lower()
        if any(placeholder in matched_lower for placeholder in placeholders):
            return True
        
        # Skip obvious documentation examples
        if pattern_name == 'jwt_token' and '...' in matched_text:
            return True
            
        # Skip localhost IPs
        if pattern_name == 'ip_address' and '127.0.0.1' in matched_text:
            return True
            
        return False
    
    def scan_directory(self) -> List[SecurityFinding]:
        print(f"Scanning directory: {self.project_root}")
        
        for file_path in self.project_root.rglob('*'):
            # Skip directories and their contents
            if file_path.is_dir():
                continue
                
            # Skip if any parent directory is excluded
            if any(excluded_dir in file_path.parts for excluded_dir in self.excluded_dirs):
                continue
            
            # Skip excluded files
            if any(file_path.name.endswith(ext) or file_path.name == excluded_file 
                   for ext in ['.log', '.min.js', '.min.css', '.map', '.lock'] 
                   for excluded_file in ['package-lock.json', 'yarn.lock', 'bun.lock',
                                       'test_security_leaks.py', 'leak-detector.py',
                                       'seed-gallery.js', 'test-upload.js',
                                       'security-scan-results.json', 'security-audit-report.json']):
                continue
            
            # Skip binary files
            if file_path.suffix.lower() in {'.jpg', '.jpeg', '.png', '.gif', '.pdf', '.zip', '.tar', '.gz'}:
                continue
            
            # Scan source files
            if file_path.is_file():
                file_findings = self.scan_file(file_path)
                self.findings.extend(file_findings)
        
        return self.findings
    
    def generate_report(self) -> Dict:
        findings_by_severity = {
            Severity.CRITICAL: [],
            Severity.HIGH: [],
            Severity.MEDIUM: [],
            Severity.LOW: []
        }
        
        for finding in self.findings:
            findings_by_severity[finding.severity].append(finding)
        
        return {
            'summary': {
                'total_findings': len(self.findings),
                'critical': len(findings_by_severity[Severity.CRITICAL]),
                'high': len(findings_by_severity[Severity.HIGH]),
                'medium': len(findings_by_severity[Severity.MEDIUM]),
                'low': len(findings_by_severity[Severity.LOW]),
                'security_score': self._calculate_security_score()
            },
            'findings_by_severity': {
                severity.value: [
                    {
                        'file': f.file_path,
                        'line': f.line_number,
                        'pattern': f.pattern,
                        'matched_text': f.matched_text,
                        'description': f.description
                    }
                    for f in findings
                ]
                for severity, findings in findings_by_severity.items()
            }
        }
    
    def _calculate_security_score(self) -> int:
        if not self.findings:
            return 100
        
        total_score = 100
        deductions = {
            Severity.CRITICAL: 25,
            Severity.HIGH: 15,
            Severity.MEDIUM: 8,
            Severity.LOW: 3
        }
        
        for finding in self.findings:
            total_score -= deductions[finding.severity]
        
        return max(0, total_score)
    
    def print_report(self, report: Dict):
        summary = report['summary']
        
        print("\n" + "="*60)
        print("SECURITY LEAK DETECTION REPORT")
        print("="*60)
        
        print(f"\n📊 SUMMARY:")
        print(f"   Total Findings: {summary['total_findings']}")
        print(f"   Critical: {summary['critical']} 🔴")
        print(f"   High: {summary['high']} 🟠")
        print(f"   Medium: {summary['medium']} 🟡")
        print(f"   Low: {summary['low']} 🟢")
        print(f"   Security Score: {summary['security_score']}/100")
        
        if summary['critical'] > 0 or summary['high'] > 0:
            print(f"\n🚨 IMMEDIATE ACTION REQUIRED!")
        
        print("\n" + "="*60)
        
        for severity in [Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM, Severity.LOW]:
            findings = report['findings_by_severity'][severity.value]
            if findings:
                print(f"\n{severity.value} ISSUES ({len(findings)}):")
                print("-" * 40)
                for finding in findings[:5]:  # Limit to first 5 findings per severity
                    print(f"   📁 {finding['file']}:{finding['line']}")
                    print(f"   🔍 {finding['description']}")
                    print(f"   💬 Matched: {finding['matched_text'][:50]}...")
                    print()
                
                if len(findings) > 5:
                    print(f"   ... and {len(findings) - 5} more {severity.value.lower()} issues")
        
        print("="*60)

def main():
    parser = argparse.ArgumentParser(description='Security Leak Detection Scanner')
    parser.add_argument('directory', nargs='?', default='.', help='Directory to scan (default: current)')
    parser.add_argument('--json', action='store_true', help='Output in JSON format')
    parser.add_argument('--output', help='Output file for report')
    parser.add_argument('--fail-threshold', type=int, default=60, help='Fail if security score below threshold')
    
    args = parser.parse_args()
    
    detector = LeakDetector(args.directory)
    findings = detector.scan_directory()
    report = detector.generate_report()
    
    if args.json:
        output = json.dumps(report, indent=2)
    else:
        detector.print_report(report)
        output = json.dumps(report, indent=2)
    
    if args.output:
        with open(args.output, 'w') as f:
            f.write(output)
        print(f"\n📄 Report saved to: {args.output}")
    
    # Exit with error code if security score is below threshold
    if report['summary']['security_score'] < args.fail_threshold:
        print(f"\n❌ SECURITY SCORE ({report['summary']['security_score']}) BELOW THRESHOLD ({args.fail_threshold})")
        sys.exit(1)
    else:
        print(f"\n✅ SECURITY SCORE ({report['summary']['security_score']}) MEETS REQUIREMENTS")

if __name__ == '__main__':
    main()
