import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('contact_messages').insert([
      {
        name: form.name,
        email: form.email,
        message: form.message,
      },
    ]);

    setLoading(false);

    if (error) {
      toast.error('Failed to send message 😢');
    } else {
      toast.success('Message sent successfully 🚀');
      setForm({ name: '', email: '', message: '' });
    }
  };

  return (
    <section className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white pt-32">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Get in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
              Touch
            </span>
          </h1>
          <p className="mt-4 text-slate-400 text-lg max-w-2xl mx-auto">
            Have a question, feedback, or need help?  
            We’d love to hear from you.
          </p>
        </div>

        {/* Content */}
        <div className="grid md:grid-cols-2 gap-12">

          {/* Left Info */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <Mail className="text-blue-500 mt-1" />
              <div>
                <h3 className="text-xl font-semibold">Email</h3>
                <p className="text-slate-400">support@omnidash.ai</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Phone className="text-purple-500 mt-1" />
              <div>
                <h3 className="text-xl font-semibold">Phone</h3>
                <p className="text-slate-400">+91 98765 43210</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <MapPin className="text-pink-500 mt-1" />
              <div>
                <h3 className="text-xl font-semibold">Location</h3>
                <p className="text-slate-400">India · Remote First</p>
              </div>
            </div>

            <div className="relative mt-10 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 blur-xl rounded-2xl" />
              <p className="relative text-slate-300">
                We usually respond within{' '}
                <span className="font-semibold text-white">24 hours</span>.
              </p>
            </div>
          </div>

          {/* Right Form */}
          <form
            onSubmit={handleSubmit}
            className="relative p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-6"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 blur-xl rounded-3xl" />

            <div className="relative">
              <label className="block text-sm text-slate-400 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <label className="block text-sm text-slate-400 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="relative">
              <label className="block text-sm text-slate-400 mb-1">Message</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={4}
                placeholder="Tell us how we can help..."
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full flex items-center justify-center gap-2 py-3 rounded-xl
              bg-gradient-to-r from-blue-600 to-purple-600 font-semibold text-lg
              hover:scale-[1.02] transition disabled:opacity-60"
            >
              {loading ? 'Sending...' : (
                <>
                  <Send size={18} />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
