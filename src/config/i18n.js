const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const Backend = require('i18next-fs-backend');
const path = require('path');

function initI18n() {
  i18next
    .use(Backend)
    .use(i18nextMiddleware.LanguageDetector)
    .init({
      backend: {
        loadPath: path.join(process.cwd(), '/locales/{{lng}}/{{ns}}.json')
      },
      fallbackLng: 'en',
      preload: ['en', 'pt-BR', 'fr', 'es', 'it', 'de'],
      supportedLngs: ['en', 'pt-BR', 'fr', 'es', 'it', 'de'],
      detection: {
        order: ['querystring', 'cookie', 'header'],
        lookupQuerystring: 'lng',
        lookupCookie: 'i18next',
        caches: ['cookie']
      }
    });

  return i18next;
}

module.exports = {
  initI18n,
  i18nextMiddleware
};