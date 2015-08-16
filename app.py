from flask import Flask
from flask import render_template
import json
import time
import random

import pyorient

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/listings")
def getListings():

	#ORIENTDB IMPLEMENTATION
	client = pyorient.OrientDB("localhost", 2424)
	session_id = client.connect("root", "admin")

	db_name = "soufun"

	if client.db_exists( db_name, pyorient.STORAGE_TYPE_MEMORY ):
		client.db_open( db_name, "admin", "admin" )
	else:
		print "database does not exist!"
		sys.exit()

	recordsDict = {"type":"FeatureCollection","features":[]}

	records = client.command('SELECT FROM Listing WHERE [latitude,longitude,$spatial] NEAR [39.937236, 116.421079, {"maxDistance": 1}] ORDER BY RAND() LIMIT 100')

	random.shuffle(records)
	records = records[:15]

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