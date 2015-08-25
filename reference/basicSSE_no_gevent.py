import Queue
import time

from flask import Flask, request, Response, render_template

app = Flask(__name__)

q = Queue.Queue()

def event_stream():
    while True:
        result = q.get()
        yield 'data: %s\n\n' % str(result)

@app.route('/source')
def sse_source():
    return Response(
            event_stream(),
            mimetype='text/event-stream')

@app.route('/post/')
def sleep():
    for i in range(10):
        q.put(i)
        time.sleep(1)
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
         var evtSrc = new EventSource("/source");

         evtSrc.onmessage = function(e) {
             console.log('data received: ' + e.data);
             eventOutputContainer.innerHTML = e.data;
         };

         </script>
       </body>
     </html>
    """
    return(debug_template)

if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5000,debug=True,threaded=True)