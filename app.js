const express = require('express');

const app = express();
const port = 3000;

app.use(express.json());

module.exports = (cb) => {
    const callbackUrl = `http://localhost:${port}/callback`;

    app.listen(port, (err) => {
        if (err) return console.error(err);

        console.log(`Express server listening at http://localhost:${port}`);

        return cb({
            app,
            callbackUrl,
        });
    });
};
