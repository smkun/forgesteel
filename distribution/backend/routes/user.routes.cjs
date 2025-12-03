"use strict";
/**
 * User routes
 *
 * Provides search endpoint for selecting GMs by email.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require('../middleware/authMiddleware.cjs');
const errorHandler_1 = require('../middleware/errorHandler.cjs');
const usersRepo = __importStar(require('../data/users.repository.cjs'));
const router = (0, express_1.Router)();
router.get('/search', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const query = req.query.query || '';
    if (query.trim().length < 2) {
        throw (0, errorHandler_1.createError)(400, 'Query must be at least 2 characters');
    }
    const users = await usersRepo.searchByEmailOrName(query.trim(), 10);
    res.json({
        count: users.length,
        users: users.map(user => ({
            id: user.id,
            email: user.email,
            display_name: user.display_name
        }))
    });
}));
exports.default = router;
//# sourceMappingURL=user.routes.js.map