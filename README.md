<div align="center">
  <p align="center">
    <img src="/public/favicon.png" alt="GitProof Logo" width="120" />
    <h1>GitProof</h1>
    <p>Transform your GitHub activity into recruiter-ready proof of work</p>
    <a href="https://gitproof.vercel.app" target="_blank">
      <img src="https://img.shields.io/badge/Visit-GitProof-000000?style=for-the-badge&logo=vercel" alt="Visit GitProof" />
    </a>
  </p>
</div>

## 🚀 Features

- **GitHub Analytics Dashboard**: Get detailed insights into your GitHub activity, commit patterns, and project impact
- **AI-Powered Analysis**: Automated analysis of your repositories with intelligent insights
- **Professional PDF Export**: Generate beautiful, recruiter-ready reports with one click
- **Tech Stack Visualization**: Showcase your technical expertise with interactive visualizations
- **Documentation Analysis**: AI-powered README analysis and improvement suggestions
- **Private & Secure**: Read-only access to your public repositories, your code stays private

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with GitHub OAuth
- **Data Visualization**: Chart.js, React Chart.js 2
- **PDF Generation**: jsPDF, html2canvas
- **Markdown Processing**: React Markdown, Remark GFM
- **AI Integration**: Google Generative AI
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- GitHub OAuth App credentials
- Google Generative AI API Key (for AI features)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/bgar324/gitproof.git
   cd gitproof
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn
   ```

3. Set up environment variables
   Create a `.env.local` file in the root directory and add the following:
   ```env
   GITHUB_ID=your_github_oauth_app_id
   GITHUB_SECRET=your_github_oauth_app_secret
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   GOOGLE_AI_API_KEY=your_google_ai_api_key
   ```

4. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📊 Features in Detail

### Dashboard
- View your GitHub repositories with detailed statistics
- Track your coding activity and contributions
- Analyze your tech stack and language usage

### AI Insights
- Get personalized developer insights
- Receive skill evolution analysis
- Understand your growth as a developer

### Export Options
- Generate professional PDF reports
- Customize report content
- Export as single-page resume or detailed portfolio

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework for Production
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Chart.js](https://www.chartjs.org/) - Simple yet flexible JavaScript charting
- [jsPDF](https://github.com/parallax/jsPDF) - Client-side JavaScript PDF generation
- [Google Generative AI](https://ai.google.dev/) - For AI-powered insights

## 📞 Contact

Benjamin Garcia (https://www.linkedin.com/in/btgarcia05) - bentgarcia05@gmail.com

Project Link: [https://github.com/bgar324/gitproof](https://github.com/bgar324/gitproof)

## Show your support

Give a ⭐️ if this project helped you!

---

<div align="center">
  Made with ❤️ by Benjamin Garcia
</div>
