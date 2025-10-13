const Joi = require('joi');

const registerSchema = Joi.object({
    login: Joi.string().trim().min(2).max(50).required(),
    password: Joi.string().min(8).max(255).required(),
    email: Joi.string().email().lowercase().required()
});

const loginSchema = Joi.object({
    login: Joi.string().trim().min(2).max(50).required(),
    password: Joi.string().min(8).max(255).required()
});

const updateProfileSchema = Joi.object({
    name: Joi.string().trim().min(2).max(50).optional(),
    email: Joi.string().email().lowercase().optional(),
    ColorScheme_id: Joi.number().integer().optional(),
    currency_id: Joi.number().integer().optional()
});

const validateRegister = (data) => {
    return registerSchema.validate(data, { abortEarly: false });
}

const validateLogin = (data) => {
    return loginSchema.validate(data, { abortEarly: false });
}

const validateUpdateProfile = (data) => {
    return updateProfileSchema.validate(data, { abortEarly: false });
}

module.exports = { validateLogin, validateRegister, validateUpdateProfile };