// Setup global des tests (CRA le charge automatiquement pour chaque suite).
// jsdom n'expose pas TextEncoder/TextDecoder : react-router v7 en a besoin
// au chargement du module. On les importe depuis Node `util`.
/* eslint-env node */
/* eslint-disable no-undef */
const { TextEncoder, TextDecoder } = require("util");

if (typeof global.TextEncoder === "undefined") global.TextEncoder = TextEncoder;
if (typeof global.TextDecoder === "undefined") global.TextDecoder = TextDecoder;
