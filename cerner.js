const { AuthorizationCode } = require('simple-oauth2');
const createApplication = require('./app');
const config = require('./config');

createApplication(({ app, callbackUrl }) => {
    const client = new AuthorizationCode({
        client: {
            id: config.client_id,
        },
        auth: {
            tokenHost: config.auth_server_base_uri,
            tokenPath: config.token_uri,
            authorizePath: config.authorization_uri,
        },
        options: {
            authorizationMethod: 'body',
        },
    });

    // Authorization uri definition
    const authorizationUri = client.authorizeURL({
        redirect_uri: callbackUrl,
        scope: config.scopes,
        aud: config.fhir_uri,
        state: config.state,
    });

    // Initial page redirecting to Cerner
    app.get('/auth', (_, res) => {
        res.redirect(authorizationUri);
    });

    app.get('/callback', async (req, res) => {
        const { code } = req.query;

        const options = {
            code,
            redirect_uri: callbackUrl,
        };

        try {
            const accessToken = await client.getToken(options);

            return res.status(200).json(accessToken.token);
        } catch (error) {
            console.error('Access Token Error', error);
            return res.status(500).json('Authentication failed');
        }
    });

    app.post('/auth/refresh', async (req, res) => {
        try {
            const accessTokenJSONString = req.body;
            let accessToken = client.createToken(accessTokenJSONString);
            const newToken = await accessToken.refresh();

            res.json(newToken);
        } catch (err) {
            res.json(err);
        }
    });

    app.get('/', (_, res) => {
        res.send('<a href="/auth">Log in with Cerner</a>');
    });
});
