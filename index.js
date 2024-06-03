const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser());

// CSV Writer
const csvWriter = createObjectCsvWriter({
  path: 'data.csv',
  header: [
    { id: 'id', title: 'ID' },
    { id: 'timestamp', title: 'Timestamp' },
    { id: 'email', title: 'Email' },
    { id: 'product', title: 'Product' },
    { id: 'utm_source', title: 'UTM Source' },
    { id: 'utm_medium', title: 'UTM Medium' },
    { id: 'utm_campaign', title: 'UTM Campaign' },
    { id: 'converted', title: 'Converted' }
  ],
  append: true 
});

if (!fs.existsSync('data.csv')) {
  csvWriter.writeRecords([]);
}

app.post('/track', (req, res) => {
  const data = req.body;
  data.timestamp = new Date().toISOString(); 
//   console.log(data);
  let existingData = [];
  if (fs.existsSync('data.csv')) {
    existingData = fs.readFileSync('data.csv', 'utf8').split('\n').slice(1).map(row => {
      const values = row.split(',');
      return {
        id: values[0],
        timestamp: values[1],
        email: values[2],
        product: values[3],
        utm_source: values[4],
        utm_medium: values[5],
        utm_campaign: values[6],
        converted: values[7]
      };
    });
  }

  const userIndex = existingData.findIndex(user => user.id === data.id);
  if (userIndex !== -1) {
    existingData[userIndex] = { ...existingData[userIndex], ...data };
    fs.writeFileSync('data.csv', [
      ['ID', 'Timestamp', 'Email', 'Product', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Converted'].join(','),
      ...existingData.map(user => Object.values(user).join(','))
    ].join('\n'));
    res.send({ status: 'success' });
  } else {
    csvWriter.writeRecords([data])
      .then(() => {
        res.send({ status: 'success' });
      })
      .catch(err => {
        console.error('Error writing to CSV file', err);
        res.status(500).send({ status: 'error', message: 'Internal Server Error' });
      });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});