
import json, io
# from datetime import datetime, timedelta
from influxdb_client import InfluxDBClient
import boto3

# python 3.8 used

def handler(event, context):
    print('received event:')
    print(event)
  
    #The InfluxDB token to use for the authorization (str)
    Huron_API_Token = '{access_token}'

    #The ΙnfluxDB destination organization for writes and queries (str)
    org = ""

    #The url to connec tto InfluXDB
    url= ""

    #The named location where the the time series data is stored in InfluxDB
    bucket= ""
    # first row discharge sites, second elevation only sites
    site_ids = ['ARB012', 'ARB013','ARB017','ARB025','ARB027','ARB028','ARB032', 'ARB034','ARB061','ARB062', 'ARB063',\
                 'ARB002', 'ARB003', 'ARB006', 'ARB015', 'ARB018', 'ARB026', 'ARB048', 'ARB059', 'PTK028', 'ARB082', 'ARB083', 'ARB095']

    
    # use Amazon s3 for boto3
    s3_client = boto3.client('s3')
    # Specify the bucket name
    bucket_name = "" 
    #read file
    in_file_name = 'public/Huron/Huron_DigiWa_Sensors.geojson'   
    # Specify the file name
    file_name = 'public/Huron/Huron_Latest_Data.json'

    response = s3_client.get_object(Bucket = bucket_name, Key = file_name)
    content = response['Body']
    jsonObject = json.loads(content.read())
    # print(jsonObject)
    """ result = s3_client.get_object(Bucket=bucket_name, Key=file_name) 
    text = result["Body"].read().decode()
    print(text['Details']) # Use your desired JSON Key for your value  """
    """ content_object = s3_client.Object(bucket_name, file_name)
    file_content = content_object.get()['Body'].read().decode('utf-8')
    json_content = json.loads(file_content)
    print(json_content['Details'])
    print(json_content) """

    latest_data = query_influx_last_point(Huron_API_Token, org, url, bucket, site_ids, jsonObject)


    # Specify the content to write to the file
    content = latest_data
    print(content)

    # Update or create the file in S3 with the specified content
    s3_client.put_object(Bucket=bucket_name, Body=json.dumps(content, default=str),Key=file_name)

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps('Latest readings pulled!')
    }


""" s3_client = boto3.resource('s3')


content_object = s3_client.Object(bucket_name, file_name)
file_content = content_object.get()['Body'].read().decode('utf-8')
json_content = json.loads(file_content)
print(json_content['Details']) """


"""
Additional functions
"""


"""
@brief Function to query InfluxDB to determine the last data point's timestamp for each site

@params
    token = the token to use for the authorization (str)
    org = default destination organization for writes and queries (str)
    url = the url to connect to InfluxDB (str)
    bucket = named location where time series data is stored (str)
    site_ids = array of site ids to pull data from (str)

@return last_timestamps (list) list of Digital Water Lab site IDs and the timestamp, depth, elevation, and discharge of the last datapoint for the variable requested

"""
"""
@brief Function to query InfluxDB to determine the last data point's timestamp for each site

@params
    token = the token to use for the authorization (str)
    org = default destination organization for writes and queries (str)
    url = the url to connect to InfluxDB (str)
    bucket = named location where time series data is stored (str)
    variable = USGS variable to query (str) (discharge == "00060", gage height == "00065", stream water level elevation, NAV88 == "63160")

@return last_timestamps (list) list of USGS gage site IDs and the timestamp of the last datapoint for the variable requested

"""
def query_influx_last_point(token: str, org: str, url: str, bucket: str, site_ids: str, geojson_data):
    #Establish InfluxDB client connection
    client = InfluxDBClient(url = url, token = token, org = org)

    #Create dictionaries to store timestamps 
    keys = ['_time', 'discharge_cfs','depth_ft','NAVD88_ft' ]
    last_data = {}

    #Loop through all sites
    for site in site_ids:
        
        query = 'from(bucket: "%s")'\
            '|> range(start: -4h, stop: now())'\
            '|> filter(fn: (r) => r._measurement == "flows")'\
            '|> filter(fn: (r) => r["site_id"] == "%s")'\
            '|> last()'\
            '|> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")'%(bucket, site)

        #Query influx
        result = client.query_api().query(query = query)
        # reset results dictionary
        results = {key: "N/a" for key in keys}
        # overwrite from default if value
        for table in result:
            for record in table.records:
                for key in keys:
                    if key in record.values:
                        results[key] = record.values[key]

        last_data[site] = results
        # print(results)
    # Merge the latest readings with the GeoJSON features
    for feature in geojson_data['features']:
        site_id = feature['properties']['Site_ID']
        if site_id in last_data:
            feature['properties'].update(last_data[site_id])
    # print("last data: ", last_data)

    #Return dictionary of site id's and last timestamps
    return geojson_data
