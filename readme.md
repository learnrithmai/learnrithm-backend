<img src="./public/Learnrithm.png" alt="Learnrithm Logo" width="50" height="50">
# Learnrithm Backend  
**A scalable and future-proof backend for Learnrithm, integrating AI-generated learning tools, centralized dashboard, and modern web technologies for seamless learning experiences.**

---

## 🚀 Features  
- **Centralized Dashboard**: Manage AI Teacher and AI Quiz in one place for a smooth learning journey.  
- **AI-Powered Content Generation**: Using OpenAI for quizzes and course content.  
- **Multi-language Support**: DeepL and next-i18next for accurate translations.  
- **Real-time Collaboration**: Socket.IO for live updates and collaborative features.  
- **File Management**: Cloudinary and Azure Blob Storage for PDFs and media.  
- **Secure & Scalable Architecture**: Node.js with Express, TypeScript, and Prisma ORM.  

---

## 🛠️ Tech Stack  

### **Backend**  
- **Framework**: Node.ts with Express.ts
- **Language**: TypeScript  
- **Database**: MongoDB with Prisma ORM  
- **Authentication**: NextAuth.js with JWT for secure user sessions  
- **API**: REST API documented with Swagger  
- **Real-time Features**: Socket.IO  
- **PDF Processing & AI Models**: LangChain, OpenAI API, DeepL API  
- **File Storage**: Cloudinary

### **DevOps & Infrastructure**  
- **Hosting**: Railway (Backend)  
- **Containerization**: Docker  
- **CI/CD**: GitHub Actions  
- **Monitoring**: Google Analytics  

---

## 📂 Project Structure  

```
/learnrithm-backend
  ├── /src
  │   ├── /config       # Configuration files (env, constants)
  │   ├── /controllers  # Business logic
  │   ├── /middlewares  # Middleware (auth, error handling)
  │   ├── /models       # Database models (Prisma schema)
  │   ├── /routes       # API routes
  │   ├── /services     # Service layer (external APIs, business services)
  │   ├── /utils        # Helper functions
  │   └── server.ts     # Entry point
  ├── .env              # Environment variables
  ├── .gitignore        # Ignore unnecessary files
  ├── package.json      # Dependencies and scripts
  └── tsconfig.json     # TypeScript configuration
```

---

## 🔧 Installation & Setup  

1. **Clone the repository**  
   ```bash
   git clone https://github.com/your-username/learnrithm-backend.git
   cd learnrithm-backend
   ```

2. **Install dependencies**  
   ```bash
   npm install
   ```

3. **Set up environment variables**  
   Create a `.env` file in the root directory and configure it with your variables:  
   ```
   PORT=5000
   DATABASE_URL=your-database-url
   ```

4. **Run the development server**  
   ```bash
   npm run dev
   ```

5. **Build for production**  
   ```bash
   npm run build
   ```

---

## 📖 API Documentation  
API documentation is available via Swagger. Once the server is running, visit:  
```
http://localhost:5000/api-docs
```

---

## 🧪 Testing  
```bash
npm run test
```

---

## 🛡️ Security Best Practices  
- Use **HTTPS** in production.  
- Store sensitive information in environment variables.  
- Implement rate limiting and input validation.  

---

## 📄 License  
This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.  