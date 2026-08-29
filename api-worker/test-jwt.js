const jose = require('jose');

async function test() {
  const b64Secret = 'HWVFBxA8VC+60I3KKgPIeGIMon6wvReTlOMxBPhNaOvmhPfOqToHOpC9IU7ZFhkgPS0R9qMhtUOSlrU9Wt/D+A==';
  
  // 1. First, decode the base64 secret to a Uint8Array
  const b64 = b64Secret.replace(/-/g, '+').replace(/_/g, '/');
  const binaryString = atob(b64);
  const secret = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    secret[i] = binaryString.charCodeAt(i);
  }

  console.log("Secret length:", secret.length); // Should be 32 (256-bit) or 64 (512-bit)

  // 2. Generate a mock JWT token using this secret
  const jwt = await new jose.SignJWT({ sub: '1234567890', name: 'John Doe' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secret);
  
  console.log("Generated JWT:", jwt);

  // 3. Try to verify it
  try {
    const { payload } = await jose.jwtVerify(jwt, secret);
    console.log("Verification successful! Payload:", payload);
  } catch (err) {
    console.error("Verification failed:", err.message);
  }
}

test();
