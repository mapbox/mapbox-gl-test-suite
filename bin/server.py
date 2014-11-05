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

port = int(sys.argv[1] if 1 in sys.argv else 2900)

Handler = SimpleHTTPServer.SimpleHTTPRequestHandler
class WebServer(SocketServer.TCPServer):
    allow_reuse_address = True

server = WebServer(('127.0.0.1', port), Handler)

def signal_handler(signal, frame):
    threading.Thread(target = server.shutdown).start()

signal.signal(signal.SIGHUP, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

print 'Starting HTTP server on port %d' % port
server.serve_forever()
print 'Stopped HTTP server on port %d' % port
