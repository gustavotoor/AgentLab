# BYOK — Bring Your Own Key

AgentLab uses a Bring Your Own Key model for Anthropic API access.

## How It Works

1. User enters their Anthropic API key in Settings
2. Key is encrypted with AES-256-GCM using a server-side `ENCRYPTION_KEY`
3. Encrypted key is stored in `User.apiKeyEncrypted`
4. A masked version (`sk-ant-...abcd`) is stored for display
5. On chat, the key is decrypted server-side and used to create an Anthropic client

## Encryption

Algorithm: AES-256-GCM with random IV per encryption.

Storage format: `ivHex:authTagHex:encryptedHex`

```typescript
encrypt(text: string): string   // Returns "iv:authTag:encrypted"
decrypt(encrypted: string): string  // Reverses the above
```

## Security

- Keys never leave the server in plaintext
- IV is randomly generated per encryption (prevents replay attacks)
- Auth tag provides integrity verification
- `ENCRYPTION_KEY` must be set as environment variable (64 hex chars = 32 bytes)

## Generating ENCRYPTION_KEY

```bash
openssl rand -hex 32
```
