from flask import Flask
from flask import render_template
from flask import request
import json
import time
import random
from string import Template

import pyorient

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route('/listings/')
#@app.route('/listings/<lat>')
def getListings():

	lat1 = str(request.args.get('lat1'))
	lng1 = str(request.args.get('lng1'))
	lat2 = str(request.args.get('lat2'))
	lng2 = str(request.args.get('lng2'))

	print 'received lat: ' + lat1 + ', ' + lat2
	print 'received lon: ' + lng1 + ', ' + lng2
	
	#ORIENTDB IMPLEMENTATION
	client = pyorient.OrientDB("localhost", 2424)
	session_id = client.connect("root", "password")

	db_name = "property_test"

	if client.db_exists( db_name, pyorient.STORAGE_TYPE_MEMORY ):
		client.db_open( db_name, "admin", "admin" )
	else:
		print "database does not exist!"
		sys.exit()

	recordsDict = {"type":"FeatureCollection","features":[]}

	
	s = Template('SELECT FROM Listing WHERE latitude BETWEEN $lat1 AND $lat2 AND longitude BETWEEN $lng1 AND $lng2')
	records = client.command(s.safe_substitute(lat1 = lat1, lng1 = lng1, lat2 = lat2, lng2 = lng2))

	random.shuffle(records)
	records = records[:1000]

	for record in records:
		recordDict = {"type":"Feature","properties":{},"geometry":{"type":"Point"}}
		recordDict["id"] = record._rid
		recordDict["properties"]["name"] = record.title
		recordDict["properties"]["price"] = record.price
		recordDict["geometry"]["coordinates"] = [record.longitude, record.latitude]

		recordsDict["features"].append(recordDict)

	client.db_close()


	#DUMMY DATA IMPLEMENTATION
	# with open("static/data.txt", 'r') as f:
	# 	recordsDict = json.loads(f.read())

	print "acquired!"

	#pass GeoJSON data back to D3
	return json.dumps(recordsDict)



if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5000,debug=True)