# Map Component Integration Guide

## Overview

The Map component is a comprehensive, premium mapping solution built with Leaflet.js and OpenStreetMap that provides free, interactive mapping capabilities for the Blood Donation Management System.

## Features

### ✅ **Core Mapping Features**
- Interactive OpenStreetMap integration with Leaflet.js
- Custom marker system with different types and colors
- Fullscreen mode with responsive design
- Zoom controls and scale display
- Current location detection and display

### ✅ **Search and Geocoding**
- Real-time location search using Nominatim API
- Auto-complete search results with dropdown
- Reverse geocoding for address display
- Location selection via map clicks

### ✅ **Premium UI/UX**
- Framer Motion animations for smooth interactions
- Light/dark theme support
- Responsive design for all screen sizes
- Custom styled markers and popups
- Loading states and error handling

### ✅ **Blood Donation System Integration**
- Color-coded markers for different entity types:
  - 🏥 Hospitals (Red: #dc2626)
  - 🩸 Blood Banks (Blue: #2563eb)
  - 📍 Requests (Orange: #ea580c)
  - 👤 Donors (Green: #16a34a)
- Interactive marker clicks with custom data
- Location-based filtering and search

## Usage Examples

### Basic Map Display
```jsx
import Map from '../components/ui/Map';

<Map
  center={[28.6139, 77.2090]} // Delhi coordinates
  zoom={10}
  height="400px"
  markers={[]}
  showSearch={true}
  showControls={true}
  showCurrentLocation={true}
/>
```

### Blood Bank Directory Map
```jsx
const bloodBankMarkers = facilities.map(facility => ({
  position: facility.coordinates,
  title: facility.name,
  description: `${facility.type === 'hospital' ? '🏥' : '🩸'} ${facility.address}`,
  type: facility.type,
  color: facility.type === 'hospital' ? '#dc2626' : '#2563eb',
  data: facility
}));

<Map
  center={userLocation || [28.6139, 77.2090]}
  zoom={12}
  height="500px"
  markers={bloodBankMarkers}
  onMarkerClick={(marker) => handleFacilityClick(marker.data)}
  showSearch={false}
  showControls={true}
  showCurrentLocation={true}
/>
```

### Location Picker Integration
```jsx
<Map
  center={selectedLocation ? [selectedLocation.latitude, selectedLocation.longitude] : [28.6139, 77.2090]}
  zoom={selectedLocation ? 15 : 10}
  height="300px"
  markers={selectedLocation ? [{
    position: [selectedLocation.latitude, selectedLocation.longitude],
    title: 'Selected Location',
    description: selectedLocation.address,
    type: 'selected',
    color: '#dc2626'
  }] : []}
  onLocationSelect={handleLocationSelect}
  showSearch={false}
  showControls={true}
  showCurrentLocation={false}
/>
```

### Geographic Analytics Heatmap
```jsx
const heatmapMarkers = heatmapData.map((point, index) => ({
  position: point.position,
  title: `Activity Point ${index + 1}`,
  description: `Intensity: ${(point.intensity * 100).toFixed(0)}%`,
  type: 'heatmap',
  color: getHeatmapColor(point.intensity),
  icon: '🔥'
}));

<Map
  center={[28.6139, 77.2090]}
  zoom={11}
  height="400px"
  markers={heatmapMarkers}
  showSearch={false}
  showControls={true}
  showCurrentLocation={false}
/>
```

## Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `center` | `[number, number]` | `[28.6139, 77.2090]` | Map center coordinates [lat, lng] |
| `zoom` | `number` | `10` | Initial zoom level |
| `height` | `string` | `'400px'` | Map container height |
| `markers` | `Array<MarkerData>` | `[]` | Array of marker objects |
| `onLocationSelect` | `function` | `undefined` | Callback for map click location selection |
| `onMarkerClick` | `function` | `undefined` | Callback for marker click events |
| `showSearch` | `boolean` | `true` | Show/hide search bar |
| `showControls` | `boolean` | `true` | Show/hide map controls |
| `showCurrentLocation` | `boolean` | `true` | Enable current location detection |
| `interactive` | `boolean` | `true` | Enable map interactions |
| `className` | `string` | `''` | Additional CSS classes |
| `style` | `object` | `{}` | Inline styles |

## Marker Data Structure

```typescript
interface MarkerData {
  position: [number, number];     // [latitude, longitude]
  title?: string;                 // Marker popup title
  description?: string;           // Marker popup description
  type?: string;                  // Marker type for styling
  icon?: string;                  // Custom icon (emoji or text)
  color?: string;                 // Custom marker color
  data?: any;                     // Additional data for callbacks
}
```

## Integration Points

### 1. LocationPicker Component
- Used in blood request forms for hospital selection
- Provides modal interface with search and map selection
- Handles reverse geocoding for address display

### 2. FacilitySearch Component
- Displays blood banks and hospitals on interactive map
- Integrates with facility directory and search
- Provides "Get Directions" functionality

### 3. GeographicAnalytics Component
- Shows regional performance metrics
- Displays activity heatmaps
- Visualizes donor density and request patterns

### 4. Admin Dashboard
- Real-time request and donor visualization
- Geographic distribution analysis
- Emergency response coordination

## Technical Implementation

### Free Services Used
- **OpenStreetMap**: Free tile layers for map display
- **Nominatim API**: Free geocoding and search
- **Browser Geolocation**: Native location detection
- **Google Maps URLs**: Free navigation redirection

### Performance Optimizations
- Efficient marker management with cleanup
- Debounced search to reduce API calls
- Lazy loading of map tiles
- Memory cleanup on component unmount

### Accessibility Features
- Keyboard navigation support
- Screen reader compatible
- High contrast mode support
- Reduced motion preferences

## Styling and Theming

The Map component includes comprehensive custom styles:

```css
/* Custom marker styles */
.marker-pin {
  width: 25px;
  height: 35px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

/* Current location marker with pulse animation */
.current-location-marker {
  width: 20px;
  height: 20px;
  background: #3b82f6;
  border: 3px solid white;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

/* Custom popup styling */
.leaflet-popup-content-wrapper {
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

## Error Handling

The component includes comprehensive error handling:
- Network errors for search requests
- Invalid marker position validation
- Geolocation permission errors
- Map initialization failures

## Future Enhancements

Potential improvements for future versions:
- Clustering for large marker sets
- Custom map themes
- Offline map support
- Advanced heatmap visualizations
- Route planning integration

## Dependencies

```json
{
  "leaflet": "^1.9.4",
  "framer-motion": "^10.16.4",
  "lucide-react": "^0.263.1"
}
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers with geolocation support

The Map component provides a robust, free, and feature-rich mapping solution that perfectly integrates with the Blood Donation Management System's requirements while maintaining premium UI/UX standards.