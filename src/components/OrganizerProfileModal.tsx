import React, { useState } from 'react';
import { OrganizerProfile } from '../types/ticket';
import {
  Building2,
  X,
  ShieldCheck,
  Globe,
  Instagram,
  Mail,
  Phone,
  Camera,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface OrganizerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizer: OrganizerProfile;
  onSaveOrganizer: (updated: OrganizerProfile) => void;
}

export const OrganizerProfileModal: React.FC<OrganizerProfileModalProps> = ({
  isOpen,
  onClose,
  organizer,
  onSaveOrganizer,
}) => {
  const [name, setName] = useState(organizer.name);
  const [tagline, setTagline] = useState(organizer.tagline);
  const [bio, setBio] = useState(organizer.bio);
  const [avatar, setAvatar] = useState(organizer.avatar);
  const [coverImage, setCoverImage] = useState(organizer.coverImage);
  const [email, setEmail] = useState(organizer.email);
  const [phone, setPhone] = useState(organizer.phone);
  const [website, setWebsite] = useState(organizer.website);
  const [instagram, setInstagram] = useState(organizer.instagram);
  const [verified, setVerified] = useState(organizer.verified);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: OrganizerProfile = {
      ...organizer,
      name: name.trim() || 'Bush Brothers Producciones',
      tagline: tagline.trim(),
      bio: bio.trim(),
      avatar: avatar.trim() || organizer.avatar,
      coverImage: coverImage.trim() || organizer.coverImage,
      email: email.trim(),
      phone: phone.trim(),
      website: website.trim(),
      instagram: instagram.trim(),
      verified,
    };

    onSaveOrganizer(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="glass rounded-3xl p-5 sm:p-6 max-w-lg w-full border border-white/20 shadow-2xl space-y-4 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-bold shadow-lg shadow-amber-400/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>Editar Perfil de Creador / Productora</span>
              </h3>
              <p className="text-[11px] text-amber-300 font-mono">
                {name || 'Bush Brothers Producciones'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Saved Success Toast */}
        {savedSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-bold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>¡Perfil actualizado con éxito en todo el sistema!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Cover preview banner */}
          <div className="relative h-28 rounded-2xl overflow-hidden border border-white/15 bg-black">
            <img
              src={coverImage}
              alt="Banner de la Productora"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute bottom-2 left-3 flex items-center gap-2.5">
              <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-amber-400 shadow-xl bg-black">
                <img src={avatar} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div className="text-white text-xs font-bold drop-shadow">
                {name}
                {verified && <ShieldCheck className="w-3.5 h-3.5 text-amber-400 inline ml-1" />}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-white/70 block mb-1 font-medium">
              Nombre Oficial de la Productora / Creador:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bush Brothers Producciones"
              className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-[11px] text-white/70 block mb-1 font-medium">
              Slogan / Frase Descriptiva:
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Productora Oficial de Eventos Masivos, Festivales & Experiencias VIP"
              className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-[11px] text-white/70 block mb-1 font-medium">
              Biografía / Reseña de la Empresa:
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/70 block mb-1 font-medium">
                URL Logo / Avatar:
              </label>
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/70 block mb-1 font-medium">
                URL Banner / Portada:
              </label>
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://..."
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/70 block mb-1 font-medium flex items-center gap-1">
                <Mail className="w-3 h-3 text-amber-300" />
                <span>Correo Oficial:</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@bushbrothers.mx"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/70 block mb-1 font-medium flex items-center gap-1">
                <Phone className="w-3 h-3 text-amber-300" />
                <span>Teléfono Oficial:</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+52 55 5200 8800"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/70 block mb-1 font-medium flex items-center gap-1">
                <Globe className="w-3 h-3 text-cyan-400" />
                <span>Sitio Web Oficial:</span>
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://bushbrothers.mx"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/70 block mb-1 font-medium flex items-center gap-1">
                <Instagram className="w-3 h-3 text-rose-400" />
                <span>Instagram:</span>
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@bushbrothersproducciones"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="verifiedCheck"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="w-4 h-4 rounded accent-amber-400"
            />
            <label htmlFor="verifiedCheck" className="text-xs text-white/80 cursor-pointer font-medium">
              Insignia de Productora Verificada PRO ★
            </label>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs shadow-lg shadow-amber-400/20"
            >
              Guardar Perfil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
