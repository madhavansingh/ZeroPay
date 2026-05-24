import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Globe, MapPin, Instagram, Twitter, Clock, ArrowLeft, Check, AlertCircle, Loader2 } from 'lucide-react';
import { getMerchantDashboard, setupStorefront, updateStorefront } from '../../services/api';

export default function StorefrontSetupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['merchant-dashboard'],
    queryFn: () => getMerchantDashboard(),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const merchant = (dashboardData?.data as any)?.merchant;

  const [slug, setSlug] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [website, setWebsite] = useState('');
  const [businessHours, setBusinessHours] = useState('9:00 AM - 6:00 PM');
  const [isPublic, setIsPublic] = useState(false);

  const [slugValid, setSlugValid] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pre-fill form if storefront fields exist
  useEffect(() => {
    if (merchant) {
      setSlug(merchant.slug || '');
      setProfileImageUrl(merchant.profileImageUrl || '');
      setBannerImageUrl(merchant.bannerImageUrl || '');
      setCity(merchant.location?.city || '');
      setState(merchant.location?.state || '');
      setCountry(merchant.location?.country || 'India');
      setInstagram(merchant.socialLinks?.instagram || '');
      setTwitter(merchant.socialLinks?.twitter || '');
      setWebsite(merchant.socialLinks?.website || '');
      setBusinessHours(merchant.businessHours || '9:00 AM - 6:00 PM');
      setIsPublic(merchant.isPublicStorefront || false);

      if (merchant.slug) {
        setSlugValid(true);
      }
    }
  }, [merchant]);

  // Debounced slug validation
  useEffect(() => {
    if (!slug) {
      setSlugValid(null);
      return;
    }

    if (merchant?.slug === slug.toLowerCase()) {
      setSlugValid(true);
      return;
    }

    const regex = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;
    if (!regex.test(slug.toLowerCase())) {
      setSlugValid(false);
      return;
    }

    setSlugChecking(true);
    const timer = setTimeout(async () => {
      try {
        // Fetch to check availability: if storefront exists, slug is taken.
        const res = await fetch(`/api/v1/storefronts/${slug.toLowerCase()}`);
        setSlugValid(res.status === 404); // 404 means available!
      } catch {
        setSlugValid(false);
      } finally {
        setSlugChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slug, merchant]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        slug: slug.toLowerCase(),
        profileImageUrl: profileImageUrl || undefined,
        bannerImageUrl: bannerImageUrl || undefined,
        location: { city, state, country },
        socialLinks: { instagram, twitter, website },
        isPublicStorefront: isPublic,
        businessHours,
      };

      if (merchant?.slug) {
        return updateStorefront(payload);
      } else {
        return setupStorefront(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-dashboard'] });
      setSuccess('Storefront preferences saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to save storefront configuration');
      setTimeout(() => setError(''), 5000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slugValid) {
      setError('Please choose a valid and available storefront URL slug');
      return;
    }
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 size={36} className="text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-28 text-text-primary">
      {/* Header */}
      <div className="px-5 pt-14 pb-5 flex items-center gap-3 border-b border-surface-border">
        <button onClick={() => navigate('/merchant/dashboard')} className="btn-ghost p-1">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Storefront Settings</h1>
          <p className="text-xs text-text-secondary">Configure your public facing commerce link</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-5 mt-6 space-y-6 max-w-xl mx-auto">
        {/* Banner and Profile Mock */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-400">Visual Styling</h2>
          <div className="relative h-28 rounded-2xl bg-surface-elevated border border-surface-border overflow-hidden flex items-center justify-center">
            {bannerImageUrl ? (
              <img src={bannerImageUrl} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-text-muted">No banner image URL configured</span>
            )}
            <div className="absolute -bottom-6 left-6 w-14 h-14 rounded-full border-2 border-surface bg-surface-card overflow-hidden flex items-center justify-center">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Globe size={18} className="text-text-muted" />
              )}
            </div>
          </div>
          <div className="pt-4 grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs text-text-secondary block mb-1">Profile Image URL</label>
              <input
                type="url"
                value={profileImageUrl}
                onChange={(e) => setProfileImageUrl(e.target.value)}
                placeholder="https://example.com/logo.jpg"
                className="input text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">Banner Image URL</label>
              <input
                type="url"
                value={bannerImageUrl}
                onChange={(e) => setBannerImageUrl(e.target.value)}
                placeholder="https://example.com/banner.jpg"
                className="input text-xs"
              />
            </div>
          </div>
        </div>

        {/* URL Slug Configuration */}
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-400">Storefront URL</h2>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Unique Storefront URL Slug</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-mono text-text-muted">
                zeropay.app/s/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                placeholder="shop-slug"
                className="input font-mono text-xs pl-28 pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {slugChecking && <Loader2 size={16} className="text-text-muted animate-spin" />}
                {!slugChecking && slugValid === true && <Check size={16} className="text-status-confirmed" />}
                {!slugChecking && slugValid === false && <AlertCircle size={16} className="text-status-failed" />}
              </div>
            </div>
            <p className="text-[10px] text-text-secondary mt-1">
              Letters, numbers, and hyphens only (e.g. `superstore-mumbai`). All lowercase.
            </p>
          </div>
        </div>

        {/* Location & Details */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-400">Store Details</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-secondary block mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Mumbai"
                className="input text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Maharashtra"
                className="input text-xs"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Business Hours</label>
            <div className="relative">
              <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                placeholder="9:00 AM - 6:00 PM Mon-Sat"
                className="input text-xs pl-10"
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-400">Social Connections</h2>
          <div className="space-y-3">
            <div className="relative">
              <Instagram size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="Instagram handle (e.g. @myshop)"
                className="input text-xs pl-10"
              />
            </div>
            <div className="relative">
              <Twitter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="Twitter handle"
                className="input text-xs pl-10"
              />
            </div>
            <div className="relative">
              <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="Personal Website URL"
                className="input text-xs pl-10"
              />
            </div>
          </div>
        </div>

        {/* Visibility Settings */}
        <div className="card flex items-center justify-between p-5">
          <div className="space-y-1 pr-4">
            <h3 className="text-sm font-semibold text-text-primary">Enable Public Storefront</h3>
            <p className="text-xs text-text-secondary">
              Allow anyone to view your catalog, reviews, and initiate secure escrow payments online.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-surface-border rounded-full peer peer-focus:ring-1 peer-focus:ring-teal-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-text-secondary peer-checked:after:bg-white after:border-surface-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
          </label>
        </div>

        {/* Toast notifications */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3 text-xs">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-teal-500/10 border border-teal-500/20 text-teal-400 p-4 rounded-2xl flex items-center gap-3 text-xs">
            <Check size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saveMutation.isPending || !slugValid}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {saveMutation.isPending && <Loader2 size={16} className="animate-spin" />}
          Save Changes
        </button>
      </form>
    </div>
  );
}
