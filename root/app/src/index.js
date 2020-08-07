import express from 'express';
import Prometheus from 'prom-client';
import { spawn } from 'child_process';
import carrier from 'carrier';
import fetch from 'node-fetch';
import loadConfig from './config';

const config = loadConfig('/config/efergyexporter.json', ['voltage']);

const port = config.port || 9120;
const scrapeInterval = (config.scrapeInterval || 15) * 1000;
const defaultMetrics = Prometheus.collectDefaultMetrics({ timeout: scrapeInterval });

const gauges = {
  battery: new Prometheus.Gauge({ name: 'efergy_battery', help: 'Battery status' }),
  energy: new Prometheus.Gauge({ name: 'efergy_energy', help: 'Energy now' }),
  current: new Prometheus.Gauge({ name: 'efergy_current', help: 'Current output' }),
  interval: new Prometheus.Gauge({ name: 'efergy_interval', help: 'Interval' }),
  learn: new Prometheus.Gauge({ name: 'efergy_learn', help: 'Learn mode' }),
};

const main = () => {
  // Spawn the child process, the command rtl_443 with parameters required to read the Efergy
  // Energy devices
  const cmd = spawn('/app/rtl_433', ['-f', '433.55e6', '-R', '36', '-F', 'json']);

  // Use carrier to build a buffer delimited by line
  const line = carrier.carry(cmd.stdout);
  line.on('line', (data) => {
    // Check json received can be parsed
    try {
      const jsonData = JSON.parse(data.toString());
      if (jsonData === undefined) return;

      // Set gauges
      gauges.battery.set(jsonData.battery === 'OK' ? 1 : 0);
      if (config.voltage) {
        gauges.energy.set(jsonData.current * config.voltage);
      }
      gauges.current.set(jsonData.current);
      gauges.interval.set(jsonData.interval);
      gauges.learn.set(jsonData.learn === 'NO' ? 0 : 1);

      if (config.hasOwnProperty('REST')) {
        const url = config.REST;
        const body = JSON.stringify(jsonData);
        fetch(url, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body,
        }).catch(e => console.log(e));
      }
    } catch (err) {
      console.log('Unable to parse incoming data', err);
    }
  });

  cmd.stderr.on('data', (data) => {
    console.log(data.toString());
  });

  cmd.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);
  });

  cmd.on('error', (error) => {
    console.log('Failed to start process', error);
  });
};

// Setup our HTTP webserver
const app = express();
app.get('/', (req, res, next) => {
  setTimeout(() => {
    res.send('Point Prometheus here for your Efergy Energy statistics');
    next();
  }, Math.round(Math.random() * 200));
});

app.get('/metrics', (req, res) => {
  res.set('Content-Type', Prometheus.register.contentType);
  res.end(Prometheus.register.metrics());
});

app.use((err, req, res, next) => {
  res.statusCode = 500;

  // Dev only:
  //res.json({ error: err.message });
  next();
});

const server = app.listen((port), () => {
  console.log(`Running efergyexporter. Listening on port ${port}.`);
  main();
});

// Shutdown gracefully
process.on('SIGTERM', () => {
  clearInterval(defaultMetrics);
  server.close((err) => {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    process.exit(0);
  });
});