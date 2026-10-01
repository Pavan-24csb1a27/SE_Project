import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateToken } from '../middleware/auth.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';

async function runPhase1Verification() {
  console.log('====================================================');
  console.log('   UniHealth Phase 1 Foundation: Test Suite        ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(testName: string, condition: boolean, details?: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details || 'Assertion failed'}`);
    }
  }

  // 1. Password Hashing & Verification
  console.log('--- 1. Password Hashing & Bcrypt Verification ---');
  const password = 'SecretPassword123!';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  assert('Password hashes to non-empty string', typeof hash === 'string' && hash.length > 20);
  const match = await bcrypt.compare(password, hash);
  assert('Valid password matches hash', match === true);
  const mismatch = await bcrypt.compare('WrongPassword', hash);
  assert('Invalid password rejects mismatch', mismatch === false);

  // 2. JWT Generation & Verification
  console.log('\n--- 2. JWT Generation & Role Payload ---');
  const mockUserPayload = {
    userId: '65f1234567890abcdef12345',
    universityId: '24CSB1A27',
    role: 'doctor' as const,
  };

  const token = generateToken(mockUserPayload);
  assert('JWT token successfully generated', typeof token === 'string' && token.split('.').length === 3);

  const secret = process.env.JWT_SECRET || 'unihealth_super_secret_jwt_key_dev_2026';
  const decoded = jwt.verify(token, secret) as any;

  assert('Decoded JWT contains expected userId', decoded.userId === mockUserPayload.userId);
  assert('Decoded JWT contains expected role', decoded.role === 'doctor');
  assert('Decoded JWT contains universityId', decoded.universityId === '24CSB1A27');

  // 3. Validation Schemas (Zod)
  console.log('\n--- 3. Zod Input Validation Tests ---');

  // Test Valid Register
  const validRegisterPayload = {
    body: {
      universityId: '24CSB1A24',
      name: 'Kaivalya',
      email: 'kaivalya@univ.edu',
      password: 'mypassword123',
      role: 'civilian',
    },
  };
  const regResult = await registerSchema.safeParseAsync(validRegisterPayload);
  assert('Valid register payload passes Zod schema', regResult.success === true);

  // Test Invalid Email
  const invalidEmailPayload = {
    body: {
      universityId: '24CSB1A24',
      name: 'Kaivalya',
      email: 'not-an-email',
      password: 'mypassword123',
      role: 'civilian',
    },
  };
  const regInvalidEmail = await registerSchema.safeParseAsync(invalidEmailPayload);
  assert('Invalid email is properly caught by Zod', regInvalidEmail.success === false);

  // Test Short Password
  const shortPassPayload = {
    body: {
      universityId: '24CSB1A24',
      name: 'Kaivalya',
      email: 'kaivalya@univ.edu',
      password: '123',
      role: 'civilian',
    },
  };
  const regShortPass = await registerSchema.safeParseAsync(shortPassPayload);
  assert('Short password (<6 chars) rejected by Zod', regShortPass.success === false);

  // Test Valid Login
  const validLoginPayload = {
    body: {
      identifier: '24CSB1A27',
      password: 'secretPassword',
    },
  };
  const loginResult = await loginSchema.safeParseAsync(validLoginPayload);
  assert('Valid login identifier and password pass validation', loginResult.success === true);

  console.log('\n====================================================');
  console.log(`Tests Completed: ${passed}/${total} Passed.`);
  console.log('====================================================');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPhase1Verification();
