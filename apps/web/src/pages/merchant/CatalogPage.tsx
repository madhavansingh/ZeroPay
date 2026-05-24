import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit3, Save, X, ArrowLeft, Loader2, Image as ImageIcon, Box, CloudLightning } from 'lucide-react';
import { getMerchantDashboard, getStorefrontCatalog, createProduct, updateProduct, deleteProduct } from '../../services/api';

export default function CatalogPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['merchant-dashboard'],
    queryFn: () => getMerchantDashboard(),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const merchant = (dashboardData?.data as any)?.merchant;
  const slug = merchant?.slug;

  const { data: catalogData, isLoading: isCatalogLoading } = useQuery({
    queryKey: ['storefront-catalog', slug],
    queryFn: () => getStorefrontCatalog(slug!),
    enabled: !!slug,
  });

  const products: any[] = (catalogData?.data as any) || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceLovelace, setPriceLovelace] = useState(5_000_000); // 5 ADA default
  const [priceINR, setPriceINR] = useState<number | ''>('');
  const [category, setCategory] = useState<'digital' | 'physical' | 'service'>('digital');
  const [isDigital, setIsDigital] = useState(true);
  const [ipfsHash, setIpfsHash] = useState('');
  const [inventory, setInventory] = useState<number | ''>('');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [error, setError] = useState('');

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setTitle('');
    setDescription('');
    setPriceLovelace(5_000_000);
    setPriceINR('');
    setCategory('digital');
    setIsDigital(true);
    setIpfsHash('');
    setInventory('');
    setImages([]);
    setImageUrl('');
    setTags([]);
    setTagInput('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (p: any) => {
    setEditingProduct(p);
    setTitle(p.title);
    setDescription(p.description);
    setPriceLovelace(p.priceLovelace);
    setPriceINR(p.priceINR || '');
    setCategory(p.category);
    setIsDigital(p.isDigital);
    setIpfsHash(p.ipfsHash || '');
    setInventory(p.inventory || '');
    setImages(p.images || []);
    setImageUrl('');
    setTags(p.tags || []);
    setTagInput('');
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        description,
        priceLovelace,
        priceINR: priceINR ? Number(priceINR) : undefined,
        category,
        isDigital: category === 'digital',
        ipfsHash: category === 'digital' ? ipfsHash || undefined : undefined,
        inventory: category === 'physical' && inventory ? Number(inventory) : undefined,
        images: images.length > 0 ? images : undefined,
        tags: tags.length > 0 ? tags : undefined,
      };

      if (editingProduct) {
        return updateProduct(editingProduct.productId, payload);
      } else {
        return createProduct(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storefront-catalog', slug] });
      setModalOpen(false);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to save product listing');
      setTimeout(() => setError(''), 5000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (productId: string) => deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storefront-catalog', slug] });
    },
  });

  const handleAddImage = () => {
    if (imageUrl && images.length < 5) {
      setImages([...images, imageUrl]);
      setImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput && tags.length < 10) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim().toLowerCase())) {
        setTags([...tags, tagInput.trim().toLowerCase()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((tag) => tag !== t));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !priceLovelace) {
      setError('Please fill in all required fields');
      return;
    }
    saveMutation.mutate();
  };

  const lovelaceToAda = (l: number) => (l / 1_000_000).toFixed(1);

  if (isDashboardLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 size={36} className="text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-28 text-text-primary">
      {/* Header */}
      <div className="px-5 pt-14 pb-5 flex items-center justify-between border-b border-surface-border">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/merchant/dashboard')} className="btn-ghost p-1">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Product Catalog</h1>
            <p className="text-xs text-text-secondary">Manage products and services for your shop</p>
          </div>
        </div>
        {slug ? (
          <button onClick={handleOpenAddModal} className="btn-primary flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs">
            <Plus size={16} /> Add Product
          </button>
        ) : (
          <button onClick={() => navigate('/merchant/storefront')} className="btn-secondary text-xs py-2 px-4">
            Setup Storefront First
          </button>
        )}
      </div>

      {/* Main List */}
      <div className="px-5 mt-6 max-w-xl mx-auto">
        {!slug ? (
          <div className="card text-center py-10 space-y-4">
            <Box size={40} className="text-text-muted mx-auto" />
            <h3 className="text-sm font-semibold">Storefront Setup Required</h3>
            <p className="text-xs text-text-secondary">
              You must configure a public storefront slug before creating catalog items.
            </p>
            <button onClick={() => navigate('/merchant/storefront')} className="btn-primary text-xs py-2 px-6">
              Configure Now
            </button>
          </div>
        ) : isCatalogLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="text-teal-500 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="card text-center py-12 space-y-3">
            <Box size={36} className="text-text-muted mx-auto" />
            <h3 className="text-sm font-semibold">No products listed</h3>
            <p className="text-xs text-text-secondary">
              List digital downloads, physical merchandise, or premium services.
            </p>
            <button onClick={handleOpenAddModal} className="btn-ghost text-xs text-teal-400 font-semibold mt-2">
              Create your first product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {products.map((p) => (
              <div key={p.productId} className="card flex gap-4 items-start relative hover:border-teal-500/30 transition-all">
                {/* Image thumb */}
                <div className="w-16 h-16 rounded-xl bg-surface-elevated overflow-hidden border border-surface-border flex items-center justify-center flex-shrink-0">
                  {p.images && p.images[0] ? (
                    <img src={p.images[0]} alt="Product" className="w-full h-full object-cover" />
                  ) : (
                    <Box size={20} className="text-text-muted" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 pr-16">
                  <span className={`text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full ${
                    p.category === 'digital' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15' :
                    p.category === 'physical' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' :
                    'bg-teal-500/10 text-teal-400 border border-teal-500/15'
                  }`}>
                    {p.category}
                  </span>
                  <h3 className="text-sm font-bold text-text-primary mt-1.5 truncate">{p.title}</h3>
                  <p className="text-xs text-text-secondary mt-0.5 truncate">{p.description}</p>
                  <p className="text-xs font-mono font-bold text-teal-400 mt-2">
                    {lovelaceToAda(p.priceLovelace)} ADA <span className="text-text-muted font-normal">/ ₹{p.priceINR || lovelaceToAda(p.priceLovelace * 100)}</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="absolute right-4 top-4 flex flex-col gap-1.5">
                  <button onClick={() => handleOpenEditModal(p)} className="p-1.5 rounded-lg btn-ghost bg-surface-elevated hover:bg-surface-border text-teal-400">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => deleteMutation.mutate(p.productId)} className="p-1.5 rounded-lg btn-ghost bg-surface-elevated hover:bg-red-950/20 text-status-failed">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-surface-card rounded-t-3xl border-t border-surface-border max-h-[85vh] overflow-y-auto p-6 space-y-5 animate-slide-up">
            <div className="flex justify-between items-center pb-2 border-b border-surface-border">
              <h2 className="text-base font-bold text-text-primary">
                {editingProduct ? 'Edit Catalog Listing' : 'Add New Catalog Listing'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="btn-ghost p-1">
                <X size={20} className="text-text-secondary" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category */}
              <div>
                <label className="text-xs text-text-secondary block mb-1">Fulfillment Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['digital', 'physical', 'service'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategory(cat);
                        setIsDigital(cat === 'digital');
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-colors ${
                        category === cat
                          ? 'bg-teal-600/20 border-teal-500 text-teal-400'
                          : 'bg-surface-elevated border-surface-border text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Desc */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-text-secondary block mb-1">Listing Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Premium UX Audit or Handcrafted Leather Wallet"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary block mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={3}
                    placeholder="Detail the deliverables, terms, timeline, and exact scope of your digital product or premium consulting..."
                    className="input text-xs resize-none"
                  />
                </div>
              </div>

              {/* Price Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary block mb-1">Price (ADA in Lovelace)</label>
                  <input
                    type="number"
                    value={priceLovelace}
                    onChange={(e) => setPriceLovelace(Number(e.target.value))}
                    required
                    min={1_000_000}
                    placeholder="5000000"
                    className="input text-xs font-mono"
                  />
                  <p className="text-[10px] text-text-secondary mt-1">
                    {(priceLovelace / 1_000_000).toFixed(1)} ADA
                  </p>
                </div>
                <div>
                  <label className="text-xs text-text-secondary block mb-1">Optional Price (INR Equivalent)</label>
                  <input
                    type="number"
                    value={priceINR}
                    onChange={(e) => setPriceINR(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Optional ₹ amount"
                    className="input text-xs"
                  />
                </div>
              </div>

              {/* Digital IPFS Link */}
              {category === 'digital' && (
                <div className="card-elevated space-y-2 border-indigo-500/25">
                  <div className="flex items-center gap-2">
                    <CloudLightning size={16} className="text-indigo-400 animate-pulse" />
                    <span className="text-xs font-semibold text-indigo-300">Automated Digital Delivery</span>
                  </div>
                  <p className="text-[10px] text-text-secondary">
                    Files pinned on IPFS are securely delivered to your customer automatically once payment settling completes!
                  </p>
                  <div>
                    <label className="text-xs text-text-secondary block mb-1 mt-2">IPFS Hash (Pinata CID)</label>
                    <input
                      type="text"
                      value={ipfsHash}
                      onChange={(e) => setIpfsHash(e.target.value)}
                      placeholder="Qm... or bafy..."
                      className="input text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Inventory */}
              {category === 'physical' && (
                <div>
                  <label className="text-xs text-text-secondary block mb-1">Available Inventory</label>
                  <input
                    type="number"
                    value={inventory}
                    onChange={(e) => setInventory(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Unlimited"
                    className="input text-xs"
                  />
                </div>
              )}

              {/* Images */}
              <div>
                <label className="text-xs text-text-secondary block mb-1">Image URLs (up to 5)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/item.png"
                    className="input text-xs flex-1"
                  />
                  <button type="button" onClick={handleAddImage} className="btn-secondary px-4 py-2 text-xs flex items-center justify-center">
                    Add
                  </button>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {images.map((img, i) => (
                    <div key={i} className="relative w-12 h-12 bg-surface-elevated border border-surface-border rounded-lg overflow-hidden flex items-center justify-center">
                      <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => handleRemoveImage(i)} className="absolute top-0.5 right-0.5 bg-black/75 rounded-full p-0.5 text-status-failed">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs text-text-secondary block mb-1">Product Tags (press Enter)</label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="e.g. template, design, rust"
                  className="input text-xs"
                />
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {tags.map((t) => (
                    <span key={t} className="badge bg-surface-elevated text-teal-400 flex items-center gap-1">
                      #{t}
                      <button type="button" onClick={() => handleRemoveTag(t)}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-xs text-status-failed text-center font-semibold">{error}</p>
              )}

              {/* Action Buttons */}
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {saveMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Save Listing
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
