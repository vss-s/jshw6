const Joi = require("@hapi/joi");
const contactModel = require("./contact.model");
const {
  Types: { ObjectId },
} = require("mongoose");

class ContactController {
  async getContacts(req, res, next) {
    try {
      const getContact = await contactModel.find();
      return res.status(200).json(getContact);
    } catch (err) {
      next(err);
    }
  }
  async createContact(req, res, next) {
    try {
      const contact = await contactModel.create(req.body);
      return res.status(201).json(contact);
    } catch (err) {
      next(err);
    }
  }
  validateCreateContact(req, res, next) {
    const validationRules = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().required(),
      phone: Joi.string().required(),
      subscription: Joi.string().required(),
      password: Joi.string().required(),
      token: Joi.string().required(),
    });
    const validationResult = validationRules.validate(req.body);
    if (validationResult.error) {
      return res.status(400).send(validationResult.error.details);
    }

    next();
  }
  async updateContact(req, res, next) {
    try {
      const { contactId } = req.params;

      const contactToUpdate = await contactModel.findContactByIdAndUpdate(
        contactId,
        req.body
      );

      console.log("contactToUpdate", contactToUpdate);
      if (!contactToUpdate) {
        res.status(404).send();
      }
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
  validateUpdateContact(req, res, next) {
    const validationRules = Joi.object({
      name: Joi.string(),
      email: Joi.string(),
      phone: Joi.string(),
      subscription: Joi.string(),
      password: Joi.string(),
      token: Joi.string(),
    });
    const validationResult = validationRules.validate(req.body);
    if (validationResult.error) {
      return res.status(400).send(validationResult.error.details);
    }

    next();
  }

  async getById(req, res, next) {
    try {
      const { contactId } = req.params;

      const contact = await contactModel.findById({ _id: contactId });
      console.log("contact", contact);
      if (!contact) {
        return res.status(404).send("smth con");
      }
      return res.status(200).json(contact);
    } catch (err) {
      next(err);
    }
  }

  validateId(req, res, next) {
    const { contactId } = req.params;
    if (!ObjectId.isValid(contactId)) {
      res.status(400).send(console.log("wrong Id", contactId));
    }
    next();
  }

  async removeContact(req, res, next) {
    try {
      const contactId = req.params.contactId;

      const deleteContact = await contactModel.findByIdAndDelete(contactId);

      if (!deleteContact) {
        return res.status(404).send("smth con");
      }
      return res.status(204).json(deleteContact);
    } catch (err) {
      next(err);
    }
  }
}
module.exports = new ContactController();
