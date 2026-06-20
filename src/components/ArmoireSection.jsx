import { useState } from 'react';
import { loadArmoire, addMed, removeMed, updateMed, toggleReminder, isExpiringSoon, isExpired } from '../lib/storage.js';
import { Star, Trash, Plus, Alert, Box } from '../lib/icons.jsx';
import FicheMedicale from './FicheMedicale.jsx';

const CATEGORIES = [
  { id: 'douleur', label: 'Douleur', icon: '💊' },
  { id: 'fievre', label: 'Fièvre', icon: '🌡️' },
  { id: 'digestion', label: 'Digestion', icon: '🤢' },
  { id: 'allergie', label: 'Allergie', icon: '🤧' },
  { id: 'ordonnance', label: 'Ordonnance', icon: '📋' },
  { id: 'autre', label: 'Autre', icon: '📦' },
];

const SLOTS = [['matin', 'Matin'], ['midi', 'Midi'], ['soir', 'Soir']];

export default function ArmoireSection() {
  const [tab, setTab] = useState('medicaments'); // 'medicaments' | 'fiche'
  const [items, setItems] = useState(loadArmoire());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'autre',
    quantity: 1,
    expirationDate: '',
    notes: '',
  });

  function resetForm() {
    setFormData({
      name: '',
      category: 'autre',
      quantity: 1,
      expirationDate: '',
      notes: '',
    });
    setEditingId(null);
  }

  function handleAddOrUpdate() {
    if (!formData.name.trim()) return;
    
    if (editingId) {
      const updated = updateMed(editingId, {
        name: formData.name,
        category: formData.category,
        quantity: parseInt(formData.quantity, 10) || 1,
        expirationDate: formData.expirationDate,
        notes: formData.notes,
      });
      setItems(updated);
    } else {
      const newItems = addMed({
        name: formData.name,
        category: formData.category,
        quantity: parseInt(formData.quantity, 10) || 1,
        expirationDate: formData.expirationDate,
        notes: formData.notes,
      });
      setItems(newItems);
    }
    resetForm();
    setShowForm(false);
  }

  function handleEdit(item) {
    setFormData({
      name: item.name,
      category: item.category || 'autre',
      quantity: item.quantity || 1,
      expirationDate: item.expirationDate || '',
      notes: item.notes || '',
    });
    setEditingId(item.id);
    setShowForm(true);
  }

  function handleDelete(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce médicament ?')) {
      setItems(removeMed(id));
    }
  }

  const expired = items.filter((m) => isExpired(m.expirationDate));
  const expiringSoon = items.filter((m) => isExpiringSoon(m.expirationDate) && !isExpired(m.expirationDate));

  return (
    <section>
      <h1 className="title">Armoire à pharmacie</h1>
      <p className="sub">Vos médicaments enregistrés et rappels santé.</p>

      <div className="premium">
        <Star size={18} stroke="#085041" />
        <p><b>Fonctionnalité Premium</b> — gratuite pendant le lancement.</p>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'var(--surface)', borderRadius: 12, padding: 4 }}>
        <button
          onClick={() => setTab('medicaments')}
          style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: tab === 'medicaments' ? '#fff' : 'transparent',
            color: tab === 'medicaments' ? 'var(--teal-ink)' : 'var(--muted)',
            boxShadow: tab === 'medicaments' ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
            transition: 'all 0.2s' }}
        >
          💊 Médicaments
        </button>
        <button
          onClick={() => setTab('fiche')}
          style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: tab === 'fiche' ? '#fff' : 'transparent',
            color: tab === 'fiche' ? '#C0392B' : 'var(--muted)',
            boxShadow: tab === 'fiche' ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
            transition: 'all 0.2s' }}
        >
          🏥 Fiche médicale
        </button>
      </div>

      {tab === 'fiche' && <FicheMedicale />}
      {tab === 'medicaments' && (<>

      {expired.length > 0 && (
        <div className="card alert-expired">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Alert size={20} stroke="#E24B4A" />
            <div>
              <p className="alert-title">⚠️ Médicaments périmés</p>
              <p className="alert-text">{expired.length} médicament(s) à retirer.</p>
            </div>
          </div>
        </div>
      )}

      {expiringSoon.length > 0 && (
        <div className="card alert-warning">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Alert size={20} stroke="#EF9F27" />
            <div>
              <p className="alert-title">⏰ Expiration bientôt</p>
              <p className="alert-text">{expiringSoon.length} médicament(s) expirant dans 30 jours.</p>
            </div>
          </div>
        </div>
      )}

      {!showForm && (
        <button className="add-med-btn" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={18} /> Ajouter un médicament
        </button>
      )}

      {showForm && (
        <div className="card form-card">
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
            {editingId ? 'Modifier' : 'Ajouter'} un médicament
          </h3>

          <div className="form-group">
            <label>Nom du médicament *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Doliprane, Aspégic..."
            />
          </div>

          <div className="form-group">
            <label>Catégorie</label>
            <div className="category-grid">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`category-btn ${formData.category === cat.id ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, category: cat.id })}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quantité</label>
              <input
                type="number"
                min="1"
                max="999"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Date d'expiration</label>
              <input
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notes (optionnel)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ex: À prendre avec de la nourriture..."
              rows="2"
            />
          </div>

          <div className="form-buttons">
            <button className="btn-cancel" onClick={() => { resetForm(); setShowForm(false); }}>Annuler</button>
            <button className="btn-save" onClick={handleAddOrUpdate}>
              {editingId ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {items.length === 0 && !showForm ? (
        <div className="card empty">
          <div className="circle"><Box size={32} stroke="#9A9C97" /></div>
          <h2>Votre armoire est vide</h2>
          <p>Commencez par ajouter un médicament pour suivre votre santé.</p>
        </div>
      ) : (
        items.length > 0 && (
          <div className="armoire-list">
            {items.map((it) => (
              <div
                key={it.id}
                className={`armoire-item ${isExpired(it.expirationDate) ? 'expired' : isExpiringSoon(it.expirationDate) ? 'expiring-soon' : ''}`}
              >
                <div className="item-header">
                  <div className="item-title">
                    <div className="med-name">{it.name}</div>
                    <div className="med-meta">
                      <span className="category-badge">{CATEGORIES.find((c) => c.id === it.category)?.icon} {CATEGORIES.find((c) => c.id === it.category)?.label}</span>
                      <span className="quantity-badge">x{it.quantity}</span>
                    </div>
                  </div>
                  <div className="item-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(it)}
                      aria-label="Modifier"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(it.id)}
                      aria-label="Supprimer"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>

                {it.expirationDate && (
                  <div className="expiration-info">
                    <span className={`exp-date ${isExpired(it.expirationDate) ? 'expired-text' : isExpiringSoon(it.expirationDate) ? 'expiring-text' : 'valid-text'}`}>
                      {isExpired(it.expirationDate) ? '❌ Périmé depuis' : isExpiringSoon(it.expirationDate) ? '⚠️ Expire le' : '✓ Expire le'} {new Date(it.expirationDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}

                {it.notes && <div className="med-notes">📝 {it.notes}</div>}

                <div className="reminders-section">
                  <p className="reminders-label">Rappels santé</p>
                  <div className="rem">
                    {SLOTS.map(([key, lbl]) => (
                      <button
                        key={key}
                        className={`rem-btn ${it.reminders[key] ? 'on' : ''}`}
                        onClick={() => setItems(toggleReminder(it.id, key))}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {items.length > 0 && (
        <p className="note">💡 Les rappels de notification s'activeront dans l'application installée.</p>
      )}
      </>)}
    </section>
  );
}
