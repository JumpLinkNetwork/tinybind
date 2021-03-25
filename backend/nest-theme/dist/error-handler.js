"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = exports.getStack = exports.getMessage = exports.getStatus = void 0;
const common_1 = require("@nestjs/common");
const getStatus = (exception) => {
    const status = exception instanceof common_1.HttpException
        ? exception.getStatus()
        : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
    return status;
};
exports.getStatus = getStatus;
const getMessage = (exception) => {
    let message = 'Internal server error';
    if (typeof exception === 'string') {
        message = exception;
    }
    else if (exception instanceof common_1.HttpException) {
        const excResp = exception.getResponse();
        message =
            typeof excResp === 'string'
                ? excResp
                : excResp.message || JSON.stringify(excResp);
    }
    else if (exception instanceof Error) {
        message = exception.message || message;
    }
    return `${message}`;
};
exports.getMessage = getMessage;
const getStack = (exception) => {
    if (typeof exception === 'string') {
        return new Error(exception).stack;
    }
    if (exception instanceof common_1.HttpException) {
        const excResp = exception.getResponse();
        return excResp.stack || exception.stack;
    }
    if (!exception.stack) {
        return new Error().stack;
    }
    return exception.stack;
};
exports.getStack = getStack;
const handleError = (error) => {
    if (error instanceof common_1.HttpException) {
        return error;
    }
    return new common_1.HttpException({
        message: exports.getMessage(error),
        stack: exports.getStack(error),
    }, exports.getStatus(error));
};
exports.handleError = handleError;
//# sourceMappingURL=error-handler.js.map