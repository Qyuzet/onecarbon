# OneCarbon - Scope 3 Agentic Carbon Platform

OneCarbon is the world's first automated Scope 3 carbon reporting platform that leverages AI for document analysis and blockchain technology for secure, privacy-preserving data storage.

## 🌟 Features

- **AI-Powered Document Analysis**

  - Automated processing of operational documents
  - Support for PDF and text file formats
  - Intelligent carbon footprint extraction using GPT-3.5
  - Bulk processing through ZIP file uploads

- **Blockchain Integration**

  - Smart contract-based data storage
  - Privacy-preserving transactions via Manta Network
  - Transparent and verifiable carbon tracking
  - Web3 wallet connectivity

- **Modern Web Interface**
  - Real-time carbon metrics dashboard
  - Interactive document upload system
  - Progress tracking and analytics
  - Responsive design for all devices

## 🛠️ Tech Stack

- **Frontend**

  - Next.js 13+ with App Router
  - TypeScript
  - Tailwind CSS
  - React Components

- **Backend**

  - Next.js API Routes
  - OpenAI GPT-3.5 Integration
  - PDF Parser
  - File System Management

- **Blockchain**
  - Ethereum Smart Contracts (Solidity)
  - Manta Network Integration
  - Web3 Integration

## 📋 Prerequisites

- Node.js 16.x or later
- npm or yarn
- OpenAI API key
- Web3 wallet (MetaMask recommended)
- Manta Network account

## 🚀 Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/Qyuzet/onecarbon.git
   cd onecarbon
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

   Fill in your:

   - OpenAI API key
   - Manta Network credentials
   - Other required environment variables

4. Run the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
onecarbon/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── (root)/            # Main pages
│   └── layout.tsx         # Root layout
├── components/            # React components
├── contracts/            # Smart contracts
├── public/               # Static assets
├── utils/                # Utility functions
└── lib/                  # Shared libraries
```

## 🔒 Smart Contract

The CarbonTracking smart contract provides:

- Carbon footprint data storage
- User-specific tracking
- Historical data access
- Event emission for tracking

## 📤 File Upload System

Supports:

- ZIP file uploads
- PDF document processing
- Text file analysis
- Bulk document handling

## 🛡️ Privacy Features

- Manta Network integration for private transactions
- Secure document processing
- Protected business data
- Verifiable calculations

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-3.5 API
- Manta Network for privacy features
- Next.js team for the amazing framework
- All contributors and supporters

---

Built with 💚 for a sustainable future | OneCarbon Team
