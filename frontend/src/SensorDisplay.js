import React from 'react';
import { Thermometer, Droplet, LeafIcon, CloudRainWind } from 'lucide-react';
import './SensorDisplay.css';

function SensorDisplay({ sensorName, sensorData }) {
  const icons = {
    temperature: <Thermometer size={30} />,
    humidity: <Droplet size={30} />,
    soilMoisture: <LeafIcon size={30} />,
    rainIntensity: <CloudRainWind size={30} />
  };

  const sensorLabels = {
    temperature: "Temperature",
    humidity: "Humidity",
    soilMoisture: "Soil Moisture",
    rainIntensity: "Rain Intensity"
  };

  return (
    <div className="sensor-display">
      <div className="sensor-header">
        {icons[sensorName]}
        <h4>{sensorLabels[sensorName]}</h4>
      </div>
      <p>Value: {sensorData[sensorName]}</p>
    </div>
  );
}

export default SensorDisplay;
