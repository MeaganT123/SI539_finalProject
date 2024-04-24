import React, { useState, useEffect, useRef } from 'react';
import Map, { Source, Layer, Popup, NavigationControl } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import { Storage } from 'aws-amplify';
import "mapbox-gl/dist/mapbox-gl.css";
import mapStyle from './styles/MapStyle.json';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LayersIcon from '@mui/icons-material/Layers';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
// import styles 
import * as sty from './graphicDesign';
import './HuronNetwork.css'; 

/* load images to use as symbols in layers  */
const imageLoad = (event) => {
  const mapImages = event.target; // Access the Mapbox GL JS map instance

  // Load icon for dam locations
  mapImages.loadImage('/dam_rectangle.png', function(error, image) {
    if (error) throw error;
    // Ensure the image isn't already added
    if (!mapImages.hasImage('dam-icon-id')) {
      mapImages.addImage('dam-icon-id', image);
    }
  });
  
  // load icon for sensors locations
  mapImages.loadImage('/sensor_circ.png', function(error, image) {
    if (error) throw error;
    // Ensure the image isn't already added
    if (!mapImages.hasImage('sensor-icon-id')) {
      mapImages.addImage('sensor-icon-id', image);
    }
  });

  // load icon for selected sensors locations
  mapImages.loadImage('/star.png', function(error, image) {
    if (error) throw error;
    // Ensure the image isn't already added
    if (!mapImages.hasImage('highlight-icon-id')) {
      mapImages.addImage('highlight-icon-id', image);
    }
  });
};

// // have attibution values at bottom of mapbox be last to tab to.
// const setAttributionTabs = () => {
//   // Check if map controls exist and then adjust their tabIndex
//   document.querySelectorAll('.mapboxgl-ctrl-bottom-left').forEach(element => {
//     element.tabIndex = 3; 
//   });
//   document.querySelectorAll('.mapboxgl-ctrl-bottom-right').forEach(element => {
//     element.tabIndex = 2; 
//   });

// };

// Map.on('load', () => {
//   setAttributionTabs(); // Call the function to adjust tab indexes
// });


// Configures Mapbox GL JS to use a custom Web Worker that complies with CSP standards. This is particularly useful in applications that have strict security policies and need to ensure that their third-party libraries also adhere to these policies. By running map-related computations in a background thread (Web Worker), the main thread remains unblocked, ensuring the UI stays responsive.
// Line tells ESLint to ignore the next line of code for the specific rule import/no-webpack-loader-syntax. It's necessary because you're using webpack-specific syntax in the require statement, which ESLint, configured with eslint-plugin-import, would normally flag as an error. By disabling this rule for the next line, you prevent ESLint from reporting a violation.

// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;



function HuronNetwork({ mode = "GLWA-Ops" }) {
    // for map layers in use, Hook that lets you add React state to function components
    const [mapLayers, setMapLayers] = useState(null);
    const [sliderValue, setSliderValue] = useState(0);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const mapRef = useRef(null);
    const [hoveredFeatureId, setHoveredFeatureId] = useState(null);
  
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [shoppingCart, setShoppingCart] = useState([]);
    // for iframe to grafana
    const [externalLink, setExternalLink] = useState(null);
    const [externalDataDrawerOpen, setExternalDataDrawerOpen] = useState(false);
    const [drawerContent, setDrawerContent] = useState('');
    // for search by site feature
    const [siteName, setSiteName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [geoJsonData, setGeoJsonData] = useState(null);
    const [mapInteracted, setMapInteracted] = useState(false);
    // set inital viewState
    const [viewState, setViewState] = useState({
      longitude: -83.6858,
      latitude: 42.3314,
      zoom: 8.85,
      pitch: 45
    });

    // create array of the different map layers 
    const huronMapLayers = [
      { name: 'Watershed', file_path: 'Huron/Huron_Watershed.geojson', enabled: true, baseLayerStyle: sty.watershedLayerStyle },
      { name: 'Lakes', file_path: 'Huron/Huron_Lakes.geojson', enabled: true, baseLayerStyle: sty.lakeLayerStyle },
      { name: 'Rivers', file_path: 'Huron/Huron_RiverSystem.geojson', enabled: true, baseLayerStyle: sty.streamsLayerStyle },
      { name: 'Sensors', file_path: 'Huron/Huron_Latest_Data.json', enabled: true, baseLayerStyle: sty.sensorsLayerStyle },
      { name: 'USGS', file_path: 'Huron/Huron_USGS_Stations.geojson', enabled: true, baseLayerStyle: sty.USGSLayerStyle },
      { name: 'Dams', file_path: 'Huron/Huron_Dams.geojson', enabled: true, baseLayerStyle: sty.damLayerStyle },
    ];

  // On startup, useEffect runs function that loads GeoJSON files and renders the various map layers
  useEffect(() => {
    // Create function that load GeoJSON files from S3 bucket and displays layers
    const fetchGeoJSONFiles = async () => {

      let newLayers = []; // Temporary object to hold the GeoJSON data
      let fileList = []; // S3 files to read
      if (mode === 'Huron') {
        fileList = huronMapLayers;
      }

      for (const file of fileList) {
        // generate url that allows S3 access, fetch the data from the file and then parse the json
        const signedUrl = await Storage.get(file.file_path);
        const response = await fetch(signedUrl);
        const data = await response.json();

        // lowercase layer name and call that the LayerID
        const uniqueLayerId = file.name.toLowerCase();

        // Determine which basestyle to use
        let baseStyle = file.baseLayerStyle;
        // Updates the unique id to the chosen base style
        baseStyle.id = uniqueLayerId;

        // generate new layer that contains actual data from json and updated styles 
        const layer = {
          name: file.name,
          layerData: data,
          layerStyle: baseStyle,
          layerEnabled: file.enabled
        };

        // save layer into array of layers to display
        newLayers = [...newLayers, layer];
        console.log("Name ", layer.name)

        // store data for search feature
        if (layer.name === "Sensors") {
          setGeoJsonData(data);
        }
      }

      // has layers display
      setMapLayers(newLayers);
    };
    
    // run function
    fetchGeoJSONFiles();
  }, []);

  // Pull up url for iframe using ExternalLink property in geoJSON
  const handleMapClick = (event) => {
    const features = mapRef.current.queryRenderedFeatures(event.point, {
      layers: ['sensors', 'usgs', 'dams'], 
    });
    
    if (features.length) {
      const feature = features[0];
      // Check if the feature has an ExternalLink property
      console.log("Clicked Feature: ", feature)
      if (feature.properties.ExternalData) {
        setExternalLink(feature.properties.ExternalData); // Set the iframe URL
        setDrawerContent(null); 
        setExternalDataDrawerOpen(true); // Open the drawer
      } else {
        setExternalLink('');
        setDrawerContent(<Typography>No Info</Typography>);
        setExternalDataDrawerOpen(true); // Open the drawer
      }
    }
  };

  //replace d-solo with d, so Externallink goes to whole dash, rather than the embeded panel
  const handleViewMore = () => {
    const url = externalLink.replace(/d-solo/g, 'd');
    window.open(url, '_blank');
  };

  // searches sitenames and stores the coordinate of searched for name
  const handleSearch = () => {
    const foundFeature = geoJsonData.features.find(feature =>
        feature.properties.Site_Name.toLowerCase() === searchTerm.toLowerCase()
    );
    if (foundFeature) {
      // setSelectedFeature(foundFeature);
      // setMapInteracted(false);
      setViewState({
          ...viewState,
          latitude: foundFeature.geometry.coordinates[1],
          longitude: foundFeature.geometry.coordinates[0],
          zoom: 15, // Closer zoom level
          transitionDuration: 500 // Smooth transition to new location
      });
    } else {
        alert('Site not found');
    }
  };

  document.querySelector('.skip-link').addEventListener('click', (e) => {
    e.preventDefault();
    const mapContainer = document.getElementById('mapPage');
    if (mapContainer) {
      mapContainer.focus();
    }
  });

  // What to populate div with various interactive UI componentns
  return (
    <div id='mapPage' style={{ position: 'relative' }} tabIndex="0">
     {/* Bottom drawer to show timeseries iframe */}
      <Drawer 
        className='timeseriesDrawer'
        anchor="bottom"
        open={externalDataDrawerOpen}
        onClose={() => setExternalDataDrawerOpen(false)}
        PaperProps={{
          className: 'timeseriesDrawerPaper'
        }}
      >
        {/* Add close button so users can tab out of window */}
        <div className="closeButton"> 
          <Button
            variant="outlined"
            onClick={() => setExternalDataDrawerOpen(false)}
          >
            Close
          </Button>
        </div>
        

        {/* This styles the iframe button link to view more data */}
        {externalLink && (
          // <> is a fragment so it will group it in the same DOM stucture
          <>
            <div className="viewMoreButton"> 
              <Button 
                variant="outlined" 
                onClick={handleViewMore}
              >
                View more data
              </Button>
            </div>
           
            {/* Have iframe take up the whole drawer */}
            <iframe
              src={externalLink}
              width="100%"
              height="100%"
              frameBorder="0%"
            ></iframe>
          </>
        )}
      </Drawer>

      {/* Load map */}
      <Map className="mapElement"
        {...viewState}
        onMove={evt => setViewState(evt.viewState)} // This line updates the view state interactively
        ref={mapRef}
        mapboxAccessToken="{access_token}"
        
        // make images usable for layer icons
        onLoad={imageLoad}
        style={{ width: "100vw", height: "100vh" }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        // other map styles that could be accessible to users later
        // mapStyle="mapbox://styles/mapbox/navigation-night-v1"
        // mapStyle="mapbox://styles/mapbox/streets-v12"
        onClick={handleMapClick}
      >
      
        {/* Add map layers */}
        {mapLayers && mapLayers.map((layer, index) => (
          layer.layerEnabled && (
            <React.Fragment key={index}>
              <Source id={`source-${layer.name}`} type="geojson" data={layer.layerData} />
              <Layer {...layer.layerStyle} source={`source-${layer.name}`} />
            </React.Fragment>
          )
        ))}

        <NavigationControl className="navControl" position="bottom-right" />
       
       {/* Search for site by name. Includes having autocomplete enabled */}
       <Box className="searchBox">
          <Autocomplete
              freeSolo
              options={geoJsonData ? geoJsonData.features.map(feature => feature.properties.Site_Name) : []}
              value={searchTerm}
              onChange={(event, newValue) => {
                  setSearchTerm(newValue);
              }}
              renderInput={(params) => (
                <TextField
                    {...params}
                    label="Search Site Name"
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      className: 'searchBoxInput', // Ensure custom class doesn't overwrite necessary styles
                      // tabIndex: '0', // ensure tab to search box before credits at bottom of map
                    }}
                    // tabIndex={0}
                />
              )}
          />
          <Button onClick={handleSearch} variant="contained" color="primary">
              Search
          </Button>
        </Box>    
      </Map>
      
    </div>
  

  );

};

export default HuronNetwork;