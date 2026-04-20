'use client';

import Image from 'next/image';
import { useMutation, useQuery } from 'convex/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/convex/_generated/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SelectOption {
  value: string;
  label: string;
}

interface FormSectionProps {
  title: string;
  description: string;
  icon: string;
  children: React.ReactNode;
}

interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  hasError?: boolean;
}

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  options: SelectOption[];
  hasError?: boolean;
}

type PasswordStrength = 'weak' | 'fair' | 'strong';

// ─── Helpers & Static Data ────────────────────────────────────────────────────

const MAX_PROFILE_IMAGE_FILE_BYTES = 700 * 1024;
const MAX_PROFILE_IMAGE_DATA_URL_BYTES = 900 * 1024;
const PROFILE_TOO_LARGE_MESSAGE =
  'รูปโปรไฟล์มีขนาดใหญ่เกินกว่าจะบันทึกได้ กรุณาเลือกภาพที่มีขนาดเล็กกว่า 700 KB';

function getPasswordStrength(pw: string): PasswordStrength | null {
  if (!pw) return null;
  const score = [
    pw.length >= 8,
    /[A-Z]/.test(pw),
    /[a-z]/.test(pw),
    /\d/.test(pw),
    /[^a-zA-Z0-9]/.test(pw),
  ].filter(Boolean).length;
  if (score <= 2) return 'weak';
  if (score <= 3) return 'fair';
  return 'strong';
}

const DEPARTMENTS: SelectOption[] = [
  { value: '', label: 'เลือกแผนก…' },
  { value: 'operations', label: 'ปฏิบัติการ' },
  { value: 'purchasing', label: 'จัดซื้อ' },
  { value: 'finance', label: 'การเงิน' },
  { value: 'management', label: 'บริหาร' },
  { value: 'kitchen', label: 'ครัว / การผลิต' },
  { value: 'other', label: 'อื่น ๆ' },
];

const TIMEZONES: SelectOption[] = [
  { value: 'Asia/Bangkok', label: '(UTC+07:00) กรุงเทพฯ' },
  { value: 'Asia/Singapore', label: '(UTC+08:00) สิงคโปร์' },
  { value: 'Asia/Tokyo', label: '(UTC+09:00) โตเกียว' },
  { value: 'Australia/Sydney', label: '(UTC+11:00) ซิดนีย์' },
  { value: 'Europe/London', label: '(UTC+00:00) ลอนดอน' },
  { value: 'Europe/Paris', label: '(UTC+01:00) ปารีส' },
  { value: 'America/New_York', label: '(UTC-05:00) นิวยอร์ก' },
  { value: 'America/Los_Angeles', label: '(UTC-08:00) ลอสแอนเจลิส' },
];

const LANGUAGES: SelectOption[] = [
  { value: 'en', label: 'อังกฤษ' },
  { value: 'th', label: 'ไทย' },
  { value: 'zh', label: 'จีน' },
  { value: 'ja', label: 'ญี่ปุ่น' },
];

const CURRENCIES: SelectOption[] = [
  { value: 'THB', label: 'THB — บาทไทย (฿)' },
  { value: 'USD', label: 'USD — ดอลลาร์สหรัฐ ($)' },
  { value: 'SGD', label: 'SGD — ดอลลาร์สิงคโปร์ (S$)' },
  { value: 'EUR', label: 'EUR — ยูโร (€)' },
  { value: 'GBP', label: 'GBP — ปอนด์สเตอร์ลิง (£)' },
  { value: 'JPY', label: 'JPY — เยนญี่ปุ่น (¥)' },
];

const DATE_FORMATS: SelectOption[] = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO 8601)' },
];

type CurrentUser = {
  _id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'staff';
  avatarUrl?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  timezone?: string;
  language?: string;
  currency?: string;
  dateFormat?: string;
  createdAt: number;
};

const DEFAULT_PREFERENCES = {
  department: '',
  timezone: 'Asia/Bangkok',
  language: 'th',
  currency: 'THB',
  dateFormat: 'DD/MM/YYYY',
} as const;

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

function getProfileSaveErrorMessage(error: unknown) {
  const rawMessage =
    typeof error === 'object' && error !== null && 'data' in error && typeof error.data === 'string'
      ? error.data
      : error instanceof Error
        ? error.message
        : '';

  if (rawMessage.includes('Value is too large')) {
    return PROFILE_TOO_LARGE_MESSAGE;
  }

  return rawMessage || 'ไม่สามารถบันทึกโปรไฟล์ได้';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const currentUser = useQuery(api.users.me) as CurrentUser | null | undefined;
  const updateProfile = useMutation(api.users.updateProfile);

  const baseProfile = useMemo(() => {
    const names = splitName(currentUser?.name ?? '');
    return {
      avatarSrc: currentUser?.avatarUrl ?? '',
      firstName: names.firstName,
      lastName: names.lastName,
      displayName: currentUser?.name ?? '',
      email: currentUser?.email ?? '',
      phone: currentUser?.phone ?? '',
      jobTitle: currentUser?.jobTitle ?? '',
      department: currentUser?.department ?? DEFAULT_PREFERENCES.department,
      timezone: currentUser?.timezone ?? DEFAULT_PREFERENCES.timezone,
      language: currentUser?.language ?? DEFAULT_PREFERENCES.language,
      currency: currentUser?.currency ?? DEFAULT_PREFERENCES.currency,
      dateFormat: currentUser?.dateFormat ?? DEFAULT_PREFERENCES.dateFormat,
    };
  }, [currentUser]);

  // Identity
  const [avatarSrcOverride, setAvatarSrcOverride] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [firstNameOverride, setFirstNameOverride] = useState<string | null>(null);
  const [lastNameOverride, setLastNameOverride] = useState<string | null>(null);
  const [displayNameOverride, setDisplayNameOverride] = useState<string | null>(null);
  const [displayNameTouched, setDisplayNameTouched] = useState(false);
  // Derived display name: falls back to first+last when not manually set
  const avatarSrc = avatarSrcOverride ?? baseProfile.avatarSrc;
  const firstName = firstNameOverride ?? baseProfile.firstName;
  const lastName = lastNameOverride ?? baseProfile.lastName;
  const displayName = useMemo(
    () => displayNameOverride ?? [firstName, lastName].filter(Boolean).join(' '),
    [displayNameOverride, firstName, lastName]
  );
  const setDisplayName = (val: string) => setDisplayNameOverride(val);
  // Contact
  const [emailOverride, setEmailOverride] = useState<string | null>(null);
  const [phoneOverride, setPhoneOverride] = useState<string | null>(null);
  const [jobTitleOverride, setJobTitleOverride] = useState<string | null>(null);
  const [departmentOverride, setDepartmentOverride] = useState<string | null>(null);
  // Preferences
  const [timezoneOverride, setTimezoneOverride] = useState<string | null>(null);
  const [languageOverride, setLanguageOverride] = useState<string | null>(null);
  const [currencyOverride, setCurrencyOverride] = useState<string | null>(null);
  const [dateFormatOverride, setDateFormatOverride] = useState<string | null>(null);
  const email = emailOverride ?? baseProfile.email;
  const phone = phoneOverride ?? baseProfile.phone;
  const jobTitle = jobTitleOverride ?? baseProfile.jobTitle;
  const department = departmentOverride ?? baseProfile.department;
  const timezone = timezoneOverride ?? baseProfile.timezone;
  const language = languageOverride ?? baseProfile.language;
  const currency = currencyOverride ?? baseProfile.currency;
  const dateFormat = dateFormatOverride ?? baseProfile.dateFormat;
  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Form state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss saved confirmation after 4 s
  useEffect(() => {
    if (saved) {
      savedTimerRef.current = setTimeout(() => setSaved(false), 4000);
    }
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, [saved]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setAvatarError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('ไฟล์ต้องเป็นรูปภาพประเภท PNG, JPEG หรือ WebP');
      return;
    }
    if (file.size > MAX_PROFILE_IMAGE_FILE_BYTES) {
      setAvatarError(PROFILE_TOO_LARGE_MESSAGE);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = typeof ev.target?.result === 'string' ? ev.target.result : '';
      if (!result) {
        setAvatarError('ไม่สามารถอ่านรูปภาพที่เลือกได้ กรุณาลองอีกครั้ง');
        return;
      }
      if (new TextEncoder().encode(result).length > MAX_PROFILE_IMAGE_DATA_URL_BYTES) {
        setAvatarError(PROFILE_TOO_LARGE_MESSAGE);
        return;
      }
      setAvatarSrcOverride(result);
    };
    reader.readAsDataURL(file);
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = 'กรุณากรอกชื่อจริง';
    if (!lastName.trim()) errs.lastName = 'กรุณากรอกนามสกุล';
    if (!email.trim()) {
      errs.email = 'กรุณากรอกอีเมลสำหรับงาน';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'กรุณากรอกอีเมลให้ถูกต้อง เช่น jane@example.com';
    }
    if (newPassword && newPassword.length < 8) {
      errs.newPassword = 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร';
    }
    if (newPassword && newPassword !== confirmPassword) {
      errs.confirmPassword = 'รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง';
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      document.getElementById(Object.keys(errs)[0])?.focus();
      return;
    }
    if (!currentUser) return;

    setSaving(true);
    setSaved(false);
    try {
      await updateProfile({
        name: displayName.trim() || [firstName, lastName].filter(Boolean).join(' '),
        email: email.trim(),
        avatarUrl: avatarSrc || undefined,
        phone: phone.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
        department: department || undefined,
        timezone: timezone || undefined,
        language: language || undefined,
        currency: currency || undefined,
        dateFormat: dateFormat || undefined,
      });
      setSaving(false);
      setSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setSaving(false);
      setErrors((existing) => ({
        ...existing,
        submit: getProfileSaveErrorMessage(error),
      }));
    }
  }

  const pwStrength = getPasswordStrength(newPassword);
  const memberSinceLabel = currentUser
    ? new Date(currentUser.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : '—';
  const roleLabel = currentUser?.role
    ? ({ owner: 'เจ้าของ', admin: 'ผู้ดูแลระบบ', manager: 'ผู้จัดการ', staff: 'พนักงาน' }[currentUser.role] ?? currentUser.role)
    : 'บัญชีผู้ใช้';
  const profileInitials = useMemo(() => {
    const parts = [firstName, lastName].filter(Boolean);
    return parts.map((part) => part[0]?.toUpperCase() ?? '').join('').slice(0, 2) || 'SS';
  }, [firstName, lastName]);

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground">ข้อมูลโปรไฟล์ผู้ใช้</h1>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted leading-relaxed">จัดการสิทธิ์การเข้าถึง ข้อมูลมืออาชีพ และการตั้งค่าบัญชี</p>
      </div>

      {/* ── Identity card ─────────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-3xl shadow-2xl shadow-black/5 p-8 flex items-center gap-6 relative overflow-hidden group/card">
        <div className="relative shrink-0">
          {avatarSrc ? (
            <Image
              src={avatarSrc}
              alt={`${firstName} ${lastName}`}
              className="w-20 h-20 rounded-2xl object-cover border border-border bg-surface-raised ring-4 ring-transparent group-hover/card:ring-accent/10 transition-all duration-500"
              width={80}
              height={80}
              unoptimized
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-surface-raised text-lg font-black tracking-widest text-accent ring-4 ring-transparent transition-all duration-500 group-hover/card:ring-accent/10">
              {profileInitials}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-surface border border-border flex items-center justify-center hover:bg-surface-raised transition-all shadow-lg active:scale-90 focus:outline-none focus:ring-2 focus:ring-accent ring-offset-2"
            aria-label="เปลี่ยนรูปโปรไฟล์"
          >
            <iconify-icon icon="solar:camera-bold-duotone" width="16" height="16" className="text-accent" aria-hidden="true"></iconify-icon>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={handleAvatarChange}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-black text-foreground truncate tracking-tight">{displayName || `${firstName} ${lastName}`.trim() || 'ยังไม่ได้ระบุชื่อ'}</p>
          <p className="text-sm font-medium text-muted truncate mt-0.5 opacity-70">{email}</p>
          {avatarError && (
            <p className="text-xs text-danger mt-2 flex items-center gap-1.5 font-black uppercase tracking-widest" role="alert">
              <iconify-icon icon="solar:danger-circle-bold-duotone" width="14" height="14" aria-hidden="true"></iconify-icon>
              {avatarError}
            </p>
          )}
        </div>
        <div className="shrink-0 hidden sm:flex flex-col items-end gap-2 text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-[10px] font-black uppercase tracking-widest text-accent">
            <iconify-icon icon="solar:shield-check-bold-duotone" width="14" height="14" aria-hidden="true"></iconify-icon>
            ระดับสิทธิ์: {roleLabel}
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted/50 leading-none">ใช้งานตั้งแต่ {memberSinceLabel}</span>
        </div>
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-[4rem] -mr-8 -mt-8 blur-2xl" />
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-8">

          {/* ── Personal information ──────────────────────────────────── */}
          <FormSection
            title="ข้อมูลส่วนตัว"
            description="ข้อมูลตัวตนที่แสดงให้ทีมเห็นภายในเวิร์กสเปซ"
            icon="solar:user-rounded-bold-duotone"
          >
            <FormRow>
              <FormField label="ชื่อ" htmlFor="firstName" required error={errors.firstName}>
                <TextInput
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstNameOverride(e.target.value)}
                  autoComplete="given-name"
                  maxLength={50}
                  hasError={!!errors.firstName}
                  aria-required="true"
                  aria-invalid={errors.firstName ? true : undefined}
                  aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                />
              </FormField>
              <FormField label="นามสกุล" htmlFor="lastName" required error={errors.lastName}>
                <TextInput
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastNameOverride(e.target.value)}
                  autoComplete="family-name"
                  maxLength={50}
                  hasError={!!errors.lastName}
                  aria-required="true"
                  aria-invalid={errors.lastName ? true : undefined}
                  aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                />
              </FormField>
            </FormRow>

            <FormField
               label="ชื่อที่ใช้แสดง"
              htmlFor="displayName"
               hint="ชื่อเรียกที่ต้องการให้แสดงในระบบและระหว่างการทำงานร่วมกัน"
            >
              <TextInput
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); setDisplayNameTouched(true); }}
                onBlur={() => { if (!displayName.trim()) { setDisplayNameOverride(null); setDisplayNameTouched(false); } }}
                autoComplete="nickname"
                maxLength={80}
                aria-describedby="displayName-hint"
              />
            </FormField>
          </FormSection>

          {/* ── Contact & role ────────────────────────────────────────── */}
          <FormSection
            title="ข้อมูลติดต่อ"
            description="ช่องทางสำหรับการติดต่อและประสานงานในการทำงาน"
            icon="solar:buildings-2-bold-duotone"
          >
            <FormField label="อีเมลสำหรับงาน" htmlFor="email" required error={errors.email}>
              <TextInput
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmailOverride(e.target.value)}
                autoComplete="email"
                maxLength={254}
                hasError={!!errors.email}
                aria-required="true"
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
            </FormField>

            <FormRow>
              <FormField label="เบอร์โทรศัพท์" htmlFor="phone" hint="ช่องทางติดต่อเพิ่มเติมเมื่อจำเป็น">
                <TextInput
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhoneOverride(e.target.value)}
                  autoComplete="tel"
                  maxLength={30}
                />
              </FormField>
              <FormField label="ตำแหน่งงาน" htmlFor="jobTitle">
                <TextInput
                  id="jobTitle"
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitleOverride(e.target.value)}
                  autoComplete="organization-title"
                  maxLength={100}
                />
              </FormField>
            </FormRow>

            <FormField label="แผนก" htmlFor="department">
              <SelectInput
                id="department"
                value={department}
                onChange={(e) => setDepartmentOverride(e.target.value)}
                options={DEPARTMENTS}
              />
            </FormField>
          </FormSection>

          {/* ── Preferences ───────────────────────────────────────────── */}
          <FormSection
            title="การตั้งค่าภูมิภาค"
            description="กำหนดภาษา เขตเวลา และรูปแบบข้อมูลให้ตรงกับการใช้งานของคุณ"
            icon="solar:settings-bold-duotone"
          >
            <FormRow>
              <FormField label="เขตเวลา" htmlFor="timezone">
                <SelectInput
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezoneOverride(e.target.value)}
                  options={TIMEZONES}
                />
              </FormField>
              <FormField label="ภาษา" htmlFor="language">
                <SelectInput
                  id="language"
                  value={language}
                  onChange={(e) => setLanguageOverride(e.target.value)}
                  options={LANGUAGES}
                />
              </FormField>
            </FormRow>

            <FormRow>
              <FormField label="สกุลเงิน" htmlFor="currency">
                <SelectInput
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrencyOverride(e.target.value)}
                  options={CURRENCIES}
                />
              </FormField>
              <FormField label="รูปแบบวันที่" htmlFor="dateFormat">
                <SelectInput
                  id="dateFormat"
                  value={dateFormat}
                  onChange={(e) => setDateFormatOverride(e.target.value)}
                  options={DATE_FORMATS}
                />
              </FormField>
            </FormRow>
          </FormSection>

          {/* ── Password & security ───────────────────────────────────── */}
          <FormSection
            title="ความปลอดภัยบัญชี"
            description="จัดการข้อมูลยืนยันตัวตนและรหัสผ่านของบัญชี"
            icon="solar:lock-password-bold-duotone"
          >
            <FormField label="รหัสผ่านปัจจุบัน" htmlFor="currentPassword">
              <TextInput
                id="currentPassword"
                type="password"
                placeholder="ยืนยันตัวตนด้วยรหัสผ่านปัจจุบัน"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </FormField>

            <FormRow>
              {/* New password + strength meter */}
              <div className="space-y-3">
                <FormField label="รหัสผ่านใหม่" htmlFor="newPassword" error={errors.newPassword}>
                  <TextInput
                    id="newPassword"
                    type="password"
                      placeholder="อย่างน้อย 8 ตัวอักษร"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    hasError={!!errors.newPassword}
                    aria-invalid={errors.newPassword ? true : undefined}
                  />
                </FormField>
                {newPassword && (
                  <div className="space-y-2 p-3 rounded-2xl bg-surface-raised/50 border border-border/50" aria-live="polite" aria-atomic="true">
                    <div className="flex gap-1.5" aria-hidden="true">
                      {(['weak', 'fair', 'strong'] as PasswordStrength[]).map((level, i) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${
                            pwStrength === 'weak' && i === 0
                              ? 'bg-danger shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                              : pwStrength === 'fair' && i <= 1
                              ? 'bg-warning shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                              : pwStrength === 'strong'
                              ? 'bg-success shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                              : 'bg-surface border border-border/50'
                          }`}
                        />
                      ))}
                    </div>
                    <p
                      className={`text-[9px] font-black uppercase tracking-[0.2em] pt-0.5 ${
                        pwStrength === 'weak'
                          ? 'text-danger'
                          : pwStrength === 'fair'
                          ? 'text-warning'
                          : 'text-success'
                      }`}
                    >
                      {pwStrength === 'weak'
                        ? 'ความปลอดภัยต่ำ'
                        : pwStrength === 'fair'
                        ? 'ความปลอดภัยปานกลาง'
                        : 'ความปลอดภัยสูง'}
                    </p>
                  </div>
                )}
              </div>

              <FormField label="ยืนยันรหัสผ่านใหม่" htmlFor="confirmPassword" error={errors.confirmPassword}>
                <TextInput
                  id="confirmPassword"
                  type="password"
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  hasError={!!errors.confirmPassword}
                  aria-invalid={errors.confirmPassword ? true : undefined}
                  aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                />
              </FormField>
            </FormRow>
          </FormSection>

          {/* ── Form actions ──────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-5 border-t border-border mt-12 pt-8">
            {errors.submit && (
              <span className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-danger mr-auto px-5 py-2.5 bg-danger/5 rounded-2xl border border-danger/20">
                <iconify-icon icon="solar:danger-circle-bold-duotone" width="18" height="18" aria-hidden="true"></iconify-icon>
                {errors.submit}
              </span>
            )}
            {saved && (
              <span
                className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-success mr-auto px-5 py-2.5 bg-success/5 rounded-2xl border border-success/20 animate-in fade-in slide-in-from-left-4"
                role="status"
                aria-live="polite"
              >
                <iconify-icon icon="solar:check-circle-bold-duotone" width="18" height="18" aria-hidden="true"></iconify-icon>
                บันทึกข้อมูลสำเร็จ
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="group inline-flex items-center gap-3 px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-accent rounded-2xl hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl shadow-accent/40 focus:outline-none focus:ring-4 focus:ring-accent/20 active:scale-95"
            >
              {saving ? (
                <>
                  <iconify-icon
                    icon="solar:refresh-linear"
                    width="18"
                    height="18"
                    aria-hidden="true"
                    className="animate-spin"
                  ></iconify-icon>
                  กำลังบันทึก…
                </>
              ) : (
                <>
                  บันทึกการเปลี่ยนแปลง
                  <iconify-icon icon="solar:arrow-right-up-linear" width="18" height="18" className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </>
              )}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}

// ─── Reusable Components ──────────────────────────────────────────────────────

function FormSection({ title, description, icon, children }: FormSectionProps) {
  return (
    <section className="bg-surface border border-border rounded-[2rem] shadow-2xl shadow-black/5 overflow-hidden group/section transition-all duration-500 hover:border-accent/10">
      <div className="px-8 py-6 border-b border-border/50 flex items-center gap-5 bg-surface-raised/30">
        <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-border flex items-center justify-center shrink-0 shadow-sm group-hover/section:scale-110 group-hover/section:border-accent/30 group-hover/section:text-accent transition-all duration-500">
          <iconify-icon icon={icon} width="24" height="24" className="text-muted/60 group-hover/section:text-accent transition-colors" aria-hidden="true"></iconify-icon>
        </div>
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">{title}</h2>
          <p className="text-[11px] text-muted mt-1 opacity-70 leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="px-10 py-10 space-y-8">{children}</div>
    </section>
  );
}

function FormRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">{children}</div>;
}

function FormField({ label, htmlFor, required, hint, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <label htmlFor={htmlFor} className="text-[9px] font-black uppercase tracking-[0.2em] text-muted/80 pl-1 flex items-center gap-1.5">
        <iconify-icon icon="solar:tuning-bold-duotone" width="12" height="12" className="text-muted/30" />
        {label}
        {required && (
          <span className="text-danger ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-[10px] text-danger flex items-center gap-2 font-black uppercase tracking-widest pl-1 pt-1 animate-in fade-in slide-in-from-top-1" role="alert">
          <iconify-icon icon="solar:danger-circle-bold-duotone" width="14" height="14" aria-hidden="true"></iconify-icon>
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[10px] text-muted/60 leading-relaxed pl-1 font-medium">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function TextInput({ id, hasError, className, ...props }: TextInputProps) {
  return (
    <input
      id={id}
      className={[
        'w-full px-6 py-4 text-sm bg-surface-raised/30 border rounded-2xl text-foreground font-bold tracking-tight',
        'placeholder:text-muted/30 transition-all duration-500',
        'focus:outline-none focus:ring-4',
        hasError
          ? 'border-danger/30 focus:ring-danger/10 text-danger bg-danger/5'
          : 'border-border/60 hover:border-accent/30 hover:bg-surface-raised focus:border-accent/40 focus:ring-accent/10 focus:bg-surface',
        className ?? '',
      ].join(' ')}
      {...props}
    />
  );
}

function SelectInput({ id, options, hasError, className, ...props }: SelectInputProps) {
  return (
    <div className="relative group/select">
      <select
        id={id}
        className={[
          'w-full appearance-none px-6 py-4 pr-12 text-sm bg-surface-raised/30 border rounded-2xl',
          'text-foreground cursor-pointer transition-all duration-500 font-bold tracking-tight',
          'focus:outline-none focus:ring-4',
          hasError
            ? 'border-danger/30 focus:ring-danger/10 text-danger bg-danger/5'
            : 'border-border/60 hover:border-accent/30 hover:bg-surface-raised focus:border-accent/40 focus:ring-accent/10 focus:bg-surface',
          className ?? '',
        ].join(' ')}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface text-foreground font-medium">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-5 flex items-center transition-transform group-hover/select:translate-y-0.5" aria-hidden="true">
        <iconify-icon icon="solar:alt-arrow-down-bold-duotone" width="18" height="18" className="text-muted/40 group-hover/select:text-accent"></iconify-icon>
      </div>
    </div>
  );
}
