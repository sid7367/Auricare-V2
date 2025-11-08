const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // Point baseUrl to your frontend so cy.visit('/') opens the page
    baseUrl: 'https://localhost:8080',

    // Disable support file if not needed
    supportFile: false,

    // Pattern for your spec files
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',

    // Node event setup
    setupNodeEvents(on, config) {
      // Example: log when a test starts
      on('test:before:run', (test, runnable) => {
        console.log(`Starting test: ${test.title}`);
      });

      // Return config
      return config;
    },
  },
});
