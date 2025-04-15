import React, { useState } from 'react';
import MainLayout from '@/layouts/main-layout';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker
} from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Constants
const INDIA_TOPO_JSON = "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/india/india-states.json";

// Sample fraud data by state (this would normally come from your API)
const fraudData = [
  { state: 'Maharashtra', reports: 120, type: 'Fake Products' },
  { state: 'Karnataka', reports: 85, type: 'Phishing' },
  { state: 'Delhi', reports: 150, type: 'Fraud' },
  { state: 'Uttar Pradesh', reports: 110, type: 'Impersonation' },
  { state: 'Tamil Nadu', reports: 95, type: 'Fake Products' },
  { state: 'Gujarat', reports: 75, type: 'Phishing' },
  { state: 'West Bengal', reports: 68, type: 'Impersonation' },
  { state: 'Telangana', reports: 55, type: 'Fraud' },
  { state: 'Rajasthan', reports: 48, type: 'Phishing' },
  { state: 'Bihar', reports: 38, type: 'Impersonation' },
  { state: 'Madhya Pradesh', reports: 42, type: 'Fake Products' },
  { state: 'Kerala', reports: 35, type: 'Fraud' },
  { state: 'Punjab', reports: 30, type: 'Phishing' },
  { state: 'Haryana', reports: 32, type: 'Impersonation' },
  { state: 'Andhra Pradesh', reports: 45, type: 'Fake Products' },
];

// Scam hotspot markers (major cities with high fraud reports)
const scamHotspots = [
  { name: "Mumbai", coordinates: [72.8777, 19.0760], reports: 89 },
  { name: "Delhi", coordinates: [77.1025, 28.7041], reports: 132 },
  { name: "Bengaluru", coordinates: [77.5946, 12.9716], reports: 65 },
  { name: "Chennai", coordinates: [80.2707, 13.0827], reports: 58 },
  { name: "Hyderabad", coordinates: [78.4867, 17.3850], reports: 46 },
  { name: "Kolkata", coordinates: [88.3639, 22.5726], reports: 53 },
];

// Type filter options
const scamTypes = ['All Types', 'Fake Products', 'Phishing', 'Impersonation', 'Fraud'];

// Time period filter options
const timePeriods = ['Last Week', 'Last Month', 'Last 3 Months', 'Last Year', 'All Time'];

export default function FraudHeatmap() {
  // State
  const [position, setPosition] = useState({ coordinates: [78.9629, 20.5937], zoom: 4 });
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedPeriod, setSelectedPeriod] = useState('All Time');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [showHotspots, setShowHotspots] = useState(true);
  
  // Color scale for heatmap
  const colorScale = scaleLinear<string>()
    .domain([0, 50, 100, 150])
    .range(['#C5E8FF', '#89CFF0', '#5D9BF0', '#3573D9']);
  
  // Handle map zoom
  const handleZoomIn = () => {
    if (position.zoom >= 8) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  const handleMoveEnd = (position: any) => {
    setPosition(position);
  };
  
  // Filter data based on selected type
  const filteredData = selectedType === 'All Types'
    ? fraudData
    : fraudData.filter(item => item.type === selectedType);
  
  // Get data for a selected region
  const selectedRegionData = selectedRegion 
    ? fraudData.find(item => item.state === selectedRegion)
    : null;

  return (
    <MainLayout>
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Fraud Heatmap</h1>
        <p className="text-gray-600 mb-6">
          Visualize scam-prone regions across India and identify high-risk areas
        </p>
        
        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Scam Type</label>
              <Select
                value={selectedType}
                onValueChange={setSelectedType}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {scamTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Time Period</label>
              <Select
                value={selectedPeriod}
                onValueChange={setSelectedPeriod}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {timePeriods.map(period => (
                    <SelectItem key={period} value={period}>{period}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="sm" 
              className="mr-2"
              onClick={() => setShowHotspots(!showHotspots)}
            >
              {showHotspots ? 'Hide Hotspots' : 'Show Hotspots'}
            </Button>
            <div className="ml-auto flex">
              <Button onClick={handleZoomIn} size="sm" variant="outline" className="mr-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="11" y1="8" x2="11" y2="14"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              </Button>
              <Button onClick={handleZoomOut} size="sm" variant="outline">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Map and stats tabs */}
        <Tabs defaultValue="map" className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="map">Map View</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="map" className="pt-4">
            <div style={{ height: '400px', border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                  scale: 1200,
                  center: [78.9629, 22.5937]
                }}
                style={{ width: '100%', height: '100%' }}
              >
                <ZoomableGroup
                  zoom={position.zoom}
                  center={position.coordinates as [number, number]}
                  onMoveEnd={handleMoveEnd}
                >
                  <Geographies geography={INDIA_TOPO_JSON}>
                    {({ geographies }) =>
                      geographies.map(geo => {
                        const stateName = geo.properties.name;
                        const stateData = filteredData.find(d => d.state === stateName);
                        const reports = stateData ? stateData.reports : 0;
                        
                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            onClick={() => setSelectedRegion(stateName)}
                            style={{
                              default: {
                                fill: reports ? colorScale(reports) : '#EEE',
                                stroke: '#FFF',
                                strokeWidth: 0.5,
                                outline: 'none',
                              },
                              hover: {
                                fill: '#5164BF',
                                stroke: '#FFF',
                                strokeWidth: 0.75,
                                outline: 'none',
                              },
                              pressed: {
                                fill: '#3A4C97',
                                stroke: '#FFF',
                                strokeWidth: 0.75,
                                outline: 'none',
                              },
                            }}
                          />
                        );
                      })
                    }
                  </Geographies>
                  
                  {showHotspots && scamHotspots.map(({ name, coordinates, reports }) => (
                    <Marker key={name} coordinates={coordinates as [number, number]}>
                      <circle r={reports / 10} fill="#FF5533" fillOpacity={0.8} />
                      <text
                        textAnchor="middle"
                        y={-12}
                        style={{
                          fontFamily: "system-ui",
                          fontSize: "8px",
                          fontWeight: "bold",
                          fill: "#333",
                          pointerEvents: "none"
                        }}
                      >
                        {name}
                      </text>
                    </Marker>
                  ))}
                </ZoomableGroup>
              </ComposableMap>
            </div>
            
            <div className="mt-4 flex justify-between text-xs text-gray-500">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-[#C5E8FF] rounded-sm mr-1"></div>
                <span>Low (0-50)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-[#89CFF0] rounded-sm mr-1"></div>
                <span>Medium (51-100)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-[#5D9BF0] rounded-sm mr-1"></div>
                <span>High (101-150)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-[#3573D9] rounded-sm mr-1"></div>
                <span>Very High (150+)</span>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="stats" className="pt-4">
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="font-medium mb-2">Top 5 Scam-Prone Regions</h3>
              <div className="space-y-3">
                {[...filteredData]
                  .sort((a, b) => b.reports - a.reports)
                  .slice(0, 5)
                  .map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs mr-2">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{item.state}</span>
                          <span>{item.reports} reports</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${(item.reports / 150) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="font-medium mb-2">By Scam Type</h3>
                <div className="space-y-2">
                  {['Fake Products', 'Phishing', 'Impersonation', 'Fraud'].map(type => {
                    const count = fraudData
                      .filter(item => item.type === type)
                      .reduce((sum, item) => sum + item.reports, 0);
                    return (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm">{type}</span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
              
              <Card className="p-4">
                <h3 className="font-medium mb-2">Total Reports</h3>
                <div className="text-3xl font-bold mb-2">
                  {filteredData.reduce((sum, item) => sum + item.reports, 0)}
                </div>
                <div className="text-sm text-gray-500">
                  For {selectedPeriod.toLowerCase()} {selectedType !== 'All Types' ? `(${selectedType})` : ''}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Selected region details */}
        {selectedRegion && selectedRegionData && (
          <Card className="p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">{selectedRegion} Statistics</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedRegion(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Total Reports</div>
                <div className="text-xl font-semibold">{selectedRegionData.reports}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Most Common Type</div>
                <div className="text-xl font-semibold">{selectedRegionData.type}</div>
              </div>
              <div className="col-span-2">
                <Button variant="outline" className="w-full text-sm">View Detailed Report</Button>
              </div>
            </div>
          </Card>
        )}
        
        <p className="text-xs text-gray-500 mb-4">
          Data updated hourly. The heatmap is generated based on actual user reports and fraud alerts from our database.
        </p>
      </div>
    </MainLayout>
  );
}