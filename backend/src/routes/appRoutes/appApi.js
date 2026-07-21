const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const router = express.Router();

const appControllers = require('@/controllers/appControllers');
const { routesList } = require('@/models/utils');
const { hasAtLeastRole } = require('@/middlewares/authorize');

const writeRole = {
  client: 'sales',
  quote: 'sales',
  invoice: 'sales',
  payment: 'accountant',
  taxes: 'admin',
  paymentmode: 'admin',
};

const routerApp = (entity, controller) => {
  const minimumWriteRole = writeRole[entity] || 'admin';
  router.route(`/${entity}/create`).post(hasAtLeastRole(minimumWriteRole), catchErrors(controller['create']));
  router.route(`/${entity}/read/:id`).get(catchErrors(controller['read']));
  router.route(`/${entity}/update/:id`).patch(hasAtLeastRole(minimumWriteRole), catchErrors(controller['update']));
  router.route(`/${entity}/delete/:id`).delete(hasAtLeastRole(minimumWriteRole), catchErrors(controller['delete']));
  router.route(`/${entity}/search`).get(catchErrors(controller['search']));
  router.route(`/${entity}/list`).get(catchErrors(controller['list']));
  router.route(`/${entity}/listAll`).get(catchErrors(controller['listAll']));
  router.route(`/${entity}/filter`).get(catchErrors(controller['filter']));
  router.route(`/${entity}/summary`).get(catchErrors(controller['summary']));

  if (entity === 'invoice' || entity === 'quote' || entity === 'payment') {
    router.route(`/${entity}/mail`).post(hasAtLeastRole(minimumWriteRole), catchErrors(controller['mail']));
  }

  if (entity === 'quote') {
    router.route(`/${entity}/convert/:id`).post(hasAtLeastRole('sales'), catchErrors(controller['convert']));
  }
};

routesList.forEach(({ entity, controllerName }) => {
  const controller = appControllers[controllerName];
  routerApp(entity, controller);
});

module.exports = router;
