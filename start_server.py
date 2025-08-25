#!/usr/bin/env python3
"""
Simple HTTP server for Dragon vs Tiger game testing
Usage: python start_server.py [port]
"""

import http.server
import socketserver
import sys
import os
import webbrowser
from threading import Timer

def open_browser(port):
    """Open browser after a short delay"""
    url = f"http://localhost:{port}"
    print(f"🌐 Opening browser: {url}")
    webbrowser.open(url)

def main():
    # Set port
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    
    # Change to script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Create server
    handler = http.server.SimpleHTTPRequestHandler
    
    # Enable CORS for local development
    class CORSHTTPRequestHandler(handler):
        def end_headers(self):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            super().end_headers()
    
    with socketserver.TCPServer(("", port), CORSHTTPRequestHandler) as httpd:
        print("🚀 Dragon vs Tiger Game Server")
        print(f"📂 Serving directory: {os.getcwd()}")
        print(f"🌍 Server running at: http://localhost:{port}")
        print()
        print("📋 Available pages:")
        print(f"   🎮 Game: http://localhost:{port}/index.html")
        print(f"   🔧 AI Test: http://localhost:{port}/ai_fix_test.html")
        print(f"   🧪 Debug: http://localhost:{port}/debug_ai.html")
        print()
        print("Press Ctrl+C to stop server")
        
        # Open browser after 1 second
        Timer(1.0, open_browser, [port]).start()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")

if __name__ == "__main__":
    main()