'use client';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { CheckCircle2, FileText, GraduationCap, Plus, Save, Upload, User } from 'lucide-react';
import { studentApi } from '@/lib/api';
import { useAppStore } from '@/store';

export default function ProfilePage() {
  const { user, setUser } = useAppStore();
  const [skills, setSkills] = useState<string[]>(user?.skills ?? []);
  const [newSkill, setNewSkill] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'skills' | 'academics'>('personal');

  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      college: user?.college ?? '',
      branch: user?.branch ?? '',
      year: user?.year ?? 3,
      cgpa: user?.cgpa ?? '',
      phone: '',
      linkedin: '',
      github: '',
    },
  });

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF resumes are supported.');
      return;
    }
    setResumeFile(file);
    toast.success('Resume selected. Save to upload.');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    setSkills([...skills, trimmed]);
    setNewSkill('');
  };

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      setUploading(true);
      if (resumeFile) {
        await studentApi.uploadResume(resumeFile);
      }
      await studentApi.updateProfile({ ...data, skills });
      setUser({ ...user!, ...data as object, year: Number(data.year), skills });
      setSaved(true);
      toast.success('Profile updated.');
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toast.error('Profile update failed.');
    } finally {
      setUploading(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'skills', label: 'Skills', icon: GraduationCap },
    { id: 'academics', label: 'Academics', icon: FileText },
  ] as const;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl space-y-6 pb-8">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold"
          style={{ background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color: '#fff', fontFamily: 'Syne,sans-serif' }}
        >
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Syne,sans-serif', color: '#E2E8F0' }}>{user?.name}</h2>
          <p className="text-sm" style={{ color: '#94A3B8' }}>{user?.branch} - {user?.college}</p>
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all"
          style={{ background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color: '#fff' }}
        >
          {saved ? <><CheckCircle2 size={15} /> Saved</> : uploading ? 'Saving...' : <><Save size={15} /> Save Changes</>}
        </button>
      </div>

      <div className="flex gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all"
            style={activeTab === tab.id ? { background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color: '#fff' } : { color: '#94A3B8' }}
          >
            <tab.icon size={14} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'personal' && (
        <div className="space-y-5 rounded-2xl border p-6" style={{ background: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }}>
          <h3 className="font-semibold" style={{ fontFamily: 'Syne,sans-serif', color: '#E2E8F0' }}>Personal Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Aryan Sharma' },
              { name: 'email', label: 'Email', type: 'email', placeholder: 'you@college.edu' },
              { name: 'college', label: 'College', type: 'text', placeholder: 'RGPV University' },
              { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+91 9876543210' },
              { name: 'linkedin', label: 'LinkedIn URL', type: 'url', placeholder: 'linkedin.com/in/aryan' },
              { name: 'github', label: 'GitHub URL', type: 'url', placeholder: 'github.com/aryan' },
            ].map((field) => (
              <div key={field.name}>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: '#94A3B8' }}>{field.label}</label>
                <input
                  {...register(field.name as 'name')}
                  type={field.type}
                  placeholder={field.placeholder}
                  className="w-full rounded-xl border px-4 py-2.5 text-sm"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#E2E8F0' }}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: '#94A3B8' }}>Branch</label>
              <select
                {...register('branch')}
                className="w-full rounded-xl border px-4 py-2.5 text-sm"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#E2E8F0' }}
              >
                {['CSE', 'IT', 'ECE', 'ME', 'CE', 'MCA'].map((branch) => <option key={branch} value={branch}>{branch}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: '#94A3B8' }}>Year</label>
              <select
                {...register('year')}
                className="w-full rounded-xl border px-4 py-2.5 text-sm"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#E2E8F0' }}
              >
                {[1, 2, 3, 4].map((year) => <option key={year} value={year}>Year {year}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: '#94A3B8' }}>CGPA</label>
              <input
                {...register('cgpa')}
                type="number"
                step="0.01"
                min="0"
                max="10"
                className="w-full rounded-xl border px-4 py-2.5 text-sm"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#E2E8F0' }}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium" style={{ color: '#94A3B8' }}>Resume (PDF)</label>
            <div
              {...getRootProps()}
              className="cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all"
              style={{
                borderColor: isDragActive ? '#4F46E5' : 'rgba(255,255,255,0.1)',
                background: isDragActive ? 'rgba(79,70,229,0.08)' : 'rgba(255,255,255,0.02)',
              }}
            >
              <input {...getInputProps()} />
              <Upload size={28} className="mx-auto mb-3" style={{ color: isDragActive ? '#818CF8' : '#64748B' }} />
              {resumeFile ? (
                <p className="text-sm font-medium" style={{ color: '#4ADE80' }}>{resumeFile.name}</p>
              ) : (
                <p className="text-sm" style={{ color: '#94A3B8' }}>Drop your PDF here, or browse</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'skills' && (
        <div className="space-y-5 rounded-2xl border p-6" style={{ background: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }}>
          <h3 className="font-semibold" style={{ fontFamily: 'Syne,sans-serif', color: '#E2E8F0' }}>Technical Skills</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium"
                style={{ background: 'rgba(79,70,229,0.12)', borderColor: 'rgba(79,70,229,0.3)', color: '#818CF8' }}
              >
                {skill}
                <button type="button" onClick={() => setSkills(skills.filter((item) => item !== skill))} className="ml-1 text-base leading-none">
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newSkill}
              onChange={(event) => setNewSkill(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), addSkill())}
              placeholder="Add a skill"
              className="flex-1 rounded-xl border px-4 py-2.5 text-sm"
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#E2E8F0' }}
            />
            <button
              type="button"
              onClick={addSkill}
              className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color: '#fff' }}
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
      )}

      {activeTab === 'academics' && (
        <div className="rounded-2xl border p-6" style={{ background: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-semibold" style={{ fontFamily: 'Syne,sans-serif', color: '#E2E8F0' }}>Academic Snapshot</h3>
            <span className="rounded-xl px-3 py-1 text-sm" style={{ background: 'rgba(34,197,94,0.12)', color: '#4ADE80' }}>
              CGPA: {user?.cgpa ?? 'Not added'}
            </span>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-sm leading-6" style={{ color: '#94A3B8' }}>
              Keep your branch, year, and CGPA updated here so readiness scoring and job recommendations stay tied to your real profile.
            </p>
          </div>
        </div>
      )}
    </form>
  );
}
