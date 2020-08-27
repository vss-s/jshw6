const { Router } = require("express");
const contactRouter = Router();
const contactController = require("./contact.controller");
const userController = require("./user.controller");

contactRouter.get("/", contactController.getContacts);
contactRouter.post(
  "/",
  contactController.validateCreateContact,
  contactController.createContact
);
contactRouter.put(
  "/:contactId",
  contactController.validateId,
  contactController.validateUpdateContact,
  contactController.updateContact
);
contactRouter.get(
  "/:contactId",
  contactController.validateId,
  contactController.getById
);
contactRouter.delete(
  "/:contactId",
  contactController.validateId,
  contactController.removeContact
);

module.exports = contactRouter;
