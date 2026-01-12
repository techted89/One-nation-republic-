
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 py-4">
      <button
        className="w-full text-left flex justify-between items-center focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-lg font-semibold text-navy">{question}</span>
        <span className="text-gold text-xl">{isOpen ? '-' : '+'}</span>
      </button>
      {isOpen && <p className="mt-2 text-gray-600">{answer}</p>}
    </div>
  );
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaNum1] = useState(Math.floor(Math.random() * 10));
  const [captchaNum2] = useState(Math.floor(Math.random() * 10));
  const [showPricing, setShowPricing] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(captchaAnswer) === captchaNum1 + captchaNum2) {
      alert('Message sent (Demo)');
    } else {
      alert('Incorrect CAPTCHA');
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      alert(`Welcome to the truth, ${newsletterEmail}. Access granted.`);
      setShowPricing(true);
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-navy text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gold">Unlock Your True Status</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Restoration of the Public. Anchored in sovereignty, trust law, and natural order.
          </p>
          <button
            onClick={() => document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-gold text-navy px-8 py-4 rounded-full text-lg font-bold hover:bg-white hover:text-navy transition duration-300 transform hover:scale-105"
          >
            Take the First Step
          </button>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-navy mb-6">Welcome to One Nation</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            We are a private community of learners, builders, and truth-seekers who recognize that the public world operates on contracts, assumptions, and hidden agreements. Here, we step behind the veil and into the private, where knowledge becomes freedom and clarity becomes power.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            This is a place to study, to question, to test, and to practice the ways of self-governance and responsibility that restore authority to the individual.
          </p>
        </div>
      </section>

      {/* Features/Library Teaser */}
      <section className="py-16 px-4 bg-gray-100">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-navy mb-4">The Lawful Freedom Library 📚✨</h2>
            <p className="text-xl text-gray-600">Access essential writings, templates, and tools.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Trust Law Mastery", desc: "Foundations and application." },
              { title: "Living Sui Juris", desc: "Outside dependency, full capacity." },
              { title: "Private Contracts", desc: "Templates for affidavits and notices." },
              { title: "Spiritual Sovereignty", desc: "Law written on the heart." }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-lg border-t-4 border-gold">
                <h3 className="text-xl font-bold text-navy mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            {!showPricing ? (
              <div className="inline-block bg-white p-8 rounded-lg shadow-xl max-w-md w-full border-t-4 border-navy">
                <h3 className="text-2xl font-bold text-navy mb-4">First Step: Get the Truth</h3>
                <p className="text-gray-600 mb-6">Enter your email to unlock pricing and join the private restoration.</p>
                <form onSubmit={handleNewsletterSubmit}>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    className="w-full border rounded px-4 py-3 mb-4"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                  />
                  <button type="submit" className="bg-navy text-white px-8 py-3 rounded font-bold hover:bg-navy-dark transition w-full">
                    Unlock Access
                  </button>
                </form>
              </div>
            ) : (
              <div className="inline-block bg-navy text-white p-8 rounded-lg shadow-xl">
                <h3 className="text-2xl font-bold text-gold mb-2">Lifetime Access</h3>
                <p className="text-4xl font-bold mb-4">$75</p>
                <button onClick={() => navigate('/register')} className="bg-gold text-navy px-8 py-3 rounded font-bold hover:bg-white transition w-full">
                  Get Your License Key
                </button>
                <p className="mt-2 text-sm text-gray-300">Crypto payments accepted</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quiz Section */}
      <section id="quiz" className="py-16 px-4 bg-navy text-white">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-8 text-gold">The Knowledge Test</h2>
          <div className="bg-navy-dark p-8 rounded-lg border border-gray-700">
            <p className="text-xl mb-6">"Do you know who owns your name?"</p>
            <div className="space-y-4">
              <button onClick={() => navigate('/register')} className="block w-full bg-transparent border-2 border-gold text-gold py-3 rounded hover:bg-gold hover:text-navy transition">
                The State / The Corporation
              </button>
              <button onClick={() => navigate('/register')} className="block w-full bg-transparent border-2 border-gold text-gold py-3 rounded hover:bg-gold hover:text-navy transition">
                I Do (The Living Soul)
              </button>
            </div>
            <p className="mt-6 text-sm text-gray-400">Select an answer to reveal the truth.</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-navy mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-2">
            <FAQItem
              question="What is the main focus of this community?"
              answer="To provide a private, secure space where members can learn and practice sovereignty, trust law, and lawful living."
            />
             <FAQItem
              question="Is this legal?"
              answer="We focus on lawful living and understanding trust law. The goal is practical application and ethical standing."
            />
            <FAQItem
              question="How private is this community?"
              answer="Very private. All discussions and materials remain inside. Members are expected to honor confidentiality."
            />
            <FAQItem
              question="What is a License Key?"
              answer="It is your unique invite code to create a private account. It binds to your identity and device."
            />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-xl">
          <h2 className="text-3xl font-bold text-navy mb-8 text-center">Contact Us</h2>
          <form onSubmit={handleContactSubmit} className="bg-white p-8 rounded-lg shadow-md">
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Name</label>
              <input type="text" className="w-full border rounded px-3 py-2" required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Email</label>
              <input type="email" className="w-full border rounded px-3 py-2" required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Message</label>
              <textarea className="w-full border rounded px-3 py-2 h-32" required></textarea>
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Security Question: What is {captchaNum1} + {captchaNum2}?</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="w-full bg-navy text-white py-3 rounded font-bold hover:bg-navy-dark transition">
              Send Message
            </button>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default LandingPage;
