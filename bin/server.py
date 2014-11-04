#!/usr/bin/env python

import sys
import signal
import os
from os import path
import SimpleHTTPServer
import SocketServer
import threading

# Change to the correct path in case the server was launched differently.
os.chdir(path.realpath(path.join(path.dirname(__file__), '..')))


Handler = SimpleHTTPServer.SimpleHTTPRequestHandler
class WebServer(SocketServer.TCPServer):
    allow_reuse_address = True

server = WebServer(('localhost', 2900), Handler)

def signal_handler(signal, frame):
    threading.Thread(target = server.shutdown).start()

signal.signal(signal.SIGHUP, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

print 'Starting HTTP server on port 2900'
server.serve_forever()
print 'Stopped HTTP server on port 2900'
