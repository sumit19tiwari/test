'use strict';

describe('Workflows E2E Tests:', function () {
  describe('Test Workflows page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/workflows');
      expect(element.all(by.repeater('workflow in workflows')).count()).toEqual(0);
    });
  });
});
