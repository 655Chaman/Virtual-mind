import http.server
import json

class MockHandler(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        if self.path == '/api/elesium/metrics':
            data = {
                "emails_sent_today": 42,
                "emails_sent_total": 1337,
                "mrr_usd": 500,
                "mrr_target": 1000
            }
        elif self.path == '/api/elesium/accountability':
            data = {
                "days_since_first_email": 12
            }
        elif self.path == '/api/status':
            data = {
                "status": "Phase 0 active",
                "phase_day": 31,
                "is_locked": False
            }
        else:
            data = {"status": "ok"}
            
        self.wfile.write(json.dumps(data).encode())

    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"status": "success"}).encode())

if __name__ == '__main__':
    server = http.server.HTTPServer(('0.0.0.0', 8000), MockHandler)
    print("Mock API running on port 8000...")
    server.serve_forever()
