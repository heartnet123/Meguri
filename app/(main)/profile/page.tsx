'use client';

import { useEffect, useRef, useState } from 'react';

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

const MAX_FILE_BYTES = 5 * 1024 * 1024;

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
  { value: '', label: 'Select department…' },
  { value: 'operations', label: 'Operations' },
  { value: 'purchasing', label: 'Purchasing' },
  { value: 'finance', label: 'Finance' },
  { value: 'management', label: 'Management' },
  { value: 'kitchen', label: 'Kitchen / Production' },
  { value: 'other', label: 'Other' },
];

const TIMEZONES: SelectOption[] = [
  { value: 'Asia/Bangkok', label: '(UTC+07:00) Bangkok' },
  { value: 'Asia/Singapore', label: '(UTC+08:00) Singapore' },
  { value: 'Asia/Tokyo', label: '(UTC+09:00) Tokyo' },
  { value: 'Australia/Sydney', label: '(UTC+11:00) Sydney' },
  { value: 'Europe/London', label: '(UTC+00:00) London' },
  { value: 'Europe/Paris', label: '(UTC+01:00) Paris' },
  { value: 'America/New_York', label: '(UTC-05:00) New York' },
  { value: 'America/Los_Angeles', label: '(UTC-08:00) Los Angeles' },
];

const LANGUAGES: SelectOption[] = [
  { value: 'en', label: 'English' },
  { value: 'th', label: 'ภาษาไทย (Thai)' },
  { value: 'zh', label: '中文 (Chinese)' },
  { value: 'ja', label: '日本語 (Japanese)' },
];

const CURRENCIES: SelectOption[] = [
  { value: 'THB', label: 'THB — Thai Baht (฿)' },
  { value: 'USD', label: 'USD — US Dollar ($)' },
  { value: 'SGD', label: 'SGD — Singapore Dollar (S$)' },
  { value: 'EUR', label: 'EUR — Euro (€)' },
  { value: 'GBP', label: 'GBP — British Pound (£)' },
  { value: 'JPY', label: 'JPY — Japanese Yen (¥)' },
];

const DATE_FORMATS: SelectOption[] = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO 8601)' },
];

// Simulate existing user data (replace with real auth/API data)
const CURRENT_USER = {
  firstName: 'Jane',
  lastName: 'Smith',
  displayName: 'Jane Smith',
  email: 'jane@mainstoregroup.com',
  phone: '+66 81 234 5678',
  jobTitle: 'Store Manager',
  department: 'management',
  avatarUrl: 'https://picsum.photos/seed/user/200/200',
  timezone: 'Asia/Bangkok',
  language: 'en',
  currency: 'THB',
  dateFormat: 'DD/MM/YYYY',
  memberSince: 'March 2024',
  role: 'Admin',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  // Identity
  const [avatarSrc, setAvatarSrc] = useState<string>(CURRENT_USER.avatarUrl);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState(CURRENT_USER.firstName);
  const [lastName, setLastName] = useState(CURRENT_USER.lastName);
  const [displayName, setDisplayName] = useState(CURRENT_USER.displayName);
  const [displayNameTouched, setDisplayNameTouched] = useState(true); // pre-filled, don't auto-overwrite
  // Contact
  const [email, setEmail] = useState(CURRENT_USER.email);
  const [phone, setPhone] = useState(CURRENT_USER.phone);
  const [jobTitle, setJobTitle] = useState(CURRENT_USER.jobTitle);
  const [department, setDepartment] = useState(CURRENT_USER.department);
  // Preferences
  const [timezone, setTimezone] = useState(CURRENT_USER.timezone);
  const [language, setLanguage] = useState(CURRENT_USER.language);
  const [currency, setCurrency] = useState(CURRENT_USER.currency);
  const [dateFormat, setDateFormat] = useState(CURRENT_USER.dateFormat);
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

  // Auto-fill display name from first + last when not manually edited
  useEffect(() => {
    if (!displayNameTouched) {
      setDisplayName([firstName, lastName].filter(Boolean).join(' '));
    }
  }, [firstName, lastName, displayNameTouched]);

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
      setAvatarError('File must be a PNG, JPEG, or WebP image.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setAvatarError('File exceeds the 5 MB limit. Choose a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = 'Enter your first name.';
    if (!lastName.trim()) errs.lastName = 'Enter your last name.';
    if (!email.trim()) {
      errs.email = 'Enter your work email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Enter a valid email address (e.g. jane@example.com).';
    }
    if (newPassword && newPassword.length < 8) {
      errs.newPassword = 'New password must be at least 8 characters.';
    }
    if (newPassword && newPassword !== confirmPassword) {
      errs.confirmPassword = "Passwords don't match. Please try again.";
    }
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      document.getElementById(Object.keys(errs)[0])?.focus();
      return;
    }
    setSaving(true);
    setSaved(false);
    // Replace with real API call
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      // Clear password fields on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1400);
  }

  const pwStrength = getPasswordStrength(newPassword);

  return (
    <div className="max-w-2xl mx-auto">

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Profile</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage your personal information and preferences.</p>
      </div>

      {/* ── Identity card ─────────────────────────────────────────────── */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5 mb-5 flex items-center gap-4">
        <div className="relative shrink-0">
          <img
            src={avatarSrc}
            alt={`${firstName} ${lastName}`}
            className="w-14 h-14 rounded-full object-cover border border-neutral-200"
            width={56}
            height={56}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-white border border-neutral-300 flex items-center justify-center hover:bg-neutral-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            aria-label="Change profile photo"
          >
            <iconify-icon icon="solar:pen-2-linear" width="12" height="12" className="text-neutral-600" aria-hidden="true"></iconify-icon>
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
          <p className="text-sm font-semibold text-neutral-900 truncate">{displayName || `${firstName} ${lastName}`.trim() || 'Your Name'}</p>
          <p className="text-xs text-neutral-500 truncate mt-0.5">{email}</p>
          {avatarError && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1" role="alert">
              <iconify-icon icon="solar:danger-circle-linear" width="12" height="12" aria-hidden="true"></iconify-icon>
              {avatarError}
            </p>
          )}
        </div>
        <div className="shrink-0 hidden sm:flex flex-col items-end gap-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 border border-teal-100 text-xs font-medium text-teal-700">
            <iconify-icon icon="solar:shield-check-linear" width="12" height="12" aria-hidden="true"></iconify-icon>
            {CURRENT_USER.role}
          </span>
          <span className="text-xs text-neutral-400">Member since {CURRENT_USER.memberSince}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-5">

          {/* ── Personal information ──────────────────────────────────── */}
          <FormSection
            title="Personal information"
            description="Your name and photo as seen by your teammates."
            icon="solar:user-rounded-linear"
          >
            <FormRow>
              <FormField label="First name" htmlFor="firstName" required error={errors.firstName}>
                <TextInput
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  maxLength={50}
                  hasError={!!errors.firstName}
                  aria-required="true"
                  aria-invalid={errors.firstName ? true : undefined}
                  aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                />
              </FormField>
              <FormField label="Last name" htmlFor="lastName" required error={errors.lastName}>
                <TextInput
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
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
              label="Display name"
              htmlFor="displayName"
              hint="How you appear in comments and notifications."
            >
              <TextInput
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); setDisplayNameTouched(true); }}
                onBlur={() => { if (!displayName.trim()) setDisplayNameTouched(false); }}
                autoComplete="nickname"
                maxLength={80}
                aria-describedby="displayName-hint"
              />
            </FormField>
          </FormSection>

          {/* ── Contact & role ────────────────────────────────────────── */}
          <FormSection
            title="Contact & role"
            description="Your work contact details and position in the team."
            icon="solar:buildings-2-linear"
          >
            <FormField label="Work email" htmlFor="email" required error={errors.email}>
              <TextInput
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                maxLength={254}
                hasError={!!errors.email}
                aria-required="true"
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
            </FormField>

            <FormRow>
              <FormField label="Phone number" htmlFor="phone" hint="Optional — for urgent stock alerts.">
                <TextInput
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  maxLength={30}
                />
              </FormField>
              <FormField label="Job title" htmlFor="jobTitle">
                <TextInput
                  id="jobTitle"
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  autoComplete="organization-title"
                  maxLength={100}
                />
              </FormField>
            </FormRow>

            <FormField label="Department" htmlFor="department">
              <SelectInput
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                options={DEPARTMENTS}
              />
            </FormField>
          </FormSection>

          {/* ── Preferences ───────────────────────────────────────────── */}
          <FormSection
            title="Preferences"
            description="Localisation and display settings for your account."
            icon="solar:settings-linear"
          >
            <FormRow>
              <FormField label="Timezone" htmlFor="timezone">
                <SelectInput
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  options={TIMEZONES}
                />
              </FormField>
              <FormField label="Language" htmlFor="language">
                <SelectInput
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  options={LANGUAGES}
                />
              </FormField>
            </FormRow>

            <FormRow>
              <FormField label="Currency" htmlFor="currency">
                <SelectInput
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  options={CURRENCIES}
                />
              </FormField>
              <FormField label="Date format" htmlFor="dateFormat">
                <SelectInput
                  id="dateFormat"
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  options={DATE_FORMATS}
                />
              </FormField>
            </FormRow>
          </FormSection>

          {/* ── Password & security ───────────────────────────────────── */}
          <FormSection
            title="Password & security"
            description="Leave all fields blank to keep your current password."
            icon="solar:lock-password-linear"
          >
            <FormField label="Current password" htmlFor="currentPassword">
              <TextInput
                id="currentPassword"
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </FormField>

            <FormRow>
              {/* New password + strength meter */}
              <div className="space-y-1.5">
                <FormField label="New password" htmlFor="newPassword" error={errors.newPassword}>
                  <TextInput
                    id="newPassword"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    hasError={!!errors.newPassword}
                    aria-invalid={errors.newPassword ? true : undefined}
                  />
                </FormField>
                {newPassword && (
                  <div className="space-y-1" aria-live="polite" aria-atomic="true">
                    <div className="flex gap-1" aria-hidden="true">
                      {(['weak', 'fair', 'strong'] as PasswordStrength[]).map((level, i) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                            pwStrength === 'weak' && i === 0
                              ? 'bg-red-400'
                              : pwStrength === 'fair' && i <= 1
                              ? 'bg-amber-400'
                              : pwStrength === 'strong'
                              ? 'bg-emerald-500'
                              : 'bg-neutral-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p
                      className={`text-xs font-medium ${
                        pwStrength === 'weak'
                          ? 'text-red-600'
                          : pwStrength === 'fair'
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {pwStrength === 'weak'
                        ? 'Weak — add uppercase letters, numbers, or symbols'
                        : pwStrength === 'fair'
                        ? 'Fair — try adding a symbol or number'
                        : 'Strong password'}
                    </p>
                  </div>
                )}
              </div>

              <FormField label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword}>
                <TextInput
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat new password"
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
          <div className="flex items-center justify-end gap-3 border-t border-neutral-100 pt-5">
            {saved && (
              <span
                className="flex items-center gap-1.5 text-sm text-emerald-600 mr-auto"
                role="status"
                aria-live="polite"
              >
                <iconify-icon icon="solar:check-circle-linear" width="16" height="16" aria-hidden="true"></iconify-icon>
                Changes saved
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            >
              {saving ? (
                <>
                  <iconify-icon
                    icon="solar:refresh-linear"
                    width="16"
                    height="16"
                    aria-hidden="true"
                    className="animate-spin"
                  ></iconify-icon>
                  Saving…
                </>
              ) : (
                'Save changes'
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
    <section className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center shrink-0">
          <iconify-icon icon={icon} width="18" height="18" className="text-neutral-500" aria-hidden="true"></iconify-icon>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
          <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="px-5 py-5 space-y-4">{children}</div>
    </section>
  );
}

function FormRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function FormField({ label, htmlFor, required, hint, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-neutral-700">
        {label}
        {required && (
          <span className="text-red-500 ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-xs text-red-600 flex items-center gap-1" role="alert">
          <iconify-icon icon="solar:danger-circle-linear" width="12" height="12" aria-hidden="true"></iconify-icon>
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-neutral-500">
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
        'w-full px-3 py-2 text-sm bg-white border rounded-lg text-neutral-900',
        'placeholder:text-neutral-400 transition-shadow',
        'focus:outline-none focus-visible:ring-2',
        hasError
          ? 'border-red-400 focus-visible:ring-red-500'
          : 'border-neutral-200 hover:border-neutral-300 focus-visible:ring-teal-600',
        className ?? '',
      ].join(' ')}
      {...props}
    />
  );
}

function SelectInput({ id, options, hasError, className, ...props }: SelectInputProps) {
  return (
    <div className="relative">
      <select
        id={id}
        className={[
          'w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border rounded-lg',
          'text-neutral-900 cursor-pointer transition-shadow',
          'focus:outline-none focus-visible:ring-2',
          hasError
            ? 'border-red-400 focus-visible:ring-red-500'
            : 'border-neutral-200 hover:border-neutral-300 focus-visible:ring-teal-600',
          className ?? '',
        ].join(' ')}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center" aria-hidden="true">
        <iconify-icon icon="solar:alt-arrow-down-linear" width="14" height="14" className="text-neutral-400"></iconify-icon>
      </div>
    </div>
  );
}
