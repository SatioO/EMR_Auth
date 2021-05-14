const createApplication = require('./app');
const fs = require('fs');
const axios = require('axios').default;
const config = require('./config');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const qs = require('qs');

axios.interceptors.request.use(function (cg) {
    if (cg.url.indexOf('/oauth2/token') === -1) {
        cg.headers.Accept = 'application/fhir+json';
        cg.headers.Authorization = `Bearer ${config.epic.token}`;
    }

    return cg;
});

createApplication(({ app }) => {
    app.get('/generateToken', async (req, res) => {
        const privateKey = fs.readFileSync('privatekey.pem');
        const token = jwt.sign(
            {
                iss: config.epic.client_id,
                sub: config.epic.client_id,
                aud: `${config.epic.base_url}/oauth2/token`,
                jti: uuid.v4(),
                exp: parseInt(
                    new Date(new Date().getTime() + 5 * 60000).getTime() / 1000
                ),
            },
            privateKey,
            {
                algorithm: 'RS384',
            }
        );

        const data = qs.stringify({
            grant_type: 'client_credentials',
            client_assertion_type:
                'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
            client_assertion: token,
        });
        try {
            const auth = await axios.post(
                `${config.epic.base_url}/oauth2/token`,
                data
            );
            config.epic.token =
                config.epic.token === ''
                    ? auth.data.access_token
                    : config.epic.token;
            res.json({ auth: auth.data });
        } catch (error) {
            res.json(error);
        }
    });

    app.get('/patient/:patientId', async (req, res) => {
        const patientId = req.params.patientId;

        try {
            const patient = await axios.get(
                `${config.epic.base_url}/api/FHIR/R4/Patient/${patientId}`
            );
            res.json({ patient: patient.data });
        } catch (error) {
            res.json(error);
        }
    });

    app.post('/patient', async (req, res) => {
        try {
            const patient = await axios.post(
                `${config.epic.base_url}/api/FHIR/R4/Patient`,
                JSON.stringify(req.body)
            );
            res.json({ patient: patient.data });
        } catch (error) {
            res.json(error);
        }
    });

    app.get('/observation/:observationId', async (req, res) => {
        const observationId = req.params.observationId;

        try {
            const observation = await axios.get(
                `${config.epic.base_url}/api/FHIR/R4/Observation/${observationId}`
            );
            res.json({ observation: observation.data });
        } catch (error) {
            res.json(error);
        }
    });

    app.get('/medicationRequest/:medicationRequestId', async (req, res) => {
        const medicationRequestId = req.params.medicationRequestId;

        try {
            const medicationRequest = await axios.get(
                `${config.epic.base_url}/api/FHIR/R4/MedicationRequest/${medicationRequestId}`
            );
            res.json({ medicationRequest: medicationRequest.data });
        } catch (error) {
            res.json(error);
        }
    });
});
