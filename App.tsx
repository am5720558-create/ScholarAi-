import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ViewState, ChatMessage, QuizQuestion } from './types';
import { SUBJECTS_LIST, BOARDS, CLASSES, GOALS, NOTE_OPTIONS } from './constants';
import * as GeminiService from './services/geminiService';
import MarkdownRenderer from './components/MarkdownRenderer';

// Icons
const Icons = {
  BookOpen: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 4.168 6.253v13C4.168 19.977 5.754 20.334 7.5 20.334s3.332-.356 3.332-1.08V6.253zm0 0c1.168-.776 2.754-1.253 4.5-1.253s3.332.477 3.332 1.253v13c0 .724-1.59 1.08-3.332 1.08s-3.332-.356-3.332-1.08V6.253z" /></svg>,
  Chat: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
  ClipboardCheck: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  Calendar: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Upload: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  Sparkles: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  ChevronLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
};

const App: React.FC = () => {
  // State
  const [view, setView] = useState<ViewState>('LANDING');
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // -- Load user from local storage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('scholar_ai_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setView('DASHBOARD');
      }
    } catch (e) {
      console.error("Failed to load user", e);
    }
  }, []);

  // -- Navigation Handler
  const navigateTo = (v: ViewState) => setView(v);

  // -- Render Views
  if (view === 'LANDING') return <LandingPage onStart={() => setView('ONBOARDING')} onLogin={() => setView('ONBOARDING')} />; // Simplified login flow
  if (view === 'ONBOARDING') return <OnboardingPage onComplete={(u) => { setUser(u); localStorage.setItem('scholar_ai_user', JSON.stringify(u)); setView('DASHBOARD'); }} />;
  if (!user) return <LandingPage onStart={() => setView('ONBOARDING')} onLogin={() => setView('ONBOARDING')} />; // Fallback

  // Wrapper logic for scroll vs fixed layout
  // We use h-dvh (dynamic viewport height) to handle mobile browser address bars better than h-screen
  const isChat = view === 'CHAT';

  return (
    <div className="h-screen h-[100dvh] bg-gray-50 flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden bg-white p-4 shadow-sm flex items-center justify-between shrink-0 z-20">
        <span className="font-bold text-xl text-brand-600 flex items-center gap-1"><Icons.Sparkles /> ScholarAI</span>
        <div className="text-sm font-medium text-gray-600">Hi, {user.name.split(' ')[0]}</div>
      </div>

      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r h-full shrink-0">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-brand-600 flex items-center gap-2">
            <Icons.Sparkles /> ScholarAI
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <SidebarItem active={view === 'DASHBOARD'} onClick={() => navigateTo('DASHBOARD')} icon={<Icons.ClipboardCheck />} label="Dashboard" />
          <SidebarItem active={view === 'NOTES'} onClick={() => navigateTo('NOTES')} icon={<Icons.BookOpen />} label="Notes Generator" />
          <SidebarItem active={view === 'CHAT'} onClick={() => navigateTo('CHAT')} icon={<Icons.Chat />} label="Ask AI Tutor" />
          <SidebarItem active={view === 'PRACTICE'} onClick={() => navigateTo('PRACTICE')} icon={<Icons.ClipboardCheck />} label="Practice Zone" />
          <SidebarItem active={view === 'PLANNER'} onClick={() => navigateTo('PLANNER')} icon={<Icons.Calendar />} label="Study Planner" />
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
               {user.name[0]}
             </div>
             <div>
               <p className="text-sm font-medium">{user.name}</p>
               <p className="text-xs text-gray-500">{user.classLevel}th Grade</p>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* 
            Conditional Layout:
            For CHAT: We want a fixed container so the chat component handles its own internal scroll.
            For OTHERS: We want the page to scroll normally.
        */}
        <div className={`flex-1 ${isChat ? 'overflow-hidden flex flex-col' : 'overflow-y-auto p-4 md:p-8 scroll-smooth'}`}>
            {view !== 'DASHBOARD' && !isChat && (
            <button onClick={() => navigateTo('DASHBOARD')} className="md:hidden mb-4 flex items-center text-gray-600 hover:text-brand-600">
                <Icons.ChevronLeft /> Back to Dashboard
            </button>
            )}
            
            {view === 'DASHBOARD' && <Dashboard user={user} onNavigate={navigateTo} />}
            {view === 'NOTES' && <NotesGenerator user={user} />}
            {view === 'CHAT' && (
                <div className="h-full flex flex-col">
                     <button onClick={() => navigateTo('DASHBOARD')} className="md:hidden mb-2 p-4 pb-0 flex items-center text-gray-600 hover:text-brand-600 shrink-0">
                        <Icons.ChevronLeft /> Back to Dashboard
                    </button>
                    <div className="flex-1 overflow-hidden p-4 md:p-8 pt-0">
                        <DoubtSolver user={user} />
                    </div>
                </div>
            )}
            {view === 'PRACTICE' && <PracticeZone user={user} />}
            {view === 'PLANNER' && <StudyPlanner user={user} />}
        </div>
      </main>
    </div>
  );
};

// --- Sub-Components ---

const SidebarItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${active ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
  >
    {icon}
    {label}
  </button>
);

const LandingPage: React.FC<{ onStart: () => void; onLogin: () => void }> = ({ onStart, onLogin }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-6 overflow-y-auto">
    <div className="max-w-2xl w-full">
      <div className="mb-6 flex justify-center text-brand-600">
        <Icons.BookOpen />
      </div>
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
        Your Personal <span className="text-brand-600">AI Study Assistant</span>
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
        Master your CBSE, ICSE, or State Board exams with personalized AI notes, instant doubt solving, and smart study planning.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button onClick={onStart} className="px-8 py-4 bg-brand-600 text-white rounded-xl font-semibold shadow-lg hover:bg-brand-700 transition transform hover:-translate-y-1">
          Get Started for Free
        </button>
        <button onClick={onLogin} className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition">
          I already have an account
        </button>
      </div>
      <div className="mt-12 grid grid-cols-3 gap-4 text-sm text-gray-500">
        <div>✨ Smart Notes</div>
        <div>🚀 Instant Doubts</div>
        <div>📅 Study Planner</div>
      </div>
    </div>
  </div>
);

const OnboardingPage: React.FC<{ onComplete: (u: UserProfile) => void }> = ({ onComplete }) => {
  const [formData, setFormData] = useState<Partial<UserProfile>>({ subjects: [] });

  const toggleSubject = (sub: string) => {
    const current = formData.subjects || [];
    if (current.includes(sub)) {
      setFormData({ ...formData, subjects: current.filter(s => s !== sub) });
    } else {
      setFormData({ ...formData, subjects: [...current, sub] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.board && formData.classLevel && formData.goal && formData.subjects?.length) {
      onComplete(formData as UserProfile);
    } else {
      alert("Please fill in all fields.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center overflow-y-auto">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Tell us about you</h2>
          <p className="mt-2 text-sm text-gray-600">We'll personalize your AI assistant based on this.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-500 focus:border-brand-500" 
              onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Board</label>
              <select required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-500 focus:border-brand-500"
                onChange={e => setFormData({...formData, board: e.target.value as any})}>
                <option value="">Select Board</option>
                {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Class</label>
              <select required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-500 focus:border-brand-500"
                onChange={e => setFormData({...formData, classLevel: e.target.value as any})}>
                <option value="">Select Class</option>
                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subjects (Select multiple)</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-2 rounded-md">
              {SUBJECTS_LIST.map(sub => (
                <label key={sub} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" className="rounded text-brand-600 focus:ring-brand-500"
                    checked={formData.subjects?.includes(sub)}
                    onChange={() => toggleSubject(sub)}
                  />
                  <span className="text-sm text-gray-700">{sub}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Primary Goal</label>
            <select required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-500 focus:border-brand-500"
                onChange={e => setFormData({...formData, goal: e.target.value as any})}>
                <option value="">Select Goal</option>
                {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
          </div>

          <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500">
            Start Learning
          </button>
        </form>
      </div>
    </div>
  );
}

const Dashboard: React.FC<{ user: UserProfile; onNavigate: (v: ViewState) => void }> = ({ user, onNavigate }) => {
  const primarySubject = user.subjects && user.subjects.length > 0 ? user.subjects[0] : 'General';
  
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Hello, {user.name}! 👋</h1>
        <p className="opacity-90">Ready to crush your {user.classLevel}th grade goals today?</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Create Notes', icon: <Icons.BookOpen />, action: () => onNavigate('NOTES'), color: 'bg-blue-100 text-blue-700' },
          { label: 'Ask Doubt', icon: <Icons.Chat />, action: () => onNavigate('CHAT'), color: 'bg-green-100 text-green-700' },
          { label: 'Practice', icon: <Icons.ClipboardCheck />, action: () => onNavigate('PRACTICE'), color: 'bg-purple-100 text-purple-700' },
          { label: 'My Plan', icon: <Icons.Calendar />, action: () => onNavigate('PLANNER'), color: 'bg-orange-100 text-orange-700' },
        ].map((item, idx) => (
          <button key={idx} onClick={item.action} className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
            <div className={`p-3 rounded-full mb-3 ${item.color}`}>{item.icon}</div>
            <span className="font-semibold text-gray-800">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Focus Area */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg mb-4">Recommended Focus</h3>
          <div className="flex items-center gap-4 bg-brand-50 p-4 rounded-lg">
            <div className="w-12 h-12 bg-brand-200 text-brand-700 rounded-lg flex items-center justify-center font-bold text-xl">
              {primarySubject[0]}
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{primarySubject}</h4>
              <p className="text-sm text-gray-600">Continue where you left off</p>
            </div>
          </div>
        </div>
        
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg mb-4">Quick Tip</h3>
           <p className="text-gray-600 italic">"Consistency is key. Even 20 minutes a day is better than 5 hours once a week."</p>
        </div>
      </div>
    </div>
  );
}

const NotesGenerator: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ mimeType: string, data: string, name: string } | null>(null);
  const [option, setOption] = useState<'short' | 'detailed' | 'exam'>('detailed');
  const [generatedNotes, setGeneratedNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            // Remove data url prefix (e.g., "data:image/png;base64,")
            const base64Data = base64String.split(',')[1];
            setSelectedFile({
                mimeType: file.type,
                data: base64Data,
                name: file.name
            });
        };
        reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!inputText && !selectedFile) return;
    setLoading(true);
    const result = await GeminiService.generateNotes(inputText, selectedFile ? { mimeType: selectedFile.mimeType, data: selectedFile.data } : null, option, user);
    setGeneratedNotes(result);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-gray-800">AI Notes Generator</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
           {/* Controls */}
           <div className="bg-white p-4 rounded-xl shadow-sm border space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Note Style</label>
               <div className="space-y-2">
                 {NOTE_OPTIONS.map(opt => (
                   <button
                     key={opt.type}
                     onClick={() => setOption(opt.type as any)}
                     className={`w-full text-left p-3 rounded-lg border text-sm transition ${option === opt.type ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 hover:bg-gray-50'}`}
                   >
                     <div className="font-semibold">{opt.label}</div>
                     <div className="text-xs opacity-75">{opt.description}</div>
                   </button>
                 ))}
               </div>
             </div>
             
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Material</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition cursor-pointer relative">
                    <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="flex flex-col items-center text-gray-500">
                        <Icons.Upload />
                        <span className="text-xs mt-1">{selectedFile ? selectedFile.name : 'Upload PDF or Image'}</span>
                    </div>
                </div>
             </div>

             <button 
                onClick={handleGenerate} 
                disabled={loading || (!inputText && !selectedFile)}
                className={`w-full py-2 px-4 rounded-lg font-semibold text-white shadow-md transition ${loading || (!inputText && !selectedFile) ? 'bg-gray-400' : 'bg-brand-600 hover:bg-brand-700'}`}
             >
               {loading ? 'Generating...' : 'Generate Notes'}
             </button>
           </div>
        </div>

        <div className="md:col-span-2 space-y-4">
            {/* Input Text Area */}
            {!generatedNotes && (
                <textarea 
                    className="w-full h-64 p-4 border rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
                    placeholder="Or paste your text/topic here..."
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                />
            )}

            {/* Result Area */}
            {generatedNotes && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-h-[500px]">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h3 className="font-bold text-gray-800">Generated Notes</h3>
                        <button onClick={() => setGeneratedNotes('')} className="text-sm text-brand-600 hover:text-brand-800">Create New</button>
                    </div>
                    <MarkdownRenderer content={generatedNotes} />
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

const DoubtSolver: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `Hi ${user.name}! I'm your AI Tutor. Ask me anything about ${user.subjects.join(', ')}!`, timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const responseText = await GeminiService.chatWithAI([...messages, userMsg], input, user);
    
    const aiMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between shrink-0">
          <h2 className="font-bold text-gray-800">Ask ScholarAI</h2>
          <span className="text-xs bg-brand-100 text-brand-800 px-2 py-1 rounded-full">Class {user.classLevel}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 ${m.role === 'user' ? 'bg-brand-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
               {m.role === 'model' ? <MarkdownRenderer content={m.text} /> : <p>{m.text}</p>}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-none flex items-center gap-2">
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
             </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 border-t bg-white shrink-0">
        <div className="flex gap-2">
          <input 
            type="text" 
            className="flex-1 border rounded-full px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
            placeholder="Type your doubt here..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} disabled={loading} className="p-2 bg-brand-600 text-white rounded-full hover:bg-brand-700 transition disabled:opacity-50">
             <svg className="w-6 h-6 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

const PracticeZone: React.FC<{ user: UserProfile }> = ({ user }) => {
    const [topic, setTopic] = useState('');
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [answers, setAnswers] = useState<{[key: number]: number}>({});
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleGenerate = async () => {
        if (!topic) return;
        setLoading(true);
        setQuestions([]);
        setAnswers({});
        setSubmitted(false);
        const qs = await GeminiService.generateQuiz(topic, user);
        setQuestions(qs);
        setLoading(false);
    };

    const handleSelect = (qId: number, optIdx: number) => {
        if (submitted) return;
        setAnswers(prev => ({...prev, [qId]: optIdx}));
    };

    const getScore = () => {
        let score = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.correctAnswer) score++;
        });
        return score;
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-0">
            <h2 className="text-2xl font-bold text-gray-800">Practice Zone</h2>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border flex gap-4 items-end">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enter Topic</label>
                    <input 
                        type="text" 
                        placeholder="e.g. Newton's Laws, Trigonometry, Marketing Mix" 
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                    />
                </div>
                <button 
                    onClick={handleGenerate} 
                    disabled={loading || !topic}
                    className="bg-brand-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-brand-700 disabled:bg-gray-300 transition"
                >
                    {loading ? 'Generating...' : 'Start Quiz'}
                </button>
            </div>

            {questions.length > 0 && (
                <div className="space-y-6">
                    {questions.map((q, idx) => (
                        <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border">
                            <div className="flex items-start gap-3 mb-4">
                                <span className="bg-brand-100 text-brand-800 font-bold px-2 py-1 rounded text-sm">Q{idx+1}</span>
                                <h3 className="font-semibold text-gray-800 text-lg">{q.question}</h3>
                            </div>
                            <div className="space-y-2 ml-10">
                                {q.options.map((opt, optIdx) => {
                                    const isSelected = answers[q.id] === optIdx;
                                    const isCorrect = q.correctAnswer === optIdx;
                                    let btnClass = "border-gray-200 hover:bg-gray-50";
                                    
                                    if (submitted) {
                                        if (isCorrect) btnClass = "bg-green-100 border-green-500 text-green-800";
                                        else if (isSelected) btnClass = "bg-red-100 border-red-500 text-red-800";
                                    } else if (isSelected) {
                                        btnClass = "bg-brand-50 border-brand-500 text-brand-800";
                                    }

                                    return (
                                        <button 
                                            key={optIdx}
                                            onClick={() => handleSelect(q.id, optIdx)}
                                            className={`w-full text-left p-3 rounded-lg border transition ${btnClass}`}
                                        >
                                            {opt}
                                        </button>
                                    )
                                })}
                            </div>
                            {submitted && (
                                <div className="mt-4 ml-10 p-3 bg-gray-50 rounded text-sm text-gray-700">
                                    <strong>Explanation:</strong> {q.explanation}
                                </div>
                            )}
                        </div>
                    ))}

                    {!submitted ? (
                        <button 
                            onClick={() => setSubmitted(true)}
                            className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold text-lg hover:bg-brand-700 shadow-lg"
                        >
                            Submit Quiz
                        </button>
                    ) : (
                        <div className="text-center p-6 bg-brand-50 rounded-xl border border-brand-200">
                            <h3 className="text-2xl font-bold text-brand-800">Score: {getScore()} / {questions.length}</h3>
                            <p className="text-brand-600 mt-2">{getScore() === questions.length ? 'Perfect Score! 🎉' : 'Keep practicing! 💪'}</p>
                            <button onClick={() => {setQuestions([]); setTopic(''); setSubmitted(false)}} className="mt-4 text-brand-700 font-semibold hover:underline">Try another topic</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const StudyPlanner: React.FC<{ user: UserProfile }> = ({ user }) => {
    const [hours, setHours] = useState(2);
    const [examDate, setExamDate] = useState('');
    const [plan, setPlan] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!examDate) return;
        setLoading(true);
        const result = await GeminiService.generateStudyPlan(hours, examDate, user);
        setPlan(result);
        setLoading(false);
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-0">
             <h2 className="text-2xl font-bold text-gray-800">Personal Study Planner</h2>
             
             <div className="bg-white p-6 rounded-xl shadow-sm border grid md:grid-cols-3 gap-6 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Study Hours / Day</label>
                    <input 
                        type="number" min="1" max="12" 
                        value={hours} onChange={e => setHours(parseInt(e.target.value))}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Next Exam Date</label>
                    <input 
                        type="date"
                        value={examDate} onChange={e => setExamDate(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                </div>
                <button 
                    onClick={handleCreate} 
                    disabled={loading || !examDate}
                    className="bg-brand-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-brand-700 disabled:bg-gray-300 transition h-10"
                >
                    {loading ? 'Creating Plan...' : 'Generate Plan'}
                </button>
             </div>

             {plan && (
                 <div className="bg-white p-6 rounded-xl shadow-sm border">
                     <h3 className="font-bold text-xl text-gray-800 mb-4 border-b pb-2">Your Strategy</h3>
                     <MarkdownRenderer content={plan} />
                 </div>
             )}
        </div>
    )
}

export default App;