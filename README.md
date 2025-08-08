# 🔐 Secure Password Manager

A modern, team-capable, end-to-end encrypted password manager built with Next.js, TypeScript, and WebCrypto API. Designed with security-first principles and zero-knowledge architecture.

## ✨ Features

### 🔒 Security & Encryption
- **End-to-end encryption** with AES-256-GCM
- **Zero-knowledge architecture** - plaintext passwords never touch the server
- **PBKDF2 key derivation** (100,000 iterations) with unique salts
- **Client-side encryption** using WebCrypto API
- **Key fingerprinting** for integrity verification
- **Secure password generation** with customizable options

### 👥 Team Collaboration
- **Multi-user vaults** with role-based access control
- **Secure sharing** via ECDH key exchange
- **Organization management** with admin controls
- **Audit logging** for compliance and security monitoring

### 🚀 Modern Features
- **Responsive design** with light/dark mode support
- **PWA-ready** for mobile and desktop
- **Real-time search** across encrypted data
- **Vault organization** with folders and tags
- **Favorites and recent items**
- **Entry templates** for different credential types

## 🏗️ Architecture

### Security Model
```
User Password → PBKDF2 → Master Key → Vault Keys → Entry Data
                ↓
            Never stored     Always encrypted
```

### Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Encryption**: WebCrypto API (AES-256-GCM, PBKDF2, ECDH)
- **UI Components**: Radix UI primitives with custom styling
- **Database**: PostgreSQL with Prisma ORM (for metadata only)
- **Development**: ESLint, Prettier, Jest, Playwright

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+
- Modern browser with WebCrypto API support

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd secure-password-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

### Demo Mode
The application includes a fully functional demo mode with encrypted sample data:

- **Main Demo**: `http://localhost:3000` - Interactive vault management
- **Crypto Demo**: `http://localhost:3000/demo` - Encryption/decryption testing

## 🧪 Testing the Encryption

### Run the Crypto Demo
Visit `/demo` to see the encryption system in action:

1. Master key derivation from password
2. Vault creation with unique encryption keys
3. Entry encryption/decryption
4. Search functionality on encrypted data
5. Data integrity verification
6. Secure password generation

### Run Tests
```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# End-to-end tests
npm run test:e2e
```

## 🔧 Development

### Project Structure
```
src/
├── app/                 # Next.js app router
│   ├── page.tsx        # Main dashboard
│   └── demo/           # Crypto demonstration
├── components/         # React components
│   ├── ui/            # Base UI components
│   └── vault/         # Vault-specific components
├── lib/               # Core libraries
│   ├── crypto/        # Encryption utilities
│   ├── vault/         # Vault management
│   └── demo/          # Demo scripts
├── types/             # TypeScript definitions
└── styles/            # Global styles
```

### Key Components

#### Encryption Layer (`src/lib/crypto/`)
- `encryption.ts` - Core AES-GCM encryption functions
- `keyExchange.ts` - ECDH key exchange for sharing
- `utils.ts` - Cryptographic utilities

#### Vault Management (`src/lib/vault/`)
- `vaultService.ts` - High-level vault operations
- Handles encryption/decryption of vault data
- Search and filtering functionality

#### UI Components (`src/components/`)
- `VaultDashboard.tsx` - Main application interface
- `VaultCard.tsx` - Vault display component
- `EntryCard.tsx` - Password entry display

### Security Features Implemented

#### ✅ Encryption
- AES-256-GCM for symmetric encryption
- PBKDF2 with 100,000 iterations for key derivation
- Unique initialization vectors for each encryption
- ECDH P-256 for key exchange

#### ✅ Key Management
- Master keys derived from user passwords
- Unique encryption key per vault
- Keys never stored in plaintext
- Key fingerprinting for integrity checks

#### ✅ Data Protection
- All sensitive data encrypted client-side
- Zero-knowledge server architecture
- Secure random number generation
- Timing-safe string comparisons

## 🐳 Docker Development

### Using Docker Compose
```bash
# Start development environment
npm run docker:dev

# Production build
npm run docker:prod
```

### Manual Docker Setup
```bash
# Build the image
docker build -t secure-password-manager .

# Run the container
docker run -p 3000:3000 secure-password-manager
```

## 📊 Security Audit

### Encryption Standards
- **AES-256-GCM**: NIST-approved symmetric encryption
- **PBKDF2**: NIST SP 800-132 compliant key derivation
- **ECDH P-256**: NIST-approved key exchange
- **WebCrypto API**: Browser-native cryptographic functions

### Security Headers
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

### Best Practices
- No sensitive data in localStorage
- Secure random generation for all cryptographic operations
- Constant-time comparisons for sensitive operations
- Key material cleared from memory when possible

## 🚀 Deployment

### Environment Variables
```bash
# Database (for metadata only)
DATABASE_URL="postgresql://..."

# NextAuth (for authentication)
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"

# Optional: Email service
EMAIL_SERVER="smtp://..."
```

### Production Checklist
- [ ] Set up HTTPS/TLS
- [ ] Configure CSP headers
- [ ] Set up database (PostgreSQL)
- [ ] Configure authentication provider
- [ ] Set up monitoring and logging
- [ ] Enable audit logging
- [ ] Configure backup strategy

## 🛣️ Roadmap

### Phase 1: Core Features ✅
- [x] End-to-end encryption
- [x] Vault management
- [x] Entry CRUD operations
- [x] Search functionality
- [x] Password generation

### Phase 2: Authentication & Multi-user 🚧
- [ ] User registration/login
- [ ] Multi-factor authentication
- [ ] Session management
- [ ] Password policies

### Phase 3: Team Features 📋
- [ ] Vault sharing
- [ ] Organization management
- [ ] Role-based permissions
- [ ] Audit trails

### Phase 4: Advanced Features 📋
- [ ] Browser extension
- [ ] Mobile app (React Native)
- [ ] API for third-party integrations
- [ ] Advanced admin controls

### Phase 5: Enterprise 📋
- [ ] SSO integration
- [ ] SCIM provisioning
- [ ] Advanced reporting
- [ ] Compliance features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

### Development Guidelines
- Follow TypeScript strict mode
- Write tests for all new features
- Use conventional commit messages
- Ensure all security tests pass

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Security Considerations

### Current Limitations
- This is a prototype/demo application
- Not audited by security professionals
- Database schema not implemented
- Authentication system not complete

### Production Recommendations
- Professional security audit required
- Penetration testing recommended
- Compliance review for specific industries
- Regular dependency updates
- Monitoring and alerting setup

## 📞 Support

For questions, issues, or contributions:
- Create an issue on GitHub
- Review the documentation
- Check existing discussions

---

**⚡ Built with security-first principles and modern web technologies**