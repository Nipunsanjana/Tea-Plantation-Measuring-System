import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Thermometer,
  Droplet,
  LeafIcon,
  CloudRainWind,
  Usb,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

function CircularGauge({ value, max, color, unit, icon: Icon }) {
  const percentage = Math.min((value / max) * 100, 100);
  const angle = (percentage / 100) * 360;

  return (
    <div className="circular-gauge-wrapper">
      {Icon && (
        <div className="gauge-icon">
          <Icon size={40} color={color} />
        </div>
      )}
      <div className="circular-gauge">
        <svg viewBox="0 0 100 100" className="gauge-svg">
          <path
            d="M50 10 
               A40 40 0 1 1 50 90 
               A40 40 0 1 1 50 10"
            fill="none"
            stroke="#333"
            strokeWidth="10"
          />
          <path
            d={`M50 10 
               A40 40 0 ${angle > 180 ? 1 : 0} 1 
               ${50 + 40 * Math.cos((angle - 90) * Math.PI / 180)} 
               ${50 + 40 * Math.sin((angle - 90) * Math.PI / 180)}`}
            fill="none"
            stroke={color}
            strokeWidth="10"
          />
        </svg>
        <div className="gauge-value" style={{ color }}>
          {value.toFixed(2)}{unit}
        </div>
      </div>
    </div>
  );
}

function PortSelector({ onPortSelect }) {
  const [availablePorts, setAvailablePorts] = useState([]);
  const [selectedPort, setSelectedPort] = useState("");
  const [connectionStatus, setConnectionStatus] = useState(null);

  useEffect(() => {
    const fetchPorts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/available-ports");
        setAvailablePorts(response.data);
      } catch (error) {
        console.error("Error fetching ports:", error);
      }
    };

    fetchPorts();
    const intervalId = setInterval(fetchPorts, 2000);

    return () => clearInterval(intervalId);
  }, []);

  const handlePortConnect = async () => {
    try {
      const response = await axios.post("http://localhost:5000/connect-port", {
        portPath: selectedPort,
      });
      if (response.data.success) {
        setConnectionStatus("Connected");
        onPortSelect(selectedPort);
      } else {
        setConnectionStatus("Connection Failed");
      }
    } catch (error) {
      console.error("Connection error:", error);
      setConnectionStatus("Connection Error");
    }
  };

  return (
    <div className="port-selector">
      <div className="port-selector-header">
        <Usb size={30} />
        <h3>COM Port Selection</h3>
      </div>
      <div className="port-selector-content">
        <select
          value={selectedPort}
          onChange={(e) => setSelectedPort(e.target.value)}
          className="port-selector-dropdown"
        >
          <option value="">Select COM Port</option>
          {availablePorts.map((port, index) => (
            <option key={index} value={port.path}>
              {port.path} {port.manufacturer ? `(${port.manufacturer})` : ""}
            </option>
          ))}
        </select>
        <button
          onClick={handlePortConnect}
          disabled={!selectedPort}
          className={`connect-button ${!selectedPort ? "disabled" : ""}`}
        >
          Connect
        </button>
      </div>
      {connectionStatus && (
        <div className={`connection-status ${connectionStatus.toLowerCase()}`}>
          {connectionStatus === "Connected" ? "Device Connected" : connectionStatus}
        </div>
      )}
    </div>
  );
}

function App() {
  const [connectedPort, setConnectedPort] = useState(null);
  const [sensorData, setSensorData] = useState({
    temperature: 0,
    humidity: 0,
    soilMoisture: 0,
    rainIntensity: 0,
  });
  const [sensorHistory, setSensorHistory] = useState({
    temperature: [],
    humidity: [],
    soilMoisture: [],
    rainIntensity: [],
  });
  const [manualMode, setManualMode] = useState({
    rain: false,
    soil: false,
    temp: false,
    hum: false,
  });

  const sensorConfig = {
    temperature: {
      min: 0,
      max: 50,
      unit: "°C",
      icon: Thermometer,
      color: "#FF5722",
      threshold: 32,
      ledName: 'temp'
    },
    humidity: {
      min: 0,
      max: 100,
      unit: "%",
      icon: Droplet,
      color: "#2196F3",
      threshold: 95,
      ledName: 'hum'
    },
    soilMoisture: {
      min: 0,
      max: 100,
      unit: "%",
      icon: LeafIcon,
      color: "#4CAF50",
      threshold: 10,
      ledName: 'soil'
    },
    rainIntensity: {
      min: 0,
      max: 1000,
      unit: "",
      icon: CloudRainWind,
      color: "#00BFFF",
      threshold: 400,
      ledName: 'rain'
    },
  };

  const sendLedCommand = async (command) => {
    try {
      await axios.post("http://localhost:5000/led-control", { command });
    } catch (error) {
      console.error("Error sending LED command:", error);
    }
  };

  const toggleManualMode = (sensor) => {
    const newManualMode = { ...manualMode };
    newManualMode[sensor] = !newManualMode[sensor];
    setManualMode(newManualMode);

    const command = `${sensor.toUpperCase()}_${newManualMode[sensor] ? 'MANUAL' : 'AUTO'}`;
    sendLedCommand(command);
  };

  const toggleLed = (sensor, state) => {
    const command = `${sensor.toUpperCase()}_${state}`;
    sendLedCommand(command);
  };

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/sensor-data");
        const newData = response.data;

        setSensorData(newData);

        setSensorHistory((prev) => ({
          temperature: [
            ...prev.temperature.slice(-19),
            { time: new Date().toLocaleTimeString(), value: newData.temperature },
          ],
          humidity: [
            ...prev.humidity.slice(-19),
            { time: new Date().toLocaleTimeString(), value: newData.humidity },
          ],
          soilMoisture: [
            ...prev.soilMoisture.slice(-19),
            { time: new Date().toLocaleTimeString(), value: newData.soilMoisture },
          ],
          rainIntensity: [
            ...prev.rainIntensity.slice(-19),
            { time: new Date().toLocaleTimeString(), value: newData.rainIntensity },
          ],
        }));
      } catch (error) {
        console.error("Error fetching sensor data:", error);
      }
    };

    if (connectedPort) {
      fetchSensorData();
      const intervalId = setInterval(fetchSensorData, 500);
      return () => clearInterval(intervalId);
    }
  }, [connectedPort]);

  const SensorDisplay = ({ sensorName }) => {
    const config = sensorConfig[sensorName];
    const historyData = sensorHistory[sensorName];
    const value = sensorData[sensorName];
    const currentColor = config.color;
    const isManualMode = manualMode[config.ledName];

    return (
      <div className="sensor-display">
        <h2>{sensorName.charAt(0).toUpperCase() + sensorName.slice(1)}</h2>
        <div className="gauge-section">
          <CircularGauge
            value={value}
            max={config.max}
            color={currentColor}
            unit={config.unit}
            icon={config.icon}
          />
        </div>
        <div className="manual-control">
          <label>
            Manual Mode
            <input
              className="manual-checkbox"
              type="checkbox"
              checked={isManualMode}
              onChange={() => toggleManualMode(config.ledName)}
            />
          </label>
          {isManualMode && (
            <div className="led-controls">
              <button onClick={() => toggleLed(config.ledName, 'ON')} className="led-controls-btn">LED ON</button>
              <button onClick={() => toggleLed(config.ledName, 'OFF')} className="led-controls-btn">LED OFF</button>
            </div>
          )}
        </div>
        <div className="graph-section">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[config.min, config.max]} />
              <Tooltip formatter={(val) => [`${val}${config.unit}`, sensorName]} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={currentColor}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard">
      <h1>Tea Plantation Monitering System</h1>
      <PortSelector onPortSelect={setConnectedPort} />
      {connectedPort ? (
        <div className="sensors-container">
          {Object.keys(sensorConfig).map((sensorName) => (
            <SensorDisplay key={sensorName} sensorName={sensorName} />
          ))}
        </div>
      ) : (
        <div className="no-port-selected">
          Please select and connect a COM port to view sensor data.
        </div>
      )}
    </div>
  );
}



export default App;