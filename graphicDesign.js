/* idk what's going on with this one having source and the others not?? */
export const watershedLayerStyle = {
  id: 'watershedStyle',  // Unique ID for the fill layer
  type: 'fill',  // Specifies a fill layer
  source: 'your-source-id',  // Replace with your data source ID
  paint: {
      'fill-color': '#f8e5c2',  // Fill color
      'fill-opacity': 0.1  // Opacity for the fill
  }
};

export const streamsLayerStyle = {
    id: 'streamsLayer',  // Unique ID for this layer
    type: 'line',  // Line geometry for LineString features
    paint: {
      // Use a 'case' expression to set the line color based on 'status' property
      // 'line-color': [
      //   'case',
      //   ['==', ['get', 'status'], 0], '#00ff00', // Green for status 0
      //   ['==', ['get', 'status'], 1], '#ffff00', // Yellow for status 1
      //   ['==', ['get', 'status'], 2], '#ffa500', // Orange for status 2
      //   '#ff0000'  // Red for status 3 and default color
      // ],
      // 'line-color': '#88e1fe',
      'line-color' : '#75DBFF',
      'line-width': 3,  // Width of the lines
      'line-opacity': 0.6   // Opacity of the lines
    }
  };

export const lakeLayerStyle = {
id: 'lakeStyle',
type: 'fill', // For polygon features, use 'fill'
paint: {
    'fill-color': '#62DCFF', // Fill color of the polygons
    'fill-opacity': 0.5, // Opacity of the fill color
},
};

export const damLayerStyle = {
  id: 'damStyle',
  type: 'symbol', // Suitable for both icons and text
  layout: {
    // Icon configuration
    'icon-image': 'dam-icon-id', // ID of the icon in the map's style or added dynamically
    'icon-size': 0.075, // Adjust the icon size as needed
    'icon-anchor': 'bottom', // Anchors the icon's bottom to the point coordinates
    'icon-allow-overlap': true, // Allows icons to overlap

    // Text configuration
    'text-field': '{Name}', // Use the 'Name' field from the GeoJSON as the text source
    'text-size': 14, // Set the text size
    'text-anchor': 'left', // Anchors the text above the point location
    'text-offset': [0.8, -0.2], // Offset the text 1em right and 1em up
    'text-allow-overlap': false, // Prevent text from overlapping other map elements
    'text-optional': true, // Text does not have to be shown
  },
  paint: {
    // Text paint properties
    'text-color': 'white', // Color of the text
    'text-halo-color': '#141414', // add a halo around the text for better readability
    'text-halo-width': 0.5,
  },
};

export const USGSLayerStyle = {
id: 'USGSStyle',
type: 'symbol', // Use 'symbol' to support both text and icons (circle can be emulated using an SVG icon if needed)
layout: {
// Icon configuration
// Icon settings (if using SVG icons for circles, otherwise skip this part for simple circles)
'icon-image': 'sensor-icon-id', // Assuming 'circle-icon' is an SVG icon that looks like a circle
'icon-size': 0.1, // Adjust size to match the circle size needed
'icon-anchor': 'bottom', // Anchors the icon's bottom to the point coordinates
'icon-allow-overlap': true, // Allows icons to overlap

// Text settings
'text-field': '{Last_Reading}', // Use the 'Last_Reading' field from the GeoJSON as the text source
'text-size': 12,
'text-anchor': 'left',
'text-offset': [0.5, 0], // Offset the text to the right of the circle
'text-allow-overlap': false, // Prevent text from overlapping other map elements
'text-optional': true, // Text does not have to be shown

},
paint: {
// Text paint properties
'text-color': '#fff',
'text-halo-color': '#141414',
'text-halo-width': 0.5,

// Circle paint properties (if not using an SVG icon, these properties will need to be adjusted or managed separately)
// 'icon-color': 'hsl(45, 100%, 50%)' // Assuming Mapbox GL JS v2.x supports 'icon-color', otherwise this needs to be managed differently
},
};

/* export const USGSLayerStyle = {
  id: 'USGSStyle',
  type: 'symbol', // Use 'symbol' to support both text and icons (circle can be emulated using an SVG icon if needed)
  layout: {
    // Text settings
    'text-field': '{Last_Reading}', // Use the 'Last_Reading' field from the GeoJSON as the text source
    'text-size': 12,
    'text-anchor': 'left',
    'text-offset': [0.5, 0], // Offset the text to the right of the circle

    // Icon settings (if using SVG icons for circles, otherwise skip this part for simple circles)
    'icon-image': 'sensor-icon-id', // Assuming 'circle-icon' is an SVG icon that looks like a circle
    'icon-size': 0.5 // Adjust size to match the circle size needed
  },
  paint: {
    // Text paint properties
    'text-color': '#fff',
    'text-halo-color': 'hsl(240, 50%, 70%)',
    'text-halo-width': 0.5,

    // Circle paint properties (if not using an SVG icon, these properties will need to be adjusted or managed separately)
    'icon-color': 'hsl(45, 100%, 50%)' // Assuming Mapbox GL JS v2.x supports 'icon-color', otherwise this needs to be managed differently
  },
}; */
  

/* might need to import current readings file here to then set the conditionals */
export const sensorsLayerStyle = {
  id: 'sensorStyle',
  type: 'symbol', // Use 'symbol' to support both text and icons (circle can be emulated using an SVG icon if needed)
  layout: {
    // Icon configuration
    // Icon settings (if using SVG icons for circles, otherwise skip this part for simple circles)
    'icon-image': 'sensor-icon-id', // Assuming 'circle-icon' is an SVG icon that looks like a circle
    'icon-size': 0.1, // Adjust size to match the circle size needed
    'icon-anchor': 'bottom', // Anchors the icon's bottom to the point coordinates
    'icon-allow-overlap': true, // Allows icons to overlap

    // Text settings
    // 'text-field': '{Site_ID}', // Use the 'Last_Reading' field from the GeoJSON as the text source
    /* 'text-field': [
      'case',
      ['!=', ['get', 'discharge_cfs'], ''],  // Check if 'discharge' is not an empty string
      ['concat', ['get', 'discharge_cfs'], ' cfs'],  // If true, format and display the value
      ''  // If false, display an empty string
    ], */
    'text-field': [
      'case',
      ['!=', ['get', 'discharge_cfs'], ''],  // Check if 'discharge' is not an empty string
      ['concat', 
          ['to-string', ['round', ['to-number', ['get', 'discharge_cfs']]]],  // Round the number
          ' cfs'
      ],  // If true, format and display the value
      ''  // If false, display an empty string
    ],
    'text-size': 12,
    'text-anchor': 'left',
    'text-offset': [0.5, 0], // Offset the text to the right of the circle
    'text-allow-overlap': false, // Prevent text from overlapping other map elements
    'text-optional': true, // Text does not have to be shown
    
  },
  paint: {
    // Text paint properties
    'text-color': '#fff',
    'text-halo-color': '#141414',
    'text-halo-width': 0.5,

    // Circle paint properties (if not using an SVG icon, these properties will need to be adjusted or managed separately)
    // 'icon-color': 'hsl(45, 100%, 50%)' // Assuming Mapbox GL JS v2.x supports 'icon-color', otherwise this needs to be managed differently
  },
};

export const selectedPointLayerStyle = {
  id: 'selectedPointStyle',
  type: 'symbol', // Use 'symbol' to support both text and icons (circle can be emulated using an SVG icon if needed)
  layout: {
    // Icon configuration
    // Icon settings (if using SVG icons for circles, otherwise skip this part for simple circles)
    'icon-image': 'highlight-icon-id', // Assuming 'circle-icon' is an SVG icon that looks like a circle
    'icon-size': 0.25, // Adjust size to match the circle size needed
    'icon-anchor': 'bottom', // Anchors the icon's bottom to the point coordinates
    'icon-allow-overlap': true, // Allows icons to overlap

    // Text settings
    // 'text-field': '{Site_ID}', // Use the 'Last_Reading' field from the GeoJSON as the text source
    /* 'text-field': [
      'case',
      ['!=', ['get', 'discharge_cfs'], ''],  // Check if 'discharge' is not an empty string
      ['concat', ['get', 'discharge_cfs'], ' cfs'],  // If true, format and display the value
      ''  // If false, display an empty string
    ], */
    'text-field': [
      'case',
      ['!=', ['get', 'discharge_cfs'], ''],  // Check if 'discharge' is not an empty string
      ['concat', 
          ['to-string', ['round', ['to-number', ['get', 'discharge_cfs']]]],  // Round the number
          ' cfs'
      ],  // If true, format and display the value
      ''  // If false, display an empty string
    ],
    'text-size': 12,
    'text-anchor': 'left',
    'text-offset': [0.5, 0], // Offset the text to the right of the circle
    'text-allow-overlap': false, // Prevent text from overlapping other map elements
    'text-optional': true, // Text does not have to be shown
    
  },
  paint: {
    // Text paint properties
    'text-color': '#fff',
    'text-halo-color': '#141414',
    'text-halo-width': 0.5,

    // Circle paint properties (if not using an SVG icon, these properties will need to be adjusted or managed separately)
    // 'icon-color': 'hsl(45, 100%, 50%)' // Assuming Mapbox GL JS v2.x supports 'icon-color', otherwise this needs to be managed differently
  },
};
