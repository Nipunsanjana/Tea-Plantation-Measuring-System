const express = require('express');
const cors = require('cors');
const http = require('http');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let sensorData = {
  humidity: 0,
  temperature: 0,
  soilMoisture: 0,
  rainIntensity: 0,
};

let connectedPort = null;

async function getAvailablePorts() {
  try {
    const ports = await SerialPort.list();
    return ports.map((port) => ({
      path: port.path,
      manufacturer: port.manufacturer,
    }));
  } catch (error) {
    console.error('Error listing ports:', error);
    return [];
  }
}

async function connectToPort(portPath) {
  try {
    if (connectedPort) {
      connectedPort.close();
    }

    const port = new SerialPort({
      path: portPath,
      baudRate: 9600,
    });

    const parser = port.pipe(new ReadlineParser());
    parser.on('data', (data) => {
      try {
        const [humidity, temperature, soilMoisture, rainIntensity] =
          data.split(',').map(parseFloat);

        sensorData = {
          humidity,
          temperature,
          soilMoisture,
          rainIntensity,
        };

        console.log('Received Sensor Data:', sensorData);
      } catch (error) {
        console.error('Error parsing sensor data:', error);
      }
    });

    port.on('error', (err) => {
      console.error('Serial Port Error:', err.message);
      connectedPort = null;
    });

    connectedPort = port;
    return true;
  } catch (error) {
    console.error('Port Connection Error:', error);
    return false;
  }
}

app.get('/available-ports', async (req, res) => {
  const ports = await getAvailablePorts();
  res.json(ports);
});

app.post('/connect-port', async (req, res) => {
  const { portPath } = req.body;
  const success = await connectToPort(portPath);
  res.json({ success, portPath });
});

app.get('/sensor-data', (req, res) => {
  res.json(sensorData);
});

app.post('/led-control', (req, res) => {
  const { command } = req.body;
  
  if (connectedPort && connectedPort.isOpen) {
    connectedPort.write(`${command}\n`, (err) => {
      if (err) {
        console.error('Error sending LED command:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true });
    });
  } else {
    res.status(400).json({ success: false, error: 'No port connected' });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});