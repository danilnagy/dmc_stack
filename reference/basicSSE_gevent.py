import gevent
import gevent.monkey
from gevent.pywsgi import WSGIServer
from gevent.queue import Queue
gevent.monkey.patch_all()

import time

from flask import Flask, request, Response, render_template

app = Flask(__name__)

class ServerSentEvent(object):

    def __init__(self, data):
        self.data = data
        self.event = None
        self.id = None
        self.desc_map = {
            self.data : "data",
            self.event : "event",
            self.id : "id"
        }

    def encode(self):
        if not self.data:
            return ""
        lines = ["%s: %s" % (v, k) 
                 for k, v in self.desc_map.iteritems() if k]
        
        return "%s\n\n" % "\n".join(lines)

q = Queue()

def event_stream():
    while True:
        result = q.get()
        ev = ServerSentEvent(str(result))
        yield ev.encode()

@app.route('/my_event_source')
def sse_request():
    return Response(
            event_stream(),
            mimetype='text/event-stream')

@app.route('/post/')
def sleep():
    q.put('test1')
    time.sleep(5)
    q.put('test2')
    return 'OK'

@app.route('/')
def page():
    debug_template = """
     <html>
       <head>
       </head>
       <body>
         <h1>Server sent events</h1>
         <div id="event"></div>
         <script type="text/javascript">

         var eventOutputContainer = document.getElementById("event");
         var evtSrc = new EventSource("/my_event_source");

         evtSrc.onmessage = function(e) {
             console.log(e);
             console.log(e.data);
             eventOutputContainer.innerHTML = e.data;
         };

         </script>
       </body>
     </html>
    """
    return(debug_template)

if __name__ == '__main__':
    app.debug = True
    server = WSGIServer(("", 5000), app)
    server.serve_forever()