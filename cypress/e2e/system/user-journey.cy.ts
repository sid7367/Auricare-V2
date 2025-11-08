describe('Auricare System Test - Complete User Journey', () => {
  const apiBaseUrl = 'http://localhost:5000/api'; // API base

  before(() => {
    cy.log('🚀 Starting Auricare system test suite...');
    // Open the frontend once
    cy.visit('/'); // baseUrl is now the frontend
  });

  it('1️⃣ Checks if API is healthy', () => {
    cy.request(`${apiBaseUrl}/health`).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.status).to.eq('healthy');
      expect(response.body.message).to.contain('Chatbot API is running');
    });
    cy.wait(1000); // Pause to see the page visually
  });

  it('2️⃣ Tests patient chatbot conversation flow', () => {
    cy.request('POST', `${apiBaseUrl}/patient/chat`, {
      message: 'What is autism?',
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.response).to.exist;
      cy.log('💬 Patient chatbot response:', response.body.response);
    });
    cy.wait(1000);
  });

  it('3️⃣ Tests doctor chatbot interaction flow', () => {
    cy.request('POST', `${apiBaseUrl}/doctor/chat`, {
      message: 'What are the best treatment approaches for autism?',
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.response).to.exist;
      cy.log('🩺 Doctor chatbot response:', response.body.response);
    });
    cy.wait(1000);
  });

  it('4️⃣ Checks doctor memory retrieval', () => {
    cy.request(`${apiBaseUrl}/doctor/memory`).then((response) => {
      expect(response.status).to.eq(200);
      cy.log('🧠 Doctor memory contents retrieved successfully');
    });
    cy.wait(1000);
  });

  it('5️⃣ Clears doctor memory', () => {
    cy.request('POST', `${apiBaseUrl}/doctor/clear-memory`).then((response) => {
      expect(response.status).to.eq(200);
      cy.log('🧹 Doctor memory cleared successfully');
    });
    cy.wait(1000);
  });

  it('6️⃣ Handles unavailable chatbot service gracefully', () => {
    cy.request({
      method: 'POST',
      url: `${apiBaseUrl}/patient/chat`,
      failOnStatusCode: false,
      body: { message: '' },
    }).then((response) => {
      expect([200, 400, 500]).to.include(response.status);
      cy.log('⚠️ Handled invalid or unavailable chatbot scenario');
    });
    cy.wait(1000);
  });
});
