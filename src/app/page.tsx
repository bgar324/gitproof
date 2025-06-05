import GitHubSignIn from "./components/GitHubSignIn";
import Header from "./components/Header";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Code,
  FileText,
  GitBranch,
  Github,
  GitMerge,
  LayoutDashboard,
  Zap,
} from "lucide-react";
import "./globals.css";

const features = [
  {
    icon: <LayoutDashboard className="w-6 h-6 text-orange-500" />,
    title: "Comprehensive Analytics",
    description:
      "Get detailed insights into your GitHub activity, commit patterns, and project impact.",
  },
  {
    icon: <FileText className="w-6 h-6 text-orange-500" />,
    title: "Automated README Analysis",
    description:
      "Let AI analyze and enhance your project documentation for better visibility.",
  },
  {
    icon: <GitMerge className="w-6 h-6 text-orange-500" />,
    title: "Stack Breakdown",
    description:
      "Showcase your technical expertise with a clear breakdown of your tech stack.",
  },
  {
    icon: <Code className="w-6 h-6 text-orange-500" />,
    title: "Exportable Reports",
    description:
      "Generate professional PDF reports to share with recruiters or include in your portfolio.",
  },
];

const faqs = [
  {
    question: "How does Git Proof analyze my repositories?",
    answer:
      "Git Proof uses GitHub's API to analyze your public repositories, examining commit history, code structure, and documentation to generate meaningful insights.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We only request read-only access to your public repositories and never store your code. Your privacy is our priority.",
  },
  {
    question: "Can I customize the generated reports?",
    answer:
      "Yes! Our report generator allows you to select which repositories to include and customize the content before exporting.",
  },
  {
    question: "Is there a limit to the number of repositories I can analyze?",
    answer:
      "Free accounts can analyze up to 10 repositories. For unlimited analysis, consider upgrading to our Pro plan.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-6">
        {/* Hero Section */}
        <section
          id="home"
          className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
        >
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 font-reckless">
              Proof of work,
              <br />
              <span className="italic">without</span> the guesswork
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your GitHub activity into recruiter-ready proof.
              Showcase your skills with beautiful, data-driven reports that
              highlight your real impact.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4">
              <div className="flex flex-row gap-2 mx-auto">
                <GitHubSignIn />
                <a
                  href="#problem"
                  className="group relative flex items-center justify-center gap-3 rounded-lg bg-white hover:bg-gray-50 px-8 py-4 text-black text-lg font-medium transition-all hover:shadow-lg hover:-translate-y-0.5 font-reckless border"
                >
                  {/* <svg
                    className="w-6 h-6"
                    viewBox="0 0 98 96"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill="white"
                      d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
                    />
                  </svg> */}
                  Learn More
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1">
                    →
                  </div>
                </a>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 underline">
                Your data stays private. We only access public repositories.
              </p>
            </div>
          </div>

          <div className="mt-16 max-w-5xl mx-auto rounded-xl overflow-hidden shadow-2xl border border-gray-200">
            <Image
              src="/dashboard.png"
              alt="GitProof Dashboard"
              width={1920}
              height={1080}
              className="w-full h-auto"
              priority
            />
          </div>
        </section>

        {/* Problem Section */}
        <section id="problem" className="py-20 bg-gray-50 rounded-3xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 font-reckless">
                The Problem
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Your code tells a story, but it's buried in repositories.
                Recruiters and hiring managers don't have time to dig through
                your GitHub to understand your skills and contributions.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                "Your best work is hidden in commit histories",
                "Technical skills aren't easily quantifiable",
                "Documentation quality is hard to showcase",
              ].map((problem) => (
                <div
                  key={problem}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-orange-100 rounded-full p-2">
                      <Zap className="h-5 w-5 text-orange-600" />
                    </div>
                    <p className="ml-3 text-lg font-medium text-gray-900">
                      {problem}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="solution" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 font-reckless">
                How Git Proof Works
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We analyze your GitHub activity to create beautiful, data-driven
                reports that showcase your skills.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
                >
                  <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-black text-white py-20 rounded-3xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-3 font-reckless">
              Ready to showcase your work?
            </h2>
            <p className="text-lg mb-8 max-w-3xl mx-auto">
              Join thousands of developers who are making their work visible and
              quantifiable.
            </p>
            <GitHubSignIn />
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 font-reckless">
                Frequently Asked Questions
              </h2>
              <p className="text-base text-gray-600">
                Everything you need to know about Git Proof
              </p>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* Footer */}
        <footer className="bg-black text-white py-12 rounded-t-3xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-2">
                  <Image
                    src="/gitprooffavicon.png"
                    alt="GitProof"
                    width={32}
                    height={32}
                    className="h-8 w-auto"
                  />
                  <span className="text-xl font-bold font-reckless">
                    Git Proof
                  </span>
                </div>
                <p className="mt-4 text-gray-400">
                  Transforming GitHub activity into recruiter-ready proof of
                  work.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider font-reckless">
                  Product
                </h3>
                <div className="mt-4 space-y-3">
                  <a
                    href="#features"
                    className="text-gray-400 hover:text-white block"
                  >
                    Features
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white block">
                    Pricing
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white block">
                    Documentation
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider font-reckless">
                  Company
                </h3>
                <div className="mt-4 space-y-3">
                  <a href="#" className="text-gray-400 hover:text-white block">
                    About
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white block">
                    Blog
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white block">
                    Careers
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider font-reckless">
                  Legal
                </h3>
                <div className="mt-4 space-y-3">
                  <a href="#" className="text-gray-400 hover:text-white block">
                    Privacy
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white block">
                    Terms
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white block">
                    Cookie Policy
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-800">
              <p className="text-center text-gray-400 text-sm">
                &copy; {new Date().getFullYear()}{" "}
                <span className="font-reckless">Git Proof.</span> All rights
                reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
