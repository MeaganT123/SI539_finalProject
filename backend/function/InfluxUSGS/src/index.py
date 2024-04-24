import requests, json, pytz
from datetime import datetime, timedelta
# import influxdb_client

from influxdb_client import InfluxDBClient, WriteOptions

# python 3.8 used

"""
@brief Function to query sites from list specified in code, 
    check timestamp of last data point for each in InfluxDB, 
    query USGS data from now until the last data point, and then
    write that data to InfluxDB for all the sites

@return Status code 200 and text "Success"
"""
def handler(event, context):
    print('received event:')
    print(event)

    #The InfluxDB token to use for the authorization (str)
    token = ""
    #The ΙnfluxDB destination organization for writes and queries (str)
    org = ""

    #The url to connec tto InfluXDB
    url= ""

    #The named location where the the time series data is stored in InfluxDB
    bucket= ""

    #Get and parse USGS data for sites
    height_results = get_and_parse_usgs_data(token, org, url, bucket, variable = "00060")
    discharge_results = get_and_parse_usgs_data(token, org, url, bucket, variable = "00065")
    stream_elev_results = get_and_parse_usgs_data(token, org, url, bucket, variable = "63160")

    #Combine height and discharge results into one list
    usgs_data = height_results + discharge_results + stream_elev_results
    
    #Write all USGS data to influx
    write_data_influx(token, org, url, bucket, usgs_data = usgs_data)
  
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps('Done updating USGS sites!')
    }



#################################
###    ADDITIONAL FUNCTIONS   ###
#################################
  
"""
@brief Function to determine which USGS variable was input into a function

@params 
    variable = USGS variable to query (str) (discharge == "00060", gage height == "00065", stream water level elevation, NAV88 == "63160")

@return variable_name (str)

"""
def determine_influx_variable(variable: str):
    #Determine which variable was input
    if variable == "00060":
        variable_name = "discharge"

    if variable == "00065":
        variable_name = "gage_height"

    if variable == "63160":
        variable_name = "stream_elevation"

    return variable_name


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
def query_influx_last_point(token: str, org: str, url: str, bucket: str, variable: str):
    # Get USGS site_ids
    # site_ids = get_site_ids()
    site_ids = ['04174040', '04174518', '04173500', '04174490', '04174500', '04172000']

    #Determine influx variable input into function
    variable_name = determine_influx_variable(variable)

    #Establish InfluxDB client connection
    client = InfluxDBClient(url = url, token = token, org = org)

    #Create list to store timestamps 
    last_timestamps = []
    last_data = []

    #Loop through all sites
    for site in site_ids:

        #Format query
        query = 'from(bucket: "%s")'\
            '|> range(start: 0, stop: now())'\
            '|> filter(fn: (r) => r["_measurement"] == "%s")'\
            '|> filter(fn: (r) => r["_field"] == "value")'\
            '|> filter(fn: (r) => r["site_id"] == "%s")'\
            '|> keep(columns: ["_time"])'\
            '|> sort(columns: ["_time"], desc: false)'\
            '|> last(column: "_time")'%(bucket, variable_name, site)

        #Query influx
        result = client.query_api().query(query = query)

        #If the result is empty (no data points exist for a site)
        if not result:
            #Set the last time step to 1 week ago
            last_timestamps.append(((datetime.now(tz= pytz.utc).replace(microsecond=0))-timedelta(days=7)))
        
        #Otherwise save the site id and last timestamp into a list called last_timestamps 
        else:
            for table in result:
                for record in table.records:
                    last_timestamps.append(record["_time"])

    #Combine site ids and timestamps
    for s, t in zip(site_ids, last_timestamps):
        row = [s, t]
        last_data.append(row)

    # print("last data: ", last_data)

    #Return list of site id's and last timestamps
    return last_data

"""
@brief Function to query discharge and gage height data from USGS

@params
    token = the token to use for the authorization (str)
    org = default destination organization for writes and queries (str)
    url = the url to connect to InfluxDB (str)
    bucket = named location where time series data is stored (str)
    variable = USGS variable to query (str) (discharge == "00060", gage height == "00065", stream water level elevation, NAV88 == "63160")

@return json dictionary with discharge and gage height measurements

"""
def get_and_parse_usgs_data(token: str, org: str, url: str, bucket: str, variable: str):

    #Determine influx variable name
    variable_name = determine_influx_variable(variable)

    #Query influx for timestamp of last datapoint for each site
    last_data = query_influx_last_point(token, org, url, bucket, variable)

    #Determine number of sites to query and set incrementer to 0
    number_sites = len(last_data)
    i = 0

    #Create list for all site data
    usgs_data = []

    #For each site, prepare usgs query
    while i < number_sites:
        #Save site id for USGS query
        site_id = last_data[i][0]
        
        #Save start time for USGS query
        start_time = (last_data[i][1]).strftime("%Y-%m-%dT%H:%M%z")
        
        #Save end time for USGS query
        end_time = datetime.now(tz= pytz.utc).strftime("%Y-%m-%dT%H:%M%z")
  
        #USGS REST API url
        url = "https://waterservices.usgs.gov/nwis/iv/"
    
        #Parameters for querying USGS discharges through REST API      
        params = {"format": "json", "sites": site_id, "startDT": start_time, "endDT": end_time,"parameterCd": variable, "siteType": "ST", "siteStatus": "active"}

        #Query USGS data
        request = requests.get(url, params= params)
    
        #Save requested data as json
        data = request.json()

        #Create list to save the data from each site
        site_data = []

        #Try the following code for each site
        try: 
            #Count the length of measurements in the given timeframe
            number_values = len(data['value']['timeSeries'][0]['values'][0]['value'])
                
            #Variable for time conversions
            p = "%Y-%m-%dT%H:%M:%S.%f%z"

            #Set incrementer for looping through all the measurements
            x = 0

            #Loop through site_data list
            while x < number_values:

                #Save site ID
                gage_id = data["value"]["timeSeries"][0]['sourceInfo']['siteCode'][0]['value']
                
                #Save measurement value
                value = data["value"]["timeSeries"][0]['values'][0]['value'][x]['value']
                
                #Save measurement's timestamp
                timestamp = str(int((datetime.strptime(data["value"]["timeSeries"][0]['values'][0]['value'][x]["dateTime"],p)).timestamp())) + "000000000"
                
                #Append data in format needed to send to influx
                site_data.append("%s,site_id=%s value=%s %s"%(variable_name, gage_id, value, timestamp))
                
                #Increment measurement counter by one
                x += 1

        #If site doesn't have data, skip it and continue
        except IndexError:
            pass

        #Increase site incremeter counter by one
        i+=1

        #Add list from each site into comprehensive usgs_data list
        usgs_data.extend(site_data)
    # print('usgs_data: ', usgs_data)
    #Return list containing each data point for each site
    return usgs_data
    

"""Function to write data to InfluxDB
        Input argument must be a list"""
"""
@brief Function to write data to InfluxDB

@params
    token = the token to use for the authorization (str)
    org = default destination organization for writes and queries (str)
    url = the url to connect to InfluxDB (str)
    bucket = named location where time series data is stored (str)
    usgs_data = list with measurements formatted to write to InfluxDB (list)

"""
def write_data_influx(token: str, org: str, url: str, bucket: str, usgs_data: list):

    #Establish InfluxDB client connection
    with InfluxDBClient(url = url, token = token, org = org) as _client:
    
    #Initialize writing to InfluxDB
        with _client.write_api(WriteOptions(batch_size = 200)) as _write_client:

            #Write discharge data to InfluxDB
            _write_client.write(bucket=bucket, org=org, record=usgs_data)
    # print("done writing!")
    #Close the client
    _client.close()

