const fs = require('fs');
let code = fs.readFileSync('components/business/organization-manager.tsx', 'utf8');

const insertPoint = '        {msg && (';

const generalInfoSection = \
      {/* Genel Bilgiler */}
      <details className="premium-accordion" open>
        <summary className="premium-accordion-summary">
          <div className="premium-accordion-header">
            <div className="premium-accordion-icon" style={{ background: '#f3f4f6', color: '#4b5563' }}>
              <Info size={24} weight="duotone" />
            </div>
            <div>
              <h3 className="premium-accordion-title">Genel Bilgiler</h3>
              <p className="premium-accordion-desc">Kurum profilinizi ve ileti\u015fim bilgilerinizi d\u00fczenleyin.</p>
            </div>
          </div>
          <CaretDown size={20} className="premium-chevron" />
        </summary>
        <div className="premium-accordion-content">
          <form 
            className="responsive-form-grid" 
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const payload = {
                name: f.get('name'),
                description: f.get('description'),
                phone: f.get('phone'),
                website: f.get('website'),
                city: f.get('city'),
                district: f.get('district'),
                address: f.get('address')
              };
              const r = await fetch('/api/organizations/' + org.id, {
                method: 'PATCH',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(payload)
              });
              if (r.ok) setMsg('Genel bilgiler g\u00fcncellendi');
              else setMsg('Bilgiler g\u00fcncellenemedi');
            }}
          >
            <div className="responsive-form-field">
              <label>Kurum Ad\u0131</label>
              <input name="name" defaultValue={org.name} required />
            </div>
            <div className="responsive-form-field">
              <label>Telefon</label>
              <input name="phone" defaultValue={org.phone || ''} type="tel" />
            </div>
            <div className="responsive-form-field">
              <label>Web Sitesi</label>
              <input name="website" defaultValue={org.website || ''} type="url" />
            </div>
            <div className="responsive-form-field">
              <label>Ýl</label>
              <input name="city" defaultValue={org.city || ''} required />
            </div>
            <div className="responsive-form-field">
              <label>Ýl\u00e7e</label>
              <input name="district" defaultValue={org.district || ''} />
            </div>
            <div className="responsive-form-field" style={{ gridColumn: '1 / -1' }}>
              <label>A\u00e7\u0131k Adres</label>
              <input name="address" defaultValue={org.address || ''} required />
            </div>
            <div className="responsive-form-field" style={{ gridColumn: '1 / -1' }}>
              <label>Hakk\u0131nda (A\u00e7\u0131klama)</label>
              <textarea name="description" defaultValue={org.description || ''} rows={4} placeholder="Kurumunuzu tan\u0131t\u0131n..." />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="primary" type="submit">Bilgileri G\u00fcncelle</button>
            </div>
          </form>
        </div>
      </details>

\;

code = code.replace(insertPoint, generalInfoSection + insertPoint);
fs.writeFileSync('components/business/organization-manager.tsx', code);
