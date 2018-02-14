(function () {
  'use strict';

  angular
    .module('workflows')
    .run(menuConfig);

  menuConfig.$inject = ['Menus'];

  function menuConfig(menuService) {
    // Set top bar menu items
    menuService.addMenuItem('topbar', {
      title: 'Workflows',
      state: 'workflows',
      type: 'dropdown',
      roles: ['user']
    });

    // Add the dropdown list item
    menuService.addSubMenuItem('topbar', 'workflows', {
      title: 'List Workflows',
      state: 'workflows.list',
      roles: ['user']
    });

    // Add the dropdown create item
    menuService.addSubMenuItem('topbar', 'workflows', {
      title: 'Create Workflow',
      state: 'workflows.create',
      roles: ['user']
    });

    // Add the dropdown draft list item
    menuService.addSubMenuItem('topbar', 'workflows', {
      title: 'Create from drafts',
      state: 'wkdraft.list',
      roles: ['user']
    });
  }
}());
