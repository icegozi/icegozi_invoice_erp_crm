const useAppSettings = () => {
  let settings = {};
  // Email "from" address for transactional emails (e.g. password reset).
  // Set OPENING_EMAIL in your .env to your own verified sender.
  settings['invoice_app_email'] = process.env.OPENING_EMAIL || 'noreply@localhost';
  // Base URL used to build links inside emails (e.g. reset-password link).
  // Set FRONTEND_URL in your .env to your own app URL.
  settings['invoice_base_url'] = process.env.FRONTEND_URL || 'http://localhost:3000';
  return settings;
};

module.exports = useAppSettings;
