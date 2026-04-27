import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Music as MusicIcon, 
  FileText as FileTextIcon, 
  BarChart as BarChartIcon, 
  Sparkles as SparklesIcon, 
  Terminal as TerminalIcon, 
  CheckCircle as CheckCircleIcon,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './V2Page.css';

const categories = [
  {
    id: 'image-tools',
    title: 'Image Studio',
    icon: <ImageIcon size={24} />,
    description: 'Advanced computer vision tools for high-fidelity image editing and batch optimization.',
    tools: ['Background Remover', 'Batch Converter', 'AI Upscaler', 'AVIF Optimizer'],
    link: '/image-tools'
  },
  {
    id: 'video-engine',
    title: 'Video Engine',
    icon: <VideoIcon size={24} />,
    description: 'Enterprise-grade video processing with AI-driven transcription and enhancement.',
    tools: ['Whisper Auto-Caption', 'Screen Recorder', 'AI Enhancer', '4K Downscaler'],
    link: '#'
  },
  {
    id: 'audio-suite',
    title: 'Audio Suite',
    icon: <MusicIcon size={24} />,
    description: 'Studio-quality audio tools featuring neural voice cloning and professional noise reduction.',
    tools: ['Speech-to-Text', 'AI Voice Cloner', 'Format Converter', 'Noise Reducer'],
    link: '#'
  },
  {
    id: 'document-center',
    title: 'Document Center',
    icon: <FileTextIcon size={24} />,
    description: 'Comprehensive document management with intelligent OCR and multi-format conversion.',
    tools: ['PDF Merge/Split', 'OCR Searchable PDF', 'Kindle Converter', 'Digital Signer'],
    link: '/pdf-tools'
  },
  {
    id: 'data-analytics',
    title: 'Data & Analytics',
    icon: <BarChartIcon size={24} />,
    description: 'Powerful data transformation utilities designed for scale and precision.',
    tools: ['Spreadsheet Tools', 'Markdown Suite', 'CSV Connector', 'Duplicate Finder'],
    link: '#'
  },
  {
    id: 'ai-content',
    title: 'AI Content',
    icon: <SparklesIcon size={24} />,
    description: 'Next-generation content ideation and drafting powered by local language models.',
    tools: ['Local LLM Drafting', 'SEO Meta Generator', 'Grammar Pro', 'Content Briefs'],
    link: '#'
  },
  {
    id: 'developer-core',
    title: 'Developer Core',
    icon: <TerminalIcon size={24} />,
    description: 'Mission-critical utilities for engineering productivity and debugging.',
    tools: ['JSON/YAML Formatter', 'Regex Engine', 'Diff Viewer', 'Binary Editor'],
    link: '#'
  },
  {
    id: 'productivity',
    title: 'Productivity',
    icon: <CheckCircleIcon size={24} />,
    description: 'Streamlined tools to optimize your workflow and task management efficiency.',
    tools: ['Expense Tracker', 'Kanban Board', 'Pomodoro Timer', 'Invoice Engine'],
    link: '#'
  }
];

function V2Page() {
  const [search, setSearch] = useState('');

  const filtered = categories.filter(cat => 
    cat.title.toLowerCase().includes(search.toLowerCase()) ||
    cat.tools.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="v2-container">
      <header className="v2-hero">
        <span className="hero-tag">Privacy-First Computing</span>
        <h1 className="v2-hero-title">Your Workspace,<br />Supercharged.</h1>
        <p className="v2-hero-subtitle">
          Experience the next generation of professional utilities. All tools run locally in your browser—no trackers, no cloud, no friction.
        </p>

        <div className="v2-search-box">
          <Search className="v2-search-icon" size={20} />
          <input 
            type="text" 
            className="v2-search-input" 
            placeholder="Search across 100+ professional tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <main className="v2-content">
        <div className="v2-grid">
          {filtered.map((cat, index) => (
            <Link to={cat.link} key={index} style={{textDecoration: 'none', color: 'inherit'}}>
                <div className="v2-card">
                  <div className="v2-icon-box">
                    {cat.icon}
                  </div>
                  <h3 className="v2-card-title">{cat.title}</h3>
                  <p className="v2-card-desc">{cat.description}</p>
                  <div className="v2-tool-tags">
                    {cat.tools.map((t, i) => (
                      <span className="v2-tag" key={i}>{t}</span>
                    ))}
                  </div>
                </div>
            </Link>
          ))}
        </div>
      </main>

      <footer style={{
        marginTop: '4rem', padding: '4rem 8%', 
        borderTop: '1px solid var(--border)',
        textAlign: 'center', opacity: 0.6, fontSize: '0.9rem'
      }}>
        <p>© 2026 OpenTools Collective. All rights reserved.</p>
        <p style={{marginTop: '0.5rem'}}>Open Source under MIT License. Powered by local-first AI.</p>
      </footer>
    </div>
  );
}

export default V2Page;
