/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  MapPin, 
  Home, 
  DollarSign, 
  BedDouble, 
  Maximize2, 
  Share2, 
  Check, 
  MessageSquare,
  ChevronRight,
  ShieldAlert,
  User,
  X,
  UploadCloud,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { Property, Lead, UserProfile } from '../types';

const REAL_ESTATE_STOCK_GALLERY = [
  { id: 'g1', url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80', tag: 'Luxury Flat' },
  { id: 'g2', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80', tag: 'Villa Exterior' },
  { id: 'g3', url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=600&q=80', tag: 'Modern Bedroom' },
  { id: 'g4', url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80', tag: 'Sky Residences' },
  { id: 'g5', url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=80', tag: 'Royal Lounge' },
  { id: 'g6', url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=600&q=80', tag: 'Bespoke Poolside' }
];

interface PropertiesModuleProps {
  properties: Property[];
  leads: Lead[];
  currentUser: UserProfile;
  onAddProperty: (property: any) => void;
  onShareProperty: (leadId: string, propertyId: string, channel: 'WhatsApp' | 'SMS' | 'Email') => void;
}

export default function PropertiesModule({
  properties,
  leads,
  currentUser,
  onAddProperty,
  onShareProperty
}: PropertiesModuleProps) {
  
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  
  // Create state for sharing
  const [sharingLeadId, setSharingLeadId] = useState('');
  const [sharingChannel, setSharingChannel] = useState<'WhatsApp' | 'SMS' | 'Email'>('WhatsApp');
  
  // Add Property Form inputs
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('Sector 54, Gurgaon');
  const [newType, setNewType] = useState('Apartment');
  const [newPrice, setNewPrice] = useState('');
  const [newSize, setNewSize] = useState('3 BHK Super Luxury');
  const [newBedrooms, setNewBedrooms] = useState('3');
  const [newBathrooms, setNewBathrooms] = useState('3');
  const [newFloor, setNewFloor] = useState('8');
  const [newFurnishing, setNewFurnishing] = useState('Fully-Furnished');
  const [newDescription, setNewDescription] = useState('');

  // Picture upload state - supports file uploads (base64) and gallery selection
  const [propertyImages, setPropertyImages] = useState<string[]>([]);
  const [activeUploadTab, setActiveUploadTab] = useState<'files' | 'gallery'>('files');
  
  const activeProperty = properties.find(p => p.id === selectedPropertyId);

  // File Upload Handlers
  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      filesArray.forEach((file: any) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setPropertyImages(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleToggleStockGalleryImage = (url: string) => {
    setPropertyImages(prev => {
      if (prev.includes(url)) {
        return prev.filter(item => item !== url);
      } else {
        return [...prev, url];
      }
    });
  };

  const handleRemoveUploadedImage = (index: number) => {
    setPropertyImages(prev => prev.filter((_, i) => i !== index));
  };

  // Form Submit handler
  const handleCreateProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPrice) {
      alert('Must input at least Title and Price.');
      return;
    }
    
    onAddProperty({
      title: newTitle,
      location: newLocation,
      propertyType: newType,
      price: Number(newPrice),
      size: newSize,
      bedrooms: Number(newBedrooms),
      bathrooms: Number(newBathrooms),
      floor: Number(newFloor),
      furnishingStatus: newFurnishing,
      description: newDescription || 'Premium residency available for viewings.',
      images: propertyImages.length > 0 ? propertyImages : undefined
    });

    // Reset fields
    setNewTitle('');
    setNewPrice('');
    setNewDescription('');
    setPropertyImages([]);
    setShowAddProperty(false);
    alert('Success: New property cataloged into CRM storage.');
  };

  const handleDispatchShare = () => {
    if (!selectedPropertyId || !sharingLeadId) {
      alert('Please choose a counseling client lead parameter first.');
      return;
    }
    onShareProperty(sharingLeadId, selectedPropertyId, sharingChannel);
    alert(`Success: Property details brochure prepared and dispatched to candidate via ${sharingChannel}. Recorded on ledger.`);
    setSharingLeadId('');
  };

  // Filter properties
  const filteredProperties = properties.filter(p => {
    const term = searchQuery.toLowerCase();
    const matchSearch = p.title.toLowerCase().includes(term) || p.location.toLowerCase().includes(term);
    const matchType = typeFilter ? p.propertyType === typeFilter : true;
    const matchLoc = locationFilter ? p.location.toLowerCase().includes(locationFilter.toLowerCase()) : true;
    return matchSearch && matchType && matchLoc;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full" id="properties-module">
      {/* Left Property List */}
      <div className={`lg:col-span-8 flex flex-col space-y-4 h-[calc(100vh-140px)] overflow-y-auto ${selectedPropertyId ? 'hidden lg:block' : 'block'}`}>
        
        {/* Banner with controls */}
        <div className="flex justify-between items-center bg-white p-4 border border-slate-100 rounded-2xl shadow-xs">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800">Exclusive Inventory ({filteredProperties.length})</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Real Estate available for distribution</p>
          </div>
          <button 
            id="add-property-toggle-btn"
            onClick={() => setShowAddProperty(true)}
            className="bg-slate-900 border border-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} /> Catalog Property
          </button>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-3 border border-slate-100 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* Search text */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input 
              id="property-search-input"
              type="text" 
              placeholder="Search properties, sector..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 pl-8 pr-3 py-2 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <select 
            id="property-type-filter"
            value={typeFilter} 
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-xs"
          >
            <option value="">All Types</option>
            <option value="Apartment">Apartment</option>
            <option value="Villa">Villa / Penthouse</option>
            <option value="Commercial">Commercial Project</option>
            <option value="Land Plot">Independent land Plots</option>
          </select>

          <select 
            id="property-location-filter"
            value={locationFilter} 
            onChange={e => setLocationFilter(e.target.value)}
            className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-xs"
          >
            <option value="">All Locations</option>
            <option value="Golf Course">Golf Course Road</option>
            <option value="Dwarka">Dwarka Expressway</option>
            <option value="Sohna">Sohna Road</option>
            <option value="DLF">DLF City</option>
          </select>
        </div>

        {/* Grid display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="property-grid-cards">
          {filteredProperties.map(prop => (
            <div 
              key={prop.id}
              onClick={() => setSelectedPropertyId(prop.id)}
              className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden hover:border-indigo-200 hover:shadow-md cursor-pointer transition flex flex-col"
            >
              <div className="relative h-44 overflow-hidden">
                <img 
                  src={prop.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c'} 
                  alt={prop.title} 
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-slate-900/80 text-white font-extrabold text-[9px] uppercase tracking-wider px-2 py-1 rounded">
                  {prop.propertyType}
                </span>
                <span className="absolute bottom-3 right-3 bg-emerald-500/90 text-slate-900 font-extrabold text-xs px-2.5 py-1 rounded">
                  INR {(prop.price / 10000000).toFixed(2)} Cr
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 leading-snug">{prop.title}</h3>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin size={11} className="text-slate-400" /> {prop.location}
                  </p>
                </div>

                <div className="flex justify-between items-center border-t border-slate-50 pt-3 text-[10px] text-slate-500 font-medium">
                  <span>Bedrooms: {prop.bedrooms || 'Plot'}</span>
                  <span>Size: {prop.size}</span>
                </div>
              </div>
            </div>
          ))}

          {filteredProperties.length === 0 && (
            <div className="col-span-2 text-center py-20 text-slate-400 text-xs italic">
              No matching residential or commercial properties indexed.
            </div>
          )}
        </div>
      </div>

      {/* Right Property Details & One-Click Sharing ledger */}
      <div className={`lg:col-span-4 bg-white border border-slate-100 rounded-2xl h-[calc(100vh-140px)] flex flex-col overflow-y-auto ${selectedPropertyId ? 'block' : 'hidden lg:flex justify-center items-center text-slate-350'}`}>
        {activeProperty ? (
          <div className="p-5 space-y-6 flex-1 flex flex-col" id="property-details-view">
            {/* Toggle header info */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                  Specs Dashboard
                </span>
                <h3 className="text-sm font-extrabold text-slate-800 mt-2">{activeProperty.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedPropertyId(null)}
                className="bg-slate-50 text-slate-400 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-medium text-slate-600">
              {/* Image stack */}
              <img 
                src={activeProperty.images[0]} 
                alt="Estate Preview" 
                className="w-full h-36 object-cover rounded-xl"
              />

              {/* Specs Bento block */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-normal">Pricing</span>
                  <span className="text-xs font-extrabold text-slate-800 block mt-0.5">INR {(activeProperty.price / 10000000).toFixed(2)} Cr</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-normal">Size Scale</span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">{activeProperty.size}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-normal">Furnishing</span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">{activeProperty.furnishingStatus}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-normal">Project Floor</span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">Lvl {activeProperty.floor || 'G'}</span>
                </div>
              </div>

              {/* Overview body */}
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-700 text-[10px] uppercase">Property Overview</h4>
                <p className="text-slate-500 font-light leading-relaxed">{activeProperty.description}</p>
              </div>

              {/* Amenities list */}
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-700 text-[10px] uppercase">Highlights</h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {activeProperty.amenities.map((item, index) => (
                    <span 
                      key={index}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md text-[10px] font-semibold"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Developer info */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1.5">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-extrabold">Listing Owner Contact</span>
                <p className="text-xs font-bold text-slate-800">{activeProperty.ownerInfo.name}</p>
                <p className="text-[10px] text-slate-500 flex items-center gap-1">📞 {activeProperty.ownerInfo.phone} ({activeProperty.ownerInfo.role})</p>
              </div>
            </div>

            {/* ONE-CLICK SHARING DIALOG ENCRYPTED IN DETAILS */}
            <div className="border-t border-slate-100 pt-4 mt-auto space-y-3">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-600 block">
                One-Click Client Dispatch Ledger
              </span>

              <div className="space-y-2">
                <select 
                  id="share-target-lead-select"
                  value={sharingLeadId}
                  onChange={e => setSharingLeadId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                >
                  <option value="">-- Choose target lead client --</option>
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>{lead.fullName} ({lead.preferredLocation})</option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <select 
                    id="share-channel-select"
                    value={sharingChannel}
                    onChange={e => setSharingChannel(e.target.value as any)}
                    className="border border-slate-200 rounded-lg p-2 text-xs flex-1"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="SMS">SMS Message</option>
                    <option value="Email">HTML Email Panel</option>
                  </select>

                  <button 
                    id="dispatch-share-btn"
                    onClick={handleDispatchShare}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400 space-y-2">
            <Home size={36} />
            <span className="text-xs">Select listed home properties</span>
          </div>
        )}
      </div>

      {/* CATALOG ADD PROPERTY MODAL */}
      {showAddProperty && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto" id="add-property-modal" style={{ scrollbarWidth: 'thin' }}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Catalog New Residential Listing</h3>
              <button onClick={() => setShowAddProperty(false)} className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-50 rounded-lg">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProperty} className="grid grid-cols-2 gap-3.5 text-xs">
              <div className="col-span-2 space-y-1">
                <label className="font-bold text-slate-600">Property Project Title</label>
                <input 
                  id="add-prop-title"
                  type="text" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. DLF The Aralias Penthouse"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Sector / Location</label>
                <select 
                  id="add-prop-location"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Sector 54, Golf Course Road">Golf Course Road</option>
                  <option value="Sector 111, Dwarka Expressway">Dwarka Expressway</option>
                  <option value="Sohna Road, Gurgaon">Sohna Road</option>
                  <option value="DLF Phase 3, Gurgaon">DLF Phase 3</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Property Type</label>
                <select 
                  id="add-prop-type"
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Apartment">Apartment</option>
                  <option value="Villa">Villa</option>
                  <option value="Commercial">Commercial Project</option>
                  <option value="Land Plot">Independent land Plots</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Pricing in INR (Total)</label>
                <input 
                  id="add-prop-price"
                  type="number" 
                  value={newPrice}
                  onChange={e => setNewPrice(e.target.value)}
                  placeholder="e.g. 52000000 (meaning 5.2 Cr)"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Format Scale / Size</label>
                <input 
                  id="add-prop-size"
                  type="text" 
                  value={newSize}
                  onChange={e => setNewSize(e.target.value)}
                  placeholder="3 BHK 3800 sq-ft"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Bedrooms Count</label>
                <input 
                  id="add-prop-beds"
                  type="number" 
                  value={newBedrooms}
                  onChange={e => setNewBedrooms(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Furnishing Style</label>
                <select 
                  id="add-prop-furnish"
                  value={newFurnishing}
                  onChange={e => setNewFurnishing(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Fully-Furnished">Fully-Furnished</option>
                  <option value="Semi-Furnished">Semi-Furnished</option>
                  <option value="Unfurnished">Bared Unfurnished</option>
                </select>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="font-bold text-slate-600">Draft Listing Marketing copy</label>
                <textarea 
                  id="add-prop-desc"
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Write persuasive property listing descriptions..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* MEDIA PICTURE UPLOADER DUAL SECTION */}
              <div className="col-span-2 space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Property Photo Attachments</label>
                  <div className="flex bg-slate-100 rounded-lg p-0.5 select-none text-[10px] border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setActiveUploadTab('files')}
                      className={`px-3 py-1 rounded-md transition font-black cursor-pointer ${activeUploadTab === 'files' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Browse Files
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveUploadTab('gallery')}
                      className={`px-3 py-1 rounded-md transition font-black cursor-pointer ${activeUploadTab === 'gallery' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Select From Gallery
                    </button>
                  </div>
                </div>

                {/* Upload from local system path */}
                {activeUploadTab === 'files' && (
                  <div className="space-y-2">
                    <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/60 rounded-2xl p-4 text-center cursor-pointer transition relative group">
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        onChange={handleLocalFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Upload from files"
                      />
                      <div className="flex flex-col items-center justify-center space-y-1.5 text-slate-500">
                        <UploadCloud className="text-slate-400 group-hover:text-indigo-500 transition duration-150 animate-bounce" size={20} style={{ animationDuration: '3s' }} />
                        <div>
                          <p className="font-bold text-slate-700 text-[11px]">Click to upload pictures from devices or files</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Acceptable formats: JPEG, PNG, WEBP (Auto-compressed)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Select from pre-populated gallery stock */}
                {activeUploadTab === 'gallery' && (
                  <div className="space-y-1.5 bg-slate-50/60 p-2.5 rounded-2xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 block font-semibold">Available Exclusive Gallery Assets (<span className="text-indigo-600">Select multiple</span>):</span>
                    <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                      {REAL_ESTATE_STOCK_GALLERY.map((g) => {
                        const isSelected = propertyImages.includes(g.url);
                        return (
                          <div 
                            key={g.id}
                            onClick={() => handleToggleStockGalleryImage(g.url)}
                            className={`relative h-16 rounded-xl overflow-hidden cursor-pointer transition duration-150 border-2 ${isSelected ? 'border-indigo-600 scale-[0.98] ring-2 ring-indigo-500/25' : 'border-slate-200 opacity-80 hover:opacity-100 hover:scale-[1.02]'}`}
                          >
                            <img src={g.url} alt={g.tag} className="w-full h-full object-cover" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-1">
                              <span className="text-[8px] font-bold text-white block text-center truncate">{g.tag}</span>
                            </div>
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-indigo-600 text-white rounded-full p-0.5">
                                <Check size={8} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected/Uploaded image previews */}
                {propertyImages.length > 0 && (
                  <div className="space-y-1.5 bg-indigo-50/30 border border-indigo-100/50 p-2.5 rounded-2xl">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-600 font-extrabold flex items-center gap-1">
                        <ImageIcon size={11} className="text-indigo-600" /> Cataloged Media Assets ({propertyImages.length})
                      </span>
                      <button 
                        type="button"
                        onClick={() => setPropertyImages([])}
                        className="text-[9px] text-red-500 font-bold hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                      {propertyImages.map((img, i) => (
                        <div key={i} className="relative h-12 w-12 rounded-xl overflow-hidden border border-slate-200 group flex-shrink-0 bg-white shadow-xs">
                          <img src={img} alt="Catalog preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveUploadedImage(i)}
                            className="absolute inset-0 bg-rose-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-150 cursor-pointer"
                            title="Remove picture"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button 
                id="submit-property-btn"
                type="submit"
                className="col-span-2 mt-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black py-3 rounded-xl transition duration-150 shadow-md cursor-pointer flex items-center justify-center gap-1"
              >
                Confirm Property Addition
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
