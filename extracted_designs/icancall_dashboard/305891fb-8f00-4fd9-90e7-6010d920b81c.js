/* iCanCall Dashboard — Contacts manager view */

function ContactModal({ initial, order, onSave, onClose }) {
  const editing = !!initial;
  const [name, setName] = React.useState(initial?.name || '');
  const [rel, setRel] = React.useState(initial?.rel || '');
  const [phone, setPhone] = React.useState(initial?.phone || '');
  const [color, setColor] = React.useState(initial?.color || AVATAR_COLORS[(order || 0) % AVATAR_COLORS.length]);

  const save = () => {
    if (!name.trim()) return;
    onSave({
      id: initial?.id || 'c' + Date.now(),
      name: name.trim(), rel: rel.trim(), phone: phone.trim(),
      color, available: initial?.available ?? true,
    });
  };

  return (
    <Modal
      title={editing ? 'Edit contact' : 'Add a contact'}
      onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save}>{editing ? 'Save changes' : 'Add contact'}</button>
      </>}
    >
      <div className="field">
        <label>Full name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Maria Delgado" autoFocus maxLength={28} />
      </div>
      <div className="field">
        <div className="row2">
          <div>
            <label>Relationship</label>
            <input value={rel} onChange={(e) => setRel(e.target.value)} placeholder="Daughter" maxLength={28} />
          </div>
          <div>
            <label>Phone to ring</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(415) 555-0100" maxLength={20} />
          </div>
        </div>
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>Avatar color</label>
        <div className="swatch-row">
          {AVATAR_COLORS.map((c) => (
            <span key={c} className={`swatch ${c === color ? 'sel' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
          ))}
        </div>
      </div>
    </Modal>
  );
}

function ContactsView({ line, setLine, showToast }) {
  const [modal, setModal] = React.useState(null); // {edit?:contact}
  const contacts = line.contacts;
  const full = contacts.length >= 6;

  const move = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= contacts.length) return;
    setLine((l) => {
      const arr = [...l.contacts];
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...l, contacts: arr };
    });
  };
  const remove = (id) => {
    setLine((l) => ({ ...l, contacts: l.contacts.filter((c) => c.id !== id) }));
    showToast('Contact removed');
  };
  const toggleAvail = (id) => setLine((l) => ({
    ...l, contacts: l.contacts.map((c) => c.id === id ? { ...c, available: !c.available } : c),
  }));
  const save = (contact) => {
    setLine((l) => {
      const exists = l.contacts.some((c) => c.id === contact.id);
      return { ...l, contacts: exists ? l.contacts.map((c) => c.id === contact.id ? contact : c) : [...l.contacts, contact] };
    });
    showToast(modal?.edit ? 'Contact updated' : 'Contact added');
    setModal(null);
  };

  return (
    <div className="content-inner">
      <div className="contacts-head">
        <div>
          <p className="hint">
            These are the people <b>{line.person.split(' · ')[0]}</b> can reach on {line.number}.
            {line.mode === 'menu' ? ' Callers pick from a menu in the order below.' : ' iCanCall rings them top to bottom until someone answers.'}
          </p>
        </div>
        <span className="cap-pill">{contacts.length} / 6 contacts</span>
      </div>

      <div className="clist">
        {contacts.map((c, i) => (
          <div className={`crow ${c.available ? '' : 'dim'}`} key={c.id}>
            <div className="reorder">
              <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><Icon name="up" /></button>
              <button onClick={() => move(i, 1)} disabled={i === contacts.length - 1} aria-label="Move down"><Icon name="down" /></button>
            </div>
            <div className="pos"><span className="num">{i + 1}</span></div>
            <Avatar name={c.name} color={c.color} />
            <div className="info">
              <b>{c.name}</b>
              <div className="rel">{c.rel || 'Contact'}</div>
              <div className="tel">{c.phone || 'No number set'}</div>
            </div>
            <div className="acts">
              <Toggle on={c.available} onChange={() => toggleAvail(c.id)} />
              <button className="mini" onClick={() => setModal({ edit: c })} aria-label="Edit"><Icon name="edit" /></button>
              <button className="mini del" onClick={() => remove(c.id)} aria-label="Remove"><Icon name="trash" /></button>
            </div>
          </div>
        ))}

        <div className={`add-slot ${full ? 'full' : ''}`} onClick={() => !full && setModal({})}>
          {full ? <>You've reached the 6-contact limit on this plan</> : <><Icon name="plus" /> Add a contact</>}
        </div>
      </div>

      {modal && (
        <ContactModal
          initial={modal.edit}
          order={contacts.length}
          onSave={save}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

Object.assign(window, { ContactsView, ContactModal });
