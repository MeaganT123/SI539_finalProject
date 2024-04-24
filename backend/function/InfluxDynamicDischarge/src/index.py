
import requests, json
from datetime import datetime, timedelta, timezone
import pandas as pd
import numpy as np
import io
from influxdb_client_3 import InfluxDBClient3, Point

def handler(event, context):
    print('received event:')
    print(event)

    #The ΙnfluxDB destination organization for writes and queries (str)
    org = ""

    #The url to connec tto InfluXDB
    host= ""

    #The named location where the the time series data is stored in InfluxDB
    bucket= "discharge_huron"

    DWL_API_Token = "{access token}"

    Huron_API_Token = '{access token}'    

    # pull last 14 hours of data (30 min buffer if lambda doesn't run)
    dt = 14
    #how big of a time window to look for max/min
    d_wind = 12

    current_datetime = datetime.now(timezone.utc)
    # Format date as "YYYY-MM-DD"
    end_d_str = current_datetime.strftime("%Y-%m-%d")
    # Format time as "H:%M:%S.%f"
    end_t_str = current_datetime.strftime("%H:%M:%S.%f")

    # sites we have discharge coeffs:
    # Q_sites = ['ARB012', 'ARB013','ARB017','ARB025','ARB027','ARB028','ARB032', 'ARB034','ARB061','ARB062', 'ARB063']

    # Read the csv file into a dataframe
    input_file_path = 'src/Sensor_Meta.csv'
    sensor_dictionary = pd.read_csv(input_file_path)

    # modified to do all huron sites
    for id in sensor_dictionary['Site_ID']:
    
        site_meta = sensor_dictionary.loc[sensor_dictionary['Site_ID'] == id]
        # Find the offset for the specific Site_ID from the CSV data
        site_depth_offset = int(site_meta['depth_offset_mm'].iloc[0])
        site_NAVD88_offset = site_meta['elev_offset_m'].iloc[0]

        raw_data = get_timeseries(end_d_str, end_t_str, dt, id, DWL_API_Token)

        # Check if the DataFrame is empty, if empty, skip this iteration
        if raw_data.empty:
            print(f"Site: {id} no data")
            continue

        # filter data
        site_data = med_filter(raw_data)

        # calculate discharge
        discharge_coeffs = site_meta.loc[:,'A':'I'].iloc[0].values.astype(float)

        site_data = get_discharge(site_data,site_depth_offset,site_NAVD88_offset,discharge_coeffs)

        #calculate thresholds and match timestamps
        influxDF = update_timeseries(site_data, id, d_wind)

        # write dataframe to influx
        write_data_influx(Huron_API_Token, org, host, bucket, influxDF)
        # print(f"Updated Site: {id}")

    
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps('Discharge sites updated!')
    }

#################################
###    ADDITIONAL FUNCTIONS   ###
#################################

'''
@brief Function to pull timeseries with DWL API for specified site and given time frame

@inputs:
end_d_str: ending date in string format "%Y-%m-%d"
end_t_str: ending time içn string format "%H:%M:%S.%f"
dt: timestep in hours to determine starting date time
id: site id to pull data

@return:
df: dataframe containing timeseries of "Raw_dist_mm" and its corresponding "Time_UTC"
'''
def get_timeseries(end_d_str, end_t_str, dt, id, token):
    
    #format end datetime to be in datetime type
    end_time_iso = end_d_str + "T" + end_t_str
    end_time = datetime.fromisoformat((end_time_iso))

    # Calculate start time: dt hours before end_time
    duration = timedelta(hours=dt)
    start_time = (end_time - duration)

    # Convert times for URL
    start_time_iso = start_time.isoformat(timespec='microseconds')
    # start_time_formatted = start_time_iso.strftime("%Y-%m-%dT%H:%M:%S.%f")
    start_turl = start_time_iso.replace(':', '%3A')[:-3] + 'Z'
    end_turl = end_time_iso.replace(':', '%3A')[:-3] + 'Z'

    #query timeseries for site
    query_url = f"link"
    res = requests.get(query_url, headers= {'Authorization': f'Bearer {token}'})

    # Assuming the response text is in JSON format, use pandas to convert it to a DataFrame
    json_io = io.StringIO(res.text)
    data = pd.read_json(json_io, orient='records')
    # Rename columns to make sense to the user
    df = data.rename(columns={0 : "Time_UTC", 1 : 'Raw_Dist_mm'})

    return(df)

'''
@ brief remove outlines with median filter

@input:
df: dataframe containing "Raw_dist_mm" readings

@return:
filtered_df: dataframe with outlier measurements removed
'''
def med_filter(df):
    ''' remove outliers with rolling window'''

    # Define window size for the rolling median
    window_size = 8  # Adjust as needed

    # Define threshold multiplier for outlier detection
    threshold = 200 # Adjust as needed --> is mm as raw dist is mm

    Vals = df['Raw_Dist_mm']

    rolling_median = Vals.rolling(window=window_size, min_periods=1).median()

    # Filter outliers based on the rolling median and threshold
    filtered_df = df[~((Vals > rolling_median + threshold) | ((Vals) < (rolling_median - threshold)))]

    return filtered_df


'''
@brief Calculate discharge from rating curves

@input:
df: dataframe containing "Raw_Dist_mm"
offset: given offset of sensor node to ground for correcting raw distance to depth
discharge_coeffs: coefficients to determine form of discharge curve

@return:
df: updated dataframe with "Depth_ft" "NAVD88_ft" and "Discharge_cfs"
'''
def get_discharge(df, d_off, e_off, discharge_coeffs):
    df = df.copy() # copy dataframe to avoid any silly pandas warnings
    
    mm_to_ft = 0.00328084
    A, B, C, D, E, F, G, H, I = discharge_coeffs
    x = ((d_off-df['Raw_Dist_mm'])*mm_to_ft)
    df['Depth_ft'] = np.round(x,2)
    y = ((e_off*1000-df['Raw_Dist_mm'])*mm_to_ft)
    df['NAVD88_ft'] = np.round(y,2)
    # discharge curve has the form A(x-B)**3 + C(x-B)**2 + D(x-B) + E + F(x-B)**G + He**(I(x-b)
    df['Discharge_cfs'] = np.round(A*(x-B)**3 + C*(x-B)**2 + D*(x-B) + E + F*(x-B)**G + H*np.exp(I*(x-B)),2)

    return df

''' 
@brief Dynamic Threshold calculation -> calculates the upper and lower thresholds based on 250% change over the past 12 hours and matches time series of other data to it

@inputs:
site_timeseries: timeseries of all data
site_id: id of current site

@return:
influxDF dataframe of all variables to push to influx
'''
def update_timeseries(site_timeseries, site_id, d_wind):
    #make sure datetime format
    dTime = pd.to_datetime(site_timeseries['Time_UTC'])
    Q = site_timeseries['Discharge_cfs']
    # Find the initial time in dTime
    initial_time = dTime.iloc[0]

    # Calculate percent change at each 12-hour interval starting from the first timestep
    max_dis_values = []
    min_dis_values = []
    timestamps = []

    for i, q_value in enumerate(Q):
        time = dTime.iloc[i]
        # print(time.dtype, initial_time.dtype)
        if time - initial_time > timedelta(hours=d_wind):
            # Calculate the 12-hour window using the time series `dTime`
            window_mask = (dTime >= time - timedelta(hours=d_wind)) & (dTime <= time)
            window_Q = Q[window_mask]

            if len(window_Q) < 2:  # Skip if less than 2 points in the window
                continue

            window_min = window_Q.min()
            window_max = window_Q.max()
            last_datetime = time.strftime('%Y-%m-%dT%H:%M:%S+00:00')

            max_dis_values.append(window_min * 2.5)
            min_dis_values.append(window_min * 2/5)
            timestamps.append(last_datetime)

    # Convert timestamps to datetime objects
    timestamps_dt = pd.to_datetime(timestamps)
    unix_time = timestamps_dt.astype(int)
    # Select discharge values for matching time steps
    matching_discharge = site_timeseries[site_timeseries['Time_UTC'].isin(timestamps)]['Discharge_cfs']
    # Select depth values for matching time steps
    matching_depth = site_timeseries[site_timeseries['Time_UTC'].isin(timestamps)]['Depth_ft']
    # Select elevation values for matching time steps
    matching_elevation = site_timeseries[site_timeseries['Time_UTC'].isin(timestamps)]['NAVD88_ft']

    # make it a dataframe for influx
    influxDF = pd.DataFrame({'unix_time' : unix_time, 'max_Q_thresh' : max_dis_values, 'min_Q_thresh' : min_dis_values, "discharge_cfs" : matching_discharge, "depth_ft" : matching_depth, "NAVD88_ft" : matching_elevation})
    # sinse not time series added separaetly so same thing in all rows
    influxDF['site_id'] = site_id

    return influxDF

''' 
@brief pushes data to influxDB client
'''
def write_data_influx(token, org, host, bucket, influxDF):
    client = InfluxDBClient3(host=host, token=token, org=org)

    # push one time stamp at a time to influx
    for i, row in influxDF.iterrows():
        point = (
            Point("flows")
            .tag("site_id", row["site_id"])
            .field("depth_ft", row["depth_ft"])
            .field("NAVD88_ft", row["NAVD88_ft"])
            .field("discharge_cfs", row["discharge_cfs"])
            .field("max_Q_thresh", row["max_Q_thresh"])
            .field("min_Q_thresh", row["min_Q_thresh"])
            .time(row["unix_time"])
        )
        client.write(database=bucket, record=point)
    
    return