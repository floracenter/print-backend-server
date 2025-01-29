const express = require('express');
const net = require('net');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

/**
 * /api/print végpont
 * Két paramétert vár a request body-ban:
 *   - printerIP: A nyomtató IP-címe (LAN vagy publikus IP)
 *   - command: A ZPL/EPL parancssor (pl. ^XA ... ^XZ)
 */
app.post('/api/print', (req, res) => {
  const { printerIP, command } = req.body;

  if (!printerIP || !command) {
    return res.status(400).send('Hibás kérés: printerIP vagy command hiányzik!');
  }

  // Nyers TCP socket létrehozása, csatlakozás a 9100-as portra
  const client = new net.Socket();
  client.connect(9100, printerIP, () => {
    console.log(`Kapcsolódva a nyomtatóhoz: ${printerIP}:9100`);
    // Küldjük a parancsot
    client.write(command, 'utf8', () => {
      // Bezárhatjuk a socketet, ha elkészült
      client.end();
    });
  });

  // Hiba esemény
  client.on('error', (err) => {
    console.error('NYOMTATÁSI HIBA:', err);
    return res.status(500).send('Nyomtatási hiba: ' + err.message);
  });

  // Ha a nyomtató lezárta a kapcsolatot, visszaküldjük a választ
  client.on('close', () => {
    console.log('Kapcsolat lezárva a nyomtatóval.');
    return res.status(200).send('Printed successfully');
  });
});

// Indítjuk a szervert pl. 3001-es porton
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Print server listening on port ${PORT}`);
});
