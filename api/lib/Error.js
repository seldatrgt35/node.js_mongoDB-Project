class CustomError extends Error {

    constructor(code, messeage, description) {
        super('"code": "${code}","messeage": "${messeage}","decription": "${description}"')
        this.code = code;
        this.message = messeage;
        this.description = description;
    }
}

module.exports = CustomError;