'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Moon, Bell, Shield, User, Save } from 'lucide-react';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({ email: true, score: true, jobs: true, interview: false });
  const [privacy, setPrivacy]             = useState({ public: false, analytics: true });

  return (
    <div className="space-y-6 pb-8 max-w-2xl">
      <h2 className="text-xl font-bold" style={{ fontFamily:'Syne,sans-serif', color:'#FFFFFF' }}>Settings</h2>

      {[
        {
          icon: Bell, title: 'Notifications',
          items: [
            { key:'email',     label:'Email digests',          desc:'Weekly performance summary', val: notifications.email,     set: (v:boolean) => setNotifications(n=>({...n,email:v})) },
            { key:'score',     label:'Score updates',          desc:'When readiness score changes', val: notifications.score,     set: (v:boolean) => setNotifications(n=>({...n,score:v})) },
            { key:'jobs',      label:'New job matches',        desc:'When new recommended jobs appear', val: notifications.jobs,  set: (v:boolean) => setNotifications(n=>({...n,jobs:v})) },
            { key:'interview', label:'Interview reminders',    desc:'Reminder to practice weekly', val: notifications.interview, set: (v:boolean) => setNotifications(n=>({...n,interview:v})) },
          ],
        },
        {
          icon: Shield, title: 'Privacy',
          items: [
            { key:'public',    label:'Public profile',         desc:'Allow faculty to view your profile', val: privacy.public,    set: (v:boolean) => setPrivacy(p=>({...p,public:v})) },
            { key:'analytics', label:'Share analytics data',   desc:'Improve CIP with anonymized data',   val: privacy.analytics, set: (v:boolean) => setPrivacy(p=>({...p,analytics:v})) },
          ],
        },
      ].map(section => (
        <div key={section.title} className="rounded-2xl border overflow-hidden"
          style={{ background:'#0A0A0A', borderColor:'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor:'rgba(255,255,255,0.06)' }}>
            <section.icon size={15} style={{ color:'#818CF8' }} />
            <h3 className="font-semibold text-sm" style={{ color:'#FFFFFF' }}>{section.title}</h3>
          </div>
          <div className="divide-y">
            {section.items.map(item => (
              <div key={item.key} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium" style={{ color:'#FFFFFF' }}>{item.label}</p>
                  <p className="text-xs" style={{ color:'#71717A' }}>{item.desc}</p>
                </div>
                <button onClick={() => item.set(!item.val)}
                  className="relative w-11 h-6 rounded-full transition-all flex-shrink-0"
                  style={{ background: item.val ? 'linear-gradient(135deg,#4F46E5,#06B6D4)' : 'rgba(255,255,255,0.1)' }}>
                  <div className="absolute w-5 h-5 rounded-full bg-white top-0.5 transition-all"
                    style={{ left: item.val ? '22px' : '2px', boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button onClick={() => toast.success('Settings saved!')}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
        style={{ background:'linear-gradient(135deg,#4F46E5,#06B6D4)', color:'#fff' }}>
        <Save size={14} /> Save Settings
      </button>
    </div>
  );
}
