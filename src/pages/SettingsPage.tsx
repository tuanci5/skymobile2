import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  ShieldCheck, 
  Cpu, 
  Key, 
  Globe, 
  Info,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { settingService } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({
    ai_api_key: '',
    ai_endpoint: 'https://api.openai.com/v1/chat/completions',
    ai_model: 'gpt-3.5-turbo',
    app_name: 'Sky Mobile Dashboard',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await settingService.getAll();
      setSettings(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await settingService.save(settings);
      setMessage({ type: 'success', text: 'Đã lưu cài đặt thành công!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Không thể lưu cài đặt.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Cài đặt hệ thống</h1>
        </div>
        <p className="text-slate-500">Cấu hình tham số AI, API và các thiết lập chung cho toàn bộ ứng dụng.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* AI Configuration Section */}
        <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-800">Cấu hình AI (Dịch thuật & Trợ lý)</h2>
            </div>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-400" />
                  API Key (OpenAI / OmniRoute)
                </label>
                <input 
                  type="password"
                  value={settings.ai_api_key || ''}
                  onChange={(e) => setSettings({ ...settings, ai_api_key: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="sk-..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-400" />
                  API Endpoint
                </label>
                <input 
                  type="text"
                  value={settings.ai_endpoint || ''}
                  onChange={(e) => setSettings({ ...settings, ai_endpoint: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="https://api.openai.com/v1/chat/completions"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-slate-400" />
                  AI Model
                </label>
                <input 
                  type="text"
                  value={settings.ai_model || ''}
                  onChange={(e) => setSettings({ ...settings, ai_model: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="gpt-3.5-turbo"
                />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 leading-relaxed">
                <p className="font-bold mb-1">Lưu ý về bảo mật:</p>
                Khóa API sẽ được lưu trữ an toàn trong cơ sở dữ liệu và chỉ được sử dụng qua backend proxy. 
                Đảm bảo endpoint cung cấp đúng định dạng Chat Completions của OpenAI.
              </div>
            </div>
          </div>
        </section>

        {/* General App Section */}
        <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-800">Cài đặt chung</h2>
            </div>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Tên ứng dụng</label>
              <input 
                type="text"
                value={settings.app_name || ''}
                onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            {message && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${
                  message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                }`}
              >
                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {message.text}
              </motion.div>
            )}
          </div>
          
          <button 
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 transition-all transform active:scale-95"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu cài đặt
          </button>
        </div>
      </form>
    </div>
  );
};
