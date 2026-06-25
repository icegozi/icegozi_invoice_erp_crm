const pug = require('pug');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const puppeteer = require('puppeteer');
const { listAllSettings, loadSettings } = require('@/middlewares/settings');
const { getData } = require('@/middlewares/serverData');
const useLanguage = require('@/locale/useLanguage');
const { useMoney, useDate } = require('@/settings');

const pugFiles = ['invoice', 'offer', 'quote', 'payment'];

// Max size for a logo we inline as base64 into the PDF (mirrors the 5MB upload cap).
const MAX_LOGO_BYTES = 5 * 1024 * 1024;
// Whitelist extension → MIME so an extension-less/unknown file never yields "image/".
const LOGO_MIME_BY_EXT = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

exports.generatePdf = async (
  modelName,
  info = { filename: 'pdf_file', format: 'A5', targetLocation: '' },
  result,
  callback
) => {
  try {
    const { targetLocation } = info;

    // if PDF already exists, then delete it and create a new PDF
    if (fs.existsSync(targetLocation)) {
      fs.unlinkSync(targetLocation);
    }

    // render pdf html

    if (pugFiles.includes(modelName.toLowerCase())) {
      // Compile Pug template

      const settings = await loadSettings();
      const selectedLang = settings['invoice_app_language'];
      const translate = useLanguage({ selectedLang });

      const {
        currency_symbol,
        currency_position,
        decimal_sep,
        thousand_sep,
        cent_precision,
        zero_format,
      } = settings;

      const { moneyFormatter } = useMoney({
        settings: {
          currency_symbol,
          currency_position,
          decimal_sep,
          thousand_sep,
          cent_precision,
          zero_format,
        },
      });
      const { dateFormat } = useDate({ settings });

      settings.public_server_file = process.env.PUBLIC_SERVER_FILE;

      if (settings.company_logo) {
        try {
          const logoDiskPath = path.join('src', settings.company_logo);
          const stat = await fs.promises.stat(logoDiskPath).catch(() => null);
          // Guard the size: the logo is inlined into every PDF, so an oversized
          // file would bloat output and memory. Skip embedding (fall back to URL)
          // when missing, not a regular file, or larger than the 5MB upload cap.
          if (stat && stat.isFile() && stat.size <= MAX_LOGO_BYTES) {
            const ext = path.extname(logoDiskPath).slice(1).toLowerCase();
            const mime = LOGO_MIME_BY_EXT[ext] || 'image/png';
            const base64 = (await fs.promises.readFile(logoDiskPath)).toString('base64');
            settings.company_logo = `data:${mime};base64,${base64}`;
            settings.public_server_file = '';
          }
        } catch (error) {
          // keep the URL-based logo fallback (public_server_file + company_logo)
        }
      }

      const htmlContent = pug.renderFile('src/pdf/' + modelName + '.pug', {
        model: result,
        settings,
        translate,
        dateFormat,
        moneyFormatter,
        moment: moment,
      });

      fs.mkdirSync(path.dirname(targetLocation), { recursive: true });

      await renderHtmlToPdf(htmlContent, targetLocation, info.format);

      if (callback) callback();
    }
  } catch (error) {
    throw new Error(error);
  }
};

// A single Chromium instance is shared across renders. Launching a browser per
// PDF costs ~300-800ms + ~150-300MB each and, under concurrent download/mail
// requests, can OOM the container. We open/close a fresh page per render instead.
let _browserPromise = null;

function getBrowser() {
  if (!_browserPromise) {
    _browserPromise = puppeteer
      .launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      })
      .catch((err) => {
        // Don't cache a rejected launch — let the next call retry.
        _browserPromise = null;
        throw err;
      });
  }
  return _browserPromise;
}

// If the browser dies (crash/disconnect), drop the cached handle so the next
// render relaunches instead of reusing a dead instance.
async function _attachDisconnectReset(browser) {
  browser.on('disconnected', () => {
    _browserPromise = null;
  });
  return browser;
}

/**
 * Render an HTML string to a PDF file on disk using headless Chromium (Puppeteer).
 * Replaces the abandoned html-pdf/PhantomJS engine.
 *
 * In Docker we point at the system Chromium via PUPPETEER_EXECUTABLE_PATH; on a
 * dev host Puppeteer falls back to the browser it downloaded at install time.
 */
async function renderHtmlToPdf(htmlContent, targetLocation, format = 'A4') {
  const browser = await _attachDisconnectReset(await getBrowser());
  const page = await browser.newPage();
  try {
    // Cap the wait: with the logo inlined as base64 the network goes idle
    // immediately, but the URL-fallback path could otherwise hang on an
    // unreachable file server until the (longer) default timeout.
    await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: 15000 });
    await page.pdf({
      path: targetLocation,
      format: format || 'A4',
      landscape: false,
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    });
  } finally {
    // Close only the page; the shared browser stays up for the next render.
    await page.close();
  }
}
