const Joi = require('joi');

const registerSchema = Joi.object({
    login: Joi.string().trim().min(2).max(50).required(),
    password: Joi.string().min(8).max(255).required(),
    email: Joi.string().email().lowercase().required()
});

const loginSchema = Joi.object({
    login: Joi.string().trim().min(2).max(50).required(),
    password: Joi.string().min(8).max(255).required()
})

const validateRegister = (data) => {
    return registerSchema.validate(data, { abortEarly: false });
}

const validateLogin = (data) => {
    return loginSchema.validate(data, { abortEarly: false });
}

module.exports = { validateLogin, validateRegister };