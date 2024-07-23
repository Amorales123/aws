const express = require('express');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = 3000;

// Configuración de AWS SDK
AWS.config.update({ region: 'us-east-1' });
const cloudwatchlogs = new AWS.CloudWatchLogs();

const logGroupName = 'click-logs';
const logStreamName = 'click-stream';

app.use(bodyParser.json());

// Ruta para la URL raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/log', (req, res) => {
    const { clave, valor } = req.body;

    // Log to stdout, FireLens will capture and route this to both CloudWatch and S3
    const logMessage = JSON.stringify({ clave, valor });
    console.log(logMessage);

    // Additionally log to CloudWatch directly
    const params = {
        logGroupName: logGroupName,
        logStreamName: logStreamName,
        logEvents: [
            {
                timestamp: Date.now(),
                message: logMessage
            }
        ]
    };

    cloudwatchlogs.putLogEvents(params, (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error logging to CloudWatch');
        } else {
            res.send('Logged successfully');
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
