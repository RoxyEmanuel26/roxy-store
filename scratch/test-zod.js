const { ProductSchema } = require('../lib/validations');
const { z } = require('zod');

// We need to bypass import of typescript files if we use raw node, so we can mock/require it.
// Let's import Zod and test the exact object structure of ProductSchema.
console.log("Testing Zod Schema...");
